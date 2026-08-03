<?php
require_once __DIR__ . '/_lib/shop.php';
header('Content-Type: application/json; charset=utf-8');

/*
 * Design
 *   - Single model, no fallback. Active quotas depend on the selected
 *     Google AI Studio project tier; adding a cross-model fallback adds
 *     complexity without solving day-to-day RPD exhaustion.
 *   - Retry once on transient failures only: 5xx, network glitch, or a
 *     429 whose retryDelay is short enough that retry fits the budget.
 *   - Tight wall-clock budget. Observed API latency ranges 2-9s. Budget =
 *     25s ensures the 15s per-call limit is not reduced by PHP startup
 *     overhead (the `remainingBudget()-2` calculation in the retry loop).
 *
 * Multi-tenant: per-request ?shop=<slug> selects the shop's config and
 * API key. Quotas are billed against each shop's own key, so one tenant's
 * RPD exhaustion never affects another. Diagnostic log is shared
 * (../diag.log) but every line carries shopSlug + op="generate" so
 * admin/diag.php and shop-admin/diag.php can filter.
 *
 * 1 user click = 1 Gemini call in the common case, 2 at most (single
 * retry). No request amplification.
 */
const MODEL           = 'gemini-3.5-flash-lite';
const REQUEST_BUDGET  = 25.0;   // seconds, total wall-clock for this endpoint
const CURL_TIMEOUT    = 15;     // seconds, per-call upper bound
const DIAG_LOG_PATH   = __DIR__ . '/../diag.log';
const RL_DIR          = __DIR__ . '/../data/rl';  // rate-limit state files
const RL_RPM          = 8;     // max requests per shop per 60 s (well under Gemini free-tier RPM)
const RL_WINDOW       = 60;    // seconds

$START_TIME = microtime(true);
set_time_limit(30);

function elapsed() {
  global $START_TIME;
  return microtime(true) - $START_TIME;
}
function remainingBudget() {
  return REQUEST_BUDGET - elapsed();
}

function jsonError($httpCode, $payload) {
  http_response_code($httpCode);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

/*
 * Append one diagnostic line to diag.log (protected by .htaccess) and the
 * PHP error log. Logs never contain user-submitted text or generated review
 * bodies — metadata only (model, elapsed, length).
 *
 * Rotation: once the file passes ~2MB, keep only the most recent 10,000
 * lines. Check runs at most once per request via the static guard.
 */
function diag($msg, $context = []) {
  global $SHOP_SLUG;
  $base = ['op' => 'generate'];
  if (!empty($SHOP_SLUG)) $base['shopSlug'] = $SHOP_SLUG;
  $context = array_merge($base, $context);
  $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg
        . ' ' . json_encode($context, JSON_UNESCAPED_UNICODE);
  @file_put_contents(DIAG_LOG_PATH, $line . "\n", FILE_APPEND | LOCK_EX);
  error_log('[review-app] ' . $line);

  static $rotated = false;
  if (!$rotated) {
    $rotated = true;
    if (@filesize(DIAG_LOG_PATH) > 2 * 1024 * 1024) {
      $lines = @file(DIAG_LOG_PATH);
      if ($lines && count($lines) > 10000) {
        @file_put_contents(
          DIAG_LOG_PATH,
          implode('', array_slice($lines, -10000)),
          LOCK_EX
        );
      }
    }
  }
}

/*
 * Per-shop rate limiter backed by a small JSON file.
 * Returns 0 if the request is allowed, or seconds-to-wait if denied.
 * Fails open (returns 0) if the lock file cannot be created, so a
 * misconfigured data directory never hard-blocks all users.
 */
function consumeRateLimit(string $slug): int {
  if (!is_dir(RL_DIR)) @mkdir(RL_DIR, 0755, true);
  $file = RL_DIR . '/' . $slug . '.json';
  $fp   = @fopen($file, 'c+');
  if (!$fp) return 0;

  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $ts  = ($raw !== false && $raw !== '') ? (json_decode($raw, true) ?? []) : [];
  $now    = microtime(true);
  $cutoff = $now - RL_WINDOW;
  $ts     = array_values(array_filter($ts, fn($t) => $t >= $cutoff));

  $wait = 0;
  if (count($ts) >= RL_RPM) {
    sort($ts);
    $wait = max(1, (int) ceil($ts[0] + RL_WINDOW - $now));
  } else {
    $ts[] = $now;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($ts));
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  return $wait;
}

/* Extract Gemini-reported retryDelay (seconds) from an error body. */
function extractRetryDelaySec($responseText) {
  $data = json_decode($responseText, true);
  if (isset($data['error']['details']) && is_array($data['error']['details'])) {
    foreach ($data['error']['details'] as $d) {
      if (isset($d['retryDelay'])) {
        return (float)rtrim($d['retryDelay'], 's');
      }
    }
  }
  if (isset($data['error']['message']) && preg_match('/retry in ([\d.]+)s/i', $data['error']['message'], $m)) {
    return (float)$m[1];
  }
  return 0;
}

/* Extract quotaId(s) from a 429 body so we can see which limit hit. */
function extractQuotaIds($responseText) {
  $data = json_decode($responseText, true);
  $ids = [];
  if (isset($data['error']['details']) && is_array($data['error']['details'])) {
    foreach ($data['error']['details'] as $d) {
      if (isset($d['violations']) && is_array($d['violations'])) {
        foreach ($d['violations'] as $v) {
          if (isset($v['quotaId']))     $ids[] = $v['quotaId'];
          if (isset($v['quotaMetric'])) $ids[] = $v['quotaMetric'];
        }
      }
    }
  }
  return array_values(array_unique($ids));
}

/* ---------- 店舗設定の読み込み ---------- */
$SHOP_SLUG = trim((string)($_GET['shop'] ?? ''));
if (!shop_validate_slug($SHOP_SLUG)) {
  jsonError(400, ['error' => 'shop パラメータが指定されていません']);
}
$shop = shop_load($SHOP_SLUG);
if ($shop === null) {
  jsonError(404, ['error' => '指定された店舗が見つかりません']);
}
$apiKey = $shop['geminiApiKey'] ?? '';
if (!$apiKey) {
  jsonError(500, ['error' => 'この店舗の Gemini APIキーが未設定です。店舗管理画面から設定してください。']);
}

/* ---------- アプリ側レートリミット ---------- */
$rlWait = consumeRateLimit($SHOP_SLUG);
if ($rlWait > 0) {
  diag('app rate limited', ['wait' => $rlWait]);
  jsonError(429, [
    'error'      => 'リクエストが集中しています。' . $rlWait . '秒後に再度お試しください。',
    'rateLimit'  => true,
    'retryAfter' => $rlWait,
  ]);
}

/* ---------- 入力取得 ---------- */
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$area            = trim($input['area']     ?? '');
$purpose         = trim($input['purpose']  ?? '');
$freeText        = trim($input['freeText'] ?? '');
$positiveAspects = $input['positiveAspects'] ?? [];

$aspectLabels = [
  'overall' => 'サービス全体',
  'price'   => '価格',
  'vehicle' => '貸出車両',
  'staff'   => 'スタッフの応対'
];
$positives = array_map(fn($a) => $aspectLabels[$a] ?? $a, $positiveAspects);
$positiveStr = $positives ? implode('、', $positives) : '（特になし）';

/* ---------- 文字数バケツを均等に抽選 ---------- */
$buckets = [[40, 80], [80, 120], [120, 200]];
$bucket = $buckets[array_rand($buckets)];
list($lenMin, $lenMax) = $bucket;
$isLong = ($lenMin === 120);

/* ---------- スタイルのランダム化 ---------- */
// Emoji rules are phrased as positive examples only. Including NG examples
// caused the model to mimic the "emoji followed by 句点" anti-pattern.
// Post-processing also scrubs any emoji+。 that slips through.
$emojiOptions = [
  '絵文字を1〜2箇所、本文の中に自然に入れてください。絵文字は「句点の代わり」として文末に置くか、単語と単語の間に挟むように使ってください。絵文字の直前・直後には、句点「。」を付けないでください。例：「良かったです😊 また来たい」「空港送迎🚗付きで便利でした」',
  '絵文字は使用しないでください',
  '絵文字は使用しないでください',
  '絵文字を1個だけ、一番最後の文末に置いてください。その絵文字で文を締めるので、末尾に句点「。」は付けないでください。例：「ありがとうございました😊」「また利用したいです👍」',
];
$exclamationOptions = [
  '感嘆符（！）を1〜2回、自然な箇所で使用してください',
  '感嘆符は使用せず、句点（。）で落ち着いて締めてください',
  '感嘆符を使っても使わなくてもかまいません',
];
$toneOptions = [
  '丁寧な敬語で書いてください',
  'ややカジュアルな話し言葉で書いてください',
  '友人に話すようなフランクな口調で書いてください',
  '落ち着いた大人っぽい文章で書いてください',
  '明るく親しみやすい口調で書いてください',
];
$styleOptions = [
  '体言止めを混ぜるなどして、リズムに変化を出してください',
  '短い文を重ねるテンポの良い文体にしてください',
  '一文を少し長めにして、ゆったりした印象にしてください',
  '箇条書きは使わず、普通の文章で書いてください',
  '主語を省略した自然な日本語で書いてください',
];

$emojiRule       = $emojiOptions[array_rand($emojiOptions)];
$exclamationRule = $exclamationOptions[array_rand($exclamationOptions)];
$toneRule        = $toneOptions[array_rand($toneOptions)];
$styleRule       = $styleOptions[array_rand($styleOptions)];

$areaRule = ($isLong && $area !== '')
  ? "居住エリア「{$area}」を口コミの中で自然に触れてください（例：「{$area}から利用しました」のような形）"
  : "居住エリアには一切触れないでください";

/* ---------- キーワードの整形 ---------- */
$kwLines = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $shop['keywords'] ?? ''))));
$kwText = $kwLines ? "- " . implode("\n- ", $kwLines) : "（設定なし）";

$shopName  = $shop['shopName']  ?? '';
// Monthly rental car deployment. The 業種 used in the prompt is fixed and
// not editable per shop.
$bizType   = 'マンスリーレンタカー';
$bizDetail = $shop['bizDetail'] ?? '';

/* ---------- プロンプト組み立て ---------- */
$prompt = <<<EOT
あなたは今から、ある店舗を実際に利用した一人の顧客として、Googleマップに投稿する口コミを1件だけ生成します。

# 店舗情報
- 店舗名: {$shopName}
- 業種: {$bizType}
- 店の強み・特徴:
{$bizDetail}

# MEO対策キーワード
以下のキーワードから、今回の文脈で自然に入れられそうなものがあれば **最大1つだけ** 織り込んでください。違和感が出るなら入れなくてOKです。
{$kwText}

# 今回のお客様のアンケート結果
- 居住エリア: {$area}
- 利用のキッカケ・用途: {$purpose}
- 満足度が高かった項目: {$positiveStr}
- お客様が感じた決め手・良かったと思った点（自由記入）: {$freeText}

# 生成ルール（厳守）
1. 本文の文字数は **{$lenMin}文字以上 {$lenMax}文字以下** の範囲内で、**必ず文章を完結させてください**。
   - 文字数制約のために文を途中で切るのは厳禁です。
   - 最後の文まできちんと句点「。」で終わらせてください。
   - 内容量は、この文字数に収まるよう各自調整してください（詰め込みすぎない）。
2. 高評価の項目のみに触れてください。低評価の項目には一切言及しないでください。
3. 利用のキッカケは、業種の文脈で意味を補完して解釈してください。
   例：マンスリーレンタカーで「車検」と書かれていたら「車検中の代車として利用」、「修理」なら「修理期間中の代車として」と解釈します。
   決して「修理で利用しました」のような不自然な直訳はしないでください。
4. {$areaRule}
5. {$emojiRule}
6. {$exclamationRule}
7. {$toneRule}
8. {$styleRule}
9. 「この度は」「先日は」のようなテンプレ的な書き出しは避け、毎回違う人が書いたように見える自然な書き出しで始めてください。
10. 自作自演や機械的な印象を与えないよう、本物の投稿に見えるリアルさを重視してください。

# 出力
口コミの本文のみを出力してください。
「口コミ：」などの見出し、前置き、注釈、引用符、解説は一切不要です。本文だけを返してください。
必ず最後の一文まで完結させ、句点で終わらせてください。
EOT;

$payload = [
  'contents' => [[
    'parts' => [['text' => $prompt]]
  ]],
  'generationConfig' => [
    'maxOutputTokens' => 2048,
    // Gemini 3.5 Flash-Lite uses thinking levels instead of token budgets.
    'thinkingConfig'  => ['thinkingLevel' => 'minimal'],
  ]
];

function callGemini($apiKey, $payload, $timeoutSec) {
  $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
       . rawurlencode(MODEL) . ':generateContent';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
      'Content-Type: application/json',
      'x-goog-api-key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_TIMEOUT        => $timeoutSec,
    CURLOPT_CONNECTTIMEOUT => 4,
  ]);
  $body = curl_exec($ch);
  $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);
  return [$body, $http, $err];
}

/*
 * Call Gemini. Retry once — only for transient failures, and only if the
 * retry fits within the remaining budget.
 *
 *   200       -> done
 *   5xx       -> backoff 1s, retry once
 *   http==0   -> network glitch, backoff 1s, retry once
 *   429 w/ retryDelay ≤ 3s -> wait retryDelay, retry once
 *   429 w/ retryDelay > 3s -> fail fast (user sees 'try again shortly')
 *   4xx other -> fail fast (bad key / bad request — retry won't help)
 */
$diagTrail = [];
$body = false; $http = 0; $curlErr = '';

for ($try = 1; $try <= 2; $try++) {
  $perCall = (int) max(6, min(CURL_TIMEOUT, remainingBudget() - 2));
  if ($perCall < 6) { $diagTrail[] = "try$try-no-budget"; break; }

  list($body, $http, $curlErr) = callGemini($apiKey, $payload, $perCall);
  $diagTrail[] = "try$try=$http";

  if ($http === 200) break;
  if ($try === 2) {
    if ($http === 0) diag('gemini retry timeout', ['curlErr' => $curlErr, 'elapsed' => round(elapsed(), 2)]);
    elseif ($http >= 500) diag('gemini retry server error', ['http' => $http, 'elapsed' => round(elapsed(), 2)]);
    break;
  }

  // 4xx other than 429 — permanent, no retry.
  if ($http >= 400 && $http < 500 && $http !== 429) {
    diag('gemini client error', [
      'http'    => $http,
      'curlErr' => $curlErr,
      'body'    => $body ? mb_substr($body, 0, 500) : null,
    ]);
    break;
  }

  // Decide whether retry fits the budget.
  $delay = 1.0;
  if ($http === 429) {
    $retryAfter = extractRetryDelaySec($body);
    $quotas     = extractQuotaIds($body);
    diag('gemini 429', [
      'try'        => $try,
      'retryDelay' => $retryAfter,
      'quotaIds'   => $quotas,
    ]);
    if ($retryAfter <= 0 || $retryAfter > 3) break; // give up fast
    $delay = $retryAfter;
  } elseif ($http >= 500 && $http < 600) {
    // transient server error, keep $delay at 1s
  } elseif ($http === 0) {
    diag('gemini curl failure', ['curlErr' => $curlErr]);
    // transient network, keep $delay at 1s
  } else {
    break;
  }

  if (remainingBudget() < $delay + 6) break; // no time for retry + call
  usleep((int)($delay * 1000000));
}

/* ---------- 応答ハンドリング ---------- */
if ($http !== 200) {
  if ($http === 429) {
    $retryAfterSec = max(60, (int)extractRetryDelaySec($body));
    jsonError(429, [
      'error'      => 'ただいま AI 側の利用枠が混み合っています。しばらく待ってから再度お試しください。',
      'httpCode'   => 429,
      'rateLimit'  => true,
      'retryAfter' => $retryAfterSec,
      'diag'       => $diagTrail,
    ]);
  }
  jsonError(502, [
    'error'    => 'AI生成に失敗しました',
    'httpCode' => $http,
    'curlError'=> $curlErr,
    'detail'   => $body ? mb_substr($body, 0, 500) : null,
    'diag'     => $diagTrail,
    'elapsed'  => round(elapsed(), 2),
  ]);
}

$data = json_decode($body, true);
$review = trim($data['candidates'][0]['content']['parts'][0]['text'] ?? '');
$review = preg_replace('/^[「『"\'\s]+|[」』"\'\s]+$/u', '', $review);
$finishReason = $data['candidates'][0]['finishReason'] ?? '';

/*
 * Post-process: enforce emoji placement rules that the model sometimes
 * violates. The rule is "emoji replaces 句点 — never adjacent to it".
 *
 * Unicode ranges cover common emoji blocks:
 *   U+1F300-U+1FAFF  : symbols, pictographs, faces, objects (2015+ additions)
 *   U+2600-U+27BF    : miscellaneous symbols, dingbats (☀★✨ etc.)
 *   U+FE0E-U+FE0F    : variation selectors often trailing emoji
 */
$EMOJI_RE = '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0E}-\x{FE0F}]';
// "emoji + 。" anywhere → drop the 。
$review = preg_replace('/(' . $EMOJI_RE . '+)。/u', '$1', $review);
// "。 + emoji" at the very end → drop the 。 (dangling emoji after period)
$review = preg_replace('/。(' . $EMOJI_RE . '+)\s*$/u', '$1', $review);

if ($review === '') {
  diag('empty review', ['finishReason' => $finishReason]);
  jsonError(502, [
    'error'        => '生成結果が空でした',
    'finishReason' => $finishReason,
  ]);
}

diag('success', [
  'elapsed'   => round(elapsed(), 2),
  'bucket'    => "{$lenMin}-{$lenMax}",
  'reviewLen' => mb_strlen($review),
  'finish'    => $finishReason,
  'calls'     => count($diagTrail),
]);

echo json_encode([
  'review'       => $review,
  'lengthBucket' => "{$lenMin}-{$lenMax}",
], JSON_UNESCAPED_UNICODE);

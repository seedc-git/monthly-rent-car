<?php
require_once __DIR__ . '/_lib/shop.php';
header('Content-Type: application/json; charset=utf-8');

/*
 * Reply generator for posted Google reviews.
 *
 * Budget and retry policy mirror api/generate.php exactly:
 *   - Single model (gemini-3.5-flash-lite), no cross-model fallback.
 *   - 1 user click = 1 Gemini call in the common case, 2 at most (1 retry).
 *   - 25s total wall-clock budget, 15s per-call curl timeout, retry only on
 *     5xx / network glitch / 429 with retryDelay <= 3s.
 *   - Shares diag.log with generate.php; every line is tagged op=reply
 *     plus the shopSlug so admin/diag.php and shop-admin/diag.php can filter.
 *
 * Multi-tenant: per-request ?shop=<slug> selects the shop's settings and
 * Gemini API key from shops/<slug>.json. Each tenant's quota is billed
 * against their own key.
 */
const MODEL          = 'gemini-3.5-flash-lite';
const REQUEST_BUDGET = 25.0;
const CURL_TIMEOUT   = 15;
const DIAG_LOG_PATH  = __DIR__ . '/../diag.log';

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
 * Append one diagnostic line. Tagged with op=reply so admin/diag.php can
 * distinguish review vs reply traffic in the shared log. Never contains
 * the posted review text or the generated reply body — metadata only.
 */
function diag($msg, $context = []) {
  global $SHOP_SLUG;
  $base = ['op' => 'reply'];
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

/* ---------- Input ---------- */
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$reviewText = trim($input['reviewText'] ?? '');
$endStyle   = $input['endStyle'] ?? 'period';
$apology    = !empty($input['apology']);

if ($reviewText === '') {
  jsonError(400, ['error' => '口コミ本文を入力してください']);
}
// Hard cap on paste length to keep prompt size bounded.
if (mb_strlen($reviewText) > 2000) {
  jsonError(400, ['error' => '口コミ本文が長すぎます（2000文字以内）']);
}
if (!in_array($endStyle, ['emoji', 'period'], true)) {
  $endStyle = 'period';
}
// Apology mode forces period ending regardless of UI selection. Keeps the
// server authoritative even if a client sends contradictory values.
if ($apology) $endStyle = 'period';

$shopName  = $shop['shopName']  ?? '';
// Monthly rental car deployment. The 業種 used in the prompt is fixed and
// not editable per shop.
$bizType   = 'マンスリーレンタカー';
$bizDetail = $shop['bizDetail'] ?? '';

$kwLines = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $shop['keywords'] ?? ''))));
$kwText  = $kwLines ? "- " . implode("\n- ", $kwLines) : "（設定なし）";

/* ---------- Prompt randomisation (avoid template-y output) ---------- */
$toneOptions = [
  '丁寧な敬語で、落ち着いた大人の口調で書いてください',
  '丁寧さを保ちつつ、やや親しみのある温かい口調で書いてください',
  '誠実で柔らかい敬語で、押し付けがましさのない口調で書いてください',
  '礼儀正しく、かつ率直で飾らない口調で書いてください',
];
$openingOptions = [
  '「この度は」「先日は」といった定型句で始めないでください',
  '「ご投稿ありがとうございます」のようなテンプレで始めないでください',
  'お礼や受け止めの言葉から自然に始めてください（ただし決まり文句は避ける）',
  '投稿された内容の具体的な部分に軽く触れる形で書き出してください',
];
$rhythmOptions = [
  '短めの文を重ねて、読みやすいリズムで書いてください',
  '一文を少し長めにして、落ち着いた印象を出してください',
  '体言止めを1箇所程度混ぜて、単調にならないようにしてください',
  '主語を省略した自然な日本語で、箇条書きは使わないでください',
];

$toneRule    = $toneOptions[array_rand($toneOptions)];
$openingRule = $openingOptions[array_rand($openingOptions)];
$rhythmRule  = $rhythmOptions[array_rand($rhythmOptions)];

/* ---------- End-of-sentence rule ---------- */
if ($endStyle === 'emoji') {
  // Every sentence ends in a unique emoji, no kuten. Spelled out so the
  // model does not silently fall back to its default period-style output.
  $endRule = <<<EOT
文末スタイル（厳守）:
- 返信内の **すべての文の末尾に絵文字を1つずつ** 置いてください。
- 使用する絵文字は **すべて互いに異なる** ものにしてください。同じ絵文字を2回以上使わないでください。
- 句点「。」は一切使用しないでください。文と文の区切りは絵文字のみで行います。
- 絵文字は文の最後にだけ置き、文の途中には置かないでください。
- 使う絵文字は返信の文脈に合う、穏やかで好意的なものを選んでください（例: 😊 🙏 ✨ 🌿 🎉 ☕ 🚗 など）。
EOT;
} else {
  $endRule = <<<EOT
文末スタイル（厳守）:
- 絵文字は一切使用しないでください。
- すべての文を句点「。」で終わらせてください。
- 記号での装飾（！？など）も最小限にとどめ、感情過多にならないようにしてください。
EOT;
}

/* ---------- Prompt body ---------- */
if ($apology) {
  // Apology mode: no MEO keywords, no promotional tone, no emoji. The
  // shop strengths block is still passed so the AI knows what the shop is,
  // but the instruction explicitly forbids using it for promotion.
  $prompt = <<<EOT
あなたは、Googleマップに投稿された口コミに対して、店舗のオーナーとして公式に返信を書きます。今回は **お詫び返信** モードです。

# 店舗情報（返信の文体や前提知識として参考にする。宣伝には使わない）
- 店舗名: {$shopName}
- 業種: {$bizType}
- 店の特徴:
{$bizDetail}

# 投稿された口コミ本文
---
{$reviewText}
---

# お詫び返信の基本姿勢（厳守）
1. まず、不快な思い・ご迷惑をおかけしたことに対して、誠実にお詫びしてください。
2. 口コミに書かれた **具体的なご指摘の内容に触れて** 、真摯に受け止めている姿勢を示してください。
3. 言い訳・正当化・反論は一切しないでください。第三者が読んで感じが悪くならない大人の対応に徹してください。
4. 再発防止・改善に努める旨を、誇張せず控えめに一言添えてください。
5. **宣伝的な表現・キーワード・店舗の強みアピールは一切入れないでください**（例: 「○○なら当店！」のような売り込み、MEO的な地名・サービス名の押し込みは禁止）。
6. 再来を強く促すような営業文言は避け、「またの機会がありましたら」程度の穏やかな言い回しに留めてください。
7. 投稿者への呼びかけ（「〇〇様」「お客様」など宛名的なもの）は入れないでください。自然な書き出しにしてください。

# 文体ルール
- {$toneRule}
- {$openingRule}
- {$rhythmRule}

# 文字数（厳守）
- 100文字以上、200文字以下の範囲で、**必ず文章を完結** させてください。
- 文字数制約のために文を途中で切るのは厳禁です。

{$endRule}

# 出力
返信本文のみを出力してください。見出し・前置き・引用符・解説は一切不要です。
EOT;
} else {
  $prompt = <<<EOT
あなたは、Googleマップに投稿された口コミに対して、店舗のオーナーとして公式に返信を書きます。

# 店舗情報
- 店舗名: {$shopName}
- 業種: {$bizType}
- 店の強み・特徴:
{$bizDetail}

# MEO対策キーワード
以下のキーワードから、返信の文脈で自然に入れられそうなものがあれば **最大1つだけ** 織り込んでください。違和感が出るなら無理に入れなくて結構です。宣伝臭が強くならないよう、返信の一部に自然に溶け込む形で使ってください。
{$kwText}

# 投稿された口コミ本文
---
{$reviewText}
---

# 返信の基本姿勢（厳守）
1. まず、投稿してくれたことに対するお礼を、テンプレ感のない表現で述べてください。
2. 口コミに書かれた **具体的な体験内容に触れて** 共感や喜びを示してください（どこが良かったと感じてもらえたのか、具体に紐づけること）。
3. 投稿者への呼びかけ（「〇〇様」「お客様」など宛名的なもの）は入れないでください。
4. 低評価・ネガティブな指摘が含まれる場合は、言い訳せず誠実に受け止めた上で、改善姿勢を控えめに示してください（過剰に謝罪モードにはしないでください）。
5. 再来を歓迎する旨を、押し付けにならない形で自然に添えてください。
6. 営業色が強くなりすぎないようにしてください。情報の盛り込みすぎも禁止です。

# 文体ルール
- {$toneRule}
- {$openingRule}
- {$rhythmRule}
- テンプレ的な「この度は貴重なご意見をいただき誠にありがとうございます」のような決まり文句に頼らず、毎回違うオーナーが書いたような自然さを重視してください。

# 文字数（厳守）
- 100文字以上、200文字以下の範囲で、**必ず文章を完結** させてください。
- 文字数制約のために文を途中で切るのは厳禁です。

{$endRule}

# 出力
返信本文のみを出力してください。見出し・前置き・引用符・解説は一切不要です。
EOT;
}

$payload = [
  'contents' => [[
    'parts' => [['text' => $prompt]]
  ]],
  'generationConfig' => [
    'maxOutputTokens' => 2048,
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
 * Call + single retry. Same rules as generate.php:
 *   200                         -> done
 *   5xx / curl==0               -> backoff 1s, retry once
 *   429 with retryDelay <= 3s   -> wait retryDelay, retry once
 *   429 with retryDelay > 3s    -> fail fast
 *   other 4xx                   -> fail fast
 */
$diagTrail = [];
$body = false; $http = 0; $curlErr = '';

for ($try = 1; $try <= 2; $try++) {
  $perCall = (int) max(6, min(CURL_TIMEOUT, remainingBudget() - 2));
  if ($perCall < 6) { $diagTrail[] = "try$try-no-budget"; break; }

  list($body, $http, $curlErr) = callGemini($apiKey, $payload, $perCall);
  $diagTrail[] = "try$try=$http";

  if ($http === 200) break;
  if ($try === 2) break;

  if ($http >= 400 && $http < 500 && $http !== 429) {
    diag('gemini client error', [
      'http'    => $http,
      'curlErr' => $curlErr,
      'body'    => $body ? mb_substr($body, 0, 500) : null,
    ]);
    break;
  }

  $delay = 1.0;
  if ($http === 429) {
    $retryAfter = extractRetryDelaySec($body);
    $quotas     = extractQuotaIds($body);
    diag('gemini 429', [
      'try'        => $try,
      'retryDelay' => $retryAfter,
      'quotaIds'   => $quotas,
    ]);
    if ($retryAfter <= 0 || $retryAfter > 3) break;
    $delay = $retryAfter;
  } elseif ($http >= 500 && $http < 600) {
    // transient
  } elseif ($http === 0) {
    diag('gemini curl failure', ['curlErr' => $curlErr]);
  } else {
    break;
  }

  if (remainingBudget() < $delay + 6) break;
  usleep((int)($delay * 1000000));
}

/* ---------- Response handling ---------- */
if ($http !== 200) {
  if ($http === 429) {
    jsonError(429, [
      'error'     => 'ただいま AI 側の利用枠が混み合っています。1分ほど時間をおいて再度お試しください。',
      'httpCode'  => 429,
      'rateLimit' => true,
      'diag'      => $diagTrail,
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
$reply = trim($data['candidates'][0]['content']['parts'][0]['text'] ?? '');
$reply = preg_replace('/^[「『"\'\s]+|[」』"\'\s]+$/u', '', $reply);
$finishReason = $data['candidates'][0]['finishReason'] ?? '';

if ($reply === '') {
  diag('empty reply', ['finishReason' => $finishReason]);
  jsonError(502, [
    'error'        => '生成結果が空でした',
    'finishReason' => $finishReason,
  ]);
}

diag('success', [
  'elapsed'  => round(elapsed(), 2),
  'endStyle' => $endStyle,
  'apology'  => $apology ? 1 : 0,
  'inputLen' => mb_strlen($reviewText),
  'replyLen' => mb_strlen($reply),
  'finish'   => $finishReason,
  'calls'    => count($diagTrail),
]);

echo json_encode([
  'reply'    => $reply,
  'endStyle' => $endStyle,
  'apology'  => $apology,
], JSON_UNESCAPED_UNICODE);

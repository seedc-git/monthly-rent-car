# 立川市レンタカーランキング テスト結果

- 対象URL: https://stg.monthly-rent-car.jp/area/tachikawa/
- 実装コミット: `87ab79f1aab78589eb1e67f5a8ee7567c564cb04`
- モバイルH1修正コミット: `6fa5a6b680cca7dd2eeac843a9aca194c25a35c5`
- モバイル表スクロール修正コミット: `0e74deb33a221b9a198b75219d54ce30495be673`
- 実施日: 2026年7月27日
- 対象ブランチ: `staging`

## 自動チェック

| テスト | 結果 |
|---|---|
| `node tools/check-tachikawa-ranking.cjs` | 合格。749 assertions |
| `node --input-type=commonjs < tools/check-seo-metadata.js` | 合格。stagingの11 HTMLページ |
| `node --check area/tachikawa/article.js` | 合格 |
| `node --check tools/check-tachikawa-ranking.cjs` | 合格 |
| `tidy -errors -quiet area/tachikawa/index.html` | 合格。HTMLエラーなし |
| `git diff --check` | 合格 |
| GitHub Actions `Check GA tag` | 合格。run `30195248284` |
| GitHub Pages `pages-build-deployment` | 合格。run `30195247976` |

専用チェックでは、title、H1、モバイルH1の4行構造と安全な折り返し、meta description、canonical、noindex、構造化データ、10社ランキング、12問FAQ、17画像、10本の記事CTA、出典リンク属性、日付、表のcaption/scope、CSSスコープ、4項目で折り畳む目次、全18表の固定caption・固定列・overflow判定・初回スクロール案内、背景透過ロゴのalpha channel、FAQのプログレッシブ拡張、CTAイベント、相対アセットの存在を検証した。

## staging実URL

| 確認項目 | 結果 |
|---|---|
| `/area/tachikawa/` | HTTP 200 |
| 配信HTML | ローカル実装HTMLとバイト単位で一致 |
| `article.css` | HTTP 200 |
| `article.js` | HTTP 200 |
| `styles.css` | HTTP 200 |
| `shop/shop-contact.css` | HTTP 200 |
| 共通ロゴ | HTTP 200 |
| 立川記事用WebP / SVG | HTTP 200 |
| 共通固定CTA画像 | HTTP 200 |
| PC用LINEページ | HTTP 200 |
| stagingトップページ | HTTP 200 |
| staging立川店ページ | HTTP 200 |

## SEO・構造

| 項目 | 結果 |
|---|---|
| title | 指定文言と一致 |
| H1 | 1件、指定文言と一致 |
| canonical | `https://monthly-rent-car.jp/area/tachikawa/` |
| meta robots | `noindex, nofollow` |
| BreadcrumbList | なし |
| パンくずUI | なし |
| SNSシェアボタン | なし |
| 公開日・更新日 | 記事上部になく、出典欄下に表示 |
| ItemList | 10社 |
| FAQPage | 12問。表示FAQと文言一致 |
| LocalBusiness | 東京マンスリーレンタカー立川店の1件のみ |
| Review / AggregateRating | なし |
| 本番XMLサイトマップ | `/area/tachikawa/`を未掲載 |
| 本番サイトからの内部リンク | 追加なし |

## リンク

| 対象 | 結果 |
|---|---|
| メールフォーム `https://form.run/@monthly-rent-car` | HTTP 200 |
| LINE `https://lin.ee/ojmETte` | LINE公式URLへ遷移、HTTP 200 |
| 電話 | `tel:05017920800` |
| 記事内CTA | hero 3本、rank1 2本、price 1本、support 1本、final 3本。全10本 |
| 競合への大きなCTA | なし |
| 記事内の公式出典16 URL | 全件HTTP 200 |
| 相対内部アセット | 全件存在 |

## レスポンシブ・アクセシビリティ

| 確認項目 | 結果 |
|---|---|
| 1440px向けPCレイアウト | `min-width:1180px`で本文・ヘッダー・フッターを幅100%へ戻し、共通の430pxスマートフォン枠を解除 |
| 768px / 390px向けレイアウト | モバイルブレークポイント、固定CTA分の下余白、1カラム本文を実装 |
| モバイルH1 | 320 / 360 / 375 / 390 / 402 / 414 / 430pxで意味単位の4行表示。全幅でH1の`clientWidth`と`scrollWidth`が一致し、4行すべてがH1内に収まることを実ブラウザ計測 |
| H1のブラウザ互換 | `word-break: auto-phrase`非対応時は`word-break: normal`と`overflow-wrap: anywhere`へフォールバック。同7幅で強制再現し、4行すべて1行内・H1内に収まることを確認 |
| H1文言 | 4行化後もDOMの`textContent`、title、OGP、構造化データの文言は指定文字列と完全一致 |
| ページ全体の横スクロール抑止 | ルートを`overflow-x: clip` |
| 表の横スクロール | 固定captionの下に比較列専用viewportを生成。overflowする表だけフォーカス可能とし、表中央が画面内へ入ると初回だけ手・左右矢印・「スクロールできます」を表示 |
| 表の固定列 | 18表すべて左端の項目列をsticky固定。ランキング表のみ「順位＋会社名」の2列を固定 |
| 表のスクロール状態 | ネイティブの連続・慣性スクロール、スナップなし。固定キー領域の右端は1px罫線。最初の横スクロールで案内を0.3秒で消し、左端へ戻しても再表示しない |
| 画像 | 17枠すべて実画像へ差し替え。width/height/aspect-ratio/alt、WebP最適化、遅延読み込みを実装 |
| ロゴ | ヘッダー・フッター・東京マンスリーレンタカーの画像をalpha付き透過PNGへ差し替え |
| 星評価 | すべて`aria-label`あり |
| FAQ | button、aria-expanded、aria-controlsを実装。JavaScript無効時は全回答を表示 |
| 目次 | 初期表示を上位4項目に制限。OPEN / CLOSE button、aria-expanded、JS無効時の全リンク表示を実装 |
| focus-visible | リンク、button、表wrapperへ実装 |
| prefers-reduced-motion | 指の移動アニメーションを停止し、静止案内を表示することを実ブラウザ確認 |
| CTA重なり対策 | 760px以下で本文下余白106px、共通固定CTA本体は変更なし |

## モバイルH1の実ブラウザ確認

- Chrome DevTools Protocolの`Emulation.setDeviceMetricsOverride`を使い、スクリーンショットの単純な切り抜きではなく、320 / 360 / 375 / 390 / 402 / 414 / 430 CSS pxの実レイアウト幅で計測した。
- 全7幅で`innerWidth = document.documentElement.clientWidth = document.documentElement.scrollWidth`、`h1.clientWidth = h1.scrollWidth`となり、ページ・H1とも横方向のはみ出しはなかった。
- 各`.article-title-line`は全7幅で4段・各1行となり、文字Rangeの左右端はH1の左右端内だった。
- 320px・390px・430pxの初期表示をスクリーンショットで目視し、固定ヘッダー、アイキャッチ、固定CTAとの干渉がないことを確認した。
- 768px・1440pxでもH1、ページとも横方向のはみ出しがないことを計測し、PCレイアウトへの回帰がないことを確認した。

## モバイル表スクロールの実ブラウザ確認

- 参照ページが使用する`scroll-hint@1.1.10`と添付動画13.04秒を照合し、表示開始条件、120×80pxの案内、1.2秒×2回の指アニメーション、2.4秒後の左右矢印、最初の横スクロール後の0.3秒フェードを再現した。
- Chrome DevTools Protocolで320 / 375 / 402 / 430 CSS pxを実レイアウトし、全幅で18表が横overflowし、各表に案内が1件だけ生成され、ページ本体には横overflowがないことを確認した。
- 375pxで18表を1件ずつ操作し、全18表で「表中央進入後に表示」「横スクロール後に非表示」「左端へ戻しても非再表示」を確認した。
- 402pxでは`Input.dispatchTouchEvent`による実タッチスワイプを行い、`scrollLeft`が0から388pxへ慣性移動した。captionと先頭固定列の移動量は0px、可動列だけが-388px移動した。
- ランキング表は「順位」「レンタカー会社」の2列がとも0px移動し、3列目だけが-140px移動した。これは参照表の「順位＋会社名」を同一固定キーセルにした挙動と機能的に同等である。
- 1440pxでは18件の案内がすべて`display:none`かつactive 0件で、PC表示に影響しないことを確認した。
- `prefers-reduced-motion: reduce`では案内自体を維持し、指のanimationが`none`になることを確認した。

## 未実施・環境制約

- 操作可能なアプリ内ブラウザ接続先はなかったため、FAQの実クリック、キーボード実操作、フルページスクリーンショットは未実施。
- モバイルH1は上記9幅、表スクロールは上記4幅で実ブラウザ計測した。ヘッダー開閉、目次・FAQ開閉は、本番公開前に操作可能なブラウザまたは実機で最終確認する。
- 実機iPhone Safari自体は未接続。Safari非対応時と同じ`word-break: normal`へ実行時に切り替え、320〜430pxの全幅でフォールバック表示が収まることは確認した。
- GitHub Pagesの配信レスポンスに`X-Robots-Tag`はない。GitHub Pages単体では任意レスポンスヘッダーを設定できないため、Cloudflare Transform Rules等の前段設定が必要。
- Basic認証またはCloudflare Accessは、対象ドメインの権限がないため未設定。設定手順は`docs/area-tachikawa-production-checklist.md`に記載。

## 本番非変更の確認

- `origin/main`: `5fcd1bbd7c5044c5d75792e16ed110ac4a9db41f`
- 本番 `https://monthly-rent-car.jp/area/tachikawa/`: HTTP 404
- `main`へのpush、PR作成、production workflow実行は行っていない。
- 変更ファイルは立川エリアページ専用HTML/CSS/JS、専用画像、専用チェック、SEOメタデータチェックの立川用OGP条件、指定ドキュメントに限定した。共通CSS、共通JS、固定CTA、トップページ、立川店ページ、robots.txt、sitemap.xml、workflowは未変更。

# 立川市レンタカーランキング テスト結果

- 対象URL: https://stg.monthly-rent-car.jp/area/tachikawa/
- 実装コミット: `87ab79f1aab78589eb1e67f5a8ee7567c564cb04`
- モバイルH1修正コミット: `6fa5a6b680cca7dd2eeac843a9aca194c25a35c5`
- モバイル表スクロール修正コミット: `0e74deb33a221b9a198b75219d54ce30495be673`
- スマートフォン文字・見出し・ランキング表の実装コミット: `ec0effebff86e1ed967ba70bfbc0c5b1588b1b44`
- 実ブラウザ検証対象のstaging head: `3299dd2ac6cb5622ce21dda1896c9d64aa7645ac`
- 実施日: 2026年7月27日
- 対象ブランチ: `staging`

## 自動チェック

| テスト | 結果 |
|---|---|
| `node tools/check-tachikawa-ranking.cjs` | 合格。853 assertions |
| `node --input-type=commonjs < tools/check-seo-metadata.js` | 合格。stagingの13 HTMLページ |
| `node --check area/tachikawa/article.js` | 合格 |
| `node --check tools/check-tachikawa-ranking.cjs` | 合格 |
| `tidy -errors -quiet area/tachikawa/index.html` | 合格。HTMLエラーなし |
| `git diff --check` | 合格 |
| GitHub Actions `Check GA tag` | 合格。run `30246776312` |
| GitHub Pages `pages-build-deployment` | 合格。run `30246775130` |

専用チェックでは、titleとH1の文言一致、モバイルH1の3行以内表示と安全な折り返し、指定見出し、meta description、canonical、noindex、構造化データ、5列・10社のランキング、12問FAQ、17画像、10本の記事CTA、出典リンク属性、日付、表のcaption/scope、CSSスコープ、4項目で折り畳む目次、全18表の固定caption・固定列・overflow判定・初回スクロール案内、背景透過ロゴのalpha channel、FAQのプログレッシブ拡張、CTAイベント、相対アセットの存在を検証した。

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

## スマートフォン文字仕様（390px）

| 要素 | 修正前 | 修正後 |
|---|---|---|
| 本文 | 16px / `1.95` / 400 | 15px / `1.85` / 400 |
| H1 | 約28.9px / `1.38` / 950 | 22px / `1.45` / 700、3行 |
| H2 | 約26.5px / `1.5` / 950 | 19px / `1.5` / 700、原則2行以内 |
| H3 | 21px / `1.55` / 950 | 17px / `1.55` / 700 |
| H4 | 既存値 | 16px / `1.6` / 700 |
| 比較表 | 14px / `1.65`、上下12px・左右13px | 13px / `1.5`、上下8px・左右7px |
| CTA・結論見出し | 既存値 | CTA 18px、結論17px / `1.5` / 700 |

- 料金、利用期間、`おすすめ10選`など318個のDOM上の意味単位に`.inline-token`を付け、`white-space: nowrap`で数値と単位の途中分割を防止した。
- 見出し内の社名・支店名は`.heading-brand` / `.heading-branch`、料金表の社名は`.table-name-part`で意味単位を保持した。
- 375 / 390 / 430pxでDOM上の318個すべてを対象に、表示中の各トークン、全社名パーツ、全ランキング詳細見出しを計測し、意味単位内の途中改行が0件であることを確認した。

## 見出し文言

指定どおり変更:

1. `利用期間によっておすすめのレンタカーは異なる`
2. `1ヶ月以上なら東京マンスリーレンタカー立川店がおすすめ`
3. `立川市の格安レンタカーおすすめ10選`
4. `車両クラス別に1ヶ月料金を比較`
5. `長期利用で確認したい補償とトラブル対応`
6. `立川でマンスリーレンタカーが必要になるケース`
7. `東京マンスリーレンタカー立川店の利用の流れ`
8. `立川市で1ヶ月以上借りる際の比較ポイント`

指定どおり維持:

- `東京マンスリーレンタカーとガッツレンタカーを比較`
- `立川市で長期レンタカーを選ぶ6つのポイント`
- `立川市の格安レンタカーに関するよくある質問`

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
| モバイルH1 | 375 / 390 / 430pxで22px・700・行高1.45の3行表示。全幅でH1とページに横はみ出しがないことを実ブラウザ計測 |
| H1のブラウザ互換 | `word-break: normal`、`overflow-wrap: break-word`、`line-break: strict`、`text-wrap: balance`を併用し、意味単位用spanで不自然な途中改行を防止 |
| H1文言 | 3行化後もDOMの`textContent`、title、OGP、構造化データの文言は指定文字列と完全一致 |
| ページ全体の横スクロール抑止 | ルートを`overflow-x: clip` |
| 表の横スクロール | 固定captionの下に比較列専用viewportを生成。overflowする7表だけフォーカス可能とし、表上部から最大160pxの案内位置が画面内へ入ると初回だけ手・左右矢印・「横にスクロールできます」を表示 |
| 表の固定列 | モバイルで横overflowする7表だけ左端のキー列をsticky固定。ランキング表は「順位・レンタカー会社」を1セルに統合して1列だけ固定 |
| ランキング列 | 6列から5列へ変更。`順位・レンタカー会社`、`長期利用おすすめ度`、`1ヶ月料金`、`立川での利用方法`、`主な特徴` |
| ランキング固定幅 | `clamp(148px, 41vw, 168px)`。実測375px時153.75px、390px時159.89px、430px時168px |
| 表のスクロール状態 | ネイティブの連続・慣性スクロール、スナップなし。固定キー領域の右端は1px罫線。案内は約3秒後または最初の横スクロールで消し、左端へ戻しても再表示しない |
| 画像 | 17枠すべて実画像へ差し替え。width/height/aspect-ratio/alt、WebP最適化、遅延読み込みを実装 |
| ロゴ | ヘッダー・フッター・東京マンスリーレンタカーの画像をalpha付き透過PNGへ差し替え |
| 星評価 | すべて`aria-label`あり |
| FAQ | button、aria-expanded、aria-controlsを実装。JavaScript無効時は全回答を表示 |
| 目次 | 初期表示を上位4項目に制限。OPEN / CLOSE button、aria-expanded、JS無効時の全リンク表示を実装 |
| focus-visible | リンク、button、表wrapperへ実装 |
| prefers-reduced-motion | 指の移動アニメーションを停止し、静止案内を表示することを実ブラウザ確認 |
| CTA重なり対策 | 760px以下で本文下余白106px、共通固定CTA本体は変更なし |

## モバイルH1の実ブラウザ確認

- Chrome DevTools Protocolの`Emulation.setDeviceMetricsOverride`を使い、スクリーンショットの単純な切り抜きではなく、375 / 390 / 430 / 768 / 1440 CSS pxの実レイアウト幅で計測した。
- 375 / 390 / 430pxではH1を次の3行で表示した: `【2026年最新】立川市の` / `格安レンタカーおすすめ10選｜` / `1ヶ月・長期料金を比較`。
- 5幅すべてで`innerWidth = document.documentElement.clientWidth = document.documentElement.scrollWidth`となり、ページ全体の横方向のはみ出しはなかった。
- モバイルの全H2は最大2行、ランキング詳細見出しは最大2行で、社名・支店名の意味単位内改行は0件だった。
- 390pxの初期表示、利用期間表、ランキング表、1位詳細と、1440pxのランキング表をスクリーンショットで目視確認した。

## モバイル表スクロールの実ブラウザ確認

- 参照ページが使用する`scroll-hint@1.1.10`と添付動画13.04秒を照合し、表上部を基準にした表示開始条件、150×80pxの案内、1.2秒×2回の指アニメーション、2.4秒後の左右矢印、約3秒後または最初の横スクロール後の終了を実装した。
- 375 / 390 / 430 CSS pxを実レイアウトし、全18表のうち7表だけが横overflow、残る11表は画面内に収まり、ページ本体には横overflowがないことを確認した。
- 375 / 390 / 430pxのランキング表を180px横スクロールすると、統合した第1列の移動量だけが0px、残り4列はすべて-180pxだった。
- 利用期間表を140px横スクロールすると、captionと「利用期間」列の移動量は0px、「選び方」以下の可動セルだけが-140pxだった。
- 推奨1位行は横スクロール後も固定セルを含む5セルすべて同じ`rgb(255, 245, 237)`で、固定境界に不自然な背景差がないことを確認した。
- 1440pxでは18件の案内がすべて`display:none`かつactive 0件で、PC表示に影響しないことを確認した。
- `prefers-reduced-motion: reduce`では案内自体を維持し、指のanimationが`none`になることを確認した。

## 未実施・環境制約

- 操作可能なアプリ内ブラウザ接続先はなかったため、FAQの実クリック、キーボード実操作、フルページスクリーンショットは未実施。
- H1・見出し・表は上記5幅で実ブラウザ計測した。ヘッダー開閉、目次・FAQ開閉は、本番公開前に操作可能なブラウザまたは実機で最終確認する。
- 実機iPhone Safari自体は未接続。標準的な`word-break: normal`と`overflow-wrap: break-word`を使い、375〜430pxの全幅で表示が収まることはChromiumで確認した。
- GitHub Pagesの配信レスポンスに`X-Robots-Tag`はない。GitHub Pages単体では任意レスポンスヘッダーを設定できないため、Cloudflare Transform Rules等の前段設定が必要。
- Basic認証またはCloudflare Accessは、対象ドメインの権限がないため未設定。設定手順は`docs/area-tachikawa-production-checklist.md`に記載。

## 本番非変更の確認

- 確認時点の`origin/main`: `3a49ada9a7a61bd23e07c37478732d99f47a2295`（新宿店MAPリンク更新。本作業とは別）
- 本番 `https://monthly-rent-car.jp/area/tachikawa/`: HTTP 404
- `main`へのpush、PR作成、production workflow実行は行っていない。
- 今回の変更ファイルは`area/tachikawa/index.html`、`area/tachikawa/article.css`、`area/tachikawa/article.js`、`tools/check-tachikawa-ranking.cjs`、本テスト記録、画像仕様記録に限定した。共通CSS、共通JS、固定CTA、画像、トップページ、立川店ページ、robots.txt、sitemap.xml、workflowは未変更。

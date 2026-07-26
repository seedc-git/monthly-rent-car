# 立川市レンタカーランキング テスト結果

- 対象URL: https://stg.monthly-rent-car.jp/area/tachikawa/
- 実装コミット: `87ab79f1aab78589eb1e67f5a8ee7567c564cb04`
- 実施日: 2026年7月26日
- 対象ブランチ: `staging`

## 自動チェック

| テスト | 結果 |
|---|---|
| `node tools/check-tachikawa-ranking.cjs` | 合格。730 assertions |
| `node --input-type=commonjs < tools/check-seo-metadata.js` | 合格。stagingの11 HTMLページ |
| `node --check area/tachikawa/article.js` | 合格 |
| `node --check tools/check-tachikawa-ranking.cjs` | 合格 |
| `tidy -errors -quiet area/tachikawa/index.html` | 合格。HTMLエラーなし |
| `git diff --check` | 合格 |
| GitHub Actions `Check GA tag` | 合格。run `30195248284` |
| GitHub Pages `pages-build-deployment` | 合格。run `30195247976` |

専用チェックでは、title、H1、meta description、canonical、noindex、構造化データ、10社ランキング、12問FAQ、17画像、10本の記事CTA、出典リンク属性、日付、表のcaption/scope、CSSスコープ、4項目で折り畳む目次、全18表の固定caption・固定列・overflow判定、背景透過ロゴのalpha channel、FAQのプログレッシブ拡張、CTAイベント、相対アセットの存在を検証した。

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
| ページ全体の横スクロール抑止 | ルートを`overflow-x: clip` |
| 表の横スクロール | 固定captionの下に比較列専用viewportを生成し、実際にoverflowする表だけキーボードフォーカス可能 |
| 表の固定列 | 18表すべて左端の項目列をsticky固定。ランキング表のみ「順位＋会社名」の2列を固定 |
| 表のスクロール状態 | ResizeObserverでoverflowを再判定し、スクロール時のみ固定列境界の影を表示 |
| 画像 | 17枠すべて実画像へ差し替え。width/height/aspect-ratio/alt、WebP最適化、遅延読み込みを実装 |
| ロゴ | ヘッダー・フッター・東京マンスリーレンタカーの画像をalpha付き透過PNGへ差し替え |
| 星評価 | すべて`aria-label`あり |
| FAQ | button、aria-expanded、aria-controlsを実装。JavaScript無効時は全回答を表示 |
| 目次 | 初期表示を上位4項目に制限。OPEN / CLOSE button、aria-expanded、JS無効時の全リンク表示を実装 |
| focus-visible | リンク、button、表wrapperへ実装 |
| prefers-reduced-motion | 実装 |
| CTA重なり対策 | 760px以下で本文下余白106px、共通固定CTA本体は変更なし |

## 未実施・環境制約

- このセッションには操作可能なブラウザ接続先がなかったため、390px・768px・1440pxの実ブラウザ目視、FAQの実クリック、キーボード実操作、フルページスクリーンショットは未実施。
- 上記3幅については専用CSS条件、静的HTML、実配信HTMLのバイト一致を自動検証した。本番公開前に、実ブラウザで横はみ出し、表スクロール、固定CTAとの重なり、ヘッダー開閉、目次・FAQ開閉を最終確認する。
- GitHub Pagesの配信レスポンスに`X-Robots-Tag`はない。GitHub Pages単体では任意レスポンスヘッダーを設定できないため、Cloudflare Transform Rules等の前段設定が必要。
- Basic認証またはCloudflare Accessは、対象ドメインの権限がないため未設定。設定手順は`docs/area-tachikawa-production-checklist.md`に記載。

## 本番非変更の確認

- `origin/main`: `61b47df7df5301d2de9c5d69b5541315aa113658`
- 本番 `https://monthly-rent-car.jp/area/tachikawa/`: HTTP 404
- `main`へのpush、PR作成、production workflow実行は行っていない。
- 変更ファイルは立川エリアページ専用HTML/CSS/JS、専用画像、専用チェック、SEOメタデータチェックの立川用OGP条件、指定ドキュメントに限定した。共通CSS、共通JS、固定CTA、トップページ、立川店ページ、robots.txt、sitemap.xml、workflowは未変更。

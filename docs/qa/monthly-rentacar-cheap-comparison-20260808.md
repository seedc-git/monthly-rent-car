# 格安マンスリーレンタカー9社比較 表示QA

- 実施日: 2026年8月8日（JST）
- 対象: `/guide/monthly-rentacar-cheap-comparison/`
- 確認方法: ローカルHTTPサーバーを実ブラウザで表示し、幅を320px・390px・1280pxへ固定
- 参照: `/area/tachikawa/` の記事表現・表、トップページのCTA・FAQ

## 320px

- ビューポート: 320×900
- `documentElement.clientWidth = scrollWidth = 320`、`body.scrollWidth = 320`
- 表以外の表示要素を全走査し、画面外へはみ出す要素は0件
- 比較表: 表示領域296px、表1516px。表内だけ横スクロール可能
- `scrollLeft = 480`まで実操作し、左端のサービス列が`position: sticky; left: 0`のまま固定されることを確認
- 全セルで`scrollWidth > clientWidth`となる文字の飛び出しは0件。料金・車種・用途の重なりなし
- スクロール案内、手のジェスチャー、左右矢印を表示。操作後は案内が消え、矢印状態が更新される
- 記事末CTAの3か所は指定位置でのみ改行。ボタン文言は1行、リンクは`/#stores`
- CTAボタン: 緑`rgb(6, 199, 85)`、18px、角丸18px。記事末・固定CTAとも同一仕様
- FAQ: 10件。Q2をクリックするとQ1が閉じ、開閉途中と完了時の高さ変化を確認
- Q3をEnterキーで開き、フォーカス維持、`aria-expanded`、`aria-controls`、回答の`hidden`が連動

## 390px

- ビューポート: 390×900
- `documentElement.clientWidth = scrollWidth = 390`、`body.scrollWidth = 390`
- 表以外の表示要素を全走査し、画面外へはみ出す要素は0件
- 比較表: 表示領域366px、表1516px。表内だけ横スクロール可能
- 全セルで文字の飛び出しは0件。3列目の途中まで見せる初期表示で、横スクロール可能なことが視覚的にも分かる
- CTAの見出し・説明・下部文言は指定位置で2行表示。3個の`.mobile-only-break`はすべて表示
- CTAの文言、リンク、緑色、文字サイズ、角丸を320pxと同じ値で確認
- FAQは最初の質問が開いた状態で表示され、質問・回答・開閉アイコンに重なりなし

## 1280px

- ビューポート: 1280×900
- `documentElement.clientWidth = scrollWidth = 1280`、`body.scrollWidth = 1280`
- 表以外の表示要素を全走査し、画面外へはみ出す要素は0件
- 記事本文740px、比較表の表示領域738px、表1668px。表内だけ横スクロール可能
- 全セルで文字の飛び出しは0件。料金列の強調、行見出し、注釈に重なりなし
- 3個の`.mobile-only-break`はすべて`display: none`。CTAの見出し・説明・下部文言に強制改行なし
- CTAリンクは`/#stores`、ボタン文言は「近くの店舗を探す」
- FAQのQ2をクリック、Q3をEnterキーで操作。Q3へフォーカスが残り、ARIAと開閉状態が正しく連動

## 税抜・構造・画像・ログ

- HTML全体に`税込`の文字列が0件。本文、表、注釈、FAQ、JSON-LDを含めて確認
- 税区分を確認できなかったJOMOは金額換算をせず、数値比較から除外
- NOC・免責額は基本料金と分離し、税を含む公式公表額から消費税相当分を除いた「税抜換算」と明記。事故時は契約書の請求額確認を案内
- ヒーロー1点、車両・相談写真9点は全点`complete = true`かつ自然寸法あり
- ブラウザログにページURL由来のエラー・警告なし。記録されていたエラーはChrome拡張自身の古い動的importエラーのみ
- 表のキーボード到達用`tabindex="0"`、`role="region"`、見出し・操作説明とのARIA関連付けを確認

## 自動チェック

- `node tools/check-monthly-rentacar-comparison.cjs`
- `node --check guide/monthly-rentacar-cheap-comparison/article.js`
- `git diff --check`

ステージング反映後に同URLを再表示し、同じ3幅、CTA遷移、FAQ操作を再確認する。

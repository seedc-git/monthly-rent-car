# 格安マンスリーレンタカー9社比較 表示QA

- 実施日: 2026年8月8日（JST）
- 対象: `/guide/monthly-rentacar-cheap-comparison/`
- 配信方法: ローカルHTTPサーバー

## 390px

- ビューポート: 390×844
- HTML／body幅: 390px。本文全体の横はみ出しなし
- ヒーロー: 360×203 WebPを選択、読込完了
- 比較表: 表示領域366px、表1700px、10列・9行
- 横スクロール: `scrollLeft=700`まで実操作。左端列は`position: sticky`のまま固定
- 条件別候補: 10件、1列、各カード366px
- メニュー: `aria-expanded=false`から`true`へ変化し、ナビを表示
- FAQ: 12件。2件目を開き、表示FAQとJSON-LDの一致を専用チェックで確認
- 固定CTA: 370×86px。ページ末尾でフッターとの間に約2pxの余白を確保

## 1440px

- ビューポート: 1440×900
- HTML／body幅: 1440px。本文全体の横はみ出しなし
- 記事シェル: 800px、本文・ヒーロー: 740px
- ヒーロー: 740×416 WebPを選択、読込完了
- 比較表: 表示領域738px、表1750px、10列・9行
- 横スクロール: `scrollLeft=900`まで実操作。左端列は固定
- 条件別候補: 10件、2列、各カード364px
- デスクトップでは固定CTAを非表示。本文内CTAのみ表示

## 画像・リンク・コンソール

- 本文内の公式キャプチャ4点を実際に表示位置へ移動し、全点の読込と自然寸法を確認
- 記事内の外部リンク31件は全件2xx
- ローカルサーバーのページ、CSS、JS、画像は200または304で、404なし
- ブラウザログにはChrome拡張自身の動的importエラーが1件残るが、ページURL由来のエラー・警告はなし
- Lighthouse CLIは環境に未導入。代替として、実ブラウザの画像読込、横はみ出し、操作、HTTP応答、コンソールを確認

## プレビュー

- `monthly-rentacar-cheap-comparison-390-top.png`
- `monthly-rentacar-cheap-comparison-390-table.png`
- `monthly-rentacar-cheap-comparison-390-conditions.png`
- `monthly-rentacar-cheap-comparison-390-faq.png`
- `monthly-rentacar-cheap-comparison-1440-top.png`
- `monthly-rentacar-cheap-comparison-1440-table.png`
- `monthly-rentacar-cheap-comparison-1440-conditions.png`

# 立川エリアランキングページ 画像仕様

- 対象ページ: `/area/tachikawa/`
- 対象環境: staging
- 仕様確認日: 2026年8月8日
- 画像スロット数: 18

## 運用ルール

- 必要な外部サイトの画像、ロゴ、画面キャプチャ、参考素材は、個別に除外指定されたものを除き、公式サイトなどの一次ソースから積極的に取得してリポジトリ内へ保存する。
- 競合他社についても、各社の公式サイトや公式配布ページなどから、記事内容に合う店舗写真、公式バナー、サイト画面、ロゴを取得する。一律にプレースホルダーやテキストだけで代用しない。
- 依頼者から個別に除外・差し替えを指定された素材は、依頼者が指定した代替素材へ差し替える。
- 取得した外部素材は、取得元URLと取得日を監査資料へ記録する。
- 会社画像が読み込めない場合も、会社名のHTMLテキストだけで順位と会社名を理解できるレイアウトを維持する。
- すべての画像枠に実寸と一致する`width`、`height`、CSSの`aspect-ratio`、画像IDと一致する`data-image-slot`を設定し、読み込み前から表示領域を確保する。
- 画像を差し替える際は、実際の画像内容を確認してaltを確定する。
- 装飾目的で、同じ情報が隣接するHTMLテキストにある画像は`alt=""`とする。会社ロゴを情報として掲載する場合は会社名をaltに設定し、明確に装飾扱いとする場合だけ空altにする。
- 図解内の文字だけに情報を依存させず、料金、比較条件、利用期間、地域名などの主要情報は本文または表にも記載する。
- 本番公開時点で未設定の画像スロットが1つでもある場合は公開しない。

## 画像スロット一覧

| 画像ID | 掲載位置 | 実寸 | 現在の内容 | 使用ファイル | 現在のalt |
|---|---|---:|---|---|---|
| `tachikawa-ranking-eyecatch` | H1直下 | 1077×500px | JR立川駅北口の駅舎と駅前デッキ | `tachikawa-station-hero-20260730.webp` | `JR立川駅北口の駅舎と駅前デッキ` |
| `tachikawa-period-guide` | 「利用期間によっておすすめのレンタカーは異なる」の期間別比較表直下 | 1448×1086px | 短期・長期と価格帯で立川市のレンタカー会社を比較した4象限のポジショニングマップ | `tachikawa-period-positioning-map-20260730.webp` | `短期・長期と価格帯で立川市のレンタカー会社を比較したポジショニングマップ` |
| `ranking-logo-tokyo-monthly` | 1位詳細 | 1228×322px | 東京マンスリーレンタカーの自社ロゴ | `tokyo-monthly-logo-transparent.webp` | `東京マンスリーレンタカー` |
| `tokyo-monthly-tachikawa-store` | 1位詳細 | 1200×675px | 立川店所在地の建物 | `generated/tachikawa-store-exterior.webp` | `東京マンスリーレンタカー立川店が入る立川市曙町2丁目の建物` |
| `rank1-cta-banner` | 1位詳細直後の店舗CTA | 1983×793px | 東京マンスリーレンタカーの料金訴求バナー | `tokyo-monthly-rentacar-800yen-banner-20260731.webp` | `東京マンスリーレンタカー、1日あたり800円から。立川店の詳細を見る` |
| `tachikawa-price-comparison` | 車両クラス別料金比較の直前 | 1200×675px | コンパクトカーと見積もり資料 | `generated/tachikawa-price-comparison.webp` | `車種ごとの料金を比較するために並べたコンパクトカーと見積もり資料` |
| `ranking-photo-guts` | 2位詳細 | 320×240px | ガッツレンタカー立川店の車両・店舗写真 | `guts-rentacar-tachikawa-vehicle-20260730.webp` | `ガッツレンタカー立川店の前に停車する黒い軽自動車` |
| `ranking-photo-monthly-go` | 3位詳細 | 650×390px | マンスリーゴーの公式調査バナー | `monthly-go-visitor-survey-20260731.webp` | `訪日外国人の観光・地方周遊・生活利用ニーズを紹介するマンスリーゴーの調査バナー` |
| `ranking-photo-gogo` | 4位詳細 | 860×645px | GOGOマンスリーレンタカーの公式募集バナー | `gogo-monthly-franchise-banner-20260731.webp` | `無店舗型長期レンタカーのフランチャイズ加盟店募集を案内するGOGOマンスリーレンタカーのバナー` |
| `ranking-photo-maverick` | 5位詳細 | 2048×1036px | Maverickレンタカー八王子店の公式サイト画面 | `maverick-hachioji-website-20260731.webp` | `Maverickレンタカー八王子店の公式サイト画面` |
| `ranking-photo-tokyo-business` | 6位詳細 | 445×340px | 東京ビジネスレンタカーの店舗・車両写真 | `tokyo-business-rentacar-office-20260731.webp` | `東京ビジネスレンタカーの店舗入口と車両` |
| `ranking-photo-nrtokyo` | 7位詳細 | 1500×680px | 日本レンタリースの法人向け商用車バナー | `japan-rentlease-commercial-vehicle-banner-20260731.webp` | `日本レンタリース神奈川の法人向け商用車レンタルバナー` |
| `ranking-photo-niconico` | 8位詳細 | 1860×1312px | ニコニコレンタカーの公式プランバナー | `niconico-mystery-plan-banner-20260731.webp` | `ニコニコレンタカーのミステリープランと代表車種を紹介するバナー` |
| `ranking-photo-nippon` | 9位詳細 | 1200×800px | ニッポンレンタカー立川北口営業所の店舗写真 | `nippon-rentacar-tachikawa-kitaguchi-store-20260731.webp` | `ニッポンレンタカー立川北口営業所の店舗外観` |
| `ranking-photo-jnet` | 10位詳細 | 532×399px | Jネットレンタカー立川店の店舗写真 | `jnet-rentacar-tachikawa-store-20260731.webp` | `Jネットレンタカー立川店の店舗外観` |
| `tachikawa-support-comparison` | 補償・トラブル対応 | 1200×675px | ロードサービスと店舗連絡のイメージ | `generated/tachikawa-support-comparison.webp` | `道路脇で車両を点検するロードサービス担当者と店舗へ電話する利用者` |
| `tachikawa-use-cases` | 主な利用シーン | 1200×675px | レンタカーを利用する4つの場面 | `generated/tachikawa-use-cases.webp` | `通勤、子どもの送迎、荷物運搬、納車待ちでレンタカーを利用する4つの場面` |
| `tachikawa-area-map` | 立川エリア紹介 | 1200×675px | 立川市と周辺市の位置関係を示す模式図 | `generated/tachikawa-area-map.svg` | `立川駅を中心とした立川市と昭島市、日野市、国立市、国分寺市、東大和市、武蔵村山市の位置関係を示す模式図` |

## 差し替え時の確認

- [ ] 18個すべての`data-image-slot`が一意で、上表の画像IDと完全一致している。
- [ ] ファイル名と参照パスの大文字・小文字が一致している。
- [ ] `width`と`height`が実ファイルのピクセル寸法と一致している。
- [ ] CSSの`aspect-ratio`が画像比率と一致し、読み込み前後にレイアウトシフトがない。
- [ ] プレースホルダー表示、alt TODOコメント、未設定を示す属性や文言を本番版から除去した。
- [ ] altが実際の画像内容と一致し、画像内にない情報を追加していない。
- [ ] 装飾画像は空alt、情報として掲載する会社ロゴは会社名を示すaltになっている。
- [ ] SVGを使用する場合は不要なメタデータやスクリプトを除去し、外部リソースを参照していない。
- [ ] WebP等のラスター画像は表示寸法に対して過大でなく、文字を含む場合は390px幅でも判読できる。
- [ ] 390px、768px、1440pxでトリミング、キャプション、横はみ出し、CLSを確認した。
- [ ] 競合各社の画像、ロゴ、画面キャプチャについて、取得元URL、取得日、使用したファイルを記録している。
- [ ] 地図サービスのスクリーンショット、ロゴ、地図タイルを使う場合は、取得元URLと取得日を記録している。

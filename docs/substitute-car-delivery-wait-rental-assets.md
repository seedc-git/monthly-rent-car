# 代車・納車待ちガイド 画像・ロゴ取得監査

- 対象ページ: `/guide/substitute-car-delivery-wait-rental/`
- 取得・確認日: 2026年8月8日
- 方針: 公式サイトまたは公式ページで現用されている一次ソースだけを取得し、リポジトリ内へ保存して使用する
- 料金画像の扱い: 記事の金額表記を税抜に統一するため、税込金額を焼き込んだバナーは比較表に使用しない

## 記事写真

| 画像ID | 取得元ページ | 原画像URL | 保存先 | 使用箇所 | 加工・alt |
|---|---|---|---|---|---|
| `official-asakadai-key-handover` | https://monthly-rent-car.jp/shop/saitama/asakadai/ | https://monthly-rent-car.jp/assets/img/asakadai-service-vehicle-key-handover-20260803.webp | `assets/img/guide/substitute-car-delivery-wait-rental/official-asakadai-key-handover-{360,740,1200}.webp` | H1直下、preload、OGP、Twitter、Article、メディアカルーセル | 1200px版は公式掲載ファイルを保持。360/740px版は品質84のWebP。altは朝霞台店の車両受渡しであることを明記 |
| `official-tachikawa-plan-consultation` | https://monthly-rent-car.jp/shop/tokyo/tachikawa/ | https://monthly-rent-car.jp/assets/img/tachikawa-service-plan-consultation-20260802.webp | `assets/img/guide/substitute-car-delivery-wait-rental/official-tachikawa-plan-consultation-{360,740,1200}.webp` | 「先に結論」の相談イメージ | 1200px版は公式掲載ファイルを保持。360/740px版は品質84のWebP。altは立川店の料金・期間案内であることを明記 |
| `official-omiya-return-inspection` | https://monthly-rent-car.jp/shop/saitama/omiya/ | https://monthly-rent-car.jp/assets/img/omiya-service-return-inspection-20260803.webp | `assets/img/guide/substitute-car-delivery-wait-rental/official-omiya-return-inspection-{360,740,1200}.webp` | 延長・早期返却セクション前 | 1200px版は公式掲載ファイルを保持。360/740px版は品質84のWebP。altは大宮店での返却車両確認であることを明記 |

上記3点の取得ファイルは、同名のリポジトリ既存ファイルとSHA-256が一致することを確認した。旧実装で使っていたAI生成画像3点は、公式掲載写真で置き換え、コミット対象から除外した。

## 会社比較の公式ロゴ・車両画像

| 会社・素材 | 取得元ページ | 原画像URL | 保存先 | 使用箇所 | 加工 |
|---|---|---|---|---|---|
| マンスリーレンタカー ロゴ | https://monthly-rent-car.jp/ | https://monthly-rent-car.jp/assets/img/monthly-rentacar-logo-transparent-329.webp | `assets/img/monthly-rentacar-logo-transparent-329.webp` | 主要5社比較・自社行 | 既存公式ファイルを再利用 |
| マンスリーレンタカー A-Class | https://monthly-rent-car.jp/ | https://monthly-rent-car.jp/assets/img/topa_car-320.webp | `assets/img/topa_car-320.webp` | 主要5社比較・自社行 | 既存公式ファイルを再利用 |
| ガッツレンタカー ロゴ | https://guts-rentacar.com/price/a1/ | https://guts-rentacar.com/common/images/h-logo01.png | `assets/img/guide/substitute-car-delivery-wait-rental/guts-rentacar-logo-20260808.png` | 主要5社比較・ガッツ行 | PNG原本を保存 |
| ガッツレンタカー A-1 | https://guts-rentacar.com/price/a1/ | https://guts-rentacar.com/cms/wp-content/uploads/2022/09/a1.png | `assets/img/guide/substitute-car-delivery-wait-rental/guts-a1-class-20260808.webp` | 主要5社比較・ガッツ行 | 品質82のWebP |
| ガッツレンタカー 代車バナー | https://guts-rentacar.com/alternative_car/ | https://guts-rentacar.com/images/alternative_car/alternative_car01.jpg | `assets/img/guide/substitute-car-delivery-wait-rental/guts-substitute-car-banner-{360,740}.webp` | 主要5社比較・公式代車案内 | 360×156px / 740×320px、品質84のWebP |
| GOGOマンスリーレンタカー ロゴ | https://gogo-monthly-rentacar.com/price/ | https://gogo-monthly-rentacar.com/wp-content/uploads/2022/04/GOGOマンスリーレンタカー01-1.png | `assets/img/guide/substitute-car-delivery-wait-rental/gogo-monthly-rentacar-logo-20260808.png` | 主要5社比較・GOGO行 | PNG原本を保存 |
| GOGOマンスリーレンタカー 軽自動車 | https://gogo-monthly-rentacar.com/price/ | https://gogo-monthly-rentacar.com/wp-content/uploads/2023/03/ミラ.jpg | `assets/img/guide/substitute-car-delivery-wait-rental/gogo-kei-class-20260808.webp` | 主要5社比較・GOGO行 | 360×197px、品質82のWebP |
| GOGOマンスリーレンタカー 代車ビジュアル | https://gogo-monthly-rentacar.com/loaner_car/ | https://gogo-monthly-rentacar.com/wp-content/uploads/2025/08/loanercar.jpg | `assets/img/guide/substitute-car-delivery-wait-rental/gogo-substitute-car-banner-{360,740}.webp` | 主要5社比較・公式代車案内 | 360×132px / 740×271px、品質84のWebP |
| ニコニコレンタカー ロゴ | https://www.2525r.com/price/ | https://www.2525r.com/assets/logo-d7423e79.png | `assets/img/guide/substitute-car-delivery-wait-rental/niconico-rentacar-logo-20260808.png` | 主要5社比較・ニコニコ行 | PNG原本を保存 |
| ニコニコレンタカー Kクラス | https://www.2525r.com/price/ | https://www.2525r.com/assets/sample-class-k-4dcf7ce9.png | `assets/img/guide/substitute-car-delivery-wait-rental/niconico-k-class-20260808.webp` | 主要5社比較・ニコニコ行 | 360×232px、品質82のWebP |
| 業務レンタカー ロゴ | https://www.renntacar.net/car/ | https://www.renntacar.net/img/common/logo_sp.svg | `assets/img/guide/substitute-car-delivery-wait-rental/gyomu-rentacar-logo-20260808.svg` | 主要5社比較・業務レンタカー行 | SVG原本を保存。スクリプト・外部参照なしを確認 |
| 業務レンタカー A-1 | https://www.renntacar.net/car/ | https://www.renntacar.net/img/up_class/class_c2017102900001_631.jpeg | `assets/img/guide/substitute-car-delivery-wait-rental/gyomu-a1-class-20260808.webp` | 主要5社比較・業務レンタカー行 | 360×217px、品質82のWebP |

各ロゴと車両画像には、会社名・クラス名を示すaltを付け、会社名とクラス名の本文も併記する。素材URLは取得時にHTTP 200を確認した。

## 取得可否と利用条件の確認

- 必須素材で技術的に取得できなかったものはない。
- 4社とも公式配布用のプレスキットは確認できなかったため、公式サイトで現用されているロゴと対象クラス画像を取得した。
- ガッツレンタカーの https://guts-rentacar.com/usage/ には、掲載画像等の転載・複製に関する制限がある。
- ニコニコレンタカーの https://www.2525r.com/guide/terms.html には、著作権等とサービス利用に関する制限がある。
- GOGOマンスリーレンタカーと業務レンタカーでは、確認した公開ページ内に素材再利用の個別許諾は見つからず、著作権表示を確認した。
- 上記は素材を一律除外する理由にはせず、取得元と条件の監査記録として残す。公開運用上の権利処理判断はサイト運営者が行う。

## 旧方針からの修正

1. AI生成の受渡し写真を、朝霞台店公式ページ掲載写真へ差し替えた。
2. AI生成の判断フロー画像を、立川店公式ページ掲載の料金・期間相談写真へ差し替えた。判断内容は隣接するHTML本文で維持した。
3. AI生成の延長・返却画像を、大宮店公式ページ掲載の返却確認写真へ差し替えた。
4. テキストだけだった5社比較へ、自社を含む全5社の公式ロゴと対象クラス画像を追加した。
5. ガッツレンタカーとGOGOマンスリーレンタカーが公式公開している、代車・納車待ちに直接関連する案内画像も比較節へ追加した。
6. 取得元ページ、原画像URL、取得日、保存先、使用箇所、加工内容を本監査資料へ記録した。

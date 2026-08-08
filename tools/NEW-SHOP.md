# 新店舗ページの追加手順

`AGENTS.md` の変更手順に従う。ここはそれを新店舗追加に当てはめた具体版。

## 触るファイル

1店増やすと次が変わる。`tools/new-shop.cjs` がまとめて面倒を見る。

| 対象 | 内容 |
|---|---|
| `shop/<pref>/<slug>/index.html` | 新規（既存店をコピーして文字列置換） |
| 既存の全HTMLページ（12件） | 店舗一覧に `<li>` を1行 |
| `index.html` | Organization JSON-LD の `department` 配列に1件 |
| `sitemap.xml` | URL 1件 |
| `tools/check-seo-metadata.js` | `shopImageByPage` に1行（**入れないとCIが落ちる**） |
| `assets/` | 画像4点（下記） |

## 事前に集める情報

| 項目 | 例 | 備考 |
|---|---|---|
| 住所 | 〒350-0225 埼玉県坂戸市日の出町16-7 サンライズプラザ | 郵便番号・建物名まで |
| 建物名 | サンライズプラザ | 外観写真の説明文に**単独で**出るため別に必要 |
| 最寄り駅・徒歩分数 | 坂戸駅 徒歩3分 | |
| LINE問い合わせURL | https://lin.ee/7iaNIAb | **店舗ごとに違う。使い回さない** |
| 店舗外観写真 | webp または png | |
| OGP画像3点 | 1731×909 png / 1200×630 jpg / 1200×1200 png | **`tools/make-shop-ogp.py` で作れる**（下記）。制作会社が作る場合はページ公開の後追いになる |
| サービス写真8点 | `<slug>-service-*.webp` 4種×2サイズ | `omiya` 雛形を使うときだけ |

電話番号 050-1792-0800・料金・車種・FAQ本文は全店共通なので確認不要。

## 手順

### 1. staging の最新から始める

```
git fetch origin && git checkout staging && git reset --hard origin/staging
```

直近の `git log` と Actions の実行履歴を見て、他タスクが進行中でないか確認する。

### 2. 設定ファイルを書く

`data/shops/<slug>.json`:

```json
{
  "template": "sakado",
  "slug": "kumagaya",
  "prefSlug": "saitama",
  "pref": "埼玉",
  "prefFull": "埼玉県",
  "shop": "熊谷店",
  "place": "熊谷",
  "city": "熊谷市",
  "postal": "360-0037",
  "street": "筑波2-1-1 熊谷ビル",
  "building": "熊谷ビル",
  "station": "熊谷駅",
  "walk": "徒歩5分",
  "lineUrl": "https://lin.ee/XXXXXXX",
  "exteriorExt": "webp",
  "insertAfter": "sakado"
}
```

雛形は2種類。

- `sakado` — サービス写真カルーセルなし
- `omiya` — サービス写真4枚あり（`<slug>-service-*.webp` 8点が必要）

`template` の店舗を丸ごとコピーして文字列を置き換えるので、**新店舗と構成が近い方**を選ぶ。

`pref` はブランド名に出る短い形（`東京マンスリーレンタカー`）、`prefFull` は住所に出る形（`東京都`）。
東京は `県` ではないので必ず両方書く。

雛形と違う都県の店を作るとき（例: 埼玉の坂戸店から東京の店）、次の3つは**元のまま残る**のが正しい。
生成後に消えていたら置換が広がりすぎているので直す。

- `<cite>埼玉県／個人事業主</cite>` — お客様の声。全店共通で3都県ぶん並んでいる
- `東京・神奈川・埼玉の各店舗でご相談いただけます`
- 店舗一覧の `<h3>埼玉県</h3>` と、そこに並ぶ既存店へのリンク（`/shop/saitama/...`）

### 3. 画像を置く

店舗外観写真は受領したものを置く。

```
assets/img/<slug>-store-exterior.<ext>
```

OGP画像3点は既存店の絵柄から作れる。全店で同じ絵柄で、変わるのは紺色の店名だけ。

```
python3 tools/make-shop-ogp.py <元の店> <slug> <新店名> --check   # 検出結果だけ見る
python3 tools/make-shop-ogp.py <元の店> <slug> <新店名>           # 3サイズを生成
```

デザインの元データは制作会社にあるので、これは**ラスター画像からの再現**。
公開前に必ず目視で確認する。フォントは **M PLUS 1p Black**（`~/Library/Fonts`・角ゴシック）。

🔴 **元の絵柄は角ゴシック**。丸ゴシックで作ると別物になる（2026-08-07 に一度間違えた）。
画数の多い漢字（熊・霞など）は太さで潰れ気味になるので、そういう店名のときは特に目視する。

🔴 **3枚とも並べて見る。** 正方形版だけ店名の位置が右に寄っていて、以前は元の店名の末尾が消し残り、
新しい店名がその上に乗って「練馬店店」になっていた（2026-08-07 修正済み）。
`--check` が出す name box の幅が3枚で極端に違うときは、消し残りを疑う。

制作会社に作ってもらう場合は、ページ公開の後追いになる（坂戸店はページ7/27・画像8/3）。
その間 `check-seo-metadata.js` が落ちるので、先に作っておく方が進めやすい。

### 4. 生成

```
node tools/new-shop.cjs data/shops/<slug>.json --check   # 置換内容と不足画像を確認
node tools/new-shop.cjs data/shops/<slug>.json           # 生成
node tools/sync-media-articles.cjs                       # MEDIA記事ブロックを埋める
```

**現在のブランチのページを雛形にする**ので、staging で実行すれば staging 用（`noindex` と
stg ホスト）、main 向けブランチで実行すれば本番用が出る。ホストの書き換えは不要。

### 5. CI と同じ検査を通す

```
node tools/sync-media-articles.cjs --check
node tools/check-thanks-analytics.cjs
node tools/check-seo-metadata.js
node tools/check-canonical-host.cjs
grep -L 'G-501JL6QG1N' $(find . -name '*.html' -not -path './.git/*')   # 出力が空ならOK
```

### 6. staging へ push して実機確認

push 後、https://stg.monthly-rent-car.jp/shop/&lt;pref&gt;/&lt;slug&gt;/ を開く。
見た目だけでなく電話・LINE・メールの各ボタン、固定CTA、店舗一覧のリンクが実際に動くか確認する。

### 7. 承認をもらってから本番PR

`agent/<slug>-production-<YYYYMMDD>` を `origin/main` から切り、staging で確認したのと
**同じ変更だけ**を適用して PR を作る。`staging` を `main` へ丸ごとマージしない
（staging には未リリースの変更が大量に溜まっている）。

PR には `staging-confirmed` ラベルが要る。**ラベルは staging 確認と本番アップの依頼を
受けてから付ける。** マージ＝即・本番公開なので、マージは依頼者に任せる。

## 注意

- **slug は CSS クラス接頭辞も兼ねる**（`.sakado-access-card` 等が1ページ約220箇所・ページ内 `<style>` 直書き）。slug を変えると生成し直し。
- **置換は長い文字列から先に当てる。** `坂戸` は `坂戸店` `坂戸市` `坂戸駅` の、`street` は `building` の部分文字列。`new-shop.cjs` の `buildReplacements()` がこの順序を持っている。
- **店舗一覧は全13ページに重複している。** 手で1つずつ直さない。
- `index.html` の `department` 配列は staging でも**本番ホストのURL**を使っている（ページ自身の og:url は stg なのに）。`new-shop.cjs` は隣の行からホストを読むので、この不一致に追従する。
- OGP画像は**3枚すべて必須**。`check-seo-metadata.js` は `shopImageByPage` に登録された店舗ページに対し、3枚の存在と寸法（1200×630 は600KB未満も）を検査する。1枚でも欠けると落ちる。

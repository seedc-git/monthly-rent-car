# monthly-rent-car.jp 変更タスク共通ルール

このルールは個別の依頼内容より優先する。Claude Code・Codex など、このリポジトリを扱う全AIエージェントに適用される。

## 環境

- リポジトリ: https://github.com/seedc-git/monthly-rent-car
- `staging` ブランチ = https://stg.monthly-rent-car.jp （push で GitHub Pages に自動反映）
- `main` ブランチ = https://monthly-rent-car.jp （push で Xserver に自動デプロイ＝即・本番公開）

## 作業開始前（必須）

1. 必ず `git fetch origin` し、`origin/staging`・`origin/main` の最新から作業する。手元の古いチェックアウトやローカルブランチから始めない。
2. 他のAIタスクが並行で同じリポジトリを触っている前提で動く。直近の `git log` と GitHub Actions の実行履歴を確認し、進行中の変更がないか見る。
3. 依頼された変更以外のファイルには触らない。既存のコミットを revert・上書きしない。

## 変更手順（必ずこの順番。スキップ禁止）

1. `origin/staging` を起点に変更を実装し、`staging` へ push する。
2. デプロイ完了を待ち、https://stg.monthly-rent-car.jp の該当ページで動作確認する。見た目だけでなく、リンク・ボタン・タップ領域が実際に機能するかまで確認する。
3. 依頼者に staging の確認用URL一覧を提示し、承認を得る。承認前に `main` に触らない。
4. 承認後、staging で確認したのと同一の変更だけを main 向けブランチに適用し、`main` への Pull Request を作成する（main への直接 push はブランチ保護で拒否される）。`staging` を `main` に丸ごとマージ・コピーすることは絶対にしない。
5. 依頼者が GitHub 上で PR を Merge すると本番デプロイが走る。Merge を依頼者に依頼し、デプロイ（Actions: Deploy production to Xserver）の成功を確認して本番URLで同じ動作確認をする。
6. 完了報告には「変更内容・コミットID・staging と本番それぞれの確認済みURL一覧」を必ず含める。

## main（本番）に絶対に入れてはいけないもの

- `CNAME` の変更（本番は monthly-rent-car.jp のまま。stg.monthly-rent-car.jp は staging 専用）
- `<meta name="robots" content="noindex, nofollow">`（staging 専用。本番に入ると検索から消える）
- `.github/workflows/` の削除、および依頼されていない変更（デプロイの仕組みが壊れる）
- 依頼されていないUI変更（staging に残っている未リリースの変更を巻き込まない）

## staging に絶対に入れてはいけないもの

- `CNAME` の削除・変更（stg.monthly-rent-car.jp のまま維持する）
- noindex メタタグの削除（staging の全HTMLページに必須。新規ページを staging に追加するときは必ず付ける）

## 実装ルール（過去の本番事故の再発防止）

- ページを追加・コピーする際は、そのページが参照する CSSクラス・JS・画像が「反映先ブランチに」全部存在するかを必ず確認する。共有 `styles.css` への依存が特に危険（過去、staging の styles.css 前提のページを main に入れて本番の固定CTAが機能しなくなる事故が発生した）。
- 新ページ固有のスタイルは共有 `styles.css` に追加せず、ページ専用CSSファイルに分離する（例: `shop/shop-contact.css` 方式）。
- 新規HTMLページには GA4 計測タグ（本番ホスト名ガード付き、ID: G-501JL6QG1N）を必ず含める。既存ページの head からスニペットをコピーする。全HTMLページを CI（Check GA tag）が検査し、欠けていると PR がマージできない・デプロイ前に検知される。
- 新規SEOページ（トップページ、`shop/**/index.html` など。`line.html` のような内部/遷移用HTMLは除く）を追加するときは、必ずOGP/Twitter metaを追加し、`sitemap.xml` にURLを追加する。CI（SEO pages must include OGP metadata, sitemap, and robots.txt）が検査する。
- `robots.txt` は staging と main で内容を分ける。staging は `Disallow: /` と `Sitemap: https://stg.monthly-rent-car.jp/sitemap.xml`、main は `Allow: /` と `Sitemap: https://monthly-rent-car.jp/sitemap.xml` にする。
- push が拒否されたら他タスクが先行している。force push は禁止。fetch → rebase → 動作確認をやり直してから push する。
- 変更は小さく、1目的1コミット。

## ゴール状態

自分のタスク完了時点で、担当した変更については staging と本番が同一内容であること。`staging` と `main` の恒常的な差分は「CNAME・noindex という staging 専用設定」だけに保つ。

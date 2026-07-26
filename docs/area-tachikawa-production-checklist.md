# 立川エリアランキングページ 本番公開チェックリスト

- staging URL: `https://stg.monthly-rent-car.jp/area/tachikawa/`
- 本番予定URL: `https://monthly-rent-car.jp/area/tachikawa/`
- canonical: `https://monthly-rent-car.jp/area/tachikawa/`
- 対象記事の基準日: 2026年7月26日

このチェックリストは、staging確認が完了し、依頼者から本番公開の明示的な承認を得た後に使用する。本番承認前は`main`への変更、production workflowの実行、本番サイトからの内部リンク追加を行わない。

## 1. 本番移行の開始条件

- [ ] staging URLがHTTP 200を返す。
- [ ] stagingに反映したコミットIDと、本番へ適用する差分を記録した。
- [ ] stagingの390px、768px、1440px表示と主要操作を確認した。
- [ ] 料金、サービス内容、店舗情報、問い合わせ先について担当者の承認を得た。
- [ ] 17画像すべての正式素材と利用権限が揃った。
- [ ] `docs/area-tachikawa-ranking-test-results.md`に重大・高優先度の未解決項目がない。
- [ ] 依頼者から本番公開の明示的な承認を得た。
- [ ] stagingブランチを`main`へ丸ごとマージせず、このページに必要な確認済み差分だけを本番用ブランチへ適用する。

## 2. 画像の差し替え

- [ ] `docs/area-tachikawa-ranking-assets.md`に記載した17スロットをすべて正式画像へ差し替えた。
- [ ] 外部サイトの画像・ロゴのダウンロード、直リンク、無断生成がない。
- [ ] 競合ロゴは掲載許可とブランドガイドラインを確認した正規素材である。
- [ ] `width`、`height`、`aspect-ratio`、`data-image-slot`が正しい。
- [ ] 画像内容に合わせてaltを確定し、装飾画像と隣接テキストに重複するロゴは`alt=""`にした。
- [ ] alt TODOコメント、仮画像、プレースホルダー、未設定表示が残っていない。
- [ ] 390px、768px、1440pxで画像、キャプション、CLS、横はみ出しを再確認した。
- [ ] 未設定画像が1つでもある場合は本番公開を中止する。

## 3. 料金・掲載条件の再確認

- [ ] 10社すべての公式サイト、公式料金表、利用規約を公開直前に再確認した。
- [ ] 東京マンスリーレンタカー立川店、ガッツレンタカー立川店、マンスリーゴー、GOGOマンスリーレンタカー、Maverickレンタカー八王子店、東京ビジネスレンタカー、日本レンタリース東京、ニコニコレンタカー、ニッポンレンタカー立川北口営業所、Jネットレンタカー立川店の掲載内容を確認した。
- [ ] すべての価格表示を税込へ統一し、税抜からの換算は10%で計算した。
- [ ] 1ヶ月料金と、12ヶ月契約等を前提にした実質月額を混同していない。
- [ ] 車両クラス、契約期間、CDWの込み・別、保険・補償、走行距離、配車・引取り条件の違いを明記した。
- [ ] 完全に同一条件ではない比較に「近い用途・カテゴリーでの比較」と明記した。
- [ ] 「最安」「No.1」「必ず安い」など、根拠のない断定を追加していない。
- [ ] `docs/area-tachikawa-ranking-source-audit.md`の根拠URL、確認日、未確認事項を更新した。
- [ ] 数値を変更した場合は、変更前、変更後、根拠URL、確認日を記録した。
- [ ] 実際に再調査した場合だけ、可視の最終更新日・料金調査日とArticle構造化データの日付を変更した。
- [ ] 可視本文、比較表、FAQ、構造化データの料金・条件が一致している。

## 4. 問い合わせリンク・共通UI

- [ ] 電話番号の表示が`050-1792-0800`、リンクが`tel:05017920800`である。
- [ ] メール・フォームのリンク先が`https://form.run/@monthly-rent-car`である。
- [ ] LINEのモバイルリンク先が`https://lin.ee/ojmETte`である。
- [ ] PCのLINE導線が既存の`line.html`を使用し、画面幅による既存の切り替え動作が機能する。
- [ ] 5箇所の本文CTAにform、LINE、telの正しいリンク先が設定されている。
- [ ] CTAタイトルがhero、rank1、price、support、finalの各位置に指定どおり配置されている。
- [ ] 各CTAに`data-cta-page="area-tachikawa"`がある。
- [ ] 各CTAの`data-cta-position`が`hero`、`rank1`、`price`、`support`、`final`のいずれかである。
- [ ] 各CTAの`data-cta-channel`が`form`、`line`、`tel`のいずれかである。
- [ ] ヘッダー、スマートフォンメニュー、固定CTAのロゴ、項目、順番、リンク先、色、アイコン、開閉、hover、focus、active状態が本番共通UIと一致している。
- [ ] 固定CTAと本文CTAが重ならず、スマートフォンの閲覧領域を過度に塞いでいない。
- [ ] ランキング表から競合サイトへ直接遷移せず、競合への大きなCTAがない。
- [ ] 競合公式サイトへのリンクが記事末尾の出典欄だけにあり、`target="_blank"`と`rel="nofollow noopener noreferrer"`がある。
- [ ] 内部リンクと出典リンクにリンク切れがない。

## 5. 本番SEO設定への切り替え

- [ ] title、H1、meta descriptionが確定仕様と完全一致している。
- [ ] canonicalが`https://monthly-rent-car.jp/area/tachikawa/`である。
- [ ] OGPとTwitter CardのURL、title、description、画像URLが本番ホスト向けである。
- [ ] 本番用HTMLから`<meta name="robots" content="noindex, nofollow">`を除去した。
- [ ] 本番URLのHTTPレスポンスに`X-Robots-Tag: noindex`または`nofollow`がない。
- [ ] 本番の`robots.txt`がクロールを許可し、本番サイトマップURLを参照している。
- [ ] 本番XMLサイトマップへ`https://monthly-rent-car.jp/area/tachikawa/`を1件だけ追加した。
- [ ] 本番サイトマップの`lastmod`を使用する場合、実際の更新日と一致している。
- [ ] 本番トップページや適切なエリア・店舗ページから、自然なアンカーテキストで内部リンクを追加した。
- [ ] stagingのXMLサイトマップには対象URLを追加していない。
- [ ] stagingから本番へのcanonical、本番からstagingへのリンクなど、環境をまたぐ誤リンクがない。
- [ ] ArticleまたはWebPage、ItemList、FAQPageの構造化データが可視内容と一致している。
- [ ] LocalBusinessを出力する場合は東京マンスリーレンタカー立川店だけで、名称、住所、電話、営業時間等が可視内容と一致している。
- [ ] BreadcrumbList、Review、AggregateRating、競合各社のLocalBusinessを出力していない。
- [ ] H1が1つだけで、パンくず、SNSシェアボタン、記事上部の日付表示がない。
- [ ] 公開日、最終更新日、料金・サービス調査日に`time`要素と正しい`datetime`がある。

## 6. stagingのインデックス保護とGitHub Pagesの制約

stagingはGitHub Pagesで配信される。GitHub Pagesは、リポジトリ内の`.htaccess`、一般的なホスティング向け`_headers`、サーバー側Basic認証、任意のHTTPレスポンスヘッダー設定を提供しない。そのため、リポジトリの変更だけではBasic認証と`X-Robots-Tag`を実装できない。

`robots.txt`の`Disallow: /`はクロール抑制であり、アクセス制限や完全なインデックス防止の代替にはならない。stagingではHTMLのmeta robotsを維持したうえで、権限がある場合はCloudflareを使用する。

### Cloudflareでの推奨設定

1. `stg.monthly-rent-car.jp`をCloudflareのプロキシ対象にする。
2. Response Header Transform RuleまたはWorkerを作成し、条件を`http.host eq "stg.monthly-rent-car.jp"`へ限定する。
3. stagingの全レスポンスへ`X-Robots-Tag: noindex, nofollow`を設定する。
4. Cloudflare Zero TrustでSelf-hosted Access Applicationを作成し、`stg.monthly-rent-car.jp/*`を対象にする。
5. 社内メールドメイン、指定メールアドレス、または許可したIdPグループだけをAllowにする。
6. Bypassポリシーを不用意に追加せず、静的アセットを含む表示と認証後の遷移を確認する。
7. `curl -I https://stg.monthly-rent-car.jp/area/tachikawa/`で`X-Robots-Tag`を確認する。
8. 未認証ブラウザではAccess画面、認証済みブラウザではHTTP 200とページ表示を確認する。

従来型のBasic認証が必須の場合は、認証機能を持つリバースプロキシまたは別のstagingホストをGitHub Pagesの前段に置く。認証IDやパスワードをHTML、JavaScript、GitHubリポジトリへ保存しない。Cloudflare権限がない場合は、上記を未実装事項として担当管理者へ引き継ぐ。

### 本番公開時の確認

- [ ] stagingのmeta robots、`robots.txt`の`Disallow: /`、Cloudflare Accessを維持した。
- [ ] Cloudflareの`X-Robots-Tag`ルールが`stg.monthly-rent-car.jp`だけに限定され、本番ホストへ波及していない。
- [ ] 本番に`X-Robots-Tag: noindex, nofollow`を付与する既存ルールがある場合は、削除またはstaging限定へ修正した。
- [ ] 本番URLとstaging URLの両方を`curl -I`で確認し、本番だけがインデックス可能な状態である。
- [ ] staging用`CNAME`、meta robots、robots.txtを本番へコピーしていない。

## 7. 本番デプロイと回帰確認

- [ ] 本番用ブランチの差分が承認済みの対象ページ、専用CSS、専用JavaScript、画像、必要ドキュメント、意図した本番SEO変更だけである。
- [ ] 本番トップページ、立川店ページ、その他の既存ページに意図しない差分がない。
- [ ] CIのGA4タグ検査とSEOメタデータ検査が成功した。
- [ ] 本番PRにstaging確認済みの記録を付け、必要な承認を得た。
- [ ] 本番デプロイ完了後、`https://monthly-rent-car.jp/area/tachikawa/`がHTTP 200を返す。
- [ ] 390px、768px、1440pxでページ全体の横はみ出し、表の横スクロール、固定CTA、画像、FAQを再確認した。
- [ ] JavaScript無効でも主要本文とFAQ回答を読める。
- [ ] キーボードでメニュー、FAQ、CTAを操作でき、focus-visibleが確認できる。
- [ ] 星評価のaria-label、見出し階層、表のcaption、thとtdを確認した。
- [ ] 本番トップページと本番立川店ページの表示・メニュー・固定CTAに変化がない。

## 8. Search Consoleと公開後の計測

- [ ] Google Search ConsoleのURL検査で本番URLを検査した。
- [ ] URL検査で取得可能、canonicalが本番URL、インデックス許可状態であることを確認した。
- [ ] 本番XMLサイトマップを送信または再送信し、対象URLが検出されることを確認した。
- [ ] 必要に応じて「インデックス登録をリクエスト」を実行した。
- [ ] 公開後に検索結果のtitle、description、canonical、構造化データの状態を継続確認する。
- [ ] 本番ホスト限定の既存GA4（`G-501JL6QG1N`）が読み込まれることを確認した。
- [ ] 5位置×3チャネルのCTAを各1回テストし、`area_tachikawa_cta_click`が重複なく送信されることを確認した。
- [ ] イベントパラメータ`position`、`channel`、`destination`がクリックしたCTAと一致している。
- [ ] form、LINE、telの遷移や起動を妨げずにイベントが送信される。
- [ ] GA4のDebugViewまたはリアルタイム表示でイベントを確認し、確認日時と結果を記録した。
- [ ] 公開後のSearch Consoleクエリ、表示回数、クリック率と、CTAイベント数を定期的に確認する。

## 9. 公開記録

- 本番承認者:
- 承認日時:
- staging確認コミット:
- 本番反映コミット:
- 本番デプロイ日時:
- 料金再確認日:
- 画像権利確認担当:
- Search Console確認日時:
- CTAイベント確認日時:
- 未解決事項:


# Monthly Rent-a-Car

Static website for マンスリーレンタカー.

## Branches

- `main`: production source for `monthly-rent-car.jp`
- `staging`: staging source for `stg.monthly-rent-car.jp`

## Production

Production files live at the repository root on the `main` branch:

- `index.html`
- `line.html`
- `styles.css`
- `script.js`
- `assets/`
- `shop/`

The production site is served from Xserver:

- URL: `https://monthly-rent-car.jp/`
- Deploy trigger: push to `main` or manual `workflow_dispatch`
- Workflow: `.github/workflows/deploy-production.yml`

Configure these GitHub Secrets before enabling production deployments:

- `XSERVER_FTP_SERVER`
- `XSERVER_FTP_USERNAME`
- `XSERVER_FTP_PASSWORD`
- `XSERVER_FTP_SERVER_DIR`

Then set this GitHub Variable to enable automatic production deploys on
`main` pushes:

- `PRODUCTION_DEPLOY_ENABLED=true`

`XSERVER_FTP_SERVER_DIR` should point to the production document root, for
example the relevant `public_html/` directory on Xserver.

## Staging

The `staging` branch is published by GitHub Pages:

- URL: `https://stg.monthly-rent-car.jp/`
- GitHub Pages source: `staging` branch, `/`

Staging pages should include `noindex, nofollow`.

## Helpful Article Carousel

The cards shown under `お役立ち記事` on the home page and every shop page
are managed from one registry:

- `data/media-articles.json`

The card title is read automatically from the target page's single `h1`.
Article URLs can use any internal directory, such as `/area/example/` or
`/column/example/`; they are not limited to `/area/`.

To add an article:

1. Add the article page and its responsive card images to the repository.
2. Add one object to `data/media-articles.json` in the desired carousel order.
3. Synchronize the static HTML:

   ```bash
   node tools/sync-media-articles.cjs
   ```

4. Verify that every target page is synchronized:

   ```bash
   node tools/sync-media-articles.cjs --check
   ```

The committed output remains static HTML, so article links are present without
client-side rendering. CI fails when the registry, images, target H1, home page,
or any shop carousel is missing or out of sync. Do not edit the generated card
markup between the `media-articles:start` and `media-articles:end` comments.

## Branch Policy

- Make and verify changes on `staging` first.
- Publish staging through GitHub Pages at `stg.monthly-rent-car.jp`.
- Promote verified changes to `main` for production.
- Do not use a `stg/` directory inside `main`; staging is branch based.

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

## Branch Policy

- Make and verify changes on `staging` first.
- Publish staging through GitHub Pages at `stg.monthly-rent-car.jp`.
- Promote verified changes to `main` for production.
- Do not use a `stg/` directory inside `main`; staging is branch based.

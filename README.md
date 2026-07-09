# Tokyo Monthly Rent-a-Car

Static website for 東京マンスリーレンタカー.

## Branches

- `main`: production source for `monthly-rent-car.jp`
- `staging`: staging source for `stg.monthly-rent-car.jp`

## Production

Production files live at the repository root:

- `index.html`
- `line.html`
- `styles.css`
- `script.js`
- `assets/`
- `shop/`

The production site is served from Xserver. Deploying from GitHub to Xserver
should be handled by GitHub Actions after FTP/SFTP secrets are configured.

## Staging

The `staging` branch is published by GitHub Pages:

- URL: `https://stg.monthly-rent-car.jp/`
- GitHub Pages source: `staging` branch, `/`

Staging pages should include `noindex, nofollow`.

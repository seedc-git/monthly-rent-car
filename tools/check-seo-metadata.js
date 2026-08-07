const fs = require("fs");
const path = require("path");

const root = process.cwd();
const stagingHost = "stg.monthly-rent-car.jp";
const productionHost = "monthly-rent-car.jp";
const productionThanksUrl = `https://${productionHost}/thanks/`;
const cnamePath = path.join(root, "CNAME");
const isStaging = fs.existsSync(cnamePath) && fs.readFileSync(cnamePath, "utf8").trim() === stagingHost;
const host = isStaging ? stagingHost : productionHost;
const baseUrl = `https://${host}`;
const internalPages = new Set([
  "google-review/review.html",
  "line.html",
  "thanks/index.html",
]);
const productionNoindexPages = new Set([
  "thanks/index.html",
]);
const sitemapExcludedPages = new Set(
  isStaging
    ? [
        // Staging-only page. Add it to the production sitemap when publication is approved.
        "area/tachikawa/index.html",
      ]
    : [],
);

const requiredOgProperties = [
  "og:type",
  "og:site_name",
  "og:title",
  "og:description",
  "og:url",
  "og:image",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
];

const shopImageByPage = {
  "shop/tokyo/shinjuku/index.html": { slug: "shinjuku", name: "新宿" },
  "shop/tokyo/ikebukuro/index.html": { slug: "ikebukuro", name: "池袋" },
  "shop/tokyo/tachikawa/index.html": { slug: "tachikawa", name: "立川" },
  "shop/kanagawa/kawasaki/index.html": { slug: "kawasaki", name: "川崎" },
  "shop/saitama/tokorozawa/index.html": { slug: "tokorozawa", name: "所沢" },
  "shop/saitama/omiya/index.html": { slug: "omiya", name: "大宮" },
  "shop/saitama/urawa/index.html": { slug: "urawa", name: "浦和" },
  "shop/saitama/kawagoe/index.html": { slug: "kawagoe", name: "川越" },
  "shop/saitama/sakado/index.html": { slug: "sakado", name: "坂戸" },
  "shop/saitama/wako/index.html": { slug: "wako", name: "和光" },
  "shop/saitama/asakadai/index.html": { slug: "asakadai", name: "朝霞台" },
};

const rentalPriceGuideImage = {
  path: "/assets/img/guide/rental-car-one-month-price/rental-car-one-month-hero-1200.webp",
  width: "1200",
  height: "675",
};

const articleImageByPage = {
  "area/tachikawa/index.html": {
    path: "/assets/img/area/tachikawa/tachikawa-station-hero-20260730.webp",
    width: "1077",
    height: "500",
  },
  "guide/rental-car-one-month-price/index.html": {
    path: "/assets/img/guide/rental-car-one-month-price/rental-car-one-month-hero-1200.webp",
    width: "1200",
    height: "675",
  },
  "guide/monthly-rentacar-cheap-comparison/index.html": {
    path: "/assets/img/guide/monthly-rentacar-cheap-comparison/monthly-rentacar-cheap-comparison-hero-1200.webp",
    width: "1200",
    height: "675",
  },
};

const shopLocalGuideByPage = {
  "shop/kanagawa/kawasaki/index.html": {
    slug: "kawasaki",
    brand: "神奈川マンスリーレンタカー",
    store: "川崎店",
    regionHeading: "川崎市のマンスリーレンタカー",
    stationFact: "川崎駅・京急川崎駅から徒歩3分",
    neighborhood: "神奈川県川崎市川崎区砂子",
    stationArea: "川崎駅・京急川崎駅周辺",
    mapLink: "https://www.google.com/maps/search/?api=1&query=%E3%82%B1%E3%82%A4%E3%83%BB%E3%82%B8%E3%82%A7%E3%82%A4%E7%A0%82%E5%AD%90%E3%83%93%E3%83%AB%20%E7%A5%9E%E5%A5%88%E5%B7%9D%E7%9C%8C%E5%B7%9D%E5%B4%8E%E5%B8%82%E5%B7%9D%E5%B4%8E%E5%8C%BA%E7%A0%82%E5%AD%901%E4%B8%81%E7%9B%AE5-1",
    mapTarget: "ケイ・ジェイ砂子ビル",
  },
  "shop/saitama/asakadai/index.html": {
    slug: "asakadai",
    brand: "埼玉マンスリーレンタカー",
    store: "朝霞台店",
    regionHeading: "朝霞市のマンスリーレンタカー",
    stationFact: "朝霞台駅・北朝霞駅から徒歩3分",
    neighborhood: "埼玉県朝霞市東弁財",
    stationArea: "朝霞台駅・北朝霞駅周辺",
    mapLink: "https://maps.app.goo.gl/KcqDdD49U6wcEPKM7",
  },
  "shop/saitama/kawagoe/index.html": {
    slug: "kawagoe",
    brand: "埼玉マンスリーレンタカー",
    store: "川越店",
    regionHeading: "川越市のマンスリーレンタカー",
    stationFact: "川越駅から徒歩3分",
    neighborhood: "埼玉県川越市脇田町",
    stationArea: "川越駅周辺",
    mapLink: "https://www.google.com/maps/search/?api=1&query=%E3%83%A9%E3%82%A4%E3%83%95%E3%82%B7%E3%83%86%E3%82%A3%20%E5%9F%BC%E7%8E%89%E7%9C%8C%E5%B7%9D%E8%B6%8A%E5%B8%82%E8%84%87%E7%94%B0%E7%94%BA23-5",
    mapTarget: "ライフシティ",
  },
  "shop/saitama/omiya/index.html": {
    slug: "omiya",
    brand: "埼玉マンスリーレンタカー",
    store: "大宮店",
    regionHeading: "さいたま市大宮区のマンスリーレンタカー",
    stationFact: "大宮駅から徒歩6分",
    neighborhood: "埼玉県さいたま市大宮区桜木町",
    stationArea: "大宮駅周辺",
    mapLink: "https://maps.app.goo.gl/5sY7SC9XVLdPpFbH7",
  },
  "shop/saitama/sakado/index.html": {
    slug: "sakado",
    brand: "埼玉マンスリーレンタカー",
    store: "坂戸店",
    regionHeading: "坂戸市のマンスリーレンタカー",
    stationFact: "坂戸駅から徒歩3分",
    neighborhood: "埼玉県坂戸市日の出町",
    stationArea: "坂戸駅周辺",
    mapLink: "https://www.google.com/maps/search/?api=1&query=%E3%82%B5%E3%83%B3%E3%83%A9%E3%82%A4%E3%82%BA%E3%83%97%E3%83%A9%E3%82%B6A%20%E5%9F%BC%E7%8E%89%E7%9C%8C%E5%9D%82%E6%88%B8%E5%B8%82%E6%97%A5%E3%81%AE%E5%87%BA%E7%94%BA16-7",
    mapTarget: "サンライズプラザA",
  },
  "shop/saitama/tokorozawa/index.html": {
    slug: "tokorozawa",
    brand: "埼玉マンスリーレンタカー",
    store: "所沢店",
    regionHeading: "所沢市のマンスリーレンタカー",
    stationFact: "所沢駅から徒歩6分",
    neighborhood: "埼玉県所沢市くすのき台",
    stationArea: "所沢駅周辺",
    mapLink: "https://maps.app.goo.gl/TGJyoykc9mBt9Pj49",
  },
  "shop/saitama/urawa/index.html": {
    slug: "urawa",
    brand: "埼玉マンスリーレンタカー",
    store: "浦和店",
    regionHeading: "さいたま市浦和区のマンスリーレンタカー",
    stationFact: "浦和駅から徒歩4分",
    neighborhood: "埼玉県さいたま市浦和区高砂",
    stationArea: "浦和駅周辺",
    mapLink: "https://www.google.com/maps/search/?api=1&query=%E3%83%95%E3%82%A1%E3%83%BC%E3%82%B9%E3%83%88%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC%E3%83%93%E3%83%AB%20%E5%9F%BC%E7%8E%89%E7%9C%8C%E3%81%95%E3%81%84%E3%81%9F%E3%81%BE%E5%B8%82%E6%B5%A6%E5%92%8C%E5%8C%BA%E9%AB%98%E7%A0%822-6-3",
    mapTarget: "ファーストセンタービル",
  },
  "shop/saitama/wako/index.html": {
    slug: "wako",
    brand: "埼玉マンスリーレンタカー",
    store: "和光店",
    regionHeading: "和光市のマンスリーレンタカー",
    stationFact: "和光市駅南口から徒歩6分",
    neighborhood: "埼玉県和光市本町",
    stationArea: "和光市駅周辺",
    mapLink: "https://maps.app.goo.gl/R78ztKb9FisrKST7A",
  },
  "shop/tokyo/ikebukuro/index.html": {
    slug: "ikebukuro",
    brand: "東京マンスリーレンタカー",
    store: "池袋店",
    regionHeading: "池袋のマンスリーレンタカー",
    stationFact: "池袋駅から徒歩6分",
    neighborhood: "東京都豊島区池袋",
    stationArea: "池袋駅周辺",
    mapLink: "https://maps.app.goo.gl/rrfbmsYPDW6Y6JM48",
  },
  "shop/tokyo/shinjuku/index.html": {
    slug: "shinjuku",
    brand: "東京マンスリーレンタカー",
    store: "新宿店",
    regionHeading: "新宿のマンスリーレンタカー",
    stationFact: "新宿駅から徒歩7分",
    neighborhood: "東京都新宿区西新宿",
    stationArea: "新宿駅周辺",
    mapLink: "https://maps.app.goo.gl/BqTq1qFQVadQsBfW7",
  },
};

const tachikawaStorePhotos = [
  {
    file: "tachikawa-service-vehicle-cleaning-20260802",
    alt: "東京マンスリーレンタカー立川店で車両を清掃するスタッフ",
  },
  {
    file: "tachikawa-service-plan-consultation-20260802",
    alt: "東京マンスリーレンタカー立川店で料金プランを案内するスタッフ",
  },
  {
    file: "tachikawa-service-staff-guidance-20260802",
    alt: "東京マンスリーレンタカー立川店で利用者を迎えるスタッフ",
  },
  {
    file: "tachikawa-service-key-handover-20260802",
    alt: "東京マンスリーレンタカー立川店で鍵を引き渡すスタッフ",
  },
];

const ikebukuroStorePhotos = [
  {
    file: "ikebukuro-service-staff-and-vehicle-20260803",
    alt: "東京マンスリーレンタカー池袋店で車両と並ぶスタッフ3名",
  },
  {
    file: "ikebukuro-service-interior-preparation-20260803",
    alt: "東京マンスリーレンタカー池袋店で車内マットを準備するスタッフ",
  },
  {
    file: "ikebukuro-service-vehicle-inspection-20260803",
    alt: "東京マンスリーレンタカー池袋店でタブレットを使って車両を点検するスタッフ",
  },
  {
    file: "ikebukuro-service-engine-inspection-20260803",
    alt: "東京マンスリーレンタカー池袋店でエンジンルームを点検するスタッフ",
  },
];

const shinjukuStorePhotos = [
  {
    file: "shinjuku-service-controls-guidance-20260803",
    alt: "東京マンスリーレンタカー新宿店で車内の操作方法を案内するスタッフ",
  },
  {
    file: "shinjuku-service-key-handover-20260803",
    alt: "東京マンスリーレンタカー新宿店で車の鍵を引き渡すスタッフ",
  },
  {
    file: "shinjuku-service-vehicle-cleaning-20260803",
    alt: "東京マンスリーレンタカー新宿店で車内を清掃するスタッフ",
  },
  {
    file: "shinjuku-service-staff-and-vehicle-20260803",
    alt: "東京マンスリーレンタカー新宿店で軽自動車と並ぶスタッフ2名",
  },
];

const omiyaStorePhotos = [
  {
    file: "omiya-service-evening-reservation-support-20260803",
    alt: "埼玉マンスリーレンタカー大宮店で予約問い合わせに対応するスタッフ",
  },
  {
    file: "omiya-service-return-inspection-20260803",
    alt: "埼玉マンスリーレンタカー大宮店で利用者と返却車両のタイヤを確認するスタッフ",
  },
  {
    file: "omiya-service-air-conditioner-inspection-20260803",
    alt: "埼玉マンスリーレンタカー大宮店で車内のエアコン温度を確認するスタッフ",
  },
  {
    file: "omiya-service-evening-return-inspection-20260803",
    alt: "埼玉マンスリーレンタカー大宮店で利用者と夕方の返却車両を確認するスタッフ",
  },
];

const asakadaiStorePhotos = [
  {
    file: "asakadai-service-phone-reservation-support-20260803",
    alt: "埼玉マンスリーレンタカー朝霞台店で電話予約に対応するスタッフ",
  },
  {
    file: "asakadai-service-family-luggage-loading-20260803",
    alt: "埼玉マンスリーレンタカー朝霞台店で利用者家族の荷物を車両へ積み込むスタッフ",
  },
  {
    file: "asakadai-service-vehicle-key-handover-20260803",
    alt: "埼玉マンスリーレンタカー朝霞台店で利用者へ車両の鍵を引き渡すスタッフ",
  },
  {
    file: "asakadai-service-child-seat-installation-20260803",
    alt: "埼玉マンスリーレンタカー朝霞台店でチャイルドシートを取り付けるスタッフ",
  },
];

const tokorozawaStorePhotos = [
  {
    file: "tokorozawa-service-vehicle-cleaning-20260803",
    alt: "埼玉マンスリーレンタカー所沢店で車両清掃後の軽自動車と並ぶスタッフ2名",
  },
  {
    file: "tokorozawa-service-contract-signing-20260803",
    alt: "埼玉マンスリーレンタカー所沢店で利用者の契約手続きを案内するスタッフ",
  },
  {
    file: "tokorozawa-service-station-key-handover-20260803",
    alt: "埼玉マンスリーレンタカー所沢店で駅前の利用者へ車両の鍵を引き渡すスタッフ",
  },
  {
    file: "tokorozawa-service-rear-seat-guidance-20260803",
    alt: "埼玉マンスリーレンタカー所沢店で利用者へ軽自動車の後部座席を案内するスタッフ",
  },
];

const kawagoeStorePhotos = [
  {
    file: "kawagoe-service-spacia-key-handover-20260804",
    alt: "埼玉マンスリーレンタカー川越店で利用者にスペーシアの鍵を両手で渡すスタッフ",
  },
  {
    file: "kawagoe-service-wagonr-luggage-loading-20260804",
    alt: "埼玉マンスリーレンタカー川越店で利用者の荷物をワゴンRへ積み込むスタッフ",
  },
  {
    file: "kawagoe-service-dayz-condition-check-20260804",
    alt: "埼玉マンスリーレンタカー川越店で利用者とデイズの車両状態を確認するスタッフ",
  },
  {
    file: "kawagoe-service-tanto-washing-20260804",
    alt: "埼玉マンスリーレンタカー川越店でタントを洗車するスタッフ",
  },
];

const kawasakiStorePhotos = [
  {
    file: "kawasaki-service-nbox-key-handover-20260805",
    alt: "神奈川マンスリーレンタカー川崎店で利用者にN-BOXの鍵を引き渡すスタッフ",
  },
  {
    file: "kawasaki-service-spacia-business-handover-20260805",
    alt: "神奈川マンスリーレンタカー川崎店でスペーシアの車両受け渡しについて利用者へ説明するスタッフ",
  },
  {
    file: "kawasaki-service-rainy-nwgn-key-handover-20260805",
    alt: "神奈川マンスリーレンタカー川崎店で雨天時に利用者へN-WGNの鍵を引き渡すスタッフ",
  },
  {
    file: "kawasaki-service-alto-couple-key-handover-20260805",
    alt: "神奈川マンスリーレンタカー川崎店で利用者2名へアルトの鍵を引き渡すスタッフ",
  },
];

const wakoStorePhotos = [
  {
    file: "wako-service-staff-and-vehicle-20260803",
    alt: "埼玉マンスリーレンタカー和光店で軽自動車と並ぶスタッフ2名",
  },
  {
    file: "wako-service-plan-guidance-20260803",
    alt: "埼玉マンスリーレンタカー和光店で車種と料金プランを案内するスタッフ",
  },
  {
    file: "wako-service-vehicle-cleaning-20260803",
    alt: "埼玉マンスリーレンタカー和光店で軽自動車を清掃するスタッフ",
  },
  {
    file: "wako-service-staff-welcome-20260803",
    alt: "埼玉マンスリーレンタカー和光店の前で軽自動車と並ぶスタッフ2名",
  },
];

let hasError = false;

function fail(file, message) {
  hasError = true;
  console.error(`::error file=${file}::${message}`);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function walk(dir) {
  const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      files.push(...walk(rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

function pageUrlFor(file) {
  if (file === "index.html") return `${baseUrl}/`;
  if (file.endsWith("/index.html")) return `${baseUrl}/${file.slice(0, -"index.html".length)}`;
  return `${baseUrl}/${file}`;
}

function extractFirst(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim().replace(/\s+/g, " ") : "";
}

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

function pngDimensions(file) {
  const data = fs.readFileSync(path.join(root, file));
  const signature = data.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || data.length < 24) return null;
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

function jpegDimensions(file) {
  const data = fs.readFileSync(path.join(root, file));
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return null;

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3,
    0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb,
    0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;

  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < data.length && data[offset] === 0xff) offset += 1;
    if (offset >= data.length) break;

    const marker = data[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > data.length) return null;

    const segmentLength = data.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > data.length) return null;
    if (startOfFrameMarkers.has(marker) && segmentLength >= 7) {
      return [data.readUInt16BE(offset + 5), data.readUInt16BE(offset + 3)];
    }
    offset += segmentLength;
  }

  return null;
}

function checkPng(file, expectedWidth, expectedHeight, page) {
  if (!fs.existsSync(path.join(root, file))) {
    fail(page, `missing OGP image: ${file}`);
    return;
  }
  const dimensions = pngDimensions(file);
  if (!dimensions || dimensions[0] !== expectedWidth || dimensions[1] !== expectedHeight) {
    fail(page, `${file} must be ${expectedWidth}x${expectedHeight}`);
  }
}

function checkJpeg(file, expectedWidth, expectedHeight, maxBytes, page) {
  const absolutePath = path.join(root, file);
  if (!fs.existsSync(absolutePath)) {
    fail(page, `missing OGP image: ${file}`);
    return;
  }
  const dimensions = jpegDimensions(file);
  if (!dimensions || dimensions[0] !== expectedWidth || dimensions[1] !== expectedHeight) {
    fail(page, `${file} must be a ${expectedWidth}x${expectedHeight} JPEG`);
  }
  const bytes = fs.statSync(absolutePath).size;
  if (bytes >= maxBytes) {
    fail(page, `${file} must be smaller than ${maxBytes} bytes, found ${bytes}`);
  }
}

function checkShopImages(file, html) {
  const shop = shopImageByPage[file];
  if (!shop) return;

  const sourceLandscapeAsset = `assets/ogp/shops/${shop.slug}-1731x909.png`;
  const socialAsset = `assets/ogp/shops/${shop.slug}-1200x630.jpg`;
  const squareAsset = `assets/ogp/shops/${shop.slug}-1200x1200.png`;
  const socialUrl = `${baseUrl}/${socialAsset}`;
  const squareUrl = `${baseUrl}/${squareAsset}`;
  const expectedAlt = `マンスリーレンタカー ${shop.name}店 1日あたり800円〜`;

  checkPng(sourceLandscapeAsset, 1731, 909, file);
  checkJpeg(socialAsset, 1200, 630, 600000, file);
  checkPng(squareAsset, 1200, 1200, file);

  if (countMatches(html, /property="og:image:type"/g) !== 1) {
    fail(file, "og:image:type must appear exactly once");
  }
  if (!html.includes('<meta property="og:image:type" content="image/jpeg">')) {
    fail(file, "og:image:type must be image/jpeg");
  }
  if (!html.includes(`<meta property="og:image:alt" content="${expectedAlt}">`)) {
    fail(file, `og:image:alt must be: ${expectedAlt}`);
  }
  if (countMatches(html, /name="twitter:image"/g) !== 1) {
    fail(file, "twitter:image must appear exactly once");
  }
  if (!html.includes(`<meta name="twitter:image" content="${socialUrl}">`)) {
    fail(file, `twitter:image must be ${socialUrl}`);
  }
  if (!html.includes(`<meta name="twitter:image:alt" content="${expectedAlt}">`)) {
    fail(file, `twitter:image:alt must be: ${expectedAlt}`);
  }

  const jsonLd = [...html.matchAll(/<script\s+type="application\/ld\+json">\s*([\s\S]*?)<\/script>/g)];
  const webPages = [];
  for (const match of jsonLd) {
    try {
      const item = JSON.parse(match[1]);
      if (item["@type"] === "WebPage") webPages.push(item);
    } catch (error) {
      fail(file, `invalid JSON-LD: ${error.message}`);
    }
  }
  if (webPages.length !== 1) {
    fail(file, `shop page must contain one WebPage JSON-LD object, found ${webPages.length}`);
    return;
  }

  const webPage = webPages[0];
  const expectedPageUrl = pageUrlFor(file);
  const expectedTitle = extractFirst(html, /<title>([\s\S]*?)<\/title>/);
  if (webPage["@id"] !== `${expectedPageUrl}#webpage`) {
    fail(file, `WebPage @id must be ${expectedPageUrl}#webpage`);
  }
  if (webPage.url !== expectedPageUrl) {
    fail(file, `WebPage url must be ${expectedPageUrl}`);
  }
  if (webPage.name !== expectedTitle) {
    fail(file, "WebPage name must match title");
  }
  if (webPage.inLanguage !== "ja-JP") {
    fail(file, "WebPage inLanguage must be ja-JP");
  }

  const primaryImage = webPage.primaryImageOfPage;
  if (
    !primaryImage ||
    primaryImage["@type"] !== "ImageObject" ||
    primaryImage.url !== squareUrl ||
    primaryImage.contentUrl !== squareUrl ||
    primaryImage.width !== 1200 ||
    primaryImage.height !== 1200 ||
    primaryImage.caption !== expectedAlt
  ) {
    fail(file, `primaryImageOfPage must describe ${squareUrl}`);
  }
}

function checkTachikawaStorePhotos(file, html) {
  if (file !== "shop/tokyo/tachikawa/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Tachikawa store must not use Wako store gallery photos");
  }

  for (const photo of tachikawaStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
  }
}

function checkWakoStorePhotos(file, html) {
  if (file !== "shop/saitama/wako/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Wako store must use its current dedicated gallery photos");
  }
  if (!html.includes(`"${baseUrl}/assets/img/wako-store-exterior.png"`)) {
    fail(file, "Wako structured data must include the store exterior");
  }

  for (const photo of wakoStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Wako structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkOmiyaStorePhotos(file, html) {
  if (file !== "shop/saitama/omiya/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Omiya store must use its dedicated gallery photos");
  }
  const requiredStructuredData = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/saitama/omiya/#store"`,
    `"${baseUrl}/assets/img/omiya-store-exterior.png"`,
  ];
  for (const snippet of requiredStructuredData) {
    if (!html.includes(snippet)) {
      fail(file, `missing Omiya structured data: ${snippet}`);
    }
  }

  for (const photo of omiyaStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Omiya structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkAsakadaiStorePhotos(file, html) {
  if (file !== "shop/saitama/asakadai/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Asakadai store must use its dedicated gallery photos");
  }
  const requiredStructuredData = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/saitama/asakadai/#store"`,
    `"${baseUrl}/assets/img/asakadai-store-exterior.png"`,
  ];
  for (const snippet of requiredStructuredData) {
    if (!html.includes(snippet)) {
      fail(file, `missing Asakadai structured data: ${snippet}`);
    }
  }

  for (const photo of asakadaiStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Asakadai structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkTokorozawaStorePhotos(file, html) {
  if (file !== "shop/saitama/tokorozawa/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Tokorozawa store must use its dedicated gallery photos");
  }
  const requiredStructuredData = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/saitama/tokorozawa/#store"`,
    `"${baseUrl}/assets/img/tokorozawa-store-exterior.png"`,
  ];
  for (const snippet of requiredStructuredData) {
    if (!html.includes(snippet)) {
      fail(file, `missing Tokorozawa structured data: ${snippet}`);
    }
  }

  for (const photo of tokorozawaStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Tokorozawa structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkKawagoeStorePhotos(file, html) {
  if (file !== "shop/saitama/kawagoe/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Kawagoe store must use its dedicated gallery photos");
  }
  const requiredStructuredData = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/saitama/kawagoe/#store"`,
    `"${baseUrl}/assets/img/kawagoe-store-exterior.png"`,
  ];
  for (const snippet of requiredStructuredData) {
    if (!html.includes(snippet)) {
      fail(file, `missing Kawagoe structured data: ${snippet}`);
    }
  }

  for (const photo of kawagoeStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Kawagoe structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkKawasakiStorePhotos(file, html) {
  if (file !== "shop/kanagawa/kawasaki/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Kawasaki store must use its dedicated gallery photos");
  }
  const requiredStructuredData = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/kanagawa/kawasaki/#store"`,
    `"${baseUrl}/assets/img/kawasaki-store-exterior.webp"`,
  ];
  for (const snippet of requiredStructuredData) {
    if (!html.includes(snippet)) {
      fail(file, `missing Kawasaki structured data: ${snippet}`);
    }
  }

  for (const photo of kawasakiStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Kawasaki structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkShinjukuStorePhotos(file, html) {
  if (file !== "shop/tokyo/shinjuku/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Shinjuku store must use its dedicated gallery photos");
  }
  const requiredStructuredData = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/tokyo/shinjuku/#store"`,
    `"${baseUrl}/assets/img/shinjuku-store-exterior.png"`,
  ];
  for (const snippet of requiredStructuredData) {
    if (!html.includes(snippet)) {
      fail(file, `missing Shinjuku structured data: ${snippet}`);
    }
  }

  for (const photo of shinjukuStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Shinjuku structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkIkebukuroStorePhotos(file, html) {
  if (file !== "shop/tokyo/ikebukuro/index.html") return;

  if (html.includes("wako-store-gallery-")) {
    fail(file, "Ikebukuro store must use its dedicated gallery photos");
  }
  const requiredStructuredData = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/tokyo/ikebukuro/#store"`,
    `"${baseUrl}/assets/img/ikebukuro-store-exterior.png"`,
  ];
  for (const snippet of requiredStructuredData) {
    if (!html.includes(snippet)) {
      fail(file, `missing Ikebukuro structured data: ${snippet}`);
    }
  }

  for (const photo of ikebukuroStorePhotos) {
    const fullAsset = path.join(root, "assets", "img", `${photo.file}.webp`);
    const mobileAsset = path.join(root, "assets", "img", `${photo.file}-640.webp`);
    if (!fs.existsSync(fullAsset)) fail(file, `missing store photo: ${photo.file}.webp`);
    if (!fs.existsSync(mobileAsset)) fail(file, `missing store photo: ${photo.file}-640.webp`);
    if (!html.includes(`src="../../../assets/img/${photo.file}.webp"`)) {
      fail(file, `missing store photo markup: ${photo.file}.webp`);
    }
    if (!html.includes(`alt="${photo.alt}"`)) {
      fail(file, `store photo alt must be: ${photo.alt}`);
    }
    if (!html.includes(`"${baseUrl}/assets/img/${photo.file}.webp"`)) {
      fail(file, `Ikebukuro structured data must include: ${photo.file}.webp`);
    }
  }
}

function checkTachikawaLocationData(file, html) {
  if (file !== "shop/tokyo/tachikawa/index.html") return;

  const requiredSnippets = [
    '"@type": "AutoRental"',
    `"@id": "${baseUrl}/shop/tokyo/tachikawa/#store"`,
    '"streetAddress": "曙町2-22-20 立川センタービル"',
    '"latitude": 35.6988456',
    '"longitude": 139.4174677',
    '"hasMap": "https://maps.app.goo.gl/XD797tzPuGeetZ1m8"',
    'href="https://maps.app.goo.gl/XD797tzPuGeetZ1m8"',
    'src="https://www.google.com/maps/embed?pb=',
    '!1d3240.112641817858!2d139.4174677!3d35.6988456',
    '1s0x60188d4e7f58340d%3A0x4e6890ca72d030a1',
    'title="東京マンスリーレンタカー立川店の地図"',
    'referrerpolicy="strict-origin-when-cross-origin"',
    'min-height: 202px;',
    'Googleマップで立川店を見る',
  ];

  for (const snippet of requiredSnippets) {
    if (!html.includes(snippet)) fail(file, `missing Tachikawa location data: ${snippet}`);
  }
}

function escapeHtmlAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function checkShopLocalGuide(file, html) {
  const guide = shopLocalGuideByPage[file];
  if (!guide) return;

  if (!fs.existsSync(path.join(root, "shop", "store-local-intro.css"))) {
    fail(file, "missing shared local-intro stylesheet: shop/store-local-intro.css");
  }

  const expectedHeading = `${guide.regionHeading}｜${guide.brand}${guide.store}`;
  const headings = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
  if (headings.length !== 1) {
    fail(file, `shop page must contain exactly one h1, found ${headings.length}`);
    return;
  }

  const [, attributes, contents] = headings[0];
  const headingText = contents.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
  const headingId = `${guide.slug}-store-title`;
  if (headingText !== expectedHeading) {
    fail(file, `shop h1 must be: ${expectedHeading}`);
  }
  if (/\bvisually-hidden\b/.test(attributes)) {
    fail(file, "shop h1 must be visible, not visually-hidden");
  }
  if (!attributes.includes(`id="${headingId}"`)) {
    fail(file, `shop h1 must use id="${headingId}"`);
  }
  if (!html.includes(`aria-labelledby="${headingId}"`)) {
    fail(file, "service-area must be labelled by the visible shop h1");
  }
  if (countMatches(html, /class="section-head store-local-heading"/g) !== 1) {
    fail(file, "shop h1 must be integrated into one store-local-heading panel");
  }
  if (!html.includes('class="store-local-heading-label"')) {
    fail(file, "shop heading must include the visible guide label");
  }
  if (!html.includes(`${guide.store} 店舗案内`)) {
    fail(file, `shop heading guide label must be: ${guide.store} 店舗案内`);
  }
  if (!html.includes('../../../assets/img/tachikawa-store-heading-frame-20260803.webp')) {
    fail(file, "shop heading must use the approved decorative frame");
  }
  if (!html.includes('<link rel="stylesheet" href="../../store-local-intro.css?v=20260807">')) {
    fail(file, "shop page must load the shared local-intro stylesheet");
  }

  const summaryMatches = html.match(/class="store-local-summary"/g) || [];
  if (summaryMatches.length !== 1) {
    fail(file, `store-local-summary must appear exactly once, found ${summaryMatches.length}`);
  }
  const requiredFacts = [
    `${guide.brand}${guide.store}は、`,
    guide.stationFact,
    guide.neighborhood,
    "1ヶ月以上の長期利用向け",
    "1ヶ月24,000円（税抜）から",
    `${guide.stationArea}での受け渡し`,
    "ご希望住所への配送もご相談ください",
    "10:00〜19:00",
    "無休",
  ];
  for (const fact of requiredFacts) {
    if (!html.includes(fact)) fail(file, `shop summary is missing: ${fact}`);
  }

  const headingIndex = html.indexOf(`id="${headingId}"`);
  const summaryIndex = html.indexOf('class="store-local-summary"');
  const photoIndex = html.indexOf(`class="${guide.slug}-access-main-photo"`);
  if (!(headingIndex < summaryIndex && summaryIndex < photoIndex)) {
    fail(file, "shop summary must stay directly between the visible h1 and exterior photo");
  }

  if (countMatches(html, /class="store-local-map-embed"/g) !== 1) {
    fail(file, "shop page must contain exactly one embedded Google map");
  }
  if (countMatches(html, /class="store-local-map-open-link"/g) !== 1) {
    fail(file, "shop page must contain exactly one external Google map link");
  }
  if (!html.includes('src="https://www.google.com/maps?q=')) {
    fail(file, "embedded map must use a Google Maps query URL");
  }
  if (!html.includes("&amp;z=17&amp;hl=ja&amp;output=embed")) {
    fail(file, "embedded map must use the approved initial zoom and Japanese locale");
  }
  if (!html.includes(`title="${guide.brand}${guide.store}の地図"`)) {
    fail(file, "embedded map title must identify the shop");
  }
  for (const attribute of [
    'loading="lazy"',
    'referrerpolicy="strict-origin-when-cross-origin"',
    "allowfullscreen",
  ]) {
    if (!html.includes(attribute)) fail(file, `embedded map is missing: ${attribute}`);
  }
  if (!html.includes(`Googleマップで${guide.store}を見る`)) {
    fail(file, `external map link must identify ${guide.store}`);
  }

  const escapedMapLink = escapeHtmlAttribute(guide.mapLink);
  if (countMatches(html, new RegExp(`href="${escapedMapLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g")) !== 2) {
    fail(file, "address MAP button and external map link must use the same location URL");
  }
  if (!html.includes(`"hasMap": "${guide.mapLink}"`)) {
    fail(file, "AutoRental.hasMap must match the visible Google Maps links");
  }
  if (
    guide.mapTarget &&
    !html.includes(guide.mapTarget) &&
    !html.includes(encodeURIComponent(guide.mapTarget))
  ) {
    fail(file, `building-based map must target: ${guide.mapTarget}`);
  }

  const accessInfoIndex = html.indexOf(`class="${guide.slug}-access-info"`);
  const mapIndex = html.indexOf('class="store-local-map-embed"');
  const mapOpenIndex = html.indexOf('class="store-local-map-open-link"');
  if (!(accessInfoIndex < mapIndex && mapIndex < mapOpenIndex)) {
    fail(file, "map must follow the shop address and opening-hours information");
  }
  if (file === "shop/saitama/wako/index.html" && html.includes("wako-access-repeat")) {
    fail(file, "Wako shop information and map must not be duplicated later in the page");
  }
}

function checkTachikawaHeading(file, html) {
  if (file !== "shop/tokyo/tachikawa/index.html") return;

  const expectedHeading =
    "立川市のマンスリーレンタカー｜東京マンスリーレンタカー立川店";
  const headings = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];

  if (headings.length !== 1) {
    fail(file, `Tachikawa store page must contain exactly one h1, found ${headings.length}`);
    return;
  }

  const [, attributes, contents] = headings[0];
  const headingText = contents.replace(/<[^>]+>/g, "").replace(/\s+/g, "");

  if (headingText !== expectedHeading) {
    fail(file, `Tachikawa h1 must be: ${expectedHeading}`);
  }
  if (/\bvisually-hidden\b/.test(attributes)) {
    fail(file, "Tachikawa h1 must be visible, not visually-hidden");
  }
  if (!attributes.includes('id="tachikawa-store-title"')) {
    fail(file, 'Tachikawa h1 must use id="tachikawa-store-title"');
  }
  if (!html.includes('aria-labelledby="tachikawa-store-title"')) {
    fail(file, "Tachikawa service-area must be labelled by the visible h1");
  }
  if (!html.includes('class="section-head tachikawa-store-heading"')) {
    fail(file, "Tachikawa h1 must be integrated into the store heading panel");
  }
  if (!html.includes('class="tachikawa-store-heading-label"')) {
    fail(file, "Tachikawa store heading must include its visible guide label");
  }
  if (!html.includes("立川店 店舗案内")) {
    fail(file, "Tachikawa store heading guide label is missing");
  }
  if (!html.includes('<link rel="stylesheet" href="../../store-local-intro.css?v=20260807">')) {
    fail(file, "Tachikawa page must load the shared responsive local-intro stylesheet");
  }
  const frameAsset = "assets/img/tachikawa-store-heading-frame-20260803.webp";
  if (!html.includes(`../../../${frameAsset}`)) {
    fail(file, "Tachikawa store heading frame asset is missing from the markup");
  }
  if (!fs.existsSync(path.join(root, frameAsset))) {
    fail(file, `missing Tachikawa store heading frame: ${frameAsset}`);
  } else if (fs.statSync(path.join(root, frameAsset)).size > 20000) {
    fail(file, `Tachikawa store heading frame must stay below 20 KB: ${frameAsset}`);
  }
}

function checkTachikawaStoreSummary(file, html) {
  if (file !== "shop/tokyo/tachikawa/index.html") return;

  if (!html.includes('<link rel="stylesheet" href="../../../styles.css?v=20260807-footer-company-pc-logo">')) {
    fail(file, "Tachikawa page must cache-bust the PC logo layout stylesheet");
  }

  const summaryMatches = html.match(/class="tachikawa-store-summary"/g) || [];
  if (summaryMatches.length !== 1) {
    fail(file, `Tachikawa store summary must appear exactly once, found ${summaryMatches.length}`);
  }

  const requiredFacts = [
    "東京マンスリーレンタカー立川店は、",
    "立川駅から徒歩6分",
    "東京都立川市曙町",
    "1ヶ月以上の長期利用向け",
    "1ヶ月24,000円（税抜）から",
    "立川駅周辺での受け渡し",
    "ご希望住所への配送もご相談ください",
    "10:00〜19:00",
    "無休",
  ];
  for (const fact of requiredFacts) {
    if (!html.includes(fact)) fail(file, `Tachikawa store summary is missing: ${fact}`);
  }

  const summaryIndex = html.indexOf('class="tachikawa-store-summary"');
  const headingIndex = html.indexOf('id="tachikawa-store-title"');
  const photoIndex = html.indexOf('class="tachikawa-access-main-photo"');
  if (!(headingIndex < summaryIndex && summaryIndex < photoIndex)) {
    fail(file, "Tachikawa store summary must stay directly between the store h1 and exterior photo");
  }
}

const shopSearchMetadataByPage = {
  "shop/kanagawa/kawasaki/index.html": {
    title: "【1日あたり800円〜】川崎の格安長期レンタカー｜神奈川マンスリーレンタカー",
    description: "神奈川マンスリーレンタカー川崎店は、川崎駅・京急川崎駅徒歩3分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。川崎周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/saitama/asakadai/index.html": {
    title: "【1日あたり800円〜】朝霞台の格安長期レンタカー｜埼玉マンスリーレンタカー",
    description: "埼玉マンスリーレンタカー朝霞台店は、朝霞台駅・北朝霞駅徒歩3分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。朝霞台周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/saitama/kawagoe/index.html": {
    title: "【1日あたり800円〜】川越の格安長期レンタカー｜埼玉マンスリーレンタカー",
    description: "埼玉マンスリーレンタカー川越店は、川越駅徒歩3分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。川越周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/saitama/omiya/index.html": {
    title: "【1日あたり800円〜】大宮の格安長期レンタカー｜埼玉マンスリーレンタカー",
    description: "埼玉マンスリーレンタカー大宮店は、大宮駅徒歩6分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。大宮周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/saitama/sakado/index.html": {
    title: "【1日あたり800円〜】坂戸の格安長期レンタカー｜埼玉マンスリーレンタカー",
    description: "埼玉マンスリーレンタカー坂戸店は、坂戸駅徒歩3分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。坂戸周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/saitama/tokorozawa/index.html": {
    title: "【1日あたり800円〜】所沢の格安長期レンタカー｜埼玉マンスリーレンタカー",
    description: "埼玉マンスリーレンタカー所沢店は、所沢駅徒歩6分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。所沢周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/saitama/urawa/index.html": {
    title: "【1日あたり800円〜】浦和の格安長期レンタカー｜埼玉マンスリーレンタカー",
    description: "埼玉マンスリーレンタカー浦和店は、浦和駅徒歩4分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。浦和周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/saitama/wako/index.html": {
    title: "【1日あたり800円〜】和光の格安長期レンタカー｜埼玉マンスリーレンタカー",
    description: "埼玉マンスリーレンタカー和光店は、和光市駅南口徒歩6分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。和光市内の指定場所への車両配送もご相談ください。",
  },
  "shop/tokyo/ikebukuro/index.html": {
    title: "【1日あたり800円〜】池袋の格安長期レンタカー｜東京マンスリーレンタカー",
    description: "東京マンスリーレンタカー池袋店は、池袋駅徒歩6分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。池袋周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/tokyo/shinjuku/index.html": {
    title: "【1日あたり800円〜】新宿の格安長期レンタカー｜東京マンスリーレンタカー",
    description: "東京マンスリーレンタカー新宿店は、新宿駅徒歩7分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。新宿周辺の指定場所への車両配送もご相談ください。",
  },
  "shop/tokyo/tachikawa/index.html": {
    title: "【1日あたり800円〜】立川の格安長期レンタカー｜東京マンスリーレンタカー",
    description: "東京マンスリーレンタカー立川店は、立川駅徒歩6分。代車・納車待ち・社用車・通勤・送迎などに、1ヶ月から利用できます。保険料込み。国立市・国分寺市・日野市・昭島市への車両配送もご相談ください。",
  },
};

function checkShopSearchMetadata(file, html, title, description) {
  const expected = shopSearchMetadataByPage[file];
  if (!expected) return;

  if (title !== expected.title) {
    fail(file, `shop title must be: ${expected.title}`);
  }
  if (description !== expected.description) {
    fail(file, `shop meta description must be: ${expected.description}`);
  }
  if (!html.includes(`"name": "${expected.title}"`)) {
    fail(file, "shop WebPage.name must match the page title");
  }
}

function checkPage(file) {
  const html = read(file);
  const expectedUrl = pageUrlFor(file);
  const shopImage = shopImageByPage[file];
  const isRentalPriceGuide =
    file === "guide/rental-car-one-month-price/index.html";
  const articleImage = articleImageByPage[file];
  if (file.startsWith("shop/") && !shopImage) {
    fail(file, "shop page must register its own square and social OGP images");
  }
  const expectedOgImage =
    shopImage
      ? `${baseUrl}/assets/ogp/shops/${shopImage.slug}-1200x630.jpg`
      : isRentalPriceGuide
      ? `${baseUrl}${rentalPriceGuideImage.path}`
      : articleImage
      ? `${baseUrl}${articleImage.path}`
      : `${baseUrl}/assets/ogp/monthly-rentacar.png`;
  const [expectedOgImageWidth, expectedOgImageHeight] =
    shopImage
      ? ["1200", "630"]
      : isRentalPriceGuide
      ? [rentalPriceGuideImage.width, rentalPriceGuideImage.height]
      : articleImage
        ? [articleImage.width, articleImage.height]
        : ["1200", "630"];
  const title = extractFirst(html, /<title>([\s\S]*?)<\/title>/);
  const description = extractFirst(html, /<meta\s+name="description"\s+content="([\s\S]*?)"\s*>/);
  const robots = extractFirst(
    html,
    /<meta\s+name="robots"\s+content="([\s\S]*?)"\s*>/,
  );

  if (!title) fail(file, "title missing");
  if (!description) fail(file, "meta description missing");
  checkTachikawaStorePhotos(file, html);
  checkWakoStorePhotos(file, html);
  checkOmiyaStorePhotos(file, html);
  checkAsakadaiStorePhotos(file, html);
  checkTokorozawaStorePhotos(file, html);
  checkKawagoeStorePhotos(file, html);
  checkKawasakiStorePhotos(file, html);
  checkShinjukuStorePhotos(file, html);
  checkIkebukuroStorePhotos(file, html);
  checkShopLocalGuide(file, html);
  checkTachikawaLocationData(file, html);
  checkTachikawaHeading(file, html);
  checkTachikawaStoreSummary(file, html);
  checkShopSearchMetadata(file, html, title, description);
  checkShopImages(file, html);

  if (isStaging) {
    if (robots !== "noindex, nofollow") {
      fail(file, "staging page must include noindex, nofollow");
    }
  } else if (robots) {
    fail(file, "production page must not include a robots noindex or nofollow meta tag");
  }

  for (const property of requiredOgProperties) {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = countMatches(html, new RegExp(`property="${escaped}"`, "g"));
    if (count !== 1) fail(file, `${property} must appear exactly once, found ${count}`);
  }

  const twitterCount = countMatches(html, /name="twitter:card"/g);
  if (twitterCount !== 1) fail(file, `twitter:card must appear exactly once, found ${twitterCount}`);
  if (!html.includes('<meta name="twitter:card" content="summary_large_image">')) {
    fail(file, "twitter:card must be summary_large_image");
  }

  if (!html.includes(`<meta property="og:title" content="${title}">`)) {
    fail(file, "og:title must match title");
  }
  if (!html.includes(`<meta property="og:description" content="${description}">`)) {
    fail(file, "og:description must match meta description");
  }
  if (!html.includes(`<meta property="og:url" content="${expectedUrl}">`)) {
    fail(file, `og:url must be ${expectedUrl}`);
  }
  if (!html.includes(`<meta property="og:image" content="${expectedOgImage}">`)) {
    fail(file, `og:image must be ${expectedOgImage}`);
  }
  if (!html.includes(`<meta property="og:image:width" content="${expectedOgImageWidth}">`)) {
    fail(file, `og:image:width must be ${expectedOgImageWidth}`);
  }
  if (!html.includes(`<meta property="og:image:height" content="${expectedOgImageHeight}">`)) {
    fail(file, `og:image:height must be ${expectedOgImageHeight}`);
  }
}

function checkInternalPage(file) {
  const html = read(file);
  const robots = extractFirst(
    html,
    /<meta\s+name="robots"\s+content="([\s\S]*?)"\s*>/,
  );
  const canonical = extractFirst(
    html,
    /<link\s+rel="canonical"\s+href="([\s\S]*?)"\s*>/,
  );

  if (isStaging) {
    if (robots !== "noindex, nofollow") {
      fail(file, "staging internal page must include noindex, nofollow");
    }
  } else if (productionNoindexPages.has(file)) {
    if (robots !== "noindex") {
      fail(file, "production thank-you page must include robots noindex");
    }
  } else if (robots) {
    fail(file, "production internal page must not include a robots meta tag");
  }

  if (file === "thanks/index.html") {
    const canonicalCount = countMatches(html, /rel="canonical"/g);
    if (canonicalCount !== 1) {
      fail(file, `rel=canonical must appear exactly once, found ${canonicalCount}`);
    }
    if (canonical !== productionThanksUrl) {
      fail(file, `canonical must be ${productionThanksUrl}`);
    }
  }
}

function checkSitemap(pages) {
  const file = "sitemap.xml";
  if (!fs.existsSync(path.join(root, file))) {
    fail(file, "sitemap.xml missing");
    return;
  }
  const xml = read(file);
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expected = pages
    .filter((page) => !sitemapExcludedPages.has(page))
    .map(pageUrlFor);
  const missing = expected.filter((url) => !locs.includes(url));
  const extra = locs.filter((url) => !expected.includes(url));
  for (const url of missing) fail(file, `missing sitemap URL: ${url}`);
  for (const url of extra) fail(file, `unexpected sitemap URL: ${url}`);
  for (const url of locs) {
    if (!url.startsWith(`${baseUrl}/`)) fail(file, `sitemap URL must use ${baseUrl}: ${url}`);
  }
}

function checkRobots() {
  const file = "robots.txt";
  if (!fs.existsSync(path.join(root, file))) {
    fail(file, "robots.txt missing");
    return;
  }
  const text = read(file);
  if (!text.includes(`Sitemap: ${baseUrl}/sitemap.xml`)) {
    fail(file, `robots.txt must reference ${baseUrl}/sitemap.xml`);
  }
  if (isStaging) {
    // Crawling must stay allowed on staging: robots.txt Disallow would stop
    // Google from re-reading the pages, so it could never see their noindex
    // tags and stale staging URLs would keep ranking (observed 2026-08-02:
    // stg Shinjuku at avg position 5.5 while production sat at 18.1).
    // Deindexing relies on the per-page noindex enforced above.
    if (!/^Allow:\s*\/\s*$/m.test(text)) fail(file, "staging robots.txt must allow crawling so noindex tags are discoverable");
    if (/^Disallow:\s*\/\s*$/m.test(text)) fail(file, "staging robots.txt must not disallow all crawling");
  } else {
    if (!/^Allow:\s*\/\s*$/m.test(text)) fail(file, "production robots.txt must allow crawling");
    if (/^Disallow:\s*\/\s*$/m.test(text)) fail(file, "production robots.txt must not disallow all crawling");
  }
}

const pages = walk(".")
  .filter((file) => file.endsWith(".html"))
  .filter((file) => !internalPages.has(file))
  .filter((file) => file === "index.html" || file.includes("/"))
  .sort();

for (const file of pages) checkPage(file);
for (const file of internalPages) checkInternalPage(file);
checkSitemap(pages);
checkRobots();

if (hasError) process.exit(1);
console.log(`SEO metadata check passed for ${pages.length} pages on ${host}`);

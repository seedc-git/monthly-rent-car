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
}

function checkPage(file) {
  const html = read(file);
  const expectedUrl = pageUrlFor(file);
  const shopImage = shopImageByPage[file];
  if (file.startsWith("shop/") && !shopImage) {
    fail(file, "shop page must register its own square and social OGP images");
  }
  const expectedOgImage =
    shopImage
      ? `${baseUrl}/assets/ogp/shops/${shopImage.slug}-1200x630.jpg`
      : file === "area/tachikawa/index.html"
      ? `${baseUrl}/assets/img/area/tachikawa/tachikawa-station-hero-20260730.webp`
      : `${baseUrl}/assets/ogp/monthly-rentacar.png`;
  const [expectedOgImageWidth, expectedOgImageHeight] =
    shopImage
      ? ["1200", "630"]
      : file === "area/tachikawa/index.html"
        ? ["1077", "500"]
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
  checkShinjukuStorePhotos(file, html);
  checkIkebukuroStorePhotos(file, html);
  checkTachikawaLocationData(file, html);
  checkTachikawaHeading(file, html);
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
    if (!/^Disallow:\s*\/\s*$/m.test(text)) fail(file, "staging robots.txt must disallow crawling");
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

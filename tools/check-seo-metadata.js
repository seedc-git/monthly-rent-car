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

function checkPage(file) {
  const html = read(file);
  const expectedUrl = pageUrlFor(file);
  const expectedOgImage =
    file === "area/tachikawa/index.html"
      ? `${baseUrl}/assets/img/area/tachikawa/tachikawa-station-hero-20260730.webp`
      : `${baseUrl}/assets/ogp/monthly-rentacar.png`;
  const [expectedOgImageWidth, expectedOgImageHeight] =
    file === "area/tachikawa/index.html" ? ["1077", "500"] : ["1200", "630"];
  const title = extractFirst(html, /<title>([\s\S]*?)<\/title>/);
  const description = extractFirst(html, /<meta\s+name="description"\s+content="([\s\S]*?)"\s*>/);
  const robots = extractFirst(
    html,
    /<meta\s+name="robots"\s+content="([\s\S]*?)"\s*>/,
  );

  if (!title) fail(file, "title missing");
  if (!description) fail(file, "meta description missing");
  checkTachikawaStorePhotos(file, html);
  checkTachikawaLocationData(file, html);

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

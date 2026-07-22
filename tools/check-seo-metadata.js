const fs = require("fs");
const path = require("path");

const root = process.cwd();
const stagingHost = "stg.monthly-rent-car.jp";
const productionHost = "monthly-rent-car.jp";
const cnamePath = path.join(root, "CNAME");
const isStaging = fs.existsSync(cnamePath) && fs.readFileSync(cnamePath, "utf8").trim() === stagingHost;
const host = isStaging ? stagingHost : productionHost;
const baseUrl = `https://${host}`;

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

function checkPage(file) {
  const html = read(file);
  const expectedUrl = pageUrlFor(file);
  const title = extractFirst(html, /<title>([\s\S]*?)<\/title>/);
  const description = extractFirst(html, /<meta\s+name="description"\s+content="([\s\S]*?)"\s*>/);

  if (!title) fail(file, "title missing");
  if (!description) fail(file, "meta description missing");

  if (isStaging) {
    if (!/<meta name="robots" content="noindex, nofollow">/.test(html)) {
      fail(file, "staging page must include noindex, nofollow");
    }
  } else if (/noindex|nofollow/i.test(html)) {
    fail(file, "production page must not include noindex or nofollow");
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
  if (!html.includes(`<meta property="og:image" content="${baseUrl}/assets/ogp/monthly-rentacar.png">`)) {
    fail(file, "og:image must use the shared OGP image on the current host");
  }
  if (!html.includes('<meta property="og:image:width" content="1200">')) {
    fail(file, "og:image:width must be 1200");
  }
  if (!html.includes('<meta property="og:image:height" content="630">')) {
    fail(file, "og:image:height must be 630");
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
  const expected = pages.map(pageUrlFor);
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
  .filter((file) => file !== "line.html")
  .filter((file) => file === "index.html" || file.includes("/"))
  .sort();

for (const file of pages) checkPage(file);
checkSitemap(pages);
checkRobots();

if (hasError) process.exit(1);
console.log(`SEO metadata check passed for ${pages.length} pages on ${host}`);

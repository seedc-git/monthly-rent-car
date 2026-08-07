const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pageFile = "guide/monthly-rentacar-cheap-comparison/index.html";
const pagePath = path.join(root, pageFile);
const route = "/guide/monthly-rentacar-cheap-comparison/";
const productionUrl = `https://monthly-rent-car.jp${route}`;
const stagingHost = "stg.monthly-rent-car.jp";
const cnamePath = path.join(root, "CNAME");
const isStaging =
  fs.existsSync(cnamePath) &&
  fs.readFileSync(cnamePath, "utf8").trim() === stagingHost;
const publicHost = isStaging ? stagingHost : "monthly-rent-car.jp";
const publicUrl = `https://${publicHost}${route}`;
const expectedOgImage =
  `https://${publicHost}/assets/img/guide/monthly-rentacar-cheap-comparison/` +
  "monthly-rentacar-cheap-comparison-hero-1200.webp";

const errors = [];
const fail = (message) => errors.push(`${pageFile}: ${message}`);

if (!fs.existsSync(pagePath)) {
  console.error(`FAIL\n- ${pageFile}: HTML file is missing`);
  process.exit(1);
}

const html = fs.readFileSync(pagePath, "utf8");

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function plainText(value) {
  return decodeEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\s\u3000]+/g, " ")
    .trim();
}

function faqQuestion(value) {
  return plainText(value).replace(/^Q(?:\s|[.．:：])*/, "");
}

function faqAnswer(value) {
  return plainText(value).replace(/^A(?:\s|[.．:：])*/, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMeta(attribute, value) {
  const escapedAttribute = escapeRegExp(attribute);
  const escapedValue = escapeRegExp(value);
  const patterns = [
    new RegExp(
      `<meta\\s+[^>]*${escapedAttribute}=["']${escapedValue}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${escapedAttribute}=["']${escapedValue}["'][^>]*>`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1].trim());
  }
  return "";
}

function getLink(rel) {
  const escapedRel = escapeRegExp(rel);
  const patterns = [
    new RegExp(
      `<link\\s+[^>]*rel=["']${escapedRel}["'][^>]*href=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<link\\s+[^>]*href=["']([^"']*)["'][^>]*rel=["']${escapedRel}["'][^>]*>`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1].trim());
  }
  return "";
}

const title = decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
const description = getMeta("name", "description");
const robots = getMeta("name", "robots");
const canonical = getLink("canonical");

if (!title) fail("title is missing");
if (!description) fail("meta description is missing");
if (canonical !== productionUrl) {
  fail(`canonical must be ${productionUrl}`);
}
if (isStaging && robots !== "noindex, nofollow") {
  fail("staging page must include robots=noindex, nofollow");
}
if (!isStaging && robots) {
  fail("production page must not include a robots meta tag");
}

const expectedOg = {
  "og:type": "article",
  "og:site_name": "マンスリーレンタカー",
  "og:title": title,
  "og:url": publicUrl,
  "og:image": expectedOgImage,
  "og:image:width": "1200",
  "og:image:height": "675",
};
for (const [property, expected] of Object.entries(expectedOg)) {
  const actual = getMeta("property", property);
  if (!actual) fail(`${property} is missing`);
  else if (actual !== expected) fail(`${property} must be ${expected}`);
}
if (!getMeta("property", "og:description")) fail("og:description is missing");
if (!getMeta("property", "og:image:alt")) fail("og:image:alt is missing");
if (getMeta("name", "twitter:card") !== "summary_large_image") {
  fail("twitter:card must be summary_large_image");
}

const pageText = plainText(html);
const services = [
  "東京マンスリーレンタカー",
  "業務レンタカー",
  "ガッツレンタカー",
  "カルノリレンタカー",
  "GOGOマンスリーレンタカー",
  "マンスリーゴー",
  "JOMOレンタカー",
  "ニコニコレンタカー",
  "100円レンタカー",
];
for (const service of services) {
  if (!pageText.includes(service)) fail(`comparison must name ${service}`);
}

if (
  !/東京マンスリーレンタカー.{0,100}(?:当サイト|本サイト).{0,40}(?:運営|自社)|(?:当サイト|本サイト).{0,40}(?:運営|自社).{0,100}東京マンスリーレンタカー/.test(
    pageText,
  )
) {
  fail("must disclose that Tokyo Monthly Rental is operated by this site");
}

if (!pageText.includes("税抜")) {
  fail("comparison prices must be identified as tax-exclusive");
}

const taxExclusiveValues = [
  ["24,000", "Tokyo Monthly Rental / Gyomu Rent-a-Car / Karunori base price"],
  ["24,800", "Guts Rent-a-Car base price"],
  ["41,636", "GOGO Monthly Rental approximate base and CDW-included price"],
  ["26,400", "Monthly Go base price"],
  ["88,000", "NicoNico Rent-a-Car base price"],
  ["54,364", "100-yen Rent-a-Car approximate base price"],
  ["18,000", "JOMO reference base price"],
  ["30,000", "Gyomu Rent-a-Car CDW-added price"],
  ["30,800", "Guts Rent-a-Car CDW-added price"],
  ["34,000", "Tokyo Monthly Rental / Karunori CDW-added price"],
  ["38,400", "Monthly Go CDW-added price"],
  ["118,000", "NicoNico Rent-a-Car CDW-added price"],
  ["69,364", "100-yen Rent-a-Car approximate CDW-added price"],
  ["26,000", "JOMO reference CDW-added price"],
];
for (const [value, meaning] of taxExclusiveValues) {
  if (!pageText.includes(value)) {
    fail(`tax-exclusive value ${value} is missing (${meaning})`);
  }
}

const officialSources = [
  "monthly-rent-car.jp",
  "renntacar.net",
  "guts-rentacar.com",
  "karunori-car.com",
  "gogo-monthly-rentacar.com",
  "monthly-go.com",
  "jomo-rentacar.com",
  "2525r.com",
  "100yen-rentacar.jp",
];
for (const host of officialSources) {
  const linked = new RegExp(
    `<a\\s+[^>]*href=["']https?://(?:www\\.)?[^"']*${escapeRegExp(host)}(?:/|["'])`,
    "i",
  ).test(html);
  if (!linked) fail(`official source link for ${host} is missing`);
}
if (!/(?:調査日|確認日|情報確認日|最終確認)[^。]{0,30}2026年8月8日/.test(pageText)) {
  fail("official-source research date 2026年8月8日 is missing");
}

const requiredComparisonColumns = [
  "サービス",
  "主な対応",
  "最安クラス・車両",
  "税抜基本料",
  "CDW追加後目安",
  "免責補償・NOC",
  "配車・受取",
  "距離",
  "故障時の代替車",
  "向いている人",
];
for (const column of requiredComparisonColumns) {
  if (!pageText.includes(column)) fail(`comparison column is missing: ${column}`);
}

const useCaseMatch = html.match(
  /<div\s+class=["']use-case-grid["'][^>]*>([\s\S]*?)<\/div>/i,
);
const useCaseCount = useCaseMatch
  ? [...useCaseMatch[1].matchAll(/<article\b/gi)].length
  : 0;
if (useCaseCount !== 10) {
  fail(`exactly 10 condition-based choices are required, found ${useCaseCount}`);
}
for (const label of [
  "基本料金を優先",
  "4ドア軽を指定",
  "免責補償を重視",
  "自宅・指定場所で受取",
  "故障時の交換車が必須",
  "全国・複数地域で探す",
  "軽バン・軽トラック",
  "1週間程度",
  "3ヶ月以上",
  "法人で複数台",
]) {
  if (!pageText.includes(label)) fail(`condition-based choice is missing: ${label}`);
}

for (const diagramClass of ["cost-diagram", "coverage-layers", "decision-flow"]) {
  if (!new RegExp(`class=["'][^"']*${diagramClass}`).test(html)) {
    fail(`original diagram is missing: ${diagramClass}`);
  }
}
const captureCount = [...html.matchAll(/<figure\b[^>]*class=["'][^"']*source-capture/gi)].length;
if (captureCount !== 4) {
  fail(`exactly 4 official source captures are required, found ${captureCount}`);
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${escapeRegExp(name)}=["']([^"']*)["']`, "i"));
  return match ? decodeEntities(match[1].trim()) : "";
}

const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
for (const tag of imageTags) {
  const src = getAttribute(tag, "src");
  if (!src) fail("img is missing src");
  if (!getAttribute(tag, "alt")) fail(`img is missing descriptive alt: ${src || "(unknown)"}`);
  if (!getAttribute(tag, "width") || !getAttribute(tag, "height")) {
    fail(`img is missing width/height: ${src || "(unknown)"}`);
  }
  if (!getAttribute(tag, "decoding")) fail(`img is missing decoding: ${src || "(unknown)"}`);
  if (/official-/.test(src) && getAttribute(tag, "loading") !== "lazy") {
    fail(`official capture must lazy-load: ${src}`);
  }
  if (/monthly-rentacar-cheap-comparison-hero-740\.webp/.test(src)) {
    if (getAttribute(tag, "loading") === "lazy") fail("hero image must not lazy-load");
    if (getAttribute(tag, "fetchpriority") !== "high") fail("hero image must have high fetch priority");
  }
  if (src && !/^(?:https?:|data:|\/)/.test(src)) {
    const localPath = path.resolve(path.dirname(pagePath), src.split(/[?#]/)[0]);
    if (!fs.existsSync(localPath)) fail(`image file is missing: ${src}`);
  }
  const srcset = getAttribute(tag, "srcset");
  for (const candidate of srcset.split(",").map((item) => item.trim().split(/\s+/)[0]).filter(Boolean)) {
    if (/^(?:https?:|data:|\/)/.test(candidate)) continue;
    const localPath = path.resolve(path.dirname(pagePath), candidate.split(/[?#]/)[0]);
    if (!fs.existsSync(localPath)) fail(`srcset image file is missing: ${candidate}`);
  }
}

const htmlWithoutScripts = html
  .replace(/<script\b[\s\S]*?<\/script>/gi, "")
  .replace(/<style\b[\s\S]*?<\/style>/gi, "");
const headingLevels = [...htmlWithoutScripts.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
if (headingLevels.filter((level) => level === 1).length !== 1) {
  fail("page must have exactly one H1");
}
for (let index = 1; index < headingLevels.length; index += 1) {
  if (headingLevels[index] > headingLevels[index - 1] + 1) {
    fail(`heading hierarchy jumps from H${headingLevels[index - 1]} to H${headingLevels[index]}`);
  }
}

function resolveInternalTarget(href) {
  const [rawPath, fragment = ""] = href.split("#", 2);
  const routePath = rawPath || route;
  let targetPath;
  if (routePath.startsWith("/")) {
    const relative = routePath.replace(/^\//, "");
    targetPath = path.join(root, relative, routePath.endsWith("/") ? "index.html" : "");
  } else {
    targetPath = path.resolve(path.dirname(pagePath), routePath);
  }
  return { targetPath, fragment: decodeURIComponent(fragment) };
}

for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
  const href = decodeEntities(match[1]);
  if (/^(?:https?:|mailto:|tel:|javascript:|\/\/)/i.test(href)) continue;
  const { targetPath, fragment } = resolveInternalTarget(href);
  if (!fs.existsSync(targetPath)) {
    fail(`internal link target is missing: ${href}`);
    continue;
  }
  if (fragment && targetPath.endsWith(".html")) {
    const targetHtml = fs.readFileSync(targetPath, "utf8");
    const idPattern = new RegExp(`\\sid=["']${escapeRegExp(fragment)}["']`, "i");
    if (!idPattern.test(targetHtml)) fail(`internal link fragment is missing: ${href}`);
  }
}

const ldJsonObjects = [];
for (const match of html.matchAll(
  /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
)) {
  try {
    ldJsonObjects.push(JSON.parse(match[1]));
  } catch (error) {
    fail(`invalid JSON-LD: ${error.message}`);
  }
}

function collectByType(value, type, found = []) {
  if (!value || typeof value !== "object") return found;
  if (
    value["@type"] === type ||
    (Array.isArray(value["@type"]) && value["@type"].includes(type))
  ) {
    found.push(value);
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") collectByType(child, type, found);
  }
  return found;
}

if (ldJsonObjects.flatMap((value) => collectByType(value, "Article")).length === 0) {
  fail("Article JSON-LD is missing");
}

const faqPages = ldJsonObjects.flatMap((value) => collectByType(value, "FAQPage"));
if (faqPages.length !== 1) {
  fail(`exactly one FAQPage JSON-LD object is required, found ${faqPages.length}`);
}

const faqContainer = html.match(
  /<(section|div)\b[^>]*(?:id|class)=["'][^"']*faq[^"']*["'][^>]*>/i,
);
const faqStart = faqContainer ? faqContainer.index : -1;
let faqHtml = "";
if (faqStart >= 0) {
  const afterStart = html.slice(faqStart);
  const end = afterStart.search(
    new RegExp(`<\\/${faqContainer[1]}>`, "i"),
  );
  faqHtml = end >= 0 ? afterStart.slice(0, end) : afterStart;
} else {
  fail("visible FAQ container is missing");
}

const visibleFaq = [];
for (const match of faqHtml.matchAll(
  /<details\b[^>]*>([\s\S]*?)<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi,
)) {
  visibleFaq.push({
    question: faqQuestion(match[2]),
    answer: faqAnswer(match[3]),
  });
}
if (visibleFaq.length < 10) {
  fail(`at least 10 visible FAQ details are required, found ${visibleFaq.length}`);
}

if (faqPages.length === 1) {
  const schemaFaq = Array.isArray(faqPages[0].mainEntity)
    ? faqPages[0].mainEntity
    : [];
  if (schemaFaq.length !== visibleFaq.length) {
    fail(
      `FAQPage parity failed: ${visibleFaq.length} visible questions but ${schemaFaq.length} schema questions`,
    );
  }
  for (const item of schemaFaq) {
    const question = faqQuestion(String(item && item.name ? item.name : ""));
    const answer = faqAnswer(
      String(
        item && item.acceptedAnswer && item.acceptedAnswer.text
          ? item.acceptedAnswer.text
          : "",
      ),
    );
    const visible = visibleFaq.find((entry) => entry.question === question);
    if (!visible) {
      fail(`FAQPage question is not visible: ${question || "(empty question)"}`);
    } else if (visible.answer !== answer) {
      fail(`FAQPage answer differs from visible answer: ${question}`);
    }
  }
}

if (errors.length) {
  console.error(`FAIL (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `PASS: ${pageFile} metadata, 9 services, 10 condition choices, disclosure, sources, tax-exclusive prices, internal links, headings, images, 3 diagrams, 4 captures and ${visibleFaq.length} FAQ items are consistent.`,
);

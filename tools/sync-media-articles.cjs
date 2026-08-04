#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "data", "media-articles.json");
const START_MARKER = "<!-- media-articles:start -->";
const END_MARKER = "<!-- media-articles:end -->";
const GENERATED_NOTICE =
  "<!-- Generated from data/media-articles.json. Do not edit by hand. -->";
const IMAGE_SIZES =
  "(max-width: 767px) calc(100vw - 40px), (min-width: 1180px) 390px, 320px";

const args = process.argv.slice(2);
const checkOnly = args.length === 1 && args[0] === "--check";
const showHelp = args.length === 1 && (args[0] === "--help" || args[0] === "-h");

if (showHelp) {
  console.log("Usage: node tools/sync-media-articles.cjs [--check]");
  console.log("  no option  Synchronize every MEDIA carousel from the registry.");
  console.log("  --check    Verify synchronization without writing files.");
  process.exit(0);
}

if (args.length && !checkOnly) {
  console.error("Usage: node tools/sync-media-articles.cjs [--check]");
  process.exit(1);
}

const countMatches = (value, pattern) => (value.match(pattern) || []).length;

const fail = (message) => {
  throw new Error(message);
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const assertExactKeys = (value, allowedKeys, label) => {
  if (!isPlainObject(value)) {
    fail(`${label} must be an object`);
  }

  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) {
    fail(`${label} contains unknown field(s): ${unknown.join(", ")}`);
  }

  const missing = allowedKeys.filter((key) => !(key in value));
  if (missing.length) {
    fail(`${label} is missing field(s): ${missing.join(", ")}`);
  }
};

const assertNonEmptyString = (value, label) => {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${label} must be a non-empty string`);
  }
};

const assertPositiveInteger = (value, label) => {
  if (!Number.isInteger(value) || value <= 0) {
    fail(`${label} must be a positive integer`);
  }
};

const validateSitePath = (value, label, prefix = "/") => {
  assertNonEmptyString(value, label);
  if (
    !value.startsWith(prefix) ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("//")
  ) {
    fail(
      `${label} must be a root-relative path without a host, query, fragment, backslash, or repeated slash`
    );
  }

  const segments = value.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    fail(`${label} must not contain path traversal segments`);
  }
};

const sitePathToFile = (sitePath, label) => {
  validateSitePath(sitePath, label);
  if (!sitePath.endsWith("/")) {
    fail(`${label} must end with a slash`);
  }

  const relativePath =
    sitePath === "/" ? "index.html" : path.posix.join(sitePath.slice(1), "index.html");
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`${label} does not resolve to an existing index.html: ${relativePath}`);
  }
  return { absolutePath, relativePath };
};

const assetPathToFile = (sitePath, label) => {
  validateSitePath(sitePath, label, "/assets/");
  if (!sitePath.startsWith("/assets/")) {
    fail(`${label} must start with /assets/`);
  }

  const relativePath = sitePath.slice(1);
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`${label} does not resolve to an existing asset: ${relativePath}`);
  }
};

const decodeHtmlEntities = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const textFromHtml = (value) =>
  decodeHtmlEntities(value.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();

const titleFromArticlePage = (absolutePath, url) => {
  const html = fs.readFileSync(absolutePath, "utf8");
  const headings = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi));
  if (headings.length !== 1) {
    fail(`article ${url} must contain exactly one h1; found ${headings.length}`);
  }

  const title = textFromHtml(headings[0][1]);
  if (!title) {
    fail(`article ${url} has an empty h1`);
  }
  return title;
};

const loadRegistry = () => {
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  } catch (error) {
    fail(`could not parse data/media-articles.json: ${error.message}`);
  }

  assertExactKeys(registry, ["schemaVersion", "articles"], "registry");
  if (registry.schemaVersion !== 1) {
    fail("registry.schemaVersion must be 1");
  }
  if (!Array.isArray(registry.articles) || !registry.articles.length) {
    fail("registry.articles must be a non-empty array");
  }

  const seenUrls = new Set();
  return registry.articles.map((article, articleIndex) => {
    const label = `articles[${articleIndex}]`;
    assertExactKeys(article, ["url", "category", "description", "image"], label);
    validateSitePath(article.url, `${label}.url`);
    if (article.url === "/" || !article.url.endsWith("/")) {
      fail(`${label}.url must be a non-root URL ending with a slash`);
    }
    if (seenUrls.has(article.url)) {
      fail(`${label}.url duplicates an earlier article: ${article.url}`);
    }
    seenUrls.add(article.url);

    assertNonEmptyString(article.category, `${label}.category`);
    assertNonEmptyString(article.description, `${label}.description`);
    assertExactKeys(
      article.image,
      ["src", "srcset", "alt", "width", "height"],
      `${label}.image`
    );
    assetPathToFile(article.image.src, `${label}.image.src`);
    assertNonEmptyString(article.image.alt, `${label}.image.alt`);
    assertPositiveInteger(article.image.width, `${label}.image.width`);
    assertPositiveInteger(article.image.height, `${label}.image.height`);

    if (!Array.isArray(article.image.srcset) || !article.image.srcset.length) {
      fail(`${label}.image.srcset must be a non-empty array`);
    }

    const seenWidths = new Set();
    let previousWidth = 0;
    const srcset = article.image.srcset.map((source, sourceIndex) => {
      const sourceLabel = `${label}.image.srcset[${sourceIndex}]`;
      assertExactKeys(source, ["src", "width"], sourceLabel);
      assetPathToFile(source.src, `${sourceLabel}.src`);
      assertPositiveInteger(source.width, `${sourceLabel}.width`);
      if (seenWidths.has(source.width)) {
        fail(`${sourceLabel}.width duplicates an earlier width: ${source.width}`);
      }
      if (source.width <= previousWidth) {
        fail(`${label}.image.srcset widths must be in ascending order`);
      }
      seenWidths.add(source.width);
      previousWidth = source.width;
      return { src: source.src, width: source.width };
    });

    if (!srcset.some((source) => source.src === article.image.src)) {
      fail(`${label}.image.src must also appear in image.srcset`);
    }

    const target = sitePathToFile(article.url, `${label}.url`);
    return {
      ...article,
      title: titleFromArticlePage(target.absolutePath, article.url),
      image: { ...article.image, srcset }
    };
  });
};

const findShopPages = (directory) => {
  const pages = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      pages.push(...findShopPages(absolutePath));
    } else if (entry.isFile() && entry.name === "index.html") {
      pages.push(path.relative(ROOT, absolutePath).split(path.sep).join("/"));
    }
  }
  return pages;
};

const discoverTargetPages = () => {
  const pages = ["index.html", ...findShopPages(path.join(ROOT, "shop")).sort()];
  if (pages.length < 2) {
    fail("expected the home page and at least one shop page");
  }
  return pages;
};

const escapeText = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeAttribute = (value) =>
  escapeText(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const renderCard = (article, indent) => {
  const image = article.image;
  const srcset = image.srcset
    .map((source) => `${escapeAttribute(source.src)} ${source.width}w`)
    .join(", ");

  return [
    `${indent}<a class="media-card" href="${escapeAttribute(article.url)}">`,
    `${indent}  <div class="media-card-image">`,
    `${indent}    <img`,
    `${indent}      src="${escapeAttribute(image.src)}"`,
    `${indent}      srcset="${srcset}"`,
    `${indent}      sizes="${escapeAttribute(IMAGE_SIZES)}"`,
    `${indent}      alt="${escapeAttribute(image.alt)}"`,
    `${indent}      loading="lazy"`,
    `${indent}      decoding="async"`,
    `${indent}      width="${image.width}"`,
    `${indent}      height="${image.height}">`,
    `${indent}  </div>`,
    `${indent}  <div class="media-card-body">`,
    `${indent}    <span class="media-card-category">${escapeText(article.category)}</span>`,
    `${indent}    <h3 class="media-card-title">${escapeText(article.title)}</h3>`,
    `${indent}    <span class="media-card-description">${escapeText(article.description)}</span>`,
    `${indent}    <span class="media-card-cta">記事を読む</span>`,
    `${indent}  </div>`,
    `${indent}</a>`
  ].join("\n");
};

const synchronizePage = (relativePath, articles) => {
  const absolutePath = path.join(ROOT, relativePath);
  const html = fs.readFileSync(absolutePath, "utf8");

  const requiredCounts = [
    ["data-media-carousel", /data-media-carousel(?=[\s>])/g],
    ["MEDIA section", /class="section media-section"/g],
    ["MEDIA stylesheet", /media-carousel\.css\?v=/g],
    ["MEDIA script", /media-carousel\.js\?v=/g],
    ["MEDIA status", /data-media-status/g],
    ["MEDIA track", /data-media-track/g]
  ];
  for (const [label, pattern] of requiredCounts) {
    const count = countMatches(html, pattern);
    if (count !== 1) {
      fail(`${relativePath} must contain exactly one ${label}; found ${count}`);
    }
  }

  const storesIndex = html.indexOf('id="stores"');
  const mediaIndex = html.indexOf('class="section media-section"');
  const mainEndIndex = html.indexOf("</main>");
  const footerIndex = html.indexOf("<footer");
  if (
    storesIndex < 0 ||
    !(storesIndex < mediaIndex && mediaIndex < mainEndIndex && mainEndIndex < footerIndex)
  ) {
    fail(`${relativePath} must place MEDIA after stores and before the main/footer boundary`);
  }

  const trackPattern =
    /^([ \t]*)<div class="media-carousel-track" data-media-track>\r?\n[\s\S]*?^\1<\/div>/gm;
  const trackMatches = Array.from(html.matchAll(trackPattern));
  if (trackMatches.length !== 1) {
    fail(`${relativePath} must contain one replaceable MEDIA track; found ${trackMatches.length}`);
  }

  const trackIndent = trackMatches[0][1];
  const childIndent = `${trackIndent}  `;
  const cardIndent = childIndent;
  const cards = articles.map((article) => renderCard(article, cardIndent)).join("\n");
  const replacement = [
    `${trackIndent}<div class="media-carousel-track" data-media-track>`,
    `${childIndent}${START_MARKER}`,
    `${cardIndent}${GENERATED_NOTICE}`,
    cards,
    `${childIndent}${END_MARKER}`,
    `${trackIndent}</div>`
  ].join("\n");

  let synchronized = html.replace(trackPattern, replacement);
  const statusPattern = /(<span\b[^>]*\bdata-media-status[^>]*>)[\s\S]*?(<\/span>)/g;
  synchronized = synchronized.replace(
    statusPattern,
    (_, openingTag, closingTag) => `${openingTag}1 / ${articles.length}${closingTag}`
  );

  if (
    countMatches(synchronized, new RegExp(START_MARKER, "g")) !== 1 ||
    countMatches(synchronized, new RegExp(END_MARKER, "g")) !== 1
  ) {
    fail(`${relativePath} must contain exactly one generated marker pair`);
  }

  for (const article of articles) {
    const escapedUrl = article.url.replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
    const linkCount = countMatches(
      synchronized,
      new RegExp(`class="media-card" href="${escapedUrl}"`, "g")
    );
    if (linkCount !== 1) {
      fail(`${relativePath} must contain exactly one card for ${article.url}`);
    }
  }

  return { absolutePath, relativePath, original: html, synchronized };
};

try {
  const articles = loadRegistry();
  const pages = discoverTargetPages();
  const results = pages.map((page) => synchronizePage(page, articles));
  const changed = results.filter((result) => result.original !== result.synchronized);

  if (checkOnly) {
    if (changed.length) {
      console.error("MEDIA article cards are out of sync:");
      changed.forEach((result) => console.error(`- ${result.relativePath}`));
      console.error("Run: node tools/sync-media-articles.cjs");
      process.exit(1);
    }

    console.log(
      `MEDIA article registry check passed: ${articles.length} article(s) across ${pages.length} page(s)`
    );
    process.exit(0);
  }

  changed.forEach((result) => fs.writeFileSync(result.absolutePath, result.synchronized));
  console.log(
    changed.length
      ? `Synchronized ${articles.length} MEDIA article(s) across ${changed.length} page(s)`
      : `MEDIA article cards already synchronized across ${pages.length} page(s)`
  );
} catch (error) {
  console.error(`MEDIA article sync failed: ${error.message}`);
  process.exit(1);
}

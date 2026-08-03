const fs = require("fs");
const path = require("path");

const root = process.cwd();
const productionOrigin = "https://monthly-rent-car.jp";
const stagingHost = "stg.monthly-rent-car.jp";
const isStaging =
  fs.existsSync(path.join(root, "CNAME")) &&
  fs.readFileSync(path.join(root, "CNAME"), "utf8").trim() === stagingHost;

let hasError = false;

function fail(file, message) {
  hasError = true;
  console.error(`::error file=${file}::${message}`);
}

function walk(dir = ".") {
  const ignoredDirectories = new Set([
    ".git",
    ".github",
    "docs",
    "node_modules",
    "tools",
  ]);
  const files = [];

  const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...walk(relativePath));
      continue;
    }
    files.push(relativePath.replace(/^\.\//, ""));
  }

  return files;
}

function pageFileFor(url) {
  const pathname = new URL(url).pathname;
  if (pathname === "/") return "index.html";
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return pathname.slice(1);
}

function attributeValue(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i");
  const match = tag.match(pattern);
  return match ? match[2].trim() : "";
}

const htaccessFile = ".htaccess";
const htaccessPath = path.join(root, htaccessFile);
if (!fs.existsSync(htaccessPath)) {
  fail(htaccessFile, "canonical host redirect rules are missing");
} else {
  const directives = fs
    .readFileSync(htaccessPath, "utf8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const requiredDirectives = [
    "RewriteEngine On",
    "RewriteCond %{HTTPS} !on [OR]",
    "RewriteCond %{HTTP_HOST} ^www\\.monthly-rent-car\\.jp$ [NC]",
    "RewriteRule ^(.*)$ https://monthly-rent-car.jp%{REQUEST_URI} [R=301,L]",
  ];

  const activeRedirectBlock = directives.join("\n");
  if (activeRedirectBlock !== requiredDirectives.join("\n")) {
    fail(
      htaccessFile,
      "HTTP and www requests must redirect directly to the HTTPS non-www URL while preserving the request URI",
    );
  }
}

const publicTextExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".txt",
  ".xml",
]);
const forbiddenOriginPattern =
  /(?:https?:)?\/\/www\.monthly-rent-car\.jp\b|http:\/\/monthly-rent-car\.jp\b/gi;

for (const file of walk()) {
  if (!publicTextExtensions.has(path.extname(file))) continue;
  const contents = fs.readFileSync(path.join(root, file), "utf8");
  const forbiddenOrigins = new Set(contents.match(forbiddenOriginPattern) || []);
  for (const origin of forbiddenOrigins) {
    fail(file, `public source must not reference non-canonical origin: ${origin}`);
  }
}

if (!isStaging) {
  const sitemapFile = "sitemap.xml";
  const sitemap = fs.readFileSync(path.join(root, sitemapFile), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].trim(),
  );

  for (const url of urls) {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      fail(sitemapFile, `sitemap contains an invalid URL: ${url}`);
      continue;
    }

    if (parsedUrl.origin !== productionOrigin) {
      fail(sitemapFile, `sitemap URL must use ${productionOrigin}: ${url}`);
      continue;
    }

    const file = pageFileFor(url);
    const absolutePath = path.join(root, file);
    if (!fs.existsSync(absolutePath)) {
      fail(sitemapFile, `sitemap URL has no matching page: ${url}`);
      continue;
    }

    const html = fs.readFileSync(absolutePath, "utf8");
    const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(
      (match) => match[0],
    );
    const canonicalTags = linkTags.filter((tag) =>
      attributeValue(tag, "rel").toLowerCase().split(/\s+/).includes("canonical"),
    );
    const canonicals = canonicalTags.map((tag) => attributeValue(tag, "href"));
    if (canonicals.length !== 1 || canonicals[0] !== url) {
      fail(file, `canonical must appear exactly once and match sitemap URL: ${url}`);
    }
  }
}

if (hasError) process.exit(1);

console.log("Canonical host, redirect, and public URL checks passed");

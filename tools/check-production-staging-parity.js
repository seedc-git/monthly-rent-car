const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const headSha = process.argv[2];
const productionHost = "monthly-rent-car.jp";
const stagingHost = "stg.monthly-rent-car.jp";
const mediaRegistryFile = "data/media-articles.json";
const stagingSitemapExcludedPages = new Set([
  "area/tachikawa/index.html",
  "guide/monthly-rentacar-cheap-comparison/index.html",
]);

if (!headSha) {
  console.error("Usage: node tools/check-production-staging-parity.js <production-head-sha>");
  process.exit(1);
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}

function listChangedFiles(args) {
  return git(args)
    .split("\0")
    .filter(Boolean);
}

function parseMediaRegistry(contents, label) {
  let registry;
  try {
    registry = JSON.parse(contents);
  } catch (error) {
    throw new Error(`${label} MEDIA registry is invalid JSON: ${error.message}`);
  }

  if (!registry || !Array.isArray(registry.articles)) {
    throw new Error(`${label} MEDIA registry must contain an articles array`);
  }

  return registry;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function sameJsonValue(left, right) {
  return (
    JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right))
  );
}

function articlesByUrl(articles, label) {
  const byUrl = new Map();
  for (const article of articles) {
    if (!article || typeof article.url !== "string" || !article.url) {
      throw new Error(`${label} MEDIA registry contains an article without a URL`);
    }
    if (byUrl.has(article.url)) {
      throw new Error(`${label} MEDIA registry contains duplicate URL ${article.url}`);
    }
    byUrl.set(article.url, article);
  }
  return byUrl;
}

function normalizeMediaArticles(worktreeDir) {
  const productionText = git(["show", `${headSha}:${mediaRegistryFile}`]);
  const mainText = git(["show", `origin/main:${mediaRegistryFile}`]);
  const stagingPath = path.join(worktreeDir, mediaRegistryFile);
  const stagingText = fs.readFileSync(stagingPath, "utf8");
  const productionRegistry = parseMediaRegistry(productionText, "Production");
  const mainRegistry = parseMediaRegistry(mainText, "Main");
  const stagingRegistry = parseMediaRegistry(stagingText, "Staging");
  const productionArticles = articlesByUrl(
    productionRegistry.articles,
    "Production",
  );
  const mainArticles = articlesByUrl(mainRegistry.articles, "Main");
  const stagingArticles = articlesByUrl(stagingRegistry.articles, "Staging");
  let valid = true;

  const productionMetadata = { ...productionRegistry };
  const stagingMetadata = { ...stagingRegistry };
  delete productionMetadata.articles;
  delete stagingMetadata.articles;
  if (!sameJsonValue(productionMetadata, stagingMetadata)) {
    valid = false;
    console.error(
      `::error file=${mediaRegistryFile}::Production MEDIA registry metadata does not match staging`,
    );
  }

  for (const [url, productionArticle] of productionArticles) {
    const stagingArticle = stagingArticles.get(url);
    if (!stagingArticle) {
      valid = false;
      console.error(
        `::error file=${mediaRegistryFile}::Production MEDIA article ${url} is not registered in staging`,
      );
      continue;
    }
    if (!sameJsonValue(productionArticle, stagingArticle)) {
      valid = false;
      console.error(
        `::error file=${mediaRegistryFile}::Production MEDIA article ${url} does not match its staging registry entry`,
      );
    }
  }

  for (const url of mainArticles.keys()) {
    if (!productionArticles.has(url) && stagingArticles.has(url)) {
      valid = false;
      console.error(
        `::error file=${mediaRegistryFile}::Production removes MEDIA article ${url}, but that removal is not registered in staging`,
      );
    }
  }

  const productionOrder = Array.from(productionArticles.keys());
  const productionUrls = new Set(productionOrder);
  const stagingProductionOrder = stagingRegistry.articles
    .map((article) => article.url)
    .filter((url) => productionUrls.has(url));
  if (!sameJsonValue(productionOrder, stagingProductionOrder)) {
    valid = false;
    console.error(
      `::error file=${mediaRegistryFile}::Production MEDIA article order does not match the relative order in staging`,
    );
  }

  if (!valid) return false;

  fs.writeFileSync(stagingPath, productionText);
  execFileSync(process.execPath, ["tools/sync-media-articles.cjs"], {
    cwd: worktreeDir,
    stdio: "inherit",
  });
  console.log(
    `Normalized staging MEDIA cards to ${productionArticles.size} production article(s)`,
  );
  return true;
}

function pageUrlFor(file, host) {
  if (file === "index.html") return `https://${host}/`;
  if (file.endsWith("/index.html")) {
    return `https://${host}/${file.slice(0, -"index.html".length)}`;
  }
  return `https://${host}/${file}`;
}

function normalizeSitemap(xml) {
  let normalized = xml.replaceAll(
    `https://${productionHost}`,
    `https://${stagingHost}`,
  );

  for (const file of stagingSitemapExcludedPages) {
    const url = pageUrlFor(file, stagingHost);
    const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(
      new RegExp(
        `\\s*<url>\\s*<loc>${escapedUrl}<\\/loc>\\s*<\\/url>`,
        "g",
      ),
      "",
    );
  }

  return normalized.replace(/\r\n/g, "\n").trim();
}

function normalizeAddedHtml(html) {
  return html
    .replace(
      /^\s*<meta\s+name="robots"\s+content="noindex, nofollow">\r?\n/m,
      "",
    )
    .replaceAll(`https://${stagingHost}`, `https://${productionHost}`)
    .replace(/\r\n/g, "\n")
    .trim();
}

function normalizeEnvironmentPatch(file, patch, isAdded) {
  let normalized = patch;

  if (file === "sitemap.xml" || file.endsWith(".html")) {
    normalized = normalized.replaceAll(
      `https://${productionHost}`,
      `https://${stagingHost}`,
    );
  }

  if (!isAdded && file.endsWith(".html")) {
    normalized = normalized
      .split("\n")
      .map((line) => {
        const isEnvironmentMeta =
          /^[+-]\s*<meta\s+/i.test(line) &&
          /(property="og:(?:url|image)"|name="twitter:image")/i.test(line);
        return isEnvironmentMeta
          ? line.replaceAll(
              `https://${productionHost}`,
              `https://${stagingHost}`,
            )
          : line;
      })
      .join("\n");
  }

  if (!isAdded && file === "thanks/index.html") {
    normalized = normalized.replace(
      /^(\+\s*<meta\s+name="robots"\s+content=")noindex(">)/m,
      "$1noindex, nofollow$2",
    );
  }

  if (isAdded && file.endsWith(".html")) {
    normalized = normalized.replace(
      /^\+(\s*)<link rel="canonical" href="https:\/\/stg\.monthly-rent-car\.jp\/[^"]*">\r?$/m,
      '+$1<meta name="robots" content="noindex, nofollow">',
    );
  }

  return normalized;
}

const range = `origin/main...${headSha}`;
const changedFiles = listChangedFiles(["diff", "--name-only", "-z", range]);
const addedFiles = new Set(
  listChangedFiles(["diff", "--diff-filter=A", "--name-only", "-z", range]),
);

if (changedFiles.length === 0) {
  process.exit(0);
}

const worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), "staging-check-"));
const patchDir = fs.mkdtempSync(path.join(os.tmpdir(), "staging-patches-"));
let failed = false;

try {
  git(["worktree", "add", "--detach", worktreeDir, "origin/staging"], {
    stdio: "inherit",
  });

  if (!normalizeMediaArticles(worktreeDir)) {
    failed = true;
  }

  for (const [index, file] of failed ? [] : changedFiles.entries()) {
    if (file === "sitemap.xml") {
      const productionSitemap = git(["show", `${headSha}:${file}`]);
      const stagingSitemap = fs.readFileSync(
        path.join(worktreeDir, file),
        "utf8",
      );
      if (
        normalizeSitemap(productionSitemap) !==
        normalizeSitemap(stagingSitemap)
      ) {
        failed = true;
        console.error(
          `::error file=${file}::Production sitemap changes beyond staging exclusions are not included in staging`,
        );
      }
      continue;
    }

    if (addedFiles.has(file) && file.endsWith(".html")) {
      const productionHtml = git(["show", `${headSha}:${file}`]);
      const stagingHtml = fs.readFileSync(
        path.join(worktreeDir, file),
        "utf8",
      );
      if (
        normalizeAddedHtml(productionHtml) !==
        normalizeAddedHtml(stagingHtml)
      ) {
        failed = true;
        console.error(
          `::error file=${file}::Production HTML content is not included in staging`,
        );
      }
      continue;
    }

    const patch = git([
      "diff",
      "--binary",
      "--unified=0",
      range,
      "--",
      file,
    ]);
    const normalized = normalizeEnvironmentPatch(
      file,
      patch,
      addedFiles.has(file),
    );
    const patchPath = path.join(patchDir, `${index}.patch`);
    fs.writeFileSync(patchPath, normalized);

    try {
      git(
        [
          "-C",
          worktreeDir,
          "apply",
          "--reverse",
          "--check",
          "--unidiff-zero",
          patchPath,
        ],
        { stdio: "pipe" },
      );
    } catch {
      failed = true;
      console.error(
        `::error file=${file}::Production change is not included in staging`,
      );
    }
  }
} catch (error) {
  failed = true;
  console.error(`::error::Production/staging parity setup failed: ${error.message}`);
} finally {
  try {
    git(["worktree", "remove", "--force", worktreeDir], { stdio: "inherit" });
  } catch {
    console.error(`::warning::Could not remove temporary worktree ${worktreeDir}`);
  }
  fs.rmSync(patchDir, { recursive: true, force: true });
}

if (failed) {
  process.exit(1);
}

console.log(
  `Production/staging parity check passed for ${changedFiles.length} files`,
);

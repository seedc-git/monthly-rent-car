const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const headSha = process.argv[2];
const productionHost = "monthly-rent-car.jp";
const stagingHost = "stg.monthly-rent-car.jp";
const stagingSitemapExcludedPages = new Set([
  "area/tachikawa/index.html",
]);

if (!headSha) {
  console.error("Usage: node tools/check-production-staging-parity.js <production-head-sha>");
  process.exit(1);
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    ...options,
  });
}

function listChangedFiles(args) {
  return git(args)
    .split("\0")
    .filter(Boolean);
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

  if (file === "sitemap.xml" || (isAdded && file.endsWith(".html"))) {
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

  for (const [index, file] of changedFiles.entries()) {
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
} finally {
  try {
    git(["worktree", "remove", worktreeDir], { stdio: "inherit" });
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

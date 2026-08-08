const fs = require("fs");
const path = require("path");

// Generate a new shop page by copying an existing one and swapping the shop-specific strings.
//
//   node tools/new-shop.cjs data/shops/<slug>.json --check   Report the plan without writing
//   node tools/new-shop.cjs data/shops/<slug>.json           Generate
//
// Run this on the branch you are targeting. The reference page is read from the working tree,
// so a run on staging inherits the stg host and the noindex meta, and a run on a main-targeted
// branch inherits the production host and the canonical link. There is no host rewriting here.
//
// After generating, run `node tools/sync-media-articles.cjs` so the MEDIA block on the new page
// matches data/media-articles.json, then the rest of the CI checks.

const root = process.cwd();

// Reference shops and their real values. All live in the repo; these are the strings replaced.
//
// tachikawa is the current shape of a shop page and the one to copy: it has the framed heading
// with the h1, the summary paragraphs, the embedded map and the MAP buttons. sakado and omiya are
// the older shape, kept because some existing shops still look like that.
const templates = {
  // The current shape. Has the store-photo gallery, which is dropped when the new shop has none.
  tachikawa: {
    prefSlug: "tokyo",
    pref: "東京",
    prefFull: "東京都",
    slug: "tachikawa",
    shop: "立川店",
    place: "立川",
    city: "立川市",
    postal: "190-0012",
    street: "曙町2-22-20 立川センタービル",
    building: "立川センタービル",
    town: "曙町",
    station: "立川駅",
    walk: "徒歩6分",
    mapUrl: "https://maps.app.goo.gl/XD797tzPuGeetZ1m8",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3240.112641817858!2d139.4174677!3d35.6988456!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188d4e7f58340d%3A0x4e6890ca72d030a1!2z5p2x5Lqs44Oe44Oz44K544Oq44O844Os44Oz44K_44Kr44O844CQ56uL5bed5bqX44CR!5e0!3m2!1sja!2sjp!4v1785669230917!5m2!1sja!2sjp",
    lineUrl: "https://lin.ee/ojmETte",
    exteriorExt: "png",
    servicePhotos: true,
    framedHeading: true,
  },
  // Older shape: no framed heading, no summary, no map. No MEDIA service-photo carousel.
  sakado: {
    prefSlug: "saitama",
    pref: "埼玉",
    prefFull: "埼玉県",
    slug: "sakado",
    shop: "坂戸店",
    place: "坂戸",
    city: "坂戸市",
    postal: "350-0225",
    street: "日の出町16-7 サンライズプラザ",
    building: "サンライズプラザ",
    station: "坂戸駅",
    walk: "徒歩3分",
    lineUrl: "https://lin.ee/7iaNIAb",
    exteriorExt: "webp",
    servicePhotos: false,
  },
  // With the service-photo carousel; needs eight <slug>-service-*.webp files.
  omiya: {
    prefSlug: "saitama",
    pref: "埼玉",
    prefFull: "埼玉県",
    slug: "omiya",
    shop: "大宮店",
    place: "大宮",
    city: "さいたま市大宮区",
    postal: "330-0854",
    street: "桜木町1-7-5 ソニックシティビル",
    building: "ソニックシティビル",
    station: "大宮駅",
    walk: "徒歩6分",
    lineUrl: "https://lin.ee/wJ7NBEq",
    exteriorExt: "png",
    servicePhotos: true,
  },
};

const required = [
  "template", "slug", "prefSlug", "pref", "prefFull", "shop", "place", "city",
  "postal", "street", "building", "station", "walk", "lineUrl", "exteriorExt",
];

// Only the current-shape template carries these, so they are required only when copying from it.
const framedHeadingRequired = ["town", "mapUrl", "mapEmbed"];

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function attributeUrl(url) {
  return url ? url.split("&").join("&amp;") : url;
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) fail(`config not found: ${configPath}`);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const missing = required.filter((key) => !config[key]);
  if (missing.length) fail(`config is missing: ${missing.join(", ")}`);
  if (!templates[config.template]) fail(`template must be one of: ${Object.keys(templates).join(", ")}`);
  if (templates[config.template].framedHeading) {
    const absent = framedHeadingRequired.filter((key) => !config[key]);
    if (absent.length) fail(`template ${config.template} also needs: ${absent.join(", ")}`);
    if (config.mapUrl.includes("&")) fail("mapUrl must not contain & (it also goes into JSON-LD)");
  }
  if (!/^[a-z0-9-]+$/.test(config.slug)) fail("slug must be lowercase letters, digits and hyphens");
  if (!/^\d{3}-\d{4}$/.test(config.postal)) fail("postal must look like 123-4567");
  if (!config.lineUrl.startsWith("https://lin.ee/")) fail("lineUrl must start with https://lin.ee/");
  return config;
}

// Longest match first. 坂戸 is a substring of 坂戸店 / 坂戸市 / 坂戸駅, and street contains building,
// so replacing the short form first would corrupt the long ones.
//
// The prefecture pairs are deliberately narrow. A reference page mentions its own prefecture in
// three places that must NOT move when the new shop is in a different prefecture:
//   <cite>埼玉県／個人事業主</cite>          a customer review, identical on every page
//   東京・神奈川・埼玉の各店舗でご相談…      the three prefectures the company covers
//   <h3>埼玉県</h3>                          the shop list's prefecture heading
// So there is no bare `埼玉` or `埼玉県` pair; each real occurrence is matched with its context.
// (The shop list itself is protected separately in buildPage.)
function buildReplacements(from, to) {
  const pairs = [
    [from.street, to.street],
    [from.building, to.building],
    [from.postal, to.postal],
    // The embedded map. A long unique string, so it can go anywhere before the shorter pairs.
    // It only ever lands in the iframe's src, so its query separators are escaped for HTML.
    [from.mapEmbed, attributeUrl(to.mapEmbed)],
    // mapUrl lands in hrefs AND in the JSON-LD hasMap. Script content is not entity-decoded, so a
    // &amp; there would end up literally in the URL. loadConfig rejects a mapUrl containing &.
    [from.mapUrl, to.mapUrl],
    // Address as displayed on the page. Must run before the bare city pair.
    [`${from.prefFull}${from.city}`, `${to.prefFull}${to.city}`],
    // Address in the JSON-LD. The key keeps this off the review and the list heading.
    [`"addressRegion": "${from.prefFull}"`, `"addressRegion": "${to.prefFull}"`],
    [from.city, to.city],
    // The town alone appears in the summary sentence (「東京都立川市曙町にある」). After street,
    // which contains it.
    [from.town, to.town],
    [from.station, to.station],
    [from.walk, to.walk],
    [from.lineUrl, to.lineUrl],
    // The page heading, e.g. 埼玉｜坂戸店. Must run before the bare shop pair.
    [`${from.pref}｜${from.shop}`, `${to.pref}｜${to.shop}`],
    // The brand name carries the prefecture: 埼玉マンスリーレンタカー.
    [`${from.pref}マンスリーレンタカー`, `${to.pref}マンスリーレンタカー`],
    [from.shop, to.shop],
    [from.place, to.place],
    // This page's own URL (canonical, og:url, JSON-LD). Must run before the slug pair, and it
    // stays whole so the links to the other shops in this prefecture are left alone.
    [`/shop/${from.prefSlug}/${from.slug}/`, `/shop/${to.prefSlug}/${to.slug}/`],
    [`${from.prefSlug}-monthly-logo`, `${to.prefSlug}-monthly-logo`],
    // The decorative frame behind the heading carries no shop name, so every shop shares one file
    // rather than a copy per shop. Before the slug pair, which would rename it.
    [`${from.slug}-store-heading-frame`, "store-heading-frame"],
    // The slug is also the page's CSS class prefix (.sakado-access-card and friends), so this
    // single pair moves the image names and roughly 220 class references together.
    [from.slug, to.slug],
  ];
  if (from.exteriorExt !== to.exteriorExt) {
    // After the slug pair, so the file is already named for the new shop.
    pairs.push([
      `${to.slug}-store-exterior.${from.exteriorExt}`,
      `${to.slug}-store-exterior.${to.exteriorExt}`,
    ]);
  }
  return pairs.filter(([a, b]) => a !== b);
}

function referencePagePath(template) {
  return path.join(root, "shop", template.prefSlug, template.slug, "index.html");
}

// Every page carries the full shop list, including a link to the shop it belongs to. Those lines
// describe the other shops, not this one, so they must survive the replacements verbatim —
// otherwise the reference shop's own entry would be rewritten into the new shop and disappear from
// the list. They are lifted out, the replacements run, then they go back untouched.
// insertIntoShopLists() adds the new shop to this list afterwards, on this page like every other.
const shopListLinePattern = /^\s*<li><a href="\/shop\/[a-z0-9-]+\/[a-z0-9-]+\/">/;

// The MEDIA carousel is the same on every page and its cards are about whatever the articles cover
// — one of them is about 立川, which is also the reference shop. Copying from 立川 without this
// would rewrite that article into the new shop. sync-media-articles.cjs owns this block anyway.
const mediaStartMarker = "<!-- media-articles:start -->";
const mediaEndMarker = "<!-- media-articles:end -->";

// Store-photo gallery, by line. A new shop has no photos of its own, so the block comes out whole:
// from the gallery title down to the line that closes the gallery div.
function dropGalleryLines(lines, slug) {
  const start = lines.findIndex((line) => line.includes(`<div class="${slug}-gallery-title">`));
  const open = lines.findIndex((line) => line.includes(`<div class="${slug}-gallery">`));
  if (start === -1 || open === -1) fail(`could not find the ${slug} gallery block to remove`);

  let depth = 0;
  let end = -1;
  for (let i = open; i < lines.length; i += 1) {
    depth += (lines[i].match(/<div\b/g) || []).length;
    depth -= (lines[i].match(/<\/div>/g) || []).length;
    if (depth === 0) {
      end = i;
      break;
    }
  }
  if (end === -1) fail("the gallery block is not balanced");

  const out = lines.slice(0, start).concat(lines.slice(end + 1));
  // The gallery was preceded by a blank line; drop it so the card does not end with two.
  if (out[start - 1] !== undefined && out[start - 1].trim() === "") out.splice(start - 1, 1);
  return out;
}

// The gallery photos are also listed in the LocalBusiness JSON-LD. Leave the exterior shot, and
// move the closing comma onto whatever line ends up last.
function dropServicePhotoLines(lines) {
  const kept = lines.filter((line) => !/^\s*"https:\/\/\S+\/assets\/img\/[a-z0-9-]+-service-\S+",?$/.test(line));
  for (let i = 0; i < kept.length; i += 1) {
    if (/^\s*\]\s*$/.test(kept[i]) && /-store-exterior\.[a-z]+",$/.test(kept[i - 1] || "")) {
      kept[i - 1] = kept[i - 1].replace(/,$/, "");
    }
  }
  return kept;
}

function buildPage(config) {
  const template = templates[config.template];
  let lines = fs.readFileSync(referencePagePath(template), "utf8").split("\n");

  if (template.servicePhotos && !config.servicePhotos) {
    lines = dropServicePhotoLines(dropGalleryLines(lines, template.slug));
  }

  const keep = [];
  let inMedia = false;
  const masked = lines.map((line) => {
    if (line.includes(mediaStartMarker)) inMedia = true;
    const protect = inMedia || shopListLinePattern.test(line);
    if (line.includes(mediaEndMarker)) inMedia = false;
    if (!protect) return line;
    keep.push(line);
    return `__KEEP_${keep.length - 1}__`;
  });
  if (!keep.length) fail(`nothing to protect in ${referencePagePath(template)} — check the markers`);

  let html = masked.join("\n");
  for (const [from, to] of buildReplacements(template, config)) {
    html = html.split(from).join(to);
  }
  keep.forEach((line, i) => {
    html = html.split(`__KEEP_${i}__`).join(line);
  });
  return html;
}

function shopListLine(config) {
  return `                <li><a href="/shop/${config.prefSlug}/${config.slug}/">`
    + `${config.shop}<span class="visually-hidden">のマンスリーレンタカー</span></a></li>`;
}

function findHtmlPages(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) findHtmlPages(absolute, found);
    else if (entry.name.endsWith(".html")) found.push(absolute);
  }
  return found;
}

// The shop list is duplicated verbatim on the home page and on every shop page, so one new shop
// means one new line in each of them.
function insertIntoShopLists(config, afterSlug) {
  const anchor = `href="/shop/${config.prefSlug}/${afterSlug}/"`;
  const line = shopListLine(config);
  const touched = [];

  for (const page of findHtmlPages(root).sort()) {
    const text = fs.readFileSync(page, "utf8");
    if (text.includes(line) || !text.includes(anchor)) continue;
    const out = [];
    let inserted = false;
    for (const current of text.split("\n")) {
      out.push(current);
      if (!inserted && current.includes(anchor) && current.includes("<li>")) {
        out.push(line);
        inserted = true;
      }
    }
    if (!inserted) continue;
    fs.writeFileSync(page, out.join("\n"));
    touched.push(path.relative(root, page).split(path.sep).join("/"));
  }
  return touched;
}

// The home page carries the same shops again as a department array in its Organization JSON-LD.
// Only the last member has no trailing comma, so rather than special-casing where the new member
// lands, insert it and then rewrite the commas across the whole array.
//
// The host is read off the neighbouring entry rather than derived from the branch: on staging the
// page's own og:url points at stg, but this array still uses the production host. Matching the
// neighbours keeps the new entry consistent with whatever the array already does.
function insertIntoHomeJsonLd(config, afterSlug) {
  const indexPath = path.join(root, "index.html");
  const lines = fs.readFileSync(indexPath, "utf8").split("\n");
  if (lines.some((line) => line.includes(`/shop/${config.prefSlug}/${config.slug}/#store`))) return false;

  const anchorPath = `/shop/${config.prefSlug}/${afterSlug}/#store`;
  const at = lines.findIndex((line) => line.includes(anchorPath) && line.includes('"AutoRental"'));
  if (at === -1) return false;

  const host = lines[at].match(/"@id": "(https?:\/\/[^/]+)/);
  if (!host) return false;
  const url = `${host[1]}/shop/${config.prefSlug}/${config.slug}/`;
  const member = `          { "@type": "AutoRental", "@id": "${url}#store", `
    + `"name": "${config.pref}マンスリーレンタカー ${config.shop}", "url": "${url}" }`;
  lines.splice(at + 1, 0, member);

  const members = [];
  lines.forEach((line, i) => {
    if (line.includes('"@type": "AutoRental"')) members.push(i);
  });
  members.forEach((i) => {
    lines[i] = lines[i].replace(/,\s*$/, "");
  });
  members.slice(0, -1).forEach((i) => {
    lines[i] += ",";
  });

  fs.writeFileSync(indexPath, lines.join("\n"));
  return true;
}

// check-seo-metadata.js keeps its own list of shop pages and refuses any shop page that is not in
// it, so a new shop has to be registered there too or CI fails.
function insertIntoSeoRegistry(config) {
  const checkerPath = path.join(root, "tools", "check-seo-metadata.js");
  const text = fs.readFileSync(checkerPath, "utf8");
  const key = `"shop/${config.prefSlug}/${config.slug}/index.html"`;
  if (text.includes(key)) return false;

  const anchorSlug = config.insertAfter || templates[config.template].slug;
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.includes(`/${anchorSlug}/index.html": { slug:`));
  if (at === -1) return false;

  const indent = lines[at].match(/^\s*/)[0];
  lines.splice(at + 1, 0, `${indent}${key}: { slug: "${config.slug}", name: "${config.place}" },`);
  fs.writeFileSync(checkerPath, lines.join("\n"));
  return true;
}

function insertIntoSitemap(config, baseUrl) {
  const sitemapPath = path.join(root, "sitemap.xml");
  const text = fs.readFileSync(sitemapPath, "utf8");
  const url = `${baseUrl}/shop/${config.prefSlug}/${config.slug}/`;
  if (text.includes(`<loc>${url}</loc>`)) return false;
  fs.writeFileSync(sitemapPath, text.replace("</urlset>", `  <url>\n    <loc>${url}</loc>\n  </url>\n</urlset>`));
  return true;
}

function main() {
  const configPath = process.argv[2];
  if (!configPath) fail("usage: node tools/new-shop.cjs data/shops/<slug>.json [--check]");
  const config = loadConfig(path.resolve(configPath));
  const checkOnly = process.argv.includes("--check");
  const template = templates[config.template];

  // Same signal the other tools use: the CNAME file marks a staging checkout.
  const cnamePath = path.join(root, "CNAME");
  const isStaging = fs.existsSync(cnamePath)
    && fs.readFileSync(cnamePath, "utf8").trim() === "stg.monthly-rent-car.jp";
  const baseUrl = isStaging ? "https://stg.monthly-rent-car.jp" : "https://monthly-rent-car.jp";

  console.log(`branch target : ${isStaging ? "staging" : "production"} (${baseUrl})`);
  console.log(`reference     : ${template.shop} (${config.template})`);
  console.log(`new shop      : ${config.pref}マンスリーレンタカー ${config.shop}`);
  console.log(`url           : /shop/${config.prefSlug}/${config.slug}/`);
  console.log(`address       : 〒${config.postal} ${config.prefFull}${config.city}${config.street}`);
  console.log(`access        : ${config.station} ${config.walk}`);
  console.log(`line          : ${config.lineUrl}`);
  if (template.framedHeading) {
    console.log(`map           : ${config.mapUrl}`);
    console.log(`gallery       : ${config.servicePhotos ? "kept" : "removed (no store photos yet)"}`);
  }

  console.log("\nreplacements, in order:");
  for (const [from, to] of buildReplacements(template, config)) {
    console.log(`  ${from}  ->  ${to}`);
  }

  // check-seo-metadata.js verifies all three OGP sizes exist and match their declared dimensions.
  // The 1731x909 source is never referenced by a page, so it is easy to forget.
  const images = [
    `assets/img/${config.slug}-store-exterior.${config.exteriorExt}`,
    `assets/ogp/shops/${config.slug}-1731x909.png`,
    `assets/ogp/shops/${config.slug}-1200x630.jpg`,
    `assets/ogp/shops/${config.slug}-1200x1200.png`,
  ];
  if (template.framedHeading) images.push("assets/img/store-heading-frame-20260803.webp");
  console.log("\nimages required:");
  for (const image of images) {
    console.log(`  [${fs.existsSync(path.join(root, image)) ? "ok " : "-- "}] ${image}`);
  }
  if (config.servicePhotos) {
    const found = fs.existsSync(path.join(root, "assets/img"))
      ? fs.readdirSync(path.join(root, "assets/img")).filter((f) => f.startsWith(`${config.slug}-service-`)).length
      : 0;
    console.log(`  [${found === 8 ? "ok " : "-- "}] assets/img/${config.slug}-service-*.webp (${found}/8)`);
  }

  if (checkOnly) {
    console.log("\n--check: nothing written.");
    return;
  }

  const outDir = path.join(root, "shop", config.prefSlug, config.slug);
  if (fs.existsSync(outDir)) fail(`${path.relative(root, outDir)} already exists`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), buildPage(config));
  console.log(`\nwrote shop/${config.prefSlug}/${config.slug}/index.html`);

  const after = config.insertAfter || template.slug;
  console.log(`shop lists    : ${insertIntoShopLists(config, after).length} page(s)`);
  console.log(`home JSON-LD  : ${insertIntoHomeJsonLd(config, after) ? "inserted" : "unchanged"}`);
  console.log(`sitemap.xml   : ${insertIntoSitemap(config, baseUrl) ? "inserted" : "unchanged"}`);
  console.log(`seo registry  : ${insertIntoSeoRegistry(config) ? "inserted" : "unchanged"}`);

  console.log("\nnext: node tools/sync-media-articles.cjs && node tools/check-seo-metadata.js");
}

main();

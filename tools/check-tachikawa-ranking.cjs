const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const pageFile = "area/tachikawa/index.html";
const cssFile = "area/tachikawa/article.css";
const jsFile = "area/tachikawa/article.js";
const pagePath = path.join(root, pageFile);
const cssPath = path.join(root, cssFile);
const jsPath = path.join(root, jsFile);

const expectedTitle =
  "【2026年最新】立川市の格安レンタカーおすすめ10選｜1ヶ月・長期料金を比較";
const expectedMobileTitleLines = [
  "【2026年最新】",
  "立川市の格安レンタカー",
  "おすすめ10選",
  "1ヶ月・長期料金を比較",
];
const expectedDescription =
  "立川市で利用できる格安レンタカー10社を、1ヶ月料金、車種、保険・補償、配車・引取り、トラブル時のサポートで比較。立川駅周辺の店舗型から宅配型まで、長期利用に適したサービスと選び方を解説します。";
const expectedCanonical = "https://monthly-rent-car.jp/area/tachikawa/";
const cssRoot = ".area-ranking-page.area-tachikawa";
const transparentHeaderLogo = "../../assets/img/monthly-rentacar-logo-transparent.png";
const finalEyecatch =
  "../../assets/img/area/tachikawa/generated/tachikawa-ranking-eyecatch.webp";

const expectedRankings = [
  {
    rank: 1,
    name: "東京マンスリーレンタカー（立川店）",
    price: "26,400円〜",
    rating: 5,
  },
  {
    rank: 2,
    name: "ガッツレンタカー立川店",
    price: "27,280円〜",
    rating: 4,
  },
  {
    rank: 3,
    name: "マンスリーゴー",
    price: "32,340円〜",
    rating: 4,
  },
  {
    rank: 4,
    name: "GOGOマンスリーレンタカー",
    price: "47,800円〜",
    rating: 4,
  },
  {
    rank: 5,
    name: "Maverickレンタカー八王子店",
    price: "33,200円〜",
    rating: 4,
  },
  {
    rank: 6,
    name: "東京ビジネスレンタカー",
    price: "軽ワゴン62,000円",
    rating: 3,
  },
  {
    rank: 7,
    name: "日本レンタリース東京",
    price: "コンパクト・軽トラック64,900円",
    rating: 3,
  },
  {
    rank: 8,
    name: "ニコニコレンタカー",
    price: "96,800円〜",
    rating: 3,
  },
  {
    rank: 9,
    name: "ニッポンレンタカー立川北口営業所",
    price: "要見積もり",
    rating: 2,
  },
  {
    rank: 10,
    name: "Jネットレンタカー立川店",
    price: "要見積もり",
    rating: 2,
  },
];

const expectedFaq = [
  [
    "立川店では1ヶ月だけ利用できますか？",
    "はい。東京マンスリーレンタカー立川店は、1ヶ月から利用できます。1ヶ月以上になる可能性がある場合も、予定期間をもとにご相談ください。",
  ],
  [
    "立川で1ヶ月借りる場合、最も安い料金はいくらですか？",
    "東京マンスリーレンタカー立川店では、軽自動車を1ヶ月26,400円（税込）から利用できます。車両クラス、利用開始日、配車、オプションなどにより総額は異なります。",
  ],
  [
    "立川駅で車を受け取れますか？",
    "立川駅周辺での受け渡しにも対応しています。具体的な場所と時間は、予約時にご案内します。",
  ],
  [
    "立川市内の自宅や会社まで車を届けてもらえますか？",
    "条件付きで車両のお届けに対応しています。希望する住所、利用期間、車両クラスをお知らせください。",
  ],
  [
    "修理が終わる日や納車日が決まっていなくても借りられますか？",
    "はい。予定している期間をもとにご相談いただけます。延長の可能性がある場合は、早めにお知らせください。",
  ],
  [
    "個人と法人のどちらでも利用できますか？",
    "個人・法人のどちらでも利用できます。通勤、送迎、修理中の代車、社用車、営業車、期間限定プロジェクトなどに対応しています。",
  ],
  [
    "保険料は月額料金に含まれていますか？",
    "対人賠償、対物賠償、人身傷害、車両補償が付帯しています。任意の免責補償制度や一部オプションは別料金です。",
  ],
  [
    "事故や故障で車が使えなくなった場合はどうなりますか？",
    "まず立川店へ連絡してください。指定ロードサービスや代替車の手配についてご案内します。",
  ],
  [
    "借りる車種を指定できますか？",
    "希望する車両クラスはお伺いできますが、特定の車種を確約できない場合があります。軽自動車、軽ワゴン、広めの軽、軽バン、軽トラックなど、希望用途をお知らせください。",
  ],
  [
    "走行距離に制限はありますか？",
    "1ヶ月3,000kmまでの走行距離制限があります。超過した場合は、1kmにつき11円（税込）の超過料金が発生します。",
  ],
  [
    "1ヶ月の契約後に延長できますか？",
    "空車状況と次の予約状況によっては、1ヶ月単位で延長できます。延長の可能性がある場合は、予定が分かった時点でご相談ください。",
  ],
  [
    "最短でいつから借りられますか？",
    "利用開始日は空車状況や契約手続きによって異なります。希望日をお知らせいただければ、最短で案内できる日程を確認します。",
  ],
];

const expectedImageSlots = new Map([
  ["tachikawa-ranking-eyecatch", [1200, 630]],
  ["tachikawa-period-guide", [1200, 675]],
  ["ranking-logo-tokyo-monthly", [320, 160]],
  ["ranking-logo-guts", [320, 160]],
  ["ranking-logo-monthly-go", [320, 160]],
  ["ranking-logo-gogo", [320, 160]],
  ["ranking-logo-maverick", [320, 160]],
  ["ranking-logo-tokyo-business", [320, 160]],
  ["ranking-logo-nrtokyo", [320, 160]],
  ["ranking-logo-niconico", [320, 160]],
  ["ranking-logo-nippon", [320, 160]],
  ["ranking-logo-jnet", [320, 160]],
  ["tokyo-monthly-tachikawa-store", [1200, 675]],
  ["tachikawa-price-comparison", [1200, 675]],
  ["tachikawa-support-comparison", [1200, 675]],
  ["tachikawa-use-cases", [1200, 675]],
  ["tachikawa-area-map", [1200, 675]],
]);

const expectedCtas = [
  ["hero", "form", "https://form.run/@monthly-rent-car"],
  ["hero", "line", "https://lin.ee/ojmETte"],
  ["hero", "tel", "tel:05017920800"],
  ["rank1", "form", "https://form.run/@monthly-rent-car"],
  ["rank1", "line", "https://lin.ee/ojmETte"],
  ["price", "form", "https://form.run/@monthly-rent-car"],
  ["support", "form", "https://form.run/@monthly-rent-car"],
  ["final", "form", "https://form.run/@monthly-rent-car"],
  ["final", "line", "https://lin.ee/ojmETte"],
  ["final", "tel", "tel:05017920800"],
];

const requiredStaticText = [
  "立川市でレンタカーを探すと、「24時間2,200円〜」「1ヶ月26,400円〜」など、さまざまな料金が見つかります。",
  "まず確認｜利用期間によっておすすめのレンタカーは異なる",
  "1ヶ月以上の利用なら、東京マンスリーレンタカー立川店が第一候補",
  "立川市の格安レンタカーおすすめランキングTOP10",
  "1ヶ月の公開料金を車両クラス別に比較",
  "東京マンスリーレンタカーとガッツレンタカーを比較",
  "長期利用では車両補償とトラブル時の対応も確認",
  "立川市で長期レンタカーを選ぶ6つのポイント",
  "立川でマンスリーレンタカーが利用される主なケース",
  "立川エリアは駅周辺と市内移動で交通手段を使い分ける",
  "東京マンスリーレンタカー立川店の利用開始までの流れ",
  "立川市の格安レンタカーに関するよくある質問",
  "立川市で1ヶ月以上借りるなら、車両クラスとサポートまで比較しよう",
  "立川で1ヶ月以上のレンタカーを探している方へ",
  "調査方法・出典",
  "※本記事は、各社の公式サイト・料金表・利用条件をもとに当サイトが独自調査したものです。掲載サービスには当サイト運営サービスを含みます。料金・取扱車種・配車条件は、店舗、利用日、契約期間、在庫状況などにより変更される場合があります。",
];

const failures = [];
let assertionCount = 0;

function fail(file, message) {
  failures.push({ file, message });
}

function assert(condition, file, message) {
  assertionCount += 1;
  if (!condition) fail(file, message);
}

function readRequired(file, absolutePath) {
  try {
    return fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    fail(file, `ファイルを読み込めません: ${error.message}`);
    return "";
  }
}

function pngHasAlpha(absolutePath) {
  try {
    const buffer = fs.readFileSync(absolutePath);
    return (
      buffer.length > 25 &&
      buffer.toString("ascii", 1, 4) === "PNG" &&
      [4, 6].includes(buffer[25])
    );
  } catch {
    return false;
  }
}

function decodeHtml(value) {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#([0-9]+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    );
}

function normalizeText(value) {
  return decodeHtml(
    String(value)
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeContinuousText(value) {
  return decodeHtml(
    String(value)
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, ""),
  ).trim();
}

function normalizeFaqText(value) {
  return normalizeText(
    String(value).replace(
      /<([a-z][\w:-]*)\b[^>]*\baria-hidden\s*=\s*(?:"true"|'true'|true)[^>]*>[\s\S]*?<\/\1\s*>/gi,
      " ",
    ),
  ).replace(/\s+/g, "");
}

function parseAttributes(tag) {
  const attributes = {};
  const source = String(tag)
    .replace(/^<\s*\/?\s*[^\s>]+/i, "")
    .replace(/\/?\s*>$/, "");
  const pattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    attributes[name] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function findStartTags(source, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return [...source.matchAll(pattern)].map((match) => ({
    index: match.index,
    tag: match[0],
    attributes: parseAttributes(match[0]),
  }));
}

function findMatchingElement(source, start) {
  const nameMatch = start.tag.match(/^<\s*([a-z][\w:-]*)\b/i);
  if (!nameMatch) return null;
  const tagName = nameMatch[1];
  const voidElements = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  if (voidElements.has(tagName.toLowerCase()) || /\/\s*>$/.test(start.tag)) {
    return {
      start: start.index,
      end: start.index + start.tag.length,
      html: start.tag,
      startTag: start.tag,
      tagName,
    };
  }

  const pattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  pattern.lastIndex = start.index;
  let depth = 0;
  let match;
  while ((match = pattern.exec(source))) {
    const isClosing = /^<\s*\//.test(match[0]);
    const isSelfClosing = /\/\s*>$/.test(match[0]);
    if (isClosing) {
      depth -= 1;
      if (depth === 0) {
        return {
          start: start.index,
          end: pattern.lastIndex,
          html: source.slice(start.index, pattern.lastIndex),
          startTag: start.tag,
          tagName,
        };
      }
    } else if (!isSelfClosing) {
      depth += 1;
    }
  }
  return null;
}

function findElementById(source, id) {
  const starts = findStartTags(source, "[a-z][\\w:-]*");
  const match = starts.find((entry) => entry.attributes.id === id);
  return match ? findMatchingElement(source, match) : null;
}

function findElementByClass(source, className, tagName = "[a-z][\\w:-]*") {
  const match = findStartTags(source, tagName).find((entry) =>
    String(entry.attributes.class || "")
      .split(/\s+/)
      .includes(className),
  );
  return match ? findMatchingElement(source, match) : null;
}

function getMetaContent(source, attributeName, attributeValue) {
  const target = String(attributeValue).toLowerCase();
  const tag = findStartTags(source, "meta").find(
    (entry) =>
      String(entry.attributes[attributeName] || "").toLowerCase() === target,
  );
  return tag ? tag.attributes.content || "" : "";
}

function extractJsonLd(source) {
  const documents = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of source.matchAll(pattern)) {
    const attributes = parseAttributes(`<script${match[1]}>`);
    if (String(attributes.type).toLowerCase() !== "application/ld+json") continue;
    try {
      documents.push(JSON.parse(match[2]));
    } catch (error) {
      fail(pageFile, `JSON-LDを解析できません: ${error.message}`);
    }
  }
  return documents;
}

function visitJson(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) visitJson(item, visitor);
    return;
  }
  if (!value || typeof value !== "object") return;
  visitor(value);
  for (const child of Object.values(value)) visitJson(child, visitor);
}

function hasSchemaType(node, type) {
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  return types.includes(type);
}

function findSchemaNodes(documents, type) {
  const nodes = [];
  for (const document of documents) {
    visitJson(document, (node) => {
      if (hasSchemaType(node, type)) nodes.push(node);
    });
  }
  return nodes;
}

function splitCssSelectors(prelude) {
  const selectors = [];
  let start = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote = "";
  for (let index = 0; index < prelude.length; index += 1) {
    const char = prelude[index];
    if (quote) {
      if (char === quote && prelude[index - 1] !== "\\") quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      parentheses += 1;
    } else if (char === ")") {
      parentheses -= 1;
    } else if (char === "[") {
      brackets += 1;
    } else if (char === "]") {
      brackets -= 1;
    } else if (char === "," && parentheses === 0 && brackets === 0) {
      selectors.push(prelude.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(prelude.slice(start).trim());
  return selectors.filter(Boolean);
}

function findClosingBrace(source, openIndex) {
  let depth = 0;
  let quote = "";
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== "\\") quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function collectCssSelectors(source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const selectors = [];

  function scan(segment) {
    let cursor = 0;
    while (cursor < segment.length) {
      const open = segment.indexOf("{", cursor);
      if (open < 0) break;
      let prelude = segment.slice(cursor, open).trim();
      const lastSemicolon = prelude.lastIndexOf(";");
      if (lastSemicolon >= 0) prelude = prelude.slice(lastSemicolon + 1).trim();
      const close = findClosingBrace(segment, open);
      if (close < 0) break;
      const body = segment.slice(open + 1, close);
      const lower = prelude.toLowerCase();
      if (
        lower.startsWith("@media") ||
        lower.startsWith("@supports") ||
        lower.startsWith("@layer") ||
        lower.startsWith("@container") ||
        lower.startsWith("@scope")
      ) {
        scan(body);
      } else if (!lower.startsWith("@")) {
        selectors.push(...splitCssSelectors(prelude));
      }
      cursor = close + 1;
    }
  }

  scan(clean);
  return selectors.filter(
    (selector) =>
      selector &&
      !/^(?:from|to|\d+(?:\.\d+)?%)$/i.test(selector) &&
      !selector.includes(":export"),
  );
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value);
}

function hostWithoutWww(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const html = readRequired(pageFile, pagePath);
const css = readRequired(cssFile, cssPath);
const articleJs = readRequired(jsFile, jsPath);
const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
const bodyHtml = bodyMatch ? bodyMatch[0] : "";
const bodyText = normalizeText(bodyHtml);

// Core metadata and page-level exclusions.
const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
assert(normalizeText(titleMatch ? titleMatch[1] : "") === expectedTitle, pageFile, "titleが仕様と一致しません");
assert(
  getMetaContent(html, "name", "description") === expectedDescription,
  pageFile,
  "meta descriptionが仕様と一致しません",
);
const robots = getMetaContent(html, "name", "robots")
  .split(",")
  .map((token) => token.trim().toLowerCase())
  .filter(Boolean)
  .sort();
assert(
  JSON.stringify(robots) === JSON.stringify(["nofollow", "noindex"]),
  pageFile,
  "robotsはnoindex,nofollowの2指定だけにしてください",
);
const canonicalTags = findStartTags(html, "link").filter(
  (entry) => String(entry.attributes.rel).toLowerCase() === "canonical",
);
assert(canonicalTags.length === 1, pageFile, `canonicalは1件必要です（現在${canonicalTags.length}件）`);
assert(
  canonicalTags[0]?.attributes.href === expectedCanonical,
  pageFile,
  "canonicalが将来の本番URLと一致しません",
);

const h1Elements = findStartTags(bodyHtml, "h1")
  .map((start) => findMatchingElement(bodyHtml, start))
  .filter(Boolean);
assert(h1Elements.length === 1, pageFile, `H1は1件必要です（現在${h1Elements.length}件）`);
assert(
  normalizeContinuousText(h1Elements[0]?.html || "") === expectedTitle,
  pageFile,
  "H1が仕様と一致しません",
);
const mobileTitleLines = findStartTags(h1Elements[0]?.html || "", "span")
  .filter((start) =>
    String(start.attributes.class || "")
      .split(/\s+/)
      .includes("article-title-line"),
  )
  .map((start) => findMatchingElement(h1Elements[0]?.html || "", start))
  .filter(Boolean)
  .map((element) => normalizeContinuousText(element.html));
assert(
  JSON.stringify(mobileTitleLines) === JSON.stringify(expectedMobileTitleLines),
  pageFile,
  "モバイルH1は意味単位の4行に分けてください",
);
const mobileTitleDividers = findStartTags(h1Elements[0]?.html || "", "span").filter((start) =>
  String(start.attributes.class || "")
    .split(/\s+/)
    .includes("article-title-divider"),
);
assert(
  mobileTitleDividers.length === 1 &&
    normalizeContinuousText(
      findMatchingElement(h1Elements[0]?.html || "", mobileTitleDividers[0])?.html || "",
    ) === "｜",
  pageFile,
  "モバイルH1の区切り記号は専用要素で1件だけ保持してください",
);

const bodyStart = findStartTags(html, "body")[0];
const bodyClasses = String(bodyStart?.attributes.class || "").split(/\s+/);
assert(
  bodyClasses.includes("area-ranking-page") && bodyClasses.includes("area-tachikawa"),
  pageFile,
  "bodyにarea-ranking-pageとarea-tachikawaの両クラスが必要です",
);

const allIdTags = findStartTags(html, "[a-z][\\w:-]*").filter(
  (entry) => entry.attributes.id,
);
const ids = allIdTags.map((entry) => entry.attributes.id);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert(duplicateIds.length === 0, pageFile, `重複IDがあります: ${duplicateIds.join(", ")}`);

const breadcrumbMarkup = findStartTags(bodyHtml, "[a-z][\\w:-]*").filter((entry) => {
  const marker = `${entry.attributes.id || ""} ${entry.attributes.class || ""} ${
    entry.attributes["aria-label"] || ""
  }`;
  return /breadcrumb|パンくず/i.test(marker);
});
assert(breadcrumbMarkup.length === 0, pageFile, "パンくずマークアップを出力しないでください");
assert(!/パンくず/.test(bodyText), pageFile, "画面上にパンくずを表示しないでください");

const shareMarkup = findStartTags(bodyHtml, "[a-z][\\w:-]*").filter((entry) => {
  const marker = `${entry.attributes.id || ""} ${entry.attributes.class || ""}`;
  return /(?:^|\s)(?:sns|social)[-_]?share|share[-_](?:button|list|links?)/i.test(marker);
});
assert(shareMarkup.length === 0, pageFile, "SNSシェアUIを出力しないでください");
assert(
  !/(?:twitter\.com\/intent|x\.com\/intent|facebook\.com\/sharer|line\.me\/R\/msg\/text|b\.hatena)/i.test(
    bodyHtml,
  ),
  pageFile,
  "SNSシェアURLを出力しないでください",
);

// Structured data.
const jsonLd = extractJsonLd(html);
assert(jsonLd.length >= 1, pageFile, "JSON-LDが必要です");
for (const prohibited of ["BreadcrumbList", "Review", "AggregateRating"]) {
  assert(
    findSchemaNodes(jsonLd, prohibited).length === 0,
    pageFile,
    `${prohibited}構造化データは禁止です`,
  );
}

const itemLists = findSchemaNodes(jsonLd, "ItemList");
assert(itemLists.length === 1, pageFile, `ItemListは1件必要です（現在${itemLists.length}件）`);
const itemList = itemLists[0] || {};
const listItems = Array.isArray(itemList.itemListElement)
  ? itemList.itemListElement
  : [];
assert(itemList.numberOfItems === 10, pageFile, "ItemList.numberOfItemsは10にしてください");
assert(listItems.length === 10, pageFile, `ItemListは10項目必要です（現在${listItems.length}件）`);
expectedRankings.forEach((expected, index) => {
  const item = listItems[index] || {};
  assert(item.position === expected.rank, pageFile, `ItemList ${index + 1}件目のpositionが不正です`);
  assert(item.name === expected.name, pageFile, `ItemList ${expected.rank}位の会社名が不正です`);
  assert(
    String(item.url || "").endsWith(`#rank-${expected.rank}`),
    pageFile,
    `ItemList ${expected.rank}位のURLは#rank-${expected.rank}を指す必要があります`,
  );
});

const faqPages = findSchemaNodes(jsonLd, "FAQPage");
assert(faqPages.length === 1, pageFile, `FAQPageは1件必要です（現在${faqPages.length}件）`);
const schemaFaq = Array.isArray(faqPages[0]?.mainEntity)
  ? faqPages[0].mainEntity
  : [];
assert(schemaFaq.length === 12, pageFile, `FAQPageは12件必要です（現在${schemaFaq.length}件）`);
expectedFaq.forEach(([question, answer], index) => {
  const item = schemaFaq[index] || {};
  assert(item.name === question, pageFile, `FAQPage ${index + 1}件目の質問が仕様と一致しません`);
  assert(
    item.acceptedAnswer?.text === answer,
    pageFile,
    `FAQPage ${index + 1}件目の回答が仕様と一致しません`,
  );
});

const localBusinesses = findSchemaNodes(jsonLd, "LocalBusiness");
assert(
  localBusinesses.length === 1,
  pageFile,
  `LocalBusinessは自社立川店の1件だけにしてください（現在${localBusinesses.length}件）`,
);

// Ranking overview and ten detailed companies.
const rankingSection = findElementById(html, "ranking");
assert(Boolean(rankingSection), pageFile, "#rankingセクションが必要です");
const rankingTable = rankingSection
  ? findElementByClass(rankingSection.html, "ranking-table", "table")
  : null;
assert(Boolean(rankingTable), pageFile, "ランキング一覧表（table.ranking-table）が必要です");
const rankingBody = rankingTable?.html.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
const rankingRows = rankingBody
  ? [...rankingBody[1].matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map(
      (match) => match[0],
    )
  : [];
assert(rankingRows.length === 10, pageFile, `ランキング表は10行必要です（現在${rankingRows.length}行）`);
expectedRankings.forEach((expected, index) => {
  const row = rankingRows[index] || "";
  const rowText = normalizeText(row);
  assert(rowText.includes(`${expected.rank}位`), pageFile, `ランキング表${expected.rank}位の順位表示がありません`);
  assert(rowText.includes(expected.name), pageFile, `ランキング表${expected.rank}位の会社名が不正です`);
  assert(rowText.includes(expected.price), pageFile, `ランキング表${expected.rank}位の料金が不正です`);
  assert(
    new RegExp(`href=["']#rank-${expected.rank}["']`, "i").test(row),
    pageFile,
    `ランキング表${expected.rank}位の社内リンクが不正です`,
  );
  assert(
    row.includes(`aria-label="おすすめ度 5段階中${expected.rating}"`),
    pageFile,
    `ランキング表${expected.rank}位の星評価aria-labelが不正です`,
  );

  const detail = findElementById(html, `rank-${expected.rank}`);
  assert(Boolean(detail), pageFile, `#rank-${expected.rank}詳細セクションがありません`);
  assert(
    normalizeText(detail?.html || "").includes(`${expected.rank}位：${expected.name}`),
    pageFile,
    `#rank-${expected.rank}の見出しが仕様と一致しません`,
  );
});
assert(
  (rankingRows[0] || "").includes("is-recommended") &&
    normalizeText(rankingRows[0] || "").includes("おすすめ"),
  pageFile,
  "1位行にブランド強調クラスと可視の「おすすめ」表示が必要です",
);

// Completed, dimensioned article images.
const slotTags = findStartTags(bodyHtml, "[a-z][\\w:-]*").filter(
  (entry) => entry.attributes["data-image-slot"] !== undefined,
);
assert(slotTags.length === 17, pageFile, `画像スロットは17件必要です（現在${slotTags.length}件）`);
const slotIds = slotTags.map((entry) => entry.attributes["data-image-slot"]);
const extraSlots = slotIds.filter((id) => !expectedImageSlots.has(id));
assert(extraSlots.length === 0, pageFile, `仕様外の画像スロットがあります: ${extraSlots.join(", ")}`);
for (const [id, [width, height]] of expectedImageSlots) {
  const element = findElementById(html, id);
  assert(Boolean(element), pageFile, `画像スロット #${id} がありません`);
  if (!element) continue;
  const attributes = parseAttributes(element.startTag);
  assert(
    attributes["data-image-slot"] === id,
    pageFile,
    `#${id}のdata-image-slotはIDと同じ値にしてください`,
  );
  const image = findStartTags(element.html, "img")[0];
  assert(Boolean(image), pageFile, `#${id}内にimgが必要です`);
  assert(
    Number(image?.attributes.width) === width &&
      Number(image?.attributes.height) === height,
    pageFile,
    `#${id}の画像寸法は${width}x${height}にしてください`,
  );
  assert(
    Boolean(image?.attributes.src) &&
      !String(image?.attributes.src).startsWith("data:"),
    pageFile,
    `#${id}はdata URIのplaceholderではなく実画像を参照してください`,
  );
  assert(
    image?.attributes.alt !== undefined,
    pageFile,
    `#${id}のimgにalt属性が必要です`,
  );
}
assert(!/IMAGE SLOT|LOGO SLOT|画像準備中|差し替え予定/i.test(bodyHtml), pageFile, "画像placeholder表示を残さないでください");

const headerBrand = findElementByClass(bodyHtml, "brand", "a");
const headerBrandImage = findStartTags(headerBrand?.html || "", "img")[0];
assert(
  headerBrandImage?.attributes.src === transparentHeaderLogo,
  pageFile,
  "ヘッダーロゴは背景透過版を使用してください",
);
const footerBrand = findElementByClass(bodyHtml, "footer-logo", "a");
const footerBrandImage = findStartTags(footerBrand?.html || "", "img")[0];
assert(
  footerBrandImage?.attributes.src === transparentHeaderLogo,
  pageFile,
  "フッターロゴも背景透過版を使用してください",
);
const transparentLogoPath = path.resolve(
  path.dirname(pagePath),
  transparentHeaderLogo,
);
assert(
  pngHasAlpha(transparentLogoPath),
  pageFile,
  "背景透過ロゴは実際にalpha channelを持つPNGにしてください",
);
const eyecatch = findElementById(html, "tachikawa-ranking-eyecatch");
const eyecatchImage = findStartTags(eyecatch?.html || "", "img")[0];
assert(
  eyecatchImage?.attributes.src === finalEyecatch,
  pageFile,
  "アイキャッチは最終版のWebPを参照してください",
);

// Article CTAs and competitor-link confinement.
const anchors = findStartTags(html, "a");
const bodyAnchors = findStartTags(bodyHtml, "a");
const articleCtas = anchors.filter(
  (entry) => entry.attributes["data-cta-page"] !== undefined,
);
assert(articleCtas.length === 10, pageFile, `記事CTAリンクは10本必要です（現在${articleCtas.length}本）`);
assert(
  articleCtas.every(
    (entry) => entry.attributes["data-cta-page"] === "area-tachikawa",
  ),
  pageFile,
  "全記事CTAにdata-cta-page=\"area-tachikawa\"が必要です",
);
for (const [position, channel, href] of expectedCtas) {
  const matches = articleCtas.filter(
    (entry) =>
      entry.attributes["data-cta-position"] === position &&
      entry.attributes["data-cta-channel"] === channel,
  );
  assert(
    matches.length === 1,
    pageFile,
    `CTA ${position}/${channel} は1本必要です（現在${matches.length}本）`,
  );
  const cta = matches[0];
  if (!cta) continue;
  assert(cta.attributes.href === href, pageFile, `CTA ${position}/${channel} のリンク先が不正です`);
  if (channel === "form") {
    const rel = String(cta.attributes.rel || "").split(/\s+/);
    assert(cta.attributes.target === "_blank", pageFile, `CTA ${position}/form はtarget=\"_blank\"が必要です`);
    assert(rel.includes("noopener"), pageFile, `CTA ${position}/form はrel=\"noopener\"が必要です`);
  }
  if (channel === "line") {
    const classes = String(cta.attributes.class || "").split(/\s+/);
    assert(classes.includes("line-smart-link"), pageFile, `CTA ${position}/line にline-smart-linkが必要です`);
    assert(
      cta.attributes["data-pc-href"] === "../../line.html" &&
        cta.attributes["data-mobile-href"] === "https://lin.ee/ojmETte",
      pageFile,
      `CTA ${position}/line のPC/モバイルリンク設定が不正です`,
    );
  }
}

const sourceHeadingIndex = bodyHtml.indexOf("調査方法・出典");
const allowedExternalHosts = new Set([
  "monthly-rent-car.jp",
  "stg.monthly-rent-car.jp",
  "form.run",
  "lin.ee",
]);
const externalContentLinks = bodyAnchors.filter((entry) => {
  const href = entry.attributes.href || "";
  return isExternalUrl(href) && !allowedExternalHosts.has(hostWithoutWww(href));
});
for (const link of externalContentLinks) {
  const classes = String(link.attributes.class || "");
  assert(
    sourceHeadingIndex >= 0 && link.index > sourceHeadingIndex,
    pageFile,
    `競合・外部リンクは出典欄だけに配置してください: ${link.attributes.href}`,
  );
  assert(
    !/(?:cta|button)/i.test(classes) &&
      link.attributes["data-cta-page"] === undefined,
    pageFile,
    `競合リンクをCTA化しないでください: ${link.attributes.href}`,
  );
  const rel = new Set(String(link.attributes.rel || "").split(/\s+/));
  assert(link.attributes.target === "_blank", pageFile, `出典リンクはtarget=\"_blank\"が必要です: ${link.attributes.href}`);
  const externalHost = hostWithoutWww(link.attributes.href);
  const isPublicOfficialSource =
    externalHost.endsWith(".go.jp") || externalHost.endsWith(".lg.jp");
  if (!isPublicOfficialSource) {
    assert(rel.has("nofollow"), pageFile, `競合出典リンクのrelにnofollowが必要です: ${link.attributes.href}`);
  }
  for (const token of ["noopener", "noreferrer"]) {
    assert(rel.has(token), pageFile, `出典リンクのrelに${token}が必要です: ${link.attributes.href}`);
  }
}

// Dates must stay below the final conversion block and sources.
const articleDates = findElementByClass(bodyHtml, "article-dates");
assert(Boolean(articleDates), pageFile, "本文下部に.article-datesが必要です");
const articleDateTags = findStartTags(articleDates?.html || "", "time");
assert(articleDateTags.length === 3, pageFile, `記事末尾の日付time要素は3件必要です（現在${articleDateTags.length}件）`);
assert(
  articleDateTags.every((entry) => entry.attributes.datetime === "2026-07-26"),
  pageFile,
  "公開日・更新日・調査日のdatetimeは2026-07-26にしてください",
);
assert(
  sourceHeadingIndex >= 0 &&
    Boolean(articleDates) &&
    articleDates.start > sourceHeadingIndex,
  pageFile,
  "記事末尾の日付ブロックは出典見出しより下に配置してください",
);
for (const label of ["公開日", "最終更新日", "料金・サービス調査日"]) {
  assert(bodyText.includes(label), pageFile, `記事下部に「${label}」が必要です`);
}
const finalCtaIndex = bodyHtml.indexOf("立川で1ヶ月以上のレンタカーを探している方へ");
assert(
  finalCtaIndex >= 0 && sourceHeadingIndex > finalCtaIndex,
  pageFile,
  "最終CTAの後に調査方法・出典を配置してください",
);

// Tables: caption, scoped headers, and keyboard-focusable scrolling wrappers.
const tables = findStartTags(bodyHtml, "table")
  .map((start) => findMatchingElement(bodyHtml, start))
  .filter(Boolean);
const scrollWrapperStarts = findStartTags(bodyHtml, "[a-z][\\w:-]*").filter(
  (entry) => {
    const classes = String(entry.attributes.class || "").split(/\s+/);
    return classes.includes("table-scroll") || classes.includes("area-table-wrap");
  },
);
const scrollWrappers = scrollWrapperStarts
  .map((start) => findMatchingElement(bodyHtml, start))
  .filter(Boolean);
assert(tables.length >= 18, pageFile, `仕様上の表は18件以上必要です（現在${tables.length}件）`);
assert(
  scrollWrappers.length === tables.length,
  pageFile,
  `各表に専用スクロールwrapperが必要です（表${tables.length}件 / wrapper${scrollWrappers.length}件）`,
);
tables.forEach((table, index) => {
  const captions = findStartTags(table.html, "caption")
    .map((start) => findMatchingElement(table.html, start))
    .filter(Boolean);
  assert(captions.length === 1, pageFile, `表${index + 1}にcaptionを1件設定してください`);
  assert(normalizeText(captions[0]?.html || "").length > 0, pageFile, `表${index + 1}のcaptionが空です`);
  const headers = findStartTags(table.html, "th");
  assert(headers.length > 0, pageFile, `表${index + 1}にthが必要です`);
  assert(
    headers.every((header) => ["col", "row"].includes(header.attributes.scope)),
    pageFile,
    `表${index + 1}の全thにscope=\"col\"またはscope=\"row\"が必要です`,
  );
});
scrollWrapperStarts.forEach((wrapper, index) => {
  assert(wrapper.attributes.role === "region", pageFile, `表wrapper ${index + 1}にrole=\"region\"が必要です`);
  assert(wrapper.attributes.tabindex === "0", pageFile, `表wrapper ${index + 1}にtabindex=\"0\"が必要です`);
  assert(Boolean(wrapper.attributes["aria-label"]), pageFile, `表wrapper ${index + 1}にaria-labelが必要です`);
});

// Visible FAQ must be button-operated and exactly match FAQPage.
const faqButtons = findStartTags(bodyHtml, "button").filter((entry) => {
  const classes = String(entry.attributes.class || "");
  return (
    entry.attributes["data-faq-toggle"] !== undefined ||
    (/faq/i.test(classes) && entry.attributes["aria-controls"])
  );
});
assert(faqButtons.length === 12, pageFile, `FAQ開閉buttonは12件必要です（現在${faqButtons.length}件）`);
const visibleFaq = [];
faqButtons.forEach((button, index) => {
  const buttonElement = findMatchingElement(bodyHtml, button);
  const controls = button.attributes["aria-controls"];
  assert(Boolean(controls), pageFile, `FAQ button ${index + 1}にaria-controlsが必要です`);
  assert(
    ["true", "false"].includes(button.attributes["aria-expanded"]),
    pageFile,
    `FAQ button ${index + 1}にaria-expandedが必要です`,
  );
  const panel = controls ? findElementById(bodyHtml, controls) : null;
  assert(Boolean(panel), pageFile, `FAQ button ${index + 1}のaria-controls参照先がありません`);
  if (!panel) return;
  const panelAttributes = parseAttributes(panel.startTag);
  assert(
    panelAttributes.hidden === undefined &&
      panelAttributes["aria-hidden"] !== "true" &&
      !/display\s*:\s*none/i.test(panelAttributes.style || ""),
    pageFile,
    `FAQ回答${index + 1}は静的HTMLで読める状態にしてください`,
  );
  visibleFaq.push([
    normalizeFaqText(buttonElement?.html || ""),
    normalizeFaqText(panel.html),
  ]);
});
assert(visibleFaq.length === 12, pageFile, "可視FAQの質問・回答を12組取得できません");
expectedFaq.forEach(([question, answer], index) => {
  const visible = visibleFaq[index] || [];
  assert(visible[0] === normalizeFaqText(question), pageFile, `可視FAQ ${index + 1}件目の質問が仕様と一致しません`);
  assert(visible[1] === normalizeFaqText(answer), pageFile, `可視FAQ ${index + 1}件目の回答がFAQPageと一致しません`);
});

// Major content must exist in static HTML, not just scripts/templates.
for (const text of requiredStaticText) {
  assert(
    bodyText.includes(normalizeText(text)),
    pageFile,
    `主要な静的本文がありません: ${text.slice(0, 42)}`,
  );
}
assert(!bodyHtml.includes("REMAINING_CONTENT"), pageFile, "未実装マーカーREMAINING_CONTENTが残っています");
assert(!/<template\b/i.test(bodyHtml), pageFile, "主要本文をtemplate内だけに置かないでください");

const headingTags = [
  ...findStartTags(bodyHtml, "h2"),
  ...findStartTags(bodyHtml, "h3"),
];
const headingIds = new Set(
  headingTags.map((entry) => entry.attributes.id).filter(Boolean),
);
const toc = findStartTags(bodyHtml, "[a-z][\\w:-]*").find(
  (entry) => entry.attributes["data-generated-toc"] !== undefined,
);
assert(Boolean(toc), pageFile, "data-generated-toc付き目次が必要です");
if (toc) {
  const tocElement = findMatchingElement(bodyHtml, toc);
  const tocAnchors = findStartTags(tocElement?.html || "", "a");
  assert(tocAnchors.length > 0, pageFile, "目次には静的フォールバックリンクが必要です");
  tocAnchors.forEach((anchor) => {
    const href = anchor.attributes.href || "";
    assert(
      href.startsWith("#") && headingIds.has(href.slice(1)),
      pageFile,
      `目次リンク先が存在しません: ${href}`,
    );
  });
}
const tocViewport = findStartTags(bodyHtml, "[a-z][\\w:-]*").find(
  (entry) => entry.attributes["data-toc-viewport"] !== undefined,
);
assert(Boolean(tocViewport), pageFile, "目次の折り畳みviewportが必要です");
const tocToggle = findStartTags(bodyHtml, "button").find(
  (entry) => entry.attributes["data-toc-toggle"] !== undefined,
);
assert(Boolean(tocToggle), pageFile, "目次のOPEN/CLOSE buttonが必要です");
assert(tocToggle?.attributes["aria-expanded"] === "false", pageFile, "目次buttonの初期aria-expandedはfalseにしてください");
assert(tocToggle?.attributes["aria-controls"] === "article-toc-list", pageFile, "目次buttonのaria-controlsが不正です");
assert(tocToggle?.attributes.hidden !== undefined, pageFile, "JS無効時は目次buttonをhiddenにしてください");

// CSS must be fully scoped and include the required responsive/accessibility hooks.
const cssSelectors = collectCssSelectors(css);
assert(cssSelectors.length > 0, cssFile, "CSSルールを取得できません");
const unscopedSelectors = cssSelectors.filter(
  (selector) => !selector.startsWith(cssRoot),
);
assert(
  unscopedSelectors.length === 0,
  cssFile,
  `専用CSSにスコープ外selectorがあります: ${unscopedSelectors.slice(0, 8).join(" | ")}`,
);
assert(css.includes(cssRoot), cssFile, `${cssRoot}ルートがCSSに必要です`);
assert(/overflow-x\s*:\s*(?:auto|scroll)/i.test(css), cssFile, "表のoverflow-x設定が必要です");
assert(/:focus-visible/i.test(css), cssFile, "focus-visibleスタイルが必要です");
assert(/aspect-ratio\s*:/i.test(css), cssFile, "画像placeholderにaspect-ratioが必要です");
assert(/prefers-reduced-motion/i.test(css), cssFile, "prefers-reduced-motion対応が必要です");
assert(/@media\s*\([^)]*min-width/i.test(css), cssFile, "PC用min-widthメディアクエリが必要です");
assert(/@media\s*\([^)]*max-width/i.test(css), cssFile, "モバイル用max-widthメディアクエリが必要です");
assert(
  /@media\s*\(\s*min-width\s*:\s*1180px\s*\)[\s\S]*?\.area-ranking-page\.area-tachikawa main,\s*\.area-ranking-page\.area-tachikawa \.site-footer\s*\{[^}]*width\s*:\s*100%/i.test(css),
  cssFile,
  "1180px以上ではmainとfooterを通常のPC幅へ戻してください",
);
assert(
  /@media\s*\(\s*min-width\s*:\s*1180px\s*\)[\s\S]*?\.area-ranking-page\.area-tachikawa \.site-header\s*\{[^}]*width\s*:\s*100%/i.test(css),
  cssFile,
  "1180px以上ではヘッダーを通常のPC幅へ戻してください",
);
assert(
  /\.area-ranking-page\.area-tachikawa \.header-nav\s*\{[^}]*display\s*:\s*flex/i.test(css),
  cssFile,
  "PCでは共通ヘッダーナビを表示してください",
);
assert(
  /\.area-ranking-page\.area-tachikawa \.menu-toggle\s*\{[^}]*display\s*:\s*none/i.test(css),
  cssFile,
  "PCではスマートフォン用メニューボタンを非表示にしてください",
);
assert(
  /\.area-ranking-page\.area-tachikawa\s*\{[^}]*overflow-x\s*:\s*clip/i.test(css),
  cssFile,
  "ページ全体の横はみ出しを抑止してください",
);
assert(
  /\.article-header h1\s*\{[^}]*max-width\s*:\s*100%[^}]*min-width\s*:\s*0[^}]*white-space\s*:\s*normal[^}]*word-break\s*:\s*normal[^}]*overflow-wrap\s*:\s*anywhere[^}]*word-break\s*:\s*auto-phrase/i.test(
    css,
  ),
  cssFile,
  "H1はauto-phrase未対応ブラウザでも折り返せるフォールバックを指定してください",
);
assert(
  /@media\s*\(\s*max-width\s*:\s*760px\s*\)[\s\S]*?\.article-header h1\s*\{[^}]*font-size\s*:\s*clamp\(\s*24px\s*,\s*7\.2vw\s*,\s*32px\s*\)[^}]*line-height\s*:\s*1\.38/i.test(
    css,
  ),
  cssFile,
  "モバイルH1は320px幅でも見切れない文字サイズと行間にしてください",
);
assert(
  /@media\s*\(\s*max-width\s*:\s*430px\s*\)[\s\S]*?\.article-title-line\s*\{[^}]*display\s*:\s*block[^}]*\}[\s\S]*?\.article-title-divider\s*\{[^}]*display\s*:\s*none/i.test(
    css,
  ),
  cssFile,
  "430px以下ではH1を意味単位の4行にし、区切り記号を非表示にしてください",
);
assert(
  /\.toc-list-viewport\.is-collapsible\.is-collapsed\s*\{[^}]*max-height[^}]*overflow\s*:\s*hidden/i.test(css),
  cssFile,
  "目次は4項目付近で高さを制限して折り畳んでください",
);
assert(
  /\.toc-list-viewport\.is-collapsible\.is-collapsed::after/i.test(css),
  cssFile,
  "折り畳み目次の続きが分かるfadeが必要です",
);
assert(
  /\.table-caption-bar\s*\{[^}]*z-index/i.test(css),
  cssFile,
  "表題はスクロール領域外の固定caption barとして表示してください",
);
assert(
  /\.is-table-enhanced \.table-native-caption\s*\{[^}]*clip(?:-path)?/i.test(css),
  cssFile,
  "元captionは読み上げ用に残して視覚的に隠してください",
);
assert(
  /\.table-scroll\.is-scrollable thead tr > :first-child[\s\S]*?position\s*:\s*sticky[\s\S]*?left\s*:\s*0/i.test(css),
  cssFile,
  "全表の左上見出しセルをsticky固定してください",
);
assert(
  /\.table-scroll--ranking\.is-scrollable thead tr > :nth-child\(2\)[\s\S]*?position\s*:\s*sticky/i.test(css),
  cssFile,
  "ランキング表は順位と会社名の2列を固定してください",
);
assert(
  !/tbody th\[scope=["']row["']\]\s*,\s*[\s\S]{0,120}tbody td:first-child/i.test(css),
  cssFile,
  "旧sticky規則はランキング表で列を重ねるため削除してください",
);

// Dedicated JavaScript: syntax, root guard, generated TOC, progressive FAQ, CTA event.
if (articleJs) {
  try {
    new vm.Script(articleJs, { filename: jsFile });
  } catch (error) {
    fail(jsFile, `JavaScript構文エラー: ${error.message}`);
  }
}
assert(articleJs.includes(cssRoot), jsFile, `JSは${cssRoot}をroot guardにしてください`);
assert(articleJs.includes("data-generated-toc"), jsFile, "JSに目次生成処理がありません");
assert(/querySelectorAll\([^)]*h2[^)]*h3|h2\s*,\s*h3/i.test(articleJs), jsFile, "JSはH2/H3から目次を生成してください");
assert(
  /data-faq-(?:toggle|button)|faq-(?:toggle|item)[^"']*button/i.test(articleJs),
  jsFile,
  "JSにFAQ button処理がありません",
);
assert(/TOC_COLLAPSED_ITEMS\s*=\s*4/.test(articleJs), jsFile, "目次の初期表示は4項目にしてください");
assert(articleJs.includes('"OPEN"') && articleJs.includes('"CLOSE"'), jsFile, "目次buttonはOPEN/CLOSEを切り替えてください");
assert(articleJs.includes("table-caption-bar"), jsFile, "JSで表題をスクロール領域外へ複製してください");
assert(articleJs.includes("table-scroll-viewport"), jsFile, "JSで比較列専用のスクロールviewportを作成してください");
assert(articleJs.includes("is-scrollable"), jsFile, "実際にoverflowする表だけスクロール状態にしてください");
assert(articleJs.includes("ResizeObserver"), jsFile, "表のoverflow状態をリサイズ時にも再判定してください");
assert(articleJs.includes("aria-labelledby"), jsFile, "表スクロール領域をcaptionと関連付けてください");
assert(articleJs.includes("aria-expanded"), jsFile, "JSでFAQのaria-expandedを同期してください");
assert(/\.hidden|setAttribute\(\s*["']hidden/i.test(articleJs), jsFile, "JSでFAQ回答のhidden状態を同期してください");
assert(articleJs.includes("area_tachikawa_cta_click"), jsFile, "CTAイベント名がありません");
assert(/\bgtag\b/.test(articleJs), jsFile, "既存gtagを使うCTA計測処理がありません");
for (const field of ["position", "channel", "destination"]) {
  assert(articleJs.includes(field), jsFile, `CTAイベント項目${field}がありません`);
}
assert(
  !/(?:createElement\(\s*["']script|googletagmanager\.com|https?:\/\/[^"']+\.js)/i.test(
    articleJs,
  ),
  jsFile,
  "専用JSから新しい外部計測ライブラリを追加しないでください",
);

// All relative HTML/CSS assets must resolve inside this repository.
const assetReferences = [];
for (const tagName of ["a", "img", "script", "link", "source"]) {
  for (const tag of findStartTags(html, tagName)) {
    for (const attribute of ["src", "href", "data-pc-href"]) {
      const value = tag.attributes[attribute];
      if (value) assetReferences.push({ value, file: pageFile });
    }
    if (tag.attributes.srcset) {
      for (const candidate of tag.attributes.srcset.split(",")) {
        assetReferences.push({
          value: candidate.trim().split(/\s+/)[0],
          file: pageFile,
        });
      }
    }
  }
}
for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
  assetReferences.push({ value: match[2], file: cssFile });
}

for (const reference of assetReferences) {
  const raw = String(reference.value || "").trim();
  if (
    !raw ||
    raw.startsWith("#") ||
    raw.startsWith("/") ||
    /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(raw)
  ) {
    continue;
  }
  const clean = raw.split(/[?#]/)[0];
  const baseDirectory = path.dirname(path.join(root, reference.file));
  const absolute = path.resolve(baseDirectory, clean);
  const insideRoot = absolute === root || absolute.startsWith(`${root}${path.sep}`);
  assert(insideRoot, reference.file, `相対資産がリポジトリ外を指しています: ${raw}`);
  assert(fs.existsSync(absolute), reference.file, `相対資産が存在しません: ${raw}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`::error file=${failure.file}::${failure.message}`);
  }
  console.error(
    `Tachikawa ranking check failed: ${failures.length} error(s), ${assertionCount} assertion(s)`,
  );
  process.exit(1);
}

console.log(
  `Tachikawa ranking check passed: ${assertionCount} assertions across HTML, CSS, JS, and assets`,
);

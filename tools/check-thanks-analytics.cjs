const fs = require("fs");
const path = require("path");
const vm = require("vm");

const file = "thanks/index.html";
const html = fs.readFileSync(path.join(process.cwd(), file), "utf8");
const analyticsScript = [
  ...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
]
  .map((match) => match[1])
  .find((script) => script.includes("G-501JL6QG1N"));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function runPage(url) {
  const order = [];
  const appendedScripts = [];
  const historyCalls = [];
  const dataLayer = [];
  const nativePush = dataLayer.push;

  dataLayer.push = function push(command) {
    order.push(`gtag:${command[0]}:${command[1] || ""}`);
    return nativePush.apply(this, arguments);
  };

  const context = {
    URL,
    Date,
    dataLayer,
    location: new URL(url),
    history: {
      state: { test: true },
      replaceState(state, title, nextUrl) {
        order.push("history:replaceState");
        historyCalls.push({ state, title, nextUrl });
        context.location = new URL(nextUrl, context.location.href);
      },
    },
    document: {
      createElement(tagName) {
        return {
          tagName: tagName.toUpperCase(),
          async: false,
          src: "",
        };
      },
      head: {
        appendChild(element) {
          order.push("script:append");
          appendedScripts.push(element);
        },
      },
    },
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(analyticsScript, context);

  const commands = dataLayer.map((entry) => Array.from(entry));
  return {
    commands,
    order,
    appendedScripts,
    historyCalls,
    finalUrl: context.location.href,
  };
}

function countCommand(result, command, name) {
  return result.commands.filter(
    (entry) => entry[0] === command && (name === undefined || entry[1] === name),
  ).length;
}

function assertProductionBaseline(result) {
  assert(countCommand(result, "js") === 1, "gtag js command must run exactly once");
  assert(
    countCommand(result, "config") === 1,
    "only one GA config command may run",
  );
  assert(
    countCommand(result, "config", "G-501JL6QG1N") === 1,
    "existing GA4 config must run exactly once",
  );
  assert(
    countCommand(result, "event", "page_view") === 0,
    "manual page_view must not be added",
  );
  assert(result.appendedScripts.length === 1, "gtag.js must be appended exactly once");
  assert(
    result.appendedScripts[0].src ===
      "https://www.googletagmanager.com/gtag/js?id=G-501JL6QG1N",
    "gtag.js must use the existing GA4 measurement ID",
  );
  assert(
    result.appendedScripts[0].tagName === "SCRIPT",
    "Google tag loader must append a script element",
  );
  assert(result.appendedScripts[0].async === true, "gtag.js must load asynchronously");
}

try {
  assert(analyticsScript, "GA4 inline script not found");
  assert(
    countMatches(html, /gtag\s*\(\s*["']config["']\s*,/g) === 1,
    "only one GA config call may appear in the HTML",
  );
  assert(
    countMatches(
      html,
      /gtag\s*\(\s*["']config["']\s*,\s*["']G-501JL6QG1N["']\s*\)/g,
    ) === 1,
    "GA4 config tag must appear exactly once",
  );
  assert(
    countMatches(
      html,
      /gtag\s*\(\s*["']event["']\s*,\s*["']generate_lead["']\s*\)/g,
    ) === 1,
    "generate_lead implementation must appear exactly once",
  );
  assert(
    !/gtag\s*\(\s*["']event["']\s*,\s*["']page_view["']/.test(html),
    "manual page_view implementation must not be present",
  );

  const direct = runPage("https://monthly-rent-car.jp/thanks/");
  assertProductionBaseline(direct);
  assert(
    countCommand(direct, "event", "generate_lead") === 0,
    "direct access must not send generate_lead",
  );
  assert(direct.historyCalls.length === 0, "direct access must not rewrite history");

  const completed = runPage(
    "https://monthly-rent-car.jp/thanks/?coupon=A%20B&tag=a&formrun_complete=1&tag=b&empty=#done",
  );
  assertProductionBaseline(completed);
  assert(
    countCommand(completed, "event", "generate_lead") === 1,
    "form completion must send generate_lead exactly once",
  );
  assert(
    completed.historyCalls.length === 1,
    "form completion must rewrite history exactly once",
  );
  const cleanedUrl = new URL(completed.finalUrl);
  assert(cleanedUrl.pathname === "/thanks/", "URL cleanup must preserve the path");
  assert(cleanedUrl.hash === "#done", "URL cleanup must preserve the hash");
  assert(
    JSON.stringify([...cleanedUrl.searchParams.entries()]) ===
      JSON.stringify([
        ["coupon", "A B"],
        ["tag", "a"],
        ["tag", "b"],
        ["empty", ""],
      ]),
    "URL cleanup must preserve every other query parameter in order",
  );
  assert(
    !cleanedUrl.searchParams.has("formrun_complete"),
    "URL cleanup must remove only formrun_complete",
  );
  assert(
    completed.order.indexOf("gtag:event:generate_lead") <
      completed.order.indexOf("history:replaceState"),
    "generate_lead must be queued before history is rewritten",
  );
  assert(
    completed.order.indexOf("history:replaceState") <
      completed.order.indexOf("script:append"),
    "history must be rewritten before external gtag.js is loaded",
  );

  const reloaded = runPage(completed.finalUrl);
  assertProductionBaseline(reloaded);
  assert(
    countCommand(reloaded, "event", "generate_lead") === 0,
    "reload after URL cleanup must not resend generate_lead",
  );
  assert(
    reloaded.historyCalls.length === 0,
    "reload after URL cleanup must not rewrite history again",
  );

  for (const url of [
    "https://monthly-rent-car.jp/thanks/?formrun_complete=0",
    "https://monthly-rent-car.jp/thanks/?formrun_complete=",
    "https://monthly-rent-car.jp/thanks/?formrun_complete=true",
    "https://monthly-rent-car.jp/thanks/?formrun_complete=01",
    "https://monthly-rent-car.jp/thanks/?formrun_complete=1.0",
    "https://monthly-rent-car.jp/thanks/?formrun_complete=1%20",
    "https://monthly-rent-car.jp/thanks/?FORMRUN_COMPLETE=1",
    "https://monthly-rent-car.jp/thanks/#formrun_complete=1",
  ]) {
    const invalid = runPage(url);
    assertProductionBaseline(invalid);
    assert(
      countCommand(invalid, "event", "generate_lead") === 0,
      "only formrun_complete=1 may send generate_lead",
    );
    assert(
      invalid.historyCalls.length === 0,
      "invalid completion values must not rewrite history",
    );
  }

  const duplicated = runPage(
    "https://monthly-rent-car.jp/thanks/?formrun_complete=1&formrun_complete=1",
  );
  assertProductionBaseline(duplicated);
  assert(
    countCommand(duplicated, "event", "generate_lead") === 1,
    "duplicate completion parameters must still send generate_lead only once",
  );
  assert(
    !new URL(duplicated.finalUrl).searchParams.has("formrun_complete"),
    "URL cleanup must remove all duplicate completion parameters",
  );

  const staging = runPage(
    "https://stg.monthly-rent-car.jp/thanks/?formrun_complete=1",
  );
  assert(staging.commands.length === 0, "staging must not send GA4 commands");
  assert(staging.appendedScripts.length === 0, "staging must not load gtag.js");
  assert(staging.historyCalls.length === 0, "staging must not rewrite completion URLs");

  console.log(
    "Thank-you analytics check passed: guarded generate_lead, one-shot cleanup, and single GA4 config",
  );
} catch (error) {
  console.error(`::error file=${file}::${error.message}`);
  process.exit(1);
}

// Мини-модель браузера: проверяем, что скрипт кладёт источник в форму.
import fs from "node:fs";
import vm from "node:vm";

const CODE = fs.readFileSync(process.env.HOME + "/futura-inc-site-code/lead-source.js", "utf8");

function makeEl(tag) {
  return { tagName: tag.toUpperCase(), type: "", name: "", value: "", children: [],
           appendChild(c) { this.children.push(c); },
           querySelector(sel) {
             const m = /input\[name="(.+)"\]/.exec(sel);
             return m ? this.children.find(c => c.name === m[1]) || null : null;
           } };
}

function run({ url, referrer, store }) {
  const form = makeEl("form");
  const listeners = {};
  const storage = { ...store };
  const sandbox = {
    URL, URLSearchParams, Date, JSON, console,
    document: {
      readyState: "complete",
      referrer,
      documentElement: {},
      querySelectorAll: () => [form],
      addEventListener: (t, f) => { listeners[t] = f; },
      createElement: makeEl,
    },
    window: {
      location: { href: url, search: new URL(url).search },
      localStorage: {
        getItem: k => (k in storage ? storage[k] : null),
        setItem: (k, v) => { storage[k] = v; },
      },
      MutationObserver: null,
      setTimeout,
    },
  };
  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox);
  const out = {};
  form.children.forEach(c => { out[c.name] = c.value; });
  return { fields: out, storage };
}

let fails = 0;
function check(label, got, want) {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: ${JSON.stringify(got)}${ok ? "" : ` (ждали ${JSON.stringify(want)})`}`);
}

console.log("— 1. Переход из Perplexity, первый визит");
let r = run({ url: "https://www.futura.inc/ru/jurisdictions/oman", referrer: "https://perplexity.ai/", store: {} });
check("Source-UTM", r.fields["Source-UTM"], "perplexity.ai");
check("Source-Referrer", r.fields["Source-Referrer"], "https://perplexity.ai/");
check("Source-Page", r.fields["Source-Page"], "https://www.futura.inc/ru/jurisdictions/oman");

console.log("\n— 2. Тот же человек вернулся напрямую: первое касание не потеряно");
const kept = r.storage;
r = run({ url: "https://www.futura.inc/contacts", referrer: "", store: kept });
check("Source-UTM остался Perplexity", r.fields["Source-UTM"], "perplexity.ai");
check("Source-Page — текущая", r.fields["Source-Page"], "https://www.futura.inc/contacts");
check("Source-First-Page — та, с которой пришёл", r.fields["Source-First-Page"], "https://www.futura.inc/ru/jurisdictions/oman");

console.log("\n— 3. UTM-метка из рассылки");
r = run({ url: "https://www.futura.inc/?utm_source=telegram&utm_medium=post&utm_campaign=cyprus", referrer: "", store: {} });
check("Source-UTM", r.fields["Source-UTM"], "telegram / post / cyprus");
check("utm_source отдельным полем", r.fields["utm_source"], "telegram");

console.log("\n— 4. Переход из выдачи Яндекса (метка ysclid)");
r = run({ url: "https://www.futura.inc/ru/team?ysclid=abc123", referrer: "", store: {} });
check("Source-UTM", r.fields["Source-UTM"], "yandex-search");

console.log("\n— 5. Внутренний переход не считается источником");
r = run({ url: "https://www.futura.inc/contacts", referrer: "https://www.futura.law/services/x", store: {} });
check("Source-UTM", r.fields["Source-UTM"], "direct");
check("Source-Referrer пуст", r.fields["Source-Referrer"], "");

console.log("\n— 6. Приватное окно: localStorage недоступен, скрипт не падает");
try {
  const form = makeEl("form");
  r = run({ url: "https://www.futura.inc/", referrer: "https://google.com/", store: {} });
  check("Source-UTM", r.fields["Source-UTM"], "google.com");
} catch (e) { fails++; console.log("FAIL упал:", e.message); }

console.log(fails === 0 ? "\nВсе проверки прошли." : `\nПровалов: ${fails}`);
process.exit(fails ? 1 : 0);

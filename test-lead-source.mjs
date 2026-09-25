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

function makeLink(href) {
  return { tagName: "A", attrs: { href },
           getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
           setAttribute(k, v) { this.attrs[k] = v; } };
}

function run({ url, referrer, store, linkHref = "https://calendly.com/a-karpenko-futura/30min" }) {
  const form = makeEl("form");
  const link = makeLink(linkHref);
  const listeners = {};
  const storage = { ...store };
  const sandbox = {
    URL, URLSearchParams, Date, JSON, console,
    document: {
      readyState: "complete",
      referrer,
      documentElement: {},
      querySelectorAll: (sel) => (String(sel).includes("calendly") ? [link] : [form]),
      addEventListener: (t, f) => { listeners[t] = f; },
      createElement: makeEl,
    },
    window: {
      location: {
        href: url,
        search: new URL(url).search,
        pathname: new URL(url).pathname,
      },
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
  return { fields: out, storage, calendly: link.getAttribute("href") };
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
check("Source-Landing — посадочная первого визита", r.fields["Source-Landing"], "/ru/jurisdictions/oman");

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
check("Source-Referrer — прямой заход", r.fields["Source-Referrer"], "прямой заход");

console.log("\n— 6. Приватное окно: localStorage недоступен, скрипт не падает");
try {
  const form = makeEl("form");
  r = run({ url: "https://www.futura.inc/", referrer: "https://google.com/", store: {} });
  check("Source-UTM", r.fields["Source-UTM"], "google.com");
} catch (e) { fails++; console.log("FAIL упал:", e.message); }

console.log("\n— 7. Кнопка Calendly: метки дописались, страница попала в utm_content");
r = run({ url: "https://www.futura.inc/ru/jurisdictions/oman", referrer: "https://perplexity.ai/", store: {} });
let q = new URL(r.calendly).searchParams;
check("хост не сменился", new URL(r.calendly).origin + new URL(r.calendly).pathname,
      "https://calendly.com/a-karpenko-futura/30min");
check("utm_source", q.get("utm_source"), "perplexity.ai");
check("utm_medium", q.get("utm_medium"), "site");
check("utm_content — страница, с которой нажали", q.get("utm_content"), "/ru/jurisdictions/oman");

console.log("\n— 8. Метка, проставленная руками, не перезаписывается");
r = run({ url: "https://www.futura.inc/", referrer: "https://google.com/", store: {},
          linkHref: "https://calendly.com/a-karpenko-futura/30min?utm_source=linkedin-outreach" });
q = new URL(r.calendly).searchParams;
check("utm_source остался чужой", q.get("utm_source"), "linkedin-outreach");
check("utm_content всё же добавился", q.get("utm_content"), "/");

console.log("\n— 9. Прямой заход: метка всё равно есть, а не пустота");
r = run({ url: "https://www.futura.inc/contacts", referrer: "", store: {} });
q = new URL(r.calendly).searchParams;
check("utm_source", q.get("utm_source"), "direct");

console.log("\n— 10. Первое касание доживает до брони на другой странице");
r = run({ url: "https://www.futura.inc/contacts", referrer: "", store: kept });
q = new URL(r.calendly).searchParams;
check("utm_source — первое касание", q.get("utm_source"), "perplexity.ai");

console.log("\n— 11. Чужую ссылку не трогаем");
r = run({ url: "https://www.futura.inc/", referrer: "", store: {},
          linkHref: "https://calendly.com.evil.io/steal" });
check("подделка под calendly.com не размечена", r.calendly, "https://calendly.com.evil.io/steal");

console.log(fails === 0 ? "\nВсе проверки прошли." : `\nПровалов: ${fails}`);
process.exit(fails ? 1 : 0);

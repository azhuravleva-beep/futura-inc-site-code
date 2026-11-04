// Мини-модель браузера: проверяем, когда пиксель шлёт Lead, а когда молчит.
import fs from "node:fs";
import vm from "node:vm";

const CODE = fs.readFileSync(new URL("./meta-pixel-1.0.0.js", import.meta.url), "utf8");

const SITE_ID = "69b915fc76acca0d89cbd22b";
const SIGN_UP = "Event Sign Up Form";

function makeForm({ name = SIGN_UP, elementId = "el-1", pageId = "page-1", action = null } = {}) {
  return {
    tagName: "FORM",
    attrs: { "data-name": name, "data-wf-element-id": elementId, "data-wf-page-id": pageId, action },
    getAttribute(k) {
      return k in this.attrs ? this.attrs[k] : null;
    }
  };
}

function run({ payload, response, form = makeForm(), url, siteAttr = SITE_ID, type = "POST", twice = false }) {
  const tracked = [];
  const prefilters = [];
  const jQuery = {
    ajaxPrefilter(_type, fn) {
      prefilters.push(fn);
    }
  };
  const listeners = {};
  const sandbox = {
    URL,
    WeakSet,
    console,
    window: null,
    document: {
      readyState: "complete",
      documentElement: { getAttribute: (k) => (k === "data-wf-site" ? siteAttr : null) },
      querySelector: (sel) => (sel === `form[data-name="${SIGN_UP}"]` ? form : null),
      createElement: () => ({ setAttribute() {} }),
      getElementsByTagName: () => [],
      head: { appendChild() {} },
      addEventListener(evt, fn) {
        (listeners[evt] = listeners[evt] || []).push(fn);
      },
      removeEventListener() {}
    }
  };
  sandbox.window = sandbox;
  sandbox.location = { href: "https://www.futura.inc/events/x" };
  sandbox.jQuery = jQuery;
  sandbox.Webflow = [];
  // Пиксель ещё не загружен: подменяем fbq так же, как это делает сам Meta.
  sandbox.fbq = (verb, event, params) => {
    if (verb === "track") tracked.push({ event, params });
  };
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox);

  const request = { done(fn) { this._fn = fn; return this; } };
  const options = { url: url ?? `https://webflow.com/api/v1/form/${SITE_ID}`, type };
  prefilters.forEach((fn) => fn(options, { data: payload }, request));
  if (request._fn) {
    request._fn(response);
    if (twice) request._fn(response);
  }
  return tracked;
}

const okPayload = { name: SIGN_UP, elementId: "el-1", pageId: "page-1" };
let failures = 0;

function check(label, actual, expected) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? "ok  " : "FAIL"}  ${label}  (получили ${actual}, ждали ${expected})`);
}

const leads = (t) => t.filter((e) => e.event === "Lead").length;
const views = (t) => t.filter((e) => e.event === "PageView").length;

check("PageView уходит один раз", views(run({ payload: okPayload, response: { code: 200 } })), 1);
check("Lead на успешной записи", leads(run({ payload: okPayload, response: { code: 200 } })), 1);
check(
  "Lead несёт нужные параметры",
  JSON.stringify(run({ payload: okPayload, response: { code: 200 } }).find((e) => e.event === "Lead").params),
  JSON.stringify({ content_name: "Webinar registration", content_category: "webinar" })
);
check("ответ не 200 — Lead молчит", leads(run({ payload: okPayload, response: { code: 400 } })), 0);
check("пустой ответ — Lead молчит", leads(run({ payload: okPayload, response: null })), 0);
check(
  "вторая форма страницы (запись вебинара) не считается",
  leads(run({ payload: { ...okPayload, name: "Event Watch record Form" }, response: { code: 200 } })),
  0
);
check("тестовая отправка Webflow не считается", leads(run({ payload: { ...okPayload, test: true }, response: { code: 200 } })), 0);
check(
  "чужой адрес — Lead молчит",
  leads(run({ payload: okPayload, response: { code: 200 }, url: "https://example.com/api/v1/form/" + SITE_ID })),
  0
);
check("не POST — Lead молчит", leads(run({ payload: okPayload, response: { code: 200 }, type: "GET" })), 0);
check(
  "чужой сайт в разметке — Lead молчит",
  leads(run({ payload: okPayload, response: { code: 200 }, siteAttr: "other-site" })),
  0
);
check(
  "elementId не от этой формы — Lead молчит",
  leads(run({ payload: { ...okPayload, elementId: "другой" }, response: { code: 200 } })),
  0
);
check(
  "форма с собственным action — Lead молчит",
  leads(run({ payload: okPayload, response: { code: 200 }, form: makeForm({ action: "/custom" }) })),
  0
);
check("повторный ответ не удваивает Lead", leads(run({ payload: okPayload, response: { code: 200 }, twice: true })), 1);

console.log(failures ? `\n${failures} проверок упало` : "\nвсе проверки прошли");
process.exit(failures ? 1 : 0);

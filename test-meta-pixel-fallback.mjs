// Мини-модель браузера: когда дублёр берёт пиксель на себя, а когда молчит.
import fs from "node:fs";
import vm from "node:vm";

const CODE = fs.readFileSync(new URL("./meta-pixel-1.3.0.js", import.meta.url), "utf8");
const SITE_ID = "69b915fc76acca0d89cbd22b";
const SIGN_UP = "Event Sign Up Form";

function build({ consent = null, metaLoaded = null, foreignFbq = false } = {}) {
  const tracked = [];
  const consentListeners = [];
  const prefilters = [];
  const form = {
    tagName: "FORM",
    attrs: { "data-name": SIGN_UP, "data-wf-element-id": "el-1", "data-wf-page-id": "page-1", action: null },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  };
  const sandbox = {
    URL, WeakSet, Array, String, console,
    document: {
      readyState: "complete",
      documentElement: { getAttribute: (k) => (k === "data-wf-site" ? SITE_ID : null) },
      querySelector: (sel) => (sel === `form[data-name="${SIGN_UP}"]` ? form : null),
      createElement: () => ({ setAttribute() {} }),
      head: { appendChild() {} },
      addEventListener(evt, fn) { if (evt === "futura:consent") consentListeners.push(fn); }
    }
  };
  sandbox.window = sandbox;
  sandbox.location = { href: "https://www.futura.law/ru/events/x" };
  sandbox.jQuery = { ajaxPrefilter(_t, fn) { prefilters.push(fn); } };
  sandbox.Webflow = [];
  // 1.3.0 проверяет, не подвесил ли пиксель контроллер из головы сайта.
  const timers = [];
  sandbox.setTimeout = (fn) => { timers.push(fn); return timers.length; };
  sandbox.performance = { getEntriesByType: () => [{ name: "https://connect.facebook.net/signals/config/1249807613110031" }] };
  if (consent) sandbox.FuturaConsent = consent;
  if (metaLoaded !== null) sandbox.FuturaMeta = { status: () => ({ loaded: metaLoaded }) };
  if (foreignFbq) sandbox.fbq = function () {};

  vm.createContext(sandbox);
  // fbq, созданный самим файлом, пишет события в tracked через callMethod.
  const origDefine = () => {
    if (sandbox.fbq && !sandbox.fbq.__patched && sandbox.fbq.queue) {
      sandbox.fbq.callMethod = (...args) => tracked.push(args);
      sandbox.fbq.__patched = true;
      // то, что успело попасть в очередь до подмены, тоже считаем
      sandbox.fbq.queue.splice(0).forEach((a) => tracked.push([...a]));
    }
  };
  vm.runInContext(CODE, sandbox);
  origDefine();

  return {
    tracked,
    sandbox,
    fireConsent() { consentListeners.forEach((fn) => fn({})); origDefine(); },
    submit(response, name = SIGN_UP) {
      const request = { done(fn) { this._fn = fn; return this; } };
      prefilters.forEach((fn) =>
        fn({ url: `https://webflow.com/api/v1/form/${SITE_ID}`, type: "POST" },
           { data: { name, elementId: "el-1", pageId: "page-1" } }, request));
      if (request._fn) request._fn(response);
      origDefine();
    }
  };
}

const events = (t, kind) => t.filter((a) => a[0] === "track" && a[1] === kind).length;
let failures = 0;
function check(label, actual, expected) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? "ok  " : "FAIL"}  ${label}  (получили ${actual}, ждали ${expected})`);
}

const noChoice = { hasChoice: () => false, advertisingAllowed: () => false };
const allowed = { hasChoice: () => true, advertisingAllowed: () => true };
const refused = { hasChoice: () => true, advertisingAllowed: () => false };

// 1. Выбора ещё нет — пиксель должен работать сразу, без клика.
let r = build({ consent: noChoice });
check("нет выбора → PageView уходит", events(r.tracked, "PageView"), 1);
r.submit({ code: 200 });
check("нет выбора → Lead на успешной записи", events(r.tracked, "Lead"), 1);

// 2. Контроллер из головы уже поднял пиксель — дублёр обязан молчать.
r = build({ consent: allowed, metaLoaded: true });
check("FuturaMeta владеет → дублёр молчит", r.tracked.length, 0);
r.submit({ code: 200 });
check("FuturaMeta владеет → Lead не задваивается", events(r.tracked, "Lead"), 0);

// 3. Флажок снят осознанно — не трекаем.
r = build({ consent: refused });
check("явный отказ → ничего не уходит", r.tracked.length, 0);
r.submit({ code: 200 });
check("явный отказ → Lead не уходит", events(r.tracked, "Lead"), 0);

// 4. Чужой пиксель на странице — не вмешиваемся.
r = build({ consent: noChoice, foreignFbq: true });
check("чужой fbq → дублёр не вмешивается", r.tracked.length, 0);

// 5. Отказ уже после того, как дублёр взял пиксель.
r = build({ consent: noChoice });
check("до отказа PageView был", events(r.tracked, "PageView"), 1);
r.sandbox.FuturaConsent = refused;
r.fireConsent();
const before = r.tracked.length;
r.submit({ code: 200 });
check("после отказа Lead не уходит", r.tracked.length - before, 0);

// 6. Обычные проверки формы.
r = build({ consent: noChoice });
r.submit({ code: 400 });
check("ответ не 200 → Lead молчит", events(r.tracked, "Lead"), 0);

r = build({ consent: noChoice });
r.submit({ code: 200 }, "Event Watch record Form");
check("вторая форма страницы → Lead молчит", events(r.tracked, "Lead"), 0);

r = build({ consent: noChoice });
r.submit({ code: 200 });
r.submit({ code: 200 });
check("две успешные отправки → два Lead, не больше", events(r.tracked, "Lead"), 2);

console.log(failures ? `\n${failures} проверок упало` : "\nвсе проверки прошли");
process.exit(failures ? 1 : 0);

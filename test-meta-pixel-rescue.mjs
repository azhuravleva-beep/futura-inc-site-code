// Спасение пикселя, подвешенного контроллером из головы сайта.
import fs from "node:fs";
import vm from "node:vm";
const CODE = fs.readFileSync(new URL("./meta-pixel-1.3.0.js", import.meta.url), "utf8");
const SITE_ID = "69b915fc76acca0d89cbd22b";
const SIGN_UP = "Event Sign Up Form";

function build({ consent, controllerOwns = true, configRequested = false, queued = 4 } = {}) {
  const tracked = [];
  const timers = [];
  const form = { tagName: "FORM",
    attrs: { "data-name": SIGN_UP, "data-wf-element-id": "el-1", "data-wf-page-id": "page-1", action: null },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; } };
  // Тег, который повесил контроллер: он должен быть убран при перехвате.
  const controllerTag = { id: "futura-meta-pixel", parentNode: { removeChild() { controllerTag.removed = true; } } };
  const sandbox = {
    URL, WeakSet, Array, String, console,
    document: {
      readyState: "complete",
      documentElement: { getAttribute: (k) => (k === "data-wf-site" ? SITE_ID : null) },
      querySelector: (sel) => (sel === `form[data-name="${SIGN_UP}"]` ? form : null),
      getElementById: (id) => (id === "futura-meta-pixel" ? controllerTag : null),
      createElement: () => ({ setAttribute() {} }),
      head: { appendChild() {} },
      addEventListener() {}
    }
  };
  sandbox.window = sandbox;
  sandbox.location = { href: "https://www.futura.law/ru/events/x" };
  sandbox.jQuery = { ajaxPrefilter() {} };
  sandbox.Webflow = [];
  sandbox.FuturaConsent = consent;
  sandbox.setTimeout = (fn) => { timers.push(fn); return timers.length; };
  sandbox.performance = { getEntriesByType: () => configRequested
    ? [{ name: "https://connect.facebook.net/signals/config/1249807613110031?v=2" }] : [] };
  if (controllerOwns) {
    sandbox.FuturaMeta = { status: () => ({ loaded: true }) };
    // Подвисший пиксель контроллера: очередь есть, обработчика нет.
    const f = function () { f.queue.push(arguments); };
    f.queue = []; f.loaded = true;
    for (let i = 0; i < queued; i++) f("init", "1249807613110031");
    sandbox.fbq = f;
  }
  vm.createContext(sandbox);
  const capture = () => {
    if (sandbox.fbq && !sandbox.fbq.__patched && sandbox.fbq.queue) {
      sandbox.fbq.callMethod = (...a) => tracked.push(a);
      sandbox.fbq.__patched = true;
      sandbox.fbq.queue.splice(0).forEach((a) => tracked.push([...a]));
    }
  };
  vm.runInContext(CODE, sandbox);
  // Очередь подвисшего пикселя трогать нельзя: именно она — признак подвисания.
  // Снимаем показания только с того пикселя, который поднял сам дублёр.
  if (!controllerOwns) capture();
  return { sandbox, tracked, controllerTag,
    tick() { timers.splice(0).forEach((fn) => fn()); capture(); } };
}

const noChoice = { hasChoice: () => false, advertisingAllowed: () => false };
const allowed = { hasChoice: () => true, advertisingAllowed: () => true };
const refused = { hasChoice: () => true, advertisingAllowed: () => false };
const pv = (t) => t.filter((a) => a[0] === "track" && a[1] === "PageView").length;

let fails = 0;
const check = (label, actual, expected) => {
  const ok = actual === expected; if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}  (получили ${actual}, ждали ${expected})`);
};

// 1-3. Контроллер подвесил пиксель — забираем владение.
let r = build({ consent: allowed, controllerOwns: true, configRequested: false });
check("до срока спасения PageView ещё нет", pv(r.tracked), 0);
r.tick();
check("после спасения PageView ушёл", pv(r.tracked), 1);
check("тег подвисшего пикселя убран", r.controllerTag.removed === true, true);

// 4. Контроллер владеет, но пиксель живой — не вмешиваемся.
r = build({ consent: allowed, controllerOwns: true, configRequested: true });
r.tick();
check("живой чужой пиксель не трогаем", pv(r.tracked), 0);

// 5. Очередь пуста — признака подвисания нет.
r = build({ consent: allowed, controllerOwns: true, configRequested: false, queued: 0 });
r.tick();
check("пустая очередь — не спасаем", pv(r.tracked), 0);

// 6. Медленная сеть: конфиг ещё не запрошен, но init уже разобран — пиксель жив.
r = build({ consent: allowed, controllerOwns: true, configRequested: false, queued: 0 });
r.tick();
check("живой пиксель на медленной сети не трогаем", pv(r.tracked), 0);

// 7. Посетитель снял рекламу — спасать нечего.
r = build({ consent: refused, controllerOwns: true, configRequested: false });
r.tick();
check("отказ в баннере — спасения нет", pv(r.tracked), 0);

// 8-9. Обычный случай: контроллера нет, работает сам дублёр.
r = build({ consent: noChoice, controllerOwns: false });
check("без контроллера дублёр шлёт PageView сам", pv(r.tracked), 1);
r.tick();
check("повторное спасение ничего не задваивает", pv(r.tracked), 1);

console.log(fails ? `\n${fails} проверок упало` : "\nвсе проверки прошли");
process.exit(fails ? 1 : 0);

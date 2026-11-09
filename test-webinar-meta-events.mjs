// Мини-модель браузера: два кастомных события 4dev при любом владельце пикселя.
// В песочницу грузится всё, что реально стоит на странице, в том же порядке:
// контроллер FuturaMeta из головы сайта → дублёр meta-pixel → этот файл.
import fs from "node:fs";
import vm from "node:vm";

const read = (f) => fs.readFileSync(new URL(f, import.meta.url), "utf8");
const HEAD = read("./_futurameta-head-block.js");      // снят с живого сайта 06.11.2026
const FALLBACK = read("./meta-pixel-1.2.0.js");
const EVENTS = read("./webinar-meta-events-1.1.0.js");

const SITE_ID = "69b915fc76acca0d89cbd22b";
const SIGN_UP = "Event Sign Up Form";
const WATCH = "Event Watch record Form";

function build({ consent, withAnchor = true, withForm = true, delayPixel = false } = {}) {
  const tracked = [];
  const consentListeners = [];
  const clickListeners = [];
  const prefilters = [];
  const timers = [];

  const form = {
    tagName: "FORM",
    attrs: { "data-name": SIGN_UP, "data-wf-element-id": "el-1", "data-wf-page-id": "page-1", action: null },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  };
  const anchor = { tagName: "A", closest: (sel) => (sel === 'a[href="#sign-up"]' ? anchor : null) };
  const inside = { closest: (sel) => anchor.closest(sel) };
  const elsewhere = { closest: () => null };

  const sandbox = {
    URL, WeakSet, Array, String, Number, JSON, console, Date,
    document: {
      readyState: "complete",
      documentElement: { getAttribute: (k) => (k === "data-wf-site" ? SITE_ID : null) },
      querySelector: (sel) => {
        if (sel === `form[data-name="${SIGN_UP}"]`) return withForm ? form : null;
        return null;
      },
      getElementById: (id) => (id === "sign-up" && withAnchor ? anchor : null),
      createElement: () => ({ setAttribute() {} }),
      head: { appendChild() {} },
      addEventListener(evt, fn) {
        if (evt === "futura:consent") consentListeners.push(fn);
        if (evt === "click") clickListeners.push(fn);
      }
    }
  };
  sandbox.window = sandbox;
  sandbox.location = { href: "https://www.futura.law/ru/events/company-setup-in-the-uae" };
  sandbox.jQuery = { ajaxPrefilter(_t, fn) { prefilters.push(fn); } };
  sandbox.Webflow = [];
  sandbox.FuturaConsent = consent;
  sandbox.setTimeout = (fn) => { timers.push(fn); return timers.length; };
  sandbox.clearTimeout = () => {};

  vm.createContext(sandbox);
  const capture = () => {
    if (sandbox.fbq && !sandbox.fbq.__patched && sandbox.fbq.queue) {
      sandbox.fbq.callMethod = (...args) => tracked.push(args);
      sandbox.fbq.__patched = true;
      sandbox.fbq.queue.splice(0).forEach((a) => tracked.push([...a]));
    }
  };

  vm.runInContext(HEAD, sandbox);
  if (!delayPixel) { vm.runInContext(FALLBACK, sandbox); capture(); }
  vm.runInContext(EVENTS, sandbox);
  capture();

  return {
    tracked, sandbox,
    liftPixel() { vm.runInContext(FALLBACK, sandbox); capture(); },
    tick() { timers.splice(0).forEach((fn) => fn()); capture(); },
    fireConsent() { consentListeners.forEach((fn) => fn({})); capture(); },
    click(where = "anchor") {
      clickListeners.forEach((fn) => fn({ target: where === "anchor" ? inside : elsewhere }));
      capture();
    },
    submit(response, name = SIGN_UP, extra = {}) {
      // Хуков на одну отправку несколько (дублёр, футер, этот файл) —
      // каждый вешает свой done, и затирать их нельзя.
      const request = { _fns: [], done(fn) { this._fns.push(fn); return this; } };
      prefilters.forEach((fn) =>
        fn({ url: `https://webflow.com/api/v1/form/${SITE_ID}`, type: "POST" },
           { data: { name, elementId: "el-1", pageId: "page-1", ...extra } }, request));
      request._fns.forEach((fn) => fn(response));
      capture();
    }
  };
}

// Теперь обе формы: track/trackCustom кладут имя события вторым аргументом.
const count = (t, name) =>
  t.filter((a) => ((a[0] === "trackCustom" || a[0] === "track") && a[1] === name)
                || ((a[0] === "trackSingleCustom" || a[0] === "trackSingle") && a[2] === name)).length;

let failures = 0;
function check(label, actual, expected) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? "ok  " : "FAIL"}  ${label}  (получили ${actual}, ждали ${expected})`);
}

const noChoice = { hasChoice: () => false, advertisingAllowed: () => false, advertisingEpoch: () => 0 };
const allowed = { hasChoice: () => true, advertisingAllowed: () => true, advertisingEpoch: () => 1 };
const refused = { hasChoice: () => true, advertisingAllowed: () => false, advertisingEpoch: () => 1 };

// 1-3. Посетитель баннер не трогал: пикселем владеет дублёр.
let r = build({ consent: noChoice });
r.click();
check("выбора нет → клик даёт WebinarButtonClick", count(r.tracked, "WebinarButtonClick"), 1);
r.submit({ code: 200 });
check("выбора нет → регистрация даёт WebinarRegistration", count(r.tracked, "WebinarRegistration"), 1);
check("выбора нет → привычный Lead на месте", count(r.tracked, "Lead"), 1);

// 4-6. Посетитель явно разрешил рекламу: пикселем владеет FuturaMeta.
r = build({ consent: allowed });
r.click();
check("согласие дано → клик считается", count(r.tracked, "WebinarButtonClick"), 1);
r.submit({ code: 200 });
check("согласие дано → регистрация считается", count(r.tracked, "WebinarRegistration"), 1);
r.sandbox.FuturaMeta.webinarLead();
check("согласие дано → Lead шлёт контроллер, не мы", count(r.tracked, "Lead"), 1);

// 7-8. Посетитель снял «Реклама Meta».
r = build({ consent: refused });
r.click();
r.submit({ code: 200 });
check("отказ → клик не считается", count(r.tracked, "WebinarButtonClick"), 0);
check("отказ → регистрация не считается", count(r.tracked, "WebinarRegistration"), 0);

// 9. Одно намерение на просмотр страницы.
r = build({ consent: noChoice });
r.click(); r.click(); r.click();
check("три нажатия подряд → одно событие", count(r.tracked, "WebinarButtonClick"), 1);

// 10. Клик мимо кнопки.
r = build({ consent: noChoice });
r.click("elsewhere");
check("клик мимо кнопки → ничего", count(r.tracked, "WebinarButtonClick"), 0);

// 11. Прошедший вебинар: якорь есть, формы нет.
r = build({ consent: noChoice, withForm: false });
r.click();
check("прошедший вебинар → клик не считается", count(r.tracked, "WebinarButtonClick"), 0);

// 12-14. Чужие отправки формы.
r = build({ consent: noChoice });
r.submit({ code: 200 }, WATCH);
check("вторая форма страницы → не регистрация", count(r.tracked, "WebinarRegistration"), 0);
r.submit({ code: 400 });
check("неуспешный ответ Webflow → не регистрация", count(r.tracked, "WebinarRegistration"), 0);
r.submit({ code: 200 }, SIGN_UP, { test: true });
check("тестовая отправка → не регистрация", count(r.tracked, "WebinarRegistration"), 0);

// 15. Повторный ответ на ту же отправку.
r = build({ consent: noChoice });
r.submit({ code: 200 });
r.submit({ code: 200 });
check("две отправки → два события, не больше", count(r.tracked, "WebinarRegistration"), 2);

// 16-17. Пиксель поднялся позже, чем человек нажал кнопку.
r = build({ consent: noChoice, delayPixel: true });
r.click();
check("пикселя ещё нет → событие ждёт в очереди", count(r.tracked, "WebinarButtonClick"), 0);
r.liftPixel(); r.tick();
check("пиксель поднялся → отложенное событие ушло", count(r.tracked, "WebinarButtonClick"), 1);

// 18. Отказ после того, как событие встало в очередь.
r = build({ consent: refused, delayPixel: true });
r.click();
r.liftPixel(); r.tick();
check("отказ → очередь не разгружается", count(r.tracked, "WebinarButtonClick"), 0);

console.log(failures ? `\n${failures} проверок упало` : "\nвсе проверки прошли");
process.exit(failures ? 1 : 0);

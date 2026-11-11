// Стенд компактного баннера: что видит посетитель и что доезжает до движка согласия.
import fs from "node:fs";
import { JSDOM } from "jsdom";

const CODE = fs.readFileSync(new URL("./cookie-banner-2.0.0.js", import.meta.url), "utf8");

const PAGE = `<!doctype html><html><head></head><body>
  <main></main>
  <footer>
    <div class="footer_legal">
      <div class="text-size-xs">© 2023-2026 futura</div>
      <a href="/privacy-policy" class="pp-link w-inline-block w--current"><div class="text-size-xs">Privacy Policy</div></a>
      <div class="text-size-xs">Futura Digital FZ LLC</div>
    </div>
  </footer>
</body></html>`;

// Движок из кода головы сайта: нас интересует только его наружный договор.
function makeConsent({ analytics = false, advertising = false, chosen = false, persists = true } = {}) {
  const calls = [];
  return {
    calls,
    state: { analytics, advertising, chosen },
    version: "2026-11-04.1",
    hasChoice() { return this.state.chosen; },
    analyticsAllowed() { return this.state.analytics; },
    advertisingAllowed() { return this.state.advertising; },
    advertisingEpoch() { return 0; },
    setPreferences(a, m) {
      calls.push({ analytics: a, advertising: m });
      if (!persists) return false;
      this.state = { analytics: a, advertising: m, chosen: true };
      return true;
    },
    open() { this.ownDocument.dispatchEvent(new this.ownWindow.CustomEvent("futura:consent-open")); }
  };
}

function domReady(window) {
  if (window.document.readyState !== "loading") return Promise.resolve();
  return new Promise((r) => window.addEventListener("DOMContentLoaded", r, { once: true }));
}

async function boot({ path = "/", consent = makeConsent(), withOldBanner = true, lateConsent = false, early = false } = {}) {
  const dom = new JSDOM(PAGE, {
    url: "https://www.futura.law" + path,
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;
  if (!early) await domReady(window);

  if (withOldBanner) {
    // Старая панель и вечная кнопка в углу — то, что должно уйти с глаз.
    const old = document.createElement("section");
    old.id = "futura-consent";
    document.body.appendChild(old);
    const settings = document.createElement("button");
    settings.id = "futura-cookie-settings";
    document.body.appendChild(settings);
  }

  if (consent) {
    consent.ownDocument = document;
    consent.ownWindow = window;
  }
  if (consent && !lateConsent) window.FuturaConsent = consent;

  window.eval(CODE);

  return { dom, window, document, consent };
}

const q = (document, sel) => document.querySelector(sel);
const text = (node) => (node ? node.textContent.trim() : null);
const visible = (node) => !!node && node.hidden === false;
const buttons = (document, sel) => [...document.querySelectorAll(sel)].map((b) => b.textContent.trim());

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    failures++;
    console.log(`✗ ${name}\n    получили: ${JSON.stringify(got)}\n    ожидали:  ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ——— первый экран: он и есть вся суть правки ——— */

{
  const { document } = await boot();
  const bar = q(document, "#fd-cookie");
  check("баннер появился, пока выбор не сделан", visible(bar), true);
  check("на первом экране две кнопки", buttons(document, "#fd-cookie .fd-btn"), ["Accept", "Necessary only"]);
  check("и одна ссылка «настроить»", buttons(document, "#fd-cookie .fd-more"), ["Settings"]);
  check("галочек на первом экране нет", document.querySelectorAll("#fd-cookie input").length, 0);
  check("текст — одна фраза", text(q(document, "#fd-cookie .fd-text")),
    "We use cookies to run the site, measure traffic and advertise.");
  check("настройки свёрнуты", q(document, "#fd-cookie-panel").hidden, true);
}

{
  const { document } = await boot({ consent: makeConsent({ chosen: true, analytics: true }) });
  check("выбор уже сделан — баннера нет", q(document, "#fd-cookie").hidden, true);
}

/* ——— старая панель и кнопка в углу ——— */

{
  const { document } = await boot();
  const css = text(q(document, "#fd-cookie-style"));
  check("старую панель прячем", css.includes("#futura-consent,#futura-cookie-settings{display:none!important}"), true);
  check("старая панель всё ещё в разметке (её прячет стиль, а не удаление)",
    !!q(document, "#futura-consent"), true);
}

{
  const { document } = await boot({ consent: null });
  check("без движка согласия баннер не показываем", q(document, "#fd-cookie"), null);
  check("и старую панель не прячем", q(document, "#fd-cookie-style"), null);
}

/* ——— что доезжает до движка ——— */

{
  const { document, consent } = await boot();
  q(document, "#fd-cookie .fd-btn").click(); // Accept
  check("«Принять» разрешает всё", consent.calls, [{ analytics: true, advertising: true }]);
  check("и баннер уходит", q(document, "#fd-cookie").hidden, true);
}

{
  const { document, consent } = await boot();
  document.querySelectorAll("#fd-cookie .fd-btn")[1].click(); // Necessary only
  check("«Только необходимые» снимает обе галочки", consent.calls, [{ analytics: false, advertising: false }]);
}

{
  const { document, consent } = await boot();
  q(document, "#fd-cookie .fd-more").click();
  const panel = q(document, "#fd-cookie-panel");
  check("«Настроить» открывает настройки", visible(panel), true);
  check("а первый экран прячет", q(document, "#fd-cookie").hidden, true);
  check("в настройках три раздела", document.querySelectorAll("#fd-cookie-panel .fd-row").length, 3);
  check("у необходимых галочки нет", document.querySelectorAll("#fd-cookie-panel input").length, 2);

  const [analytics, ads] = document.querySelectorAll("#fd-cookie-panel input");
  analytics.checked = true;
  ads.checked = false;
  document.querySelectorAll("#fd-cookie-panel .fd-btn")[0].click(); // Save
  check("«Сохранить» везёт ровно то, что отмечено", consent.calls, [{ analytics: true, advertising: false }]);
  check("настройки закрылись", panel.hidden, true);
}

{
  const { document, consent } = await boot({ consent: makeConsent({ chosen: true, analytics: true, advertising: false }) });
  consent.ownDocument.dispatchEvent(new consent.ownWindow.CustomEvent("futura:consent-open"));
  const [analytics, ads] = document.querySelectorAll("#fd-cookie-panel input");
  check("при открытии галочки показывают текущий выбор", [analytics.checked, ads.checked], [true, false]);
}

/* ——— ссылка в подвале вместо кнопки в углу ——— */

{
  const { document } = await boot();
  const link = q(document, "#fd-cookie-link");
  check("в подвале появилась ссылка", text(link), "Cookie settings");
  check("она стоит сразу за «Privacy Policy»",
    link.previousElementSibling.classList.contains("pp-link"), true);
  check("и не унаследовала подсветку текущей страницы", link.className.includes("w--current"), false);

  link.dispatchEvent(new document.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("клик по ней открывает настройки", visible(q(document, "#fd-cookie-panel")), true);
}

/* ——— русская версия ——— */

{
  const { document } = await boot({ path: "/ru/privacy-policy" });
  check("на /ru баннер по-русски", text(q(document, "#fd-cookie .fd-text")),
    "Мы используем cookie — для работы сайта, аналитики и рекламы.");
  check("кнопки тоже", buttons(document, "#fd-cookie .fd-btn"), ["Принять", "Только необходимые"]);
  check("ссылка на политику ведёт в русскую локаль",
    q(document, "#fd-cookie-panel a").getAttribute("href"), "/ru/privacy-policy");
}

{
  const { document } = await boot({ path: "/ruby-on-rails" });
  check("«/ruby» — это не русская локаль", text(q(document, "#fd-cookie .fd-text")),
    "We use cookies to run the site, measure traffic and advertise.");
}

/* ——— когда выбор некуда записать ——— */

{
  const { document } = await boot({ consent: makeConsent({ persists: false }) });
  q(document, "#fd-cookie .fd-more").click();
  const [analytics, ads] = document.querySelectorAll("#fd-cookie-panel input");
  analytics.checked = true;
  ads.checked = true;
  document.querySelectorAll("#fd-cookie-panel .fd-btn")[0].click();
  check("честно говорим, что выбор не сохранён",
    text(q(document, "#fd-cookie-panel .fd-status")),
    "Your choice could not be saved. Optional tracking is off on this page.");
  check("и гасим галочки, а не делаем вид, что разрешено", [analytics.checked, ads.checked], [false, false]);
}

/* ——— Esc и поздний движок ——— */

{
  const { document, window } = await boot();
  q(document, "#fd-cookie .fd-more").click();
  const panel = q(document, "#fd-cookie-panel");
  panel.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("Esc закрывает настройки", panel.hidden, true);
  check("и возвращает первый экран, раз выбора не было", q(document, "#fd-cookie").hidden, false);
}

{
  // Скрипт выполняется, пока страница ещё разбирается, — как при подключении в <head>.
  const { document, window } = await boot({ early: true });
  await domReady(window);
  check("скрипт успел раньше страницы — баннер всё равно собрался", visible(q(document, "#fd-cookie")), true);
  check("и собрался один раз", document.querySelectorAll("#fd-cookie").length, 1);
}

{
  const consent = makeConsent();
  const { document, window } = await boot({ consent, lateConsent: true });
  check("движка ещё нет — баннера тоже", q(document, "#fd-cookie"), null);
  window.FuturaConsent = consent;
  await sleep(250);
  check("движок появился позже — баннер собрался", visible(q(document, "#fd-cookie")), true);
  window.close();
}

console.log(failures ? `\n${failures} проверок не прошли` : "\nВсе проверки прошли");
process.exit(failures ? 1 : 0);

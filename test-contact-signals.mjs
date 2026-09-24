// Стенд: подсовываем скрипту поддельные document/window и смотрим, что вышло.
import fs from "node:fs";
const code = fs.readFileSync("./contact-signals-1.0.1.js", "utf8");

function makeLink(href) {
  let h = href;
  return { getAttribute: () => h, setAttribute: (_, v) => { h = v; }, get href() { return h; } };
}
function run({ hostname, title, links = [], selection = "", pathname = "/" }) {
  const ymCalls = [];
  const listeners = {};
  const doc = {
    title, readyState: "complete", scripts: [],
    querySelectorAll: () => links,
    createElement: () => ({ set src(v) {}, style: {} }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: () => {} } }],
    head: { appendChild: () => {} },
    addEventListener: (n, f) => { listeners[n] = f; }
  };
  const win = {
    location: { hostname, pathname, search: "" },
    document: doc,
    getSelection: () => selection,
    ym: function (...a) { ymCalls.push(a); }
  };
  new Function("window", "document", "setTimeout", "encodeURIComponent", code)(
    win, doc, () => {}, encodeURIComponent);
  return { listeners, ymCalls };
}
const subjOf = (a) => {
  const m = /subject=([^&]*)/.exec(a.href);
  return m ? decodeURIComponent(m[1]) : null;
};
let fails = 0;
const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) fails++; };

console.log("Тема ставится на содержательных страницах:");
for (const [path, title, want] of [
  ["/ru/services/company-liquidation-uae", "Ликвидация компании в ОАЭ | Futura Digital", "Ликвидация компании в ОАЭ"],
  ["/jurisdictions/hong-kong", "Гонконг — регистрация компании | Futura Digital", "Гонконг — регистрация компании"],
  ["/ru/knowledge-base/vat-uae", "НДС в ОАЭ | Futura Law", "НДС в ОАЭ"],
  ["/solutions/fintech-crypto", "Финтех и крипто | Futura", "Финтех и крипто"]
]) {
  const a = makeLink("mailto:hello@futura.ae");
  run({ hostname: "www.futura.law", title, links: [a], pathname: path });
  ok(subjOf(a) === want, `${path} → «${subjOf(a)}»`);
}

console.log("\nТема НЕ ставится там, где она нелепа:");
for (const [path, title] of [
  ["/ru/contacts", "Контакты международной фирмы Futura Law"],
  ["/", "Legal Services for Gamedev | Futura Digital"],
  ["/ru/team/anna-mintskovskaya", "Анна Минцковская | Futura"],
  ["/media-center/articles/hong-kong-legal-system", "Правовая система Гонконга | Futura"]
]) {
  const a = makeLink("mailto:hello@futura.ae");
  run({ hostname: "www.futura.law", title, links: [a], pathname: path });
  ok(a.href === "mailto:hello@futura.ae", `${path} → ссылка не тронута`);
}

console.log("\nСтарое поведение сохранено:");
const b = makeLink("mailto:hello@futura.ae?subject=Своя%20тема");
run({ hostname: "www.futura.inc", title: "Услуга | Futura", links: [b], pathname: "/services/x" });
ok(b.href === "mailto:hello@futura.ae?subject=Своя%20тема", "ссылка со своей темой не тронута");

const c = makeLink("mailto:hello@futura.ae?cc=a@b.c");
run({ hostname: "www.futura.inc", title: "Услуга | Futura", links: [c], pathname: "/services/x" });
ok(c.href.includes("?cc=a@b.c&subject="), "второй параметр через &");

console.log("\nЦель на копирование:");
let r = run({ hostname: "www.futura.law", title: "Контакты", selection: "пишите на Hello@Futura.ae", pathname: "/ru/contacts" });
r.ymCalls.length = 0; r.listeners["copy"]();
ok(r.ymCalls.some(x => x[0] === 113005067 && x[1] === "reachGoal" && x[2] === "email_copy"),
   "на law летит цель — и на странице без темы тоже");

let r2 = run({ hostname: "www.futura.inc", title: "Услуга", selection: "просто текст", pathname: "/services/x" });
r2.ymCalls.length = 0; r2.listeners["copy"]();
ok(r2.ymCalls.length === 0, "посторонний текст цель не шлёт");

let r3 = run({ hostname: "www.futura.ae", title: "Услуга", selection: "hello@futura.ae", pathname: "/services/x" });
r3.ymCalls.length = 0; r3.listeners["copy"]();
ok(r3.ymCalls.length === 0, "на чужом домене цель не шлём");

console.log(fails ? `\nПРОВАЛОВ: ${fails}` : "\nвсе проверки пройдены");
process.exit(fails ? 1 : 0);

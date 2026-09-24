// Стенд: подсовываем скрипту поддельные document/window и смотрим, что вышло.
import fs from "node:fs";
const code = fs.readFileSync("./contact-signals-1.0.0.js", "utf8");

function makeLink(href) {
  let h = href;
  return { getAttribute: () => h, setAttribute: (_, v) => { h = v; }, get href() { return h; } };
}
function run({ hostname, title, links, selection, pathname = "/p" }) {
  const scriptsAdded = [];
  const ymCalls = [];
  const listeners = {};
  const doc = {
    title, readyState: "complete", scripts: [],
    querySelectorAll: () => links,
    createElement: () => ({ set src(v) { scriptsAdded.push(v); }, style: {} }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: () => {} } }],
    head: { appendChild: () => {} },
    addEventListener: (n, f) => { listeners[n] = f; }
  };
  const win = {
    location: { hostname, pathname, search: "" },
    document: doc,
    getSelection: () => selection,
    setTimeout: () => {},
    ym: undefined
  };
  const fn = new Function("window", "document", "setTimeout", "encodeURIComponent", code);
  win.ym = function (...a) { ymCalls.push(a); };
  fn(win, doc, () => {}, encodeURIComponent);
  return { listeners, ymCalls, scriptsAdded, win };
}

let fails = 0;
const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) fails++; };

console.log("Тема письма из заголовка страницы:");
let a = makeLink("mailto:hello@futura.ae");
run({ hostname: "www.futura.law", title: "Ликвидация компании в ОАЭ | Futura Digital", links: [a], selection: "" });
ok(a.href.includes("subject=") && decodeURIComponent(a.href).includes("Ликвидация компании в ОАЭ"),
   "тема = название страницы: " + decodeURIComponent(a.href));
ok(!decodeURIComponent(a.href).includes("Futura Digital"), "хвост «| Futura Digital» отрезан");

console.log("\nНе портим уже настроенные ссылки:");
let b = makeLink("mailto:hello@futura.ae?subject=Своя%20тема");
run({ hostname: "www.futura.inc", title: "Контакты | Futura", links: [b], selection: "" });
ok(b.href === "mailto:hello@futura.ae?subject=Своя%20тема", "ссылка с темой не тронута");

console.log("\nВторой параметр приклеивается через &:");
let c = makeLink("mailto:hello@futura.ae?cc=a@b.c");
run({ hostname: "www.futura.inc", title: "Тест", links: [c], selection: "" });
ok(c.href.includes("?cc=a@b.c&subject="), "разделитель & : " + c.href);

console.log("\nКопирование почты:");
let r = run({ hostname: "www.futura.law", title: "Контакты", links: [], selection: "напишите на Hello@Futura.ae пожалуйста" });
r.ymCalls.length = 0;
r.listeners["copy"]();
ok(r.ymCalls.some(x => x[1] === "reachGoal" && x[2] === "email_copy" && x[0] === 113005067),
   "на law шлём цель в счётчик 113005067");

console.log("\nКопирование постороннего текста:");
let r2 = run({ hostname: "www.futura.inc", title: "Контакты", links: [], selection: "просто текст" });
r2.ymCalls.length = 0;
r2.listeners["copy"]();
ok(r2.ymCalls.length === 0, "цель не отправлена");

console.log("\nЧужой домен (futura.ae — счётчик не наш):");
let d = makeLink("mailto:hello@futura.ae");
let r3 = run({ hostname: "www.futura.ae", title: "Контакты", links: [d], selection: "hello@futura.ae" });
r3.ymCalls.length = 0;
r3.listeners["copy"]();
ok(r3.ymCalls.length === 0, "цель не шлём — счётчика нет");
ok(d.href.includes("subject="), "но тему письма всё равно проставили");

console.log(fails ? `\nПРОВАЛОВ: ${fails}` : "\nвсе проверки пройдены");
process.exit(fails ? 1 : 0);

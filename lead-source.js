/**
 * lead-source.js — источник лида едет вместе с заявкой.
 *
 * Зачем. Заявка приходит в лид-машину без источника: в реестре колонки
 * utm_source / page_url / referrer пустые, и в чате «Источник: —».
 * Аналитика тут не помогает — её режут блокировщики, а возвратный визит
 * маскирует первый источник под «прямой заход». Поэтому источник кладём
 * в саму форму скрытыми полями: он доедет, даже если счётчиков нет вовсе.
 *
 * Имена полей заданы не нами — их читает Normalize в lead-intake:
 *   Source-Page      → колонка page_url
 *   Source-UTM       → колонка utm_source
 *   Source-Referrer  → колонка referrer
 *   Source-Landing   → в заметки карточки Asana (triage_decision)
 * Остальные поля оседают в raw_json и видны при разборе лида.
 *
 * Запись на звонок — тоже заявка, но формы у неё нет: человек уходит на
 * calendly.com, и единственное, что доедет оттуда до лид-машины, — метки
 * в адресе самой ссылки. Calendly кладёт их в `tracking` брони, дверь
 * `calendly` перекладывает `utm_source` в ту же колонку реестра, что и формы.
 * Поэтому метки дописываются прямо в href кнопок «Calendly» (см. tagLink).
 *
 * Подключение — одной строкой в Webflow, Site settings → Custom code →
 * Footer code, на каждом сайте:
 *   <script src="https://cdn.jsdelivr.net/gh/azhuravleva-beep/futura-inc-site-code@main/lead-source.js"></script>
 *
 * После правки сбросить кэш:
 *   https://purge.jsdelivr.net/gh/azhuravleva-beep/futura-inc-site-code@main/lead-source.js
 */
(function () {
  "use strict";

  var STORE = "futura_first_touch";
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  /** localStorage падает в приватном окне и при запрете куки — везде через try. */
  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeStore(value) {
    try {
      window.localStorage.setItem(STORE, JSON.stringify(value));
    } catch (e) {
      /* приватное окно — переживём, останется last-touch */
    }
  }

  function params() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return new URLSearchParams("");
    }
  }

  /** Реферер считается внешним, только если хост не из семьи Futura. */
  function externalReferrer() {
    var ref = document.referrer || "";
    if (!ref) return "";
    try {
      var host = new URL(ref).hostname.replace(/^www\./, "");
      if (/(^|\.)futura\.(inc|law|ae)$/.test(host)) return "";
      if (/(^|\.)futuracrypto\.io$/.test(host)) return "";
      if (/(^|\.)futuradigital\.ae$/.test(host)) return "";
      return ref;
    } catch (e) {
      return "";
    }
  }

  /**
   * Первое касание записывается один раз и больше не трогается.
   * Именно оно отвечает на вопрос «откуда человек узнал», а последний визит
   * почти всегда «прямой заход» и врёт.
   */
  function firstTouch() {
    var stored = readStore();
    if (stored && stored.at) return stored;

    var p = params();
    var utm = {};
    UTM_KEYS.forEach(function (k) {
      var v = p.get(k);
      if (v) utm[k] = v;
    });

    // ysclid — метка перехода из выдачи Яндекса, gclid — из Google Ads.
    var hint = "";
    if (p.get("ysclid")) hint = "yandex-search";
    else if (p.get("gclid")) hint = "google-ads";
    else if (p.get("fbclid")) hint = "facebook";

    var touch = {
      at: new Date().toISOString(),
      page: window.location.href,
      // Посадочная страница в том же виде, что писал прежний скрипт:
      // машина переносит Source-Landing в заметки карточки Asana.
      landing: window.location.pathname + window.location.search,
      referrer: externalReferrer(),
      hint: hint,
      utm: utm
    };
    writeStore(touch);
    return touch;
  }

  /** Короткая подпись источника — то, что человек увидит в чате лидов. */
  function sourceLabel(touch) {
    if (touch.utm && touch.utm.utm_source) {
      var parts = [touch.utm.utm_source];
      if (touch.utm.utm_medium) parts.push(touch.utm.utm_medium);
      if (touch.utm.utm_campaign) parts.push(touch.utm.utm_campaign);
      return parts.join(" / ");
    }
    if (touch.hint) return touch.hint;
    if (touch.referrer) {
      try {
        return new URL(touch.referrer).hostname.replace(/^www\./, "");
      } catch (e) {
        return touch.referrer;
      }
    }
    return "direct";
  }

  // --- ссылки на Calendly ---------------------------------------------------

  /** Хост ссылки — сам calendly.com или его поддомен. */
  var CALENDLY_HOST_RE = /(^|\.)calendly\.com$/i;

  /**
   * Дописывает в ссылку на Calendly метки источника.
   *
   * Метку, проставленную руками (ссылка из рассылки, аутрича или подписи),
   * не трогаем: она точнее нашей догадки.
   */
  function tagLink(link, touch) {
    if (!link || !link.getAttribute) return;
    var href = link.getAttribute("href") || "";
    if (href.indexOf("calendly.com") < 0) return;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (e) {
      return;
    }
    if (!CALENDLY_HOST_RE.test(url.hostname)) return;

    function set(key, value) {
      if (!value) return;
      if (url.searchParams.get(key)) return;
      url.searchParams.set(key, value);
    }

    // Та же подпись, что уходит в формы, — чтобы колонка источника в реестре
    // читалась одинаково для заявки с сайта и для брони.
    set("utm_source", sourceLabel(touch));
    set("utm_medium", (touch.utm && touch.utm.utm_medium) || "site");
    set("utm_campaign", touch.utm && touch.utm.utm_campaign);
    // У брони нет поля Source-Page, а знать, с какой страницы пошли на звонок,
    // нужно ровно так же — кладём путь страницы в utm_content.
    set("utm_content", window.location.pathname);
    set("utm_term", touch.utm && touch.utm.utm_term);

    link.setAttribute("href", url.toString());
  }

  function tagLinks(touch) {
    var links = document.querySelectorAll('a[href*="calendly.com"]');
    for (var i = 0; i < links.length; i++) tagLink(links[i], touch);
  }

  function setField(form, name, value) {
    var field = form.querySelector('input[name="' + name + '"]');
    if (!field) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      form.appendChild(field);
    }
    field.value = value == null ? "" : String(value);
  }

  function fill(form, touch) {
    if (!form || form.tagName !== "FORM") return;

    setField(form, "Source-Page", window.location.href);
    setField(form, "Source-UTM", sourceLabel(touch));
    // Только внешний реферер: переход с futura.law на futura.inc — не источник,
    // и колонка referrer в реестре не должна выдавать его за источник.
    // Когда внешнего реферера нет, пишем это словами, а не пустотой: пустая
    // ячейка читается как «не сработало», «прямой заход» — как факт.
    setField(form, "Source-Referrer", touch.referrer || externalReferrer() || "прямой заход");

    // Посадочная первого визита — её читает сборка карточки в Asana.
    setField(form, "Source-Landing", touch.landing || (window.location.pathname + window.location.search));

    // Ниже — в raw_json, для разбора руками.
    setField(form, "Source-First-At", touch.at || "");
    setField(form, "Source-First-Page", touch.page || "");
    setField(form, "Source-Last-Referrer", externalReferrer());
    UTM_KEYS.forEach(function (k) {
      if (touch.utm && touch.utm[k]) setField(form, k, touch.utm[k]);
    });
  }

  function fillAll() {
    var touch = firstTouch();
    var forms = document.querySelectorAll("form");
    for (var i = 0; i < forms.length; i++) fill(forms[i], touch);
    tagLinks(touch);
  }

  function start() {
    fillAll();

    // Формы внутри попапов и CMS-списков появляются позже — добираем их.
    if (window.MutationObserver) {
      var pending = null;
      var observer = new MutationObserver(function () {
        if (pending) return;
        pending = window.setTimeout(function () {
          pending = null;
          fillAll();
        }, 300);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Последний штрих перед отправкой: адрес страницы мог смениться на SPA-переходе.
    document.addEventListener(
      "submit",
      function (e) {
        if (e.target && e.target.tagName === "FORM") fill(e.target, firstTouch());
      },
      true
    );

    // То же для брони: адрес страницы мог смениться на SPA-переходе, а ссылку
    // мог подставить чужой скрипт уже после наблюдателя.
    document.addEventListener(
      "click",
      function (e) {
        var node = e.target;
        while (node && node.tagName !== "A") node = node.parentNode;
        if (node && node.tagName === "A") tagLink(node, firstTouch());
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

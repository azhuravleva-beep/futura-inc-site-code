/**
 * contact-signals.js — видим обращения по почте.
 *
 * Зачем. Письма на hello@ приходят без источника: с 01.08.2026 в реестре
 * 35 таких обращений и у всех 35 колонки page_url / referrer / utm_source
 * пустые. Это каждый четвёртый настоящий лид. Причина не в разметке форм —
 * человек вообще не заполняет форму, он берёт адрес со страницы и пишет сам.
 *
 * Делает три вещи:
 *   1. Ставит наш счётчик Метрики на futura.law — до этого там стоял только
 *      чужой счётчик 102343767, доступа к которому у нас нет.
 *   2. Дописывает в ссылки mailto тему письма с названием страницы, поэтому
 *      входящее письмо само говорит, откуда его отправили.
 *   3. Ловит копирование адреса мышкой и шлёт цель email_copy — автоцель
 *      Метрики этого не умеет, она считает только клик по ссылке.
 *
 * Цели заведены заранее:
 *   111386861 (futura.inc) → 663159430 «Скопировал e-mail»
 *   113005067 (futura.law) → 663159431 «Скопировал e-mail»
 *
 * Подключение — одной строкой в Webflow, Site settings → Custom code →
 * Footer code, на каждом сайте. Файл версионный: меняем версию — меняем имя,
 * иначе ломается integrity у уже подключённых страниц.
 *
 * После правки сбросить кэш jsDelivr:
 *   https://purge.jsdelivr.net/gh/azhuravleva-beep/futura-inc-site-code@main/contact-signals-1.0.0.js
 */
(function () {
  "use strict";

  /** Наши счётчики. Чужие сюда не вносим — целей в них всё равно не завести. */
  var COUNTERS = {
    "futura.law": 113005067,
    "futura.inc": 111386861
  };
  var COPY_GOAL = "email_copy";
  /** Адреса, ради которых всё затевалось. Сравниваем в нижнем регистре. */
  var EMAILS = ["hello@futura.ae"];

  var host = String(window.location.hostname || "").replace(/^www\./, "");
  var counter = COUNTERS[host] || null;

  /* ------------------------------------------------------------------ *
   * 1. Счётчик Метрики
   * ------------------------------------------------------------------ */

  /**
   * На law уже висит чужой счётчик, то есть tag.js на странице есть и ym
   * определён. Тогда достаточно вызвать init. Если скрипта нет — грузим.
   */
  function ensureMetrika(id) {
    if (!id) return;
    var SRC = "https://mc.yandex.ru/metrika/tag.js";
    try {
      if (typeof window.ym !== "function") {
        window.ym = function () {
          (window.ym.a = window.ym.a || []).push(arguments);
        };
        window.ym.l = 1 * new Date();
      }
      var loaded = false;
      for (var i = 0; i < document.scripts.length; i++) {
        if (document.scripts[i].src === SRC) { loaded = true; break; }
      }
      if (!loaded) {
        var s = document.createElement("script");
        var first = document.getElementsByTagName("script")[0];
        s.async = 1;
        s.src = SRC;
        if (first && first.parentNode) first.parentNode.insertBefore(s, first);
        else document.head.appendChild(s);
      }
      /* Инициализируем только свой счётчик — чужой трогать нельзя. */
      if (!window.__futuraCounterInit) {
        window.__futuraCounterInit = true;
        window.ym(id, "init", {
          webvisor: true,
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true
        });
      }
    } catch (e) {
      /* аналитика не должна ронять страницу */
    }
  }

  /* ------------------------------------------------------------------ *
   * 2. Тема письма с названием страницы
   * ------------------------------------------------------------------ */

  /** Заголовок вкладки без хвоста «| Futura Digital» — он одинаков везде. */
  function pageName() {
    var t = String(document.title || "").trim();
    t = t.split(/\s*[|—–]\s*/)[0].trim();
    if (!t) t = String(window.location.pathname || "/");
    return t.length > 70 ? t.slice(0, 70) + "…" : t;
  }

  function tagMailtoLinks() {
    var subject;
    try {
      subject = "Вопрос по странице: " + pageName();
    } catch (e) {
      return;
    }
    var links = document.querySelectorAll('a[href^="mailto:"], a[href^="MAILTO:"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute("href") || "";
      /* уже с темой — не трогаем, чтобы не затереть ручную настройку */
      if (href.toLowerCase().indexOf("subject=") !== -1) continue;
      var sep = href.indexOf("?") === -1 ? "?" : "&";
      try {
        a.setAttribute("href", href + sep + "subject=" + encodeURIComponent(subject));
      } catch (e) {
        /* пропускаем битую ссылку */
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * 3. Копирование адреса
   * ------------------------------------------------------------------ */

  function selectionHasEmail() {
    var sel;
    try {
      sel = String(window.getSelection ? window.getSelection() : "").toLowerCase();
    } catch (e) {
      return false;
    }
    if (!sel) return false;
    for (var i = 0; i < EMAILS.length; i++) {
      if (sel.indexOf(EMAILS[i]) !== -1) return true;
    }
    return false;
  }

  function onCopy() {
    if (!counter || !selectionHasEmail()) return;
    try {
      window.ym(counter, "reachGoal", COPY_GOAL, {
        page: String(window.location.pathname || "/")
      });
    } catch (e) {
      /* цель не доехала — не беда, страница важнее */
    }
  }

  /* ------------------------------------------------------------------ *
   * Запуск
   * ------------------------------------------------------------------ */

  function start() {
    ensureMetrika(counter);
    tagMailtoLinks();
    /* Часть блоков Webflow дорисовывается после загрузки — пройдёмся ещё раз. */
    setTimeout(tagMailtoLinks, 1200);
    setTimeout(tagMailtoLinks, 4000);
    document.addEventListener("copy", onCopy, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

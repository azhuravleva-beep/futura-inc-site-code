/**
 * meta-pixel-1.2.0.js — возврат к схеме, которая работала 04.11.2026.
 *
 * Зачем. С 05.11 события пикселя 4dev перестали доходить до их кабинета —
 * не приходит даже штатный PageView. 04.11, когда пиксель ставился файлом
 * meta-pixel-1.0.0.js, всё работало. Между этими двумя днями в способе
 * инициализации появилось три вещи, которых раньше не было:
 *
 *   fbq('consent','revoke') → ... → fbq('consent','grant')   — Consent Mode Meta
 *   fbq('set','autoConfig',false,ID)                          — до init
 *   fbq('trackSingle', ID, 'PageView')                        — вместо track
 *
 * Пока не придёт grant, пиксель копит события и наружу не шлёт — то есть это
 * ровно тот «блокер», который ищет перформанс-маркетинг. Этот файл возвращает
 * инициализацию к варианту 1.0.0 — голые init и track — и ничего больше
 * не меняет. Решение Алисы 09.11.2026: сначала работающий пиксель, остальное потом.
 *
 * Что сохранено от 1.1.0: отказ посетителя уважается. Снял «Реклама Meta»
 * в баннере — пиксель не поднимается. Баннер не должен врать, а на доставку
 * событий это не влияет: баннер не трогает подавляющее большинство.
 *
 * Про второго владельца. В коде головы сайта живёт контроллер FuturaMeta,
 * он поднимает пиксель у тех, кто явно разрешил рекламу, — и делает это
 * по новой схеме, с consent-командами. Переинициализировать чужой пиксель
 * нельзя, поэтому таким посетителям этот файл только досылает
 * fbq('consent','grant') — страховка на случай, если grant не дошёл.
 *
 * Lead ловится по ответу нативной формы Webflow (response.code === 200),
 * а не по submit и не по блоку «Спасибо»: при ошибке Webflow тоже отвечает
 * двухсоткой. На вторую форму страницы вебинара Lead не срабатывает.
 */
(function (w, d) {
  "use strict";
  if (w.__futuraMetaFallback) return;
  w.__futuraMetaFallback = true;

  var ID = "1249807613110031";
  var SITE_ID = "69b915fc76acca0d89cbd22b";
  var FORM_NAME = "Event Sign Up Form";

  var owned = null, active = false, pageView = false, leadInstalled = false, granted = false;

  /* Посетитель явно снял флажок «Реклама Meta» и сохранил выбор. */
  function declined() {
    var c = w.FuturaConsent;
    if (!c || typeof c.hasChoice !== "function") return false;
    try {
      return c.hasChoice() && !c.advertisingAllowed();
    } catch (error) {
      return false;
    }
  }

  /* Пикселем уже управляет контроллер из головы сайта. */
  function metaOwns() {
    try {
      return !!(w.FuturaMeta && w.FuturaMeta.status && w.FuturaMeta.status().loaded);
    } catch (error) {
      return false;
    }
  }

  /**
   * Чужой пиксель поднят контроллером по схеме с Consent Mode. Своего init
   * мы сделать не можем, но можем снять возможный невыданный grant.
   */
  function unblockForeign() {
    if (granted || typeof w.fbq !== "function") return;
    granted = true;
    try {
      w.fbq("consent", "grant");
    } catch (error) {
      /* Аналитика не имеет права ломать страницу. */
    }
  }

  function takeOver() {
    if (active || declined()) return false;
    if (metaOwns()) { unblockForeign(); return false; }
    /* Чужой fbq — чей-то ещё пиксель; второй раз инициализировать нельзя. */
    if (w.fbq) { unblockForeign(); return false; }

    var f = (w.fbq = function () {
      f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments);
    });
    owned = f;
    if (!w._fbq) w._fbq = f;
    f.push = f;
    f.loaded = true;
    f.version = "2.0";
    f.queue = [];
    /* Ровно как 04.11: только init, без set autoConfig и без consent-команд. */
    f("init", ID);

    var s = d.createElement("script");
    s.id = "futura-meta-pixel-fallback";
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    d.head.appendChild(s);

    active = true;
    if (!pageView) {
      f("track", "PageView");
      pageView = true;
    }
    installLead();
    return true;
  }

  /**
   * Отказ после старта. Consent-команды сюда намеренно не возвращаются —
   * вместо них просто перестаём отправлять и чистим очередь.
   */
  function stop() {
    if (!active) return;
    active = false;
    if (owned && w.fbq === owned && Array.isArray(owned.queue)) {
      owned.queue = owned.queue.filter(function (args) {
        return String(args[0]).indexOf("track") !== 0;
      });
    }
  }

  function track(event, params) {
    if (!active || !owned || w.fbq !== owned) return;
    try {
      owned("track", event, params);
    } catch (error) {
      /* Аналитика не имеет права ломать страницу и отправку формы. */
    }
  }

  /**
   * Lead на ответ нативной формы Webflow.
   * Проверок много намеренно: на странице вебинара есть вторая форма
   * («Event Watch record Form»), на неё Lead срабатывать не должен.
   */
  function installLead() {
    var $ = w.jQuery;
    if (leadInstalled || !$ || typeof $.ajaxPrefilter !== "function") return;
    if ($.__futuraMetaFallbackLead) return;
    $.__futuraMetaFallbackLead = true;
    leadInstalled = true;
    var observed = new WeakSet();

    $.ajaxPrefilter("json", function (options, originalOptions, request) {
      try {
        var endpoint = new URL(options.url, w.location.href);
        var payload = originalOptions.data;
        if (
          endpoint.protocol !== "https:" ||
          (endpoint.host !== "webflow.com" && endpoint.host !== "formdata.webflow.com") ||
          endpoint.pathname !== "/api/v1/form/" + SITE_ID ||
          endpoint.search ||
          String(options.type || "").toUpperCase() !== "POST" ||
          !payload ||
          typeof payload !== "object" ||
          payload.test ||
          payload.name !== FORM_NAME ||
          d.documentElement.getAttribute("data-wf-site") !== SITE_ID ||
          observed.has(request)
        ) {
          return;
        }

        var form = d.querySelector('form[data-name="' + FORM_NAME + '"]');
        if (
          !form ||
          form.tagName !== "FORM" ||
          form.getAttribute("action") ||
          payload.elementId !== form.getAttribute("data-wf-element-id") ||
          !payload.pageId ||
          payload.pageId !== form.getAttribute("data-wf-page-id")
        ) {
          return;
        }

        observed.add(request);
        var sent = false;
        request.done(function (response) {
          /* Единственный признак успеха у живого обработчика Webflow. */
          if (sent || !response || response.code !== 200) return;
          sent = true;
          track("Lead", {
            content_name: "Webinar registration",
            content_category: "webinar"
          });
        });
      } catch (error) {
        /* Поменяется контракт нативного запроса — просто не считаем Lead. */
      }
    });
  }

  function sync() {
    if (declined()) stop();
    else takeOver();
  }

  d.addEventListener("futura:consent", sync);
  sync();

  /* jQuery и формы Webflow появляются позже, чем этот скрипт в <head>. */
  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", function () { if (active) installLead(); }, { once: true });
  }
  w.Webflow = w.Webflow || [];
  w.Webflow.push(function () { if (active) installLead(); });

  w.FuturaMetaFallback = {
    version: "1.2.0",
    status: function () {
      return { pixelId: ID, active: active, declined: declined(), metaOwns: metaOwns() };
    }
  };
})(window, document);

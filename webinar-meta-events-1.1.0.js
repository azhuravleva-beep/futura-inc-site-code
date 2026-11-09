/**
 * webinar-meta-events-1.1.0.js — два кастомных события Meta по запросу Димы
 * Найдина (перформанс-маркетинг 4dev), 06.11.2026:
 *
 *   WebinarButtonClick   — нажал «записаться» на странице вебинара
 *   WebinarRegistration  — подтверждённо зарегистрировался
 *
 * Параметры у обоих те, что он прислал:
 * content_name: 'Webinar registration', content_category: 'webinar'.
 *
 * ⚠️ WebinarRegistration — это второе имя для уже существующего Lead,
 * одно и то же действие. Складывать их в отчёте нельзя: регистрации удвоятся.
 *
 * Зачем отдельный файл. Пикселем на сайте владеет то один код, то другой:
 * пока посетитель не трогал баннер согласия — дублёр (meta-pixel-1.1.0.js),
 * после явного «Реклама Meta» — контроллер FuturaMeta из головы сайта.
 * Привяжись мы к одному из них, половина событий потерялась бы. Поэтому здесь
 * нет своего пикселя: файл только дожидается чужого поднятого fbq и шлёт
 * в него кастомные события. Своего PageView и своего init он не делает.
 *
 * Согласие уважается ровно так же, как у дублёра: молчим, только если
 * посетитель сохранил выбор и снял «Реклама Meta». До выбора события уходят —
 * это опт-аут, решение Алисы 05.11.2026.
 *
 * 09.11.2026: trackSingleCustom заменён на trackCustom. Причина та же, по которой
 * дублёр откатан к meta-pixel-1.2.0 — возвращаем ровно те формы вызова, которые
 * работали 04.11, чтобы в сетапе не осталось ни одного отличия от рабочего дня.
 *
 * Регистрация ловится по ответу нативной формы Webflow (response.code === 200),
 * а не по submit и не по блоку «Спасибо»: при ошибке Webflow тоже отвечает
 * двухсоткой. На вторую форму страницы («Event Watch record Form») не реагирует.
 */
(function (w, d) {
  "use strict";
  if (w.__futuraWebinarMetaEvents) return;
  w.__futuraWebinarMetaEvents = true;

  var ID = "1249807613110031";
  var SITE_ID = "69b915fc76acca0d89cbd22b";
  var FORM_NAME = "Event Sign Up Form";
  var PARAMS = { content_name: "Webinar registration", content_category: "webinar" };
  var ANCHOR = 'a[href="#sign-up"]';
  var RETRIES = 20, RETRY_MS = 250;

  var pending = [], attempts = 0, timer = null;
  var clickCounted = false, leadInstalled = false;

  /* Посетитель сохранил выбор и снял флажок «Реклама Meta». */
  function declined() {
    var c = w.FuturaConsent;
    if (!c || typeof c.hasChoice !== "function") return false;
    try {
      return c.hasChoice() && !c.advertisingAllowed();
    } catch (error) {
      return false;
    }
  }

  /* Пиксель уже поднят — неважно кем из двух владельцев. */
  function pixelLive() {
    if (typeof w.fbq !== "function") return false;
    try {
      if (w.FuturaMeta && w.FuturaMeta.status && w.FuturaMeta.status().loaded) return true;
    } catch (error) { /* чужой или сломанный контроллер — просто не он */ }
    try {
      if (w.FuturaMetaFallback && w.FuturaMetaFallback.status && w.FuturaMetaFallback.status().active) return true;
    } catch (error) { /* то же самое */ }
    return false;
  }

  function flush() {
    if (!pending.length) return;
    if (declined()) { pending.length = 0; return; }
    if (!pixelLive()) { retry(); return; }
    pending.splice(0).forEach(function (name) {
      try {
        /* Ровно та форма вызова, которую прислал Дима, и та же, что у Lead. */
        w.fbq("trackCustom", name, PARAMS);
      } catch (error) {
        /* Аналитика не имеет права ломать страницу и отправку формы. */
      }
    });
  }

  /* fbq поднимается в <head>, но файлы грузятся вразнобой — даём ему успеть. */
  function retry() {
    if (timer || attempts >= RETRIES) return;
    attempts++;
    timer = w.setTimeout(function () { timer = null; flush(); }, RETRY_MS);
  }

  function send(name) {
    if (declined()) return false;
    pending.push(name);
    flush();
    return true;
  }

  /**
   * Регистрация. Проверок много намеренно: на странице вебинара есть вторая
   * форма, и её отправка регистрацией не является.
   */
  function installRegistration() {
    var $ = w.jQuery;
    if (leadInstalled || !$ || typeof $.ajaxPrefilter !== "function") return;
    if ($.__futuraWebinarCustomEvents) return;
    $.__futuraWebinarCustomEvents = true;
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
          send("WebinarRegistration");
        });
      } catch (error) {
        /* Поменяется контракт нативного запроса — просто не считаем событие. */
      }
    });
  }

  /**
   * Намерение. Считаем кнопку «записаться», которая ведёт к форме, а не саму
   * отправку формы — её покрывает WebinarRegistration. Один раз на просмотр
   * страницы: пять нажатий подряд — это одно намерение, а не пять.
   */
  function installClick() {
    d.addEventListener("click", function (event) {
      if (clickCounted) return;
      var target = event && event.target;
      if (!target || typeof target.closest !== "function") return;
      if (!target.closest(ANCHOR)) return;
      /* Якорь есть и на прошедших вебинарах — там нет формы, считать нечего. */
      if (!d.getElementById("sign-up")) return;
      if (!d.querySelector('form[data-name="' + FORM_NAME + '"]')) return;
      /* Отказ не должен сжечь счётчик: вдруг согласие ещё впереди. */
      if (send("WebinarButtonClick")) clickCounted = true;
    }, true);
  }

  installClick();
  installRegistration();
  d.addEventListener("futura:consent", flush);
  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", installRegistration, { once: true });
  }
  w.Webflow = w.Webflow || [];
  w.Webflow.push(installRegistration);

  w.FuturaWebinarMetaEvents = {
    version: "1.1.0",
    status: function () {
      return {
        pixelId: ID,
        pixelLive: pixelLive(),
        declined: declined(),
        clickCounted: clickCounted,
        queued: pending.length
      };
    }
  };
})(window, document);

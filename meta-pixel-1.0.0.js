/**
 * meta-pixel.js — Meta Pixel на futura.inc.
 *
 * Поставлен 04.11.2026 по запросу 4dev под их перформанс-рекламу вебинара
 * «Сетап в ОАЭ» (18.11.2026). Пиксель принадлежит 4dev, не нам: ID
 * 1249807613110031, и всё, что он собирает, уходит в их рекламный кабинет.
 *
 * Делает две вещи:
 *   1. PageView на каждой странице сайта.
 *   2. Lead — в момент ПОДТВЕРЖДЁННОЙ отправки формы записи на вебинар
 *      («Event Sign Up Form»), а не по клику на кнопку и не по открытию
 *      страницы, как и просили 4dev.
 *
 * ⚠️ Что значит «подтверждённой». Нативная форма Webflow шлёт данные аяксом на
 * /api/v1/form/<site-id>. Успех — это ответ с полем code === 200. Ни событие
 * submit, ни HTTP 200 сам по себе, ни появление блока «Спасибо» успехом не
 * являются: при ошибке Webflow тоже отвечает двухсоткой. Поэтому слушаем ответ,
 * а не DOM. Тот же приём уже работает на сайте для формы «Discuss the Task».
 *
 * ⚠️ Согласие. RESPECT_CONSENT=false — пиксель грузится всем, включая тех, кто
 * нажал «Отклонить аналитику» в баннере #futura-consent. Так решено 04.11.2026:
 * 4dev просили обычную установку, текст баннера решено не трогать. Баннер при
 * этом обещает посетителю, что рекламная персонализация отключена, — это
 * расхождение осознанное. Поставить true — и пиксель будет ждать согласия;
 * тогда же надо переписать текст баннера, иначе он всё равно неточен.
 */
(function (w, d) {
  "use strict";
  if (w.__futuraMetaPixel) return;
  w.__futuraMetaPixel = true;

  var PIXEL_ID = "1249807613110031";
  var SITE_ID = "69b915fc76acca0d89cbd22b";
  var FORM_NAME = "Event Sign Up Form";
  var RESPECT_CONSENT = false;

  /* Штатный загрузчик Meta, без изменений. */
  function loadPixel() {
    if (w.fbq) return;
    var n = (w.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    var t = d.createElement("script");
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    var first = d.getElementsByTagName("script")[0];
    if (first && first.parentNode) first.parentNode.insertBefore(t, first);
    else d.head.appendChild(t);
  }

  function track(event, params) {
    try {
      if (typeof w.fbq === "function") w.fbq("track", event, params);
    } catch (error) {
      /* Аналитика не имеет права ломать страницу и отправку формы. */
    }
  }

  /**
   * Lead вешаем на ответ нативной формы Webflow.
   * Проверок много намеренно: на странице вебинара есть вторая форма
   * («Event Watch record Form»), и Lead не должен срабатывать на неё.
   */
  function installLeadTracking() {
    var $ = w.jQuery;
    if (!$ || typeof $.ajaxPrefilter !== "function" || $.__futuraMetaLeadV1) return;
    $.__futuraMetaLeadV1 = true;
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
          form.getAttribute("data-name") !== FORM_NAME ||
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

  function start() {
    loadPixel();
    try {
      w.fbq("init", PIXEL_ID);
    } catch (error) {
      return;
    }
    track("PageView");

    installLeadTracking();
    if (d.readyState === "loading") {
      d.addEventListener("DOMContentLoaded", installLeadTracking, { once: true });
    }
    /* jQuery и формы Webflow появляются позже, чем этот скрипт в <head>. */
    w.Webflow = w.Webflow || [];
    w.Webflow.push(installLeadTracking);
  }

  function allowed() {
    if (!RESPECT_CONSENT) return true;
    return !!(w.FuturaConsent && w.FuturaConsent.analyticsAllowed());
  }

  if (allowed()) {
    start();
  } else {
    d.addEventListener("futura:consent", function once(event) {
      if (!event || !event.detail || !event.detail.analytics) return;
      d.removeEventListener("futura:consent", once);
      start();
    });
  }
})(window, document);

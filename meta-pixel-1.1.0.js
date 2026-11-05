/**
 * meta-pixel.js 1.1.0 — Meta Pixel включён по умолчанию.
 *
 * Зачем. В коде головы сайта живёт контроллер FuturaMeta: он поднимает пиксель
 * 1249807613110031 только после того, как посетитель отметит «Реклама Meta»
 * в баннере согласия. Решение Алисы 05.11.2026: пиксель должен считать сразу,
 * без клика, иначе 4dev не увидят конверсии своей перформанс-рекламы.
 *
 * Этот файл — дублёр. Он поднимает пиксель сам, когда согласия ещё нет,
 * и не трогает ничего, когда пикселем уже управляет FuturaMeta. То есть
 * получается «включено по умолчанию, выключается по требованию»:
 *
 *   нет сохранённого выбора      → пиксель работает (владелец — этот файл)
 *   выбор сохранён, Meta разрешён → пиксель работает (владелец — FuturaMeta)
 *   выбор сохранён, Meta снят     → пиксель не работает
 *
 * ⚠️ Это опт-аут, а не опт-ин: до выбора посетителя события уже уходят.
 * Флажок в баннере при этом не врёт — он действительно выключает пиксель,
 * в том числе на уже открытой странице.
 *
 * Два владельца никогда не работают одновременно: FuturaMeta при старте
 * проверяет, не занят ли window.fbq, и молча уступает, а этот файл проверяет
 * FuturaMeta.status().loaded и уступает в ответ. Поэтому PageView и Lead
 * уходят ровно по одному разу.
 *
 * Lead ловится так же, как в соседнем хуке футера: по ответу нативной формы
 * Webflow, response.code === 200. Ни submit, ни HTTP 200, ни блок «Спасибо»
 * успехом не являются — при ошибке Webflow тоже отвечает двухсоткой.
 */
(function (w, d) {
  "use strict";
  if (w.__futuraMetaFallback) return;
  w.__futuraMetaFallback = true;

  var ID = "1249807613110031";
  var SITE_ID = "69b915fc76acca0d89cbd22b";
  var FORM_NAME = "Event Sign Up Form";

  var owned = null, active = false, pageView = false, leadInstalled = false;

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

  function takeOver() {
    if (active || declined() || metaOwns()) return false;
    /* Чужой fbq — чей-то ещё пиксель; второй раз инициализировать нельзя. */
    if (w.fbq) return false;

    var f = (w.fbq = function () {
      f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments);
    });
    owned = f;
    if (!w._fbq) w._fbq = f;
    f.push = f;
    f.loaded = true;
    f.version = "2.0";
    f.queue = [];
    f("set", "autoConfig", false, ID);
    f("init", ID);

    var s = d.createElement("script");
    s.id = "futura-meta-pixel-fallback";
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    d.head.appendChild(s);

    active = true;
    if (!pageView) {
      f("trackSingle", ID, "PageView");
      pageView = true;
    }
    installLead();
    return true;
  }

  function revoke() {
    if (!active || !owned || w.fbq !== owned) {
      active = false;
      return;
    }
    /* Снятый флажок не должен оставить очередь событий, которая уйдёт позже. */
    if (Array.isArray(owned.queue)) {
      owned.queue = owned.queue.filter(function (args) {
        return String(args[0]).indexOf("track") !== 0;
      });
    }
    owned("consent", "revoke");
    active = false;
  }

  function track(event, params) {
    if (!active || !owned || w.fbq !== owned) return;
    try {
      owned("trackSingle", ID, event, params);
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
          /* Владелец мог смениться или согласие — быть отозвано за это время. */
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
    if (declined() || metaOwns()) revoke();
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
    version: "1.1.0",
    status: function () {
      return { pixelId: ID, active: active, declined: declined(), metaOwns: metaOwns() };
    }
  };
})(window, document);

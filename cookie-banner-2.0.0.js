/* Futura cookie banner 2.0.0 — компактная замена баннера из кода головы сайта.
 *
 * Движок согласия (window.FuturaConsent) остаётся прежним: он живёт в Site settings →
 * Custom code → Head и управляет GA4, Метрикой, Clarity и Meta Pixel. Этот файл меняет
 * только то, что видит посетитель:
 *
 *   было  — сразу развёрнутая панель: заголовок, абзац, два чекбокса с описаниями,
 *           четыре ссылки, три кнопки; плюс вечная кнопка в левом нижнем углу;
 *   стало — одна строка и две кнопки; подробности и галочки — по ссылке «Настроить»;
 *           вернуться к выбору можно ссылкой в подвале.
 *
 * Старую панель не удаляем, а прячем стилями — и только после того, как своя собралась.
 * Не загрузился этот файл (CDN, блокировщик) — посетитель видит старый баннер и может
 * распорядиться своими куки, как раньше.
 */
(function (w, d) {
  'use strict';

  if (w.FuturaCookieBanner) return;

  var api = null;
  var mounted = false;
  var bar = null;      // компактная строка
  var panel = null;    // развёрнутые настройки
  var analyticsBox = null;
  var adsBox = null;
  var statusLine = null;
  var footerLink = null;
  var lastFocus = null;

  var ru = /^\/ru(\/|$)/.test(d.location.pathname);

  var T = ru ? {
    bar: 'Мы используем cookie — для работы сайта, аналитики и рекламы.',
    accept: 'Принять',
    necessary: 'Только необходимые',
    customise: 'Настроить',
    panelTitle: 'Настройки cookie',
    necessaryTitle: 'Необходимые',
    necessaryNote: 'всегда включены',
    necessaryText: 'Нужны, чтобы сайт работал: формы, выбор языка, безопасность.',
    analyticsTitle: 'Аналитика',
    analyticsText: 'Google Analytics, Яндекс Метрика и Microsoft Clarity — сколько людей приходит и что читают. Метрика и Clarity записывают движения мыши, прокрутку и нажатия. Рекламные функции Google отключены.',
    adsTitle: 'Реклама',
    adsText: 'Meta Pixel — измеряет отдачу рекламных кампаний. Пикселем управляет наш рекламный партнёр.',
    save: 'Сохранить',
    allowAll: 'Разрешить всё',
    close: 'Закрыть',
    policy: 'Политика конфиденциальности',
    policyHref: '/ru/privacy-policy',
    footer: 'Настройки cookie',
    failed: 'Не удалось сохранить выбор. Дополнительное отслеживание на этой странице отключено.'
  } : {
    bar: 'We use cookies to run the site, measure traffic and advertise.',
    accept: 'Accept',
    necessary: 'Necessary only',
    customise: 'Settings',
    panelTitle: 'Cookie settings',
    necessaryTitle: 'Necessary',
    necessaryNote: 'always on',
    necessaryText: 'Needed for the site to work: forms, language choice, security.',
    analyticsTitle: 'Analytics',
    analyticsText: 'Google Analytics, Yandex Metrica and Microsoft Clarity — how many people come and what they read. Metrica and Clarity record mouse movement, scrolling and clicks. Google advertising features are off.',
    adsTitle: 'Advertising',
    adsText: 'Meta Pixel — measures how our advertising performs. The pixel is operated by our advertising partner.',
    save: 'Save',
    allowAll: 'Allow all',
    close: 'Close',
    policy: 'Privacy policy',
    policyHref: '/privacy-policy',
    footer: 'Cookie settings',
    failed: 'Your choice could not be saved. Optional tracking is off on this page.'
  };

  var PARTNERS = [
    ['Google', 'https://business.safety.google/privacy/'],
    [ru ? 'Яндекс' : 'Yandex', 'https://yandex.com/legal/confidential/'],
    ['Microsoft', 'https://privacy.microsoft.com/privacystatement'],
    ['Meta', 'https://www.facebook.com/privacy/policy/']
  ];

  /* Палитра, шрифты и анатомия кнопок — те же, что у старого баннера и у сайта. */
  var CSS = [
    '#fd-cookie,#fd-cookie-panel{position:fixed;z-index:2147483000;box-sizing:border-box;',
    'background:#F9F9F9;color:#151515;border:1px solid #C2C2C2;border-radius:6px;',
    'font-family:"FD Body Local",sans-serif;letter-spacing:-.02em}',
    '#fd-cookie *,#fd-cookie-panel *{box-sizing:border-box}',
    '#fd-cookie[hidden],#fd-cookie-panel[hidden]{display:none!important}',

    /* компактная строка */
    '#fd-cookie{left:20px;right:20px;bottom:20px;max-width:620px;padding:14px 16px;',
    'display:flex;align-items:center;flex-wrap:wrap;gap:12px;font-size:14px;line-height:1.4}',
    '#fd-cookie .fd-text{flex:1 1 240px;min-width:0;margin:0}',
    '#fd-cookie .fd-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}',

    /* развёрнутые настройки */
    '#fd-cookie-panel{left:20px;right:20px;bottom:20px;max-width:620px;padding:20px;',
    'max-height:calc(100dvh - 40px);overflow:auto;font-size:14px;line-height:1.45}',
    /* Панель получает фокус при открытии — рамка вокруг всего окна ни к чему. */
    '#fd-cookie-panel:focus{outline:none}',
    '#fd-cookie-panel h2{font-family:"FD Headings Local",sans-serif;font-size:20px;font-weight:500;',
    'line-height:1.15;letter-spacing:-.04em;margin:0 0 14px}',
    '#fd-cookie-panel .fd-row{display:flex;align-items:flex-start;gap:10px;padding:9px 0;',
    'border-top:1px solid #E4E4E4;margin:0}',
    '#fd-cookie-panel .fd-row:first-of-type{border-top:0}',
    '#fd-cookie-panel .fd-row input{appearance:auto;-webkit-appearance:checkbox;flex:0 0 auto;',
    'width:18px;height:18px;margin:2px 0 0;accent-color:#151515}',
    '#fd-cookie-panel .fd-row .fd-fixed{flex:0 0 18px;height:18px;margin:2px 0 0}',
    '#fd-cookie-panel .fd-row span{min-width:0}',
    '#fd-cookie-panel .fd-row strong{display:block;font-size:15px;font-weight:500}',
    '#fd-cookie-panel .fd-note{font-weight:400;color:#6B6B6B}',
    '#fd-cookie-panel .fd-links{margin:14px 0 0;font-size:13px}',
    '#fd-cookie-panel .fd-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '#fd-cookie-panel .fd-status{margin:10px 0 0;font-size:13px}',

    /* кнопки и ссылки */
    '#fd-cookie .fd-btn,#fd-cookie-panel .fd-btn{min-height:40px;border:1px solid #151515;',
    'border-radius:6px;background:#F9F9F9;color:#151515;font-family:"FD Labels Local",monospace;',
    'font-size:13px;font-weight:400;line-height:1.2;text-transform:uppercase;letter-spacing:0;',
    'padding:10px 14px;cursor:pointer;white-space:nowrap}',
    '#fd-cookie .fd-btn:hover,#fd-cookie-panel .fd-btn:hover{background:#FFFF00}',
    '#fd-cookie .fd-btn:focus-visible,#fd-cookie-panel .fd-btn:focus-visible,',
    '#fd-cookie .fd-more:focus-visible,#fd-cookie-panel a:focus-visible{outline:2px solid #151515;outline-offset:3px}',
    '#fd-cookie .fd-more{background:none;border:0;padding:6px 2px;cursor:pointer;color:#151515;',
    'font-family:inherit;font-size:14px;text-decoration:underline;text-underline-offset:3px}',
    '#fd-cookie a,#fd-cookie-panel a{color:#151515;text-decoration:underline;text-underline-offset:3px}',

    /* телефон */
    '@media(max-width:559px){',
    '#fd-cookie,#fd-cookie-panel{left:12px;right:12px;bottom:12px}',
    '#fd-cookie{padding:14px}',
    '#fd-cookie .fd-text{flex:1 1 100%}',
    '#fd-cookie .fd-actions{width:100%;align-items:stretch}',
    '#fd-cookie .fd-btn{flex:1 1 0;white-space:normal}',
    '#fd-cookie-panel{padding:16px;max-height:calc(100dvh - 24px)}',
    '#fd-cookie-panel .fd-btn{width:100%}}',

    /* старая панель из кода головы сайта — прячем, когда своя уже собралась */
    '#futura-consent,#futura-cookie-settings{display:none!important}'
  ].join('');

  function el(tag, cls, text) {
    var node = d.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, cls, handler) {
    var b = el('button', cls, label);
    b.type = 'button';
    b.addEventListener('click', handler);
    return b;
  }

  function linkList(parent) {
    var p = el('p', 'fd-links');
    var policy = el('a', null, T.policy);
    policy.href = T.policyHref;
    p.appendChild(policy);
    PARTNERS.forEach(function (pair) {
      p.appendChild(d.createTextNode(' · '));
      var a = el('a', null, pair[0]);
      a.href = pair[1];
      a.rel = 'noopener';
      a.target = '_blank';
      p.appendChild(a);
    });
    parent.appendChild(p);
  }

  function row(parent, title, note, text, checked) {
    var label = el('label', 'fd-row');
    var input = null;
    if (checked === null) {
      label.appendChild(el('span', 'fd-fixed'));
    } else {
      input = d.createElement('input');
      input.type = 'checkbox';
      input.checked = checked;
      label.appendChild(input);
    }
    var words = el('span');
    var strong = el('strong', null, title);
    if (note) {
      var small = el('span', 'fd-note', ' — ' + note);
      strong.appendChild(small);
    }
    words.appendChild(strong);
    words.appendChild(d.createTextNode(text));
    label.appendChild(words);
    parent.appendChild(label);
    return input;
  }

  /* Сохранение выбора. Движок сам решает, что включить и что погасить. */
  function choose(analytics, advertising) {
    var saved = false;
    try {
      saved = api.setPreferences(analytics, advertising);
    } catch (e) {
      saved = false;
    }
    if (saved) {
      closePanel(true);
      if (bar) bar.hidden = true;
      return true;
    }
    // Хранилище недоступно: выбор не запомнить, о чём и говорим вслух.
    if (analyticsBox) analyticsBox.checked = false;
    if (adsBox) adsBox.checked = false;
    if (statusLine) statusLine.textContent = T.failed;
    if (panel && panel.hidden && bar) bar.hidden = true;
    return false;
  }

  function openPanel() {
    if (!panel) return;
    lastFocus = d.activeElement;
    analyticsBox.checked = api.analyticsAllowed();
    adsBox.checked = api.advertisingAllowed();
    statusLine.textContent = '';
    if (bar) bar.hidden = true;
    panel.hidden = false;
    panel.focus();
  }

  function closePanel(chosen) {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    if (bar && !chosen && !api.hasChoice()) bar.hidden = false;
    var back = lastFocus && lastFocus.isConnected ? lastFocus : footerLink;
    if (back && back.focus) back.focus();
  }

  function buildBar() {
    var box = el('section', null);
    box.id = 'fd-cookie';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', T.panelTitle);
    box.appendChild(el('p', 'fd-text', T.bar));

    var actions = el('div', 'fd-actions');
    actions.appendChild(button(T.accept, 'fd-btn', function () { choose(true, true); }));
    actions.appendChild(button(T.necessary, 'fd-btn', function () { choose(false, false); }));
    actions.appendChild(button(T.customise, 'fd-more', openPanel));
    box.appendChild(actions);
    return box;
  }

  function buildPanel() {
    var box = el('section', null);
    box.id = 'fd-cookie-panel';
    box.hidden = true;
    box.tabIndex = -1;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'false');
    box.setAttribute('aria-label', T.panelTitle);
    box.appendChild(el('h2', null, T.panelTitle));

    row(box, T.necessaryTitle, T.necessaryNote, T.necessaryText, null);
    analyticsBox = row(box, T.analyticsTitle, '', T.analyticsText, false);
    adsBox = row(box, T.adsTitle, '', T.adsText, false);
    linkList(box);

    var buttons = el('div', 'fd-buttons');
    buttons.appendChild(button(T.save, 'fd-btn', function () {
      choose(analyticsBox.checked, adsBox.checked);
    }));
    buttons.appendChild(button(T.necessary, 'fd-btn', function () { choose(false, false); }));
    buttons.appendChild(button(T.allowAll, 'fd-btn', function () { choose(true, true); }));
    box.appendChild(buttons);

    statusLine = el('p', 'fd-status');
    statusLine.setAttribute('role', 'status');
    box.appendChild(statusLine);

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel(false);
    });
    return box;
  }

  /* Ссылка в подвале вместо вечной кнопки в углу экрана. */
  function addFooterLink() {
    var anchor = d.querySelector('footer a.pp-link') || d.querySelector('a.pp-link');
    var host = anchor && anchor.parentNode ? anchor.parentNode : d.querySelector('footer');
    if (!host) return null;

    var link = el('a', null, T.footer);
    link.href = '#';
    link.id = 'fd-cookie-link';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openPanel();
    });

    if (anchor && anchor.parentNode === host) {
      // Повторяем обёртку соседней ссылки, чтобы попасть в сетку подвала.
      var inner = anchor.querySelector('div');
      link.className = anchor.className.replace(/\bw--current\b/g, '').trim();
      var wrap = el('div', inner ? inner.className : 'text-size-xs', T.footer);
      link.textContent = '';
      link.appendChild(wrap);
      host.insertBefore(link, anchor.nextSibling);
    } else {
      host.appendChild(link);
    }
    return link;
  }

  function mount() {
    if (mounted) return true;
    api = w.FuturaConsent;
    // Без движка согласия баннер показывать нельзя: выбор будет некуда записать.
    if (!api || typeof api.setPreferences !== 'function' || !d.body) return false;

    bar = buildBar();
    panel = buildPanel();
    bar.hidden = api.hasChoice();

    var style = el('style');
    style.id = 'fd-cookie-style';
    style.textContent = CSS;
    d.head.appendChild(style);

    d.body.appendChild(bar);
    d.body.appendChild(panel);
    footerLink = addFooterLink();

    d.addEventListener('futura:consent-open', openPanel);
    mounted = true;
    return true;
  }

  function ready() {
    if (mount()) return;
    // Движок и <body> появляются в разном порядке — ждём обоих, но не вечно.
    var tries = 0;
    var timer = w.setInterval(function () {
      if (mount() || ++tries > 60) w.clearInterval(timer);
    }, 100);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();

  w.FuturaCookieBanner = {
    version: '2.0.0',
    open: openPanel,
    close: function () { closePanel(false); },
    mounted: function () { return mounted; }
  };
})(window, document);

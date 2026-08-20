/* =====================================================================
   futura.inc — сборщик блоков лендинга на страницах услуг
   Версия 4, 20.08.2026

   Подключается в Webflow: Services Template -> Before </body> tag,
   одной строкой <script src="...">. Стили вставляет сам.

   Что делает: превращает три текстовых поля CMS в блоки лендинга —
   цифры-факты, карточки ситуаций, «что вы получаете», FAQ-аккордеон,
   мид-CTA, кнопка на мобильном. Плюс разворачивает страницу во всю
   ширину и оформляет таблицы.

   Версия 4: блоки «Цифры-факты» и FAQ переезжают в коллекции-спутники и
   верстаются в Designer. Скрипт их больше не рисует (после переноса разметки
   в коллекции в тексте их просто нет), но берёт на себя три вещи, которых
   в стилях сайта нет: оформление списков, иконку аккордеона на десктопе
   и скрытие секций с пустой коллекцией.

   Каждый блок собирается только если для него есть текст, и обёрнут
   в свою страховку: сбой одного блока не ломает страницу и остальные блоки.

   Документация: в банке Futura,
   «Сайт и продуктовые страницы/Вёрстка — сборщик блоков лендинга.md»
   ===================================================================== */
(function () {
  'use strict';

  // ------------------------------------------------------------- стили
  var CSS = `
/* ---------- 1. ВО ВСЮ ШИРИНУ ----------
   Боковая колонка «содержание» — position:absolute, ширина 49%, высота 100%:
   она занимала левую половину страницы на всю её высоту, а контент жил в правой.
   Гена просил убрать пустоту слева. Прячем колонку вместе с плавающей кнопкой
   и распускаем сетку. */
.s-aside-wrap { display: none !important; }
.s-content .s__grid { display: block !important; }

/* строка текста во всю ширину нечитаема — держим комфортную длину */
.services-inner__block-content { max-width: 60rem; overflow: visible; }

/* ---------- 2. Герой: описание было прижато к заголовку ---------- */
@media (min-width: 992px) {
  .s-hero__grid { grid-column-gap: 4.5rem; }
}

/* ---------- 3. Отступы и номера у подзаголовков ----------
   Было: первый h3 получал margin-top:0 в расчёте на блок, который начинается
   с подзаголовка. У нас перед ним вводный абзац — заголовок приклеивался. */
.services-inner__block-content h3:first-of-type { margin-top: 2rem; }
.services-inner__block-content > :first-child { margin-top: 0 !important; }
.services-inner__block-content h3::before { top: .35rem; }
@media (max-width: 479px) { .services-inner__block-content h3::before { top: .25rem; } }

/* ---------- 4. Таблицы: настоящие, вместо картинок ---------- */
.s-table-scroll { overflow-x: auto; margin: 2rem 0; -webkit-overflow-scrolling: touch; }
.services-inner__block-content table,
.s-built table {
  width: 100%; min-width: 30rem; border-collapse: collapse; margin: 0;
  font-size: var(--_typography---font-size--text, 1rem);
}
.services-inner__block-content th, .services-inner__block-content td,
.s-built th, .s-built td {
  text-align: left; vertical-align: top; padding: .75rem 1rem;
  border-bottom: 1px solid var(--_colors---base--black-15);
  line-height: var(--_typography---line-height--body-regular, 140%);
}
.services-inner__block-content thead th, .s-built thead th {
  border-bottom: 2px solid var(--_colors---base--brand-primary);
  font-weight: 600; white-space: nowrap;
}
.services-inner__block-content tbody tr:nth-child(odd),
.s-built tbody tr:nth-child(odd) { background: var(--_colors---background--secondary); }

/* картинки, которые ещё остались на других страницах: во всю колонку и по клику */
.services-inner__block-content .s-table-img { display: block; margin: 2rem 0; cursor: zoom-in; }
.services-inner__block-content .s-table-img img {
  width: 100%; height: auto; display: block;
  border: 1px solid var(--_colors---base--black-15); border-radius: .5rem;
}
.services-inner__block-content .s-table-img + p { margin-top: 0; }

/* ---------- 5. Секции, которые собирает скрипт ---------- */
.s-built {
  padding-top: var(--_spacing---section-padding--80, 4rem);
  padding-bottom: var(--_spacing---section-padding--40, 2rem);
}
.s-built__head { margin-bottom: var(--_spacing---global-gap--medium, 1.5rem); }
.s-built .jur-why__list-wrap { margin-bottom: 0; }

/* номера карточек: на Кипре их рисует счётчик из кода страницы юрисдикций */
.s-built .jur-why__list { counter-reset: why-counter; }
.s-built .jur-why__item { counter-increment: why-counter; position: relative; }
.s-built .jur-why__item-number p::after { content: counter(why-counter); }

/* ---------- 6. Мид-CTA ---------- */
.s-midcta__inner {
  background: var(--_colors---background--secondary); border-radius: .5rem;
  padding: 2rem; margin: 2.5rem 0;
  display: flex; flex-flow: column; gap: 1.25rem; align-items: flex-start;
}
.s-midcta__text { display: flex; flex-flow: column; gap: .5rem; }
@media (min-width: 992px) {
  .s-midcta__inner { flex-flow: row; align-items: center; justify-content: space-between; gap: 2rem; }
  .s-midcta__text { max-width: 34rem; }
}

/* ---------- 7. FAQ: раскрывашки ----------
   Webflow выводит список абсолютом — для аккордеона делаем поток.
   Иконки переключаем сами: правило сайта, которое прячет «минус», живёт
   только внутри @media (max-width: 991px), на десктопе его нет. */
.s-built .faqs__dropdown-content.w-dropdown-list {
  position: relative; background: transparent;
  padding: 0 var(--_spacing---global-gap--medium, 1.5rem) var(--_spacing---global-gap--medium, 1.5rem);
}
.s-built .faqs__dropdown-toggle { cursor: pointer; }
.s-built .faqs__dropdown .material-symbols-outlined.is-open  { display: block !important; }
.s-built .faqs__dropdown .material-symbols-outlined.is-close { display: none  !important; }
.s-built .faqs__dropdown.w--open .material-symbols-outlined.is-open  { display: none  !important; }
.s-built .faqs__dropdown.w--open .material-symbols-outlined.is-close { display: block !important; }
.s-built .faqs__list { display: flex; flex-flow: column; gap: .5rem; }
.s-built .faqs__dropdown-toggle-text, .s-built .faq__rich-text { max-width: 60rem; }

/* ---------- 8. Кнопка на мобильном ----------
   Плавающей кнопки больше нет, поэтому на телефоне это единственная
   постоянная точка конверсии между героем и футером. */
.s-mobile-cta { display: none; }
@media (max-width: 767px) {
  .s-mobile-cta {
    display: block; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
    padding: .75rem var(--_spacing---padding-global, 1rem);
    background: var(--_colors---background--primary, #fff);
    box-shadow: 0 -.5rem 1.5rem rgba(0,0,0,.12);
  }
  .s-mobile-cta .button { width: 100%; justify-content: center; }
  body { padding-bottom: 4.5rem; }
}

/* ---------- 8. Списки в текстовых блоках. Вернулось из патча 10.08 ----------
   Патч жил в шаблоне и удалился вместе с версией 2 кода. В стилях сайта у списков
   только overflow:hidden, который обрезает маркеры, — поэтому все буллеты,
   которые пишет машина, выглядели сломанными. Держим правила здесь, чтобы
   их больше нельзя было потерять при чистке кода в Webflow. */
.services-inner__block-content ul,
.services-inner__block-content ol {
  overflow: visible;
  margin: .75rem 0 1.25rem;
  padding-left: 1.1rem;
  display: block;
}
.services-inner__block-content li {
  position: relative;
  list-style: none;
  padding-left: .9rem;
  margin-bottom: .55rem;
  line-height: var(--_typography---line-height--body-large, 140%);
}
.services-inner__block-content li:last-child { margin-bottom: 0; }
.services-inner__block-content li::before {
  content: '';
  position: absolute;
  left: 0;
  top: .55em;
  width: .4rem;
  height: .4rem;
  background: var(--_colors---base--brand-primary);
}
.services-inner__block-content li li::before { background: var(--_colors---text--secondary); }
.services-inner__block-content ol li { list-style: decimal; padding-left: .25rem; }
.services-inner__block-content ol li::before { content: none; }

/* ---------- 9. Иконка аккордеона на десктопе ----------
   У шаблона юрисдикций это правило лежит отдельным html-embed на странице.
   Без него у секции FAQ видно сразу «+» и «−»: правило сайта, которое прячет
   лишнюю иконку, живёт только внутри @media (max-width: 991px). */
.faqs__dropdown-toggle .faqs__dropdown-toggle-icon .is-close,
.faqs__dropdown-toggle.w--open .faqs__dropdown-toggle-icon .is-open { display: none; }
.faqs__dropdown-toggle.w--open .faqs__dropdown-toggle-icon .is-close { display: block; }
`;

  function injectCSS() {
    if (document.getElementById('s-landing-css')) return;
    var st = document.createElement('style');
    st.id = 's-landing-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  // ------------------------------------------------------------- сборка
  function build() {
    var b1sec = document.querySelector('.s-problem');
    var b2sec = document.querySelector('.s-solution');
    if (!b1sec && !b2sec) return;                            // не страница услуги
    if (document.querySelector('.s-built')) return;           // уже собрано

    var LANG = (document.documentElement.lang || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
    var T = { ru: { results: 'Что вы получаете' }, en: { results: 'What you get' } }[LANG];
    var FAQ_HEAD = 'FAQ';

    // Офферы под мид-CTA и кнопки. Ключ — конец адреса страницы.
    // Для страниц, которых здесь нет, мид-CTA не появляется — так задумано,
    // чтобы на 76 страницах не встал оффер про ликвидацию.
    var OFFERS = {
      'liquidation-cyprus': {
        ru: { title: 'Не уверены, что подходит — ликвидация или вычёркивание из реестра?',
              text: 'Посмотрим состояние компании и пришлём список документов со сметой.',
              btn: 'Получить список документов и смету' },
        en: { title: 'Not sure whether it is a liquidation or a strike-off?',
              text: 'We review the company and send the document list with a quote.',
              btn: 'Get the document list and a quote' }
      }
    };
    var slug = location.pathname.replace(/\/+$/, '').split('/').pop();
    var offer = (OFFERS[slug] || {})[LANG] || null;

    var FORM_HREF = '#wf-form-Discuss-the-Task-Form';
    var BTN_CLASS = 'button w-variant-1b7e3f2c-b36a-3f03-560c-40dd15c0058c w-inline-block';

    function el(tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    }

    function button(text) {
      var a = el('a', BTN_CLASS);
      a.setAttribute('href', FORM_HREF);
      a.setAttribute('data-wf--button--variant', 'yellow');
      a.appendChild(el('div', 'button-text', text));
      return a;
    }

    function section(extraCls, headingText) {
      var s = el('section', 'section s-built ' + extraCls);
      var pad = el('div', 'padding-global');
      var box = el('div', 'w-layout-blockcontainer container-full w-container');
      if (headingText) {
        var h = el('div', 's-built__head');
        h.appendChild(el('h2', 'heading-style-h3', headingText));
        box.appendChild(h);
      }
      pad.appendChild(box); s.appendChild(pad);
      s._host = box;
      return s;
    }

    function richText(sec) { return sec ? sec.querySelector('.services-inner__block-content') : null; }

    function groups(container) {
      var out = [], cur = null;
      Array.prototype.forEach.call(container.children, function (n) {
        if (n.tagName === 'H3') { cur = { head: n, title: n.textContent.trim(), body: [] }; out.push(cur); }
        else if (cur) { cur.body.push(n); }
      });
      return out;
    }

    function safe(name, fn) {
      try { fn(); } catch (e) { if (window.console) console.warn('[лендинг] блок «' + name + '» не собрался:', e); }
    }

    function card(title, bodyNodes, titleCls) {
      var it = el('div', 'jur-why__item');
      it.setAttribute('role', 'listitem');
      it.appendChild(el('h3', titleCls, String(title).replace(/\s*\.\s*$/, '')));
      (bodyNodes || []).forEach(function (n) {
        if (n.tagName === 'P' && n.textContent.trim()) {
          it.appendChild(el('p', 'text-size-regular line-height-140', n.innerHTML));
        }
      });
      var num = el('div', 'jur-why__item-number');
      num.appendChild(el('p', 'text-style-label', '0'));
      it.appendChild(num);
      return it;
    }

    function cardList() {
      var wrap = el('div', 'jur-why__list-wrap');
      var list = el('div', 'jur-why__list');
      list.setAttribute('role', 'list');
      wrap.appendChild(list);
      wrap._list = list;
      return wrap;
    }

    var rt1 = richText(b1sec), rt2 = richText(b2sec);

    // ---------------------------------------- 1. Цифры-факты под героем
    safe('цифры-факты', function () {
      if (!rt1) return;
      var p = null;
      for (var i = 0; i < rt1.children.length; i++) {
        var n = rt1.children[i];
        if (n.tagName === 'P') { if (n.textContent.indexOf(' · ') > -1) p = n; break; }
        if (n.tagName === 'H3') break;
      }
      if (!p) return;
      var items = p.textContent.split('·').map(function (s) { return s.trim(); }).filter(Boolean);
      if (items.length < 2) return;

      var sec = section('is-s-facts', null);
      var wrap = el('div', 'jur-top__list-wrap');
      var list = el('div', 'jur-top__list');
      list.setAttribute('role', 'list');
      items.forEach(function (raw) {
        var parts = raw.split(/\s+[—–]\s+/);
        var label = parts.length > 1 ? parts[0] : '';
        var value = parts.length > 1 ? parts.slice(1).join(' — ') : raw;
        var it = el('div', 'jur-top__item');
        it.setAttribute('role', 'listitem');
        if (label) it.appendChild(el('p', 'text-style-label text-color-secondary', label));
        it.appendChild(el('p', 'heading-style-h4', value));
        list.appendChild(it);
      });
      wrap.appendChild(list); sec._host.appendChild(wrap);

      var content = document.querySelector('.s-content');
      if (content && content.parentNode) content.parentNode.insertBefore(sec, content);
      p.parentNode.removeChild(p);
    });

    // ------------- 2. Карточки «когда нужна» + 3. «что вы получаете»
    safe('карточки', function () {
      if (!rt1) return;
      var gs = groups(rt1);
      if (!gs.length) return;

      var resultsGroup = null, cards = [];
      gs.forEach(function (g) {
        if (g.title.toLowerCase() === T.results.toLowerCase()) resultsGroup = g;
        else cards.push(g);
      });

      var headText = ((b1sec.querySelector('.services-inner__block-heading h2') || {}).textContent || '').trim();
      var anchor = b1sec.querySelector('.section-scroll-anchor');

      if (cards.length) {
        var sec = section('is-s-cards', headText);
        if (anchor) sec.insertBefore(anchor, sec.firstChild);
        var lw = cardList();
        cards.forEach(function (g) { lw._list.appendChild(card(g.title, g.body, 'heading-style-h4 line-height-94')); });
        sec._host.appendChild(lw);
        b1sec.parentNode.insertBefore(sec, b1sec);
        b1sec.parentNode.removeChild(b1sec);
        b1sec = sec;
      }

      if (resultsGroup) {
        var rsec = section('is-s-results', T.results);
        var rlw = cardList();
        resultsGroup.body.forEach(function (n) {
          if (n.tagName !== 'UL' && n.tagName !== 'OL') return;
          Array.prototype.forEach.call(n.children, function (li) {
            rlw._list.appendChild(card(li.innerHTML, null, 'text-size-large'));
          });
        });
        if (rlw._list.children.length) {
          rsec._host.appendChild(rlw);
          b1sec.parentNode.insertBefore(rsec, b1sec.nextSibling);
        }
      }
    });

    // ------------------- 4. Таблицы и картинки в текстовых блоках
    safe('таблицы и картинки', function () {
      [rt1, rt2].forEach(function (rt) {
        if (!rt) return;

        Array.prototype.forEach.call(rt.querySelectorAll('table'), function (tb) {
          if (tb.parentNode && tb.parentNode.classList.contains('s-table-scroll')) return;
          var box = el('div', 's-table-scroll');
          tb.parentNode.insertBefore(box, tb);
          box.appendChild(tb);
        });

        Array.prototype.forEach.call(rt.querySelectorAll('img'), function (img) {
          if (img.closest('.s-table-img')) return;
          var src = img.getAttribute('src');
          if (!src) return;
          var a = el('a', 's-table-img');
          a.setAttribute('href', src);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
          a.setAttribute('title', img.getAttribute('alt') || '');
          var host = (img.parentNode && img.parentNode.tagName === 'P' && img.parentNode.children.length === 1)
                     ? img.parentNode : img;
          host.parentNode.insertBefore(a, host);
          a.appendChild(img);
          if (host !== img && host.parentNode) host.parentNode.removeChild(host);
        });
      });
    });

    // ------------------------------------------- 5. FAQ-аккордеон
    safe('FAQ', function () {
      if (!rt2) return;
      var faq = null;
      groups(rt2).forEach(function (g) { if (g.title.trim().toUpperCase() === FAQ_HEAD) faq = g; });
      if (!faq) return;

      var pairs = [], cur = null;
      faq.body.forEach(function (n) {
        if (n.tagName === 'H4') { cur = { q: n.textContent.trim(), a: [] }; pairs.push(cur); }
        else if (cur) { cur.a.push(n.outerHTML); }
      });
      if (!pairs.length) return;

      var sec = section('is-s-faq', FAQ_HEAD);
      var wrap = el('div', 'faqs__list-wrap');
      var list = el('div', 'faqs__list');
      list.setAttribute('role', 'list');

      pairs.forEach(function (p) {
        var item = el('div', 'faqs__item');
        item.setAttribute('role', 'listitem');
        var dd = el('div', 'faqs__dropdown w-dropdown');
        var toggle = el('div', 'faqs__dropdown-toggle w-dropdown-toggle');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('tabindex', '0');
        toggle.setAttribute('aria-expanded', 'false');
        var tt = el('div', 'faqs__dropdown-toggle-text');
        tt.appendChild(el('div', 'text-size-large', p.q));
        var ic = el('div', 'faqs__dropdown-toggle-icon');
        ic.appendChild(el('div', 'material-symbols-outlined is-open is-large', 'add'));
        ic.appendChild(el('div', 'material-symbols-outlined is-close is-large', 'remove'));
        toggle.appendChild(tt); toggle.appendChild(ic);

        var nav = el('nav', 'faqs__dropdown-content w-dropdown-list');
        nav.appendChild(el('div', 'faq__rich-text w-richtext', p.a.join('')));

        function flip() {
          var open = dd.classList.toggle('w--open');
          nav.classList.toggle('w--open', open);
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        toggle.addEventListener('click', flip);
        toggle.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
        });

        dd.appendChild(toggle); dd.appendChild(nav);
        item.appendChild(dd); list.appendChild(item);
      });

      wrap.appendChild(list); sec._host.appendChild(wrap);

      var before = document.querySelector('.s-related') || document.querySelector('.is-services-form-section');
      if (before && before.parentNode) before.parentNode.insertBefore(sec, before);

      if (faq.head && faq.head.parentNode) faq.head.parentNode.removeChild(faq.head);
      faq.body.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    });

    // ------------------------------------ 6. Мид-CTA после этапов
    safe('мид-CTA', function () {
      if (!offer) return;
      var stages = document.querySelector('.s-stages');
      if (!stages) return;
      var sec = section('is-s-midcta', null);
      var inner = el('div', 's-midcta__inner');
      var txt = el('div', 's-midcta__text');
      txt.appendChild(el('p', 'heading-style-h4', offer.title));
      txt.appendChild(el('p', 'text-size-regular text-color-secondary', offer.text));
      inner.appendChild(txt);
      inner.appendChild(button(offer.btn));
      sec._host.appendChild(inner);
      stages.parentNode.insertBefore(sec, stages.nextSibling);
    });

    // --------------------- 7. Кнопка на мобильном + текст кнопок
    safe('кнопка на мобильном', function () {
      if (!offer) return;
      var bar = el('div', 's-mobile-cta');
      bar.appendChild(button(offer.btn));
      document.body.appendChild(bar);

      var hero = document.querySelector('.s-hero .button-group .button .button-text');
      if (hero) hero.textContent = offer.btn;
    });
  }

  // --------------------------------------------- пустые секции коллекций
  // Блоки «Цифры-факты» и FAQ выводятся из коллекций-спутников. Пока у услуги
  // нет записей, Webflow рисует пустую секцию с заголовком и надписью
  // «No items found» — на 71 странице услуг это выглядело бы как брак.
  // Так же, как уже сделан блок кейсов: нет данных — нет секции.
  function hideEmptySections() {
    var empties = document.querySelectorAll('.w-dyn-empty');
    for (var i = 0; i < empties.length; i++) {
      var sec = empties[i].closest('section');
      if (!sec || sec.querySelector('.w-dyn-item')) continue;
      if (sec.querySelector('form')) continue;              // форму не трогаем
      sec.style.display = 'none';
    }
  }

  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { build(); hideEmptySections(); });
  } else {
    build();
    hideEmptySections();
  }
})();

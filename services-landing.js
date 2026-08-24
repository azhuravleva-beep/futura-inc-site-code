/* =====================================================================
   futura.inc — сборщик блоков лендинга на страницах услуг
   Версия 12, 24.08.2026

   Подключается в Webflow: Services Template -> Before </body> tag,
   одной строкой <script src="...">. Стили вставляет сам.

   Что делает: превращает три текстовых поля CMS в блоки лендинга —
   цифры-факты, карточки ситуаций, «что вы получаете», FAQ-аккордеон,
   мид-CTA, кнопка на мобильном. Плюс разворачивает страницу во всю
   ширину и оформляет таблицы.

   Версия 12: сноска с первоисточниками перестала выглядеть основным текстом —
   мельче, курсивом, приглушённым цветом, и ссылки в ней подчёркнуты. До этого
   абзац читался как продолжение текста страницы, а ссылки в нём не отличались
   от обычных слов: ни подчёркивания, ни цвета. Сноска затевалась ровно затем,
   чтобы читатель мог проверить утверждение по источнику, — значит ссылка в ней
   обязана быть видна.

   Версия 11: таблица возвращена в поток. Версия 8 выносила её отдельной полосой,
   потому что таблица была шире текстовой колонки. После версии 10 она стоит ровно
   по ширине этой колонки — то есть выносить больше нечего, а вынос ломал порядок
   чтения: сноска с первоисточниками стоит в тексте сразу после таблицы, и когда
   таблица уезжала в конец блока, сноска оказывалась ВЫШЕ таблицы, под заголовком,
   как будто относится к нему. Заодно уезжал вниз и блок FAQ. Теперь порядок
   ровно такой, как его написали: заголовок → таблица → сноска → FAQ.

   Версия 10: три блока стояли на трёх разных вертикалях, и ни одна не была
   выбрана — их выдало содержимое. Обёртка блока `.s__info-wrap` это flex-колонка
   с `align-items: flex-start`, а такой ребёнок получает ширину по своему тексту:
   у «Что требуется» абзацы длинные — блок растянулся на все 1511 px; у «Этапов
   работы» короче — вышло 1126 px; полоса с таблицей села по естественной ширине
   таблицы, 705 px. Отсюда и «таблица по левому краю», и «блок требований сильно
   правее». Мера теперь задана явно (`--s-measure`) и одна для всех блоков, а
   таблица встаёт во вторую колонку сетки — ровно под текст, тем же левым краем.
   Плюс висящие предлоги теперь чистятся и в заголовках блоков: «Что требуется для /
   ликвидации» ломалось по предлогу, стало «Что требуется / для ликвидации».

   Версия 9: у таблицы, вынесенной в свою полосу, отвалилось оформление —
   правила были привязаны к текстовому блоку, из которого её и достали.
   Теперь оформление висит на самой таблице (класс s-table), а не на её окружении:
   вынести её теперь можно куда угодно.

   Версия 8: «широко и справа пусто» — не про ширину, а про то, что у нас на всю
   ширину растянут ТЕКСТ. Замер эталонов: на странице Кипра ни одного абзаца
   длиннее 245 знаков, всё разложено карточками и одним двухколоночным блоком
   (заголовок слева, содержимое справа). Повторяем этот приём: текстовые блоки
   услуги встают в двухколоночную сетку, таблица уходит отдельной полосой.

   Версия 7: правки Никиты — жёлтые маркеры списков не читались на светлом фоне
   (brand-primary это буквально «yellow»), и мигал текст кнопки в герое: скрипт
   подменял «Обсудить задачу» на оффер уже после отрисовки страницы.

   Версия 6: второй круг правок Алисы — висящие предлоги (неразрывные пробелы),
   балансировка строк в заголовках карточек, ритм отступов внутри текстовых блоков,
   карточки-факты стали компактнее.

   Версия 5: правки Алисы по виду — убрана нумерация 01.N (осталась от узкой
   колонки с боковым содержанием), выправлен блок требований (списки были серые
   и полужирные, потому что у сайта на li стоит только цвет secondary, а вес
   наследуется от body), убран лишний воздух под мид-CTA.

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

/* Ширину строки больше не держим max-width: из-за него текст прижимался влево,
   а справа оставалась пустая половина (замечания Никиты и Юли 21.08). Теперь
   комфортную длину строки задаёт структура — двухколоночная сетка, как на Кипре. */
.services-inner__block-content { overflow: visible; }

/* ---------- 1б. Двухколоночная сетка текстовых блоков ----------
   Приём с эталонных страниц: слева заголовок раздела, справа содержимое.
   Ширина заполняется целиком, а строка текста остаётся короткой. */
.s-grid2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.45fr);
  gap: 1.5rem 4rem;
  align-items: start;
}
.s-grid2 > .s-grid2__head { margin: 0; }
.s-grid2 > .s-grid2__head h2 { margin-top: 0; }
@media (max-width: 991px) {
  .s-grid2 { grid-template-columns: 1fr; gap: 1rem; }
}

/* ---------- 1в. Одна мера для всех блоков ----------
   Обёртка блока .s__info-wrap — это flex-колонка с align-items: flex-start.
   Такой ребёнок получает ширину по содержимому, а не по контейнеру, поэтому
   ширину блока задавал его собственный текст: «Что требуется» — 1511 px,
   «Этапы работы» — 1126 px, полоса с таблицей — 705 px. Ни одна из трёх
   вертикалей не была выбрана, они просто так получились.
   Мера задана явно и одинакова для всех блоков. 63.5rem — это ровно ширина
   блока этапов, та, что всех устроила: у сайта корневой шрифт плавающий
   (1rem = ширина окна / 90), поэтому мера в rem — это доля от окна, и она
   держится на всех ширинах, а не только на одной. align-self: stretch снимает
   сжатие по содержимому, max-width держит меру. */
.s-content { --s-measure: 63.5rem; }
.s-grid2 {
  align-self: stretch;
  width: 100%;
  max-width: var(--s-measure, 63.5rem);
}

/* Таблица остаётся там, где её поставил автор текста — внутри текстовой колонки.
   Версия 8 выносила её отдельной полосой, потому что она была шире колонки;
   после версии 10 колонка и таблица одной ширины, и вынос только ломал порядок
   чтения (сноска с источниками оказывалась выше таблицы). */

/* ---------- 2. Герой: описание было прижато к заголовку ---------- */
@media (min-width: 992px) {
  .s-hero__grid { grid-column-gap: 4.5rem; }
}

/* ---------- 3. Отступы и номера у подзаголовков ----------
   Было: первый h3 получал margin-top:0 в расчёте на блок, который начинается
   с подзаголовка. У нас перед ним вводный абзац — заголовок приклеивался. */
/* Нумерация 01.N убрана. Её рисует счётчик из кода Тани, и она была осмысленной,
   пока страница была узкой колонкой с боковым содержанием: номер стоял на поле
   слева, рядом с пунктами того же содержания. Содержания больше нет — страница
   во всю ширину, и номер уехал в самый левый край, к пустоте.
   Правило Тани лежит перед </body>, то есть позже наших стилей, — отсюда important. */
.services-inner__block-content h3::before { display: none !important; }

/* Ритм подзаголовков: воздух сверху и тонкая линия, чтобы четыре раздела внутри
   одного блока читались как разделы, а не как одна простыня. */
.services-inner__block-content h3 {
  margin-top: 2.25rem !important;
  margin-bottom: .75rem !important;
  padding-top: 1.25rem;
  border-top: 1px solid var(--_colors---border--tertiary, rgba(21,21,21,.1));
}
.services-inner__block-content h3:first-of-type {
  margin-top: 1.5rem !important;
  padding-top: 0;
  border-top: 0;
}
.services-inner__block-content > :first-child { margin-top: 0 !important; }
.services-inner__block-content > :last-child { margin-bottom: 0; }

/* Абзацы и списки в одном ритме с подзаголовками: шаг .75rem внутри раздела,
   2.25rem между разделами. Раньше внутренние отступы были то 1.25rem, то 2rem,
   и разделы выглядели неровно. */
.services-inner__block-content p { margin-bottom: .75rem; }

/* Заголовки карточек и значения фактов: браузер сам выравнивает длину строк,
   чтобы не получалось «одна строка длинная, вторая из одного слова». */
.s-built .jur-why__item h3,
.s-built .jur-why__item .heading-style-h4,
.s-built .jur-top__item .heading-style-h4 { text-wrap: balance; }

/* ---------- 4. Таблицы: настоящие, вместо картинок ----------
   Правила висят на самой таблице (класс s-table скрипт вешает при разборе
   страницы), а не на блоке, внутри которого она лежит. Версия 8 вынесла таблицу
   в отдельную полосу — и вместе с переездом она потеряла всё оформление, потому
   что селекторы были привязаны к текстовому блоку. Больше так не сломается. */
.s-table-scroll { overflow-x: auto; margin: 2rem 0; -webkit-overflow-scrolling: touch; }
.services-inner__block-content table,
.s-built table,
table.s-table {
  width: 100%; min-width: 30rem; border-collapse: collapse; margin: 0;
  font-size: var(--_typography---font-size--text, 1rem);
  table-layout: auto;
}
.services-inner__block-content th, .services-inner__block-content td,
.s-built th, .s-built td,
table.s-table th, table.s-table td {
  text-align: left; vertical-align: top; padding: .75rem 1rem;
  border-bottom: 1px solid var(--_colors---base--black-15);
  line-height: var(--_typography---line-height--body-regular, 140%);
}
.services-inner__block-content thead th, .s-built thead th,
table.s-table thead th {
  border-bottom: 2px solid var(--_colors---text--primary);
  font-weight: 600; white-space: nowrap;
}
.services-inner__block-content tbody tr:nth-child(odd),
.s-built tbody tr:nth-child(odd),
table.s-table tbody tr:nth-child(odd) { background: var(--_colors---background--secondary); }

/* первая колонка — «этап», ей нужна ширина, второй хватает содержимого */
table.s-table th:first-child,
table.s-table td:first-child { width: 55%; padding-right: 2rem; }

/* ---------- 4б. Сноска с первоисточниками ----------
   Служебный текст под таблицей: он не должен конкурировать с содержанием.
   Ссылки внутри подчёркиваем принудительно — у сайта у ссылок в rich-text
   нет ни подчёркивания, ни цвета, и в сноске их было просто не видно. */
.s-sources {
  /* Размер в rem, а не em: у абзацев сайта свой font-size от класса, и .8em
     считался от унаследованного корневого, а не от текста рядом — получалось
     мельче всего на 9%. Корневой шрифт у сайта плавающий, так что rem — это
     доля от окна, и сноска остаётся мелкой на любой ширине. */
  font-size: .72rem !important;
  font-style: italic;
  line-height: 1.5;
  color: var(--_colors---text--secondary, #6b6b6b);
  margin-top: .75rem !important;
}
.s-sources a {
  text-decoration: underline;
  text-underline-offset: .15em;
  color: inherit;
}
.s-sources a:hover { text-decoration-thickness: 2px; }

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

/* ---------- 5б. Карточки-факты под героем ----------
   Значение набиралось тем же кеглем, что заголовок блока: строка «не ранее
   5 недель до решения» переносилась и карточки выходили разной высоты.
   Кегль чуть меньше, межстрочный интервал плотнее, отступ от подписи ровный. */
.s-built.is-s-facts { padding-bottom: 0; }
.s-built .jur-top__item { padding-top: 1rem; row-gap: .375rem; }
.s-built .jur-top__item .text-style-label { margin-bottom: 0; }
.s-built .jur-top__item .heading-style-h4 {
  font-size: clamp(1.25rem, 1.6vw, 1.5rem);
  line-height: 1.15;
  margin-bottom: 0;
}

/* ---------- 6. Мид-CTA ---------- */
/* Между плашкой CTA и «Лидерами направления» складывались три отступа:
   2.5rem у самой плашки, 2rem снизу у секции и 5–6.25rem сверху у лидеров.
   Оставляем один — тот, что задан ритмом сайта, и его же поджимаем. */
.s-built.is-s-midcta { padding-top: 0; padding-bottom: 0; }
.s-built.is-s-midcta + .s-leaders,
.s-built.is-s-midcta + .s-cases,
.s-built.is-s-midcta + .s-built { padding-top: var(--_spacing---section-padding--40, 2.5rem); }

.s-midcta__inner {
  background: var(--_colors---background--secondary); border-radius: .5rem;
  padding: 2rem; margin: 2.5rem 0 0;
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
  margin: .5rem 0 .75rem;
  padding-left: 1rem;
  display: block;
}
/* Пункты списка выглядели серыми и полужирными: в стилях сайта у li задан
   только цвет secondary, а вес и размер наследуются от body, где вес medium.
   У абзацев всё это задано явно — приводим пункты к абзацам. */
.services-inner__block-content li {
  position: relative;
  list-style: disc;
  padding-left: .25rem;
  margin-bottom: .4rem;
  color: var(--_colors---text--primary);
  font-family: var(--_typography---font-family--body);
  font-size: var(--_typography---font-size--text);
  font-weight: var(--_typography---font-weight--regular, 400);
  line-height: var(--_typography---line-height--body-regular, 150%);
}
.services-inner__block-content li:last-child { margin-bottom: 0; }
/* Маркер жёлтым квадратом не читался: brand-primary у сайта это буквально «yellow»,
   на светлом фоне он почти невидим (замечание Никиты 21.08). Возвращаем обычный
   маркер цветом текста — так списки выглядят на остальных страницах сайта. */
.services-inner__block-content li::marker { color: var(--_colors---text--primary); }
.services-inner__block-content li::before { content: none; }
.services-inner__block-content ol li { list-style: decimal; }

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
          // Класс оформления вешаем на саму таблицу: правила не должны зависеть
          // от того, внутри чего она лежит (урок версии 9).
          if (tb.className.indexOf('s-table') < 0) tb.className += ' s-table';

          // Абзац сразу после таблицы, начинающийся со слова «Источники» или
          // «Sources», — это сноска с первоисточниками. Помечаем, чтобы отличать
          // её от основного текста. Ищем по тексту, а не по позиции: авторы
          // ставят сноску и через пустой абзац.
          var nx = tb.nextElementSibling;
          for (var hop = 0; nx && hop < 3; hop++) {
            if (nx.tagName === 'P' && /^\s*(Источники|Sources)\s*[:—-]/i.test(nx.textContent || '')) {
              if (nx.className.indexOf('s-sources') < 0) nx.className += ' s-sources';
              break;
            }
            nx = nx.nextElementSibling;
          }
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

      // Текст кнопки в герое больше НЕ подменяем. Скрипт грузится по сети и
      // выполняется после отрисовки, поэтому посетитель успевал прочитать
      // «Обсудить задачу», а потом видел, как надпись меняется на оффер —
      // выглядело как поломка (замечание Никиты 21.08). Оффер остаётся там,
      // где он не мигает: в плашке после этапов и в кнопке на мобильном.
      // Вернуть его в герой можно будет без мигания, когда под оффер появится
      // поле в CMS и надпись придёт вместе с версткой страницы.
    });
  }

  // Мелкий помощник: создать элемент с классом. Нужен и сборщику блоков,
  // и раскладке в две колонки, поэтому живёт на уровне модуля.
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // Страховка: сбой одного блока не должен ломать страницу и остальные блоки.
  function safe(name, fn) {
    try { fn(); } catch (e) {
      if (window.console) console.warn('[лендинг] блок «' + name + '» не собрался:', e);
    }
  }

  // ------------------------------------ двухколоночная сетка текстовых блоков
  // На эталонных страницах (Кипр, Клоны) нет ни одного широкого полотна текста:
  // либо карточки, либо сетка «заголовок слева — содержимое справа». Наши блоки
  // «Что требуется» и «Этапы работы» — как раз полотна, поэтому на всю ширину
  // они читались плохо, а справа оставалась пустая половина. Раскладываем их
  // тем же приёмом, используя классы списков самого сайта.
  function twoColumns(sectionSel, contentSel) {
    var sec = document.querySelector(sectionSel);
    if (!sec || sec.querySelector('.s-grid2')) return;
    var head = sec.querySelector('.services-inner__block-heading');
    var content = sec.querySelector(contentSel);
    if (!head || !content || !content.parentNode) return;

    var grid = el('div', 's-grid2');
    var left = el('div', 's-grid2__head');
    var right = el('div', 's-grid2__body');
    content.parentNode.insertBefore(grid, content);
    left.appendChild(head);
    right.appendChild(content);
    grid.appendChild(left);
    grid.appendChild(right);

    // Класс списков со страниц юрисдикций (jur-how__rich-list) сюда НЕ вешаем,
    // хотя соблазн есть: он задаёт вес medium и list-style:none, то есть возвращает
    // ровно то, на что жаловался Никита — бледные полужирные пункты без маркеров.
    // Типографику списков держим своими правилами выше.
    return grid;
  }

  function reflow() {
    safe('сетка требований', function () { twoColumns('.s-solution', '.services-inner__block-content'); });
    safe('сетка этапов', function () { twoColumns('.s-stages', '.services-inner__block-stages'); });
  }

  // ------------------------------------------- висящие предлоги
  // Предлог или союз в конце строки — «висячий». Лечится неразрывным пробелом:
  // короткое слово склеивается со следующим и переезжает вниз вместе с ним.
  // Так «не ранее 5 недель до решения» ломается как «не ранее 5 недель /
  // до решения», а не «… до / решения». Правка только внешняя: в CMS текст
  // остаётся с обычными пробелами.
  var GLUE_RU = ['и','а','но','или','в','во','на','к','ко','с','со','у','о','об',
    'от','до','за','по','из','над','под','при','для','без','не','ни','то','же',
    'ли','бы','что','чем','как','так','это','если','чтобы','после','перед',
    'между','через','около','вместе','только'];
  var GLUE_EN = ['of','in','on','at','to','by','for','the','a','an','and','or',
    'is','are','as','no','not','up','with','from','into','than','that','which',
    'after','before','within','only'];

  function glueRe(words) {
    return new RegExp('(^|[\\s(«“"—–-])(' + words.join('|') + ')[ \\t]+', 'gi');
  }
  var RE_WORDS = [glueRe(GLUE_RU), glueRe(GLUE_EN)];
  var RE_NUM = /(\d)[ 	]+(?=\S)/g;          // «5 недель», «12 месяцев»

  function noHangingWords(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var t = n.nodeValue;
      if (!t || t.indexOf(' ') < 0) return;
      var before = t;
      for (var pass = 0; pass < 2; pass++) {
        RE_WORDS.forEach(function (re) {
          t = t.replace(re, function (m, pre, w) { return pre + w + ' '; });
        });
      }
      t = t.replace(RE_NUM, '$1 ');
      if (t !== before) n.nodeValue = t;
    });
  }

  function typography() {
    // Заголовки блоков попали в список 24.08: «Что требуется для ликвидации»
    // ломалось как «Что требуется для / ликвидации» — предлог висел в конце
    // строки, и из-за этого заголовок занимал колонку целиком.
    ['.s-built', '.services-inner__block-heading', '.services-inner__block-content',
     '.services-inner__block-stages', '.s-hero__info'].forEach(function (sel) {
      var list = document.querySelectorAll(sel);
      for (var i = 0; i < list.length; i++) noHangingWords(list[i]);
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
    document.addEventListener('DOMContentLoaded', function () {
      build(); reflow(); hideEmptySections(); typography();
    });
  } else {
    build();
    reflow();
    hideEmptySections();
    typography();
  }
})();

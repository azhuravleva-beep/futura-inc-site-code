/* =====================================================================
   futura.inc — сборщик блоков лендинга на страницах услуг
   Версия 17, 25.08.2026

   Подключается в Webflow: Services Template -> Before </body> tag,
   одной строкой <script src="...">. Стили вставляет сам.

   Что делает: превращает три текстовых поля CMS в блоки лендинга —
   цифры-факты, карточки ситуаций, «что вы получаете», FAQ-аккордеон,
   мид-CTA, кнопка на мобильном. Плюс разворачивает страницу во всю
   ширину и оформляет таблицы.

   Версия 17: мид-CTA переехал ещё раз — просьба Гены через Алису. Теперь он
   идёт сразу после блока «Когда нужна…», то есть до «Что вы получаете»:
   герой → цифры → когда нужна → CTA → что вы получаете. Логика в том, что
   оффер ловит человека сразу после списка ситуаций «это про меня», не дожидаясь
   перечисления выгод. Запасные места, если секции нет: «что вы получаете»,
   потом этапы.

   Версия 16: мид-CTA появился на четырёх кипрских страницах — просьба Алисы.
   До этого оффер был написан только под ликвидацию, и на остальных страницах
   блок не показывался: так задумано, чтобы на 76 страницах не встал оффер
   про ликвидацию. Тексты офферов написаны по образцу Алисы — «мы», обращение
   на «вы», конкретное обещание в кнопке. Это черновик, ждёт её слова.

   Версия 15: две правки.

   1. Когда блок приходит из коллекции, скрипт отступал слишком рано — прямо
      в начале сборщика. А сборщик делал ДВЕ вещи: рисовал блок и убирал из
      текста исходник, из которого рисовал. Отступая, он пропускал и уборку,
      поэтому на эталоне вылез сырой текст FAQ: заголовок «FAQ» и пять вопросов
      обычными h4 внутри блока требований (замечено Алисой). Теперь исходник
      из текста убирается ВСЕГДА, а рисуется блок только если коллекция пуста.

   2. Мид-CTA переехал: был после этапов работы, стал сразу после «Что вы
      получаете» — просьба Алисы. Оффер идёт сразу за списком выгод, а не
      через два блока. Если секции «что вы получаете» на странице нет,
      встаёт как раньше, после этапов.

   Версия 14: блоки «Цифры-факты» и FAQ переехали в коллекции, и на странице
   их стало по два — старый, собранный скриптом из текста, и новый из CMS.
   Правки две:

   1. Компактный вид карточек цифр был привязан к .s-built — контейнеру, который
      скрипт создаёт сам. Блок из CMS в него не попадает, поэтому значения в нём
      рисовались во весь кегль h4 и выглядели вдвое крупнее (замечено Алисой).
      Правила расширены на список из CMS. Классы .s-built в Designer нет вовсе —
      скрипт вешает их на ходу, поэтому подогнать пришлось CSS, а не разметку.

   2. Скрипт больше не рисует блок, если такой же блок на странице уже пришёл
      из коллекции — то есть если в списке CMS есть хотя бы одна карточка.
      Так снят дубль, и переход идёт постранично: где записей ещё нет, работает
      старый блок из текста. Проверять именно карточки, а не наличие списка:
      сам список лежит в шаблоне и есть на всех 76 страницах.

   Версия 13: две правки, обе — по следам моих же ошибок.

   1. Склейка предлогов могла сделать заголовок ШИРЕ колонки. Неразрывный пробел
      склеивает служебное слово со следующим, а два прохода склеивали цепочку:
      «and from the employee» превращалось в один неразрывный кусок, который
      не влезал в колонку заголовка и наезжал на текст справа (замечено Алисой
      на английской версии bcs-status-cyprus). Теперь склейка себя проверяет:
      после правки заголовок измеряется, и если он вылез за свою колонку —
      склейка в нём откатывается. Не влез и без склейки — разрешаем перенос
      внутри слова, потому что наезд на соседнюю колонку хуже дефиса.

   2. Сноска с источниками опознавалась только по слову «Источники»/«Sources»
      в начале. На эталоне ликвидации сноска написана иначе — «Сроки в таблице —
      из закона о компаниях Кипра…», двумя абзацами, — и оставалась в виде
      основного текста. Теперь после таблицы помечаются все идущие подряд абзацы
      со ссылкой на внешний источник, а не только начинающиеся нужным словом.

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
.s-built .jur-top__item .heading-style-h4,
.jur-top__list-wrap.w-dyn-list .jur-top__item .heading-style-h4 { text-wrap: balance; }

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

/* Аварийный перенос внутри слова. Ставится скриптом только тому заголовку,
   который не влез в свою колонку даже без склейки предлогов: наезд на соседнюю
   колонку читается хуже, чем перенос. */
.s-wrap-hard { overflow-wrap: break-word; word-break: break-word; hyphens: auto; }

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
/* Компактные карточки цифр. Селектор перечислен дважды: для блока, который
   собирает скрипт (внутри .s-built), и для блока из коллекции (.w-dyn-list) —
   у второго контейнера .s-built нет, а вид должен быть тот же. */
.s-built.is-s-facts { padding-bottom: 0; }
.s-built .jur-top__item,
.jur-top__list-wrap.w-dyn-list .jur-top__item { padding-top: 1rem; row-gap: .375rem; }
.s-built .jur-top__item .text-style-label,
.jur-top__list-wrap.w-dyn-list .jur-top__item .text-style-label { margin-bottom: 0; }
.s-built .jur-top__item .heading-style-h4,
.jur-top__list-wrap.w-dyn-list .jur-top__item .heading-style-h4 {
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
        ru: { title: 'Не уверены, что подходит — ликвидация или исключение из реестра?',
              text: 'Мы посмотрим состояние вашей компании и пришлём список документов со сметой.',
              btn: 'Получить список документов и смету' },
        en: { title: 'Not sure whether it is a liquidation or a strike-off?',
              text: 'We review your company and send the document list with a quote.',
              btn: 'Get the document list and a quote' }
      },
      'bcs-status-cyprus': {
        ru: { title: 'Не уверены, что ваша компания подходит под критерии BCS?',
              text: 'Мы проверим структуру владения и инвестицию и пришлём список документов со сметой.',
              btn: 'Проверить компанию под BCS' },
        en: { title: 'Not sure your company meets the BCS criteria?',
              text: 'We check your ownership structure and the investment, then send the document list with a quote.',
              btn: 'Check your company for BCS' }
      },
      'trademark-registration-cyprus-eu': {
        ru: { title: 'Не знаете, регистрировать знак на Кипре или сразу в ЕС?',
              text: 'Мы проверим ваше обозначение по реестрам и посчитаем оба варианта — с пошлинами и сроками.',
              btn: 'Получить проверку и смету' },
        en: { title: 'Not sure whether to file in Cyprus or across the EU?',
              text: 'We search the registers for your sign and price both routes, with fees and timelines.',
              btn: 'Get a search and a quote' }
      },
      'corporate-tax-ip-box-cyprus': {
        ru: { title: 'Не знаете, попадает ли ваш продукт в IP Box?',
              text: 'Мы разберём ваши активы и расчёты и покажем, какая ставка получается на самом деле.',
              btn: 'Посчитать ставку под IP Box' },
        en: { title: 'Not sure whether your product qualifies for IP Box?',
              text: 'We review your assets and the numbers and show the rate you actually get.',
              btn: 'Calculate your IP Box rate' }
      },
      'redomiciliation-cyprus': {
        ru: { title: 'Не уверены, можно ли перевести вашу компанию на Кипр?',
              text: 'Мы прочитаем закон вашей юрисдикции и пришлём план перевода со сроками и пошлинами.',
              btn: 'Проверить возможность перевода' },
        en: { title: 'Not sure your company can be moved to Cyprus?',
              text: 'We read the law of your jurisdiction and send a transfer plan with timelines and fees.',
              btn: 'Check if a transfer is possible' }
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
      var cmsFacts = fromCms('.jur-top__list-wrap');
      var p = null;
      for (var i = 0; i < rt1.children.length; i++) {
        var n = rt1.children[i];
        if (n.tagName === 'P') { if (n.textContent.indexOf(' · ') > -1) p = n; break; }
        if (n.tagName === 'H3') break;
      }
      if (!p) return;
      // Исходную строку убираем в любом случае: если блок пришёл из коллекции,
      // строка в тексте — просто дубль того же содержимого.
      if (cmsFacts) { p.parentNode.removeChild(p); return; }
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
          // Сноска опознаётся двумя способами: по зачину «Источники»/«Sources»
          // и по наличию ссылки на внешний источник. Второй способ добавлен
          // 25.08: на эталоне ликвидации сноска написана без зачина —
          // «Сроки в таблице — из закона о компаниях Кипра…» — и двумя абзацами.
          // Идём по абзацам подряд и помечаем все, что похожи на сноску.
          var nx = tb.nextElementSibling, marked = 0;
          for (var hop = 0; nx && hop < 4; hop++) {
            if (nx.tagName !== 'P') { if (marked) break; nx = nx.nextElementSibling; continue; }
            var txt = nx.textContent || '';
            var head = /^\s*(Источники|Sources)\s*[:—-]/i.test(txt);
            var ext = !!nx.querySelector('a[href^="http"]');
            if (head || ext) {
              if (nx.className.indexOf('s-sources') < 0) nx.className += ' s-sources';
              marked++;
              nx = nx.nextElementSibling;
              continue;
            }
            break;
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

      // Уборка исходника — ВСЕГДА, даже когда блок пришёл из коллекции.
      // Иначе вопросы остаются в тексте обычными h4 и читаются как часть
      // блока требований (версия 14 именно так и сломала эталон).
      function dropSource() {
        if (faq.head && faq.head.parentNode) faq.head.parentNode.removeChild(faq.head);
        faq.body.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      }
      if (fromCms('.faqs__list-wrap')) { dropSource(); return; }

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

      dropSource();
    });

    // ------------- 6. Мид-CTA сразу после блока «Когда нужна…»
    safe('мид-CTA', function () {
      if (!offer) return;
      // Место оффера меняли трижды, поэтому порядок предпочтений явный.
      // Просьба Гены 25.08: сразу после блока «Когда нужна…», до «Что вы
      // получаете» — оффер ловит человека на списке ситуаций «это про меня».
      // Дальше по списку — запасные места, если такой секции на странице нет.
      var after = document.querySelector('.s-built.is-s-cards') ||
                  document.querySelector('.s-built.is-s-results') ||
                  document.querySelector('.s-stages');
      if (!after) return;
      var sec = section('is-s-midcta', null);
      var inner = el('div', 's-midcta__inner');
      var txt = el('div', 's-midcta__text');
      txt.appendChild(el('p', 'heading-style-h4', offer.title));
      txt.appendChild(el('p', 'text-size-regular text-color-secondary', offer.text));
      inner.appendChild(txt);
      inner.appendChild(button(offer.btn));
      sec._host.appendChild(inner);
      after.parentNode.insertBefore(sec, after.nextSibling);
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
  // Такой же блок уже пришёл из коллекции? Тогда скриптом его не рисуем.
  // ⚠️ Проверять надо не наличие списка, а наличие в нём КАРТОЧЕК. Список из CMS
  // лежит в шаблоне и присутствует на всех 76 страницах услуг, даже когда записей
  // для этой услуги нет. Первая версия проверки смотрела только на .w-dyn-list —
  // и на четырёх кипрских страницах, где записей ещё нет, блоки исчезли совсем:
  // скрипт отступил, а коллекция ничего не дала. Теперь отступаем только если
  // из коллекции реально пришла хотя бы одна карточка, поэтому переход на
  // коллекции идёт постранично и ничего не роняет по дороге.
  function fromCms(sel) {
    var w = document.querySelector(sel + '.w-dyn-list');
    return !!(w && w.querySelector('.w-dyn-item'));
  }

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

  // Склейка предлогов может сделать неразрывный кусок шире колонки — тогда
  // заголовок вылезает на соседнюю колонку. Меряем каждый заголовок после
  // правки и откатываем склейку там, где она навредила.
  function unglue(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (n.nodeValue.indexOf('\u00a0') >= 0) n.nodeValue = n.nodeValue.replace(/\u00a0/g, ' ');
    }
  }

  // Порядок средств важен. Раскленить проще всего, но тогда возвращается висящий
  // предлог — ровно то, что просили убрать. Поэтому сначала уменьшаем кегль:
  // заголовок вдвое длиннее эталонного просто не рассчитан на эту колонку.
  // Расклейка и перенос внутри слова — последние средства.
  var SHRINK = [0.86, 0.74, 0.64, 0.56];

  function fitsIn(el) {
    return el.scrollWidth <= el.clientWidth + 1;
  }

  function fixOverflowingHeadings() {
    var list = document.querySelectorAll(
      '.services-inner__block-heading h1, .services-inner__block-heading h2,' +
      '.services-inner__block-heading h3, .s-built__head h1, .s-built__head h2,' +
      '.s-hero__info h1, .s-built h3, .s-built .heading-style-h4');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      el.style.fontSize = '';                        // сбросить прошлую подгонку
      if (fitsIn(el)) continue;

      var base = parseFloat(getComputedStyle(el).fontSize) || 0;
      var done = false;
      for (var k = 0; k < SHRINK.length && base; k++) {
        el.style.fontSize = (base * SHRINK[k]).toFixed(2) + 'px';
        if (fitsIn(el)) { done = true; break; }
      }
      if (done) continue;

      el.style.fontSize = base ? (base * SHRINK[SHRINK.length - 1]).toFixed(2) + 'px' : '';
      unglue(el);                                    // не помогло — расклеиваем
      if (!fitsIn(el) && el.className.indexOf('s-wrap-hard') < 0) {
        el.className += ' s-wrap-hard';              // и только теперь рвём слово
      }
    }
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

  // Проверку «влез ли заголовок в колонку» нельзя делать сразу: до загрузки
  // шрифта ширины другие, а при смене ширины окна колонка меняется. Поэтому
  // мерим после готовности шрифтов и заново при ресайзе — с повторной склейкой,
  // потому что откат склейки необратим.
  function retypeset() {
    safe('висящие предлоги', typography);
    safe('заголовки шире колонки', fixOverflowingHeadings);
  }

  function scheduleTypeset() {
    retypeset();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { safe('заголовки после шрифтов', fixOverflowingHeadings); });
    }
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(retypeset, 200);
    });
  }

  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      build(); reflow(); hideEmptySections(); scheduleTypeset();
    });
  } else {
    build();
    reflow();
    hideEmptySections();
    scheduleTypeset();
  }
})();

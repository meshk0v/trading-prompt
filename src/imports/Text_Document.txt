Создай современный профессиональный frontend для гибридного AI-сервиса торговых сигналов.

## STACK

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Lucide React для иконок
* TradingView Lightweight Charts для графиков
* Recharts только там, где Lightweight Charts не подходит
* Без Bootstrap
* Без Material UI
* Без градиентов
* Responsive desktop-first UI
* Компонентная архитектура
* Все элементы должны быть переиспользуемыми
* Используй mock data для демонстрации интерфейса
* Код должен быть готов к дальнейшему подключению API

## DESIGN CONCEPT

Стиль: premium dark trading terminal + эстетика фильма «Город грехов».

Весь интерфейс практически полностью чёрно-белый и серый. Цветной акцент используется крайне редко.

Единственный цветной акцент:

`#FFB000`

Не создавай оттенки этого цвета. Не используй градиенты. Не используй другие цветные акценты.

Цвет `#FFB000` использовать только для наиболее важных элементов:

* кнопка «Запросить сигнал»
* активный элемент
* ключевой сигнал
* важное значение
* точка/маркер на графике
* небольшие индикаторы
* selected state
* critical attention element

Не окрашивать этим цветом большие области интерфейса.

Визуально должно быть ощущение:

* дорогого профессионального terminal UI
* минимализма
* высокой плотности информации
* мягкого контраста
* чистой типографики
* большого количества чёрного пространства
* аккуратных тонких границ
* отсутствия визуального шума

## COLOR SYSTEM

### Background

`#0A0A0A` — основной фон приложения

### Surfaces

`#111111` — карточки, панели, секции

`#161616` — input, select, textarea

`#1D1D1D` — внутренние области и элементы

### Borders

`#1C1C1C` — обычная рамка

`#292929` — hover border

`#333333` — усиленная рамка

`#383838` — focus

`#444444` — сильный active element

### Secondary surfaces

`#222222` — scrollbar / вторичные элементы

`#242424` — hover / active background

### Text

`#E6E6E6` — основной текст

`#D8D8D8` — основной светлый элемент

`#BDBDBD` — иконки

`#A8A8A8` — muted bright

`#8A8A8A` — secondary text

`#777777` — secondary text/icons

`#555555` — disabled text

`#FFFFFF` — максимальный контраст, использовать редко

### Accent

`#FFB000` — единственный цветной акцент интерфейса

## IMPORTANT COLOR RULE

Не используй постоянно белый цвет.

`#FFFFFF` предназначен только для:

* особо важных значений
* active states
* ключевых заголовков
* максимального визуального приоритета

Основной текст используй `#E6E6E6`.

Акцент `#FFB000` должен встречаться редко, чтобы его появление действительно привлекало внимание.

## COMPONENT STATES

### Default

Минимальный контраст.

### Hover

Немного светлее фон и рамка.

### Pressed

Немного темнее Hover.

### Focus

Использовать рамку `#383838` или `#444444`.

### Active

Текст `#E6E6E6` / `#FFFFFF`.

Для действительно важных active states можно использовать `#FFB000`.

### Disabled

Использовать приглушённые серые цвета.

Не делай весь компонент прозрачным через opacity.

## BUTTONS

### Primary button

Основная кнопка:

Background: `#FFB000`

Text: `#0A0A0A`

Border: `#FFB000`

Hover: тот же `#FFB000`, без изменения оттенка

Pressed: тот же `#FFB000`

Не создавать более светлый или тёмный вариант жёлтого.

### Secondary button

Background: `#111111`

Text: `#BDBDBD`

Border: `#1C1C1C`

Hover:

Background `#161616`

Text `#E6E6E6`

Border `#292929`

Pressed:

Background `#0E0E0E`

Text `#BDBDBD`

Border `#242424`

## INPUTS

Default:

Background `#161616`

Text `#E6E6E6`

Border `#1C1C1C`

Hover:

Background `#191919`

Border `#292929`

Focus:

Background `#1D1D1D`

Text `#FFFFFF`

Border `#383838`

Placeholder:

`#5F5F5F`

## CHECKBOX

Default:

Background `#161616`

Border `#333333`

Hover:

Background `#1C1C1C`

Border `#454545`

Active:

Background `#FFB000`

Border `#FFB000`

Checkmark:

`#0A0A0A`

Не используй синий или зелёный для checkbox.

## TOGGLE

Off:

Track `#1C1C1C`

Thumb `#666666`

Hover:

Track `#252525`

On:

Track `#FFB000`

Thumb `#0A0A0A`

Не использовать отдельные оттенки акцентного цвета.

## TABS

Inactive:

Text `#777777`

Hover:

Text `#B5B5B5`

Active:

Text `#FFFFFF`

Для наиболее важных активных вкладок использовать небольшую линию или точку `#FFB000`.

Не делать большие цветные активные вкладки.

## DROPDOWN

Background `#111111`

Border `#242424`

Item hover `#1C1C1C`

Active item `#242424`

Text `#D8D8D8`

Active text `#FFFFFF`

Если необходимо показать selected state — небольшая точка/иконка `#FFB000`.

## SCROLLBAR

Track:

`#0A0A0A`

Thumb:

`#222222`

Hover:

`#333333`

Dragging:

`#444444`

Никакого акцентного цвета на scrollbar.

## ICONS

Default:

`#BDBDBD`

Secondary:

`#777777`

Hover:

`#E6E6E6`

Active:

`#FFFFFF`

Important active:

`#FFB000`

Используй Lucide React.

Иконки должны быть тонкими, минималистичными и одинакового визуального веса.

## CARDS

Default:

Background `#111111`

Border `#1C1C1C`

Hover:

Background `#141414`

Border `#292929`

Active:

Background `#161616`

Border `#383838`

Selected:

Background `#1A1A1A`

Border `#444444`

Не использовать тени с сильным свечением.

## TABLE

Background:

`#0A0A0A`

Header:

`#111111`

Row:

`#0A0A0A`

Hover:

`#111111`

Active:

`#161616`

Divider:

`#161616`

Header text:

`#8A8A8A`

Primary value:

`#D8D8D8`

Secondary value:

`#777777`

Важные значения:

`#FFB000`

## TOOLTIP

Background `#1C1C1C`

Border `#333333`

Text `#E6E6E6`

Secondary text `#999999`

## MODAL

Overlay:

`#000000` с opacity 55–65%

Modal:

Background `#111111`

Border `#242424`

Title `#E6E6E6`

Description `#8A8A8A`

Close button hover:

`#1C1C1C`

## TRADING CHART

Используй TradingView Lightweight Charts.

График должен визуально соответствовать интерфейсу.

Background:

`#0A0A0A`

Grid lines:

`#161616`

Borders:

`#1C1C1C`

Axis text:

`#777777`

Normal chart elements:

монохромные серые/белые значения.

Не делай весь график цветным.

`#FFB000` использовать только для:

* AI signal marker
* entry point
* selected price
* signal zone
* ключевого уровня
* точки входа

Например:

`BUY SIGNAL` → маленький янтарный маркер.

Остальная информация графика должна оставаться монохромной.

## AI SIGNAL UI

Сервис является гибридным AI trading signal platform.

В системе используется 20 AI agents.

Главный сценарий:

Пользователь нажимает:

**«Запросить сигнал»**

Пользователь не вводит prompt вручную.

Prompt заранее подготовлен системой.

После запроса показывай процесс анализа:

1. Market data
2. Technical analysis
3. AI agents analysis
4. Risk analysis
5. Consensus
6. Final signal

Не перегружать пользователя техническими деталями.

Показывать прогресс лаконично.

## SIGNAL CARD

Создай основную карточку сигнала.

Содержимое:

Asset

Current Price

Signal

Confidence

Entry

Stop Loss

Take Profit

Risk / Reward

Timeframe

Signal time

AI consensus

Основной сигнал должен визуально выделяться.

Например:

`BUY`

или

`SELL`

Используй `#FFB000` только для ключевого сигнала/маркера.

Остальные данные — grayscale.

## DASHBOARD

Создай современный dashboard.

Структура:

Sidebar

Top bar

Main content

Signal section

Chart section

Recent signals

AI analysis status

Market overview

### Sidebar

Минималистичный.

Основные пункты:

Dashboard

Signals

Markets

AI Analysis

History

Watchlist

Profile

Settings

Не использовать много декоративных элементов.

Active navigation item:

тёмный фон + небольшой `#FFB000` indicator.

Не делать всю кнопку жёлтой.

## TOP BAR

Показывать:

Logo / название сервиса

Market status

Search

Notifications

User profile

Всё в grayscale.

Только важные состояния могут использовать `#FFB000`.

## RESPONSIVE

Desktop-first.

Поддерживать:

1440px

1280px

1024px

768px

mobile

Sidebar на mobile превращается в compact navigation.

Карточки адаптируются.

График должен корректно изменять высоту.

Таблицы должны иметь horizontal scroll.

## TYPOGRAPHY

Используй современный нейтральный sans-serif.

Предпочтительно:

Inter

или системный sans-serif fallback.

Не использовать декоративные шрифты.

Заголовки — medium/semibold.

Основной текст — regular.

Цифры trading data должны быть хорошо читаемыми.

Используй tabular numbers для цен, процентов и статистики.

## SPACING

Используй системную шкалу:

4px

8px

12px

16px

20px

24px

32px

40px

48px

Не создавать случайные значения spacing.

## BORDERS

Использовать тонкие borders.

Обычно:

1px solid `#1C1C1C`

Не использовать яркие белые borders.

Не использовать glow.

Не использовать glassmorphism.

Не использовать neon.

Не использовать gradients.

## VISUAL PRIORITY

Приоритет цветов:

1. `#FFB000` — самое важное
2. `#FFFFFF` — максимальный текстовый акцент
3. `#E6E6E6` — основной контент
4. `#D8D8D8`
5. `#BDBDBD`
6. `#8A8A8A`
7. `#777777`
8. `#555555`

Приоритет поверхностей:

`#0A0A0A` → `#111111` → `#161616` → `#1D1D1D` → `#242424`

## FINAL DESIGN RULE

Интерфейс должен выглядеть так, будто весь цвет из него удалили, а затем оставили всего один цвет — `#FFB000`.

Цвет должен быть редким.

Когда пользователь видит `#FFB000`, он должен понимать:

**«Это важно. Посмотри сюда».**

Не добавляй другие цвета.

Не добавляй оттенки `#FFB000`.

Не добавляй градиенты.

Не добавляй декоративный цветной шум.

Главная эстетика: **black / white / grey + один янтарный акцент.**

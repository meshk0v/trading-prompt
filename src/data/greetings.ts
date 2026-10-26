import type { Language } from '../i18n/translate'

// Welcome messages; the chat shows the next one on every visit.
export const GREETINGS: Record<Language, string[]> = {
  ru: [
    `Добро пожаловать в Trading Prompt

Trading Prompt собирает актуальные рыночные данные и формирует структурированный промпт для анализа с помощью AI.

Как начать:

1. Выберите торговый инструмент.
2. Укажите таймфрейм.
3. Выберите необходимые данные для анализа.
4. Добавьте свой вопрос или задачу для AI.
5. Нажмите «Создать промпт».
6. Скопируйте готовый промпт и отправьте его в ChatGPT, Claude, Gemini, DeepSeek или другой AI.

В зависимости от выбранных параметров промпт может включать цену, свечи, индикаторы, тренды, уровни, волатильность и другие рыночные данные.

Начните с выбора торгового инструмента.`,
    `Добро пожаловать в Trading Prompt

Подготовьте данные для AI-анализа рынка в несколько шагов.

Шаг 1 — Инструмент
Выберите валютную пару, криптовалюту, индекс, акцию или другой интересующий актив.

Шаг 2 — Период
Выберите таймфрейм и необходимую глубину исторических данных.

Шаг 3 — Данные
Настройте набор информации: свечи, индикаторы, тренды, уровни, волатильность и другие параметры.

Шаг 4 — Запрос
Добавьте собственную задачу или используйте готовый шаблон.

Шаг 5 — Trading Prompt
Система объединит выбранные параметры и рыночные данные в единый структурированный запрос.

Шаг 6 — AI-анализ
Скопируйте промпт и передайте его выбранной AI-модели для дальнейшего анализа.

Trading Prompt не принимает торговые решения за пользователя. Он помогает подготовить данные и сформировать качественный запрос для AI.`,
    `Добро пожаловать в Trading Prompt

Trading Prompt — это среда для автоматической подготовки структурированных запросов на основе рыночных данных.

Сервис объединяет выбранный вами торговый инструмент, таймфрейм, исторические данные, технические показатели и дополнительные параметры анализа в единый формат, подготовленный для передачи AI.

Для начала:

1. Выберите инструмент
Укажите актив, который необходимо проанализировать.

2. Определите таймфрейм
Выберите период свечей и глубину исторических данных.

3. Настройте набор данных
Определите, какие показатели и параметры должны быть включены в анализ.

4. Сформулируйте задачу
Введите собственный вопрос или выберите готовый шаблон промпта.

5. Сформируйте запрос
Trading Prompt соберёт выбранную информацию в единый структурированный промпт.

6. Используйте его в AI
Передайте готовый запрос в ChatGPT, Claude, Gemini, DeepSeek или другую совместимую AI-модель.

Таким образом, вместо ручного сбора информации вы получаете подготовленный контекст для дальнейшего AI-анализа рынка.

Выберите инструмент, чтобы начать.`,
  ],
  en: [
    `Welcome to Trading Prompt

Trading Prompt collects up-to-date market data and builds a structured prompt for AI analysis.

How to start:

1. Choose a trading instrument.
2. Set the timeframe.
3. Choose the data you need for the analysis.
4. Add your own question or task for the AI.
5. Click “Build prompt”.
6. Copy the finished prompt and send it to ChatGPT, Claude, Gemini, DeepSeek or another AI.

Depending on the selected settings, the prompt can include price, candles, indicators, trends, levels, volatility and other market data.

Start by choosing a trading instrument.`,
    `Welcome to Trading Prompt

Prepare data for AI market analysis in a few steps.

Step 1 — Instrument
Choose a currency pair, cryptocurrency, index, stock or any other asset you are interested in.

Step 2 — Period
Choose the timeframe and the depth of historical data.

Step 3 — Data
Set up the data set: candles, indicators, trends, levels, volatility and other parameters.

Step 4 — Request
Add your own task or use a ready-made template.

Step 5 — Trading Prompt
The service combines the selected parameters and market data into one structured request.

Step 6 — AI analysis
Copy the prompt and pass it to the AI model of your choice for further analysis.

Trading Prompt does not make trading decisions for you. It helps prepare the data and write a high-quality request for the AI.`,
    `Welcome to Trading Prompt

Trading Prompt is a workspace that automatically prepares structured requests based on market data.

The service combines the trading instrument, timeframe, historical data, technical indicators and additional analysis parameters you choose into a single format ready to be passed to an AI.

To get started:

1. Choose an instrument
Specify the asset you want to analyse.

2. Set the timeframe
Choose the candle period and the depth of historical data.

3. Configure the data set
Decide which indicators and parameters should be included in the analysis.

4. Describe the task
Enter your own question or pick a ready-made prompt template.

5. Build the request
Trading Prompt combines the selected information into one structured prompt.

6. Use it with an AI
Pass the finished request to ChatGPT, Claude, Gemini, DeepSeek or another compatible AI model.

Instead of collecting information by hand, you get prepared context for further AI market analysis.

Choose an instrument to begin.`,
  ],
}

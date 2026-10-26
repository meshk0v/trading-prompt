import type { Language } from '../i18n/translate'

export type TicketStatus = 'open' | 'answered' | 'closed'

export type SupportTicket = {
  id: string
  date: string
  subject: string
  status: TicketStatus
  reply: string
}

// Demo tickets shown until support requests are stored on the server.
export const DEMO_TICKETS: Record<Language, SupportTicket[]> = {
  ru: [
    {
      id: 'TKT-001',
      date: '12.06.2026',
      subject: 'Как зарегистрироваться в партнёрской программе?',
      status: 'closed',
      reply:
        'Для участия в партнёрской программе перейдите во вкладку «Партнёрская программа» и скопируйте реферальную ссылку. Никакой дополнительной регистрации не требуется.',
    },
    {
      id: 'TKT-002',
      date: '18.06.2026',
      subject: 'Почему промпт долго собирается?',
      status: 'closed',
      reply:
        'Сбор рыночных данных может занять несколько секунд. Если запрос завис — попробуйте повторить через минуту. Возможна временная нагрузка на серверы.',
    },
    {
      id: 'TKT-003',
      date: '24.06.2026',
      subject: 'Хочу сменить email аккаунта',
      status: 'closed',
      reply:
        'Смена email пока недоступна в самостоятельном режиме. Напишите нам в Telegram @binum_support с подтверждением личности, и мы изменим данные вручную.',
    },
    {
      id: 'TKT-004',
      date: '01.07.2026',
      subject: 'Купил 100 кредитов — как активировать?',
      status: 'closed',
      reply:
        'После оплаты кредиты начисляются автоматически в течение 5 минут. Если этого не произошло, пришлите чек об оплате в поддержку.',
    },
    {
      id: 'TKT-005',
      date: '07.07.2026',
      subject: 'Хочу вернуть деньги за кредиты',
      status: 'closed',
      reply:
        'Возврат средств возможен в течение 3 дней с момента покупки при условии, что купленные кредиты не были использованы. Заявка на возврат рассмотрена — средства возвращены.',
    },
    {
      id: 'TKT-006',
      date: '10.07.2026',
      subject: 'Почему в данных есть оценка SELL?',
      status: 'closed',
      reply:
        'Оценки индикаторов описывают состояние рынка в момент запроса и не являются торговой рекомендацией. Итоговый промпт предназначен для самостоятельного анализа.',
    },
    {
      id: 'TKT-007',
      date: '15.07.2026',
      subject: 'Не отображается график в промпте',
      status: 'closed',
      reply:
        'Попробуйте обновить страницу. Если проблема повторяется — очистите кеш браузера (Ctrl+Shift+Del). Графики загружаются динамически и могут не отображаться при слабом соединении.',
    },
    {
      id: 'TKT-008',
      date: '18.07.2026',
      subject: 'Вопрос по партнёрской программе — задержка выплаты',
      status: 'closed',
      reply:
        'Ваш вопрос решён. Выплата произведена согласно условиям. Следующая автоматическая выплата — каждый понедельник.',
    },
    {
      id: 'TKT-009',
      date: '22.07.2026',
      subject: 'Хочу купить кредиты — как оплатить криптой?',
      status: 'answered',
      reply:
        'Для оплаты в USDT (TRC-20) нажмите «Купить кредиты» и выберите способ оплаты «Криптовалюта». Адрес кошелька для перевода будет отображён автоматически.',
    },
    {
      id: 'TKT-010',
      date: '25.07.2026',
      subject: 'Не могу войти в аккаунт — забыл пароль',
      status: 'answered',
      reply:
        'Письмо для сброса пароля отправлено на ваш email. Проверьте папку «Спам», если письмо не пришло в течение 5 минут.',
    },
    {
      id: 'TKT-011',
      date: '28.07.2026',
      subject: 'Можно ли использовать Trading Prompt на мобильном?',
      status: 'answered',
      reply:
        'Да, сервис полностью адаптирован для мобильных устройств. Откройте сайт в браузере на смартфоне — всё работает без установки приложения.',
    },
    {
      id: 'TKT-012',
      date: '01.08.2026',
      subject: 'Сколько промптов можно собрать?',
      status: 'answered',
      reply:
        'Каждый готовый промпт списывает один кредит. Ограничений по времени нет, пока на балансе остаются кредиты.',
    },
    { id: 'TKT-013', date: '05.08.2026', subject: 'Где посмотреть историю промптов?', status: 'open', reply: '' },
    { id: 'TKT-014', date: '08.08.2026', subject: 'Когда появится история промптов?', status: 'open', reply: '' },
    { id: 'TKT-015', date: '11.08.2026', subject: 'Хочу изменить реферальную ссылку', status: 'open', reply: '' },
  ],
  en: [
    {
      id: 'TKT-001',
      date: '12.06.2026',
      subject: 'How do I join the affiliate program?',
      status: 'closed',
      reply:
        'To join the affiliate program, open the “Affiliate program” tab and copy your referral link. No extra registration is required.',
    },
    {
      id: 'TKT-002',
      date: '18.06.2026',
      subject: 'Why does the prompt take long to build?',
      status: 'closed',
      reply:
        'Collecting market data can take a few seconds. If the request hangs, try again in a minute. The servers may be under temporary load.',
    },
    {
      id: 'TKT-003',
      date: '24.06.2026',
      subject: 'I want to change my account email',
      status: 'closed',
      reply:
        'Changing the email yourself is not available yet. Message us on Telegram @binum_support with proof of identity and we will update it manually.',
    },
    {
      id: 'TKT-004',
      date: '01.07.2026',
      subject: 'I bought 100 credits — how do I activate them?',
      status: 'closed',
      reply:
        'After payment, credits are added automatically within 5 minutes. If that did not happen, send the payment receipt to support.',
    },
    {
      id: 'TKT-005',
      date: '07.07.2026',
      subject: 'I want a refund for credits',
      status: 'closed',
      reply:
        'A refund is possible within 3 days of purchase, provided the credits have not been used. Your refund request has been processed and the money returned.',
    },
    {
      id: 'TKT-006',
      date: '10.07.2026',
      subject: 'Why is there a SELL rating in the data?',
      status: 'closed',
      reply:
        'Indicator ratings describe the market at the moment of the request and are not a trading recommendation. The final prompt is meant for your own analysis.',
    },
    {
      id: 'TKT-007',
      date: '15.07.2026',
      subject: 'The chart is not shown in the prompt',
      status: 'closed',
      reply:
        'Try reloading the page. If the problem persists, clear the browser cache (Ctrl+Shift+Del). Charts load dynamically and may not appear on a weak connection.',
    },
    {
      id: 'TKT-008',
      date: '18.07.2026',
      subject: 'Affiliate program question — payout delay',
      status: 'closed',
      reply:
        'Your issue is resolved. The payout was made according to the terms. The next automatic payout is every Monday.',
    },
    {
      id: 'TKT-009',
      date: '22.07.2026',
      subject: 'I want to buy credits — how do I pay with crypto?',
      status: 'answered',
      reply:
        'To pay in USDT (TRC-20), click “Buy credits” and choose “Cryptocurrency” as the payment method. The wallet address for the transfer will be shown automatically.',
    },
    {
      id: 'TKT-010',
      date: '25.07.2026',
      subject: "I can't sign in — forgot my password",
      status: 'answered',
      reply: 'A password reset email has been sent. Check your Spam folder if it does not arrive within 5 minutes.',
    },
    {
      id: 'TKT-011',
      date: '28.07.2026',
      subject: 'Can I use Trading Prompt on my phone?',
      status: 'answered',
      reply:
        'Yes, the service is fully adapted for mobile devices. Open the site in your phone’s browser — everything works without installing an app.',
    },
    {
      id: 'TKT-012',
      date: '01.08.2026',
      subject: 'How many prompts can I build?',
      status: 'answered',
      reply:
        'Each finished prompt uses one credit. There is no time limit as long as you have credits on your balance.',
    },
    { id: 'TKT-013', date: '05.08.2026', subject: 'Where can I see my prompt history?', status: 'open', reply: '' },
    { id: 'TKT-014', date: '08.08.2026', subject: 'When will prompt history be available?', status: 'open', reply: '' },
    { id: 'TKT-015', date: '11.08.2026', subject: 'I want to change my referral link', status: 'open', reply: '' },
  ],
}

import type { Language } from '../i18n/translate'

type LegalDocument = { title: string; sections: { heading: string; text: string }[] }

export const LEGAL_DOCUMENTS: Record<Language, LegalDocument[]> = {
  ru: [
    {
      title: 'Политика конфиденциальности',
      sections: [
        {
          heading: '1. Общие положения',
          text: 'Настоящая Политика конфиденциальности определяет порядок сбора, хранения, использования и защиты информации, получаемой при использовании сайта. Используя сайт, пользователь подтверждает свое согласие с настоящей Политикой.',
        },
        {
          heading: '2. Какие данные мы собираем',
          text: 'При использовании сайта могут автоматически собираться: адрес электронной почты, имя пользователя, IP-адрес, тип устройства и браузера, данные файлов Cookie, история использования сервиса. Платёжные реквизиты банковских карт не собираются — оплата производится через сторонние платёжные сервисы.',
        },
        {
          heading: '3. Цели обработки данных',
          text: 'Информация используется для регистрации и авторизации, предоставления доступа к сервисам, повышения качества работы, обеспечения безопасности аккаунтов, предотвращения мошенничества и технической поддержки.',
        },
        {
          heading: '4. Использование файлов Cookie',
          text: 'Сайт использует Cookie для сохранения настроек, обеспечения корректной работы и анализа посещаемости. Пользователь может отключить Cookie в настройках браузера, однако это может повлиять на работу отдельных функций.',
        },
        {
          heading: '5. Передача данных третьим лицам',
          text: 'Персональные данные не продаются и не передаются третьим лицам, за исключением случаев, предусмотренных законодательством, а также для работы сервисов, обеспечивающих функционирование сайта (хостинг, аналитика, обработка платежей).',
        },
        {
          heading: '6. Защита информации',
          text: 'Администрация принимает организационные и технические меры для защиты данных пользователей от несанкционированного доступа. Однако ни один способ передачи данных через Интернет не может гарантировать абсолютную безопасность.',
        },
        {
          heading: '7. Права пользователя',
          text: 'Пользователь вправе запросить удаление учётной записи, изменить регистрационные данные, отказаться от информационных сообщений, обратиться в поддержку по вопросам обработки персональных данных.',
        },
        {
          heading: '8. Изменение политики',
          text: 'Администрация вправе изменять настоящую Политику без предварительного уведомления. Новая редакция вступает в силу с момента её публикации на сайте.',
        },
      ],
    },
    {
      title: 'Пользовательское соглашение',
      sections: [
        {
          heading: '1. Общие положения',
          text: 'Настоящее Пользовательское соглашение регулирует отношения между Администрацией сайта и Пользователем. Использование сайта означает полное и безоговорочное принятие настоящего Соглашения.',
        },
        {
          heading: '2. Предмет соглашения',
          text: 'Сайт предоставляет пользователям инструменты для сбора рыночных данных и формирования аналитических промптов, а также доступ к статистическим и информационным материалам. Все материалы предоставляются исключительно в информационных целях.',
        },
        {
          heading: '3. Регистрация',
          text: 'Пользователь обязуется предоставлять достоверную информацию, не передавать доступ к аккаунту третьим лицам и самостоятельно обеспечивать сохранность логина и пароля. Все действия через учётную запись считаются совершёнными самим пользователем.',
        },
        {
          heading: '4. Использование сервиса',
          text: 'Пользователь обязуется соблюдать законодательство, не использовать сайт для противоправных действий, не нарушать работу сервиса и не копировать материалы без разрешения администрации.',
        },
        {
          heading: '5. Интеллектуальная собственность',
          text: 'Все материалы сайта, включая алгоритмы формирования промптов, дизайн, логотипы, тексты, изображения и базы данных, являются объектами интеллектуальной собственности и охраняются законодательством.',
        },
        {
          heading: '6. Ограничение ответственности',
          text: 'Администрация не гарантирует получение прибыли при использовании сформированных промптов и не несёт ответственности за финансовые потери пользователя.',
        },
        {
          heading: '7. Приостановление доступа',
          text: 'Администрация вправе без предварительного уведомления ограничить доступ, приостановить работу сайта или удалить учётную запись в случае нарушения настоящего Соглашения.',
        },
        {
          heading: '8. Изменение соглашения',
          text: 'Администрация вправе изменять Соглашение в любое время. Новая редакция вступает в силу с момента публикации. Продолжение использования сайта означает согласие с новой редакцией.',
        },
      ],
    },
  ],
  en: [
    {
      title: 'Privacy Policy',
      sections: [
        {
          heading: '1. General provisions',
          text: 'This Privacy Policy defines how information obtained through the use of the website is collected, stored, used and protected. By using the website, the user confirms their consent to this Policy.',
        },
        {
          heading: '2. What data we collect',
          text: 'While you use the website, the following may be collected automatically: email address, user name, IP address, device and browser type, cookie data and service usage history. Bank card details are not collected — payments are processed by third-party payment services.',
        },
        {
          heading: '3. Why we process data',
          text: 'The information is used for registration and sign-in, providing access to the services, improving the quality of the service, keeping accounts secure, preventing fraud and technical support.',
        },
        {
          heading: '4. Use of cookies',
          text: 'The website uses cookies to save settings, keep the site working correctly and analyse traffic. You can disable cookies in your browser settings, but some features may then stop working.',
        },
        {
          heading: '5. Sharing data with third parties',
          text: 'Personal data is not sold or passed on to third parties, except where required by law and for services that keep the website running (hosting, analytics, payment processing).',
        },
        {
          heading: '6. Information security',
          text: 'The administration takes organisational and technical measures to protect user data from unauthorised access. However, no method of transmitting data over the Internet can guarantee absolute security.',
        },
        {
          heading: '7. User rights',
          text: 'Users may request deletion of their account, change their registration details, opt out of informational messages and contact support about the processing of personal data.',
        },
        {
          heading: '8. Changes to the policy',
          text: 'The administration may change this Policy without prior notice. The new version takes effect from the moment it is published on the website.',
        },
      ],
    },
    {
      title: 'User Agreement',
      sections: [
        {
          heading: '1. General provisions',
          text: 'This User Agreement governs the relationship between the website administration and the user. Using the website means full and unconditional acceptance of this Agreement.',
        },
        {
          heading: '2. Subject of the agreement',
          text: 'The website provides users with tools for collecting market data and building analytical prompts, as well as access to statistical and informational materials. All materials are provided for information purposes only.',
        },
        {
          heading: '3. Registration',
          text: 'The user undertakes to provide accurate information, not to share access to the account with third parties and to keep their login and password safe. All actions performed through the account are considered to be performed by the user.',
        },
        {
          heading: '4. Use of the service',
          text: 'The user undertakes to comply with the law, not to use the website for unlawful purposes, not to disrupt the service and not to copy materials without the permission of the administration.',
        },
        {
          heading: '5. Intellectual property',
          text: 'All website materials, including the prompt-building algorithms, design, logos, texts, images and databases, are intellectual property and are protected by law.',
        },
        {
          heading: '6. Limitation of liability',
          text: 'The administration does not guarantee any profit from using the generated prompts and is not liable for the user’s financial losses.',
        },
        {
          heading: '7. Suspension of access',
          text: 'The administration may, without prior notice, restrict access, suspend the website or delete an account if this Agreement is violated.',
        },
        {
          heading: '8. Changes to the agreement',
          text: 'The administration may change the Agreement at any time. The new version takes effect from the moment of publication. Continued use of the website means acceptance of the new version.',
        },
      ],
    },
  ],
}

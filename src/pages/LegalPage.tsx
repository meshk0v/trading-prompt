import PageHeader from '../components/PageHeader'
import { LEGAL_DOCUMENTS } from '../data/legal'
import { useI18n } from '../i18n/context'
import './LegalPage.css'

export default function LegalPage({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()

  return (
    <div className="legal-page message-fade scrollable">
      <PageHeader
        icon={
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 1.5L2 4v4c0 3.3 2.5 5.7 6 6.5 3.5-.8 6-3.2 6-6.5V4L8 1.5z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 8l2 2 3-3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title={t('Правовая информация')}
        description={t('Пользовательское соглашение и политика конфиденциальности')}
        onClose={onClose}
      />

      <div className="legal-page__content">
        {/* Russian texts are the keys; English and texts changed in the admin come from t(). */}
        {LEGAL_DOCUMENTS.ru.map(document => (
          <section key={document.title} className="legal-document">
            <h2>{t(document.title)}</h2>
            <div className="legal-document__sections">
              {document.sections.map(section => (
                <div key={section.heading}>
                  <h3>{t(section.heading)}</h3>
                  <p>{t(section.text)}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

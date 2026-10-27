import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n/context'
import { tr } from '../i18n/translate'
import './PromptBuilderGuide.css'

type PromptBuilderGuideProps = {
  isAuthenticated: boolean
  /** Signed-in users: the guide was already finished on some device (stored in the database). */
  authGuideCompleted: boolean
  /** Called when a signed-in user finishes or skips the guide. */
  onAuthGuideComplete: () => void
  menuOpen: boolean
  mobileSettingsOpen: boolean
  onOpenMenu: () => void
  onCloseMenu: () => void
  onOpenMobileSettings: () => void
  onCloseMobileSettings: () => void
}

type GuideStep = {
  target: string
  title: string
  description: string
  beforeEnter?: 'open-settings' | 'close-settings' | 'open-menu' | 'close-menu'
}

const GUEST_GUIDE_STORAGE_KEY = 'trading-prompt-builder-guide-guest-v3'
/** Older builds remembered the signed-in guide in the browser; such a mark is moved to the account once. */
const LEGACY_AUTH_GUIDE_STORAGE_KEY = 'trading-prompt-builder-guide-auth-v1'

/** localStorage can throw (private mode, blocked storage). */
function readStorage(key: string): boolean {
  try {
    return Boolean(localStorage.getItem(key))
  } catch {
    return false
  }
}

const FIELD_STEPS: GuideStep[] = [
  {
    target: 'asset-type',
    title: tr('Тип инструмента'),
    description: tr('Выберите тип инструмента. Доступны валютные и криптопары.'),
  },
  {
    target: 'currency-pair',
    title: tr('Инструмент'),
    description: tr('Выберите инструмент из списка. Сбор промпта будет произведён по выбранному вами инструменту.'),
  },
  {
    target: 'bar-count',
    title: tr('Объём данных в промпте'),
    description: tr('Отдельно задайте глубину истории цены и индикаторов, затем выберите до трёх таймфреймов.'),
  },
  {
    target: 'timeframe-1',
    title: tr('Основной таймфрейм'),
    description: tr('Главный период графика, который обязательно попадёт в готовый промпт.'),
  },
  {
    target: 'timeframe-2',
    title: tr('Дополнительный таймфрейм'),
    description: tr('Необязательный период для сравнения движения цены на другом масштабе.'),
  },
  {
    target: 'timeframe-3',
    title: tr('Третий таймфрейм'),
    description: tr('Ещё один необязательный период для расширенного мультифреймового контекста.'),
  },
  {
    target: 'prompt-purpose',
    title: tr('Дополнение к промпту'),
    description: tr(
      'В это поле можно заранее ввести начало промпта или добавить собственную задачу, сценарий, уровни, риски и желаемый формат ответа. Текст будет размещён в начале готового промпта. Например: «Сделай прогноз, куда цена пойдёт в ближайший час».',
    ),
  },
]

const CREATE_PROMPT_STEP: GuideStep = {
  target: 'create-prompt',
  title: tr('Собрать промпт'),
  description: tr('Когда параметры готовы, нажмите эту кнопку — система соберёт промпт со всеми необходимыми данными.'),
}

const READY_PROMPT_STEP: GuideStep = {
  target: 'prompt-result',
  title: tr('Готовый промпт'),
  description: tr(
    'После нажатия кнопки «Собрать промпт» в этом окне появится структурированный промпт с рыночными данными. Вы можете скопировать его или скачать в виде файла и отправить в любую удобную для вас нейросеть, чтобы получить прогноз.',
  ),
}

function findVisibleTarget(target: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-prompt-guide="${target}"]`)).find(element => {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
  })
}

export default function PromptBuilderGuide({
  isAuthenticated,
  authGuideCompleted,
  onAuthGuideComplete,
  menuOpen,
  mobileSettingsOpen,
  onOpenMenu,
  onCloseMenu,
  onOpenMobileSettings,
  onCloseMobileSettings,
}: PromptBuilderGuideProps) {
  const { t } = useI18n()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [cardHeight, setCardHeight] = useState(190)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches)

  const steps = useMemo<GuideStep[]>(() => {
    const menuSteps: GuideStep[] = [
      {
        target: 'main-menu',
        title: tr('Кнопка меню'),
        description: isAuthenticated
          ? tr('Откройте меню, чтобы перейти к аккаунту, кредитам, настройкам и другим разделам сервиса.')
          : tr('Откройте меню, чтобы войти в аккаунт и перейти к дополнительным разделам сайта.'),
      },
      {
        target: isAuthenticated ? 'authorized-menu-items' : 'guest-menu-items',
        title: isAuthenticated ? tr('Меню пользователя') : tr('Разделы сайта'),
        description: isAuthenticated
          ? tr(
              'Здесь находятся аккаунт, кредиты, настройки промпта, партнёрская программа, поддержка, календарь и другие разделы.',
            )
          : tr(
              'Здесь можно войти, открыть ссылки на нейросети, партнёрскую программу, ответы на вопросы и правовую информацию.',
            ),
        beforeEnter: 'open-menu',
      },
    ]

    const builderSteps: GuideStep[] = isMobile
      ? [
          {
            target: 'mobile-settings',
            title: tr('Настройки конструктора'),
            description: tr('Все параметры промпта находятся здесь. Нажмите «Далее», и мы откроем настройки.'),
          },
          { ...FIELD_STEPS[0], beforeEnter: 'open-settings' },
          ...FIELD_STEPS.slice(1),
          { ...CREATE_PROMPT_STEP, beforeEnter: 'close-settings' },
          READY_PROMPT_STEP,
        ]
      : [...FIELD_STEPS, CREATE_PROMPT_STEP, READY_PROMPT_STEP]

    if (builderSteps[0]) {
      builderSteps[0] = { ...builderSteps[0], beforeEnter: 'close-menu' }
    }

    return [...menuSteps, ...builderSteps]
  }, [isAuthenticated, isMobile])

  useEffect(() => {
    const mobileMedia = window.matchMedia('(max-width: 600px)')
    const handleMobileChange = () => setIsMobile(mobileMedia.matches)
    mobileMedia.addEventListener('change', handleMobileChange)

    return () => {
      mobileMedia.removeEventListener('change', handleMobileChange)
    }
  }, [])

  // Guests: remembered in this browser. Signed-in users: remembered in their account.
  useEffect(() => {
    if (isAuthenticated) {
      if (authGuideCompleted) return
      if (readStorage(LEGACY_AUTH_GUIDE_STORAGE_KEY)) {
        onAuthGuideComplete()
        return
      }
    } else if (readStorage(GUEST_GUIDE_STORAGE_KEY)) {
      return
    }

    const timer = setTimeout(() => {
      setStepIndex(0)
      setTargetRect(null)
      setActive(true)
    }, 650)
    return () => clearTimeout(timer)
  }, [isAuthenticated, authGuideCompleted, onAuthGuideComplete])

  useLayoutEffect(() => {
    if (!active) return

    let retryTimer: ReturnType<typeof setTimeout> | undefined
    const updateTarget = () => {
      const target = findVisibleTarget(steps[stepIndex]?.target)
      if (!target) {
        setTargetRect(null)
        retryTimer = setTimeout(updateTarget, 100)
        return
      }
      target.scrollIntoView({ block: 'center', inline: 'nearest' })
      setTargetRect(target.getBoundingClientRect())
    }

    const frame = requestAnimationFrame(updateTarget)
    const transitionTimer = setTimeout(updateTarget, 300)
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget, true)
    // Pinch zoom and panning on phones move the visual viewport without a window scroll or resize.
    window.visualViewport?.addEventListener('resize', updateTarget)
    window.visualViewport?.addEventListener('scroll', updateTarget)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(transitionTimer)
      if (retryTimer) clearTimeout(retryTimer)
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget, true)
      window.visualViewport?.removeEventListener('resize', updateTarget)
      window.visualViewport?.removeEventListener('scroll', updateTarget)
    }
  }, [active, menuOpen, mobileSettingsOpen, stepIndex, steps])

  useLayoutEffect(() => {
    if (!active || !targetRect || !cardRef.current) return

    const measuredHeight = cardRef.current.getBoundingClientRect().height
    if (Math.abs(measuredHeight - cardHeight) > 1) setCardHeight(measuredHeight)
  }, [active, cardHeight, stepIndex, targetRect])

  const finishGuide = () => {
    if (isAuthenticated) {
      onAuthGuideComplete()
    } else {
      try {
        localStorage.setItem(GUEST_GUIDE_STORAGE_KEY, 'seen')
      } catch {
        // The tour can still be dismissed when storage is unavailable.
      }
    }
    if (isMobile && mobileSettingsOpen) onCloseMobileSettings()
    if (menuOpen) onCloseMenu()
    setActive(false)
  }

  const goNext = () => {
    const nextStep = steps[stepIndex + 1]
    if (!nextStep) {
      finishGuide()
      return
    }
    if (nextStep.beforeEnter === 'open-settings') onOpenMobileSettings()
    if (nextStep.beforeEnter === 'close-settings') onCloseMobileSettings()
    if (nextStep.beforeEnter === 'open-menu') onOpenMenu()
    if (nextStep.beforeEnter === 'close-menu') onCloseMenu()
    setTargetRect(null)
    setStepIndex(index => index + 1)
  }

  if (!active || !targetRect || !steps[stepIndex]) return null

  const step = steps[stepIndex]
  const cardWidth = Math.min(340, window.innerWidth - 24)
  const placeBelow = targetRect.bottom + cardHeight + 18 < window.innerHeight
  const cardTop = placeBelow ? targetRect.bottom + 12 : Math.max(12, targetRect.top - cardHeight - 12)
  const cardLeft = Math.min(
    window.innerWidth - cardWidth - 12,
    Math.max(12, targetRect.left + targetRect.width / 2 - cardWidth / 2),
  )

  return createPortal(
    <>
      <div className="prompt-guide-blocker" />
      <div
        className="prompt-guide-highlight"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
      />
      <div
        ref={cardRef}
        className="prompt-guide-card"
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={t('Шаг {current} из {total}: {title}', {
          current: stepIndex + 1,
          total: steps.length,
          title: t(step.title),
        })}
        style={{ top: cardTop, left: cardLeft, width: cardWidth }}
      >
        <div className="prompt-guide-progress">
          <span>{isAuthenticated ? t('Знакомство с аккаунтом') : t('Знакомство с сервисом')}</span>
          <span>
            {stepIndex + 1}/{steps.length}
          </span>
        </div>
        <h2>{t(step.title)}</h2>
        <p>{t(step.description)}</p>
        <div className="prompt-guide-actions">
          <button type="button" className="prompt-guide-skip" onClick={finishGuide}>
            {t('Пропустить')}
          </button>
          <button type="button" className="prompt-guide-next" onClick={goNext}>
            {stepIndex === steps.length - 1 ? t('Готово') : t('Далее')}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

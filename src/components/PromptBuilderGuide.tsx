import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type PromptBuilderGuideProps = {
  isAuthenticated: boolean
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
const AUTH_GUIDE_STORAGE_KEY = 'trading-prompt-builder-guide-auth-v1'

const FIELD_STEPS: GuideStep[] = [
  { target: 'asset-type', title: 'Тип инструмента', description: 'Выберите тип инструмента. Доступны валютные и криптопары.' },
  { target: 'currency-pair', title: 'Инструмент', description: 'Выберите инструмент из списка. Сбор промпта будет произведён по выбранному вами инструменту.' },
  { target: 'bar-count', title: 'Объём данных в промпте', description: 'Отдельно задайте глубину истории цены и индикаторов, затем выберите до трёх таймфреймов.' },
  { target: 'timeframe-1', title: 'Основной таймфрейм', description: 'Главный период графика, который обязательно попадёт в готовый промпт.' },
  { target: 'timeframe-2', title: 'Дополнительный таймфрейм', description: 'Необязательный период для сравнения движения цены на другом масштабе.' },
  { target: 'timeframe-3', title: 'Третий таймфрейм', description: 'Ещё один необязательный период для расширенного мультифреймового контекста.' },
  {
    target: 'prompt-purpose',
    title: 'Дополнение к промпту',
    description: 'В это поле можно заранее ввести начало промпта или добавить собственную задачу, сценарий, уровни, риски и желаемый формат ответа. Текст будет размещён в начале готового промпта. Например: «Сделай прогноз, куда цена пойдёт в ближайший час».',
  },
]

const CREATE_PROMPT_STEP: GuideStep = {
  target: 'create-prompt',
  title: 'Собрать промпт',
  description: 'Когда параметры готовы, нажмите эту кнопку — система соберёт промпт со всеми необходимыми данными.',
}

const READY_PROMPT_STEP: GuideStep = {
  target: 'prompt-result',
  title: 'Готовый промпт',
  description: 'После нажатия кнопки «Собрать промпт» в этом окне появится структурированный промпт с рыночными данными. Вы можете скопировать его или скачать в виде файла и отправить в любую удобную для вас нейросеть, чтобы получить прогноз.',
}

function findVisibleTarget(target: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-prompt-guide="${target}"]`))
    .find(element => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    })
}

export default function PromptBuilderGuide({
  isAuthenticated,
  menuOpen,
  mobileSettingsOpen,
  onOpenMenu,
  onCloseMenu,
  onOpenMobileSettings,
  onCloseMobileSettings,
}: PromptBuilderGuideProps) {
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
        title: 'Кнопка меню',
        description: isAuthenticated
          ? 'Откройте меню, чтобы перейти к аккаунту, кредитам, настройкам и другим разделам сервиса.'
          : 'Откройте меню, чтобы войти в аккаунт и перейти к дополнительным разделам сайта.',
      },
      {
        target: isAuthenticated ? 'authorized-menu-items' : 'guest-menu-items',
        title: isAuthenticated ? 'Меню пользователя' : 'Разделы сайта',
        description: isAuthenticated
          ? 'Здесь находятся аккаунт, кредиты, настройки промпта, партнёрская программа, поддержка, календарь и другие разделы.'
          : 'Здесь можно войти, открыть ссылки на нейросети, партнёрскую программу, ответы на вопросы и правовую информацию.',
        beforeEnter: 'open-menu',
      },
    ]

    const builderSteps: GuideStep[] = isMobile
      ? [
        { target: 'mobile-settings', title: 'Настройки конструктора', description: 'Все параметры промпта находятся здесь. Нажмите «Далее», и мы откроем настройки.', },
        { ...FIELD_STEPS[0], beforeEnter: 'open-settings' },
        ...FIELD_STEPS.slice(1),
        { ...CREATE_PROMPT_STEP, beforeEnter: 'close-settings' },
        READY_PROMPT_STEP,
      ]
    : [
        ...FIELD_STEPS,
        CREATE_PROMPT_STEP,
        READY_PROMPT_STEP,
      ]

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

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const storageKey = isAuthenticated ? AUTH_GUIDE_STORAGE_KEY : GUEST_GUIDE_STORAGE_KEY
    try {
      if (!localStorage.getItem(storageKey)) {
        timer = setTimeout(() => {
          setStepIndex(0)
          setTargetRect(null)
          setActive(true)
        }, 650)
      }
    } catch {
      timer = setTimeout(() => {
        setStepIndex(0)
        setTargetRect(null)
        setActive(true)
      }, 650)
    }

    return () => { if (timer) clearTimeout(timer) }
  }, [isAuthenticated])

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
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(transitionTimer)
      if (retryTimer) clearTimeout(retryTimer)
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget, true)
    }
  }, [active, menuOpen, mobileSettingsOpen, stepIndex, steps])

  useLayoutEffect(() => {
    if (!active || !targetRect || !cardRef.current) return

    const measuredHeight = cardRef.current.getBoundingClientRect().height
    if (Math.abs(measuredHeight - cardHeight) > 1) setCardHeight(measuredHeight)
  }, [active, cardHeight, stepIndex, targetRect])

  const finishGuide = () => {
    try {
      localStorage.setItem(
        isAuthenticated ? AUTH_GUIDE_STORAGE_KEY : GUEST_GUIDE_STORAGE_KEY,
        'seen',
      )
    } catch {
      // The tour can still be dismissed when storage is unavailable.
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
  const cardTop = placeBelow
    ? targetRect.bottom + 12
    : Math.max(12, targetRect.top - cardHeight - 12)
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
        aria-label={`Шаг ${stepIndex + 1} из ${steps.length}: ${step.title}`}
        style={{ top: cardTop, left: cardLeft, width: cardWidth }}
      >
        <div className="prompt-guide-progress">
          <span>{isAuthenticated ? 'Знакомство с аккаунтом' : 'Знакомство с сервисом'}</span>
          <span>{stepIndex + 1}/{steps.length}</span>
        </div>
        <h2>{step.title}</h2>
        <p>{step.description}</p>
        <div className="prompt-guide-actions">
          <button type="button" className="prompt-guide-skip" onClick={finishGuide}>Пропустить</button>
          <button type="button" className="prompt-guide-next" onClick={goNext}>
            {stepIndex === steps.length - 1 ? 'Готово' : 'Далее'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

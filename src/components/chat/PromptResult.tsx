import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { AI_LINKS } from '../../navigation'
import type { ChartRef } from '../../types'
import { createPromptPdf } from '../../utils/promptPdf'
import { CopyIcon, DownloadIcon, ExternalLinkIcon } from '../icons'
import PromptTradingView from '../TradingViewChart'

function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/** Chart, prompt text and export buttons under a generated prompt. */
export default function PromptResult({ prompt, chart }: { prompt: string; chart: ChartRef }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [pdfFailed, setPdfFailed] = useState(false)

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setCopyFailed(false)
    } catch {
      setCopied(false)
      setCopyFailed(true)
    }
  }

  const downloadPdf = async () => {
    try {
      downloadFile(await createPromptPdf(prompt), 'binum-prompt.pdf')
      setPdfFailed(false)
    } catch {
      setPdfFailed(true)
    }
  }

  const downloadTxt = () => downloadFile(new Blob([prompt], { type: 'text/plain;charset=utf-8' }), 'binum-prompt.txt')

  // Each export button sits above a link to one of the AI chats.
  const actions = [
    {
      onClick: copyText,
      className: `prompt-export__button ${copied ? 'prompt-export__button--done' : 'prompt-export__button--primary'}`,
      icon: <CopyIcon />,
      label: copied ? t('Текст скопирован') : t('Копировать текст'),
      shortLabel: t('Текст'),
    },
    { onClick: downloadPdf, className: 'prompt-export__button', icon: <DownloadIcon />, label: t('Скачать PDF'), shortLabel: 'PDF' },
    { onClick: downloadTxt, className: 'prompt-export__button', icon: <DownloadIcon />, label: t('Скачать TXT'), shortLabel: 'TXT' },
  ]

  return (
    <div className="prompt-result">
      <PromptTradingView pair={chart.pair} timeframe={chart.timeframe} />
      <pre className="prompt-result__text">{prompt}</pre>

      <div className="prompt-export">
        {actions.map((action, index) => (
          <div key={AI_LINKS[index].label} className="prompt-export__action">
            <button type="button" onClick={action.onClick} className={action.className}>
              {action.icon}
              <span className="prompt-export__label">{action.label}</span>
              <span className="prompt-export__short-label">{action.shortLabel}</span>
            </button>
            <a
              href={AI_LINKS[index].href}
              target="_blank"
              rel="noreferrer"
              className="prompt-export__ai-link"
              aria-label={t('Открыть {name} в новой вкладке', { name: AI_LINKS[index].label })}
            >
              <ExternalLinkIcon size={13} strokeWidth={1.5} />
              {AI_LINKS[index].label}
            </a>
          </div>
        ))}
      </div>

      {copyFailed && (
        <p role="alert" className="prompt-result__error">
          {t('Не удалось скопировать автоматически. Выделите текст промпта и скопируйте вручную.')}
        </p>
      )}
      {pdfFailed && (
        <p role="alert" className="prompt-result__error">
          {t('Не удалось обработать PDF. Копирование PDF поддерживается не всеми браузерами; попробуйте скачать его.')}
        </p>
      )}
    </div>
  )
}

type MessageContentProps = {
  text: string
  muted?: boolean
  compactParagraphs?: boolean
}

export default function MessageContent({ text, muted = false, compactParagraphs = false }: MessageContentProps) {
  const normalizedText = compactParagraphs ? text.replace(/\n[ \t]*\n/g, '\n') : text
  const lines = normalizedText.split('\n')

  return (
    <div style={{ fontSize: '14px', lineHeight: '1.75', color: muted ? 'var(--muted)' : 'var(--text2)' }}>
      {lines.map((line, lineIndex) => {
        const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g)

        return (
          <span key={lineIndex}>
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIndex} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
              }

              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code
                    key={partIndex}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.85em',
                      background: 'var(--border)',
                      color: 'var(--text)',
                      padding: '1px 6px',
                      borderRadius: '2px',
                    }}
                  >
                    {part.slice(1, -1)}
                  </code>
                )
              }

              return <span key={partIndex}>{part}</span>
            })}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        )
      })}
    </div>
  )
}

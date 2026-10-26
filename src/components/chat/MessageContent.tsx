type MessageContentProps = {
  text: string
  muted?: boolean
  /** Collapse blank lines between paragraphs. */
  compactParagraphs?: boolean
}

/** Renders chat text with line breaks, **bold** and `code` markers. */
export default function MessageContent({ text, muted = false, compactParagraphs = false }: MessageContentProps) {
  const normalizedText = compactParagraphs ? text.replace(/\n[ \t]*\n/g, '\n') : text
  const lines = normalizedText.split('\n')

  return (
    <div className={`message-text${muted ? ' message-text--muted' : ''}`}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex}>
          {line.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={partIndex}>{part.slice(2, -2)}</strong>
            if (part.startsWith('`') && part.endsWith('`')) return <code key={partIndex}>{part.slice(1, -1)}</code>
            return <span key={partIndex}>{part}</span>
          })}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  )
}

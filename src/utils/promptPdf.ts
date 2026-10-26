// Render Unicode text onto PDF pages so Cyrillic works without an external font file.
export async function createPromptPdf(text: string): Promise<Blob> {
  const width = 1240
  const height = 1754
  const margin = 90
  const lineHeight = 35
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('PDF canvas is unavailable')

  context.font = '24px Arial, sans-serif'
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (!paragraph) { lines.push(''); continue }
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (context.measureText(next).width <= width - margin * 2) {
        line = next
        continue
      }
      if (line) lines.push(line)
      line = ''
      for (const char of Array.from(word)) {
        if (context.measureText(line + char).width > width - margin * 2 && line) {
          lines.push(line)
          line = ''
        }
        line += char
      }
    }
    lines.push(line)
  }

  const linesPerPage = Math.floor((height - margin * 2) / lineHeight)
  const pages: Uint8Array[] = []
  for (let offset = 0; offset < lines.length; offset += linesPerPage) {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.fillStyle = '#171717'
    context.font = '24px Arial, sans-serif'
    lines.slice(offset, offset + linesPerPage).forEach((line, index) => {
      context.fillText(line, margin, margin + 24 + index * lineHeight)
    })
    const image = canvas.toDataURL('image/jpeg', 0.88)
    if (!image.startsWith('data:image/jpeg;base64,')) throw new Error('PDF image is unavailable')
    pages.push(Uint8Array.from(atob(image.slice(image.indexOf(',') + 1)), char => char.charCodeAt(0)))
  }

  const encoder = new TextEncoder()
  const parts: (Uint8Array | string)[] = []
  const offsets: number[] = [0]
  let length = 0
  const append = (part: Uint8Array | string) => {
    parts.push(part)
    length += typeof part === 'string' ? encoder.encode(part).length : part.length
  }
  const object = (id: number, body: (Uint8Array | string)[]) => {
    offsets[id] = length
    append(`${id} 0 obj\n`)
    body.forEach(append)
    append('\nendobj\n')
  }

  append('%PDF-1.4\n')
  object(1, ['<< /Type /Catalog /Pages 2 0 R >>'])
  object(2, [`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${pages.length} >>`])
  pages.forEach((jpeg, i) => {
    const pageId = 3 + i * 3
    const content = `q\n595 0 0 842 0 0 cm\n/Im${i} Do\nQ\n`
    object(pageId, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${pageId + 1} 0 R >> >> /Contents ${pageId + 2} 0 R >>`])
    object(pageId + 1, [`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream'])
    object(pageId + 2, [`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream`])
  })
  const xref = length
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`)
  offsets.slice(1).forEach(offset => append(`${String(offset).padStart(10, '0')} 00000 n \n`))
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  return new Blob(parts.map(part => typeof part === 'string' ? part : Uint8Array.from(part).buffer), { type: 'application/pdf' })
}

// Lists t('…') strings that have no English translation in src/i18n/en.ts,
// and dictionary entries that are no longer used anywhere.
// A key also counts as used when it appears as a plain string literal (data passed to t() later,
// e.g. FAQ items) or as an error message returned by the PHP API.
// Usage: npm run i18n:check
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(import.meta.dirname, '../src')
const API = path.resolve(import.meta.dirname, '../public/api')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

function unescape(text) {
  return text.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n')
}

const dictionarySource = fs.readFileSync(path.join(SRC, 'i18n/en.ts'), 'utf8')
const dictionary = new Set(
  [
    ...dictionarySource.matchAll(/^\s*'((?:[^'\\]|\\.)*)'\s*:/gm),
    ...dictionarySource.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm),
  ].map(m => unescape(m[1])),
)

const used = new Map()
for (const file of walk(SRC)) {
  if (file.endsWith(path.join('i18n', 'en.ts'))) continue
  const source = fs.readFileSync(file, 'utf8')
  // t('…'), t("…") and translatable data marked with tr('…')
  for (const match of source.matchAll(/\b(?:t|tr)\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
    const key = unescape(match[2])
    if (!/[А-Яа-яЁё]/.test(key)) continue
    if (!used.has(key)) used.set(key, path.relative(SRC, file))
  }
}

const referenced = new Set(used.keys())
const sources = [
  ...walk(SRC).filter(file => !file.endsWith(path.join('i18n', 'en.ts'))),
  ...fs
    .readdirSync(API)
    .filter(name => name.endsWith('.php'))
    .map(name => path.join(API, name)),
]
for (const file of sources) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(/(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g)) referenced.add(unescape(match[2]))
}

const missing = [...used].filter(([key]) => !dictionary.has(key))
const unused = [...dictionary].filter(key => !referenced.has(key))

for (const [key, file] of missing) console.log(`missing  ${file}: ${JSON.stringify(key)}`)
if (process.argv.includes('--unused')) for (const key of unused) console.log(`unused   ${JSON.stringify(key)}`)
console.log(
  `\n${used.size} strings in code, ${missing.length} without English translation, ${unused.length} unused dictionary entries`,
)
process.exitCode = missing.length ? 1 : 0

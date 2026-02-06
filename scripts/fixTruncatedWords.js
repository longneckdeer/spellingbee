import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_KEYS = {
  learners: process.env.MW_LEARNERS_KEY || ''
}

const API_URL = 'https://www.dictionaryapi.com/api/v3/references/learners/json'

console.log('🔧 Fixing Truncated Words\n')

const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')

const fixes = [
  { file: 'middle.json', oldWord: 'labo', newWord: 'labor' },
  { file: 'middle.json', oldWord: 'referen', newWord: 'reference' },
  { file: 'high.json', oldWord: 'intelligenc', newWord: 'intelligence' }
]

function convertPartOfSpeech(englishPOS) {
  const map = {
    'verb': '動詞',
    'noun': '名詞',
    'adjective': '形容詞',
    'adverb': '副詞'
  }
  return map[englishPOS] || '名詞'
}

function extractExample(vis) {
  if (!vis || !Array.isArray(vis) || vis.length === 0) return null
  const firstVi = vis[0]
  if (firstVi && firstVi.t) {
    return firstVi.t
      .replace(/\{wi\}(.*?)\{\/wi\}/g, '$1')
      .replace(/\{it\}(.*?)\{\/it\}/g, '$1')
      .replace(/\{[^}]+\}/g, '')
      .trim()
  }
  return null
}

async function fetchWord(word) {
  const url = `${API_URL}/${encodeURIComponent(word)}?key=${API_KEYS.learners}`
  const response = await fetch(url)
  const data = await response.json()

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0].meta) {
    const entry = data[0]
    const fl = entry.fl || 'noun'
    const definition = entry.shortdef?.[0] || ''

    let example = null
    if (entry.def?.[0]?.sseq) {
      const firstSense = entry.def[0].sseq[0]
      if (firstSense?.[0]?.[1]?.dt) {
        for (const item of firstSense[0][1].dt) {
          if (item[0] === 'vis') {
            example = extractExample(item[1])
            if (example) break
          }
        }
      }
    }

    return {
      word,
      definition,
      sentence: example || `I ${word} every day.`,
      partOfSpeech: convertPartOfSpeech(fl)
    }
  }

  return null
}

async function fixFile(filename, oldWord, newWord) {
  const filePath = path.join(dataDir, filename)
  console.log(`\nFixing ${filename}: "${oldWord}" → "${newWord}"`)

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const index = data.findIndex(e => e.word === oldWord)

  if (index === -1) {
    console.log(`  ⚠️  Word "${oldWord}" not found in ${filename}`)
    return
  }

  console.log(`  Fetching data for "${newWord}"...`)
  const newEntry = await fetchWord(newWord)

  if (!newEntry) {
    console.log(`  ❌ Could not fetch "${newWord}" from API`)
    return
  }

  // Preserve language origin if it exists
  if (data[index].languageOrigin) {
    newEntry.languageOrigin = data[index].languageOrigin
  }

  data[index] = newEntry

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  console.log(`  ✅ Fixed: ${newWord}`)
  console.log(`     Definition: ${newEntry.definition.substring(0, 60)}...`)
  console.log(`     Sentence: ${newEntry.sentence.substring(0, 60)}...`)
}

async function main() {
  for (const fix of fixes) {
    await fixFile(fix.file, fix.oldWord, fix.newWord)
    await new Promise(resolve => setTimeout(resolve, 200)) // Rate limiting
  }

  console.log('\n✅ All truncated words fixed!')
}

main()

/**
 * Integrate ECDICT Chinese translations into dictionary files
 *
 * This script reads ECDICT SQLite database and adds Chinese translations
 * to all words in our dictionary files.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as OpenCC from 'opencc-js'

const execPromise = promisify(exec)

// Initialize OpenCC converter (Simplified to Traditional Chinese - Taiwan standard)
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../src/gameTypes/english-spelling/data')
const ECDICT_DB = path.join(__dirname, '../data/ecdict/stardict.db')

const DICTIONARY_FILES = [
  'elementary.json',
  'middle.json',
  'high.json',
  'university.json',
  'expert.json'
]

// Query ECDICT for a word
async function lookupWord(word) {
  const sql = `SELECT word, translation, phonetic, pos FROM stardict WHERE word = '${word.replace(/'/g, "''")}'`
  const cmd = `sqlite3 "${ECDICT_DB}" "${sql}"`

  try {
    const { stdout } = await execPromise(cmd)

    if (!stdout.trim()) {
      return null
    }

    const [dbWord, translation, phonetic, pos] = stdout.trim().split('|')

    // Convert Simplified Chinese to Traditional Chinese (Taiwan standard)
    const traditionalChinese = translation ? converter(translation) : ''

    return {
      word: dbWord,
      chinese: traditionalChinese,
      phonetic: phonetic || '',
      pos: pos || ''
    }
  } catch (err) {
    console.error(`Error looking up "${word}":`, err.message)
    return null
  }
}

// Process a single dictionary file
async function processFile(filename) {
  const filePath = path.join(DATA_DIR, filename)
  console.log(`\nProcessing ${filename}...`)

  // Read file
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  let foundCount = 0
  let notFoundCount = 0
  let alreadyHasCount = 0

  // Process each word
  for (let i = 0; i < data.length; i++) {
    const word = data[i]

    // Skip if already has Chinese translation
    if (word.chinese) {
      alreadyHasCount++
      continue
    }

    // Look up in ECDICT
    const result = await lookupWord(word.word)

    if (result && result.chinese) {
      word.chinese = result.chinese
      word.phonetic_ipa = result.phonetic
      foundCount++

      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${data.length} (Found: ${foundCount}, Not found: ${notFoundCount})`)
      }
    } else {
      notFoundCount++
      console.log(`  ✗ Not found: "${word.word}"`)
    }

    // Save progress every 100 words
    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      console.log(`  Progress saved (${i + 1}/${data.length})`)
    }
  }

  // Save final results
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`\n${filename} complete:`)
  console.log(`  ✓ Found: ${foundCount}`)
  console.log(`  ✗ Not found: ${notFoundCount}`)
  console.log(`  ⊙ Already had translation: ${alreadyHasCount}`)
  console.log(`  Total: ${data.length}`)

  return { foundCount, notFoundCount, alreadyHasCount, total: data.length }
}

async function main() {
  console.log('=== Integrating ECDICT Chinese Translations ===\n')
  console.log(`ECDICT database: ${ECDICT_DB}`)

  // Check if ECDICT database exists
  if (!fs.existsSync(ECDICT_DB)) {
    console.error('\n❌ ECDICT database not found!')
    console.error(`Expected location: ${ECDICT_DB}`)
    console.error('\nPlease download ECDICT first.')
    process.exit(1)
  }

  console.log('✓ ECDICT database found\n')

  const stats = {
    totalFound: 0,
    totalNotFound: 0,
    totalAlreadyHad: 0,
    totalWords: 0
  }

  for (const filename of DICTIONARY_FILES) {
    const result = await processFile(filename)
    stats.totalFound += result.foundCount
    stats.totalNotFound += result.notFoundCount
    stats.totalAlreadyHad += result.alreadyHasCount
    stats.totalWords += result.total
  }

  console.log('\n=== Summary ===')
  console.log(`Total words: ${stats.totalWords}`)
  console.log(`Translations found: ${stats.totalFound}`)
  console.log(`Not found: ${stats.totalNotFound}`)
  console.log(`Already had translation: ${stats.totalAlreadyHad}`)
  console.log(`Coverage: ${((stats.totalFound / (stats.totalWords - stats.totalAlreadyHad)) * 100).toFixed(1)}%`)

  // List words not found
  if (stats.totalNotFound > 0) {
    console.log('\n=== Words Not Found in ECDICT ===')
    console.log('(These may need manual translation or might be inflected forms)')
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
}

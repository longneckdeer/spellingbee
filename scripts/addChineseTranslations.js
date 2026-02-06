/**
 * Add Chinese translations to dictionary words
 *
 * This script fetches Chinese translations for English words and adds them
 * to the dictionary files. It does NOT modify the game logic yet.
 *
 * Translation services to try (in order):
 * 1. Google Translate (via googletrans-api - free, unofficial)
 * 2. MyMemory Translation API (free tier: 5000 chars/day)
 * 3. LibreTranslate (free, open source)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../src/gameTypes/english-spelling/data')
const DICTIONARY_FILES = [
  'elementary.json',
  'middle.json',
  'high.json',
  'university.json',
  'expert.json'
]

// MyMemory Translation API (free, no key required for basic usage)
// Limit: 5000 chars per day for anonymous usage
async function translateWithMyMemory(text, fromLang = 'en', toLang = 'zh-TW') {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText
    }

    throw new Error(`Translation failed: ${data.responseDetails || 'Unknown error'}`)
  } catch (err) {
    console.error(`MyMemory translation error for "${text}":`, err.message)
    return null
  }
}

// LibreTranslate API (free, open source, self-hostable)
// Using public instance: libretranslate.com
async function translateWithLibreTranslate(text, fromLang = 'en', toLang = 'zh') {
  const url = 'https://libretranslate.com/translate'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: fromLang,
        target: toLang,
        format: 'text'
      })
    })

    const data = await response.json()

    if (data.translatedText) {
      return data.translatedText
    }

    throw new Error(`Translation failed: ${data.error || 'Unknown error'}`)
  } catch (err) {
    console.error(`LibreTranslate translation error for "${text}":`, err.message)
    return null
  }
}

// Try multiple translation services
async function translate(text) {
  // Try MyMemory first (usually better for single words)
  let translation = await translateWithMyMemory(text)

  if (!translation) {
    // Fallback to LibreTranslate
    console.log(`  Trying LibreTranslate for "${text}"...`)
    translation = await translateWithLibreTranslate(text)
  }

  return translation
}

// Add delay between requests to respect rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processFile(filename) {
  const filePath = path.join(DATA_DIR, filename)
  console.log(`\nProcessing ${filename}...`)

  // Read file
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  let updatedCount = 0
  let errorCount = 0

  // Process each word
  for (let i = 0; i < data.length; i++) {
    const word = data[i]

    // Skip if already has Chinese translation
    if (word.chinese) {
      console.log(`  [${i + 1}/${data.length}] "${word.word}" - Already has translation`)
      continue
    }

    console.log(`  [${i + 1}/${data.length}] Translating "${word.word}"...`)

    // Get translation
    const translation = await translate(word.word)

    if (translation) {
      word.chinese = translation
      updatedCount++
      console.log(`    ✓ ${translation}`)
    } else {
      errorCount++
      console.log(`    ✗ Translation failed`)
    }

    // Add delay between requests (1 second)
    await delay(1000)

    // Save progress every 10 words
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      console.log(`  Progress saved (${i + 1}/${data.length})`)
    }
  }

  // Save final results
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`\n${filename} complete:`)
  console.log(`  ✓ Updated: ${updatedCount}`)
  console.log(`  ✗ Errors: ${errorCount}`)
  console.log(`  Total: ${data.length}`)

  return { updatedCount, errorCount, total: data.length }
}

async function main() {
  console.log('=== Adding Chinese Translations to Dictionary ===\n')
  console.log('Translation services:')
  console.log('  1. MyMemory API (free, 5000 chars/day)')
  console.log('  2. LibreTranslate API (free, open source)')
  console.log('\nNote: This will take a while due to rate limits (1 second per word)\n')

  const stats = {
    totalUpdated: 0,
    totalErrors: 0,
    totalWords: 0
  }

  for (const filename of DICTIONARY_FILES) {
    const result = await processFile(filename)
    stats.totalUpdated += result.updatedCount
    stats.totalErrors += result.errorCount
    stats.totalWords += result.total

    // Delay between files
    await delay(2000)
  }

  console.log('\n=== Summary ===')
  console.log(`Total words: ${stats.totalWords}`)
  console.log(`Translations added: ${stats.totalUpdated}`)
  console.log(`Errors: ${stats.totalErrors}`)
  console.log(`Success rate: ${((stats.totalUpdated / stats.totalWords) * 100).toFixed(1)}%`)
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
}

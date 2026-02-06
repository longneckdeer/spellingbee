import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// API Keys
const API_KEYS = {
  learners: process.env.MW_LEARNERS_KEY || '',
  collegiate: process.env.MW_COLLEGIATE_KEY || ''
}

const API_URLS = {
  learners: 'https://www.dictionaryapi.com/api/v3/references/learners/json',
  collegiate: 'https://www.dictionaryapi.com/api/v3/references/collegiate/json'
}

console.log('🔄 Replacing Dictionary Entries with Merriam-Webster API\n')
console.log('Using both Learner\'s and Collegiate dictionaries')
console.log('Rate limit: 2,000 words/day (1,000 per API key)')
console.log('Estimated time: 2-3 days for all 4,638 words\n')

const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
const progressFile = path.join(__dirname, 'mw_progress.json')

const levels = [
  { file: 'elementary.json', name: 'Elementary' },
  { file: 'middle.json', name: 'Middle School' },
  { file: 'high.json', name: 'High School' },
  { file: 'university.json', name: 'University' },
  { file: 'expert.json', name: 'Expert' }
]

// Statistics
const stats = {
  total: 0,
  foundInLearners: 0,
  foundInCollegiate: 0,
  notFound: 0,
  improved: 0,
  learnersApiCalls: 0,
  collegiateApiCalls: 0,
  startTime: Date.now()
}

const notFoundWords = []

// Load or create progress tracker
function loadProgress() {
  if (fs.existsSync(progressFile)) {
    return JSON.parse(fs.readFileSync(progressFile, 'utf8'))
  }
  return {
    processedWords: {},
    lastLevel: null,
    lastIndex: -1,
    totalProcessed: 0
  }
}

function saveProgress(progress) {
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2))
}

// Convert part of speech to Chinese
function convertPartOfSpeech(englishPOS) {
  const map = {
    'verb': '動詞',
    'noun': '名詞',
    'adjective': '形容詞',
    'adverb': '副詞',
    'preposition': '介詞',
    'conjunction': '連詞',
    'interjection': '感嘆詞',
    'pronoun': '代詞',
    'auxiliary verb': '助動詞',
    'transitive verb': '動詞',
    'intransitive verb': '動詞'
  }
  return map[englishPOS] || '名詞'
}

// Extract clean definition from Merriam-Webster format
function cleanDefinition(defText) {
  if (!defText) return ''

  // Remove {bc} (bold colon), {it} (italics), {wi} tags
  let clean = defText
    .replace(/\{bc\}/g, '')
    .replace(/\{it\}(.*?)\{\/it\}/g, '$1')
    .replace(/\{wi\}(.*?)\{\/wi\}/g, '$1')
    .replace(/\{phrase\}(.*?)\{\/phrase\}/g, '$1')
    .replace(/\{[^}]+\}/g, '') // Remove any other tags
    .trim()

  // Capitalize first letter
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1)
  }

  return clean
}

// Extract example sentence from verbal illustrations
function extractExample(vis) {
  if (!vis || !Array.isArray(vis) || vis.length === 0) return null

  const firstVi = vis[0]
  if (firstVi && firstVi.t) {
    // Remove {wi} tags and clean up
    return firstVi.t
      .replace(/\{wi\}(.*?)\{\/wi\}/g, '$1')
      .replace(/\{it\}(.*?)\{\/it\}/g, '$1')
      .replace(/\{[^}]+\}/g, '')
      .trim()
  }

  return null
}

// Fetch word from Merriam-Webster API
async function fetchFromMW(word, apiType = 'learners') {
  const url = `${API_URLS[apiType]}/${encodeURIComponent(word)}?key=${API_KEYS[apiType]}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return { found: false, status: response.status }
    }

    const data = await response.json()

    // Check if we got actual entries (not just suggestions)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0].meta) {
      return { found: true, data: data[0], apiType }
    }

    return { found: false, suggestions: Array.isArray(data) ? data : [] }
  } catch (error) {
    return { found: false, error: error.message }
  }
}

// Process a single word
async function processWord(word, originalEntry) {
  // Try Learner's Dictionary first
  let result = await fetchFromMW(word, 'learners')
  stats.learnersApiCalls++

  // If not found, try Collegiate Dictionary
  if (!result.found && stats.collegiateApiCalls < 1000) {
    await delay(100) // Small delay between API calls
    result = await fetchFromMW(word, 'collegiate')
    stats.collegiateApiCalls++
  }

  if (!result.found) {
    stats.notFound++
    notFoundWords.push(word)
    return originalEntry // Keep original
  }

  // Track which API found it
  if (result.apiType === 'learners') {
    stats.foundInLearners++
  } else {
    stats.foundInCollegiate++
  }

  const entry = result.data

  // Extract part of speech
  const fl = entry.fl || 'noun'

  // Extract definition (first shortdef or first sense)
  let definition = ''
  if (entry.shortdef && entry.shortdef.length > 0) {
    definition = entry.shortdef[0]
  } else if (entry.def && entry.def[0] && entry.def[0].sseq) {
    // Extract from sense sequence
    const firstSense = entry.def[0].sseq[0]
    if (firstSense && firstSense[0] && firstSense[0][1] && firstSense[0][1].dt) {
      const dt = firstSense[0][1].dt
      if (dt[0] && dt[0][1]) {
        definition = cleanDefinition(dt[0][1])
      }
    }
  }

  // Extract example sentence
  let example = null
  if (entry.def && entry.def[0] && entry.def[0].sseq) {
    const firstSense = entry.def[0].sseq[0]
    if (firstSense && firstSense[0] && firstSense[0][1] && firstSense[0][1].dt) {
      const dt = firstSense[0][1].dt
      // Look for verbal illustrations
      for (const item of dt) {
        if (item[0] === 'vis') {
          example = extractExample(item[1])
          if (example) break
        }
      }
    }
  }

  // Check if this is an improvement
  const isImprovement = (
    originalEntry.definition.includes('a person, place, thing, or concept') ||
    originalEntry.definition.includes('very interesting') ||
    originalEntry.definition.length < 20 ||
    originalEntry.sentence.includes('very interesting') ||
    originalEntry.sentence.includes('The weather is')
  )

  if (isImprovement) {
    stats.improved++
  }

  // Create new entry
  const newEntry = {
    word: word,
    definition: definition || originalEntry.definition,
    sentence: example || originalEntry.sentence,
    partOfSpeech: convertPartOfSpeech(fl)
  }

  // Preserve language origin if it exists
  if (originalEntry.languageOrigin) {
    newEntry.languageOrigin = originalEntry.languageOrigin
  }

  return newEntry
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processLevel(levelInfo, progress) {
  const filePath = path.join(dataDir, levelInfo.file)
  const backupPath = path.join(dataDir, `${levelInfo.file}.backup`)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Processing: ${levelInfo.name}`)
  console.log('='.repeat(60))

  // Create backup if not exists
  if (!fs.existsSync(backupPath)) {
    const originalData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    fs.writeFileSync(backupPath, JSON.stringify(originalData, null, 2))
    console.log(`✓ Backup created: ${backupPath}`)
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const updatedData = []

  // Determine starting index
  const startIndex = (progress.lastLevel === levelInfo.name) ? progress.lastIndex + 1 : 0

  for (let i = 0; i < data.length; i++) {
    const entry = data[i]
    const word = entry.word

    // Skip if already processed
    if (progress.processedWords[word]) {
      updatedData.push(progress.processedWords[word])
      continue
    }

    // Skip if before start index
    if (i < startIndex) {
      updatedData.push(entry)
      continue
    }

    stats.total++

    // Check daily limits (1000 per API key)
    if (stats.learnersApiCalls >= 1000 && stats.collegiateApiCalls >= 1000) {
      console.log('\n⚠️  Daily API limit reached (2,000 calls)')
      console.log('Progress has been saved. Run this script again tomorrow to continue.')

      // Add remaining entries as-is
      for (let j = i; j < data.length; j++) {
        updatedData.push(data[j])
      }

      // Save progress
      progress.lastLevel = levelInfo.name
      progress.lastIndex = i - 1
      progress.totalProcessed = stats.total
      saveProgress(progress)

      // Save partial results
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2))

      return false // Signal to stop
    }

    // Show progress
    if (stats.total % 50 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1)
      console.log(`  Progress: ${stats.total} words | ${stats.learnersApiCalls} learners calls | ${stats.collegiateApiCalls} collegiate calls | ${elapsed}m`)
    }

    // Process word
    const newEntry = await processWord(word, entry)
    updatedData.push(newEntry)

    // Save to progress
    progress.processedWords[word] = newEntry

    // Rate limiting: 100ms between calls
    await delay(100)

    // Save progress every 100 words
    if (stats.total % 100 === 0) {
      progress.lastLevel = levelInfo.name
      progress.lastIndex = i
      progress.totalProcessed = stats.total
      saveProgress(progress)
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2))
    }
  }

  // Save final results for this level
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2))
  console.log(`  ✓ Saved: ${filePath}`)

  return true // Continue to next level
}

async function main() {
  const progress = loadProgress()

  console.log(`Starting from: ${progress.totalProcessed || 0} words already processed\n`)

  try {
    for (const level of levels) {
      const shouldContinue = await processLevel(level, progress)
      if (!shouldContinue) {
        printSummary()
        return
      }
    }

    // All done!
    printSummary()

    // Clean up progress file
    if (fs.existsSync(progressFile)) {
      fs.unlinkSync(progressFile)
      console.log('\n✓ Progress file removed (all words processed)')
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Progress has been saved. You can re-run the script to continue.')
    process.exit(1)
  }
}

function printSummary() {
  const elapsedMinutes = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1)

  console.log(`\n${'='.repeat(60)}`)
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Words processed this session: ${stats.total}`)
  console.log(`Found in Learner's: ${stats.foundInLearners}`)
  console.log(`Found in Collegiate: ${stats.foundInCollegiate}`)
  console.log(`Not found: ${stats.notFound}`)
  console.log(`Improved entries: ${stats.improved}`)
  console.log(`API calls - Learner's: ${stats.learnersApiCalls}/1000`)
  console.log(`API calls - Collegiate: ${stats.collegiateApiCalls}/1000`)
  console.log(`Time elapsed: ${elapsedMinutes} minutes`)

  if (notFoundWords.length > 0) {
    const notFoundFile = path.join(__dirname, 'mw_not_found.json')
    fs.writeFileSync(notFoundFile, JSON.stringify(notFoundWords, null, 2))
    console.log(`\nNot found words saved to: ${notFoundFile}`)
  }

  if (stats.total < 4638) {
    console.log('\n⏸️  Paused due to daily limit. Run again tomorrow to continue.')
  } else {
    console.log('\n✅ All words processed!')
  }
}

main()

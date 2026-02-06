import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔄 Replacing Dictionary Entries with Free Dictionary API\n')
console.log('This will take approximately 2-3 hours with polite rate limiting (200ms delay)')
console.log('Progress will be saved periodically.\n')

const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
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
  found: 0,
  notFound: 0,
  improved: 0,
  errors: 0,
  startTime: Date.now()
}

const notFoundWords = []
const errorWords = []

// Helper to find the best definition
function findBestDefinition(meanings, currentPartOfSpeech) {
  // Try to match current part of speech if available
  const posMap = {
    '動詞': 'verb',
    '名詞': 'noun',
    '形容詞': 'adjective',
    '副詞': 'adverb',
    '介詞': 'preposition',
    '連詞': 'conjunction',
    '感嘆詞': 'interjection'
  }

  const targetPOS = posMap[currentPartOfSpeech]

  // First, try to find matching part of speech
  if (targetPOS) {
    for (const meaning of meanings) {
      if (meaning.partOfSpeech === targetPOS && meaning.definitions.length > 0) {
        return {
          partOfSpeech: meaning.partOfSpeech,
          definition: meaning.definitions[0].definition,
          example: meaning.definitions[0].example || null
        }
      }
    }
  }

  // If no match, use first meaning with an example if possible
  for (const meaning of meanings) {
    for (const def of meaning.definitions) {
      if (def.example) {
        return {
          partOfSpeech: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example
        }
      }
    }
  }

  // Otherwise, just use the first definition
  const firstMeaning = meanings[0]
  return {
    partOfSpeech: firstMeaning.partOfSpeech,
    definition: firstMeaning.definitions[0].definition,
    example: firstMeaning.definitions[0].example || null
  }
}

// Convert API part of speech to Chinese
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
    'determiner': '限定詞'
  }
  return map[englishPOS] || '名詞'
}

async function fetchWordData(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)

    if (!response.ok) {
      return { found: false, status: response.status }
    }

    const data = await response.json()

    if (Array.isArray(data) && data.length > 0) {
      return { found: true, data: data[0] }
    }

    return { found: false, status: 'no_data' }
  } catch (error) {
    return { found: false, error: error.message }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processLevel(levelInfo) {
  const filePath = path.join(dataDir, levelInfo.file)
  const backupPath = path.join(dataDir, `${levelInfo.file}.backup`)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Processing: ${levelInfo.name}`)
  console.log('='.repeat(60))

  // Create backup
  const originalData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  fs.writeFileSync(backupPath, JSON.stringify(originalData, null, 2))
  console.log(`✓ Backup created: ${backupPath}`)

  const updatedData = []
  let levelFound = 0
  let levelNotFound = 0
  let levelImproved = 0

  for (let i = 0; i < originalData.length; i++) {
    const entry = originalData[i]
    const word = entry.word
    stats.total++

    // Show progress every 50 words
    if ((i + 1) % 50 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1)
      const rate = stats.total / elapsed
      const remaining = (4638 - stats.total) / rate
      console.log(`  Progress: ${i + 1}/${originalData.length} | Total: ${stats.total}/4638 | ${elapsed}m elapsed | ~${remaining.toFixed(0)}m remaining`)
    }

    // Fetch from API
    const result = await fetchWordData(word)

    if (result.found) {
      stats.found++
      levelFound++

      const apiEntry = result.data
      const bestDef = findBestDefinition(apiEntry.meanings, entry.partOfSpeech)

      // Check if this is an improvement
      const isImprovement = (
        entry.definition.includes('a person, place, thing, or concept') ||
        entry.definition.includes('very interesting') ||
        entry.definition.length < 20 ||
        entry.sentence.includes('very interesting') ||
        entry.sentence.includes('The weather is')
      )

      if (isImprovement) {
        stats.improved++
        levelImproved++
      }

      // Create new entry
      const newEntry = {
        word: word,
        definition: bestDef.definition,
        sentence: bestDef.example || entry.sentence, // Keep old sentence if no example
        partOfSpeech: convertPartOfSpeech(bestDef.partOfSpeech)
      }

      // Preserve language origin if it exists
      if (entry.languageOrigin) {
        newEntry.languageOrigin = entry.languageOrigin
      }

      updatedData.push(newEntry)

      // Log improvements
      if (isImprovement && (i + 1) % 10 === 0) {
        console.log(`  ✓ ${word}: ${bestDef.definition.substring(0, 60)}...`)
      }
    } else {
      stats.notFound++
      levelNotFound++
      notFoundWords.push({ word, level: levelInfo.name })

      // Keep original entry for words not found
      updatedData.push(entry)

      if (result.error) {
        stats.errors++
        errorWords.push({ word, level: levelInfo.name, error: result.error })
      }
    }

    // Rate limiting: 200ms delay between requests
    await delay(200)
  }

  // Save updated data
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2))

  console.log(`\n${levelInfo.name} Summary:`)
  console.log(`  Found: ${levelFound} (${((levelFound / originalData.length) * 100).toFixed(1)}%)`)
  console.log(`  Not found: ${levelNotFound}`)
  console.log(`  Improved: ${levelImproved}`)
  console.log(`  ✓ Saved: ${filePath}`)
}

async function main() {
  try {
    for (const level of levels) {
      await processLevel(level)
    }

    // Final summary
    const elapsedMinutes = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1)

    console.log(`\n${'='.repeat(60)}`)
    console.log('FINAL SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total words processed: ${stats.total}`)
    console.log(`Found in API: ${stats.found} (${((stats.found / stats.total) * 100).toFixed(1)}%)`)
    console.log(`Not found: ${stats.notFound} (${((stats.notFound / stats.total) * 100).toFixed(1)}%)`)
    console.log(`Improved entries: ${stats.improved}`)
    console.log(`Errors: ${stats.errors}`)
    console.log(`Time elapsed: ${elapsedMinutes} minutes`)
    console.log()

    // Save not found words
    if (notFoundWords.length > 0) {
      const notFoundFile = path.join(__dirname, 'not_found_words.json')
      fs.writeFileSync(notFoundFile, JSON.stringify(notFoundWords, null, 2))
      console.log(`Not found words saved to: ${notFoundFile}`)
    }

    // Save error words
    if (errorWords.length > 0) {
      const errorFile = path.join(__dirname, 'error_words.json')
      fs.writeFileSync(errorFile, JSON.stringify(errorWords, null, 2))
      console.log(`Error words saved to: ${errorFile}`)
    }

    console.log('\n✅ Dictionary replacement complete!')
    console.log('\nBackup files created (*.backup) - keep these in case you need to revert.')
    console.log('\nNext steps:')
    console.log('1. Review random samples to verify quality')
    console.log('2. Check not_found_words.json for missing entries')
    console.log('3. Consider using Merriam-Webster API for missing words')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Progress has been saved. You can re-run the script to continue.')
    process.exit(1)
  }
}

main()

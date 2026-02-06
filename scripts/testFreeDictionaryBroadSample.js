import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Testing Free Dictionary API - Broad Sample\n')

// Load all levels
const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
const levels = [
  { file: 'elementary.json', name: 'Elementary', count: 5 },
  { file: 'middle.json', name: 'Middle School', count: 5 },
  { file: 'high.json', name: 'High School', count: 5 },
  { file: 'university.json', name: 'University', count: 5 },
  { file: 'expert.json', name: 'Expert', count: 5 }
]

const testWords = []

// Get sample from each level
for (const level of levels) {
  const filePath = path.join(dataDir, level.file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  // Get 5 random words from each level
  for (let i = 0; i < level.count; i++) {
    const randomIndex = Math.floor(Math.random() * data.length)
    testWords.push({
      word: data[randomIndex].word,
      level: level.name,
      currentDef: data[randomIndex].definition,
      currentPOS: data[randomIndex].partOfSpeech
    })
  }
}

let found = 0
let notFound = 0
const results = []

async function testWord(wordObj) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordObj.word}`)

    if (!response.ok) {
      return { ...wordObj, found: false, error: response.status }
    }

    const apiData = await response.json()

    if (Array.isArray(apiData) && apiData.length > 0) {
      const entry = apiData[0]

      // Get all meanings
      const allMeanings = []
      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          allMeanings.push({
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example || null
          })
        }
      }

      const firstMeaning = entry.meanings?.[0]
      const firstDefinition = firstMeaning?.definitions?.[0]

      return {
        ...wordObj,
        found: true,
        apiPartOfSpeech: firstMeaning?.partOfSpeech || 'unknown',
        apiDefinition: firstDefinition?.definition || 'No definition',
        apiExample: firstDefinition?.example || null,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || null,
        totalMeanings: allMeanings.length,
        allMeanings: allMeanings.slice(0, 3) // Store first 3 meanings
      }
    }

    return { ...wordObj, found: false, error: 'No data' }
  } catch (error) {
    return { ...wordObj, found: false, error: error.message }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runTests() {
  console.log(`Testing ${testWords.length} random words across all levels:\n`)

  for (const wordObj of testWords) {
    const result = await testWord(wordObj)
    results.push(result)

    if (result.found) {
      found++
      console.log(`✓ ${result.word} [${result.level}]`)
      console.log(`  Current: ${result.currentPOS} - ${result.currentDef}`)
      console.log(`  API: ${result.apiPartOfSpeech} - ${result.apiDefinition.substring(0, 80)}...`)
      if (result.apiExample) {
        console.log(`  Example: "${result.apiExample.substring(0, 80)}..."`)
      }
      if (result.totalMeanings > 1) {
        console.log(`  (${result.totalMeanings} total meanings available)`)
      }
    } else {
      notFound++
      console.log(`✗ ${result.word} [${result.level}] - ${result.error}`)
    }
    console.log()

    await delay(200)
  }

  console.log('=' .repeat(60))
  console.log('RESULTS:')
  console.log(`Found: ${found} / ${testWords.length} (${((found / testWords.length) * 100).toFixed(1)}%)`)
  console.log(`Not found: ${notFound}`)
  console.log()

  // Save detailed results
  const outputFile = '/tmp/free_dict_api_broad_test.json'
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
  console.log(`Detailed results saved to: ${outputFile}`)

  if (found / testWords.length >= 0.9) {
    console.log('\n✅ Coverage is excellent (≥90%)! Safe to proceed with full fetch.')
  } else if (found / testWords.length >= 0.75) {
    console.log('\n⚠️  Coverage is good (≥75%). Consider using API with fallback plan.')
  } else {
    console.log('\n❌ Coverage is poor (<75%). May need alternative approach.')
  }
}

runTests().catch(console.error)

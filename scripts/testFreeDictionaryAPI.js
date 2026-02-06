import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Testing Free Dictionary API Coverage\n')

// Load one level to test
const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
const testFile = path.join(dataDir, 'elementary.json')
const data = JSON.parse(fs.readFileSync(testFile, 'utf8'))

console.log(`Testing with ${data.length} elementary words...\n`)

// Test first 20 words
const testWords = data.slice(0, 20).map(e => e.word)

let found = 0
let notFound = 0
const results = []

async function testWord(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)

    if (!response.ok) {
      return { word, found: false, error: response.status }
    }

    const apiData = await response.json()

    if (Array.isArray(apiData) && apiData.length > 0) {
      const entry = apiData[0]
      const meaning = entry.meanings?.[0]
      const definition = meaning?.definitions?.[0]

      return {
        word,
        found: true,
        partOfSpeech: meaning?.partOfSpeech || 'unknown',
        definition: definition?.definition || 'No definition',
        example: definition?.example || 'No example',
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || 'No phonetic'
      }
    }

    return { word, found: false, error: 'No data' }
  } catch (error) {
    return { word, found: false, error: error.message }
  }
}

// Add delay between requests to be polite
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runTests() {
  console.log('Testing words (with 200ms delay between requests):\n')

  for (const word of testWords) {
    const result = await testWord(word)
    results.push(result)

    if (result.found) {
      found++
      console.log(`✓ ${result.word}`)
      console.log(`  Part of speech: ${result.partOfSpeech}`)
      console.log(`  Definition: ${result.definition.substring(0, 80)}${result.definition.length > 80 ? '...' : ''}`)
      if (result.example && result.example !== 'No example') {
        console.log(`  Example: ${result.example.substring(0, 80)}${result.example.length > 80 ? '...' : ''}`)
      }
    } else {
      notFound++
      console.log(`✗ ${result.word} - ${result.error}`)
    }
    console.log()

    await delay(200) // Be nice to the API
  }

  console.log('=' .repeat(60))
  console.log('RESULTS:')
  console.log(`Found: ${found} / ${testWords.length} (${((found / testWords.length) * 100).toFixed(1)}%)`)
  console.log(`Not found: ${notFound}`)
  console.log()

  // Save detailed results
  const outputFile = '/tmp/free_dict_api_test.json'
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
  console.log(`Detailed results saved to: ${outputFile}`)
  console.log()
  console.log('If coverage is good (>90%), we can proceed to fetch all 4,638 words.')
}

runTests().catch(console.error)

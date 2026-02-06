import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Testing Webster\'s Dictionary Coverage\n')

// Load Webster's dictionary
console.log('Loading Webster\'s dictionary...')
const webstersRaw = JSON.parse(fs.readFileSync('/tmp/websters_dict.json', 'utf8'))
// Convert to lowercase keys for easier lookup
const websters = {}
for (const [key, value] of Object.entries(webstersRaw)) {
  websters[key.toLowerCase()] = value
}
console.log(`✓ Loaded ${Object.keys(websters).length.toLocaleString()} words from Webster's\n`)

// Load our word lists
const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
const levels = [
  { file: 'elementary.json', name: 'Elementary' },
  { file: 'middle.json', name: 'Middle School' },
  { file: 'high.json', name: 'High School' },
  { file: 'university.json', name: 'University' },
  { file: 'expert.json', name: 'Expert' }
]

let totalWords = 0
let totalFound = 0
let totalMissing = 0
const allMissingWords = []

console.log('Testing coverage by level:\n')

for (const level of levels) {
  const filePath = path.join(dataDir, level.file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const missing = []
  let found = 0

  for (const entry of data) {
    const word = entry.word.toLowerCase()
    if (websters[word] !== undefined) {
      found++
    } else {
      missing.push(entry.word)
    }
  }

  const coverage = ((found / data.length) * 100).toFixed(1)
  totalWords += data.length
  totalFound += found
  totalMissing += missing.length
  allMissingWords.push(...missing)

  console.log(`${level.name}:`)
  console.log(`  Total words: ${data.length}`)
  console.log(`  Found: ${found} (${coverage}%)`)
  console.log(`  Missing: ${missing.length}`)
  if (missing.length > 0 && missing.length <= 10) {
    console.log(`  Missing words: ${missing.join(', ')}`)
  } else if (missing.length > 10) {
    console.log(`  Sample missing: ${missing.slice(0, 10).join(', ')}...`)
  }
  console.log()
}

console.log('=' .repeat(60))
console.log('SUMMARY:')
console.log(`Total words in our lists: ${totalWords}`)
console.log(`Found in Webster's: ${totalFound} (${((totalFound / totalWords) * 100).toFixed(1)}%)`)
console.log(`Missing from Webster's: ${totalMissing} (${((totalMissing / totalWords) * 100).toFixed(1)}%)`)
console.log()

// Show sample Webster's entries for our words
console.log('=' .repeat(60))
console.log('SAMPLE WEBSTER\'S ENTRIES:\n')

const sampleWords = ['say', 'get', 'run', 'important', 'beautiful', 'education', 'accomplish']
for (const word of sampleWords) {
  if (websters[word]) {
    const def = websters[word]
    const preview = def.length > 200 ? def.substring(0, 200) + '...' : def
    console.log(`${word}:`)
    console.log(`  ${preview}`)
    console.log()
  }
}

// Save missing words to file
if (allMissingWords.length > 0) {
  const missingFile = '/tmp/missing_words.json'
  fs.writeFileSync(missingFile, JSON.stringify(allMissingWords, null, 2))
  console.log(`Missing words saved to: ${missingFile}`)
}

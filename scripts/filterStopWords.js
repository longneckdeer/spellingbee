/**
 * Filter out stop words and function words from dictionary
 * Stop words are too common/simple for a spelling game
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Comprehensive stop words list
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',

  // Pronouns
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'this', 'that', 'these', 'those',
  'who', 'whom', 'whose', 'which', 'what',
  'someone', 'anyone', 'everyone', 'no one', 'nobody', 'somebody', 'anybody', 'everybody',
  'something', 'anything', 'everything', 'nothing',
  'somewhere', 'anywhere', 'everywhere', 'nowhere',

  // Common verbs (be/have/do)
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'done', 'doing',

  // Auxiliary/Modal verbs
  'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would',

  // Common prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'from', 'by', 'with', 'about',
  'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out',
  'against', 'during', 'without', 'before', 'under', 'around', 'among',
  'across', 'behind', 'below', 'beneath', 'beside', 'besides', 'beyond',
  'near', 'off', 'onto', 'since', 'toward', 'towards', 'until', 'unto',
  'up', 'upon', 'via', 'within',

  // Conjunctions
  'and', 'or', 'but', 'nor', 'yet', 'so',
  'if', 'because', 'when', 'while', 'where', 'than', 'then',
  'whether', 'unless', 'once', 'although', 'though',
  'whenever', 'wherever', 'since',

  // Determiners
  'all', 'any', 'both', 'each', 'every', 'few', 'many', 'more', 'most',
  'much', 'no', 'none', 'one', 'other', 'another', 'several', 'some',
  'such', 'either', 'neither',

  // Numbers (too simple)
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
  'hundred', 'thousand', 'million', 'billion',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',

  // Very common adverbs
  'not', 'no', 'yes', 'very', 'too', 'also', 'just', 'only', 'now', 'here', 'there',
  'how', 'why', 'where', 'when',

  // Verb forms of "be"
  'am', 'is', 'are', 'was', 'were', 'been', 'being',

  // Short/too simple words (1-2 letters)
  'i', 'a', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it',
  'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we',

  // Contractions base forms
  'nt', 'll', 've', 'd', 's', 're', 'm',

  // Other function words
  'got', 'gets'
])

// Additional words to exclude (inflections of stop words)
const EXCLUDED_PATTERNS = [
  /^(he|she|it|we|they)'(s|d|ll|ve|re)$/i,  // Contractions
  /^(can|could|should|would|must|might|may)n't$/i,  // Negative modals
  /^(is|are|was|were|am|been|being)'.*$/i,  // Be contractions
  /^(have|has|had)'.*$/i,  // Have contractions
  /^(do|does|did)'.*$/i,  // Do contractions
]

function isStopWord(word) {
  const lowerWord = word.toLowerCase()

  // Check if in stop words set
  if (STOP_WORDS.has(lowerWord)) return true

  // Check excluded patterns
  if (EXCLUDED_PATTERNS.some(pattern => pattern.test(word))) return true

  // Exclude very short words (1-2 letters) - too simple
  if (word.length <= 2) return true

  return false
}

// Load and filter each level
const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
const levels = ['elementary', 'middle', 'high', 'university', 'expert']

let totalBefore = 0
let totalAfter = 0
let totalRemoved = 0

console.log('Filtering stop words from dictionary...\n')

levels.forEach(level => {
  const filepath = path.join(dataDir, `${level}.json`)

  if (!fs.existsSync(filepath)) {
    console.log(`⚠ ${level}.json not found, skipping...`)
    return
  }

  const words = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
  const beforeCount = words.length
  totalBefore += beforeCount

  // Filter out stop words
  const filtered = words.filter(entry => !isStopWord(entry.word))
  const afterCount = filtered.length
  totalAfter += afterCount
  const removed = beforeCount - afterCount
  totalRemoved += removed

  // Save filtered list
  fs.writeFileSync(filepath, JSON.stringify(filtered, null, 2))

  console.log(`✓ ${level}.json:`)
  console.log(`  Before: ${beforeCount} words`)
  console.log(`  After: ${afterCount} words`)
  console.log(`  Removed: ${removed} stop words`)

  if (removed > 0 && removed <= 10) {
    const removedWords = words.filter(entry => isStopWord(entry.word)).map(e => e.word)
    console.log(`  Examples: ${removedWords.slice(0, 5).join(', ')}`)
  }
  console.log()
})

console.log('═'.repeat(50))
console.log('Summary:')
console.log(`Total before: ${totalBefore} words`)
console.log(`Total after: ${totalAfter} words`)
console.log(`Total removed: ${totalRemoved} stop words (${((totalRemoved/totalBefore)*100).toFixed(1)}%)`)
console.log('═'.repeat(50))
console.log('\n✓ Stop words filtered successfully!')

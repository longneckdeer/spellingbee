/**
 * Filter out abbreviations and acronyms
 * These are not good for spelling practice
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Common abbreviations to exclude
const ABBREVIATIONS = new Set([
  // Titles
  'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'rev', 'sr', 'jr',
  'esq', 'hon', 'st', 'fr',

  // Time/Date
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'am', 'pm', 'bc', 'ad', 'bce', 'ce',

  // Measurements
  'kg', 'km', 'cm', 'mm', 'mg', 'ml', 'lb', 'oz', 'ft', 'mph', 'kph',

  // Latin abbreviations
  'etc', 'et', 'al', 'vs', 'ie', 'eg', 'ps', 'nb', 'viz', 'ibid',
  'op', 'cit', 'loc', 'ca', 'cf', 'qv', 'et cetera',

  // Organizations/Places
  'usa', 'uk', 'un', 'eu', 'nato', 'fbi', 'cia', 'nasa', 'who',
  'asap', 'rsvp', 'fyi', 'ceo', 'cfo', 'coo', 'vp', 'hr', 'pr',
  'tv', 'dvd', 'cd', 'pc', 'mac', 'app', 'wifi', 'gps',

  // Academic
  'ba', 'bs', 'ma', 'ms', 'phd', 'md', 'jd', 'mba', 'dds',
  'gpa', 'sat', 'act', 'ged',

  // Business/Finance
  'inc', 'ltd', 'llc', 'corp', 'co', 'plc',
  'ceo', 'cfo', 'coo', 'cto', 'vp', 'svp', 'evp',
  'atm', 'pin', 'apr', 'roi', 'ipo', 'gdp', 'vat',

  // Technology
  'html', 'css', 'xml', 'api', 'url', 'http', 'https', 'ftp',
  'ram', 'rom', 'cpu', 'gpu', 'usb', 'hdmi', 'wifi',
  'sms', 'mms', 'email', 'blog', 'vlog',

  // Military
  'pvt', 'cpl', 'sgt', 'lt', 'cpt', 'maj', 'col', 'gen',
  'navy', 'usaf', 'usmc',

  // Medical
  'rn', 'lpn', 'icu', 'er', 'ent', 'obgyn', 'dna', 'rna',
  'hiv', 'aids', 'std', 'mri', 'xray',

  // Common acronyms
  'faq', 'diy', 'aka', 'btw', 'omg', 'lol', 'brb', 'ttyl',
  'imo', 'imho', 'tbd', 'tba', 'asap', 'rsvp', 'fyi',
  'vip', 'mvp', 'rip', 'dj', 'mc', 'dna', 'id',

  // Countries/Regions (abbreviations)
  'usa', 'uk', 'eu', 'uae', 'ussr', 'prc', 'roc',

  // Other common abbreviations
  'ok', 'okay', 'ave', 'blvd', 'rd', 'ln', 'hwy', 'apt', 'no', 'nos',
  'dept', 'div', 'dist', 'est', 'max', 'min', 'misc', 'temp',
])

// Patterns for abbreviations
const ABBREVIATION_PATTERNS = [
  /^[a-z]{2,4}$/i,           // 2-4 letter words that are ALL CAPS in common usage
  /\./,                       // Contains periods (e.g., "e.g.", "i.e.")
  /^[a-z]\.$/i,              // Single letter with period
  /^(mr|mrs|ms|dr|prof|rev|st|sr|jr)s?$/i,  // Titles
]

function isAbbreviation(word) {
  const lowerWord = word.toLowerCase()

  // Check if in abbreviations set
  if (ABBREVIATIONS.has(lowerWord)) return true

  // Contains period (like "e.g.", "i.e.", "Dr.")
  if (word.includes('.')) return true

  // Very short acronyms (2-3 letters, all caps in original)
  // But we need to be careful not to exclude valid words like "ox", "ax"
  // So only flag if it's in our known list
  if (word.length <= 3 && ABBREVIATIONS.has(lowerWord)) return true

  // All uppercase and short (likely acronym)
  if (word.length <= 5 && word === word.toUpperCase() && word.match(/^[A-Z]+$/)) return true

  return false
}

// Load and filter each level
const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
const levels = ['elementary', 'middle', 'high', 'university', 'expert']

let totalBefore = 0
let totalAfter = 0
let totalRemoved = 0
const removedWords = []

console.log('Filtering abbreviations and acronyms...\n')

levels.forEach(level => {
  const filepath = path.join(dataDir, `${level}.json`)

  if (!fs.existsSync(filepath)) {
    console.log(`⚠ ${level}.json not found, skipping...`)
    return
  }

  const words = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
  const beforeCount = words.length
  totalBefore += beforeCount

  // Filter out abbreviations
  const filtered = words.filter(entry => {
    const isAbbr = isAbbreviation(entry.word)
    if (isAbbr) {
      removedWords.push(entry.word)
    }
    return !isAbbr
  })

  const afterCount = filtered.length
  totalAfter += afterCount
  const removed = beforeCount - afterCount
  totalRemoved += removed

  // Save filtered list
  fs.writeFileSync(filepath, JSON.stringify(filtered, null, 2))

  console.log(`✓ ${level}.json:`)
  console.log(`  Before: ${beforeCount} words`)
  console.log(`  After: ${afterCount} words`)
  console.log(`  Removed: ${removed} abbreviations`)
  if (removed > 0 && removed <= 10) {
    const removed = words.filter(entry => isAbbreviation(entry.word)).map(e => e.word)
    console.log(`  Examples: ${removed.join(', ')}`)
  }
  console.log()
})

console.log('═'.repeat(50))
console.log('Summary:')
console.log(`Total before: ${totalBefore} words`)
console.log(`Total after: ${totalAfter} words`)
console.log(`Total removed: ${totalRemoved} abbreviations (${((totalRemoved/totalBefore)*100).toFixed(1)}%)`)

if (removedWords.length > 0 && removedWords.length <= 30) {
  console.log(`\nRemoved: ${removedWords.join(', ')}`)
}

console.log('═'.repeat(50))
console.log('\n✓ Abbreviations filtered successfully!')

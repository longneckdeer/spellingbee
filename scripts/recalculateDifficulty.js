import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CEFR level to difficulty mapping
const CEFR_DIFFICULTY = {
  'A1': 0,
  'A2': 10,
  'B1': 25,
  'B2': 40,
  'C1': 60,
  'C2': 80
}

// Source level to base difficulty (textbook familiarity)
const LEVEL_BASE = {
  'elementary': 0,
  'middle': 25,
  'high': 50,
  'university': 70,
  'expert': 85
}

// Common spelling patterns
const SILENT_LETTERS = /[kgpwh]n|ps|^gn|dge?$/i
const DOUBLE_CONSONANTS = /([bcdfghjklmnpqrstvwxyz])\1/i
const TRICKY_VOWELS = /eau|ieu|ough|augh|eigh|ough/i
const IRREGULAR_PATTERNS = /yacht|colonel|queue|rhetoric|phlegm/i
const COMMON_MISTAKES = /separate|definitely|necessary|accommodate|embarrass|occurrence|receive|believe/i

// Homophones (common ones)
const HOMOPHONES = new Set([
  'their', 'there', 'they\'re',
  'to', 'too', 'two',
  'hear', 'here',
  'write', 'right',
  'know', 'no',
  'piece', 'peace',
  'brake', 'break',
  'buy', 'by', 'bye',
  'cell', 'sell',
  'flower', 'flour',
  'mail', 'male',
  'meet', 'meat',
  'one', 'won',
  'plain', 'plane',
  'sea', 'see',
  'son', 'sun',
  'weak', 'week',
  'wear', 'where',
  'wood', 'would'
])

function calculateDifficulty(word, sourceLevel, cefr) {
  let score = 0
  const wordLower = word.toLowerCase()

  // 1. Textbook Familiarity (40% weight) - Lower is easier
  const levelBase = LEVEL_BASE[sourceLevel] || 50
  score += levelBase * 0.4

  // 2. CEFR Level (if available) - 20% weight
  if (cefr && CEFR_DIFFICULTY[cefr] !== undefined) {
    score += CEFR_DIFFICULTY[cefr] * 0.2
  } else {
    // If no CEFR, use level base as proxy
    score += levelBase * 0.2
  }

  // 3. Spelling Complexity (35% weight)
  let complexityScore = 0

  // Silent letters (+15)
  if (SILENT_LETTERS.test(wordLower)) {
    complexityScore += 15
  }

  // Double consonants (+10)
  if (DOUBLE_CONSONANTS.test(wordLower)) {
    complexityScore += 10
  }

  // Irregular patterns (+15)
  if (IRREGULAR_PATTERNS.test(wordLower)) {
    complexityScore += 15
  }

  // Tricky vowels (+10)
  if (TRICKY_VOWELS.test(wordLower)) {
    complexityScore += 10
  }

  // Common mistakes (+10)
  if (COMMON_MISTAKES.test(wordLower)) {
    complexityScore += 10
  }

  // Common prefixes/suffixes (-5)
  if (/^(un|re|pre|dis|mis)|ing$|ed$|ly$/i.test(wordLower)) {
    complexityScore -= 5
  }

  score += Math.min(complexityScore, 35) * 0.35 / 35 * 100

  // 4. Phonetic Difficulty (15% weight)
  let phoneticScore = 0

  // Homophones (+10)
  if (HOMOPHONES.has(wordLower)) {
    phoneticScore += 10
  }

  // Silent 'e' rule (+5)
  if (/[^aeiou]e$/i.test(wordLower) && word.length > 3) {
    phoneticScore += 5
  }

  score += Math.min(phoneticScore, 15) * 0.15 / 15 * 100

  // 5. Word Length (10% weight)
  const lengthScore = Math.min((word.length - 3) * 2.5, 30)
  score += lengthScore * 0.1 / 30 * 100

  // Normalize to 0-100
  return Math.round(Math.max(0, Math.min(100, score)))
}

function redistributeToDifficulty(words, targetMin, targetMax) {
  // Sort by raw difficulty
  const sorted = [...words].sort((a, b) => a.rawDifficulty - b.rawDifficulty)

  // Map to target range
  const minRaw = sorted[0].rawDifficulty
  const maxRaw = sorted[sorted.length - 1].rawDifficulty
  const range = maxRaw - minRaw || 1

  return sorted.map(word => {
    const normalized = (word.rawDifficulty - minRaw) / range
    const difficulty = Math.round(targetMin + normalized * (targetMax - targetMin))
    return { ...word, difficulty }
  })
}

async function processLevel(levelName, targetMin, targetMax) {
  const filePath = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data', `${levelName}.json`)

  console.log(`\n📖 Processing ${levelName}...`)

  const words = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  console.log(`   Found ${words.length} words`)

  // Calculate raw difficulty for each word
  const wordsWithRaw = words.map(word => ({
    ...word,
    rawDifficulty: calculateDifficulty(word.word, levelName, word.cefr)
  }))

  // Redistribute to target range
  const redistributed = redistributeToDifficulty(wordsWithRaw, targetMin, targetMax)

  // Remove rawDifficulty field
  const finalWords = redistributed.map(({ rawDifficulty, ...word }) => word)

  // Show statistics
  const difficulties = finalWords.map(w => w.difficulty)
  const min = Math.min(...difficulties)
  const max = Math.max(...difficulties)
  const avg = Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)

  console.log(`   Difficulty range: ${min}-${max} (avg: ${avg})`)
  console.log(`   Target range: ${targetMin}-${targetMax}`)

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(finalWords, null, 2), 'utf-8')
  console.log(`   ✅ Updated ${levelName}.json`)

  return finalWords
}

async function main() {
  console.log('🎯 Recalculating difficulty for all words...\n')
  console.log('Factors considered:')
  console.log('  • Textbook familiarity (source level) - 40%')
  console.log('  • CEFR level - 20%')
  console.log('  • Spelling complexity - 35%')
  console.log('  • Phonetic difficulty - 15%')
  console.log('  • Word length - 10%')

  // Process each level with overlapping ranges
  const levels = [
    { name: 'elementary', min: 0, max: 35 },
    { name: 'middle', min: 25, max: 60 },
    { name: 'high', min: 50, max: 80 },
    { name: 'university', min: 70, max: 95 },
    { name: 'expert', min: 85, max: 100 }
  ]

  for (const level of levels) {
    await processLevel(level.name, level.min, level.max)
  }

  console.log('\n✨ Difficulty recalculation complete!')
  console.log('\n📊 Overlapping ranges:')
  console.log('   Elementary:  0-35')
  console.log('   Middle:     25-60  (overlap: 25-35)')
  console.log('   High:       50-80  (overlap: 50-60)')
  console.log('   University: 70-95  (overlap: 70-80)')
  console.log('   Expert:     85-100 (overlap: 85-95)')
}

main().catch(console.error)

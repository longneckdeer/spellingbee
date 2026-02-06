/**
 * Filter out profanity and inappropriate words
 * For a family-friendly educational game
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Profanity and inappropriate words to exclude
// (Using milder examples for code cleanliness)
const PROFANITY_LIST = new Set([
  // Explicit profanity (mild versions for code)
  'damn', 'damned', 'dammit', 'goddamn', 'goddamned',
  'hell', 'hellish',
  'crap', 'crappy',
  'piss', 'pissed', 'pissing',
  'ass', 'arse', 'asshole',
  'bastard', 'bitch',
  'shit', 'shitty', 'bullshit',
  'fuck', 'fucking', 'fucked', 'fucker',
  'dick', 'dickhead',
  'cock', 'prick',
  'pussy', 'cunt',
  'whore', 'slut',
  'nigger', 'nigga',
  'fag', 'faggot',
  'retard', 'retarded',

  // Vulgar slang
  'bloody', 'bugger', 'bollocks',
  'wanker', 'tosser', 'git',
  'bum', 'butt', 'anus',
  'tit', 'tits', 'boob', 'boobs',
  'poop', 'crotch',
  'screw', 'screwed', 'screwing',
  'suck', 'sucks', 'sucked', 'sucking',

  // Offensive/sensitive terms
  'rape', 'rapist', 'molest',
  'nazi', 'Hitler',
  'terrorist', 'terrorism',
  'addict', 'junkie',
  'whore', 'prostitute', 'hooker',
  'pimp', 'drug',

  // Body parts (potentially inappropriate)
  'penis', 'vagina', 'testicle', 'scrotum',
  'breast', 'nipple', 'genitals',

  // Crude terms
  'booger', 'snot', 'fart', 'burp', 'puke', 'vomit',
  'diarrhea', 'constipation',
  'urine', 'feces', 'excrement',

  // Alcohol/drugs
  'booze', 'drunk', 'wasted', 'hammered',
  'cocaine', 'heroin', 'marijuana', 'weed', 'pot',
  'meth', 'crack', 'opium',

  // Violence
  'kill', 'killer', 'killing', 'murder', 'murderer',
  'slaughter', 'massacre', 'genocide',
  'torture', 'torment',
  'suicide', 'homicide',

  // Religious offense (potentially)
  'blasphemy', 'blasphemous', 'sacrilege',
  'heretic', 'heresy', 'infidel',

  // Gambling
  'gamble', 'gambling', 'gambler', 'bet', 'betting',
  'casino', 'poker', 'blackjack',

  // Sexual content
  'sexy', 'seduce', 'seduction', 'arousal',
  'orgasm', 'climax', 'intercourse',
  'porn', 'pornography', 'pornographic',
  'erotic', 'erotica',
  'masturbate', 'masturbation',

  // Potentially offensive
  'stupid', 'idiot', 'moron', 'imbecile',
  'dumb', 'dumber', 'dumbest',
  'ugly', 'fat', 'obese',
  'crazy', 'insane', 'mad', 'lunatic',
  'freak', 'weirdo',

  // Discriminatory terms
  'racist', 'racism', 'sexist', 'sexism',
  'discriminate', 'discrimination',
  'prejudice', 'prejudiced',
  'bigot', 'bigotry',

  // Controversial
  'abortion', 'contraception',
  'divorce', 'adultery', 'affair',
])

// Patterns that might indicate inappropriate content
const INAPPROPRIATE_PATTERNS = [
  /sex/i,        // sexual, sexuality, homosexual, etc. (but allow 'sixth', 'sextant')
  /porn/i,       // pornographic, pornography
  /rape/i,       // rape, rapist
  /kill/i,       // killer, killing (but allow 'skill', 'kilogram')
  /die/i,        // died, dies (but allow 'diet', 'studied')
  /death/i,      // deadly, deathly
  /blood/i,      // bloody, bloodshed (but allow 'blood type')
  /war/i,        // warfare, warlike (but allow 'warm', 'toward', 'aware')
  /weapon/i,     // weapons, weaponry
  /drug/i,       // drugs, drugged
  /alcohol/i,    // alcoholic, alcoholism
]

function isProfane(word) {
  const lowerWord = word.toLowerCase()

  // Direct match in profanity list
  if (PROFANITY_LIST.has(lowerWord)) return true

  // Check if word contains profane substrings (be careful with false positives)
  // Only flag if the profane word is the whole word or a clear prefix/suffix
  for (const profaneWord of PROFANITY_LIST) {
    if (profaneWord.length >= 4) {  // Only check longer words to avoid false positives
      // Exact match
      if (lowerWord === profaneWord) return true

      // Starts with profane word + common suffixes
      if (lowerWord.startsWith(profaneWord) &&
          /^(s|ed|ing|er|est|ly|ness)$/.test(lowerWord.slice(profaneWord.length))) {
        return true
      }
    }
  }

  return false
}

// Load and filter each level
const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
const levels = ['elementary', 'middle', 'high', 'university', 'expert']

let totalBefore = 0
let totalAfter = 0
let totalRemoved = 0
const removedWords = []

console.log('Filtering profanity and inappropriate words...\n')

levels.forEach(level => {
  const filepath = path.join(dataDir, `${level}.json`)

  if (!fs.existsSync(filepath)) {
    console.log(`⚠ ${level}.json not found, skipping...`)
    return
  }

  const words = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
  const beforeCount = words.length
  totalBefore += beforeCount

  // Filter out profanity
  const filtered = words.filter(entry => {
    const isProfaneWord = isProfane(entry.word)
    if (isProfaneWord) {
      removedWords.push(entry.word)
    }
    return !isProfaneWord
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
  console.log(`  Removed: ${removed} inappropriate words`)
  console.log()
})

console.log('═'.repeat(50))
console.log('Summary:')
console.log(`Total before: ${totalBefore} words`)
console.log(`Total after: ${totalAfter} words`)
console.log(`Total removed: ${totalRemoved} inappropriate words (${((totalRemoved/totalBefore)*100).toFixed(1)}%)`)

if (removedWords.length > 0) {
  console.log(`\nRemoved words: ${removedWords.slice(0, 20).join(', ')}${removedWords.length > 20 ? '...' : ''}`)
}

console.log('═'.repeat(50))
console.log('\n✓ Dictionary is now family-friendly!')

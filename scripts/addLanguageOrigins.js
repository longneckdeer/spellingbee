import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Language origins for common words
const LANGUAGE_ORIGINS = {
  // Common English words from different origins
  "school": "Latin (schola)",
  "telephone": "Greek (tele + phone)",
  "television": "Greek/Latin (tele + vision)",
  "computer": "Latin (computare)",
  "alphabet": "Greek (alpha + beta)",
  "democracy": "Greek (demos + kratos)",
  "psychology": "Greek (psyche + logos)",
  "philosophy": "Greek (philo + sophia)",
  "photograph": "Greek (photo + graph)",
  "bicycle": "Greek/Latin (bi + cycle)",
  "restaurant": "French",
  "cafe": "French (café)",
  "ballet": "French",
  "pizza": "Italian",
  "piano": "Italian",
  "guitar": "Spanish",
  "chocolate": "Spanish/Aztec (chocolatl)",
  "tomato": "Spanish/Aztec (tomatl)",
  "kindergarten": "German (kinder + garten)",
  "hamburger": "German (Hamburg)",
  "robot": "Czech (robota)",
  "safari": "Arabic/Swahili",
  "algebra": "Arabic (al-jabr)",
  "zero": "Arabic (sifr)",
  "sugar": "Arabic (sukkar)",
  "coffee": "Arabic (qahwa)",
  "algorithm": "Arabic (al-Khwarizmi)",
  "banana": "African",
  "tea": "Chinese (te)",
  "typhoon": "Chinese (tai fung)",
  "ketchup": "Chinese (kê-tsiap)",
  "karate": "Japanese",
  "tsunami": "Japanese",
  "karaoke": "Japanese",
  "jungle": "Hindi (jangal)",
  "shampoo": "Hindi (champo)",
  "yoga": "Sanskrit",
  "pajamas": "Hindi/Urdu",

  // Latin-based common words
  "animal": "Latin (animalis)",
  "family": "Latin (familia)",
  "library": "Latin (librarium)",
  "calendar": "Latin (kalendarium)",
  "calculate": "Latin (calculare)",
  "education": "Latin (educare)",
  "communication": "Latin (communicare)",
  "important": "Latin (importare)",
  "beautiful": "Latin (bellus)",
  "dangerous": "Latin (dominus)",

  // Greek-based common words
  "music": "Greek (mousike)",
  "theater": "Greek (theatron)",
  "gymnasium": "Greek (gymnasion)",
  "geography": "Greek (geo + graphia)",
  "biology": "Greek (bio + logia)",
  "mathematics": "Greek (mathema)",
  "history": "Greek (historia)",

  // French-based common words
  "restaurant": "French",
  "menu": "French",
  "boutique": "French",
  "cuisine": "French",
  "beautiful": "French (beau)",
  "courage": "French (coeur)",
  "challenge": "French",

  // Old English/Germanic
  "water": "Old English",
  "house": "Old English",
  "bread": "Old English",
  "friend": "Old English",
  "love": "Old English",
  "mother": "Old English",
  "father": "Old English",
  "brother": "Old English",
  "sister": "Old English",
  "daughter": "Old English",
  "son": "Old English"
}

// Process dictionary files
function addOrigins(filename) {
  const filePath = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data', filename)
  console.log(`\n📝 Processing ${filename}...`)

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let added = 0

  const updated = data.map(entry => {
    if (LANGUAGE_ORIGINS[entry.word]) {
      added++
      return {
        ...entry,
        languageOrigin: LANGUAGE_ORIGINS[entry.word]
      }
    }
    return entry
  })

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8')
  console.log(`  ✅ Added language origins to ${added} words`)
  return added
}

// Main execution
console.log('🌍 Adding Language Origins')
console.log('===========================\n')

const files = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']
let totalAdded = 0

files.forEach(file => {
  totalAdded += addOrigins(file)
})

console.log(`\n✅ Total origins added: ${totalAdded}\n`)

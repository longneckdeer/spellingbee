import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Comprehensive fixes for broken "I ___ every day" sentences
const SENTENCE_FIXES = {
  // Elementary level - nouns with wrong sentences
  "lot": {
    definition: "許多；大量",
    sentence: "We have a lot of homework today.",
    partOfSpeech: "名詞"
  },
  "job": {
    definition: "工作；職業",
    sentence: "My father has a good job.",
    partOfSpeech: "名詞"
  },
  "end": {
    definition: "結束；末端",
    sentence: "This is the end of the story.",
    partOfSpeech: "名詞"
  },
  "kid": {
    definition: "小孩",
    sentence: "Every kid loves to play games.",
    partOfSpeech: "名詞"
  },
  "art": {
    definition: "藝術；美術",
    sentence: "She studies art at school.",
    partOfSpeech: "名詞"
  },
  "air": {
    definition: "空氣",
    sentence: "The air is fresh in the mountains.",
    partOfSpeech: "名詞"
  },

  // Verbs with wrong conjugation
  "says": {
    definition: "說（第三人稱單數）",
    sentence: "He says hello every morning.",
    partOfSpeech: "動詞"
  },
  "said": {
    definition: "說（過去式）",
    sentence: "She said goodbye to her friends.",
    partOfSpeech: "動詞"
  },
  "goes": {
    definition: "去（第三人稱單數）",
    sentence: "She goes to school by bus.",
    partOfSpeech: "動詞"
  },
  "gone": {
    definition: "去（過去分詞）",
    sentence: "They have gone to the park.",
    partOfSpeech: "動詞"
  },
  "want": {
    definition: "想要",
    sentence: "I want to learn English.",
    partOfSpeech: "動詞"
  },
  "uses": {
    definition: "使用（第三人稱單數）",
    sentence: "She uses a computer for homework.",
    partOfSpeech: "動詞"
  },
  "puts": {
    definition: "放（第三人稱單數）",
    sentence: "He puts his books on the desk.",
    partOfSpeech: "動詞"
  },
  "mean": {
    definition: "意思是；意味",
    sentence: "What does this word mean?",
    partOfSpeech: "動詞"
  },
  "lets": {
    definition: "讓；允許（第三人稱單數）",
    sentence: "She lets me borrow her book.",
    partOfSpeech: "動詞"
  },
  "talk": {
    definition: "說話；交談",
    sentence: "I talk to my friends every day.",
    partOfSpeech: "動詞"
  },
  "turn": {
    definition: "轉；旋轉",
    sentence: "Please turn left at the corner.",
    partOfSpeech: "動詞"
  },
  "runs": {
    definition: "跑（第三人稱單數）",
    sentence: "My dog runs very fast.",
    partOfSpeech: "動詞"
  },

  // University level
  "illustrate": {
    definition: "說明；舉例說明",
    sentence: "Let me illustrate this concept with an example.",
    partOfSpeech: "動詞"
  },
  "acme": {
    definition: "頂點；最高點",
    sentence: "He reached the acme of his career.",
    partOfSpeech: "名詞"
  }
}

// Process files
function fixFile(filename) {
  const filePath = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data', filename)
  console.log(`\n📝 Processing ${filename}...`)

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let fixed = 0

  const updated = data.map(entry => {
    // Check if this entry needs fixing
    if (SENTENCE_FIXES[entry.word]) {
      const fix = SENTENCE_FIXES[entry.word]
      fixed++

      return {
        ...entry,
        definition: fix.definition,
        sentence: fix.sentence,
        partOfSpeech: fix.partOfSpeech
      }
    }

    // Also fix any remaining "I [word] every day" pattern for nouns
    if (entry.partOfSpeech === "名詞" && entry.sentence.match(/^I \w+ every day\.$/)) {
      fixed++
      return {
        ...entry,
        sentence: `The ${entry.word} is important.`
      }
    }

    return entry
  })

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8')
  console.log(`  ✅ Fixed ${fixed} entries`)
  return fixed
}

// Main execution
console.log('🔧 Fixing Broken Sentences')
console.log('===========================\n')

const files = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']
let totalFixed = 0

files.forEach(file => {
  totalFixed += fixFile(file)
})

console.log(`\n✅ Total fixed: ${totalFixed} entries\n`)

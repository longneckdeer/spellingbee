import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Common English words with proper Traditional Chinese definitions and sentences
// Suitable for Taiwanese spelling bee competition
const WORD_DEFINITIONS = {
  // Elementary level (A1)
  "say": {
    definition: "說，講",
    sentence: "Please say your name clearly.",
    partOfSpeech: "動詞"
  },
  "get": {
    definition: "得到，獲得",
    sentence: "I want to get good grades in school.",
    partOfSpeech: "動詞"
  },
  "saw": {
    definition: "看見（see的過去式）",
    sentence: "I saw a beautiful bird yesterday.",
    partOfSpeech: "動詞"
  },
  "use": {
    definition: "使用，利用",
    sentence: "We use computers every day.",
    partOfSpeech: "動詞"
  },
  "way": {
    definition: "方法，道路",
    sentence: "This is the best way to learn English.",
    partOfSpeech: "名詞"
  },
  "new": {
    definition: "新的，嶄新的",
    sentence: "I got a new backpack for school.",
    partOfSpeech: "形容詞"
  },
  "old": {
    definition: "老的，舊的",
    sentence: "My grandfather is very old and wise.",
    partOfSpeech: "形容詞"
  },
  "see": {
    definition: "看見，看到",
    sentence: "I can see the mountains from my window.",
    partOfSpeech: "動詞"
  },
  "make": {
    definition: "製作，做",
    sentence: "Let's make a cake for the party.",
    partOfSpeech: "動詞"
  },
  "come": {
    definition: "來，過來",
    sentence: "Please come to my birthday party.",
    partOfSpeech: "動詞"
  },
  "look": {
    definition: "看，注視",
    sentence: "Look at the beautiful sunset!",
    partOfSpeech: "動詞"
  },
  "find": {
    definition: "找到，發現",
    sentence: "I can't find my pencil case.",
    partOfSpeech: "動詞"
  },
  "give": {
    definition: "給，給予",
    sentence: "Please give me your homework.",
    partOfSpeech: "動詞"
  },
  "tell": {
    definition: "告訴，講述",
    sentence: "Can you tell me the time?",
    partOfSpeech: "動詞"
  },
  "work": {
    definition: "工作，運作",
    sentence: "My father works at a hospital.",
    partOfSpeech: "動詞"
  },
  "call": {
    definition: "打電話，叫",
    sentence: "I will call you tomorrow.",
    partOfSpeech: "動詞"
  },
  "feel": {
    definition: "感覺，覺得",
    sentence: "I feel happy when I see my friends.",
    partOfSpeech: "動詞"
  },
  "hand": {
    definition: "手",
    sentence: "Please raise your hand if you know the answer.",
    partOfSpeech: "名詞"
  },
  "high": {
    definition: "高的",
    sentence: "The mountain is very high.",
    partOfSpeech: "形容詞"
  },
  "year": {
    definition: "年，年度",
    sentence: "I am ten years old this year.",
    partOfSpeech: "名詞"
  },
  "different": {
    definition: "不同的，相異的",
    sentence: "People have different hobbies.",
    partOfSpeech: "形容詞"
  },
  "important": {
    definition: "重要的",
    sentence: "It is important to study hard.",
    partOfSpeech: "形容詞"
  },
  "beautiful": {
    definition: "美麗的，漂亮的",
    sentence: "Taiwan has many beautiful landscapes.",
    partOfSpeech: "形容詞"
  },
  "wonderful": {
    definition: "精彩的，極好的",
    sentence: "We had a wonderful time at the museum.",
    partOfSpeech: "形容詞"
  },
  "because": {
    definition: "因為",
    sentence: "I study English because it is useful.",
    partOfSpeech: "連接詞"
  }
}

// Generate definition and sentence for a word
function generateContent(word, cefr, originalPartOfSpeech) {
  // Check if we have a manual definition
  if (WORD_DEFINITIONS[word]) {
    return WORD_DEFINITIONS[word]
  }

  // For words without manual definitions, generate based on patterns
  // This is a simplified version - ideally you'd use an API or manual curation

  const partOfSpeech = originalPartOfSpeech || "名詞"

  // Generate basic definition (you'll need to replace these with real definitions)
  const definition = `${word}（待補充翻譯）`

  // Generate simple sentence based on part of speech
  let sentence
  if (partOfSpeech === "動詞") {
    sentence = `Students learn to ${word} in class.`
  } else if (partOfSpeech === "形容詞") {
    sentence = `The book is very ${word}.`
  } else if (partOfSpeech === "名詞") {
    sentence = `The ${word} is on the table.`
  } else if (partOfSpeech === "副詞") {
    sentence = `She speaks ${word}.`
  } else {
    sentence = `This sentence uses the word "${word}".`
  }

  return { definition, sentence, partOfSpeech }
}

// Process a dictionary file
function processDictionary(filename) {
  const filePath = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data', filename)

  console.log(`\nProcessing ${filename}...`)

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let fixed = 0
  let needsManual = 0

  const updated = data.map(entry => {
    // Check if entry needs fixing
    const needsFix = entry.definition.includes('的中文意思') ||
                     entry.sentence.includes('was found') ||
                     entry.sentence.includes('is useful') ||
                     entry.sentence.includes('must ') ||
                     entry.sentence.includes('We have a ')

    if (needsFix) {
      const content = generateContent(entry.word, entry.cefr, entry.partOfSpeech)

      if (content.definition.includes('待補充翻譯')) {
        needsManual++
      } else {
        fixed++
      }

      return {
        ...entry,
        definition: content.definition,
        sentence: content.sentence,
        partOfSpeech: content.partOfSpeech
      }
    }

    return entry
  })

  // Save updated file
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8')

  console.log(`  ✅ Fixed: ${fixed} entries`)
  console.log(`  ⚠️  Needs manual review: ${needsManual} entries`)
  console.log(`  Total: ${data.length} entries`)

  return { fixed, needsManual, total: data.length }
}

// Main execution
console.log('🔧 Dictionary Fixer')
console.log('===================\n')
console.log('NOTE: This script fixes obvious placeholder text.')
console.log('Words without manual definitions will be marked for review.\n')

const files = [
  'elementary.json',
  'middle.json',
  'high.json',
  'university.json',
  'expert.json'
]

let totalFixed = 0
let totalNeedsManual = 0
let totalWords = 0

files.forEach(file => {
  const result = processDictionary(file)
  totalFixed += result.fixed
  totalNeedsManual += result.needsManual
  totalWords += result.total
})

console.log('\n' + '='.repeat(50))
console.log('\nSummary:')
console.log(`  Total words: ${totalWords}`)
console.log(`  Fixed with proper definitions: ${totalFixed}`)
console.log(`  Needs manual translation: ${totalNeedsManual}`)
console.log(`\nNext steps:`)
console.log(`  1. Review files marked "待補充翻譯"`)
console.log(`  2. Add more entries to WORD_DEFINITIONS in this script`)
console.log(`  3. Re-run the script to apply more fixes`)
console.log(`  4. Consider using translation API for remaining words\n`)

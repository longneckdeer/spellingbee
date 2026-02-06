import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Comprehensive English-Traditional Chinese dictionary
// Curated for Taiwan spelling bee competition
const COMPLETE_DEFINITIONS = {
  // Expert level words that need fixing
  "accordion": {
    definition: "手風琴",
    sentence: "She plays the accordion beautifully.",
    partOfSpeech: "名詞"
  },
  "granddaughter": {
    definition: "孫女",
    sentence: "My granddaughter is seven years old.",
    partOfSpeech: "名詞"
  },
  "abnegate": {
    definition: "放棄；克己",
    sentence: "He chose to abnegate his claim to the throne.",
    partOfSpeech: "動詞"
  },
  "acquiesce": {
    definition: "默許；默認",
    sentence: "They finally acquiesced to the demands.",
    partOfSpeech: "動詞"
  },
  "abbreviate": {
    definition: "縮寫；縮短",
    sentence: "We often abbreviate long words when taking notes.",
    partOfSpeech: "動詞"
  },
  "aberrant": {
    definition: "異常的；偏離常軌的",
    sentence: "The aberrant behavior worried his teachers.",
    partOfSpeech: "形容詞"
  },
  "abstention": {
    definition: "棄權；節制",
    sentence: "His abstention from voting surprised everyone.",
    partOfSpeech: "名詞"
  },
  "abstraction": {
    definition: "抽象；抽象概念",
    sentence: "Mathematics involves a lot of abstraction.",
    partOfSpeech: "名詞"
  },
  "acclaim": {
    definition: "稱讚；喝采",
    sentence: "The movie received critical acclaim.",
    partOfSpeech: "名詞"
  },
  "accolade": {
    definition: "榮譽；讚揚",
    sentence: "She received many accolades for her research.",
    partOfSpeech: "名詞"
  },
  "accrue": {
    definition: "累積；增加",
    sentence: "Interest will accrue on your savings account.",
    partOfSpeech: "動詞"
  },
  "abstruse": {
    definition: "深奧的；難解的",
    sentence: "The professor's explanation was too abstruse.",
    partOfSpeech: "形容詞"
  },
  "acquittal": {
    definition: "無罪釋放；免除",
    sentence: "The jury's acquittal shocked the public.",
    partOfSpeech: "名詞"
  },
  "abulia": {
    definition: "意志缺失；無決斷力",
    sentence: "Abulia can be a symptom of certain disorders.",
    partOfSpeech: "名詞"
  },
  "accessory": {
    definition: "配件；附件",
    sentence: "She bought a new accessory for her phone.",
    partOfSpeech: "名詞"
  },
  "accession": {
    definition: "就職；加入",
    sentence: "His accession to the throne was celebrated.",
    partOfSpeech: "名詞"
  },
  "accentuate": {
    definition: "強調；突出",
    sentence: "The makeup accentuates her eyes.",
    partOfSpeech: "動詞"
  },
  "accredit": {
    definition: "認可；授權",
    sentence: "The university was accredited last year.",
    partOfSpeech: "動詞"
  },
  "abstemious": {
    definition: "有節制的；節儉的",
    sentence: "He lived an abstemious lifestyle.",
    partOfSpeech: "形容詞"
  },
  "acclamation": {
    definition: "歡呼；喝采",
    sentence: "She was elected by acclamation.",
    partOfSpeech: "名詞"
  },
  "acclimate": {
    definition: "適應；服水土",
    sentence: "It takes time to acclimate to high altitudes.",
    partOfSpeech: "動詞"
  },
  "accomplice": {
    definition: "共犯；幫兇",
    sentence: "The police arrested him as an accomplice.",
    partOfSpeech: "名詞"
  },
  "accoutrements": {
    definition: "裝備；配件",
    sentence: "The knight wore all his accoutrements.",
    partOfSpeech: "名詞"
  },
  "accreditation": {
    definition: "認證；鑑定合格",
    sentence: "The school received full accreditation.",
    partOfSpeech: "名詞"
  },
  "acquiescence": {
    definition: "默許；默認；順從",
    sentence: "His acquiescence was taken as agreement.",
    partOfSpeech: "名詞"
  },
  "abecedarian": {
    definition: "按字母順序的；初學者",
    sentence: "The abecedarian poem uses the alphabet.",
    partOfSpeech: "名詞"
  },
  "abjuration": {
    definition: "誓言放棄；公開放棄",
    sentence: "The abjuration was signed under pressure.",
    partOfSpeech: "名詞"
  },
  "abnegation": {
    definition: "克己；自我否定",
    sentence: "Her abnegation of personal desires was admirable.",
    partOfSpeech: "名詞"
  },
  "abomination": {
    definition: "厭惡；憎惡的事物",
    sentence: "He considered the policy an abomination.",
    partOfSpeech: "名詞"
  },
  "abortifacient": {
    definition: "墮胎藥；引產藥",
    sentence: "The drug has abortifacient properties.",
    partOfSpeech: "名詞"
  },
  "aboveboard": {
    definition: "光明正大的；誠實的",
    sentence: "All their business dealings were aboveboard.",
    partOfSpeech: "形容詞"
  },
  "abracadabra": {
    definition: "咒語；胡言亂語",
    sentence: "The magician said abracadabra before the trick.",
    partOfSpeech: "名詞"
  },
  "abrasion": {
    definition: "擦傷；磨損",
    sentence: "The accident left an abrasion on his knee.",
    partOfSpeech: "名詞"
  },
  "abscission": {
    definition: "脫落；切斷",
    sentence: "Leaf abscission occurs in autumn.",
    partOfSpeech: "名詞"
  },
  "absquatulate": {
    definition: "突然離開；逃走",
    sentence: "He absquatulated before paying the bill.",
    partOfSpeech: "動詞"
  },
  "abstemiously": {
    definition: "節制地；有節制地",
    sentence: "She ate abstemiously to maintain her health.",
    partOfSpeech: "副詞"
  },
  "abstemiousness": {
    definition: "節制；節儉",
    sentence: "His abstemiousness was well known.",
    partOfSpeech: "名詞"
  },
  "abstergent": {
    definition: "清潔劑；去垢劑",
    sentence: "Use an abstergent to clean the surface.",
    partOfSpeech: "名詞"
  },
  "absurdism": {
    definition: "荒誕主義",
    sentence: "The play explores themes of absurdism.",
    partOfSpeech: "名詞"
  },
  "abutment": {
    definition: "橋墩；支撐物",
    sentence: "The bridge abutment needs repair.",
    partOfSpeech: "名詞"
  },
  "abyssal": {
    definition: "深海的；深不可測的",
    sentence: "Abyssal zones are the deepest ocean areas.",
    partOfSpeech: "形容詞"
  },
  "academician": {
    definition: "學者；院士",
    sentence: "He was elected as an academician.",
    partOfSpeech: "名詞"
  },
  "accessorize": {
    definition: "佩戴飾品；搭配配件",
    sentence: "She knows how to accessorize her outfits.",
    partOfSpeech: "動詞"
  }
}

// Function to check if entry needs fixing
function needsFix(entry) {
  return entry.definition.includes('需要定義') ||
         entry.sentence.includes('is very interesting') ||
         entry.sentence.includes('I ') && entry.sentence.includes(' every day')
}

// Process dictionary files
function fixDictionary(filename) {
  const filePath = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data', filename)
  console.log(`\n📝 Processing ${filename}...`)

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let fixed = 0

  const updated = data.map(entry => {
    if (needsFix(entry) && COMPLETE_DEFINITIONS[entry.word]) {
      const fix = COMPLETE_DEFINITIONS[entry.word]
      fixed++
      return {
        ...entry,
        definition: fix.definition,
        sentence: fix.sentence,
        partOfSpeech: fix.partOfSpeech
      }
    }
    return entry
  })

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8')
  console.log(`  ✅ Fixed ${fixed} entries`)
  return fixed
}

// Main execution
console.log('🔧 Comprehensive Dictionary Fix')
console.log('================================\n')

const files = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']
let totalFixed = 0

files.forEach(file => {
  totalFixed += fixDictionary(file)
})

console.log(`\n✅ Total fixed: ${totalFixed} entries\n`)

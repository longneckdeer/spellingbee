# Spelling Bee Dictionary System

## Overview

The game dictionary contains **4,684 English words** organized by difficulty (1-100) and CEFR proficiency levels, specifically calibrated for Taiwanese English learners.

**Stop words excluded**: Articles (a, an, the), pronouns (I, you, he, she, it), common prepositions (to, by, in, on), conjunctions (and, or, but), and other function words have been filtered out as they are too common and simple for a spelling game.

## Word Distribution

| Level | Chinese Name | Difficulty Range | Word Count | Description |
|-------|-------------|------------------|------------|-------------|
| 1 | 小學 (Elementary) | 1-25 | 696 | Basic everyday vocabulary, high-frequency words |
| 2 | 中學 (Middle School) | 26-45 | 2,128 | Common intermediate vocabulary |
| 3 | 高中 (High School) | 46-65 | 1,531 | Advanced high school level |
| 4 | 大學 (University) | 66-85 | 286 | Academic and professional vocabulary |
| 5 | 英文高手 (Expert) | 86-100 | 43 | Advanced literary and technical terms |

## Difficulty Scoring Algorithm

The difficulty score (1-100) is calculated based on multiple factors:

### Base Score (CEFR Level)
- **A1**: 10 points - Beginner (elementary school)
- **A2**: 20 points - Elementary
- **B1**: 35 points - Intermediate (middle/high school)
- **B2**: 55 points - Upper intermediate (university)
- **C1**: 75 points - Advanced
- **C2**: 90 points - Expert/Native

### Spelling Complexity Factors

#### 1. Word Length (+0 to +20 points)
- 12+ letters: +20
- 10-11 letters: +15
- 8-9 letters: +10
- 6-7 letters: +5
- 3 letters or fewer: -5

#### 2. Silent Letters (+8 points each)
- Initial 'kn' (knight, know): +8
- Initial 'wr' (write, wrong): +8
- Internal/final 'gh' (light, though): +10
- Final 'mb' (climb, thumb): +8
- 'gn' pattern (sign, foreign): +8

#### 3. Irregular Patterns (+5-12 points)
- 'ough', 'eigh', 'augh': +12 (thought, eight, caught)
- 'tion', 'sion', 'cian': +6 (nation, vision, musician)
- 'ei' (not after 'c'): +8 (weird, their)
- 'ph', 'ck', 'dge': +5 (phone, kick, bridge)

#### 4. Double Letters (+3 points per occurrence)
- Consecutive same letters (letters, little, succeed)
- Multiple doubles increase difficulty

#### 5. Consonant Clusters (+10 points)
- 3+ consecutive consonants (strength, christmas)

#### 6. Unusual Letters (+7 points)
- Contains q, x, or z (quiz, fox, zone)

#### 7. Multiple Syllables (+5 points)
- 4+ syllables add complexity

## Taiwanese Student Considerations

The scoring accounts for challenges specific to Taiwanese English learners:

### Common Difficulties
1. **Phonetic Irregularities** - English spelling doesn't match pronunciation
   - 'ough' has 9 different pronunciations
   - Silent letters are uncommon in Chinese pinyin

2. **L/R Confusion** - Not distinguished in some Chinese dialects
   - Words with both L and R rated slightly higher

3. **V/W Sounds** - Not present in Mandarin
   - Initial 'v' and 'w' patterns noted

4. **Th Sounds** - No equivalent in Mandarin
   - 'th' patterns add slight difficulty

5. **Word Familiarity** - Based on Taiwanese curriculum
   - CEFR alignment matches Ministry of Education guidelines
   - Vocabulary range: 4,500 (high school) to 7,000+ (university)

## Data Format

Each word entry contains:

```json
{
  "word": "example",
  "definition": "例子 (Traditional Chinese)",
  "sentence": "This is an example sentence.",
  "partOfSpeech": "名詞",
  "cefr": "B1",
  "difficulty": 45
}
```

### Fields

- **word**: The English word to spell
- **definition**: Traditional Chinese translation (繁體中文)
- **sentence**: Example sentence with word in context
- **partOfSpeech**: Part of speech in Chinese (名詞, 動詞, etc.)
- **cefr**: Common European Framework of Reference level (A1-C2)
- **difficulty**: Calculated difficulty score (1-100)

## Progressive Difficulty with Randomness

Each game uses a **bucket system** to ensure progressive difficulty while keeping games unique:

### How It Works

Words in each level are divided into 5 difficulty buckets:

| Rounds | Bucket | Difficulty Portion | Selection |
|--------|--------|-------------------|-----------|
| 1-3 | Bucket 1 | Easiest 20% | Random from bucket |
| 4-6 | Bucket 2 | Next 20% | Random from bucket |
| 7-9 | Bucket 3 | Middle 20% | Random from bucket |
| 10-12 | Bucket 4 | Next 20% | Random from bucket |
| 13+ | Bucket 5 | Hardest 20% | Random from bucket |

### Example: Middle School Level (小學)

Difficulty range: 26-45 (20 points total)

- **Rounds 1-3**: Words with difficulty 26-29 (easiest)
- **Rounds 4-6**: Words with difficulty 30-33
- **Rounds 7-9**: Words with difficulty 34-37 (middle)
- **Rounds 10-12**: Words with difficulty 38-41
- **Rounds 13+**: Words with difficulty 42-45 (hardest)

Within each bucket, words are **randomly selected**, so:
- ✓ Each game is unique (different words each time)
- ✓ Difficulty progresses naturally (gets harder each 3 rounds)
- ✓ Fair gameplay (no memorization advantage)

### Benefits

1. **No repetition**: Players won't see the same words in the same order
2. **Smooth progression**: Difficulty increases gradually, not randomly
3. **Replayability**: Even in the same room, each game feels fresh
4. **Fair challenge**: Everyone starts easy and faces harder words later

## Word Sources

The dictionary is based on authoritative word lists:

- **[Oxford 3000/5000](https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000)** - Core vocabulary for learners
- **[CEFR Word Lists](https://cental.uclouvain.be/cefrlex/)** - European framework alignment
- **[Academic Word List](https://www.sciencedirect.com/science/article/abs/pii/S0889490617302211)** - University-level vocabulary
- **[Taiwan MOE Guidelines](https://english.moe.gov.tw/np-33-1.html)** - Taiwanese curriculum standards

## Expanding the Dictionary

### To add more words:

1. Edit `scripts/expandDictionary.js`
2. Add words to appropriate CEFR level arrays
3. Run: `node scripts/expandDictionary.js`
4. Word files are auto-generated in `src/gameTypes/english-spelling/data/`

### To create full dictionary coverage:

For a truly comprehensive dictionary (170,000+ words), consider:

1. **Import established word lists**:
   - Download COCA (Corpus of Contemporary American English)
   - Use British National Corpus (BNC)
   - Import CELEX database

2. **API Integration**:
   ```javascript
   // Example using dictionary API for definitions
   const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
   const data = await response.json()
   ```

3. **Machine Translation**:
   ```javascript
   // Example using Google Translate API
   const translation = await translate.translate(word, 'zh-TW')
   ```

## References

**CEFR Resources:**
- [CEFRLex](https://cental.uclouvain.be/cefrlex/) - 13,000 lexical entries by CEFR level
- [CEFR Lookup Tool](https://cefrlookup.com/) - Free word level checker
- [LanGeek CEFR Vocabulary](https://langeek.co/en/vocab/level-based)

**Taiwanese Education:**
- [English Vocabulary for High Schools](https://www.taipeitimes.com/News/taiwan/archives/2018/01/23/2003686279) - Taiwan reference word lists
- [MOE Language Resources](https://english.moe.gov.tw/np-33-1.html)
- [Vocabulary Research for Taiwanese Students](https://www.sciencedirect.com/science/article/abs/pii/S0889490617302211)

**Word Difficulty:**
- [What Makes a Word Difficult?](https://www.jocrf.org/what-makes-a-word-difficult/) - Johnson O'Connor Research
- [Spelling Difficulty Factors](https://www.3plearning.com/blog/top-10-hardest-words-spell/)

## Stop Words Filtering

The following categories are excluded as they're too common/simple:

- **Articles**: a, an, the
- **Pronouns**: I, you, he, she, it, we, they, me, him, her, us, them, etc.
- **Prepositions**: in, on, at, to, for, of, from, by, with, about, etc.
- **Conjunctions**: and, or, but, if, because, when, while, etc.
- **Auxiliary verbs**: be, am, is, are, was, were, have, has, had, do, does, did
- **Modal verbs**: can, could, may, might, must, shall, should, will, would
- **Common adverbs**: not, no, yes, very, too, just, only, now, here, there
- **Numbers**: one, two, three, first, second, hundred, thousand, etc.
- **Very short words**: 1-2 letters (too simple)

**Total filtered**: 138 stop words (2.9% of original dictionary)

## Statistics

```
Total Words: 4,684 (after filtering)
├── Elementary (小學): 696 words (14.9%)
├── Middle (中學): 2,128 words (45.4%)
├── High (高中): 1,531 words (32.7%)
├── University (大學): 286 words (6.1%)
└── Expert (英文高手): 43 words (0.9%)

CEFR Distribution:
├── A1: ~800 words
├── A2: ~700 words
├── B1: ~2,000 words
├── B2: ~500 words
├── C1: ~300 words
└── C2: ~50 words
```

## Notes

- All definitions are in Traditional Chinese (繁體中文) for Taiwanese users
- Part of speech labels use Chinese terminology
- Example sentences are simple and contextually clear
- Words progress from common to rare within each level
- Difficulty scores ensure fair gameplay progression

---

**Generated**: 2026-02-01
**Version**: 1.1
**Total Words**: 4,684 (after stop word filtering)

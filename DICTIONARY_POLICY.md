# Dictionary Word Addition Policy
## 超級拼字王 (Super Spelling Champion)

This document outlines the clear policy for adding new words to the spelling bee dictionary.

---

## Core Principles

### 1. **Citation Forms Only**
✅ **Always add the base/citation form of words**
- ✅ Infinitive verbs: `run`, `go`, `make` (not ran, went, made)
- ✅ Singular nouns: `cat`, `child` (not cats, children)
- ✅ Base adjectives: `big`, `happy` (not bigger, happiest)
- ✅ Present tense: `do`, `have` (not did, had)

❌ **Never add inflected forms**
- ❌ Past tense: walked, jumped, went, saw
- ❌ Plurals: cats, dogs, children
- ❌ Gerunds: running, swimming, dancing
- ❌ Past participles: spoken, written, broken
- ❌ Comparatives/superlatives: bigger, fastest

### 2. **Exclude Ultra-Basic Sight Words**

❌ **DO NOT include words that are too simple for spelling practice:**

**Excluded Categories:**
- ❌ **Single letters**: `a`, `I`
- ❌ **Articles**: `a`, `an`, `the`
- ❌ **Ultra-short pronouns**: `I`, `me`, `we`, `he`, `it`
- ❌ **Ultra-short prepositions**: `in`, `on`, `at`, `to`, `by`, `of`
- ❌ **Ultra-short conjunctions**: `and`, `or`, `but`, `so`
- ❌ **Basic forms of "be"**: `am`, `is`, `are` (when standalone)
- ❌ **Other 2-letter words**: `up`, `no`, `go`, `do`

**Reasoning:**
These are **sight words** that students should recognize instantly by sight, not words that test spelling ability. Professional spelling bees don't test these because:
- They're memorized in kindergarten/1st grade
- No spelling challenge involved
- Not pedagogically valuable for competition

**Minimum Word Length Rule:**
✅ **Generally require 3+ letters** for spelling bee suitability
- Exception: Technical terms or unusual words (like "ax", "ox")
- Exception: Words with spelling challenges despite short length

**What TO include instead:**
- ✅ 3+ letter words with actual spelling challenges
- ✅ Words students need to sound out or apply spelling rules
- ✅ Words commonly misspelled by target age group

---

## Word Selection Criteria

### Priority 1: Spelling Bee Appropriate Words
Words from standard spelling bee lists:
- **Scripps National Spelling Bee Study Lists** (450-4,000 words)
- **Dolch Sight Words** - BUT exclude ultra-basic ones (a, an, the, etc.)
- **Fry's First 1000 Words** - BUT exclude 2-letter function words
- **Grade-level spelling curriculum** (words actually tested in schools)

**Key Filter**: Word must have spelling challenge value
- ✅ Include: `friend` (ie vs ei), `because` (eau sound), `their` (ei)
- ❌ Exclude: `a`, `an`, `the`, `in`, `on`, `to`, `is`, `am`, `go`

### Priority 2: Grade-Appropriate Vocabulary
Words appropriate for the target age group:
- Elementary (小學): Ages 6-12, Grades 1-6
- Middle (中學): Ages 12-15, Grades 7-9
- High (高中): Ages 15-18, Grades 10-12
- University (大學): College level
- Expert (英文高手): Advanced learners

### Priority 3: Pedagogical Value
✅ Words that are:
- Commonly misspelled
- Important for academic writing
- Frequently tested in standardized exams
- Part of core vocabulary lists

❌ Avoid words that are:
- Extremely rare or archaic
- Brand names or proper nouns (unless educational)
- Slang or informal speech
- Offensive or inappropriate

---

## Word Entry Requirements

Each word **must** include:

### 1. **Word** (required)
- Use the citation form
- Capitalize only if it's a proper noun
- Example: `beautiful` (not Beautiful)

### 2. **Definition** (required)
- Write in English (for TTS compatibility)
- Keep it simple and student-friendly
- Aim for 10-30 words
- Focus on the most common meaning
- Example: `"beautiful: pleasing the senses or mind aesthetically"`

### 3. **Sentence** (required)
- Provide clear context
- Use simple, natural language
- Show the word in typical usage
- Keep it age-appropriate
- Example: `"The sunset was beautiful tonight."`

### 4. **Part of Speech** (required)
Use Traditional Chinese:
- `名詞` - noun
- `動詞` - verb
- `形容詞` - adjective
- `副詞` - adverb
- `介詞` - preposition
- `連詞` - conjunction
- `代詞` - pronoun
- `冠詞` - article
- `數詞` - number
- `助動詞` - auxiliary verb

### 5. **Difficulty** (auto-calculated)
- Don't manually set this
- Will be calculated based on:
  - Word length
  - Syllable count
  - Spelling complexity
  - Common word frequency
  - Part of speech

---

## Adding Words Process

### Step 1: Verify Word Eligibility
Check that the word:
- [ ] Is a citation form (base form)
- [ ] Meets selection criteria
- [ ] Doesn't already exist in dictionary
- [ ] Has clear educational value

### Step 2: Prepare Word Data
Create entry with all required fields:
```json
{
  "word": "example",
  "definition": "a thing serving as a typical case or illustration",
  "sentence": "This is a good example of teamwork.",
  "partOfSpeech": "名詞"
}
```

### Step 3: Add to Dictionary
1. Determine which source file to modify (optional, as redistribution will happen)
2. Add the word entry
3. **Do NOT manually set difficulty** - it will be calculated

### Step 4: Recalculate Difficulty
Run the difficulty calculation script:
```bash
python recalculate_difficulty.py
```

This will:
- Assign percentile-based difficulty (0-100)
- Redistribute words to appropriate level files
- Maintain proper distribution across levels

---

## Difficulty Calculation (Detailed)

### Overview: Pedagogically Sound Approach

Difficulty should reflect **actual learning difficulty for Taiwanese students**, not just spelling complexity.

**Primary Factors (in order of importance):**
1. **CEFR Level** (A1-C2) - Industry standard for language proficiency
2. **Word Frequency** - How common the word is in actual English usage
3. **Taiwan Curriculum** - Whether taught in Taiwanese textbooks
4. **Spelling Complexity** - Secondary factor for tie-breaking
5. **Word Length** - Minor factor only

### Why This Approach?

❌ **OLD (Wrong)**: Long words = hard, short words = easy
- `cat` (3 letters) was rated easier than `philosophy` (10 letters)
- But both are common words students should know at different levels!

✅ **NEW (Correct)**: Based on learning progression
- A1 level: `cat`, `dog`, `house` (elementary students learn these first)
- C1 level: `philosophy`, `analyze`, `democracy` (advanced learners)
- Word length is secondary - `I` vs `go` vs `because` are all A1!

---

## Difficulty Levels Based on CEFR

### CEFR Framework Mapping

| CEFR | Difficulty | Taiwan Equivalent | Description | Word Count |
|------|-----------|-------------------|-------------|------------|
| **A1** | 0-15 | 小學 1-3年級 | Breakthrough/Beginner | ~500 words |
| **A2** | 15-30 | 小學 4-6年級 | Elementary | ~1,000 words |
| **B1** | 30-50 | 中學 7-9年級 | Intermediate | ~2,000 words |
| **B2** | 50-70 | 高中 10-12年級 | Upper Intermediate | ~3,000 words |
| **C1** | 70-90 | 大學/Advanced | Advanced | ~5,000 words |
| **C2** | 90-100 | 英文高手 | Proficiency/Mastery | 5,000+ words |

**Sources:**
- [Oxford 3000 & 5000 CEFR Levels](https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000)
- [CEFR Vocabulary Lists](https://www.esl-lounge.com/student/reference/a1-cefr-vocabulary-word-list.php)
- [Taiwan Junior High Curriculum](https://www.mdpi.com/2071-1050/15/5/4447) - 2,000 words required

---

## New Difficulty Calculation Method

### Stage 1: Determine CEFR Level (Primary Factor)

**CEFR Level determines base difficulty:**

```
A1 words → difficulty 0-15
A2 words → difficulty 15-30
B1 words → difficulty 30-50
B2 words → difficulty 50-70
C1 words → difficulty 70-90
C2 words → difficulty 90-100
```

**How to determine CEFR level:**

1. **Check Oxford 3000/5000 lists** (preferred)
   - Oxford 3000 = A1-B2 levels
   - Oxford 5000 = B2-C1 levels
   - [Access here](https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000)

2. **Check word frequency**
   - Top 500 most common = A1
   - 500-1000 = A2
   - 1000-2000 = B1
   - 2000-3000 = B2
   - 3000-5000 = C1
   - 5000+ = C2

3. **Check Taiwan curriculum**
   - Elementary textbook (小學) = A1-A2
   - Junior high required 2000 words (中學) = B1
   - Senior high (高中) = B2
   - College entrance exam 6480 words = C1-C2

### Stage 2: Apply Modifiers (Secondary Factors)

Within each CEFR level, adjust difficulty based on:

#### Modifier 1: Spelling Complexity (±5 points)
- Simple spelling (phonetic): -5 points
  - Examples: `cat`, `dog`, `run`
- Complex spelling patterns: +5 points
  - Silent letters: `knife`, `psychology`
  - Unusual patterns: `through`, `colonel`

#### Modifier 2: Word Frequency (±3 points)
- Very high frequency (top 1000): -3 points
- Very low frequency (rare): +3 points

#### Modifier 3: Word Length (±2 points minor)
- Very short (3-4 letters): -2 points
- Very long (12+ letters): +2 points
- **NOTE**: This is the LEAST important factor!

#### Factor 1: Word Length Score
**Formula**: `length × 3 points`

Longer words are generally harder to spell.

**Examples:**
- `cat` (3 letters) = 9 points
- `beautiful` (9 letters) = 27 points
- `congratulations` (15 letters) = 45 points

---

#### Factor 2: Syllable Count Score
**Formula**: `syllables × 8 points`

More syllables increase spelling difficulty.

**Syllable Counting Rules:**
- Count vowel groups: `beautiful` = beau-ti-ful = 3 syllables
- Silent 'e' at end doesn't count (if >1 syllable): `make` = 1 syllable
- Minimum 1 syllable for any word

**Examples:**
- `cat` (1 syllable) = 8 points
- `elephant` (3 syllables) = 24 points
- `responsibility` (6 syllables) = 48 points

---

#### Factor 3: Spelling Complexity Score
**Formula**: Variable based on spelling patterns

This is the most nuanced factor. It detects difficult spelling patterns:

##### a) Double Consonants (+3 points each)
Words with doubled consonants are harder to spell.
- `happen` → pp (+3)
- `better` → tt (+3)
- `address` → dd, ss (+6)

##### b) Silent Letter Patterns (+5 points each)
- `ght` → knight, fight, right
- `kn` → knife, know, knee
- `wr` → write, wrong, wrap
- `mb` → climb, thumb, lamb
- `gn` → sign, design, align
- `pn` → pneumonia
- `ps` → psychology
- `mn` → autumn, column
- `bt` → debt, doubt

##### c) Complex Vowel Patterns (+4 points each)
- `eau` → beautiful, bureau
- `ough` → through, thought, tough
- `augh` → caught, taught, daughter
- `eigh` → eight, weight, neighbor
- `ious` → curious, previous
- `eous` → gorgeous, courageous
- `uous` → continuous

##### d) ie/ei Confusion (+3 points)
- Words with `ie` or `ei`: believe, receive, weird, their

##### e) ph as 'f' sound (+3 points)
- photograph, telephone, elephant

##### f) gh combinations (+3 points)
- When gh makes 'f' sound: enough, laugh, tough
- Not when part of ght/augh/ough patterns

##### g) -tion/-sion/-cian endings (+2 points)
- Common but tricky: nation, decision, musician

##### h) Uncommon letters (+2 points)
- Words with `q`, `x`, or `z`: question, examine, analyze

**Complexity Examples:**
- `cat` → 0 complexity points (simple)
- `knife` → 5 points (kn silent pattern)
- `beautiful` → 4 points (eau pattern)
- `through` → 9 points (ough + gh pattern)
- `psychology` → 10 points (ps + ology)

---

#### Factor 4: Common Word Penalty
**Formula**: `-25 points` if word is very common

Very common words get easier difficulty scores, even if long.

**Common words list** (~150 words):
- Articles: a, an, the
- Pronouns: I, me, you, he, she, it, they
- Prepositions: in, on, at, to, for, with
- Common verbs: be, have, do, go, make, take, get
- Common nouns: time, day, people, water, school

**Examples:**
- `because` (7 letters, 2 syllables) → WITH penalty = lower difficulty
- `obscure` (7 letters, 2 syllables) → WITHOUT penalty = higher difficulty

---

#### Factor 5: Part of Speech Score
**Formula**: Fixed points based on part of speech

Different parts of speech have different typical difficulty levels.

| Part of Speech (Chinese) | English | Points | Reasoning |
|--------------------------|---------|--------|-----------|
| 冠詞 (Article) | a, an, the | 0 | Simplest words |
| 數詞 (Number) | one, two, three | 0 | Basic counting |
| 名詞 (Noun) | cat, house, water | 0 | Concrete, familiar |
| 代詞 (Pronoun) | I, you, they | 3 | Abstract reference |
| 動詞 (Verb) | run, think, make | 5 | Action words |
| 助動詞 (Auxiliary) | can, will, should | 7 | Helper verbs |
| 形容詞 (Adjective) | beautiful, happy | 8 | Descriptive words |
| 介詞 (Preposition) | through, among | 9 | Spatial/temporal |
| 副詞 (Adverb) | quickly, very | 10 | Modify verbs/adjectives |
| 連詞 (Conjunction) | although, because | 12 | Connect clauses |

---

### Stage 2: Percentile Normalization

After calculating raw scores for ALL words, we convert to percentiles (0-100).

**Process:**
1. Sort all words by raw difficulty score (lowest to highest)
2. Assign percentile rank to each word
3. Word at position 0 → difficulty = 0
4. Word at position 50% → difficulty = 50
5. Word at position 100% → difficulty = 100

**Why percentiles?**
- Ensures even distribution across 0-100 range
- Maintains relative difficulty relationships
- Automatically adjusts when new words are added

**Formula:**
```
difficulty = floor((position / (total_words - 1)) × 100)
```

---

### Difficulty Assignment Examples (CEFR-Based)

Let's walk through correct difficulty assignments:

#### Example 1: "cat"
```
CEFR Level:     A1 (basic animal word, taught in elementary)
Base Difficulty: 0-15
Modifiers:
  - Spelling:    Simple/phonetic → -5
  - Frequency:   Very high (top 500) → -3
  - Length:      3 letters → -2
──────────────────────────────────
Final Difficulty: 0
```
✅ Correct: A1 level word for young learners

#### Example 2: "beautiful"
```
CEFR Level:     A2 (common adjective, elementary level)
Base Difficulty: 15-30
Modifiers:
  - Spelling:    Complex ('eau' pattern) → +5
  - Frequency:   High (top 3000) → 0
  - Length:      9 letters → +2
──────────────────────────────────
Final Difficulty: 25-30
```
✅ Correct: A2 level despite being 9 letters (very common word)

#### Example 3: "analyze"
```
CEFR Level:     B2 (academic vocabulary, high school)
Base Difficulty: 50-70
Modifiers:
  - Spelling:    Complex ('yze' ending) → +3
  - Frequency:   Medium (top 5000) → 0
  - Length:      7 letters → 0
──────────────────────────────────
Final Difficulty: 55-60
```
✅ Correct: B2 level based on academic usage, not length

#### Example 4: "philosophy"
```
CEFR Level:     C1 (abstract academic concept)
Base Difficulty: 70-90
Modifiers:
  - Spelling:    Complex ('ph' pattern) → +3
  - Frequency:   Lower (5000+) → +2
  - Length:      10 letters → +1
──────────────────────────────────
Final Difficulty: 78-82
```
✅ Correct: C1 level advanced vocabulary

#### Example 5: "because"
```
CEFR Level:     A1 (basic conjunction, very common)
Base Difficulty: 0-15
Modifiers:
  - Spelling:    Moderate ('eau' sound) → +2
  - Frequency:   Extremely high (top 100) → -3
  - Length:      7 letters → 0
──────────────────────────────────
Final Difficulty: 8-10
```
✅ Correct: A1 despite 7 letters (essential basic word)

---

### Manual Difficulty Assessment (CEFR-Based)

If you need to estimate difficulty before adding a word:

**Quick Assessment Guide (Taiwan Education Context):**

| Difficulty | CEFR | Taiwan Level | When Taught | Examples |
|-----------|------|--------------|-------------|----------|
| **0-15** | A1 | 小學 1-3年級 | Elementary Grade 1-3 | cat, dog, run, play, mother, happy |
| **15-30** | A2 | 小學 4-6年級 | Elementary Grade 4-6 | beautiful, friend, restaurant, computer |
| **30-50** | B1 | 中學 7-9年級 | Junior High (2000-word requirement) | environment, government, education, community |
| **50-70** | B2 | 高中 10-12年級 | Senior High | analyze, evaluate, demonstrate, significant |
| **70-90** | C1 | 大學 | University/College entrance exam | philosophy, democracy, infrastructure, comprehensive |
| **90-100** | C2 | 英文高手 | Advanced/Native-like | juxtaposition, onomatopoeia, pharmaceutical |

**Assessment Questions:**

1. **Is it in Oxford 3000?**
   - Yes → A1-B2 (difficulty 0-70)
   - No → Check Oxford 5000

2. **Is it in Oxford 5000?**
   - Yes → B2-C1 (difficulty 50-90)
   - No → C2 (difficulty 90-100)

3. **When would Taiwanese students learn it?**
   - Elementary textbook → A1-A2 (0-30)
   - Junior high curriculum (2000 words) → B1 (30-50)
   - Senior high → B2 (50-70)
   - College entrance exam → C1 (70-90)
   - Not in curriculum → C2 (90-100)

4. **How common is it?**
   - Everyday conversation → Lower difficulty
   - Academic/technical → Higher difficulty
   - Literary/specialized → Highest difficulty

**Red Flags for High Difficulty (C1-C2):**
- ✓ Not in Oxford 5000
- ✓ Academic/technical jargon
- ✓ Abstract concepts (philosophy, democracy)
- ✓ Rarely used in daily life
- ✓ Not taught until university
- ✓ Foreign origin (Latin/Greek roots)

**Green Flags for Low Difficulty (A1-A2):**
- ✓ In Oxford 3000
- ✓ Taught in elementary school
- ✓ Used in everyday conversation
- ✓ Concrete nouns (cat, ball, house)
- ✓ Basic verbs (go, eat, play)
- ✓ Essential adjectives (big, good, happy)

---

### Special Cases (CEFR-Based Approach)

#### Case 1: Common Long Words
**Example**: `beautiful` (9 letters), `because` (7 letters), `restaurant` (10 letters)

❌ **OLD thinking**: Long = hard → difficulty 60+
✅ **NEW thinking**: A2 level = difficulty 20-25

**Why?**
- These are high-frequency words
- Taught in elementary school
- Students encounter them daily
- Length is irrelevant to learning difficulty

#### Case 2: Short Academic Words
**Example**: `thus` (4 letters), `via` (3 letters), `per` (3 letters)

❌ **OLD thinking**: Short = easy → difficulty 5-10
✅ **NEW thinking**: B2-C1 level = difficulty 60-75

**Why?**
- Academic/formal language
- Rarely used in daily conversation
- Not taught until high school/university
- Short length doesn't mean easy to learn

#### Case 3: Abstract vs Concrete
**Example**: `cat` vs `philosophy` (both common in their contexts)

✅ **Correct assessment**:
- `cat` (A1) → difficulty 0-5 (concrete, visual, early learning)
- `philosophy` (C1) → difficulty 75-80 (abstract, academic, late learning)

**Why?**
- Concrete nouns learned first (can point to them)
- Abstract concepts require cognitive maturity
- CEFR progression reflects this naturally

#### Case 4: Homophones and Spelling Traps
**Example**: `their/there/they're`, `to/too/two`

✅ **Assessment**:
- All are A1-A2 level (very common)
- Base difficulty: 0-20
- Add +3 for spelling confusion
- Final: 15-23 (still elementary level)

**Why?**
- Students learn these words early
- Spelling difficulty ≠ vocabulary difficulty
- Confusion is teaching point, not barrier to inclusion

---

### Resources for Determining CEFR Levels

**Official CEFR Word Lists:**
1. **Oxford Learner's Dictionaries** - [Oxford 3000 & 5000](https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000)
   - Searchable online dictionary with CEFR tags
   - Download complete wordlists by level
   - Most authoritative source

2. **Cambridge English** - [CEFR Wordlists](https://www.cambridgeenglish.org/images/149681-yle-flyers-word-list.pdf)
   - Official exam vocabulary lists
   - Organized by CEFR level

3. **ESL Lounge** - [CEFR Vocabulary Lists](https://www.esl-lounge.com/student/reference/a1-cefr-vocabulary-word-list.php)
   - Separate lists for A1, A2, B1, B2, C1, C2
   - Categorized by word type

4. **LanGeek** - [Level-Based Vocabulary](https://langeek.co/en/vocab/level-based)
   - Interactive lessons by CEFR level
   - Topic-organized

5. **GitHub Dataset** - [Words CEFR Dataset](https://github.com/Maximax67/Words-CEFR-Dataset)
   - 10,000+ words with CEFR labels
   - Machine-readable format for bulk processing

**Taiwan Curriculum References:**
- Junior High: 2,000-word requirement (typically B1 level)
- College Entrance: 6,480-word reference list (B2-C1)
- [Taiwan Education Analysis](https://www.mdpi.com/2071-1050/15/5/4447)

### How to Look Up a Word's CEFR Level

**Step-by-step:**
1. Go to [Oxford Learner's Dictionary](https://www.oxfordlearnersdictionaries.com)
2. Search for the word
3. Look for CEFR tag (A1, A2, B1, B2, C1, C2)
4. If marked with ⭐ = Oxford 3000 (essential)
5. If marked with ⭐⭐ = Oxford 5000 (extended)

**Example Lookup:**
- `cat` → A1 ⭐ (Oxford 3000, basic)
- `beautiful` → A2 ⭐ (Oxford 3000, elementary)
- `analyze` → B2 ⭐⭐ (Oxford 5000, upper intermediate)
- `philosophy` → C1 (advanced)

### Recalculating Difficulty

When you add new words, **recalculate** difficulty using CEFR-based method:

```bash
cd src/gameTypes/english-spelling/data
python recalculate_difficulty_cefr.py
```

**New calculation will:**
- Assign difficulty based on CEFR level (primary)
- Apply frequency modifiers (secondary)
- Consider spelling complexity (tertiary)
- Ignore word length as primary factor
- Maintain pedagogically sound progression

---

## Level Distribution

Words are automatically distributed to files based on difficulty:

| Level | Difficulty Range | Target Audience |
|-------|-----------------|-----------------|
| **elementary.json** | 0-35 | Grades 1-6 (小學) |
| **middle.json** | 25-60 | Grades 7-9 (中學) |
| **high.json** | 50-80 | Grades 10-12 (高中) |
| **university.json** | 70-95 | College (大學) |
| **expert.json** | 85-100 | Advanced (英文高手) |

Note: Ranges overlap intentionally to provide smooth difficulty progression.

---

## Quality Control Checklist

Before adding words, verify:

- [ ] **No inflected forms** (past tense, plurals, gerunds)
- [ ] **English definition** (for TTS compatibility)
- [ ] **Clear example sentence** (natural usage)
- [ ] **Correct part of speech** (in Traditional Chinese)
- [ ] **Age-appropriate** (suitable for students)
- [ ] **No duplicates** (word doesn't already exist)
- [ ] **Proper spelling** (verified in authoritative dictionary)

---

## Word Sources (Recommended)

### Official Spelling Bee Resources
- [Scripps National Spelling Bee - Words of the Champions](https://spellingbee.com)
- [School Spelling Bee Study Lists](https://spellingbee.com/study-tips)

### Standard Word Lists
- [Dolch Sight Words](https://www.readingrockets.org/topics/writing/articles/basic-spelling-vocabulary-list)
- [Fry's Word List](https://www.spelling-words-well.com/elementary-spelling-words.html)
- [Academic Word List](https://www.victoria.ac.nz/lals/resources/academicwordlist)

### Authoritative Dictionaries
- Merriam-Webster Dictionary
- Oxford English Dictionary
- Cambridge Dictionary

---

## Examples

### ✅ Good Word Entries

```json
{
  "word": "elephant",
  "definition": "a very large animal with a trunk and tusks",
  "sentence": "The elephant sprayed water with its trunk.",
  "partOfSpeech": "名詞"
}
```

```json
{
  "word": "celebrate",
  "definition": "to honor or mark a special occasion with festivities",
  "sentence": "We celebrate birthdays with cake and candles.",
  "partOfSpeech": "動詞"
}
```

### ❌ Bad Word Entries

```json
{
  "word": "elephants",  // ❌ Plural form
  "definition": "large animals",
  "sentence": "I saw elephants.",
  "partOfSpeech": "名詞"
}
```

```json
{
  "word": "celebrated",  // ❌ Past tense
  "definition": "honored a special occasion",
  "sentence": "We celebrated yesterday.",
  "partOfSpeech": "動詞"
}
```

```json
{
  "word": "celebrating",  // ❌ Gerund
  "definition": "honoring an occasion",
  "sentence": "We are celebrating now.",
  "partOfSpeech": "動詞"
}
```

---

## Maintenance Schedule

### Regular Review
- **Monthly**: Check for missing common words
- **Quarterly**: Review word coverage against standard lists
- **Annually**: Update with new Scripps Spelling Bee words

### Quality Audits
- Verify all words are citation forms
- Check for duplicates
- Ensure definitions are clear and accurate
- Validate example sentences

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-01 | Initial policy document |
| - | - | Added 120 common words (Dolch/Fry lists) |
| - | - | Removed 108 inflected forms |
| - | - | Implemented percentile-based difficulty |

---

## Contact

For questions about word additions or policy:
- Review this policy document
- Check existing word lists
- Follow the examples provided

**Remember**: When in doubt, add only citation forms!

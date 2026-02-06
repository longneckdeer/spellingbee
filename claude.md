# 超級拼字王 (Super Spelling Champion)

## Project Overview
Multiplayer survivor spelling game with Cloudflare Durable Objects (WebSocket), Vue.js, and Traditional Chinese UI.

**Game Flow**: Room Picker → Room → Play (survivor rounds) → Rankings

**Architecture**:
- **Frontend**: Cloudflare Pages (https://spellingisfun.pages.dev)
- **Backend**: Cloudflare Durable Objects Worker (WebSocket-based multiplayer)
- **Rooms**: Persistent game rooms managed by Durable Objects

---

## File Structure
```
src/
├── main.js, App.vue
├── components/          # RoomPicker, Classroom, SpellingArea, Blackboard, etc.
├── composables/         # useWebSocket.js (WebSocket connection)
├── stores/gameStore.js  # All game state (reactive)
├── services/            # tts.js, soundEffects.js
├── config/              # game.js, dictionary.js, messages.js
├── gameTypes/           # Plugin system
│   └── english-spelling/
├── server/              # Cloudflare Worker & Durable Objects
│   ├── GameRoom.js      # Durable Object (game room logic)
│   └── worker-do-only.js # Worker entry point
└── public/audio/        # MP3 pronunciation files
```

---

## Game Store (Single Source of Truth)
```javascript
// stores/gameStore.js
import { reactive } from 'vue'

export const gameStore = reactive({
  screen: 'roomPicker',  // 'roomPicker' | 'room'
  currentRoom: null,  // { level, levelName }
  gameType: null,

  localPlayer: {
    id: crypto.randomUUID(),
    nickname: '',
    isSeated: false,
    seatIndex: null
  },

  tables: [],  // 25 seats with player data & roundResults
  observers: [],  // Players not seated

  game: {
    isActive: false,
    currentRound: 0,
    currentQuestion: null,  // { word, definition, sentence, partOfSpeech }
    timeRemaining: 30,
    phase: 'waiting',  // 'waiting' | 'preparing' | 'playing' | 'reviewing' | 'gameEnd'
    reviewCountdown: 0
  },

  lastGameRanking: [],
  nextGameCountdown: 0,
  selectedTableIndex: null,  // For observers viewing
  gameHistory: []  // Local game history
});
```

---

## Game Type Plugin Interface
```javascript
// gameTypes/english-spelling/index.js
export default {
  id: 'english-spelling',
  name: '英文拼字',
  icon: '🔤',
  levels: [
    { id: 1, name: '小學', data: require('./data/elementary.json') },
    { id: 2, name: '中學', data: require('./data/middle.json') },
    { id: 3, name: '高中', data: require('./data/high.json') },
    { id: 4, name: '大學', data: require('./data/university.json') },
    { id: 5, name: '英文高手', data: require('./data/expert.json') }
  ],
  tts: { language: 'en-US', rate: 0.9 },

  getQuestion(levelId) {
    const level = this.levels.find(l => l.id === levelId);
    const words = level.data;
    return words[Math.floor(Math.random() * words.length)];
  },

  validate(question, answer) {
    return question.word.toLowerCase() === answer.trim().toLowerCase();
  },

  getPrompt(question) {
    return question.word;
  }
};
```

---

## Word Data Format
```json
{
  "word": "beautiful",
  "definition": "pleasing the senses or mind aesthetically",
  "sentence": "The sunset was absolutely beautiful.",
  "partOfSpeech": "adjective",
  "difficulty": 23,
  "cefr_level": "A2"
}
```

**Note:** This word doesn't have `taiwan_stage` because it's not in the Taiwan MOE 1200 word list.

**Field Descriptions:**
- `word`: Citation form only (infinitive, singular, base form)
- `definition`: English definition for TTS compatibility
- `sentence`: Complete, contextual example sentence
- `partOfSpeech`: English (noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection)
- `difficulty`: 0-100, calculated using hierarchical approach: Taiwan MOE (priority for elementary/junior high), CEFR (for high school/university), + AI assessment (spelling complexity, frequency, context)
- `cefr_level`: **(OPTIONAL)** A1, A2, B1, B2, C1, or C2 - only include if verified from reference sources
- `taiwan_stage`: **ONLY for MOE words** (from taiwan_moe_1200.txt)
  - 小學 (first 400 words in MOE list)
  - 中學 (words 401+ in MOE list)
  - Non-MOE words do NOT have this property (assumed harder than MOE curriculum)

---

## WebSocket Message Types
```javascript
// config/messages.js
export const MESSAGES = {
  // Room management
  PLAYER_JOIN_ROOM: 'player:join:room',
  PLAYER_LEAVE_ROOM: 'player:leave:room',
  PLAYER_SIT: 'player:sit',
  PLAYER_STAND: 'player:stand',
  PLAYER_LEFT: 'player:left',

  // Game flow
  PLAYER_READY: 'player:ready',
  PLAYER_TYPING: 'player:typing',
  ROUND_START: 'round:start',
  ROUND_ANSWER: 'round:answer',
  ROUND_END: 'round:end',
  GAME_END: 'game:end',

  // State sync
  STATE_SYNC: 'state:sync',

  // Timer updates (server → client)
  'time:update': 'time:update',
  'review:update': 'review:update',
  'prep:update': 'prep:update',
  'nextGame:update': 'nextGame:update',
  'game:preparing': 'game:preparing',
  'game:reset': 'game:reset'
};
```

**Architecture**: Server (Durable Object) broadcasts state changes to all connected clients via WebSocket.

---

## Merriam-Webster Dictionary API
```javascript
// config/dictionary.js
export const DICTIONARY_CONFIG = {
  baseUrl: 'https://www.dictionaryapi.com/api/v3',
  keys: {
    learners: process.env.MW_LEARNERS_KEY,
    collegiate: process.env.MW_COLLEGIATE_KEY
  },
  endpoints: {
    learners: '/references/learners/json',
    collegiate: '/references/collegiate/json'
  },
  audioBase: 'https://media.merriam-webster.com/audio/prons/en/us/mp3'
};
```

**Usage:**
- **Learner's Dictionary**: Simplified definitions for ESL students
- **Collegiate Dictionary**: Comprehensive definitions, pronunciation audio, etymology
- **Audio files**: Use Collegiate API to get `hwi.prs[0].sound.audio` filename, then construct audio URL

---

## Implementation Order

1. **Project Setup**
   - `npm create vite@latest . -- --template vue`
   - Install: `peerjs`, `vitest`, `playwright`

2. **Core Files**
   - `stores/gameStore.js` - reactive state
   - `config/game.js` - timer, game settings
   - `config/dictionary.js` - Merriam-Webster API keys
   - `config/messages.js` - WebSocket message types
   - `src/server/GameRoom.js` - Durable Object (room logic)
   - `src/server/worker-do-only.js` - Worker entry point

3. **Services**
   - `services/tts.js` - Web Speech API wrapper

4. **Game Type Plugin**
   - `gameTypes/english-spelling/index.js`
   - Word data files (50 words/level initially)

5. **Components** (in order)
   - `RoomPicker.vue` - room selection (levels 1-5)
   - `Classroom.vue` - main game view with 25 seats
   - `SpellingArea.vue` - player input and controls
   - `Blackboard.vue` - displays current question
   - `TableCell.vue` - individual player seat
   - `CurrentResults.vue` - shows round results

6. **Composables**
   - `useWebSocket.js` - WebSocket connection to Durable Object

7. **Testing**
   - Unit tests for store, plugins
   - E2E tests for full game flow

---

## Key Composables

### useWebSocket
```javascript
// composables/useWebSocket.js
import { ref } from 'vue'
import { gameStore } from '@/stores/gameStore'

export function useWebSocket() {
  const ws = ref(null)
  const isConnected = ref(false)

  const connect = (roomId) => {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = import.meta.env.DEV
        ? 'localhost:8788'  // Local dev server
        : 'spellingisfun-worker.jeff-kuo.workers.dev'  // Production Worker

      const wsUrl = `${protocol}//${host}/room/${roomId}`
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        isConnected.value = true
        send({ type: MESSAGES.PLAYER_JOIN_ROOM, playerId: gameStore.localPlayer.id, nickname: gameStore.localPlayer.nickname })
        resolve()
      }

      ws.value.onmessage = (event) => {
        const message = JSON.parse(event.data)
        handleMessage(message)
      }
    })
  }

  const send = (message) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ ...message, timestamp: Date.now() }))
    }
  }

  const submitAnswer = (answer) => {
    send({ type: MESSAGES.ROUND_ANSWER, playerId: gameStore.localPlayer.id, answer: answer.trim() })
  }

  const toggleReady = (isReady) => {
    send({ type: MESSAGES.PLAYER_READY, playerId: gameStore.localPlayer.id, isReady })
  }

  return { ws, isConnected, connect, send, submitAnswer, toggleReady, MESSAGES }
}
```

**Note**: All game timing is handled server-side by the Durable Object.

---

## Mobile-First CSS
```css
:root {
  --content-padding: 16px;
  --button-height: 48px;
  --grid-columns: 1;
}

@media (min-width: 768px) {
  :root { --grid-columns: 2; }
}

@media (min-width: 1024px) {
  :root { --grid-columns: 3; }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  gap: 16px;
}
```

---

## Testing

```bash
npm run test        # Unit tests
npm run test:e2e    # Browser tests
```

### Test Data Attributes
Use `data-testid` on interactive elements:
- `data-testid="game-english-spelling"`
- `data-testid="level-1"`
- `data-testid="nickname-input"`
- `data-testid="ready-button"`
- `data-testid="answer-input"`

---

## Dictionary Policy

### ⚠️ CRITICAL: Dictionary Organization Rules

**DO NOT reorganize or redistribute dictionary files without understanding these rules.**

#### Taiwan MOE Curriculum Alignment (Primary Organization)

The dictionaries are organized by **Taiwan's official MOE (Ministry of Education) curriculum**, NOT by CEFR levels alone:

| File | Taiwan Level | Description | Word Count |
|------|--------------|-------------|------------|
| `elementary.json` | 小學 | MOE basic words (grades 1-6) | ~450 |
| `middle.json` | 國中 | MOE remaining words (grades 7-9) | ~680 |
| `high.json` | 高中 | Beyond MOE 1200 (grades 10-12) | ~3,200 |
| `university.json` | 大學 | C1 level academic words | ~930 |
| `expert.json` | 英文高手 | C2 level advanced words | ~1,150 |

**IMPORTANT**:
- `taiwan_stage` field may differ from `cefr_level` - this is INTENTIONAL
- A word can be CEFR B1 but still be in 小學 if it's in Taiwan's MOE 1200 basic list
- The MOE 1200 word list is the official curriculum for Taiwan grades 1-9

#### Reference Files
- `taiwan_moe_1200.txt` - Official Taiwan MOE 1200 word list (DO NOT DELETE)
- Source: Taiwan Test Central (國教署)

### Core Principles

1. **Citation Forms Only** ✅
   - ✅ Infinitive verbs: `run`, `make` (not ran, made)
   - ✅ Singular nouns: `cat`, `child` (not cats, children)
   - ❌ Never add inflected forms (past tense, plurals, gerunds)

2. **Exclude Function Words** ❌ (Not suitable for spelling bee)
   - ❌ Articles: a, an, the
   - ❌ Pronouns: I, me, he, she, it, they, etc.
   - ❌ Prepositions: in, on, at, to, by, for, etc.
   - ❌ Conjunctions: and, but, or, if, etc.
   - ❌ Contractions: can't, don't, aren't, etc.
   - ❌ Auxiliary verbs: am, is, are, was, were, etc.
   - ✅ Keep content words (nouns, main verbs, adjectives, adverbs)

3. **Word Length is NOT the Primary Factor** ⚠️
   - `because` (7 letters) = A1 difficulty 8 (very common)
   - `philosophy` (10 letters) = C1 difficulty 62 (academic)
   - `sesquipedalian` (14 letters) = GRE difficulty 96 (graduate-level)

### Required Fields

```json
{
  "word": "example",
  "definition": "a thing serving as a typical case (English only)",
  "sentence": "This is a good example of teamwork.",
  "partOfSpeech": "noun",
  "difficulty": 45
}
```

**Optional fields:** `cefr_level`, `taiwan_stage` (only include if verified from reference sources)

### Sentence Quality Standards

✅ **Must be:**
- Complete sentences (no fragments)
- Grammatically correct
- Contextually meaningful
- Demonstrates word usage clearly
- Age-appropriate

❌ **Avoid:**
- Generic templates ("X is important")
- Fragments ("Some water.")
- Wrong word usage
- Too vague/generic

### Adding Words Process

1. Verify word is citation form (not inflected)
2. Check it doesn't already exist in any dictionary file
3. Check it's not a function word (see exclusion list above)
4. Fetch from Merriam-Webster API for definition and audio
5. Add to appropriate dictionary file based on Taiwan curriculum level
6. Download audio file to `public/audio/`

### Audio Files

**Location**: `public/audio/*.mp3`
**Coverage**: 99.6% of all dictionary words
**Source**: Merriam-Webster Collegiate Dictionary API

#### Audio Download Script
```bash
cd src/gameTypes/english-spelling/data
python download_mw_audio.py
```

#### MW Audio URL Structure
```
https://media.merriam-webster.com/audio/prons/en/us/mp3/{subdir}/{filename}.mp3
```

Subdirectory rules:
- Filename starts with "bix" → `bix/`
- Filename starts with "gg" → `gg/`
- Filename starts with digit → `number/`
- Otherwise → first letter of filename (e.g., `a/`, `b/`, `c/`)

#### Audio File Policy

**⚠️ CRITICAL: Merriam-Webster audio is ALWAYS the authoritative standard**

When there's a mismatch between audio and word definition:
- ✅ **KEEP** the MW audio file (it's the correct pronunciation)
- ✅ **CHANGE** the word entry (definition, sentence, etc.) to match the audio
- ❌ **NEVER** delete or replace MW audio files to match incorrect word data

**Rationale**:
- MW audio files are professionally recorded and verified
- Text definitions are easier to update than regenerating audio
- Maintains pronunciation consistency across the dictionary

**Example**: If `lower.mp3` says "flower", check if the word entry is wrong, not the audio.

### Utility Scripts (in `src/gameTypes/english-spelling/data/`)

| Script | Purpose |
|--------|---------|
| `download_mw_audio.py` | Download missing audio from MW API |
| `add_missing_moe_words.py` | Fetch missing MOE 1200 words from MW |
| `remove_inflected_forms.py` | Clean dictionaries of inflected forms |
| `extract_sat_vocab.py` | Extract vocabulary from PDF files |
| `merriam_webster_integration.py` | MW API integration utilities |
| `cefr_reference.py` | CEFR reference data |

**Note:** Difficulty is calculated using spelling complexity factors for Taiwanese students (see Difficulty Calculation Policy). Do NOT create scripts that assign difficulty based on file position - this creates circular logic.

### Data Integrity Policy

**CRITICAL: MOE classifications MUST be factual - NO ESTIMATES. CEFR is OPTIONAL.**

1. **CEFR Levels (OPTIONAL):**
   - ✅ If included, ONLY use reference-based CEFR levels from `cefr_reference_lists.json` (5,488 words)
   - ❌ NEVER estimate CEFR levels using heuristics (word length, suffixes, etc.)
   - ✅ It's OK to omit `cefr_level` field entirely if not verified
   - CEFR data is supplementary and not required for dictionary entries
   - Current coverage: ~39% of dictionary words have factual CEFR levels

2. **Taiwan MOE Classification (REQUIRED for MOE words):**
   - ✅ ONLY use MOE words from `taiwan_moe_1200.txt` (1,228 words)
   - First 400 words → 小學 (taiwan_stage = "小學")
   - Remaining 828 words → 中學 (taiwan_stage = "中學")
   - ❌ NEVER guess or estimate MOE classification
   - ❌ Non-MOE words should NOT have taiwan_stage property (assumed harder)

3. **Part of Speech (REQUIRED):**
   - ✅ Use English format: noun, verb, adjective, adverb, preposition, conjunction, pronoun, interjection
   - ❌ Do NOT use Chinese format (名詞, 動詞, etc.)

**Why factual data matters:** Incorrect classifications mislead learners about word difficulty. It's better to leave data incomplete than to provide inaccurate estimates.

---

### Difficulty Calculation Policy

**IMPORTANT:** Difficulty scoring (0-100) uses a hierarchical approach combining Taiwan MOE curriculum, CEFR levels, standardized test vocabulary (SAT/GRE/GMAT), and AI-assisted individual assessment.

#### Difficulty Ranges Overview

| Range | Game Level | Description |
|-------|------------|-------------|
| 0-30 | 小學 | Basic vocabulary with simple spelling |
| 31-50 | 中學 | Intermediate vocabulary |
| 51-70 | 高中 | Upper intermediate, some complex patterns |
| 71-90 | 大學 | Advanced academic vocabulary |
| 91-100 | 英文高手 | Expert/GRE level, complex spelling |

**Key design principles:**
- Difficulty adjusted for **Taiwanese students** (not US native speakers)
- Accounts for phonetic challenges (th, v sounds don't exist in Chinese)
- Silent letters, Greek/Latin patterns, and word length increase difficulty
- Same word may be harder for Taiwanese students than US students

#### File Mapping

| File | Difficulty Range | Words | Primary Source |
|------|-----------------|-------|----------------|
| `elementary.json` | 0-30 | ~1,100 | Taiwan MOE + basic vocabulary |
| `middle.json` | 31-50 | ~3,100 | Intermediate vocabulary |
| `high.json` | 51-70 | ~3,100 | Upper intermediate vocabulary |
| `university.json` | 71-90 | ~1,200 | Advanced academic vocabulary |
| `expert.json` | 91-100 | ~650 | Expert/GRE vocabulary |

**Difficulty factors for Taiwanese students:**
- Phonetic difficulty (th, v sounds - hard for Chinese speakers)
- Silent letters (kn, gn, mb, ght, wr)
- Word length (10+ letters)
- Greek/Latin patterns (psych-, -ology, -itious)
- Unusual spelling patterns (ough, eigh, eau)

#### Staging Vocabulary Files

| File | Status | Purpose |
|------|--------|---------|
| `sat_vocabulary.json` | Staging | ~984 SAT words (to be merged into expert.json) |
| `gregmat_vocab.json` | Staging | ~332 GRE/GMAT words (to be merged into expert.json) |

#### 1. Taiwan MOE Curriculum (Highest Priority)

**Source:** taiwan_moe_1200.txt (1,228 words total)
- First 400 words → 小學 (taiwan_stage = "小學")
- Remaining 828 words → 中學 (taiwan_stage = "中學")

**小學 (Elementary) - EXCLUSIVE:**
- ✅ IF word is in Taiwan MOE 小學 (first 400) → MUST be in 小學 difficulty range (0-25)
- ❌ ONLY MOE 小學 words can be in this range
- ❌ No other words allowed in elementary.json without MOE 小學 tag
- This ensures Taiwan elementary curriculum alignment

**中學 (Junior High) - MOE Priority + CEFR Supplement:**
- ✅ MOE 中學 words (positions 401+) → MUST be in 中學 difficulty range (25-40)
- ✅ CEFR A2/B1 words can supplement IF they fit the difficulty level
- MOE words take priority; CEFR words fill gaps

**高中 (Senior High) - MOE Priority + CEFR Supplement:**
- ✅ Beyond MOE 1200 vocabulary
- ✅ CEFR B2 words as primary source
- ✅ CEEC (大學入學考試中心) high school word lists
- Difficulty range: 40-55

#### 2. CEFR Levels (Primary for University/Expert)

**大學 (University):**
- CEFR C1-C2 academic vocabulary
- Difficulty range: 55-80
- Consider additional factors:
  - **Spelling complexity**: Silent letters, irregular patterns, consonant clusters
  - **Word frequency**: Common vs rare usage (use Claude Sonnet to assess)
  - **Morphological complexity**: Affixes, compound words, derivations

#### 3. Standardized Test Vocabulary (SAT/GRE/GMAT)

**SAT Vocabulary (80-90):**
- Target audience: US high school students (ages 16-18)
- Words educated adults should know but don't use daily
- Found in academic texts, literature, formal writing
- Examples: abrogate, ameliorate, ebullient, perfunctory

**GRE/GMAT Vocabulary (90-100):**
- Target audience: College graduates applying to graduate school
- More obscure, specialized, or archaic words
- Highest difficulty tier in the game
- Examples: perspicacious, recondite, sesquipedalian, pulchritude

#### 4. Fine-Tuned Individual Scoring (Claude Sonnet AI)

**Category ranges define BROAD RANGES only.**

For precise difficulty scores within ranges, use **Claude Sonnet (claude-sonnet-4-5)** to assess:

1. **Spelling Complexity** (0-10 points):
   - Phonetic consistency vs irregularity
   - Silent letters, double consonants, unusual letter combinations
   - Length relative to pronunciation

2. **Word Frequency** (0-10 points):
   - Common everyday usage vs specialized/rare
   - Corpus frequency data when available

3. **Contextual Difficulty** (0-10 points):
   - Multiple meanings or irregular usage
   - Common collocations and typical contexts
   - Confusion with similar words

**Example Assessments:**
```
Word: "beautiful"
- Category: A2 (base range 12-25)
- Spelling complexity: 8/10 (silent 'e', 'eau' pattern)
- Frequency: 2/10 (very common)
- Contextual: 3/10 (straightforward adjective)
→ Final difficulty: 23 (upper A2)

Word: "ameliorate"
- Category: SAT (base range 80-90)
- Spelling complexity: 6/10 (phonetic but long)
- Frequency: 7/10 (rarely used in speech)
- Contextual: 5/10 (formal register)
→ Final difficulty: 84 (mid SAT)

Word: "perspicacious"
- Category: GRE (base range 90-100)
- Spelling complexity: 8/10 (many syllables, uncommon pattern)
- Frequency: 9/10 (very rare)
- Contextual: 8/10 (easily confused with "perspicuous")
→ Final difficulty: 96 (high GRE)
```

#### Resources
- Taiwan MOE 1200 word list: `taiwan_moe_1200.txt`
- CEFR Reference Lists: `cefr_reference_lists.json`
- SAT Vocabulary: `sat_vocabulary.json` (SparkNotes 1000 Most Common SAT Words)
- GRE/GMAT Vocabulary: `gregmat_vocab.json`
- [Oxford 3000/5000](https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000)
- [CEFR Vocabulary Lists](https://www.esl-lounge.com/student/reference/a1-cefr-vocabulary-word-list.php)

---

## EXP Formula
```javascript
// config/game.js
export const GAME_CONFIG = {
  roundTimeSeconds: 30,
  minPlayersToStart: 2,
  expFormula: {
    winner: (players) => players * 10,
    second: (players) => players * 7,
    third: (players) => players * 5,
    other: (rounds) => rounds * 2
  }
};
```

---

## Deployment

**IMPORTANT**: After making ANY changes to the codebase (code, MP3 files, assets, etc.), you MUST deploy to production.

### Deployment Command
```bash
npm run deploy
```

### When to Deploy
Deploy immediately after:
- Modifying Vue components
- Updating stores or composables
- Adding/updating MP3 audio files
- Changing game configuration
- Updating dictionary data
- Modifying server code (GameRoom.js, worker-do-only.js)
- Any other code or asset changes

### Deployment Architecture
- **Frontend**: Cloudflare Pages at https://spellingisfun.pages.dev
- **Backend**: Cloudflare Durable Objects Worker at https://spellingisfun-worker.jeff-kuo.workers.dev
- **WebSockets**: Handled by the Durable Objects Worker
- **Dictionary Data**: Loaded by the Worker (server-side), so worker must be redeployed when dictionaries change

### Deployment Script Details
The `npm run deploy` command:
1. Builds the frontend with `vite build`
2. Deploys the Durable Objects Worker (backend with dictionaries)
3. Deploys to Cloudflare Pages production branch (frontend)

### Individual Deployment Commands
```bash
npm run deploy:worker  # Deploy only the Worker (backend)
npm run deploy:pages   # Build and deploy only Pages (frontend)
```

**IMPORTANT**: Dictionary changes require worker deployment since dictionaries are loaded server-side by the Durable Objects Worker.

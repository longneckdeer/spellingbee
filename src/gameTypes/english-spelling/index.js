import elementary from './data/elementary.json'
import middle from './data/middle.json'
import high from './data/high.json'
import university from './data/university.json'
import expert from './data/expert.json'

export default {
  id: 'english-spelling',
  name: '英文拼字',
  icon: '🔤',
  levels: [
    { id: 1, name: '小學', data: elementary, difficultyRange: [0, 35] },
    { id: 2, name: '中學', data: middle, difficultyRange: [25, 60] },
    { id: 3, name: '高中', data: high, difficultyRange: [50, 80] },
    { id: 4, name: '大學', data: university, difficultyRange: [70, 95] },
    { id: 5, name: '英文高手', data: expert, difficultyRange: [85, 100] }
  ],
  tts: { language: 'en-US', rate: 0.9 },

  // Combined word pool from all levels
  allWords: [...elementary, ...middle, ...high, ...university, ...expert],

  // Track used words per game session
  usedWords: new Set(),

  // Reset used words (call when starting a new game)
  resetUsedWords() {
    this.usedWords.clear()
  },

  getQuestion(levelId, currentRound = 1) {
    const level = this.levels.find(l => l.id === levelId)
    if (!level) return null

    // Filter words from all levels that fall within this level's difficulty range
    const [levelMinDiff, levelMaxDiff] = level.difficultyRange
    const levelWords = this.allWords.filter(w =>
      w.difficulty >= levelMinDiff && w.difficulty <= levelMaxDiff
    )

    if (levelWords.length === 0) return null

    // Progressive difficulty: divide words into quantile-based buckets
    // This ensures each bucket has adequate words regardless of difficulty distribution
    // Sort words by difficulty
    const sortedWords = [...levelWords].sort((a, b) => a.difficulty - b.difficulty)

    // Divide into 5 buckets with progressive sizes for gradual difficulty increase
    // Round 1-5: easiest 10% of words (very easy start)
    // Round 6-10: next 15% (still easy)
    // Round 11-15: next 25% (getting harder)
    // Round 16-20: next 25% (harder)
    // Round 21+: hardest 25% (challenging)
    const totalWords = sortedWords.length
    let bucketWords

    if (currentRound <= 5) {
      // Easiest 10%
      const endIndex = Math.ceil(totalWords * 0.1)
      bucketWords = sortedWords.slice(0, endIndex)
    } else if (currentRound <= 10) {
      // Next 15% (from 10% to 25%)
      const startIndex = Math.ceil(totalWords * 0.1)
      const endIndex = Math.ceil(totalWords * 0.25)
      bucketWords = sortedWords.slice(startIndex, endIndex)
    } else if (currentRound <= 15) {
      // Next 25% (from 25% to 50%)
      const startIndex = Math.ceil(totalWords * 0.25)
      const endIndex = Math.ceil(totalWords * 0.5)
      bucketWords = sortedWords.slice(startIndex, endIndex)
    } else if (currentRound <= 20) {
      // Next 25% (from 50% to 75%)
      const startIndex = Math.ceil(totalWords * 0.5)
      const endIndex = Math.ceil(totalWords * 0.75)
      bucketWords = sortedWords.slice(startIndex, endIndex)
    } else {
      // Hardest 25% (from 75% to 100%)
      const startIndex = Math.ceil(totalWords * 0.75)
      bucketWords = sortedWords.slice(startIndex)
    }

    // Ensure bucket is never empty (fallback to all words)
    let candidateWords = bucketWords.length > 0 ? bucketWords : levelWords

    // Exclude already used words to prevent repetition
    const unusedWords = candidateWords.filter(w => !this.usedWords.has(w.word.toLowerCase()))

    // If all words in bucket have been used, reset and use full bucket
    if (unusedWords.length === 0) {
      // Clear used words for this bucket to allow recycling
      this.usedWords.clear()
      candidateWords = bucketWords.length > 0 ? bucketWords : levelWords
    } else {
      candidateWords = unusedWords
    }

    // Randomly select from available candidates
    const selectedWord = candidateWords[Math.floor(Math.random() * candidateWords.length)]

    // Track this word as used
    if (selectedWord) {
      this.usedWords.add(selectedWord.word.toLowerCase())
    }

    return selectedWord
  },

  validate(question, answer) {
    if (!question || !answer) return false
    return question.word.toLowerCase() === answer.trim().toLowerCase()
  },

  getPrompt(question) {
    return question?.word || ''
  }
}

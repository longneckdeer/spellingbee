class TTSService {
  constructor() {
    this.synth = window.speechSynthesis
    this.voice = null
    this.language = 'en-US'
    this.rate = 0.9
    this.audioCache = new Map() // Cache for Audio elements
    this.currentAudio = null // Currently playing audio element
    this.audioUnlocked = false // Track if audio has been unlocked on mobile
    this.audioContext = null // AudioContext for unlocking
  }

  /**
   * Unlock audio playback on mobile browsers.
   * Must be called from a user gesture (click/tap) handler.
   * Call this when user taps Ready button or any interaction before game starts.
   */
  unlockAudio() {
    if (this.audioUnlocked) return Promise.resolve()

    return new Promise((resolve) => {
      // Method 1: Create and resume AudioContext
      try {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume()
        }
      } catch (e) {
        console.warn('AudioContext unlock failed:', e)
      }

      // Method 2: Play silent audio to unlock HTML5 Audio
      const silentAudio = new Audio()
      silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+xDEAAAFwAJX9AAACAAAP8AAAABMQRU/BEBAQBA/xAGP/KMf//E4AwDAMAwD/4g/EH4IQBAH/BA/ygH/+CDnO7u7u4SEhISEu7u7u7hISEhIS7u7u7uEhISEhLu7u7u4SEhISEu7u7u7hISEhIS7u7u7uEhISEhLu7u7u4SEhISEu7u7u7hISEhIS7u7u7uH/+xDEKgPAAADSAAAAAAAANIAAAAS7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7s='

      const playPromise = silentAudio.play()
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.audioUnlocked = true
          console.log('Audio unlocked for mobile playback')
          resolve()
        }).catch(() => {
          // Silent fail - will try again on next interaction
          resolve()
        })
      } else {
        this.audioUnlocked = true
        resolve()
      }
    })
  }

  setLanguage(language) {
    this.language = language
    this.voice = null // Reset voice to find appropriate one
  }

  setRate(rate) {
    this.rate = rate
  }

  getVoice() {
    if (this.voice) return this.voice

    const voices = this.synth.getVoices()

    // Priority 1: Google voices matching language exactly
    this.voice = voices.find(v =>
      v.name.toLowerCase().includes('google') && v.lang === this.language
    )

    // Priority 2: Any Google voice for the language family
    if (!this.voice) {
      this.voice = voices.find(v =>
        v.name.toLowerCase().includes('google') &&
        v.lang.startsWith(this.language.split('-')[0])
      )
    }

    // Priority 3: Any voice matching language exactly
    if (!this.voice) {
      this.voice = voices.find(v => v.lang === this.language)
    }

    // Priority 4: Any voice for language family
    if (!this.voice) {
      this.voice = voices.find(v =>
        v.lang.startsWith(this.language.split('-')[0])
      )
    }

    // Fallback: First available voice
    if (!this.voice) {
      this.voice = voices[0]
    }

    return this.voice
  }

  speak(text) {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = this.getVoice()
      utterance.lang = this.language
      utterance.rate = this.rate
      utterance.pitch = 1

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(event.error)

      this.synth.speak(utterance)
    })
  }

  stop() {
    this.synth.cancel()
  }

  // Speak text multiple times with delay between each
  async speakRepeat(text, times = 3, delayMs = 2000) {
    for (let i = 0; i < times; i++) {
      await this.speak(text)

      // Don't wait after the last repetition
      if (i < times - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  // Speak word and sentence for spelling game with configurable rates
  async speakWordAndSentence(word, sentence, partOfSpeech = '', definition = '', options = {}) {
    const {
      wordRate = 0.6,           // Very slow for spelling
      sentenceRate = 0.8,       // Moderately slow for comprehension
      posRate = 0.9,            // Near normal for part of speech
      definitionRate = 0.85,    // Slightly slow for definition
      pauseAfterWord = 1500,
      pauseAfterPos = 1500,
      pauseAfterDef = 1500
    } = options

    const originalRate = this.rate

    // Say word very slowly twice
    this.setRate(wordRate)
    await this.speak(word)
    await new Promise(resolve => setTimeout(resolve, pauseAfterWord))
    await this.speak(word)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Say part of speech at near-normal speed
    if (partOfSpeech) {
      this.setRate(posRate)
      await this.speak(partOfSpeech)
      await new Promise(resolve => setTimeout(resolve, pauseAfterPos))
    }

    // Say definition (if provided)
    if (definition) {
      this.setRate(definitionRate)
      await this.speak(definition)
      await new Promise(resolve => setTimeout(resolve, pauseAfterDef))
    }

    // Say sentence moderately slowly
    if (sentence) {
      this.setRate(sentenceRate)
      await this.speak(sentence)
    }

    // Restore original rate
    this.setRate(originalRate)
  }

  // Standard Spelling Bee format: Word → POS → Definition → Sentence → Word
  async speakSpellingBeeWord(wordObj, options = {}) {
    const {
      wordRate = 0.6,           // Very slow for the word
      normalRate = 0.85,        // Normal for context
      pauseShort = 800,         // Short pause
      pauseMedium = 1200,       // Medium pause
      pauseLong = 1500          // Long pause
    } = options

    const originalRate = this.rate

    try {
      // 1. Say the word slowly twice
      this.setRate(wordRate)
      await this.speak(wordObj.word)
      await new Promise(resolve => setTimeout(resolve, pauseShort))
      await this.speak(wordObj.word)
      await new Promise(resolve => setTimeout(resolve, pauseMedium))

      // 2. Say part of speech (already in English)
      if (wordObj.partOfSpeech) {
        this.setRate(normalRate)
        await this.speak(wordObj.partOfSpeech)
        await new Promise(resolve => setTimeout(resolve, pauseShort))
      }

      // 3. Say definition (if in English)
      if (wordObj.definition && !this.isChinese(wordObj.definition)) {
        this.setRate(normalRate)
        await this.speak(wordObj.definition)
        await new Promise(resolve => setTimeout(resolve, pauseMedium))
      }

      // 4. Say example sentence
      if (wordObj.sentence) {
        this.setRate(normalRate)
        await this.speak(wordObj.sentence)
        await new Promise(resolve => setTimeout(resolve, pauseLong))
      }

      // 5. Say the word slowly one more time
      this.setRate(wordRate)
      await this.speak(wordObj.word)

    } finally {
      // Restore original rate
      this.setRate(originalRate)
    }
  }

  // Check if text contains Chinese characters
  isChinese(text) {
    return /[\u4e00-\u9fff]/.test(text)
  }

  // Get list of available Google voices
  getGoogleVoices() {
    const voices = this.synth.getVoices()
    return voices.filter(v => v.name.toLowerCase().includes('google'))
  }

  // Get current voice info
  getVoiceInfo() {
    const voice = this.getVoice()
    return {
      name: voice?.name || 'Unknown',
      lang: voice?.lang || 'Unknown',
      isGoogle: voice?.name.toLowerCase().includes('google') || false
    }
  }

  // Wait for voices to load (needed on some browsers)
  waitForVoices() {
    return new Promise((resolve) => {
      const voices = this.synth.getVoices()
      if (voices.length > 0) {
        resolve(voices)
        return
      }

      this.synth.addEventListener('voiceschanged', () => {
        resolve(this.synth.getVoices())
      }, { once: true })
    })
  }

  // ==========================================
  // Merriam-Webster Audio Support
  // ==========================================

  // Map Chinese POS to English for MW audio
  posMap = {
    '名詞': 'noun',
    '動詞': 'verb',
    '形容詞': 'adjective',
    '副詞': 'adverb',
    '介系詞': 'preposition',
    '連接詞': 'conjunction',
    '連詞': 'conjunction',
    '代詞': 'pronoun',
    '代名詞': 'pronoun',
    '感嘆詞': 'interjection',
    '其他': null,
    // English POS (pass through)
    'noun': 'noun',
    'verb': 'verb',
    'adjective': 'adjective',
    'adverb': 'adverb',
    'preposition': 'preposition',
    'conjunction': 'conjunction',
    'pronoun': 'pronoun',
    'interjection': 'interjection',
    'numeral': 'numeral',
    'abbreviation': 'abbreviation',
    // Compound POS - use first one
    'adverb or adjective': 'adverb',
    'adjective or adverb': 'adjective',
    'auxiliary verb': 'verb',
    'geographical name': 'noun'
  }

  /**
   * Speak part of speech using MW audio
   * @param {string} pos - Part of speech (Chinese or English)
   * @returns {Promise<void>}
   */
  async speakPartOfSpeech(pos) {
    if (!pos) return

    // Convert to English if Chinese
    const englishPos = this.posMap[pos] || this.posMap[pos.toLowerCase()]

    if (!englishPos) {
      // Fallback to TTS for unknown POS
      this.setRate(0.9)
      await this.speak(pos)
      return
    }

    // Try MW audio
    try {
      await this.playMWAudio(englishPos)
    } catch (err) {
      console.warn('MW audio failed for POS "' + englishPos + '", falling back to TTS')
      this.setRate(0.9)
      await this.speak(englishPos)
    }
  }

  // Words where MW audio is wrong (returns base word audio instead of derived form)
  // These words will use TTS instead for correct pronunciation
  badMWAudioWords = new Set([
    'august', 'enjoyable', 'offender', 'harassment', 'enforcement', 'refurbishment',
    'recklessness', 'retailer', 'roughness', 'righteousness', 'reconsideration',
    'richness', 'dealer', 'quickness', 'repressive', 'enrollment',
    'ruthlessness', 'obtainable', 'responsiveness', 'reproachful', 'remoteness',
    'reimbursement', 'abstemiousness', 'punctuality', 'reinstatement',
    'accreditation', 'learner'
  ])

  /**
   * Get the MW audio URL for a word
   * @param {string} word - The word to get audio for
   * @returns {string} The audio URL path
   */
  getMWAudioUrl(word) {
    const normalizedWord = word.toLowerCase().trim()
    return `/audio/${normalizedWord}.mp3`
  }

  /**
   * Check if MW audio should be used for a word
   * @param {string} word - The word to check
   * @returns {boolean} False if MW audio is known to be wrong
   */
  shouldUseMWAudio(word) {
    return !this.badMWAudioWords.has(word.toLowerCase().trim())
  }

  /**
   * Check if MW audio exists for a word
   * @param {string} word - The word to check
   * @returns {Promise<boolean>} True if audio exists
   */
  async hasMWAudio(word) {
    const url = this.getMWAudioUrl(word)

    // Check cache first
    if (this.audioCache.has(url)) {
      return true
    }

    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Play MW audio for a word
   * @param {string} word - The word to play
   * @returns {Promise<void>} Resolves when audio finishes playing
   */
  playMWAudio(word) {
    return new Promise((resolve, reject) => {
      const url = this.getMWAudioUrl(word)

      // Stop any currently playing audio
      this.stopMWAudio()

      // Check cache first
      let audio = this.audioCache.get(url)

      if (!audio) {
        audio = new Audio(url)
        this.audioCache.set(url, audio)
      }

      this.currentAudio = audio

      // Reset to beginning if already played
      audio.currentTime = 0

      const cleanup = () => {
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('error', onError)
        if (this.currentAudio === audio) {
          this.currentAudio = null
        }
      }

      const onEnded = () => {
        cleanup()
        resolve()
      }

      const onError = (event) => {
        cleanup()
        reject(new Error(`Failed to play MW audio for "${word}": ${event.message || 'Unknown error'}`))
      }

      audio.addEventListener('ended', onEnded, { once: true })
      audio.addEventListener('error', onError, { once: true })

      audio.play().catch((err) => {
        cleanup()
        reject(err)
      })
    })
  }

  /**
   * Stop currently playing MW audio
   */
  stopMWAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  /**
   * Speak a word using MW audio if available, fallback to Web Speech API
   * @param {string} word - The word to speak
   * @returns {Promise<void>}
   */
  async speakWord(word) {
    // Skip MW audio for words with known bad audio (wrong pronunciation)
    if (this.shouldUseMWAudio(word)) {
      // Try MW audio first - just attempt to play, no HEAD request needed
      try {
        await this.playMWAudio(word)
        return
      } catch (err) {
        console.warn('MW audio failed for "' + word + '", falling back to TTS:', err.message)
      }
    }

    // Use Web Speech API with slower rate for clarity
    this.setRate(0.6)
    await this.speak(word)
  }

  /**
   * Stop all audio (both MW and TTS)
   */
  stopAll() {
    this.stopMWAudio()
    this.stop()
  }

  /**
   * Clear the audio cache
   */
  clearAudioCache() {
    this.audioCache.clear()
  }

  /**
   * Preload MW audio for a word (useful for upcoming questions)
   * @param {string} word - The word to preload
   */
  preloadMWAudio(word) {
    const url = this.getMWAudioUrl(word)

    if (this.audioCache.has(url)) {
      return // Already cached
    }

    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = url

    // Only cache if load succeeds
    audio.addEventListener('canplaythrough', () => {
      this.audioCache.set(url, audio)
    }, { once: true })
  }
}

export const tts = new TTSService()

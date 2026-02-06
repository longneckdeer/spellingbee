import { describe, it, expect } from 'vitest'
import englishSpelling from '@/gameTypes/english-spelling'

describe('englishSpelling game type', () => {
  describe('basic properties', () => {
    it('should have correct id', () => {
      expect(englishSpelling.id).toBe('english-spelling')
    })

    it('should have Chinese name', () => {
      expect(englishSpelling.name).toBe('英文拼字')
    })

    it('should have 5 levels', () => {
      expect(englishSpelling.levels).toHaveLength(5)
    })

    it('should have TTS config', () => {
      expect(englishSpelling.tts).toBeDefined()
      expect(englishSpelling.tts.language).toBe('en-US')
    })
  })

  describe('getQuestion', () => {
    it('should return a question from level 1', () => {
      const question = englishSpelling.getQuestion(1)
      expect(question).toBeDefined()
      expect(question.word).toBeDefined()
      expect(question.definition).toBeDefined()
    })

    it('should return a question from level 5', () => {
      const question = englishSpelling.getQuestion(5)
      expect(question).toBeDefined()
      expect(question.word).toBeDefined()
    })

    it('should return null for invalid level', () => {
      const question = englishSpelling.getQuestion(99)
      expect(question).toBeNull()
    })
  })

  describe('validate', () => {
    const question = { word: 'beautiful', definition: '美麗的' }

    it('should return true for correct answer', () => {
      expect(englishSpelling.validate(question, 'beautiful')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(englishSpelling.validate(question, 'BEAUTIFUL')).toBe(true)
      expect(englishSpelling.validate(question, 'BeAuTiFuL')).toBe(true)
    })

    it('should trim whitespace', () => {
      expect(englishSpelling.validate(question, '  beautiful  ')).toBe(true)
    })

    it('should return false for incorrect answer', () => {
      expect(englishSpelling.validate(question, 'beatiful')).toBe(false)
    })

    it('should return false for empty answer', () => {
      expect(englishSpelling.validate(question, '')).toBe(false)
    })

    it('should return false for null values', () => {
      expect(englishSpelling.validate(null, 'test')).toBe(false)
      expect(englishSpelling.validate(question, null)).toBe(false)
    })
  })

  describe('getPrompt', () => {
    it('should return the word', () => {
      const question = { word: 'test' }
      expect(englishSpelling.getPrompt(question)).toBe('test')
    })

    it('should return empty string for null', () => {
      expect(englishSpelling.getPrompt(null)).toBe('')
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { gameStore } from '@/stores/gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    gameStore.reset()
  })

  describe('initial state', () => {
    it('should have lobby as initial phase', () => {
      expect(gameStore.phase).toBe('lobby')
    })

    it('should have empty players array', () => {
      expect(gameStore.players).toEqual([])
    })

    it('should not be host by default', () => {
      expect(gameStore.isHost).toBe(false)
    })
  })

  describe('setPhase', () => {
    it('should update phase', () => {
      gameStore.setPhase('room')
      expect(gameStore.phase).toBe('room')
    })
  })

  describe('player management', () => {
    const player1 = { id: '1', nickname: 'Player1', role: 'observer', ready: false }
    const player2 = { id: '2', nickname: 'Player2', role: 'participant', ready: false }

    it('should add player', () => {
      gameStore.addPlayer(player1)
      expect(gameStore.players).toHaveLength(1)
      expect(gameStore.players[0]).toEqual(player1)
    })

    it('should not add duplicate player', () => {
      gameStore.addPlayer(player1)
      gameStore.addPlayer(player1)
      expect(gameStore.players).toHaveLength(1)
    })

    it('should remove player', () => {
      gameStore.addPlayer(player1)
      gameStore.addPlayer(player2)
      gameStore.removePlayer('1')
      expect(gameStore.players).toHaveLength(1)
      expect(gameStore.players[0].id).toBe('2')
    })

    it('should update player', () => {
      gameStore.addPlayer(player1)
      gameStore.updatePlayer('1', { ready: true })
      expect(gameStore.players[0].ready).toBe(true)
    })

    it('should get participants', () => {
      gameStore.addPlayer(player1)
      gameStore.addPlayer(player2)
      expect(gameStore.getParticipants()).toHaveLength(1)
      expect(gameStore.getParticipants()[0].id).toBe('2')
    })

    it('should get observers', () => {
      gameStore.addPlayer(player1)
      gameStore.addPlayer(player2)
      expect(gameStore.getObservers()).toHaveLength(1)
      expect(gameStore.getObservers()[0].id).toBe('1')
    })

    it('should get active players (participants not eliminated)', () => {
      gameStore.addPlayer({ ...player2, id: '3' })
      gameStore.addPlayer(player2)
      gameStore.eliminatePlayer('3')
      expect(gameStore.getActivePlayers()).toHaveLength(1)
      expect(gameStore.getActivePlayers()[0].id).toBe('2')
    })
  })

  describe('game state', () => {
    it('should start round', () => {
      const question = { word: 'test', definition: 'test' }
      gameStore.startRound(question)
      expect(gameStore.currentRound).toBe(1)
      expect(gameStore.currentQuestion).toEqual(question)
    })

    it('should eliminate player', () => {
      gameStore.eliminatePlayer('1')
      expect(gameStore.eliminated).toContain('1')
    })

    it('should not eliminate same player twice', () => {
      gameStore.eliminatePlayer('1')
      gameStore.eliminatePlayer('1')
      expect(gameStore.eliminated).toHaveLength(1)
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      gameStore.setPhase('playing')
      gameStore.addPlayer({ id: '1', nickname: 'Test' })
      gameStore.setRoomId('ABC123')

      gameStore.reset()

      expect(gameStore.phase).toBe('lobby')
      expect(gameStore.players).toEqual([])
      expect(gameStore.roomId).toBeNull()
    })
  })
})

import { GAME_CONFIG } from '@/config/game'

/**
 * Creates an array of empty table objects for the game room
 * @returns {Array} Array of empty table objects
 */
export function createEmptyTables() {
  return Array.from({ length: GAME_CONFIG.tableCount }, (_, index) => ({
    index,
    playerId: null,
    nickname: '',
    currentTyping: '',
    isEliminated: false,
    hasLeft: false,
    isReady: false,
    hasSubmittedAnswer: false,
    roundResults: []
  }))
}

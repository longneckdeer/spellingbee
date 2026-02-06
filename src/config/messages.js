export const MESSAGES = {
  // Player movement
  PLAYER_JOIN_ROOM: 'player:joinRoom',      // Enter room as observer
  PLAYER_LEAVE_ROOM: 'player:leaveRoom',    // Exit room
  PLAYER_SIT: 'player:sit',                 // Take a seat (index)
  PLAYER_STAND: 'player:stand',             // Leave seat -> observer
  PLAYER_LEFT: 'player:left',               // Mark as left during game
  PLAYER_READY: 'player:ready',             // Player marks ready

  // Room management
  TABLE_ADD: 'table:add',                   // Add a new table to the room

  // Game flow
  GAME_START_EARLY: 'game:startEarly',      // First player triggers early start
  ROUND_START: 'round:start',               // New round begins
  PLAYER_TYPING: 'player:typing',           // Real-time answer updates
  ROUND_ANSWER: 'round:answer',             // Final answer submission
  ROUND_END: 'round:end',                   // Round results
  GAME_END: 'game:end',                     // Game over, show rankings

  // Sync
  STATE_SYNC: 'state:sync'                  // Full state for new joiners
}

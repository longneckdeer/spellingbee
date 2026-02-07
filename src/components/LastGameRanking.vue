<template>
  <div class="last-ranking">
    <div class="last-ranking__section">
      <div class="last-ranking__header">
        <div class="last-ranking__nav">
          <button
            class="last-ranking__nav-btn"
            :disabled="!canGoBack"
            @click="goBack"
            title="上一場"
          >
            <span class="nav-arrow">‹</span>
          </button>
          <div class="last-ranking__title">
            <template v-if="viewingHistoryIndex === null">
              本場排名
            </template>
            <template v-else-if="historyGameInfo">
              <div class="last-ranking__history-info">
                <span class="last-ranking__history-level">{{ historyGameInfo.levelName }}</span>
                <span class="last-ranking__history-date">{{ historyGameInfo.date }}</span>
              </div>
            </template>
          </div>
          <button
            class="last-ranking__nav-btn"
            :disabled="!canGoForward"
            @click="goForward"
            title="下一場"
          >
            <span class="nav-arrow">›</span>
          </button>
        </div>
      </div>

      <div class="last-ranking__list" v-if="hasRankings">
        <div
          v-for="(player, index) in currentRankings"
          :key="index"
          class="last-ranking__item"
        >
          <span class="last-ranking__rank" :class="`last-ranking__rank--${player.rank}`">
            {{ player.rank }}
          </span>
          <span class="last-ranking__name">{{ player.nickname }}</span>
          <span class="last-ranking__rounds">{{ player.roundsSurvived }}</span>
        </div>
      </div>

      <div class="last-ranking__empty" v-else>
        尚無記錄
      </div>
    </div>

    <div class="last-ranking__section" v-if="hasObservers">
      <div class="last-ranking__header">觀眾</div>
      <div class="last-ranking__list">
        <div
          v-for="observer in gameStore.observers"
          :key="observer.id"
          class="last-ranking__item last-ranking__item--observer"
        >
          <span class="last-ranking__name">{{ observer.nickname }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { gameStore } from '@/stores/gameStore'

// Track which game we're viewing: null = current game, 0 = most recent history, 1 = second most recent, etc.
const viewingHistoryIndex = ref(null)

// Filter history to only show games from current level with non-empty rankings
const levelHistory = computed(() => {
  const currentLevel = gameStore.currentRoom?.level
  if (!currentLevel) return []
  return gameStore.gameHistory.filter(game =>
    game.level === currentLevel &&
    game.fullRanking &&
    game.fullRanking.length > 0
  )
})

// Navigation controls
const canGoBack = computed(() => {
  const maxIndex = levelHistory.value.length - 1
  if (viewingHistoryIndex.value === null) {
    return maxIndex >= 0
  }
  return viewingHistoryIndex.value < maxIndex
})

const canGoForward = computed(() => {
  return viewingHistoryIndex.value !== null
})

const goBack = () => {
  if (!canGoBack.value) return
  if (viewingHistoryIndex.value === null) {
    viewingHistoryIndex.value = 0
  } else {
    viewingHistoryIndex.value++
  }
}

const goForward = () => {
  if (!canGoForward.value) return
  if (viewingHistoryIndex.value === 0) {
    viewingHistoryIndex.value = null
  } else {
    viewingHistoryIndex.value--
  }
}

// Get info about the history game being viewed
const historyGameInfo = computed(() => {
  if (viewingHistoryIndex.value === null) return null
  const game = levelHistory.value[viewingHistoryIndex.value]
  if (!game) return null

  const date = new Date(game.timestamp)
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

  return {
    levelName: game.levelName || `Level ${game.level}`,
    date: formattedDate
  }
})

// Calculate live rankings during active game
const currentRankings = computed(() => {
  // If viewing history, show historical ranking
  if (viewingHistoryIndex.value !== null) {
    const game = levelHistory.value[viewingHistoryIndex.value]
    return game?.fullRanking || []
  }

  // If game not active, show last game ranking
  if (!gameStore.game.isActive) {
    return gameStore.lastGameRanking
  }

  // During active game, show live standings
  const players = gameStore.tables
    .filter(t => t.playerId !== null && !t.hasLeft)
    .map(t => {
      // Count correct answers as rounds survived
      const roundsSurvived = t.roundResults.filter(r => r.correct).length
      return {
        nickname: t.nickname,
        roundsSurvived,
        isEliminated: t.isEliminated
      }
    })

  // Sort: active players first (by rounds desc), then eliminated players (by rounds desc)
  players.sort((a, b) => {
    if (a.isEliminated !== b.isEliminated) {
      return a.isEliminated ? 1 : -1 // Active players first
    }
    return b.roundsSurvived - a.roundsSurvived // Higher rounds first
  })

  // Assign ranks, handling ties properly (same score = same rank)
  const rankedPlayers = []
  let currentRank = 1
  let previousScore = null

  for (let i = 0; i < players.length; i++) {
    const player = players[i]

    // If score is different from previous, update rank to current position
    if (previousScore !== null && player.roundsSurvived !== previousScore) {
      currentRank = i + 1
    }

    rankedPlayers.push({
      nickname: player.nickname,
      roundsSurvived: player.roundsSurvived,
      rank: currentRank
    })

    previousScore = player.roundsSurvived
  }

  return rankedPlayers
})

const hasRankings = computed(() => currentRankings.value.length > 0)
const hasObservers = computed(() => gameStore.observers.length > 0)

// Reset to current game when a new game starts
watch(() => gameStore.game.phase, (newPhase) => {
  if (newPhase === 'playing' && gameStore.game.currentRound === 1) {
    viewingHistoryIndex.value = null
  }
})
</script>

<style scoped>
.last-ranking {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 220px;
  overflow-y: auto;
}

.last-ranking__section {
  display: flex;
  flex-direction: column;
}

.last-ranking__header {
  font-size: 11px;
  font-weight: 500;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 8px;
  overflow: hidden;
}

.last-ranking__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.last-ranking__nav-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #5f6368;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.last-ranking__nav-btn:hover:not(:disabled) {
  background: #f1f3f4;
  color: #202124;
}

.last-ranking__nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-arrow {
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
}

.last-ranking__title {
  flex: 1;
  text-align: center;
  min-width: 0;
  overflow: hidden;
}

.last-ranking__history-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  line-height: 1.2;
}

.last-ranking__history-level {
  font-size: 11px;
  font-weight: 600;
  color: #202124;
}

.last-ranking__history-date {
  font-size: 9px;
  color: #9aa0a6;
  text-transform: none;
  letter-spacing: 0;
}

.last-ranking__list {
  flex: 1;
  overflow-y: auto;
}

.last-ranking__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.last-ranking__rank {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  border-radius: 50%;
  background: #f1f3f4;
  color: #5f6368;
}

.last-ranking__rank--1 {
  background: #fef7e0;
  color: #e37400;
}

.last-ranking__rank--2 {
  background: #f1f3f4;
  color: #5f6368;
}

.last-ranking__rank--3 {
  background: #fce8e6;
  color: #c5221f;
}

.last-ranking__name {
  flex: 1;
  color: #202124;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-ranking__rounds {
  color: #5f6368;
  font-size: 12px;
}

.last-ranking__empty {
  color: #9aa0a6;
  font-size: 12px;
  padding: 8px 0;
}

.last-ranking__item--observer {
  padding: 4px 0;
}

.last-ranking__item--observer .last-ranking__name {
  color: #5f6368;
}

@media (max-width: 920px) {
  .last-ranking {
    padding: 10px;
    gap: 12px;
    max-height: none;
  }

  .last-ranking__header {
    font-size: 10px;
    padding-bottom: 6px;
  }

  .last-ranking__item {
    padding: 5px 0;
    font-size: 12px;
  }

  .last-ranking__rank {
    width: 18px;
    height: 18px;
    font-size: 10px;
  }

  .last-ranking__rounds {
    font-size: 11px;
  }

  .last-ranking__nav-btn {
    width: 22px;
    height: 22px;
  }

  .nav-arrow {
    font-size: 16px;
  }
}
</style>

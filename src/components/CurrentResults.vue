<template>
  <div class="current-results">
    <div class="current-results__header">
      <template v-if="isViewingOther">
        {{ viewingPlayerName }}
      </template>
      <template v-else>
        <div class="current-results__nav">
          <button
            class="current-results__nav-btn"
            :disabled="!canGoBack"
            @click="goBack"
            title="上一場"
          >
            <span class="nav-arrow">‹</span>
          </button>
          <div class="current-results__title">
            <template v-if="viewingHistoryIndex === null">
              答題紀錄
            </template>
            <template v-else>
              <div class="current-results__history-info">
                <span class="current-results__history-level">{{ historyGameInfo.levelName }}</span>
                <span class="current-results__history-date">{{ historyGameInfo.date }}</span>
              </div>
            </template>
          </div>
          <button
            class="current-results__nav-btn"
            :disabled="!canGoForward"
            @click="goForward"
            title="下一場"
          >
            <span class="nav-arrow">›</span>
          </button>
        </div>
      </template>
    </div>

    <!-- History game stats -->
    <div v-if="viewingHistoryIndex !== null && historyGameInfo" class="current-results__stats">
      <span class="current-results__stat">
        第 {{ historyGameInfo.rank }}/{{ historyGameInfo.totalPlayers }} 名
      </span>
      <span class="current-results__stat">
        {{ historyGameInfo.correctCount }}/{{ historyGameInfo.totalRounds }} 題
      </span>
    </div>

    <div class="current-results__list" v-if="results.length > 0">
      <div
        v-for="(result, index) in results"
        :key="index"
        class="current-results__item"
      >
        <span class="current-results__number">{{ index + 1 }}</span>
        <span class="current-results__status" :class="{ 'current-results__status--correct': result.correct }">
          {{ result.correct ? '✓' : 'X' }}
        </span>
        <template v-if="result.correct">
          <div class="current-results__content">
            <span class="current-results__word current-results__word--correct">
              <span class="current-results__arrow">→</span> {{ result.word }}
            </span>
          </div>
        </template>
        <template v-else>
          <div class="current-results__content">
            <span class="current-results__answer">{{ result.answer || '-' }}</span>
            <span class="current-results__word">{{ result.word }}</span>
          </div>
        </template>
      </div>
    </div>

    <div class="current-results__empty" v-else>
      <template v-if="viewingHistoryIndex !== null">
        無答題記錄
      </template>
      <template v-else-if="isPlayer">
        答題記錄將顯示於此
      </template>
      <template v-else-if="gameStore.selectedTableIndex !== null">
        尚無記錄
      </template>
      <template v-else>
        點擊座位查看記錄
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { gameStore } from '@/stores/gameStore'

// Track which game we're viewing: null = current game, 0 = most recent history, 1 = second most recent, etc.
const viewingHistoryIndex = ref(null)

const isPlayer = computed(() => gameStore.localPlayer.isSeated)

const isViewingOther = computed(() => {
  return !isPlayer.value && gameStore.selectedTableIndex !== null
})

const viewingPlayerName = computed(() => {
  if (!isViewingOther.value) return ''
  const table = gameStore.tables[gameStore.selectedTableIndex]
  return table?.nickname || ''
})

// Navigation controls
const canGoBack = computed(() => {
  // Can go back if there's history to view
  const maxIndex = gameStore.gameHistory.length - 1
  if (viewingHistoryIndex.value === null) {
    return maxIndex >= 0
  }
  return viewingHistoryIndex.value < maxIndex
})

const canGoForward = computed(() => {
  // Can go forward if we're viewing history (to get back to current)
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
  const game = gameStore.gameHistory[viewingHistoryIndex.value]
  if (!game) return null

  const date = new Date(game.timestamp)
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

  return {
    levelName: game.levelName || `Level ${game.level}`,
    date: formattedDate,
    rank: game.finalRank || '-',
    totalPlayers: game.totalPlayers || '-',
    correctCount: game.myResults?.filter(r => r.correct).length || 0,
    totalRounds: game.myResults?.length || 0
  }
})

// Filter results to only show completed rounds (not the current round during 'playing' phase)
const filterCompletedResults = (roundResults) => {
  if (!roundResults) return []

  // During 'playing' phase, hide the current round's result (prevents seeing wrong answer before round ends)
  if (gameStore.game.phase === 'playing') {
    // Only show results from previous rounds (up to currentRound - 1)
    const completedRounds = gameStore.game.currentRound - 1
    return roundResults.slice(0, completedRounds)
  }

  // During reviewing/gameEnd/waiting, show all results
  return roundResults
}

// Results to display
const results = computed(() => {
  // If viewing another player's results
  if (isViewingOther.value) {
    const table = gameStore.tables[gameStore.selectedTableIndex]
    return filterCompletedResults(table?.roundResults)
  }

  // If viewing history, show history results (regardless of seated status)
  if (viewingHistoryIndex.value !== null) {
    const game = gameStore.gameHistory[viewingHistoryIndex.value]
    return game?.myResults || []
  }

  // If player is seated, show current game
  if (isPlayer.value) {
    const myTable = gameStore.getMyTable()
    return filterCompletedResults(myTable?.roundResults)
  }

  return []
})

// Reset to current game when a new game starts
watch(() => gameStore.game.phase, (newPhase) => {
  if (newPhase === 'playing' && gameStore.game.currentRound === 1) {
    viewingHistoryIndex.value = null
  }
})
</script>

<style scoped>
.current-results {
  padding: 12px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.current-results__header {
  font-size: 11px;
  font-weight: 500;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-results__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.current-results__nav-btn {
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

.current-results__nav-btn:hover:not(:disabled) {
  background: #f1f3f4;
  color: #202124;
}

.current-results__nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-arrow {
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
}

.current-results__title {
  flex: 1;
  text-align: center;
  min-width: 0;
  overflow: hidden;
}

.current-results__history-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  line-height: 1.2;
}

.current-results__history-level {
  font-size: 11px;
  font-weight: 600;
  color: #202124;
}

.current-results__history-date {
  font-size: 9px;
  color: #9aa0a6;
  text-transform: none;
  letter-spacing: 0;
}

.current-results__stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 6px 0;
  margin-bottom: 6px;
  border-bottom: 1px solid #f1f3f4;
}

.current-results__stat {
  font-size: 11px;
  color: #5f6368;
}

.current-results__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.current-results__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 13px;
}

.current-results__number {
  min-width: 20px;
  font-size: 11px;
  color: #9aa0a6;
  text-align: right;
  margin-right: 4px;
}

.current-results__status {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  border-radius: 50%;
  background: #fce8e6;
  color: #d93025;
}

.current-results__status--correct {
  background: #e6f4ea;
  color: #1e8e3e;
  font-size: 11px;
}

.current-results__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.current-results__word {
  color: #202124;
  font-size: 14px;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-results__word--correct {
  color: #1e8e3e;
  font-weight: 500;
}

.current-results__arrow {
  color: #1e8e3e;
  font-weight: bold;
  margin-right: 4px;
}

.current-results__answer {
  color: #d93025;
  font-size: 14px;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: line-through;
}

.current-results__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa0a6;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 920px) {
  .current-results {
    padding: 10px;
  }

  .current-results__header {
    font-size: 10px;
  }

  .current-results__item {
    font-size: 12px;
    gap: 6px;
  }

  .current-results__number {
    min-width: 18px;
    font-size: 10px;
  }

  .current-results__status {
    width: 18px;
    height: 18px;
    font-size: 10px;
  }

  .current-results__word,
  .current-results__answer {
    font-size: 13px;
  }

  .current-results__nav-btn {
    width: 22px;
    height: 22px;
  }

  .nav-arrow {
    font-size: 16px;
  }
}
</style>

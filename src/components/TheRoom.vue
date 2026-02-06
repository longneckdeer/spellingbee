<template>
  <div class="the-room">
    <div class="the-room__container">
      <!-- Connection status indicator -->
      <div v-if="isReconnecting" class="connection-status">
        <span class="connection-status__text">
          <span class="connection-status__spinner"></span>
          重新連線中...
        </span>
      </div>
      <div v-else-if="!isConnected" class="connection-status connection-status--error">
        <span class="connection-status__text">
          ⚠️ 連線已斷開，請重新整理頁面
        </span>
      </div>
      <div class="the-room__top-bar">
        <button class="the-room__leave-btn" @click="leaveRoom">
          ← 離開房間
        </button>
        <Blackboard class="the-room__blackboard" />
      </div>
      <div class="the-room__main">
        <div class="the-room__sidebar">
          <LastGameRanking class="the-room__sidebar-section" />
          <Leaderboard class="the-room__sidebar-section the-room__sidebar-section--flex" />
        </div>
        <Classroom class="the-room__classroom" />
        <CurrentResults class="the-room__sidebar" />
      </div>

      <!-- Mobile panel tabs -->
      <div class="the-room__mobile-tabs">
        <button
          class="the-room__mobile-tab"
          :class="{ 'the-room__mobile-tab--active': mobilePanel === 'ranking' }"
          @click="togglePanel('ranking')"
        >
          排名
        </button>
        <button
          class="the-room__mobile-tab"
          :class="{ 'the-room__mobile-tab--active': mobilePanel === 'leaderboard' }"
          @click="togglePanel('leaderboard')"
        >
          排行榜
        </button>
        <button
          class="the-room__mobile-tab"
          :class="{ 'the-room__mobile-tab--active': mobilePanel === 'results' }"
          @click="togglePanel('results')"
        >
          答題
        </button>
      </div>

      <!-- Mobile panel content -->
      <div class="the-room__mobile-panel" :class="{ 'the-room__mobile-panel--hidden': !mobilePanel }">
        <div v-show="mobilePanel === 'ranking'"><LastGameRanking /></div>
        <div v-show="mobilePanel === 'leaderboard'"><Leaderboard /></div>
        <div v-show="mobilePanel === 'results'"><CurrentResults /></div>
      </div>

      <SpellingArea :key="`spelling-${gameStore.localPlayer.seatIndex}`" class="the-room__spelling" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { gameStore } from '@/stores/gameStore'
import { useWebSocket } from '@/composables/useWebSocket'
import Blackboard from '@/components/Blackboard.vue'
import LastGameRanking from '@/components/LastGameRanking.vue'
import Leaderboard from '@/components/Leaderboard.vue'
import Classroom from '@/components/Classroom.vue'
import CurrentResults from '@/components/CurrentResults.vue'
import SpellingArea from '@/components/SpellingArea.vue'

const { isConnected, isReconnecting, disconnect } = useWebSocket()

const mobilePanel = ref('ranking')

function leaveRoom() {
  disconnect()
  gameStore.leaveRoom()
}

function togglePanel(panel) {
  mobilePanel.value = mobilePanel.value === panel ? null : panel
}
</script>

<style scoped>
/* Connection status banner */
.connection-status {
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  padding: 8px 16px;
  text-align: center;
}

.connection-status__text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #856404;
}

.connection-status--error {
  background: #f8d7da;
  border-color: #f5c6cb;
}

.connection-status--error .connection-status__text {
  color: #721c24;
}

.connection-status__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #856404;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.the-room {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f5f5f5;
  padding-top: 24px;
}

.the-room__container {
  width: 1400px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.the-room__top-bar {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  background: #f8f9fa;
}

.the-room__leave-btn {
  align-self: center;
  margin: 0 0 0 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #5f6368;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  white-space: nowrap;
}

.the-room__leave-btn:hover {
  background: #f1f3f4;
  border-color: #d2d2d2;
}

.the-room__blackboard {
  flex: 1;
  min-width: 0;
}

.the-room__main {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.the-room__sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.the-room__sidebar:last-child {
  border-right: none;
  border-left: 1px solid #e0e0e0;
}

.the-room__sidebar-section {
  flex-shrink: 0;
  border-bottom: 1px solid #e0e0e0;
}

.the-room__sidebar-section--flex {
  flex: 1;
  min-height: 0;
  border-bottom: none;
}

.the-room__classroom {
  flex: 1;
  min-width: 0;
}

.the-room__spelling {
  flex-shrink: 0;
}

/* Mobile tabs - hidden on desktop */
.the-room__mobile-tabs {
  display: none;
}

.the-room__mobile-panel {
  display: none;
}

@media (max-width: 920px) {
  .the-room__container {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }

  .the-room {
    padding: 0;
  }

  /* Reorder for mobile: top-bar -> spelling -> classroom -> tabs -> panel */
  .the-room__top-bar {
    order: 1;
  }

  .the-room__leave-btn {
    margin: 0 0 0 6px;
    padding: 8px 16px;
    font-size: 13px;
  }

  .the-room__spelling {
    order: 2;
    border-top: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .the-room__main {
    order: 3;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .the-room__mobile-tabs {
    order: 4;
  }

  .the-room__mobile-panel {
    order: 5;
  }

  .the-room__sidebar {
    display: none;
  }

  .the-room__sidebar:last-child {
    display: none;
  }

  .the-room__classroom {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  /* Mobile tabs */
  .the-room__mobile-tabs {
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    background: #f8f9fa;
    border-top: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .the-room__mobile-tab {
    flex: 1;
    padding: 6px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #5f6368;
    background: #fff;
    border: 1px solid #dadce0;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .the-room__mobile-tab:hover {
    background: #f1f3f4;
  }

  .the-room__mobile-tab--active {
    background: #e8f0fe;
    border-color: #1a73e8;
    color: #1a73e8;
  }

  /* Mobile panel */
  .the-room__mobile-panel {
    display: block;
    max-height: 30vh;
    overflow-y: auto;
    background: #fff;
    border-top: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .the-room__mobile-panel--hidden {
    display: none;
  }

  /* Fix child component layout for mobile panel */
  .the-room__mobile-panel > div {
    height: auto !important;
    max-height: none !important;
  }

  .the-room__mobile-panel > div > * {
    height: auto !important;
    max-height: none !important;
  }

  /* Ensure list containers show content (they use flex:1 which needs definite parent height) */
  .the-room__mobile-panel :deep(.leaderboard__list),
  .the-room__mobile-panel :deep(.current-results__list),
  .the-room__mobile-panel :deep(.last-ranking__list) {
    flex: none !important;
    overflow-y: visible !important;
  }

  .the-room__mobile-panel :deep(.leaderboard__empty),
  .the-room__mobile-panel :deep(.last-ranking__empty),
  .the-room__mobile-panel :deep(.current-results__empty) {
    min-height: 40px;
  }
}
</style>

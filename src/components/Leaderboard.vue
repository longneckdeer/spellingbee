<template>
  <div class="leaderboard">
    <div class="leaderboard__header">
      <span class="leaderboard__title">排行榜</span>
      <span v-if="levelName" class="leaderboard__level">{{ levelName }}</span>
    </div>

    <div class="leaderboard__list" v-if="topScores.length > 0">
      <div
        v-for="(entry, index) in topScores"
        :key="index"
        class="leaderboard__item"
        :class="{ 'leaderboard__item--mine': entry.nickname === gameStore.localPlayer.nickname }"
      >
        <span class="leaderboard__rank">{{ index + 1 }}</span>
        <span class="leaderboard__name">{{ entry.nickname }}</span>
        <span v-if="entry.timestamp" class="leaderboard__date">{{ formatDate(entry.timestamp) }}</span>
        <span class="leaderboard__score">{{ entry.score }}</span>
      </div>
    </div>

    <div class="leaderboard__empty" v-else>
      暫無紀錄
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gameStore } from '@/stores/gameStore'

const levelName = computed(() => gameStore.currentRoom?.levelName || '')

const topScores = computed(() => {
  // Global high scores from server (already sorted)
  return gameStore.highScores || []
})

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.leaderboard {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.leaderboard__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  gap: 4px;
}

.leaderboard__title {
  font-size: 11px;
  font-weight: 500;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.leaderboard__level {
  font-size: 10px;
  color: #9aa0a6;
}

.leaderboard__list {
  max-height: 180px; /* Show ~5 items */
  overflow-y: auto;
  padding: 8px;
}

.leaderboard__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.leaderboard__item:hover {
  background: #f8f9fa;
}

.leaderboard__item--mine {
  background: #e8f0fe;
  font-weight: 500;
}

.leaderboard__item--mine:hover {
  background: #d2e3fc;
}

.leaderboard__rank {
  min-width: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
  text-align: center;
}

.leaderboard__item:nth-child(1) .leaderboard__rank {
  color: #ffd700;
}

.leaderboard__item:nth-child(2) .leaderboard__rank {
  color: #c0c0c0;
}

.leaderboard__item:nth-child(3) .leaderboard__rank {
  color: #cd7f32;
}

.leaderboard__name {
  font-size: 12px;
  color: #202124;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}

.leaderboard__date {
  font-size: 10px;
  color: #9aa0a6;
  margin-left: 8px;
}

.leaderboard__score {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: #1a73e8;
  font-family: var(--font-display);
}

.leaderboard__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa0a6;
  font-size: 12px;
}

@media (max-width: 920px) {
  .leaderboard__header {
    padding: 10px;
  }

  .leaderboard__title {
    font-size: 10px;
  }

  .leaderboard__level {
    font-size: 9px;
  }

  .leaderboard__list {
    padding: 6px;
  }

  .leaderboard__item {
    padding: 5px 6px;
    font-size: 11px;
  }

  .leaderboard__rank {
    min-width: 18px;
    font-size: 11px;
  }

  .leaderboard__name {
    font-size: 11px;
    max-width: 70px;
  }

  .leaderboard__date {
    font-size: 9px;
    margin-left: 6px;
  }

  .leaderboard__score {
    font-size: 12px;
  }
}
</style>

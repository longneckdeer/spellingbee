<template>
  <div class="blackboard-wrapper">
    <div class="blackboard">
      <!-- Active game - Playing round -->
      <div class="blackboard__row" v-if="hasQuestion">
        <div class="blackboard__status">
          <span class="blackboard__level" v-if="levelName">{{ levelName }}</span>
          第 {{ gameStore.game.currentRound }} 回合
        </div>
        <div class="blackboard__timer" :class="timerClass">
          <span class="blackboard__timer-value">{{ displayTime }}</span>
          <span class="blackboard__timer-unit">秒</span>
        </div>
      </div>

      <!-- Preparing for first round -->
      <div class="blackboard__row" v-else-if="gameStore.game.phase === 'preparing'">
        <div class="blackboard__status">
          <span class="blackboard__level" v-if="levelName">{{ levelName }}</span>
          準備開始...
        </div>
        <div class="blackboard__timer">
          <span class="blackboard__timer-value">{{ gameStore.game.reviewCountdown }}</span>
          <span class="blackboard__timer-unit">秒</span>
        </div>
      </div>

      <!-- Reviewing answers -->
      <div class="blackboard__row" v-else-if="gameStore.game.phase === 'reviewing'">
        <div class="blackboard__status">
          <span class="blackboard__level" v-if="levelName">{{ levelName }}</span>
          檢視答案
        </div>
        <div class="blackboard__timer">
          <span class="blackboard__timer-value">{{ gameStore.game.reviewCountdown }}</span>
          <span class="blackboard__timer-unit">秒</span>
        </div>
      </div>

      <!-- Game ended, preparing for next game -->
      <div class="blackboard__row blackboard__row--waiting" v-else-if="gameStore.game.phase === 'gameEnd'">
        <div class="blackboard__status" v-if="levelName">
          <span class="blackboard__level">{{ levelName }}</span>
          <template v-if="gameResult?.type === 'singleWinner'">
            恭喜 <span class="blackboard__winner">{{ gameResult.winner.nickname }}</span> 獲勝！
          </template>
          <template v-else-if="gameResult?.type === 'tie'">
            恭喜 <span class="blackboard__winner">{{ gameResult.winners.map(w => w.nickname).join('、') }}</span> 獲勝！
          </template>
          <template v-else-if="gameResult?.type === 'allLosers'">
            本場無人存活
          </template>
          <template v-else-if="soloRounds !== null">
            答對 <span class="blackboard__solo-score">{{ soloRounds }}</span> 題
          </template>
          <template v-else>
            準備開始新比賽
          </template>
        </div>
      </div>

      <!-- Waiting state -->
      <div class="blackboard__row blackboard__row--waiting" v-else>
        <div class="blackboard__status" v-if="levelName">
          <span class="blackboard__level">{{ levelName }}</span>
          <template v-if="gameStore.getSeatedPlayers().length === 0">
            歡迎來到超級拼字王！
          </template>
          <template v-else-if="gameStore.nextGameCountdown > 0">
            遊戲即將開始...
          </template>
          <template v-else>
            等待開始
          </template>
        </div>
        <div class="blackboard__waiting" v-if="gameStore.getSeatedPlayers().length === 0">
          請選擇下方的桌子入座，加入下一輪比賽!
        </div>
        <div class="blackboard__timer" v-if="gameStore.nextGameCountdown > 0">
          <span class="blackboard__timer-value">{{ gameStore.nextGameCountdown }}</span>
          <span class="blackboard__timer-unit">秒</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gameStore } from '@/stores/gameStore'

const hasQuestion = computed(() => gameStore.game.currentQuestion !== null && gameStore.game.phase === 'playing')

const levelName = computed(() => gameStore.currentRoom?.levelName || '')

const gameResult = computed(() => {
  if (gameStore.game.phase !== 'gameEnd') return null
  if (!gameStore.lastGameRanking || gameStore.lastGameRanking.length === 0) return null

  // Only for multiplayer games (not solo)
  if (gameStore.lastGameRanking.length < 2) return null

  // Find all players with rank 1 (could be multiple in case of tie)
  const winners = gameStore.lastGameRanking.filter(r => r.rank === 1)

  // Check if all players answered 0 questions (all losers)
  const allLosers = winners.every(w => w.roundsSurvived === 0)

  if (allLosers) {
    return { type: 'allLosers' }
  }

  if (winners.length > 1) {
    return { type: 'tie', winners }
  }

  if (winners.length === 1) {
    return { type: 'singleWinner', winner: winners[0] }
  }

  return null
})

const soloRounds = computed(() => {
  if (gameStore.game.phase !== 'gameEnd') return null
  if (!gameStore.lastGameRanking || gameStore.lastGameRanking.length !== 1) return null

  // Get the solo player's rounds survived
  return gameStore.lastGameRanking[0].roundsSurvived
})

const displayTime = computed(() => {
  if (gameStore.game.isActive) {
    return gameStore.game.timeRemaining
  }
  return gameStore.nextGameCountdown
})

const timerClass = computed(() => {
  if (gameStore.game.isActive && gameStore.game.timeRemaining <= 5) {
    return 'blackboard__timer--danger'
  }
  if (gameStore.game.isActive && gameStore.game.timeRemaining <= 10) {
    return 'blackboard__timer--warning'
  }
  return ''
})
</script>

<style scoped>
.blackboard-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #f8f9fa;
}

.blackboard {
  width: 100%;
  max-width: 800px;
  background: linear-gradient(145deg, #2d5a27 0%, #1e3d1a 100%);
  border: 4px solid #5c4033;
  border-radius: 6px;
  padding: 10px 20px;
  color: #e8f5e3;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.blackboard__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
}

.blackboard__row--waiting {
  justify-content: space-between;
}

.blackboard__status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}

.blackboard__level {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.9);
}

.blackboard__winner {
  color: #ffd700;
  font-weight: 700;
  font-size: 20px;
  padding: 0 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.blackboard__solo-score {
  color: #fff;
  font-weight: 700;
  font-size: 22px;
  padding: 0 6px;
}

.blackboard__timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.blackboard__timer-value {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  font-family: var(--font-display);
  min-width: 40px;
  text-align: right;
}

.blackboard__timer-unit {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.blackboard__timer--warning .blackboard__timer-value {
  color: #ffd93d;
  animation: pulse 1s ease-in-out infinite;
}

.blackboard__timer--danger .blackboard__timer-value {
  color: #ff6b6b;
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.blackboard__waiting {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.blackboard__actions {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 800px;
}

.blackboard__start-btn {
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: #1a73e8;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.blackboard__start-btn:hover {
  background: #1557b0;
  border-color: #1557b0;
}

@media (max-width: 768px) {
  .blackboard-wrapper {
    padding: 8px;
  }

  .blackboard {
    padding: 12px;
    border-width: 3px;
  }

  .blackboard__status {
    font-size: 16px;
  }

  .blackboard__timer-value {
    font-size: 24px;
  }
}
</style>

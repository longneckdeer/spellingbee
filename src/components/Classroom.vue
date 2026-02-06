<template>
  <div class="classroom">
    <div class="classroom__container" :style="containerStyle">
      <div class="classroom__grid" :style="gridStyle">
        <TableCell
          v-for="table in gameStore.tables"
          :key="table.index"
          :table="table"
          :style="tableStyle"
          @sit="handleSit"
          @select="handleSelect"
        />
      </div>
      <button
        v-if="!gameStore.game.isActive && !gameStore.localPlayer.isSeated"
        class="classroom__add-table"
        :style="{ marginTop: `${layout.rowSpacing + 14}px` }"
        @click="handleAddTable"
      >
        + 搬新桌子
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gameStore } from '@/stores/gameStore'
import { useWebSocket } from '@/composables/useWebSocket'
import { MESSAGES } from '@/config/messages'
import { GAME_CONFIG, calculateClassroomLayout } from '@/config/game'
import { tts } from '@/services/tts'
import TableCell from '@/components/TableCell.vue'

const { send } = useWebSocket()

const layout = computed(() => {
  // Use smaller maxWidth on mobile to prevent overflow
  const isMobile = window.innerWidth <= 920
  const maxWidth = isMobile ? window.innerWidth - 32 : 840

  return calculateClassroomLayout(
    gameStore.tables.length,
    maxWidth,
    GAME_CONFIG.tableSpacing
  )
})

const containerStyle = computed(() => ({
  maxWidth: `${layout.value.totalWidth}px`
}))

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${layout.value.columns}, 1fr)`,
  rowGap: `${layout.value.rowSpacing}px`,
  columnGap: `${layout.value.columnSpacing}px`
}))

const tableStyle = computed(() => ({
  '--table-height': `${layout.value.tableHeight}px`
}))

function handleSit(tableIndex) {
  if (gameStore.game.isActive) return
  if (gameStore.localPlayer.isSeated) return
  if (gameStore.tables[tableIndex].playerId !== null) return

  // Unlock audio for mobile browsers (must be in user gesture context)
  tts.unlockAudio()

  // Clear any typing from this player before sitting
  gameStore.updateTyping(gameStore.localPlayer.id, '')

  gameStore.sitAtTable(
    tableIndex,
    gameStore.localPlayer.id,
    gameStore.localPlayer.nickname
  )

  send({
    type: MESSAGES.PLAYER_SIT,
    playerId: gameStore.localPlayer.id,
    nickname: gameStore.localPlayer.nickname,
    tableIndex
  })

  // Ensure typing is cleared on all clients
  send({
    type: MESSAGES.PLAYER_TYPING,
    playerId: gameStore.localPlayer.id,
    typing: ''
  })
}

function handleSelect(tableIndex) {
  if (gameStore.localPlayer.isSeated) return

  if (gameStore.selectedTableIndex === tableIndex) {
    gameStore.setSelectedTableIndex(null)
  } else {
    gameStore.setSelectedTableIndex(tableIndex)
  }
}

function handleAddTable() {
  if (gameStore.game.isActive) return

  send({
    type: MESSAGES.TABLE_ADD
  })
}
</script>

<style scoped>
.classroom {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  padding: 16px;
  background: #fafafa;
  overflow-y: auto;
}

.classroom__container {
  width: 100%;
}

.classroom__grid {
  display: grid;
}

.classroom__add-table {
  display: block;
  margin: 0 auto;
  padding: 4px 10px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #9e9e9e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.classroom__add-table:hover {
  background: #f5f5f5;
  color: #666;
}
</style>

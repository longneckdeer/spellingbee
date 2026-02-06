<template>
  <div
    class="table-cell"
    :class="cellClasses"
    @click="handleClick"
    :data-testid="`table-${table.index}`"
  >
    <span class="table-cell__label" v-if="isOccupied">{{ table.nickname }}</span>
    <div class="table-cell__desk">
      <span class="table-cell__ready-badge" v-if="showReadyBadge">✓</span>
      <span class="table-cell__empty-hint" v-if="!isOccupied && canSit">入座</span>
      <span class="table-cell__typing" v-if="showTyping" :style="typingStyle" :class="{ 'table-cell__typing--submitted': table.hasSubmittedAnswer }">
        <span class="table-cell__correct-check" v-if="showCorrectCheck">✓</span><span class="table-cell__incorrect-x" v-if="showIncorrectX">✗</span>{{ displayTyping }}
      </span>
      <div class="table-cell__eliminated" v-if="table.isEliminated && eliminatedData">
        <span class="table-cell__eliminated-answer" v-if="eliminatedData.answer">{{ eliminatedData.answer }}</span>
        <span class="table-cell__eliminated-word">{{ eliminatedData.word }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gameStore } from '@/stores/gameStore'

const props = defineProps({
  table: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['sit', 'select'])

const isOccupied = computed(() => props.table.playerId !== null)
const isLocalPlayer = computed(() => props.table.playerId === gameStore.localPlayer.id)
const isSelected = computed(() => gameStore.selectedTableIndex === props.table.index)

const canSit = computed(() => {
  return !isOccupied.value &&
         !gameStore.game.isActive &&
         !gameStore.localPlayer.isSeated
})

const showTyping = computed(() => {
  return isOccupied.value &&
         !props.table.isEliminated &&
         gameStore.game.isActive &&
         (gameStore.game.phase === 'playing' || gameStore.game.phase === 'reviewing') &&
         props.table.currentTyping.length > 0
})

const displayTyping = computed(() => {
  const typing = props.table.currentTyping || ''
  if (isLocalPlayer.value) {
    return typing
  }
  if (gameStore.localPlayer.isSeated) {
    return typing.split('').map(() => '•').join('')
  }
  return typing
})

const isTypingCorrect = computed(() => {
  if (!gameStore.game.currentQuestion) return false
  const typing = props.table.currentTyping || ''
  return typing.toLowerCase() === gameStore.game.currentQuestion.word.toLowerCase()
})

const showCorrectCheck = computed(() => {
  // Only show for observers (not seated) watching others during playing phase
  return !gameStore.localPlayer.isSeated &&
         !isLocalPlayer.value &&
         gameStore.game.phase === 'playing' &&
         isTypingCorrect.value &&
         props.table.currentTyping.length > 0
})

const showIncorrectX = computed(() => {
  // Show red X for observers when player submitted wrong answer
  return !gameStore.localPlayer.isSeated &&
         !isLocalPlayer.value &&
         gameStore.game.phase === 'playing' &&
         props.table.hasSubmittedAnswer &&
         !isTypingCorrect.value &&
         props.table.currentTyping.length > 0
})

const typingStyle = computed(() => {
  const len = displayTyping.value.length
  // Base font size 13px, scale down for longer words
  if (len <= 10) return {}
  const scale = Math.max(0.55, 10 / len)
  return {
    fontSize: `${Math.round(13 * scale)}px`,
    letterSpacing: len > 14 ? '0px' : '1px'
  }
})

const eliminatedData = computed(() => {
  if (!props.table.isEliminated || !props.table.roundResults) return null

  // Find the last incorrect answer
  const lastIncorrect = [...props.table.roundResults]
    .reverse()
    .find(r => !r.correct)

  return lastIncorrect ? {
    word: lastIncorrect.word,
    answer: lastIncorrect.answer
  } : null
})

const showReadyBadge = computed(() => {
  if (!isOccupied.value) return false

  const phase = gameStore.game.phase

  // During gameEnd, everyone can show ready badge (preparing for next game)
  if (phase === 'gameEnd') {
    return props.table.isReady
  }

  // During other phases, only non-eliminated players show ready badge
  if (props.table.isEliminated) return false
  return (phase === 'waiting' || phase === 'reviewing') && props.table.isReady
})

const cellClasses = computed(() => ({
  'table-cell--empty': !isOccupied.value,
  'table-cell--occupied': isOccupied.value,
  'table-cell--local': isLocalPlayer.value,
  'table-cell--eliminated': props.table.isEliminated,
  'table-cell--selected': isSelected.value,
  'table-cell--clickable': canSit.value || (isOccupied.value && !isLocalPlayer.value)
}))

function handleClick() {
  if (canSit.value) {
    emit('sit', props.table.index)
  } else if (isOccupied.value && !isLocalPlayer.value) {
    emit('select', props.table.index)
  }
}
</script>

<style scoped>
.table-cell {
  position: relative;
  padding-top: 18px;
}

.table-cell__label {
  position: absolute;
  top: 0;
  left: 2px;
  font-size: 13px;
  font-weight: 500;
  color: #5f6368;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.table-cell__desk {
  position: relative;
  background: #fff;
  border: 2px solid #dadce0;
  border-radius: 6px;
  height: var(--table-height, 44px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.table-cell--clickable {
  cursor: pointer;
}

.table-cell--clickable:hover .table-cell__desk {
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.table-cell--empty .table-cell__desk {
  border: 2px dashed #bdc1c6;
  background: #fafafa;
}

.table-cell--empty.table-cell--clickable .table-cell__desk {
  border-color: #1a73e8;
  background: #f8fbff;
}

.table-cell--empty.table-cell--clickable:hover .table-cell__desk {
  background: #e8f0fe;
  border-color: #1967d2;
}

.table-cell--occupied .table-cell__desk {
  border: 2px solid #1a73e8;
  box-shadow: 0 1px 3px rgba(26, 115, 232, 0.15);
}

.table-cell--local .table-cell__desk {
  border-color: #1a73e8;
  background: #e8f0fe;
}

.table-cell--selected .table-cell__desk {
  border-color: #fbbc04;
  background: #fef7e0;
}

.table-cell--eliminated .table-cell__desk {
  border-color: #dadce0;
  background: #f1f3f4;
}

.table-cell--eliminated .table-cell__label {
  color: #bdc1c6;
}

.table-cell__typing {
  font-size: 14px;
  color: #202124;
  font-family: var(--font-mono);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 6px;
}

.table-cell__typing--submitted {
  color: #4285f4;
  font-weight: 500;
}

.table-cell__correct-check {
  color: #1e8e3e;
  font-weight: bold;
  margin-right: 4px;
}

.table-cell__incorrect-x {
  color: #d93025;
  font-weight: bold;
  margin-right: 4px;
}

.table-cell__eliminated {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 0 6px;
  min-width: 0;
  width: 100%;
}

.table-cell__eliminated-word {
  font-size: 10px;
  color: #202124;
  font-weight: 400;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.table-cell__eliminated-answer {
  font-size: 10px;
  color: #d93025;
  font-weight: 400;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-decoration: line-through;
}

.table-cell__empty-hint {
  font-size: 12px;
  color: #9e9e9e;
  font-weight: 400;
  padding: 4px 10px;
  transition: all 0.2s;
}

.table-cell--clickable:hover .table-cell__empty-hint {
  color: #1a73e8;
}

.table-cell__ready-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
  color: #1e8e3e;
  font-weight: bold;
  background: #e6f4ea;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.table-cell--eliminated .table-cell__ready-badge {
  display: none;
}

@media (max-width: 920px) {
  .table-cell__name {
    font-size: 11px;
  }

  .table-cell__typing {
    font-size: 12px;
    min-height: 18px;
  }

  .table-cell__indicator {
    font-size: 11px;
  }

  .table-cell__empty-hint {
    font-size: 11px;
  }

  .table-cell__ready-badge {
    width: 16px;
    height: 16px;
    font-size: 11px;
    top: 3px;
    right: 3px;
  }

  .table-cell__eliminated-answer {
    font-size: 9px;
  }
}
</style>

<template>
  <div class="room-picker">
    <div class="room-picker__header">
      <h1 class="room-picker__title">超級拼字王</h1>
      <p class="room-picker__subtitle">誰是拼字王？答錯就掰掰囉！</p>
    </div>

    <div class="room-picker__content" v-if="!hasNickname">
      <label class="room-picker__label">輸入暱稱</label>
      <input
        v-model="nicknameInput"
        type="text"
        class="room-picker__input"
        placeholder="你的暱稱"
        maxlength="12"
        @keyup.enter="saveNickname"
        data-testid="nickname-input"
      />
      <button
        class="room-picker__btn room-picker__btn--primary"
        :disabled="!nicknameInput.trim()"
        @click="saveNickname"
      >
        確認
      </button>
    </div>

    <div class="room-picker__content" v-else>
      <div class="room-picker__welcome">
        {{ gameStore.localPlayer.nickname }}
        <button class="room-picker__link" @click="editNickname">更改</button>
      </div>

      <div class="room-picker__rooms">
        <div
          v-for="room in rooms"
          :key="room.level"
          class="room-picker__room"
          :class="{ 'room-picker__room--loading': connectingTo === room.level }"
          @click="joinRoom(room)"
        >
          <span class="room-picker__room-icon">{{ room.icon }}</span>
          <div class="room-picker__room-info">
            <span class="room-picker__room-name">{{ room.name }}</span>
            <span class="room-picker__room-desc">{{ room.description }}</span>
          </div>
          <div class="room-picker__room-right">
            <span v-if="room.playerCount > 0" class="room-picker__room-count">
              {{ room.playerCount }} 人
            </span>
            <span class="room-picker__room-action">
              {{ connectingTo === room.level ? '連線中...' : '加入' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="room-picker__error">
      {{ error }}
      <button class="room-picker__link" @click="error = ''">關閉</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gameStore } from '@/stores/gameStore'
import englishSpelling from '@/gameTypes/english-spelling'
import { useWebSocket } from '@/composables/useWebSocket'

const nicknameInput = ref(gameStore.localPlayer.nickname || '')
const connectingTo = ref(null)
const error = ref('')
const roomCounts = ref({})
let countInterval = null

const { connect, disconnect } = useWebSocket()

const hasNickname = computed(() => {
  return gameStore.localPlayer.nickname && gameStore.localPlayer.nickname.trim().length > 0
})

const rooms = computed(() => {
  return englishSpelling.levels.map(level => {
    const roomId = `spellingbee-${level.id}`
    const count = roomCounts.value[roomId] || 0
    return {
      level: level.id,
      name: level.name,
      icon: getLevelIcon(level.id),
      description: getLevelDescription(level.id),
      playerCount: count
    }
  })
})

function getLevelIcon(level) {
  const icons = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }
  return icons[level] || level
}

function getLevelDescription(level) {
  const descriptions = {
    1: '基礎單字',
    2: '國中程度',
    3: '高中程度',
    4: '大學程度',
    5: '專業詞彙'
  }
  return descriptions[level] || ''
}

function saveNickname() {
  const trimmed = nicknameInput.value.trim()
  if (trimmed) {
    gameStore.setNickname(trimmed)
  }
}

function editNickname() {
  nicknameInput.value = gameStore.localPlayer.nickname
  gameStore.setNickname('')
}

async function joinRoom(room) {
  if (connectingTo.value) return

  connectingTo.value = room.level
  error.value = ''

  try {
    gameStore.setGameType(englishSpelling)
    gameStore.setCurrentRoom({
      level: room.level,
      levelName: room.name
    })

    const roomId = `spellingbee-${room.level}`

    // Connect to WebSocket server
    await connect(roomId)

    gameStore.setScreen('room')
  } catch (err) {
    error.value = `無法連線：${err.message || '請稍後再試'}`
    gameStore.setCurrentRoom(null)
    disconnect()
  } finally {
    connectingTo.value = null
  }
}

async function fetchRoomCounts() {
  try {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = import.meta.env.DEV
      ? 'localhost:8788'
      : 'spellingisfun-worker.jeff-kuo.workers.dev'

    const url = `${protocol}//${host}/api/room-counts`
    console.log('Fetching room counts from:', url)

    const response = await fetch(url)
    console.log('Room counts response status:', response.status)

    if (response.ok) {
      const counts = await response.json()
      console.log('Room counts received:', counts)
      roomCounts.value = counts
    } else {
      console.error('Room counts fetch failed with status:', response.status)
    }
  } catch (err) {
    console.error('Failed to fetch room counts:', err)
  }
}

onMounted(() => {
  if (gameStore.screen !== 'roomPicker') {
    gameStore.leaveRoom()
  }

  // Fetch initial counts
  fetchRoomCounts()

  // Update counts every 3 seconds
  countInterval = setInterval(fetchRoomCounts, 3000)
})

onUnmounted(() => {
  if (countInterval) {
    clearInterval(countInterval)
    countInterval = null
  }
})
</script>

<style scoped>
.room-picker {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  background: #fff;
}

.room-picker__header {
  text-align: center;
  margin-bottom: 32px;
}

.room-picker__title {
  font-size: 28px;
  font-weight: 400;
  color: #202124;
  margin: 0;
  font-family: var(--font-display);
}

.room-picker__subtitle {
  font-size: 14px;
  color: #5f6368;
  margin: 8px 0 0 0;
}

.room-picker__content {
  width: 100%;
  max-width: 360px;
}

.room-picker__label {
  display: block;
  font-size: 14px;
  color: #5f6368;
  margin-bottom: 8px;
}

.room-picker__input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  outline: none;
  margin-bottom: 16px;
}

.room-picker__input:focus {
  border-color: #1a73e8;
}

.room-picker__btn {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: #fff;
  color: #5f6368;
  cursor: pointer;
}

.room-picker__btn--primary {
  background: #1a73e8;
  border-color: #1a73e8;
  color: #fff;
}

.room-picker__btn--primary:hover:not(:disabled) {
  background: #1557b0;
}

.room-picker__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.room-picker__welcome {
  text-align: center;
  font-size: 14px;
  color: #202124;
  margin-bottom: 24px;
}

.room-picker__link {
  background: none;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  font-size: inherit;
  padding: 0;
  margin-left: 8px;
}

.room-picker__link:hover {
  text-decoration: underline;
}

.room-picker__rooms {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-picker__room {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.room-picker__room:hover {
  background: #f8f9fa;
  border-color: #d2d2d2;
}

.room-picker__room--loading {
  opacity: 0.6;
  pointer-events: none;
}

.room-picker__room-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f0fe;
  color: #1a73e8;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 500;
}

.room-picker__room-info {
  flex: 1;
  min-width: 0;
}

.room-picker__room-name {
  display: block;
  font-size: 14px;
  color: #202124;
}

.room-picker__room-desc {
  display: block;
  font-size: 12px;
  color: #5f6368;
  margin-top: 2px;
}

.room-picker__room-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-picker__room-count {
  font-size: 12px;
  color: #5f6368;
  font-weight: 500;
  padding: 4px 8px;
  background: #f1f3f4;
  border-radius: 4px;
}

.room-picker__room-action {
  font-size: 13px;
  color: #1a73e8;
  font-weight: 500;
}

.room-picker__error {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #d93025;
  color: #fff;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-picker__error .room-picker__link {
  color: #fff;
}
</style>

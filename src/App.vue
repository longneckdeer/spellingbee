<template>
  <div id="app">
    <RoomPicker v-if="gameStore.screen === 'roomPicker'" />
    <TheRoom v-else-if="gameStore.screen === 'room'" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { gameStore } from '@/stores/gameStore'
import { soundEffects } from '@/services/soundEffects'
import RoomPicker from '@/components/RoomPicker.vue'
import TheRoom from '@/components/TheRoom.vue'

onMounted(() => {
  // Initialize sound effects service
  soundEffects.init()

  // Preload all sounds in the background
  soundEffects.preloadAll()
})
</script>

<style>
/* Global styles are in assets/main.css */
</style>

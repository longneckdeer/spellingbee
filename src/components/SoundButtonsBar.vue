<template>
  <div class="sound-buttons-bar">
    <button
      class="sound-buttons-bar__btn"
      @click.stop="$emit('playWord')"
      title="播放單字"
    >
      🔊 單字
    </button>
    <button
      class="sound-buttons-bar__btn"
      @click.stop="$emit('playSentence')"
      title="播放例句"
    >
      📝 例句
    </button>
    <button
      class="sound-buttons-bar__btn"
      @click.stop="$emit('playPartOfSpeech')"
      title="播放詞性"
    >
      🏷️  詞性
    </button>
    <button
      v-if="hasDefinition"
      class="sound-buttons-bar__btn"
      @click.stop="$emit('playDefinition')"
      title="播放定義"
    >
      📖 定義
    </button>
  </div>
</template>

<script setup>
defineProps({
  hasDefinition: {
    type: Boolean,
    default: false
  }
})

defineEmits(['playWord', 'playSentence', 'playPartOfSpeech', 'playDefinition'])
</script>

<style scoped>
.sound-buttons-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.sound-buttons-bar__btn {
  flex: 1 1 auto;
  min-width: 70px;
  max-width: 100px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #1a73e8;
  background: #e8f0fe;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.sound-buttons-bar__btn:hover {
  background: #d2e3fc;
}

.sound-buttons-bar__btn:active {
  background: #c4d7f5;
}

@media (max-width: 920px) {
  .sound-buttons-bar {
    gap: 6px;
  }

  .sound-buttons-bar__btn {
    flex: 1 1 0;
    min-width: 0;
    max-width: none;
    padding: 8px 6px;
    font-size: 12px;
  }
}
</style>

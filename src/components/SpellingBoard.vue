<template>
  <div ref="boardRef" class="spelling-board" dir="ltr" @click="focusInput">
    <input
      ref="hiddenInput"
      type="text"
      class="hidden-input"
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="updateCursorPosition"
      @click="updateCursorPosition"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      :disabled="disabled"
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
      inputmode="text"
      lang="en"
      dir="ltr"
    />

    <div class="letters-container" dir="ltr" :style="containerStyle">
      <!-- Cursor/prompt at start if position is 0 -->
      <div v-if="!disabled && !showResult && cursorPosition === 0" class="cursor-wrapper">
        <span class="cursor" :class="{ 'cursor--hide-mobile': showTapPrompt }"></span>
        <span v-if="showTapPrompt" class="tap-prompt" @click="focusInput">點擊這裡開始打字</span>
      </div>

      <template v-for="(letter, index) in displayLetters" :key="index">
        <div
          class="letter-slot"
          :class="getLetterClass(index)"
        >
          <span class="letter">{{ letter }}</span>
          <span class="underline"></span>
        </div>
        <!-- Cursor after this letter if cursor position is after it -->
        <div v-if="!disabled && !showResult && cursorPosition === index + 1" class="cursor-wrapper">
          <span class="cursor"></span>
        </div>
      </template>
    </div>

    <!-- IME Warning -->
    <div v-if="showImeWarning" class="ime-warning">
      請切換到英文輸入法
    </div>

    <!-- Show correct answer at bottom when wrong -->
    <div v-if="showResult && !isAllCorrect && correctAnswer" class="correction">
      <span class="correction__label">正確答案：</span>
      <span class="correction__answer">{{ correctAnswer }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { GAME_CONFIG } from '@/config/game'
import { soundEffects } from '@/services/soundEffects'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  correctAnswer: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showResult: {
    type: Boolean,
    default: false
  },
  showTapPrompt: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'typing', 'submit'])

const hiddenInput = ref(null)
const boardRef = ref(null)
const containerWidth = ref(800)
const isComposing = ref(false)
const showImeWarning = ref(false)
const cursorPosition = ref(0)
let imeWarningTimeout = null

const displayLetters = computed(() => {
  // Always show the user's answer as-is
  return props.modelValue.split('')
})

const containerStyle = computed(() => {
  const baseWidth = 32
  const gap = 6
  const letterCount = displayLetters.value.length + (props.showResult ? 0 : 1)
  const totalWidth = letterCount * baseWidth + (letterCount - 1) * gap

  if (totalWidth > containerWidth.value && containerWidth.value > 0) {
    const scale = containerWidth.value / totalWidth
    return {
      '--letter-size': `${Math.max(20, 32 * scale)}px`,
      '--font-size': `${Math.max(16, 26 * scale)}px`
    }
  }
  return {}
})

function updateContainerWidth() {
  if (boardRef.value) {
    containerWidth.value = boardRef.value.clientWidth - 32
  }
}

const isAllCorrect = computed(() => {
  if (!props.correctAnswer) return false
  return props.modelValue.toLowerCase() === props.correctAnswer.toLowerCase()
})

const getLetterClass = (index) => {
  if (!props.showResult) {
    return {}
  }
  // Color entire answer: all green if correct, all red if wrong
  return {
    'letter-slot--correct': isAllCorrect.value,
    'letter-slot--incorrect': !isAllCorrect.value
  }
}

const isCorrectAt = (index) => {
  if (!props.correctAnswer) return true

  // If the complete answer is correct, all letters are correct
  if (isAllCorrect.value) return true

  // If complete answer is wrong, check individual letters
  // Letters beyond user's input are incorrect (missing)
  if (index >= props.modelValue.length) return false

  // Check if this letter matches
  const userLetter = props.modelValue[index]?.toLowerCase()
  const correctLetter = props.correctAnswer[index]?.toLowerCase()
  return userLetter === correctLetter
}

const getCorrectLetter = (index) => {
  if (!props.correctAnswer || index >= props.correctAnswer.length) return ''
  return props.correctAnswer[index]
}


const focusInput = () => {
  // Don't focus if user was typing recently
  const timeSinceInput = Date.now() - lastInputTime
  if (timeSinceInput < 500) {
    return
  }

  if (!props.disabled && hiddenInput.value) {
    hiddenInput.value.focus()
  }
}

const handleInput = (event) => {
  // Track input time to prevent focus monitoring from interfering
  lastInputTime = Date.now()

  const previousValue = props.modelValue
  const inputElement = event.target

  let value = inputElement.value.replace(/[^a-zA-Z]/g, '')
  if (value.length > GAME_CONFIG.maxWordLength) {
    value = value.slice(0, GAME_CONFIG.maxWordLength)
  }

  // Play key press sound when a letter is added
  if (value.length > previousValue.length) {
    soundEffects.playKeyPress()
  }

  // If typing in English (not composing), hide IME warning immediately
  if (!isComposing.value && showImeWarning.value) {
    showImeWarning.value = false
    if (imeWarningTimeout) {
      clearTimeout(imeWarningTimeout)
      imeWarningTimeout = null
    }
  }

  emit('update:modelValue', value)
  emit('typing', value)

  // Let browser handle cursor position naturally
  nextTick(() => {
    updateCursorPosition()
  })
}

const handleKeydown = (event) => {
  if (event.key === 'Enter' && props.modelValue.trim()) {
    soundEffects.play('submit')
    emit('submit')
  }

  // Update cursor position for navigation keys
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    nextTick(() => {
      if (hiddenInput.value) {
        cursorPosition.value = hiddenInput.value.selectionStart || 0
      }
    })
  }
}

const updateCursorPosition = () => {
  if (hiddenInput.value) {
    cursorPosition.value = hiddenInput.value.selectionStart || 0
  }
}

const handleCompositionStart = () => {
  isComposing.value = true
  showImeWarning.value = true

  // Clear any existing timeout
  if (imeWarningTimeout) {
    clearTimeout(imeWarningTimeout)
  }
}

const handleCompositionEnd = (event) => {
  isComposing.value = false

  // Don't manually reset the input value - let normal input handling deal with it
  // Setting the value here causes cursor position to be lost

  // Hide warning after 3 seconds
  imeWarningTimeout = setTimeout(() => {
    showImeWarning.value = false
  }, 3000)
}

// Keep input focused at all times during gameplay
let focusInterval = null
let lastInputTime = 0

function startFocusMonitoring() {
  // Focus immediately
  focusInput()

  // Set up interval to maintain focus
  focusInterval = setInterval(() => {
    // Don't refocus if user was typing recently (within last 500ms)
    const timeSinceInput = Date.now() - lastInputTime
    if (timeSinceInput < 500) {
      return
    }

    if (!props.disabled && hiddenInput.value && document.activeElement !== hiddenInput.value) {
      focusInput()
    }
  }, 300) // Check every 300ms (less aggressive)
}

function stopFocusMonitoring() {
  if (focusInterval) {
    clearInterval(focusInterval)
    focusInterval = null
  }
}

onMounted(() => {
  nextTick(() => {
    focusInput()
    updateContainerWidth()
    updateCursorPosition()
  })
  window.addEventListener('resize', updateContainerWidth)

  // Start monitoring focus if not disabled
  if (!props.disabled) {
    startFocusMonitoring()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
  stopFocusMonitoring()
  if (imeWarningTimeout) {
    clearTimeout(imeWarningTimeout)
  }
})

watch(() => props.disabled, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      focusInput()
      startFocusMonitoring()
    })
  } else {
    stopFocusMonitoring()
  }
})

// Watch for model value changes to refocus after clearing
watch(() => props.modelValue, (newVal, oldVal) => {
  // When input is cleared (new round), refocus and reset cursor
  if (oldVal && !newVal && !props.disabled) {
    nextTick(() => {
      focusInput()
      cursorPosition.value = 0
    })
  } else {
    // Update cursor position when value changes
    nextTick(() => updateCursorPosition())
  }
})

defineExpose({ focus: focusInput })
</script>

<style scoped>
.spelling-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  cursor: text;
  min-height: 60px;
  gap: 12px;
  direction: ltr;
}

.hidden-input {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 100px;
  height: 40px;
  font-size: 16px;
  direction: ltr;
  text-align: left;
  border: none;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: transparent;
}

.letters-container {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
  direction: ltr;
}

.letter-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--letter-size, 32px);
  animation: letterPop 0.1s ease-out;
}

@keyframes letterPop {
  0% { transform: scale(0.9); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.letter {
  font-size: var(--font-size, 26px);
  font-weight: 500;
  color: #202124;
  font-family: var(--font-display);
  line-height: 1.3;
}

.underline {
  width: 100%;
  height: 2px;
  background: #5f6368;
  margin-top: 2px;
}

.cursor-wrapper {
  display: flex;
  align-items: flex-end;
}

.cursor {
  width: 2px;
  height: var(--font-size, 26px);
  background: #1a73e8;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.tap-prompt {
  display: none;
  font-size: 13px;
  color: #5f6368;
  white-space: nowrap;
  cursor: pointer;
  padding: 4px 8px;
  background: #f1f3f4;
  border-radius: 4px;
  transition: all 0.15s ease;
  margin-bottom: 2px;
}

.tap-prompt:hover {
  background: #e8eaed;
  color: #1a73e8;
}

/* Show tap prompt only on mobile/touch devices */
@media (max-width: 920px) {
  .tap-prompt {
    display: block;
  }

  .cursor--hide-mobile {
    display: none;
  }
}

.letter-slot--correct .letter {
  color: #1e8e3e;
}

.letter-slot--correct .underline {
  background: #1e8e3e;
}

.letter-slot--incorrect .letter {
  color: #d93025;
}

.letter-slot--incorrect .underline {
  background: #d93025;
}

.correction {
  padding: 12px 16px;
  background: #e6f4ea;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  width: 100%;
  max-width: 600px;
}

.correction__label {
  font-size: 14px;
  color: #137333;
  font-weight: 500;
}

.correction__answer {
  font-size: 18px;
  font-weight: 600;
  color: #1e8e3e;
  font-family: var(--font-mono);
}

.ime-warning {
  padding: 8px 16px;
  background: #fef7e0;
  border: 1px solid #f9ab00;
  border-radius: 6px;
  color: #b06000;
  font-size: 14px;
  font-weight: 500;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .correction {
    padding: 10px 12px;
  }

  .correction__label {
    font-size: 13px;
  }

  .correction__answer {
    font-size: 16px;
  }
}
</style>

import { ref, onUnmounted } from 'vue'

export function useTimer(seconds) {
  const remaining = ref(seconds)
  const isRunning = ref(false)
  let interval = null

  const start = (onTick, onComplete) => {
    if (isRunning.value) return

    isRunning.value = true
    interval = setInterval(() => {
      remaining.value--

      if (onTick) {
        onTick(remaining.value)
      }

      if (remaining.value <= 0) {
        stop()
        if (onComplete) {
          onComplete()
        }
      }
    }, 1000)
  }

  const stop = () => {
    isRunning.value = false
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  const reset = (s = seconds) => {
    stop()
    remaining.value = s
  }

  const pause = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
    isRunning.value = false
  }

  const resume = (onTick, onComplete) => {
    if (remaining.value > 0 && !isRunning.value) {
      start(onTick, onComplete)
    }
  }

  onUnmounted(() => {
    if (interval) {
      clearInterval(interval)
    }
  })

  return {
    remaining,
    isRunning,
    start,
    stop,
    reset,
    pause,
    resume
  }
}

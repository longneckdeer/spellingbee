import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTimer } from '@/composables/useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with given seconds', () => {
    const { remaining } = useTimer(30)
    expect(remaining.value).toBe(30)
  })

  it('should count down when started', () => {
    const { remaining, start } = useTimer(30)
    start()

    vi.advanceTimersByTime(1000)
    expect(remaining.value).toBe(29)

    vi.advanceTimersByTime(1000)
    expect(remaining.value).toBe(28)
  })

  it('should stop when reaching 0', () => {
    const { remaining, isRunning, start } = useTimer(3)
    start()

    vi.advanceTimersByTime(3000)
    expect(remaining.value).toBe(0)
    expect(isRunning.value).toBe(false)
  })

  it('should call onTick callback', () => {
    const onTick = vi.fn()
    const { start } = useTimer(30)
    start(onTick)

    vi.advanceTimersByTime(1000)
    expect(onTick).toHaveBeenCalledWith(29)
  })

  it('should call onComplete callback when done', () => {
    const onComplete = vi.fn()
    const { start } = useTimer(2)
    start(null, onComplete)

    vi.advanceTimersByTime(2000)
    expect(onComplete).toHaveBeenCalled()
  })

  it('should stop timer', () => {
    const { remaining, isRunning, start, stop } = useTimer(30)
    start()

    vi.advanceTimersByTime(1000)
    stop()

    vi.advanceTimersByTime(1000)
    expect(remaining.value).toBe(29)
    expect(isRunning.value).toBe(false)
  })

  it('should reset timer', () => {
    const { remaining, start, reset } = useTimer(30)
    start()

    vi.advanceTimersByTime(5000)
    reset()

    expect(remaining.value).toBe(30)
  })

  it('should reset to custom value', () => {
    const { remaining, reset } = useTimer(30)
    reset(60)
    expect(remaining.value).toBe(60)
  })
})

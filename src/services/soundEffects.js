class SoundEffectsService {
  constructor() {
    this.sounds = {}
    this.enabled = false // Disabled until MP3s are ready
    this.volume = 0.5
    this.initialized = false
  }

  // Initialize sound effects with URLs
  init(soundUrls = {}) {
    // Skip loading if sounds are disabled (MP3s not ready)
    if (!this.enabled) {
      this.initialized = true
      return
    }

    const defaultSounds = {
      // Typing/interaction sounds
      keyPress: '/sounds/key-press.mp3',
      submit: '/sounds/submit.mp3',

      // Answer feedback sounds
      correct: '/sounds/correct.mp3',
      wrong: '/sounds/wrong.mp3',

      // Game result sounds
      firstPlace: '/sounds/first-place.mp3',
      secondPlace: '/sounds/second-place.mp3',
      thirdPlace: '/sounds/third-place.mp3',
      participation: '/sounds/participation.mp3',

      // UI sounds
      join: '/sounds/join.mp3',
      leave: '/sounds/leave.mp3',
      countdown: '/sounds/countdown.mp3'
    }

    const urls = { ...defaultSounds, ...soundUrls }

    // Create Audio objects for each sound
    Object.keys(urls).forEach(key => {
      try {
        this.sounds[key] = new Audio(urls[key])
        this.sounds[key].volume = this.volume
        this.sounds[key].preload = 'auto'
      } catch (error) {
        console.warn(`Failed to load sound: ${key}`, error)
      }
    })

    this.initialized = true
  }

  // Play a sound by name
  play(soundName, volumeOverride = null) {
    if (!this.enabled || !this.initialized) return

    const sound = this.sounds[soundName]
    if (!sound) {
      console.warn(`Sound not found: ${soundName}`)
      return
    }

    try {
      // Clone the audio to allow overlapping sounds
      const audioClone = sound.cloneNode()
      audioClone.volume = volumeOverride !== null ? volumeOverride : this.volume

      // Play and clean up
      const playPromise = audioClone.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Failed to play sound: ${soundName}`, error)
        })
      }
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error)
    }
  }

  // Play key press with slight randomization for natural feel
  playKeyPress() {
    const randomVolume = this.volume * (0.8 + Math.random() * 0.4) // 80%-120% of base volume
    this.play('keyPress', randomVolume)
  }

  // Play rank-based victory sound
  playVictorySound(rank, totalPlayers) {
    if (rank === 1) {
      this.play('firstPlace')
    } else if (rank === 2) {
      this.play('secondPlace')
    } else if (rank === 3) {
      this.play('thirdPlace')
    } else {
      this.play('participation', 0.3) // Quieter for lower ranks
    }
  }

  // Set global volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume
    })
  }

  // Enable/disable all sounds
  setEnabled(enabled) {
    this.enabled = enabled
  }

  // Stop all currently playing sounds
  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      sound.pause()
      sound.currentTime = 0
    })
  }

  // Preload all sounds (call when app starts)
  async preloadAll() {
    const promises = Object.values(this.sounds).map(sound => {
      return new Promise(resolve => {
        if (sound.readyState >= 2) {
          resolve()
        } else {
          sound.addEventListener('canplaythrough', resolve, { once: true })
          sound.load()
        }
      })
    })

    try {
      await Promise.all(promises)
      console.log('All sound effects preloaded')
    } catch (error) {
      console.warn('Some sounds failed to preload', error)
    }
  }
}

// Export singleton instance
export const soundEffects = new SoundEffectsService()

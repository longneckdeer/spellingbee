# Sound Effects Setup Guide

## Directory Structure

Create a `public/sounds/` directory in your project and add the following sound files:

```
public/
└── sounds/
    ├── key-press.mp3          # Typing sound
    ├── submit.mp3             # Submit answer sound
    ├── correct.mp3            # Correct answer chime
    ├── wrong.mp3              # Wrong answer buzz
    ├── first-place.mp3        # Victory fanfare (1st place)
    ├── second-place.mp3       # Applause (2nd place)
    ├── third-place.mp3        # Congratulations (3rd place)
    ├── participation.mp3      # Neutral tone (4th+ place)
    ├── join.mp3               # Player joins room
    ├── leave.mp3              # Player leaves room
    └── countdown.mp3          # Countdown tick
```

---

## Recommended Free Sound Effects

### 1. **Key Press** (typing sound)
**Source**: [Pixabay - Keyboard Sounds](https://pixabay.com/sound-effects/search/keyboard/)
- Search for: "keyboard click" or "key press"
- Recommendation: Short, crisp click sound (0.1-0.2s)
- Download as: `key-press.mp3`

**Alternative**: [Mixkit - Keyboard Effects](https://mixkit.co/free-sound-effects/keyboard/)
- Try: "Mechanical keyboard click"

---

### 2. **Submit** (whoosh/send)
**Source**: [Pixabay - Whoosh Sounds](https://pixabay.com/sound-effects/search/whoosh/)
- Search for: "whoosh", "swoosh", or "send"
- Recommendation: Quick swoosh (0.3-0.5s)
- Download as: `submit.mp3`

---

### 3. **Correct Answer** (satisfying ding)
**Source**: [Pixabay - Correct Sounds](https://pixabay.com/sound-effects/search/correct/)
- Search for: "correct answer ding" or "success chime"
- Recommendation: Pleasant bell/chime (0.5-1.0s)
- Download as: `correct.mp3`

**Alternative**: [ElevenLabs - Correct Answer](https://elevenlabs.io/sound-effects/correct-answer)
- Browse: "Uplifting chimes" category

---

### 4. **Wrong Answer** (neutral buzz)
**Source**: [Pixabay - Wrong Sounds](https://pixabay.com/sound-effects/search/wrong/)
- Search for: "wrong answer" or "error beep"
- Recommendation: Soft buzz, NOT harsh (0.5-0.8s)
- Download as: `wrong.mp3`

**Alternative**: [Mixkit - Wrong Effects](https://mixkit.co/free-sound-effects/wrong/)
- Try: "Neutral error tone"

---

### 5. **First Place** (epic victory)
**Source**: [Pixabay - Victory Sounds](https://pixabay.com/sound-effects/search/victory/)
- Search for: "victory fanfare" or "winner"
- Recommendation: Triumphant orchestral/fanfare (2-4s)
- Download as: `first-place.mp3`

**Alternative**: [Mixkit - Win Effects](https://mixkit.co/free-sound-effects/win/)
- Try: "Epic victory fanfare"

---

### 6. **Second Place** (applause)
**Source**: [Pixabay - Applause Sounds](https://pixabay.com/sound-effects/search/applause/)
- Search for: "applause" or "clapping"
- Recommendation: Short applause (2-3s)
- Download as: `second-place.mp3`

---

### 7. **Third Place** (congratulations)
**Source**: [Pixabay - Congratulations](https://pixabay.com/sound-effects/search/congratulations/)
- Search for: "congratulations" or "achievement"
- Recommendation: Positive chime/jingle (1-2s)
- Download as: `third-place.mp3`

---

### 8. **Participation** (neutral completion)
**Source**: [Pixabay - Notification Sounds](https://pixabay.com/sound-effects/search/notification/)
- Search for: "gentle notification" or "soft bell"
- Recommendation: Subtle tone, not exciting or sad (0.5-1s)
- Download as: `participation.mp3`

---

### 9. **Join Room** (door open/welcome)
**Source**: [Pixabay - Door Sounds](https://pixabay.com/sound-effects/search/door/)
- Search for: "door open" or "welcome"
- Recommendation: Light, friendly sound (0.5-1s)
- Download as: `join.mp3`

---

### 10. **Leave Room** (door close)
**Source**: [Pixabay - Door Sounds](https://pixabay.com/sound-effects/search/door/)
- Search for: "door close" or "exit"
- Recommendation: Soft close sound (0.5-1s)
- Download as: `leave.mp3`

---

### 11. **Countdown** (tick/beep)
**Source**: [Pixabay - Clock Sounds](https://pixabay.com/sound-effects/search/clock/)
- Search for: "clock tick" or "beep"
- Recommendation: Simple tick sound (0.1-0.2s)
- Download as: `countdown.mp3`

---

## Quick Setup Steps

### 1. Create Directory
```bash
mkdir -p public/sounds
```

### 2. Download Sounds
- Visit the Pixabay/Mixkit links above
- Download MP3 files (or convert to MP3 if needed)
- Rename to match the filenames above
- Place in `public/sounds/` directory

### 3. Convert Audio (if needed)
If you download WAV or other formats, convert to MP3:

**Using FFmpeg** (install via `brew install ffmpeg` on Mac):
```bash
ffmpeg -i input.wav -codec:a libmp3lame -q:a 2 output.mp3
```

**Online Tool**: [CloudConvert](https://cloudconvert.com/wav-to-mp3)

---

## Testing Sounds

Create a test HTML file to preview sounds:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Sound Effects Test</title>
</head>
<body>
  <h1>Test Sound Effects</h1>
  <button onclick="play('key-press')">Key Press</button>
  <button onclick="play('submit')">Submit</button>
  <button onclick="play('correct')">Correct</button>
  <button onclick="play('wrong')">Wrong</button>
  <button onclick="play('first-place')">1st Place</button>
  <button onclick="play('second-place')">2nd Place</button>
  <button onclick="play('third-place')">3rd Place</button>
  <button onclick="play('participation')">Participation</button>

  <script>
    function play(name) {
      const audio = new Audio(`/sounds/${name}.mp3`)
      audio.play()
    }
  </script>
</body>
</html>
```

---

## Customization

### Adjust Volume
In `src/services/soundEffects.js`, modify default volume:
```javascript
this.volume = 0.5  // 0.0 (mute) to 1.0 (full volume)
```

### Change Sound Files
Update the paths in `soundEffects.init()` or pass custom URLs:
```javascript
soundEffects.init({
  correct: '/custom/sounds/my-correct.mp3',
  wrong: '/custom/sounds/my-wrong.mp3'
})
```

---

## File Size Recommendations

Keep sound files small for fast loading:
- **Key press**: < 10 KB
- **Submit/Correct/Wrong**: 20-50 KB
- **Victory sounds**: 100-200 KB
- **Total**: < 1 MB for all sounds

Compress MP3s to 128 kbps or lower for web use.

---

## License Compliance

All sounds from Pixabay and Mixkit are:
- ✅ Royalty-free
- ✅ Free for commercial use
- ✅ No attribution required

Always verify the license when downloading. Save the license info in `public/sounds/LICENSE.txt`:

```
Sound Effects Sources:
- Pixabay (https://pixabay.com/) - Free for commercial use, no attribution required
- Mixkit (https://mixkit.co/) - Free for commercial use, no attribution required

Downloaded: 2026-02-01
```

---

## Troubleshooting

**Sounds not playing?**
1. Check browser console for errors
2. Verify file paths are correct
3. Ensure files are in `public/sounds/` directory
4. Check file formats (MP3 recommended for best compatibility)
5. Test with simple HTML file first

**Sounds too loud/quiet?**
- Adjust `soundEffects.setVolume(0.3)` in your code
- Or normalize audio files using Audacity (free audio editor)

**Sounds lag or stutter?**
- Reduce file sizes (compress to lower bitrate)
- Ensure `preload='auto'` is set (already done in service)
- Call `soundEffects.preloadAll()` on app startup

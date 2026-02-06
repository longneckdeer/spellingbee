# Google TTS Implementation - 超級拼字王

## Overview
Google TTS has been implemented using the **Web Speech API** which automatically uses Google's text-to-speech engine when running in Chrome/Chromium browsers.

## What Was Implemented

### 1. Enhanced Voice Selection (`src/services/tts.js`)
The TTS service now prioritizes Google voices with the following logic:

**Priority Order:**
1. ✅ Google voices matching language exactly (e.g., "Google US English")
2. ✅ Any Google voice for language family (e.g., "Google UK English" for English)
3. ✅ Any voice matching language exactly
4. ✅ Any voice for language family
5. ✅ First available voice (fallback)

### 2. Spelling Bee Format Method
Added `speakSpellingBeeWord(wordObj)` method that follows standard spelling bee format:

**Pronunciation Sequence:**
1. **Word** (slow, rate 0.6) - spoken twice
2. **Part of Speech** (normal, rate 0.85) - e.g., "noun", "verb"
3. **Definition** (normal, rate 0.85) - if in English
4. **Example Sentence** (normal, rate 0.85)
5. **Word** (slow, rate 0.6) - spoken once more

**Pauses:**
- Short pause (800ms) - between word repetitions
- Medium pause (1200ms) - after part of speech, definition
- Long pause (1500ms) - after sentence

### 3. UI Enhancement (`src/components/SpellingArea.vue`)
Added new "完整播放" (Full Playback) button:

**Before:**
- 🔊 單字 (Word only)
- 📝 例句 (Sentence)
- 🏷️ 詞性 (Part of speech)
- 📖 定義 (Definition)

**After:**
- 🎯 **完整播放** (Full playback - NEW, primary button)
- 🔊 單字 (Word only)
- 📝 例句 (Sentence)
- 🏷️ 詞性 (Part of speech)
- 📖 定義 (Definition)

### 4. Utility Methods
Added helper methods to `TTSService`:

```javascript
// Get all Google voices
tts.getGoogleVoices()

// Get current voice info
tts.getVoiceInfo()
// Returns: { name, lang, isGoogle }

// Check if text contains Chinese
tts.isChinese(text)
```

## Testing

### Quick Test
Open `test-tts.html` in Chrome browser to:
- ✅ See all available voices
- ✅ Identify which Google voices are available
- ✅ Test the full spelling bee format
- ✅ Test individual components (word, sentence, etc.)

### Manual Test in App
1. Start the game
2. Join a room
3. Sit at a desk
4. Click "🎯 完整播放" to hear full pronunciation
5. Or use individual buttons for specific parts

## Browser Compatibility

| Browser | Google TTS | Notes |
|---------|-----------|-------|
| Chrome | ✅ Yes | Native Google voices |
| Edge (Chromium) | ✅ Yes | Uses Chromium TTS |
| Firefox | ⚠️ Partial | May use different TTS engine |
| Safari | ⚠️ Partial | Uses Apple TTS |

**Recommendation:** Use Chrome or Edge for best Google TTS experience.

## How It Works

### Web Speech API
The implementation uses `window.speechSynthesis`:

```javascript
const synth = window.speechSynthesis
const utterance = new SpeechSynthesisUtterance(text)
utterance.voice = getGoogleVoice()  // Selects Google voice
utterance.lang = 'en-US'
utterance.rate = 0.6  // Slow for spelling
synth.speak(utterance)
```

### Google Voice Detection
Voices with "Google" in their name are prioritized:
- "Google US English" ✅
- "Google UK English" ✅
- "Microsoft David Desktop" ❌

### Example Flow

When clicking "完整播放" for the word "beautiful":

```
1. "beautiful" (slow) 🔊
   [800ms pause]
2. "beautiful" (slow) 🔊
   [1200ms pause]
3. "adjective" (normal) 🔊
   [800ms pause]
4. "pleasing the senses or mind aesthetically" (normal) 🔊
   [1200ms pause]
5. "The sunset was beautiful tonight." (normal) 🔊
   [1500ms pause]
6. "beautiful" (slow) 🔊
```

## Benefits

✅ **No API Key Required** - Web Speech API is free
✅ **Offline Capable** - Works without internet (after voices load)
✅ **Natural Pronunciation** - Google's high-quality TTS
✅ **Multiple Speeds** - Slow for spelling, normal for context
✅ **Automatic Language** - Detects and uses appropriate voice
✅ **Eliminates Ambiguity** - Sentence context clarifies homophones

## Code Locations

| File | Purpose |
|------|---------|
| `src/services/tts.js` | Core TTS service with Google voice prioritization |
| `src/components/SpellingArea.vue` | UI with playback buttons |
| `test-tts.html` | Standalone test page |

## Future Enhancements

Potential improvements:
- [ ] Add pronunciation hints for heteronyms (bow, lead, etc.)
- [ ] Allow voice selection in settings
- [ ] Add rate adjustment controls
- [ ] Support multiple languages (Traditional Chinese UI hints)
- [ ] Cache voice selection for performance

## Troubleshooting

**No Google voices found?**
- Ensure you're using Chrome or Edge
- Check `chrome://settings/languages` for installed languages
- Restart browser after installing language packs

**TTS not working?**
- Open browser console (F12) for error messages
- Check microphone/speaker permissions
- Try the test page: `test-tts.html`

**Voice sounds robotic?**
- Confirm Google voice is selected (check test page)
- Try different Chrome/Edge versions
- Check system language settings

## Summary

Google TTS is now fully integrated with:
- ✅ Smart Google voice selection
- ✅ Proper spelling bee format (word-pos-def-sentence-word)
- ✅ Adjustable speaking rates
- ✅ Professional UI with complete playback button
- ✅ Test utility for verification

The system automatically uses Google TTS when available (Chrome/Edge) and provides clear, slow pronunciation perfect for spelling practice!

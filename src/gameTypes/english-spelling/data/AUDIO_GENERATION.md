# Audio Generation Guide

## Overview
This guide explains how to generate offline MP3 audio files for all dictionary words using Google Cloud Text-to-Speech API.

## Prerequisites

### 1. Google Cloud Setup
1. Create a Google Cloud account: https://cloud.google.com/
2. Create a new project or select existing one
3. Enable Cloud Text-to-Speech API:
   - Go to: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
   - Click "Enable"

### 2. Authentication
Create a service account and download credentials:

```bash
# Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
# 1. Click "Create Service Account"
# 2. Name: "spelling-bee-tts"
# 3. Role: "Cloud Text-to-Speech Client"
# 4. Click "Create Key" → JSON
# 5. Save as: ~/google-cloud-credentials.json
```

Set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/google-cloud-credentials.json"
```

Add to your shell profile (~/.bashrc, ~/.zshrc):
```bash
echo 'export GOOGLE_APPLICATION_CREDENTIALS="$HOME/google-cloud-credentials.json"' >> ~/.zshrc
```

### 3. Install Python Library
```bash
pip install google-cloud-texttospeech
```

## Usage

### Generate All Audio Files
```bash
cd "src/gameTypes/english-spelling/data"
python generate_audio.py
```

### Expected Output
```
==============================================================
Google Cloud TTS Audio Generation
==============================================================

✓ Google Cloud TTS client initialized

Loaded 4622 unique words from 5 files
Output directory: src/gameTypes/english-spelling/data/audio
Voice: en-US-Neural2-J

Generating audio files...
--------------------------------------------------------------
[10/4622] beautiful      | 4 files | 2.1 words/sec | ETA: 36.5 min
[20/4622] elephant       | 4 files | 2.3 words/sec | ETA: 33.2 min
...
[4622/4622] pharmaceutical | 4 files | 2.2 words/sec | ETA: 0.0 min

==============================================================
Generation Complete!
==============================================================
Words processed: 4622
Audio files generated: 18488
Time elapsed: 35.2 minutes
Average: 4.0 files per word
Output location: /path/to/audio
```

## Audio File Structure

```
audio/
├── beautiful/
│   ├── beautiful_word.mp3        (slow speed, 0.6 rate)
│   ├── beautiful_sentence.mp3    (normal speed, 0.85 rate)
│   ├── beautiful_pos.mp3         (normal speed, 0.9 rate)
│   └── beautiful_definition.mp3  (normal speed, 0.85 rate)
├── elephant/
│   ├── elephant_word.mp3
│   ├── elephant_sentence.mp3
│   ├── elephant_pos.mp3
│   └── elephant_definition.mp3
└── ...
```

## Cost Estimation

### Google Cloud TTS Pricing
- **WaveNet voices**: $16 per 1 million characters
- **Neural2 voices**: $16 per 1 million characters
- **Standard voices**: $4 per 1 million characters
- **Free tier**: First 1 million characters per month

### Estimated Cost for This Project
- **Total words**: 4,622
- **Files per word**: ~4 (word, sentence, pos, definition)
- **Average characters**:
  - Word: ~10 characters
  - Sentence: ~50 characters
  - Part of speech: ~10 characters
  - Definition: ~40 characters
- **Total characters**: ~4,622 × 110 = ~508,420 characters
- **Cost**: ~$8.13 (one-time cost using Neural2 voices)
- **Free tier**: Likely **FREE** if under 1 million characters/month

## Voice Options

Current default: `en-US-Neural2-J` (high-quality female voice)

### Available Voices
```python
# Edit in generate_audio.py:

# Neural2 (highest quality)
VOICE_NAME = "en-US-Neural2-J"  # Female
VOICE_NAME = "en-US-Neural2-D"  # Male
VOICE_NAME = "en-US-Neural2-F"  # Female (British accent)

# WaveNet (high quality)
VOICE_NAME = "en-US-Wavenet-F"  # Female
VOICE_NAME = "en-US-Wavenet-D"  # Male

# Standard (lower quality, cheaper)
VOICE_NAME = "en-US-Standard-C"  # Female
VOICE_NAME = "en-US-Standard-B"  # Male
```

## Rate Limiting

The script includes automatic rate limiting:
- Pauses 1 second every 50 words
- Stays under free tier quota: 100 requests/min
- Total generation time: ~35-45 minutes for all words

## Next Steps

After generating audio files:

### 1. Move Files to Public Directory
```bash
mkdir -p public/audio
cp -r src/gameTypes/english-spelling/data/audio/* public/audio/
```

### 2. Update Vue Components
Modify `src/components/SpellingArea.vue` to use MP3 files instead of Web Speech API:

```javascript
async function playWord() {
  const word = gameStore.game.currentQuestion.word
  const audio = new Audio(`/audio/${word.toLowerCase()}/${word}_word.mp3`)
  await audio.play()
}

async function playSentence() {
  const word = gameStore.game.currentQuestion.word
  const audio = new Audio(`/audio/${word.toLowerCase()}/${word}_sentence.mp3`)
  await audio.play()
}
```

### 3. Add Preloading (Optional)
Preload audio for better performance:

```javascript
const audioCache = new Map()

function preloadAudio(word) {
  const files = ['word', 'sentence', 'pos', 'definition']
  files.forEach(type => {
    const audio = new Audio(`/audio/${word}/${word}_${type}.mp3`)
    audioCache.set(`${word}_${type}`, audio)
  })
}
```

## Troubleshooting

### Error: "Could not load credentials"
```bash
# Verify environment variable
echo $GOOGLE_APPLICATION_CREDENTIALS

# Re-export if needed
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/google-cloud-credentials.json"
```

### Error: "API not enabled"
1. Go to: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
2. Click "Enable"
3. Wait 1-2 minutes for propagation
4. Retry

### Error: "Permission denied"
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Select your service account
3. Add role: "Cloud Text-to-Speech Client"
4. Re-download credentials JSON

### Slow Generation
- Normal: ~2-3 words/second (~35-45 minutes total)
- If slower: Check internet connection
- If API errors: Increase pause duration in script (line with `time.sleep(1)`)

## Benefits of Offline MP3s

✅ **Consistent pronunciation** - Identical across all devices
✅ **Professional quality** - Google Neural2 voices
✅ **No internet required** - Works completely offline
✅ **Instant playback** - No synthesis delay
✅ **Competition-ready** - Suitable for formal spelling bees
✅ **Cross-platform** - Works in all browsers

## Maintenance

### Adding New Words
1. Add words to dictionary JSON files
2. Re-run `python generate_audio.py`
3. Only new words will be generated (existing files are skipped)
4. Copy new files to `public/audio/`

### Updating Voice
1. Change `VOICE_NAME` in `generate_audio.py`
2. Delete `audio/` directory
3. Re-run script to regenerate all files

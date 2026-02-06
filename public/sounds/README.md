# Sound Effects Directory

This directory contains all game sound effects in MP3 format.

## Required Files

Place the following MP3 files in this directory:

- ✅ `key-press.mp3` - Typing sound (short click)
- ✅ `submit.mp3` - Submit answer (whoosh)
- ✅ `correct.mp3` - Correct answer (pleasant ding)
- ✅ `wrong.mp3` - Wrong answer (soft buzz)
- ✅ `first-place.mp3` - Victory fanfare (epic)
- ✅ `second-place.mp3` - Applause
- ✅ `third-place.mp3` - Congratulations chime
- ✅ `participation.mp3` - Neutral completion tone
- ✅ `join.mp3` - Player joins room
- ✅ `leave.mp3` - Player leaves room
- ✅ `countdown.mp3` - Countdown tick

## Quick Download Guide

### Option 1: Pixabay (Free, No Attribution)

Visit [Pixabay Sound Effects](https://pixabay.com/sound-effects/) and search for:

1. "keyboard click" → Save as `key-press.mp3`
2. "whoosh" → Save as `submit.mp3`
3. "correct answer" → Save as `correct.mp3`
4. "wrong answer" → Save as `wrong.mp3`
5. "victory fanfare" → Save as `first-place.mp3`
6. "applause" → Save as `second-place.mp3`
7. "congratulations" → Save as `third-place.mp3`
8. "notification" → Save as `participation.mp3`
9. "door open" → Save as `join.mp3`
10. "door close" → Save as `leave.mp3`
11. "clock tick" → Save as `countdown.mp3`

### Option 2: Generate with AI

Use [ElevenLabs Sound Effects](https://elevenlabs.io/sound-effects) to generate custom sounds from text prompts:

- "Keyboard key press click"
- "Swoosh send sound"
- "Pleasant correct answer chime"
- etc.

### Option 3: Use Placeholders (Testing)

For quick testing, you can use online placeholder sound generators or silence files temporarily.

## Testing

After downloading, test sounds by opening `public/sounds/test.html` in your browser (if you create it using the example in SOUNDS.md).

## File Size

Keep total directory under 1 MB:
- Short sounds (click, beep): < 20 KB
- Medium sounds (ding, buzz): 20-50 KB
- Long sounds (fanfare): 100-200 KB

## Troubleshooting

**Sounds not loading?**
1. Check file names match exactly (case-sensitive)
2. Ensure files are in MP3 format
3. Verify files are in `public/sounds/` directory
4. Check browser console for errors

**How to convert to MP3?**
Use [CloudConvert](https://cloudconvert.com/wav-to-mp3) or FFmpeg:
```bash
ffmpeg -i input.wav -codec:a libmp3lame -q:a 2 output.mp3
```

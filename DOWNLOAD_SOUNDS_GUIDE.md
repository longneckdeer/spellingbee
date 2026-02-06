# Sound Effects Download Guide

## Quick Download Options

### Option 1: Automated Browser Helper (Easiest)
```bash
./scripts/download-sounds.sh
```
This will open browser tabs for each sound you need.

### Option 2: Manual Download (Recommended)

Download from these **free, no-attribution** sources:

---

## 📥 Specific Sound Recommendations

### 1. Key Press Sound (`key-press.mp3`)

**Source: Freesound.org**
- **URL**: [Key Press - unfa](https://freesound.org/people/unfa/sounds/245645/)
- **License**: Creative Commons 0 (Public Domain)
- **Instructions**:
  1. Click Download
  2. Save as `key-press.mp3` to `public/sounds/`

**Alternative: Pixabay**
- Visit: [Keyboard Click Sounds](https://pixabay.com/sound-effects/search/keyboard%20click/)
- Choose any short click sound
- Download and save as `key-press.mp3`

---

### 2. Submit Sound (`submit.mp3`)

**Source: Orange Free Sounds**
- **Search**: "swoosh" or "whoosh"
- **URL**: [Pixabay Whoosh](https://pixabay.com/sound-effects/search/whoosh/)
- **Instructions**: Pick any short whoosh/swoosh sound (0.3-0.5s)

---

### 3. Correct Answer (`correct.mp3`)

**Source: Orange Free Sounds** ⭐ Recommended
- **Direct Page**: [Correct Answer Ding](https://orangefreesounds.com/correct-answer-ding-sound-effect/)
- **License**: Free for commercial use
- **Instructions**:
  1. Click the download button
  2. Save as `correct.mp3` to `public/sounds/`

**Alternative: Pixabay**
- Visit: [Answer Sounds](https://pixabay.com/sound-effects/search/answer/)
- Look for "correct answer ding"

---

### 4. Wrong Answer (`wrong.mp3`)

**Source: Pixabay**
- **URL**: [Wrong Answer Sounds](https://pixabay.com/sound-effects/search/wrong%20answer/)
- **Recommendation**: Choose a SOFT, neutral buzz (not harsh)
- **Instructions**: Download and save as `wrong.mp3`

---

### 5. First Place Victory (`first-place.mp3`)

**Source: Pixabay**
- **URL**: [Victory Fanfare](https://pixabay.com/sound-effects/search/victory%20fanfare/)
- **Recommendation**: Epic, triumphant sound (2-4 seconds)
- **Instructions**: Download and save as `first-place.mp3`

---

### 6. Second Place (`second-place.mp3`)

**Source: Pixabay**
- **URL**: [Applause Sounds](https://pixabay.com/sound-effects/search/applause/)
- **Recommendation**: Short applause (2-3 seconds)
- **Instructions**: Download and save as `second-place.mp3`

---

### 7. Third Place (`third-place.mp3`)

**Source: Pixabay**
- **URL**: [Congratulations Sounds](https://pixabay.com/sound-effects/search/congratulations/)
- **Recommendation**: Positive chime/jingle (1-2 seconds)
- **Instructions**: Download and save as `third-place.mp3`

---

### 8. Participation (`participation.mp3`)

**Source: Pixabay**
- **URL**: [Notification Sounds](https://pixabay.com/sound-effects/search/notification/)
- **Recommendation**: Gentle, neutral bell/tone (0.5-1 second)
- **Instructions**: Download and save as `participation.mp3`

---

### 9. Join Sound (`join.mp3`)

**Source: Pixabay**
- **URL**: [Door Open Sounds](https://pixabay.com/sound-effects/search/door%20open/)
- **Recommendation**: Light, friendly sound
- **Instructions**: Download and save as `join.mp3`

---

### 10. Leave Sound (`leave.mp3`)

**Source: Pixabay**
- **URL**: [Door Close Sounds](https://pixabay.com/sound-effects/search/door%20close/)
- **Recommendation**: Soft close sound
- **Instructions**: Download and save as `leave.mp3`

---

### 11. Countdown (`countdown.mp3`)

**Source: Pixabay**
- **URL**: [Clock Tick Sounds](https://pixabay.com/sound-effects/search/clock%20tick/)
- **Recommendation**: Simple tick sound (0.1-0.2 seconds)
- **Instructions**: Download and save as `countdown.mp3`

---

## 🎯 Quick Download Checklist

- [ ] `key-press.mp3` - Keyboard click
- [ ] `submit.mp3` - Whoosh/swoosh
- [ ] `correct.mp3` - Pleasant ding ⭐
- [ ] `wrong.mp3` - Soft buzz
- [ ] `first-place.mp3` - Epic fanfare
- [ ] `second-place.mp3` - Applause
- [ ] `third-place.mp3` - Congratulations
- [ ] `participation.mp3` - Neutral tone
- [ ] `join.mp3` - Door open
- [ ] `leave.mp3` - Door close
- [ ] `countdown.mp3` - Clock tick

---

## 📝 Download Instructions (Pixabay)

1. Click the URL for the sound you want
2. Browse the search results
3. **Click on a sound** to preview it
4. Click the **Download** button (usually green)
5. Save the file with the correct name to `public/sounds/`
6. Repeat for all 11 sounds

---

## ⚡ Alternative: Use Placeholder Sounds

If you want to test the system first, you can create silent placeholder files:

```bash
cd public/sounds

# Create 1-second silent MP3 files (requires ffmpeg)
for file in key-press submit correct wrong first-place second-place third-place participation join leave countdown; do
  ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -q:a 9 -acodec libmp3lame ${file}.mp3
done
```

This creates silent files so you can test the integration, then replace them with real sounds later.

---

## ✅ After Downloading

Run the checker to verify:
```bash
./scripts/check-sounds.sh
```

You should see:
```
🎉 All sound files are present!
Total size: [your size]
✅ Sound effects setup complete!
```

---

## 🎨 Recommended Sound Characteristics

| Sound | Duration | Type | Volume Feel |
|-------|----------|------|-------------|
| key-press | 0.1-0.2s | Click | Sharp, crisp |
| submit | 0.3-0.5s | Whoosh | Smooth |
| correct | 0.5-1.0s | Ding/Chime | Pleasant, bright |
| wrong | 0.5-0.8s | Buzz | Neutral, not harsh |
| first-place | 2-4s | Fanfare | Epic, triumphant |
| second-place | 2-3s | Applause | Warm, positive |
| third-place | 1-2s | Jingle | Cheerful |
| participation | 0.5-1s | Tone | Gentle, neutral |
| join | 0.5-1s | Door/Bell | Light, friendly |
| leave | 0.5-1s | Door/Bell | Soft |
| countdown | 0.1-0.2s | Tick | Simple, clean |

**Total recommended size**: < 1 MB

---

## 🔗 Source Links

- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) - Free, no attribution
- [Orange Free Sounds](https://orangefreesounds.com/) - Free for commercial use
- [Freesound.org](https://freesound.org/) - Creative Commons licensed
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free, no attribution
- [Uppbeat SFX](https://uppbeat.io/sfx/) - Free with account

---

## 💡 Tips

1. **Preview before downloading** - Listen to each sound first
2. **Keep it consistent** - Choose sounds that feel like they belong together
3. **Not too loud** - Pick subtle sounds that won't be annoying on repeat
4. **Short is better** - Especially for key-press and submit sounds
5. **Test in-game** - Some sounds that work alone might be too loud/soft in context

---

## 🆘 Need Help?

If you have trouble finding good sounds, here are some search tips:

**For Pixabay:**
1. Use specific keywords from the URLs above
2. Sort by "Popular" to find best quality
3. Preview multiple options before choosing
4. Download MP3 format (not WAV)

**For Freesound:**
1. Create a free account (if needed)
2. Check the Creative Commons license
3. Download highest quality version
4. Convert to MP3 if needed (using CloudConvert)

---

## 🎉 Ready to Play!

Once all files are downloaded and the checker passes:
```bash
npm run dev
```

Your game will have full sound effects! 🎵

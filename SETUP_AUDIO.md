# Quick Setup: Audio Generation

## Step 1: Google Cloud Setup (5 minutes)

### Create Service Account & Credentials

1. **Go to Google Cloud Console**:
   https://console.cloud.google.com/

2. **Create/Select Project**:
   - Click project dropdown at top
   - "New Project" → Name: "spelling-bee"
   - Wait ~30 seconds for creation

3. **Enable Text-to-Speech API**:
   - Go to: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
   - Click "Enable"
   - Wait 1-2 minutes

4. **Create Service Account**:
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - "Create Service Account"
   - Name: `spelling-bee-tts`
   - Click "Create and Continue"
   - Role: Select "Cloud Text-to-Speech Client"
   - Click "Done"

5. **Download Credentials**:
   - Click on the service account you just created
   - Go to "Keys" tab
   - "Add Key" → "Create new key" → JSON
   - Save file to: `~/google-cloud-credentials.json`

6. **Set Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/google-cloud-credentials.json"
   ```

   **Make it permanent** (add to shell config):
   ```bash
   echo 'export GOOGLE_APPLICATION_CREDENTIALS="$HOME/google-cloud-credentials.json"' >> ~/.zshrc
   source ~/.zshrc
   ```

---

## Step 2: Generate Audio Files

### Run the Script
```bash
cd "/Users/jeffkuo/My Drive/AIProjects/spellingbee/src/gameTypes/english-spelling/data"
python3 generate_audio.py
```

### What to Expect
- **Duration**: ~35-45 minutes for all 4,622 words
- **Output**: ~18,488 MP3 files in `audio/` directory
- **Cost**: FREE (under 1M characters/month free tier)
- **Progress**: Updates every 10 words

### Sample Output
```
==============================================================
Google Cloud TTS Audio Generation
==============================================================

✓ Google Cloud TTS client initialized

Loaded 4622 unique words from 5 files
Output directory: .../data/audio
Voice: en-US-Neural2-J

Generating audio files...
--------------------------------------------------------------
[10/4622] beautiful      | 4 files | 2.1 words/sec | ETA: 36.5 min
[20/4622] elephant       | 4 files | 2.3 words/sec | ETA: 33.2 min
...
```

---

## Step 3: Verify Audio Quality

### Quick Test
After generation completes, test a few files:

```bash
# Test elementary word
open "audio/beautiful/beautiful_word.mp3"

# Test expert word
open "audio/paradox/paradox_word.mp3"

# Test sentence
open "audio/beautiful/beautiful_sentence.mp3"
```

Listen for:
- ✓ Clear pronunciation
- ✓ Slow speed for word files (0.6x)
- ✓ Normal speed for sentences (0.85x)
- ✓ Natural-sounding voice

---

## Step 4: Integration (After Audio Generation)

### Move Files to Public Directory
```bash
cd "/Users/jeffkuo/My Drive/AIProjects/spellingbee"
mkdir -p public/audio
cp -r "src/gameTypes/english-spelling/data/audio/"* public/audio/
```

### Update SpellingArea.vue
Replace Web Speech API calls with MP3 playback (I'll help with this after audio is generated).

---

## Troubleshooting

### "Could not load credentials"
```bash
# Verify environment variable is set
echo $GOOGLE_APPLICATION_CREDENTIALS

# Should output: /Users/jeffkuo/google-cloud-credentials.json

# If empty, re-export
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/google-cloud-credentials.json"
```

### "API not enabled"
1. Wait 2-3 minutes after enabling API
2. Verify at: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
3. Should show "API enabled" with green checkmark

### "Permission denied"
1. Check service account has "Cloud Text-to-Speech Client" role
2. Re-download credentials JSON
3. Update GOOGLE_APPLICATION_CREDENTIALS path

---

## Cost Information

### Free Tier (Sufficient for This Project)
- **Limit**: 1 million characters/month
- **Our usage**: ~510,000 characters (one-time)
- **Cost**: **$0.00**

### If Over Free Tier
- **Neural2 voices**: $16 per 1 million characters
- **Our cost**: ~$8.16 (one-time, if not on free tier)

---

## Ready to Start?

Run this command when ready:
```bash
cd "/Users/jeffkuo/My Drive/AIProjects/spellingbee/src/gameTypes/english-spelling/data" && python3 generate_audio.py
```

**Estimated time**: 35-45 minutes
**Grab a coffee and let it run!** ☕

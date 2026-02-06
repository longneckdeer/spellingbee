#!/bin/bash

# Sound Effects Download Helper
# Opens browser tabs for downloading each required sound effect

echo "🎵 Sound Effects Download Helper"
echo "================================"
echo ""
echo "This script will open browser tabs for each sound you need to download."
echo "Download the MP3 files and save them to: public/sounds/"
echo ""
read -p "Press Enter to continue..."
echo ""

# Function to open URL and wait
open_and_wait() {
  local name=$1
  local url=$2
  local filename=$3

  echo "Opening: $name"
  echo "   Save as: $filename"
  open "$url"
  echo "   Waiting 3 seconds..."
  sleep 3
}

echo "📥 Opening download pages..."
echo ""

# 1. Key Press (Freesound - Creative Commons)
open_and_wait "Key Press Sound" \
  "https://freesound.org/people/unfa/sounds/245645/" \
  "key-press.mp3"

# 2. Submit/Whoosh
open_and_wait "Submit Whoosh Sound" \
  "https://pixabay.com/sound-effects/search/whoosh/" \
  "submit.mp3"

# 3. Correct Answer Ding
open_and_wait "Correct Answer Ding" \
  "https://orangefreesounds.com/correct-answer-ding-sound-effect/" \
  "correct.mp3"

# 4. Wrong Answer Buzz
open_and_wait "Wrong Answer Buzz" \
  "https://pixabay.com/sound-effects/search/wrong%20answer/" \
  "wrong.mp3"

# 5. First Place Victory
open_and_wait "Victory Fanfare (1st Place)" \
  "https://pixabay.com/sound-effects/search/victory%20fanfare/" \
  "first-place.mp3"

# 6. Second Place Applause
open_and_wait "Applause (2nd Place)" \
  "https://pixabay.com/sound-effects/search/applause/" \
  "second-place.mp3"

# 7. Third Place Congratulations
open_and_wait "Congratulations (3rd Place)" \
  "https://pixabay.com/sound-effects/search/congratulations/" \
  "third-place.mp3"

# 8. Participation
open_and_wait "Participation Tone" \
  "https://pixabay.com/sound-effects/search/notification/" \
  "participation.mp3"

# 9. Join Sound
open_and_wait "Player Join Sound" \
  "https://pixabay.com/sound-effects/search/door%20open/" \
  "join.mp3"

# 10. Leave Sound
open_and_wait "Player Leave Sound" \
  "https://pixabay.com/sound-effects/search/door%20close/" \
  "leave.mp3"

# 11. Countdown
open_and_wait "Countdown Tick" \
  "https://pixabay.com/sound-effects/search/clock%20tick/" \
  "countdown.mp3"

echo ""
echo "✅ All download pages opened!"
echo ""
echo "Next steps:"
echo "  1. Download each sound from the tabs"
echo "  2. Save them to: public/sounds/"
echo "  3. Rename to match the filenames shown above"
echo "  4. Run: ./scripts/check-sounds.sh"
echo ""

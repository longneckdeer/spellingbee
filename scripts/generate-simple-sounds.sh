#!/bin/bash

# Generate simple placeholder sounds using ffmpeg
# Install ffmpeg first: brew install ffmpeg

SOUNDS_DIR="public/sounds"

echo "🎵 Generating simple placeholder sounds..."
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed"
    echo ""
    echo "Install it with:"
    echo "  brew install ffmpeg"
    echo ""
    exit 1
fi

cd "$SOUNDS_DIR"

# 1. Key press - short click (100ms, 800Hz)
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.1" -af "volume=0.3" -y key-press.mp3 -loglevel quiet
echo "✓ key-press.mp3"

# 2. Submit - swoosh (300ms, sweep)
ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.3" -af "afade=t=out:st=0.2:d=0.1,volume=0.3" -y submit.mp3 -loglevel quiet
echo "✓ submit.mp3"

# 3. Correct - pleasant ding (500ms, chord)
ffmpeg -f lavfi -i "sine=frequency=523:duration=0.5" -af "volume=0.4" -y correct.mp3 -loglevel quiet
echo "✓ correct.mp3"

# 4. Wrong - buzz (400ms, low tone)
ffmpeg -f lavfi -i "sine=frequency=200:duration=0.4" -af "volume=0.3" -y wrong.mp3 -loglevel quiet
echo "✓ wrong.mp3"

# 5. First place - fanfare (2s, ascending tones)
ffmpeg -f lavfi -i "sine=frequency=523:duration=2" -af "volume=0.5" -y first-place.mp3 -loglevel quiet
echo "✓ first-place.mp3"

# 6. Second place - applause (2s, noise)
ffmpeg -f lavfi -i "anoisesrc=d=2:c=pink:r=44100" -af "volume=0.2" -y second-place.mp3 -loglevel quiet
echo "✓ second-place.mp3"

# 7. Third place - chime (1s, high tone)
ffmpeg -f lavfi -i "sine=frequency=880:duration=1" -af "volume=0.4" -y third-place.mp3 -loglevel quiet
echo "✓ third-place.mp3"

# 8. Participation - gentle tone (1s)
ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -af "volume=0.2" -y participation.mp3 -loglevel quiet
echo "✓ participation.mp3"

# 9. Join - rising tone (500ms)
ffmpeg -f lavfi -i "sine=frequency=440:duration=0.5" -af "afade=t=in:d=0.1,volume=0.3" -y join.mp3 -loglevel quiet
echo "✓ join.mp3"

# 10. Leave - falling tone (500ms)
ffmpeg -f lavfi -i "sine=frequency=440:duration=0.5" -af "afade=t=out:d=0.3,volume=0.3" -y leave.mp3 -loglevel quiet
echo "✓ leave.mp3"

# 11. Countdown - tick (100ms)
ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.1" -af "volume=0.3" -y countdown.mp3 -loglevel quiet
echo "✓ countdown.mp3"

echo ""
echo "✅ All sounds generated!"
echo ""
echo "These are simple placeholder sounds. For better quality:"
echo "  - Download from Pixabay: https://pixabay.com/sound-effects/"
echo "  - Or run: ./scripts/download-sounds.sh (opens browser tabs)"
echo ""

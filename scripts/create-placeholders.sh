#!/bin/bash

# Create placeholder sound files for testing
# These are just empty files - replace with real MP3s from Pixabay

echo "🔇 Creating placeholder sound files..."
echo ""
echo "NOTE: These are EMPTY placeholder files for testing structure only."
echo "Replace with real MP3 files from Pixabay for actual sound effects."
echo ""

SOUNDS_DIR="public/sounds"

# Create directory if it doesn't exist
mkdir -p "$SOUNDS_DIR"

# Create empty placeholder files
FILES=(
  "key-press.mp3"
  "submit.mp3"
  "correct.mp3"
  "wrong.mp3"
  "first-place.mp3"
  "second-place.mp3"
  "third-place.mp3"
  "participation.mp3"
  "join.mp3"
  "leave.mp3"
  "countdown.mp3"
)

echo "Creating placeholder files in $SOUNDS_DIR/..."
echo ""

for file in "${FILES[@]}"; do
  touch "$SOUNDS_DIR/$file"
  echo "✅ Created: $file (placeholder)"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: These are EMPTY files!"
echo ""
echo "The app structure will work, but no sounds will play."
echo "To get real sound effects:"
echo ""
echo "  1. Delete these placeholder files"
echo "  2. Run: ./scripts/download-sounds.sh"
echo "  3. Or see: DOWNLOAD_SOUNDS_GUIDE.md"
echo ""
echo "All sounds are free from Pixabay (no attribution needed)"
echo ""

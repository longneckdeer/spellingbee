#!/bin/bash

# Sound Effects Setup Checker
# Checks if all required sound files are present

echo "🔊 Checking Sound Effects Setup..."
echo ""

SOUNDS_DIR="public/sounds"
MISSING_FILES=()
FOUND_FILES=()

# Required sound files
REQUIRED_SOUNDS=(
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

# Check if sounds directory exists
if [ ! -d "$SOUNDS_DIR" ]; then
  echo "❌ Directory $SOUNDS_DIR does not exist"
  echo "   Creating directory..."
  mkdir -p "$SOUNDS_DIR"
  echo "✅ Directory created: $SOUNDS_DIR"
  echo ""
fi

# Check each required file
echo "Checking for required sound files..."
echo ""

for sound in "${REQUIRED_SOUNDS[@]}"; do
  if [ -f "$SOUNDS_DIR/$sound" ]; then
    SIZE=$(du -h "$SOUNDS_DIR/$sound" | cut -f1)
    echo "✅ $sound ($SIZE)"
    FOUND_FILES+=("$sound")
  else
    echo "❌ $sound (missing)"
    MISSING_FILES+=("$sound")
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
TOTAL=${#REQUIRED_SOUNDS[@]}
FOUND=${#FOUND_FILES[@]}
MISSING=${#MISSING_FILES[@]}

echo "Summary:"
echo "  Total required: $TOTAL"
echo "  Found: $FOUND ✅"
echo "  Missing: $MISSING ❌"
echo ""

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo "🎉 All sound files are present!"
  echo ""

  # Calculate total size
  TOTAL_SIZE=$(du -sh "$SOUNDS_DIR" | cut -f1)
  echo "Total size: $TOTAL_SIZE"
  echo ""

  echo "✅ Sound effects setup complete!"
  echo "   Run your app to test the sounds."
else
  echo "📥 Missing files:"
  for sound in "${MISSING_FILES[@]}"; do
    echo "   - $sound"
  done
  echo ""
  echo "To download sound files:"
  echo "  1. Visit https://pixabay.com/sound-effects/"
  echo "  2. See SOUNDS.md for search keywords"
  echo "  3. Download and place in $SOUNDS_DIR/"
  echo ""
  echo "Or run: open https://pixabay.com/sound-effects/"
fi

echo ""

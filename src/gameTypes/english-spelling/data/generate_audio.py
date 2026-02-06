#!/usr/bin/env python3
"""
Generate offline MP3 audio files for all dictionary words using Google Cloud TTS API.

Prerequisites:
1. Install: pip install google-cloud-texttospeech
2. Set up Google Cloud project with TTS API enabled
3. Create service account and download credentials JSON
4. Set environment variable: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"

Usage:
    python generate_audio.py
"""

import json
import os
import time
from pathlib import Path
from google.cloud import texttospeech

# Configuration
AUDIO_OUTPUT_DIR = Path(__file__).parent / "audio"
DICTIONARY_FILES = [
    "elementary.json",
    "middle.json",
    "high.json",
    "university.json",
    "expert.json"
]

# Voice configuration
VOICE_NAME = "en-US-Neural2-J"  # High-quality female voice
LANGUAGE_CODE = "en-US"

# Speaking rates (same as Web Speech API config)
RATES = {
    "word": 0.6,        # Slow for spelling
    "sentence": 0.85,   # Normal for context
    "definition": 0.85, # Normal for meaning
    "pos": 0.9          # Normal for part of speech
}

# Part of speech mapping (Chinese to English)
POS_MAP = {
    '名詞': 'noun',
    '動詞': 'verb',
    '形容詞': 'adjective',
    '副詞': 'adverb',
    '介詞': 'preposition',
    '連詞': 'conjunction',
    '代詞': 'pronoun',
    '感嘆詞': 'interjection'
}


def setup_client():
    """Initialize Google Cloud TTS client."""
    try:
        client = texttospeech.TextToSpeechClient()
        print("✓ Google Cloud TTS client initialized")
        return client
    except Exception as e:
        print(f"✗ Error initializing TTS client: {e}")
        print("\nMake sure you have:")
        print("1. Installed: pip install google-cloud-texttospeech")
        print("2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable")
        print("3. Enabled Cloud Text-to-Speech API in your Google Cloud project")
        exit(1)


def synthesize_speech(client, text, output_path, speaking_rate=1.0):
    """
    Synthesize speech and save to MP3 file.

    Args:
        client: Google Cloud TTS client
        text: Text to synthesize
        output_path: Path to save MP3 file
        speaking_rate: Speech speed (0.25 to 4.0)
    """
    # Skip if file already exists
    if output_path.exists():
        return True

    try:
        # Build synthesis input
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Configure voice
        voice = texttospeech.VoiceSelectionParams(
            language_code=LANGUAGE_CODE,
            name=VOICE_NAME
        )

        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
            pitch=0.0,
            volume_gain_db=0.0
        )

        # Perform synthesis
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        # Save to file
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as out:
            out.write(response.audio_content)

        return True

    except Exception as e:
        print(f"  ✗ Error synthesizing '{text[:30]}...': {e}")
        return False


def generate_word_audio(client, word_obj, word_dir):
    """
    Generate all audio files for a single word.

    Args:
        client: Google Cloud TTS client
        word_obj: Word dictionary object
        word_dir: Directory to save audio files

    Returns:
        Number of files successfully generated
    """
    word = word_obj['word']
    success_count = 0

    # 1. Word (slow speed)
    word_path = word_dir / f"{word}_word.mp3"
    if synthesize_speech(client, word, word_path, RATES['word']):
        success_count += 1

    # 2. Sentence
    if word_obj.get('sentence'):
        sentence_path = word_dir / f"{word}_sentence.mp3"
        if synthesize_speech(client, word_obj['sentence'], sentence_path, RATES['sentence']):
            success_count += 1

    # 3. Part of speech (English)
    if word_obj.get('partOfSpeech'):
        pos_chinese = word_obj['partOfSpeech']
        pos_english = POS_MAP.get(pos_chinese, pos_chinese)
        pos_path = word_dir / f"{word}_pos.mp3"
        if synthesize_speech(client, pos_english, pos_path, RATES['pos']):
            success_count += 1

    # 4. Definition (if in English)
    if word_obj.get('definition'):
        definition = word_obj['definition']
        # Only generate audio if definition is in English (not Chinese)
        if definition and not any('\u4e00' <= c <= '\u9fff' for c in definition):
            def_path = word_dir / f"{word}_definition.mp3"
            if synthesize_speech(client, definition, def_path, RATES['definition']):
                success_count += 1

    return success_count


def load_dictionary_words():
    """Load all words from dictionary files."""
    all_words = []
    script_dir = Path(__file__).parent

    for filename in DICTIONARY_FILES:
        filepath = script_dir / filename
        if not filepath.exists():
            print(f"Warning: {filename} not found, skipping")
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            words = json.load(f)
            for word_obj in words:
                word_obj['source_file'] = filename
            all_words.extend(words)

    # Remove duplicates (keep first occurrence)
    seen = set()
    unique_words = []
    for word_obj in all_words:
        word = word_obj['word'].lower()
        if word not in seen:
            seen.add(word)
            unique_words.append(word_obj)

    return unique_words


def main():
    """Main execution function."""
    print("=" * 60)
    print("Google Cloud TTS Audio Generation")
    print("=" * 60)
    print()

    # Setup
    client = setup_client()
    words = load_dictionary_words()

    print(f"\nLoaded {len(words)} unique words from {len(DICTIONARY_FILES)} files")
    print(f"Output directory: {AUDIO_OUTPUT_DIR}")
    print(f"Voice: {VOICE_NAME}")
    print()

    # Create output directory
    AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate audio for each word
    total_files = 0
    total_words = len(words)
    start_time = time.time()

    print("Generating audio files...")
    print("-" * 60)

    for i, word_obj in enumerate(words, 1):
        word = word_obj['word']

        # Create subdirectory for this word
        word_dir = AUDIO_OUTPUT_DIR / word.lower()

        # Generate audio files
        files_generated = generate_word_audio(client, word_obj, word_dir)
        total_files += files_generated

        # Progress indicator
        if i % 10 == 0 or i == total_words:
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 0
            remaining = (total_words - i) / rate if rate > 0 else 0

            print(f"[{i}/{total_words}] {word:20s} | "
                  f"{files_generated} files | "
                  f"{rate:.1f} words/sec | "
                  f"ETA: {remaining/60:.1f} min")

        # Rate limiting (stay under API quota)
        # Free tier: 1 million characters/month, 100 requests/min
        if i % 50 == 0:
            time.sleep(1)  # Brief pause every 50 words

    # Summary
    elapsed = time.time() - start_time
    print()
    print("=" * 60)
    print("Generation Complete!")
    print("=" * 60)
    print(f"Words processed: {total_words}")
    print(f"Audio files generated: {total_files}")
    print(f"Time elapsed: {elapsed/60:.1f} minutes")
    print(f"Average: {total_files/total_words:.1f} files per word")
    print(f"Output location: {AUDIO_OUTPUT_DIR.absolute()}")
    print()
    print("Next steps:")
    print("1. Update Vue components to use MP3 files instead of Web Speech API")
    print("2. Copy audio files to public/audio/ for web serving")
    print("3. Update SpellingArea.vue to load and play MP3s")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Check for audio filename mismatches, focusing on high-risk words.
High-risk = long words (8+ chars) or words with prefixes/suffixes that MW typically shortens.
"""

import json
import os
import requests
import time
from pathlib import Path

# Merriam-Webster API key (Collegiate Dictionary)
MW_API_KEY = 'cfc2a612-6202-4231-a810-d613df83c908'
MW_API_URL = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json'

# Paths
SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR.parent.parent.parent.parent / 'public' / 'audio'
DICT_FILES = [
    SCRIPT_DIR / 'elementary.json',
    SCRIPT_DIR / 'middle.json',
    SCRIPT_DIR / 'high.json',
    SCRIPT_DIR / 'university.json',
    SCRIPT_DIR / 'expert.json'
]

# Patterns that indicate MW likely uses shortened filename
HIGH_RISK_PATTERNS = [
    'tion', 'sion', 'ation', 'ition',  # Suffixes
    're', 'pre', 'un', 'dis', 'de',     # Prefixes
]

def is_high_risk(word):
    """Check if word is likely to have MW shortened filename."""
    # Long words (8+ characters)
    if len(word) >= 8:
        return True

    # Words with common prefixes/suffixes
    for pattern in HIGH_RISK_PATTERNS:
        if pattern in word:
            return True

    return False

def get_mw_audio_filename(word):
    """Fetch expected audio filename from MW API."""
    try:
        url = f"{MW_API_URL}/{word}"
        params = {'key': MW_API_KEY}
        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return None

        data = response.json()

        if not data or not isinstance(data, list):
            return None

        entry = data[0]
        if not isinstance(entry, dict):
            return None

        hwi = entry.get('hwi', {})
        prs = hwi.get('prs', [])

        if not prs or not isinstance(prs, list):
            return None

        sound = prs[0].get('sound', {})
        audio = sound.get('audio', '')

        if not audio:
            return None

        return audio

    except Exception as e:
        print(f"  Error fetching MW data for '{word}': {e}")
        return None

def main():
    print("Checking high-risk audio filename mismatches...\n")

    mismatches = []
    checked = 0
    skipped = 0

    # Collect high-risk words
    high_risk_words = []
    for dict_file in DICT_FILES:
        if not dict_file.exists():
            print(f"Warning: {dict_file} not found")
            continue

        with open(dict_file, 'r', encoding='utf-8') as f:
            words = json.load(f)
            for word_data in words:
                word = word_data['word']
                local_path = AUDIO_DIR / f"{word}.mp3"

                # Skip if no audio file
                if not local_path.exists():
                    continue

                # Only check high-risk words
                if is_high_risk(word):
                    high_risk_words.append({
                        'word': word,
                        'file': dict_file.name
                    })
                else:
                    skipped += 1

    print(f"High-risk words to check: {len(high_risk_words)}")
    print(f"Low-risk words skipped: {skipped}\n")

    for item in high_risk_words:
        word = item['word']
        local_filename = f"{word}.mp3"

        # Get expected filename from MW
        mw_filename = get_mw_audio_filename(word)

        if mw_filename:
            expected_filename = f"{mw_filename}.mp3"

            # Check if filenames match
            if local_filename != expected_filename:
                mismatches.append({
                    'word': word,
                    'dict_file': item['file'],
                    'local': local_filename,
                    'expected': expected_filename
                })
                print(f"MISMATCH: {word}")
                print(f"  Local:    {local_filename}")
                print(f"  Expected: {expected_filename}")
                print(f"  File:     {item['file']}\n")

        checked += 1

        # Rate limit: ~10 requests per second
        if checked % 10 == 0:
            time.sleep(1)
            print(f"Progress: {checked}/{len(high_risk_words)} words checked...")

    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"High-risk words checked: {checked}")
    print(f"Low-risk words skipped: {skipped}")
    print(f"Mismatches found: {len(mismatches)}")

    if mismatches:
        print(f"\n{'='*60}")
        print("MISMATCHED WORDS:")
        for m in mismatches:
            print(f"  {m['word']}: {m['local']} → {m['expected']} ({m['dict_file']})")

    # Save results
    output_file = SCRIPT_DIR / 'audio_mismatches.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(mismatches, f, indent=2, ensure_ascii=False)

    print(f"\nResults saved to: {output_file}")

if __name__ == '__main__':
    main()

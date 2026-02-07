#!/usr/bin/env python3
"""
Check for audio mismatches in specific high-risk patterns based on previous fixes.
Focus on: words ending in -tion, words starting with re-/pre-/de-, and long words (10+ chars).
"""

import json
import os
import requests
import time
from pathlib import Path

MW_API_KEY = 'cfc2a612-6202-4231-a810-d613df83c908'
MW_API_URL = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json'

SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR.parent.parent.parent.parent / 'public' / 'audio'
DICT_FILES = [
    SCRIPT_DIR / 'elementary.json',
    SCRIPT_DIR / 'middle.json',
    SCRIPT_DIR / 'high.json',
    SCRIPT_DIR / 'university.json',
    SCRIPT_DIR / 'expert.json'
]

# Very specific high-risk patterns
VERY_HIGH_RISK_PATTERNS = [
    ('ends_with_tion_and_prefix', lambda w: w.endswith('tion') and any(w.startswith(p) for p in ['re', 'pre', 'de', 'con', 'pro', 'in', 'dis'])),
    ('very_long', lambda w: len(w) >= 12),
    ('re_prefix_long', lambda w: w.startswith('re') and len(w) >= 9),
]

def is_very_high_risk(word):
    """Check if word matches very specific high-risk patterns."""
    for pattern_name, check_func in VERY_HIGH_RISK_PATTERNS:
        if check_func(word):
            return True, pattern_name
    return False, None

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

        return audio if audio else None

    except Exception as e:
        return None

def main():
    print("Checking VERY high-risk audio filename mismatches...\n")

    mismatches = []
    checked = 0

    # Collect very high-risk words
    target_words = []
    for dict_file in DICT_FILES:
        if not dict_file.exists():
            continue

        with open(dict_file, 'r', encoding='utf-8') as f:
            words = json.load(f)
            for word_data in words:
                word = word_data['word']
                local_path = AUDIO_DIR / f"{word}.mp3"

                if not local_path.exists():
                    continue

                is_risky, pattern = is_very_high_risk(word)
                if is_risky:
                    target_words.append({
                        'word': word,
                        'file': dict_file.name,
                        'pattern': pattern
                    })

    print(f"Very high-risk words to check: {len(target_words)}\n")
    print("Starting checks...\n")

    for item in target_words:
        word = item['word']
        local_filename = f"{word}.mp3"

        # Get expected filename from MW
        mw_filename = get_mw_audio_filename(word)

        if mw_filename:
            expected_filename = f"{mw_filename}.mp3"

            if local_filename != expected_filename:
                mismatches.append({
                    'word': word,
                    'dict_file': item['file'],
                    'pattern': item['pattern'],
                    'local': local_filename,
                    'expected': expected_filename
                })
                print(f"MISMATCH: {word} (pattern: {item['pattern']})")
                print(f"  Local:    {local_filename}")
                print(f"  Expected: {expected_filename}\n")

        checked += 1

        if checked % 10 == 0:
            time.sleep(1)  # Rate limit
            print(f"Progress: {checked}/{len(target_words)}...")

    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"Words checked: {checked}")
    print(f"Mismatches found: {len(mismatches)}")

    if mismatches:
        print(f"\n{'='*60}")
        print("MISMATCHED WORDS:")
        for m in mismatches:
            print(f"  {m['word']}: {m['local']} → {m['expected']}")

        # Group by pattern
        by_pattern = {}
        for m in mismatches:
            pattern = m['pattern']
            if pattern not in by_pattern:
                by_pattern[pattern] = []
            by_pattern[pattern].append(m['word'])

        print(f"\nBy pattern:")
        for pattern, words in by_pattern.items():
            print(f"  {pattern}: {len(words)} words")

    # Save results
    output_file = SCRIPT_DIR / 'audio_mismatches_targeted.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(mismatches, f, indent=2, ensure_ascii=False)

    print(f"\nResults saved to: {output_file}")

if __name__ == '__main__':
    main()

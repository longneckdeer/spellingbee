#!/usr/bin/env python3
"""
Download missing audio files from Merriam-Webster API.
"""

import json
import os
import requests
import time
from pathlib import Path

# Merriam-Webster API key (Collegiate Dictionary)
MW_API_KEY = 'cfc2a612-6202-4231-a810-d613df83c908'
MW_API_URL = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json'
MW_AUDIO_BASE = 'https://media.merriam-webster.com/audio/prons/en/us/mp3'

# Paths
SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = Path('/Users/jeffkuo/My Drive/AIProjects/spellingbee/public/audio')
DICT_FILES = [
    SCRIPT_DIR / 'elementary.json',
    SCRIPT_DIR / 'middle.json',
    SCRIPT_DIR / 'high.json',
    SCRIPT_DIR / 'university.json',
    SCRIPT_DIR / 'expert.json'
]

def get_audio_subdirectory(filename):
    """Get the subdirectory for MW audio files based on filename."""
    if filename.startswith('bix'):
        return 'bix'
    elif filename.startswith('gg'):
        return 'gg'
    elif filename[0].isdigit():
        return 'number'
    else:
        return filename[0]

def get_mw_audio_url(word):
    """Fetch audio URL from MW API."""
    try:
        url = f"{MW_API_URL}/{word}"
        params = {'key': MW_API_KEY}
        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return None, f"API error: {response.status_code}"

        data = response.json()

        if not data or not isinstance(data, list):
            return None, "No data returned"

        # Check if it's a suggestion list (when word not found)
        if isinstance(data[0], str):
            return None, f"Word not found, suggestions: {', '.join(data[:3])}"

        entry = data[0]
        if not isinstance(entry, dict):
            return None, "Invalid entry format"

        # Navigate to audio filename
        hwi = entry.get('hwi', {})
        prs = hwi.get('prs', [])

        if not prs or not isinstance(prs, list):
            return None, "No pronunciation data"

        sound = prs[0].get('sound', {})
        audio_filename = sound.get('audio', '')

        if not audio_filename:
            return None, "No audio filename"

        # Construct full URL
        subdir = get_audio_subdirectory(audio_filename)
        audio_url = f"{MW_AUDIO_BASE}/{subdir}/{audio_filename}.mp3"

        return audio_url, None

    except Exception as e:
        return None, f"Exception: {str(e)}"

def download_audio(word, url, output_path):
    """Download audio file from URL."""
    try:
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return True, None
        else:
            return False, f"Download failed: {response.status_code}"
    except Exception as e:
        return False, f"Download exception: {str(e)}"

def main():
    print("Finding missing audio files...\n")

    # Get list of existing audio files
    existing_audio = {f.stem for f in AUDIO_DIR.glob('*.mp3')}
    print(f"Existing audio files: {len(existing_audio)}")

    # Find missing words
    missing_words = []
    for dict_file in DICT_FILES:
        if not dict_file.exists():
            continue

        with open(dict_file, 'r', encoding='utf-8') as f:
            words = json.load(f)
            for word_data in words:
                word = word_data['word']
                if word not in existing_audio:
                    missing_words.append({
                        'word': word,
                        'dict_file': dict_file.name
                    })

    print(f"Missing audio files: {len(missing_words)}\n")

    if not missing_words:
        print("No missing audio files!")
        return

    # Download missing audio
    downloaded = 0
    failed = []

    for i, item in enumerate(missing_words, 1):
        word = item['word']
        output_path = AUDIO_DIR / f"{word}.mp3"

        print(f"[{i}/{len(missing_words)}] {word}...", end=' ')

        # Get audio URL
        audio_url, error = get_mw_audio_url(word)

        if error:
            print(f"SKIP - {error}")
            failed.append({
                'word': word,
                'dict_file': item['dict_file'],
                'reason': error
            })
            time.sleep(0.5)
            continue

        # Download audio
        success, error = download_audio(word, audio_url, output_path)

        if success:
            print(f"OK")
            downloaded += 1
        else:
            print(f"FAIL - {error}")
            failed.append({
                'word': word,
                'dict_file': item['dict_file'],
                'reason': error
            })

        # Rate limit
        time.sleep(0.5)

    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"Total missing: {len(missing_words)}")
    print(f"Downloaded: {downloaded}")
    print(f"Failed: {len(failed)}")

    if failed:
        print(f"\n{'='*60}")
        print("FAILED DOWNLOADS:")
        for item in failed[:50]:
            print(f"  {item['word']}: {item['reason']}")
        if len(failed) > 50:
            print(f"  ... and {len(failed) - 50} more")

        # Save failed list
        output_file = SCRIPT_DIR / 'failed_audio_downloads.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(failed, f, indent=2, ensure_ascii=False)
        print(f"\nFailed list saved to: {output_file}")

if __name__ == '__main__':
    main()

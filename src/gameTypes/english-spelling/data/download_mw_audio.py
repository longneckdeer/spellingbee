#!/usr/bin/env python3
"""
Download Merriam-Webster audio files for dictionary words using MW API.
Optimized with parallel downloads.
"""

import json
import os
import urllib.request
import urllib.error
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

# MW API Configuration
MW_API_KEY = "cfc2a612-6202-4231-a810-d613df83c908"
MW_API_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json"
MW_AUDIO_BASE = "https://media.merriam-webster.com/audio/prons/en/us/mp3"

# Thread-safe counters
stats_lock = Lock()
stats = {'success': 0, 'failed': 0, 'processed': 0}
failed_words = []

def get_audio_subdir(audio_filename):
    """Determine subdirectory for MW audio based on filename."""
    if not audio_filename:
        return None

    if audio_filename.startswith("bix"):
        return "bix"
    elif audio_filename.startswith("gg"):
        return "gg"
    elif audio_filename[0].isdigit():
        return "number"
    else:
        return audio_filename[0]

def get_audio_filename_from_api(word):
    """Get the audio filename for a word from MW API."""
    url = f"{MW_API_URL}/{word}?key={MW_API_KEY}"

    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))

            if not data or not isinstance(data[0], dict):
                return None

            entry = data[0]
            prs = entry.get('hwi', {}).get('prs', [])

            if prs and 'sound' in prs[0]:
                return prs[0]['sound'].get('audio')

            return None
    except Exception:
        return None

def download_audio(word, output_dir):
    """Download audio file for a word using MW API."""
    global stats, failed_words

    try:
        # Get audio filename from API
        audio_filename = get_audio_filename_from_api(word)

        if not audio_filename:
            with stats_lock:
                stats['failed'] += 1
                stats['processed'] += 1
                if len(failed_words) < 50:
                    failed_words.append(word)
            return False

        subdir = get_audio_subdir(audio_filename)
        if not subdir:
            with stats_lock:
                stats['failed'] += 1
                stats['processed'] += 1
            return False

        audio_url = f"{MW_AUDIO_BASE}/{subdir}/{audio_filename}.mp3"
        output_path = os.path.join(output_dir, f"{word.lower()}.mp3")

        with urllib.request.urlopen(audio_url, timeout=15) as response:
            audio_data = response.read()

        with open(output_path, 'wb') as f:
            f.write(audio_data)

        with stats_lock:
            stats['success'] += 1
            stats['processed'] += 1
        return True

    except Exception as e:
        with stats_lock:
            stats['failed'] += 1
            stats['processed'] += 1
            if len(failed_words) < 50:
                failed_words.append(word)
        return False

def main():
    # Setup paths
    data_dir = Path(__file__).parent
    audio_dir = data_dir.parent.parent.parent.parent / 'public' / 'audio'
    audio_dir.mkdir(parents=True, exist_ok=True)

    # Get existing audio files
    existing_audio = set()
    for f in audio_dir.glob('*.mp3'):
        existing_audio.add(f.stem.lower())

    print(f"Found {len(existing_audio)} existing audio files")
    print()

    # Load all dictionary files
    files = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']

    # Collect all unique words
    all_words = set()
    for fname in files:
        with open(data_dir / fname, 'r') as f:
            entries = json.load(f)
            all_words.update(e['word'].lower() for e in entries)

    # Find words without audio
    words_to_download = sorted(all_words - existing_audio)

    print(f"Total unique words: {len(all_words)}")
    print(f"Words needing audio: {len(words_to_download)}")
    print()

    if not words_to_download:
        print("All words already have audio!")
        return

    print(f"Downloading {len(words_to_download)} audio files from Merriam-Webster...")
    print(f"Using {20} parallel workers for faster downloads")
    print("-" * 60)

    start_time = time.time()
    total = len(words_to_download)

    # Use ThreadPoolExecutor for parallel downloads
    with ThreadPoolExecutor(max_workers=20) as executor:
        # Submit all download tasks
        futures = {executor.submit(download_audio, word, audio_dir): word
                   for word in words_to_download}

        # Process completed tasks
        for future in as_completed(futures):
            word = futures[future]

            # Progress update every 100 words
            if stats['processed'] % 100 == 0:
                elapsed = time.time() - start_time
                rate = stats['processed'] / elapsed if elapsed > 0 else 0
                remaining = (total - stats['processed']) / rate if rate > 0 else 0

                print(f"Progress: {stats['processed']}/{total} ({stats['processed']/total*100:.1f}%) | "
                      f"Success: {stats['success']} | Failed: {stats['failed']} | "
                      f"Rate: {rate:.1f}/sec | ETA: {remaining/60:.1f} min")

    elapsed = time.time() - start_time

    print("-" * 60)
    print()
    print(f"Download complete!")
    print(f"  Success: {stats['success']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Time: {elapsed/60:.1f} minutes")
    print(f"  Rate: {stats['processed']/elapsed:.1f} words/second")
    print(f"  Total coverage: {len(existing_audio) + stats['success']}/{len(all_words)} " +
          f"({(len(existing_audio) + stats['success'])/len(all_words)*100:.1f}%)")

    if failed_words:
        print()
        print(f"Sample failed words ({len(failed_words)} shown):")
        print(", ".join(failed_words[:50]))

if __name__ == '__main__':
    main()

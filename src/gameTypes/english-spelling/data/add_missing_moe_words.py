#!/usr/bin/env python3
"""
Fetch missing MOE 1200 words from Merriam-Webster API and add to dictionary.
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
MW_API_KEY = os.environ.get("MW_COLLEGIATE_KEY", "")
MW_API_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json"
MW_AUDIO_BASE = "https://media.merriam-webster.com/audio/prons/en/us/mp3"

# Function words to skip (not suitable for spelling bee)
FUNCTION_WORDS = {
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'at',
    'by', 'for', 'with', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'am', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
    'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'this', 'that',
    'these', 'those', 'who', 'whom', 'whose', 'which', 'what', 'where', 'when',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'again',
    'ever', 'never', 'always', 'often', 'still', 'already', 'yet', 'even',
    'almost', 'enough', 'quite', 'rather', 'about', 'after', 'before', 'between',
    'into', 'through', 'during', 'under', 'over', 'above', 'below', 'out', 'up',
    'down', 'off', 'from', 'until', 'while', 'although', 'because', 'since',
    'unless', 'whether', 'though', 'however', 'therefore', 'otherwise', 'instead',
    'perhaps', 'maybe', 'yes', 'no', 'ok', 'okay', 'hello', 'hi', 'hey', 'bye',
    'goodbye', 'please', 'sorry', 'thanks', 'thank', 'welcome', 'mr.', 'mrs.',
    'ms.', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
    'yourselves', 'themselves'
}

# Contractions to skip
CONTRACTIONS = {"aren't", "can't", "don't", "doesn't", "didn't", "won't",
                "wouldn't", "couldn't", "shouldn't", "isn't", "wasn't", "weren't",
                "haven't", "hasn't", "hadn't", "let's", "i'm", "you're", "he's",
                "she's", "it's", "we're", "they're", "i've", "you've", "we've",
                "they've", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll",
                "i'd", "you'd", "he'd", "she'd", "we'd", "they'd"}

# Basic words (小學 level) - first ~300 MOE words
BASIC_WORD_THRESHOLD = 400  # Word index in MOE list

# Thread-safe stats
stats_lock = Lock()
stats = {'success': 0, 'failed': 0, 'processed': 0}
fetched_words = []
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

def fetch_word_from_mw(word, audio_dir):
    """Fetch word data from MW API and download audio."""
    global stats, fetched_words, failed_words

    url = f"{MW_API_URL}/{word}?key={MW_API_KEY}"

    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))

            if not data or not isinstance(data[0], dict):
                with stats_lock:
                    stats['failed'] += 1
                    stats['processed'] += 1
                    failed_words.append(word)
                return None

            entry = data[0]

            # Get definition
            shortdef = entry.get('shortdef', [])
            definition = shortdef[0] if shortdef else ''

            # Get part of speech
            pos = entry.get('fl', '')

            # Get pronunciation audio
            audio_filename = None
            prs = entry.get('hwi', {}).get('prs', [])
            if prs and 'sound' in prs[0]:
                audio_filename = prs[0]['sound'].get('audio')

            # Download audio if available
            if audio_filename:
                subdir = get_audio_subdir(audio_filename)
                if subdir:
                    audio_url = f"{MW_AUDIO_BASE}/{subdir}/{audio_filename}.mp3"
                    output_path = os.path.join(audio_dir, f"{word.lower()}.mp3")

                    try:
                        with urllib.request.urlopen(audio_url, timeout=15) as audio_response:
                            audio_data = audio_response.read()
                        with open(output_path, 'wb') as f:
                            f.write(audio_data)
                    except Exception:
                        pass  # Audio download failed, but we still have the word

            word_entry = {
                'word': word,
                'definition': definition,
                'partOfSpeech': pos,
                'sentence': '',  # MW API doesn't provide sentences in shortdef
                'source': 'merriam-webster'
            }

            with stats_lock:
                stats['success'] += 1
                stats['processed'] += 1
                fetched_words.append(word_entry)

            return word_entry

    except Exception as e:
        with stats_lock:
            stats['failed'] += 1
            stats['processed'] += 1
            failed_words.append(word)
        return None

def main():
    data_dir = Path(__file__).parent
    audio_dir = data_dir.parent.parent.parent.parent / 'public' / 'audio'
    audio_dir.mkdir(parents=True, exist_ok=True)

    # Read MOE 1200 word list (one word per line)
    moe_words = []
    with open(data_dir / 'taiwan_moe_1200.txt', 'r', encoding='utf-8') as f:
        for line in f:
            word = line.strip()
            if word:
                moe_words.append(word)

    print(f"Total MOE words: {len(moe_words)}")

    # Read existing dictionary words
    existing_words = set()
    for fname in ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']:
        filepath = data_dir / fname
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                entries = json.load(f)
                for entry in entries:
                    existing_words.add(entry['word'].lower())

    print(f"Existing dictionary words: {len(existing_words)}")

    # Find missing MOE words (content words only)
    missing_words = []
    for i, word in enumerate(moe_words):
        word_lower = word.lower()
        if word_lower not in existing_words:
            # Skip function words and contractions
            if word_lower in FUNCTION_WORDS or word_lower in CONTRACTIONS:
                continue
            if "'" in word_lower:  # Skip contractions
                continue
            missing_words.append((i, word))

    print(f"Missing content words: {len(missing_words)}")
    print()

    if not missing_words:
        print("No missing words to fetch!")
        return

    # Classify into basic (小學) and intermediate (中學)
    basic_words = [(i, w) for i, w in missing_words if i < BASIC_WORD_THRESHOLD]
    intermediate_words = [(i, w) for i, w in missing_words if i >= BASIC_WORD_THRESHOLD]

    print(f"Basic (小學) words to fetch: {len(basic_words)}")
    print(f"Intermediate (中學) words to fetch: {len(intermediate_words)}")
    print()

    print(f"Fetching {len(missing_words)} words from Merriam-Webster...")
    print(f"Using 10 parallel workers")
    print("-" * 60)

    start_time = time.time()
    total = len(missing_words)
    all_words = [w for _, w in missing_words]

    # Use ThreadPoolExecutor for parallel fetches
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_word_from_mw, word, audio_dir): word
                   for word in all_words}

        for future in as_completed(futures):
            if stats['processed'] % 50 == 0 and stats['processed'] > 0:
                elapsed = time.time() - start_time
                rate = stats['processed'] / elapsed if elapsed > 0 else 0
                print(f"Progress: {stats['processed']}/{total} ({stats['processed']/total*100:.1f}%) | "
                      f"Success: {stats['success']} | Failed: {stats['failed']} | "
                      f"Rate: {rate:.1f}/sec")

    elapsed = time.time() - start_time

    print("-" * 60)
    print()
    print(f"Fetch complete!")
    print(f"  Success: {stats['success']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Time: {elapsed:.1f} seconds")
    print()

    if failed_words:
        print(f"Failed words: {', '.join(failed_words[:30])}")
        if len(failed_words) > 30:
            print(f"  ... and {len(failed_words) - 30} more")
        print()

    # Organize fetched words by level
    basic_fetched = []
    intermediate_fetched = []

    fetched_set = {w['word'].lower(): w for w in fetched_words}

    for i, word in basic_words:
        word_lower = word.lower()
        if word_lower in fetched_set:
            entry = fetched_set[word_lower]
            entry['taiwan_stage'] = '小學'
            basic_fetched.append(entry)

    for i, word in intermediate_words:
        word_lower = word.lower()
        if word_lower in fetched_set:
            entry = fetched_set[word_lower]
            entry['taiwan_stage'] = '中學'
            intermediate_fetched.append(entry)

    print(f"Adding {len(basic_fetched)} words to elementary.json")
    print(f"Adding {len(intermediate_fetched)} words to middle.json")
    print()

    # Load existing dictionaries
    with open(data_dir / 'elementary.json', 'r', encoding='utf-8') as f:
        elementary = json.load(f)

    with open(data_dir / 'middle.json', 'r', encoding='utf-8') as f:
        middle = json.load(f)

    # Add new words
    elementary.extend(basic_fetched)
    middle.extend(intermediate_fetched)

    # Sort by word
    elementary.sort(key=lambda x: x['word'].lower())
    middle.sort(key=lambda x: x['word'].lower())

    # Save updated dictionaries
    with open(data_dir / 'elementary.json', 'w', encoding='utf-8') as f:
        json.dump(elementary, f, indent=2, ensure_ascii=False)

    with open(data_dir / 'middle.json', 'w', encoding='utf-8') as f:
        json.dump(middle, f, indent=2, ensure_ascii=False)

    print(f"Updated elementary.json: {len(elementary)} words")
    print(f"Updated middle.json: {len(middle)} words")
    print()

    # Save failed words for review
    if failed_words:
        with open(data_dir / 'failed_moe_words.txt', 'w', encoding='utf-8') as f:
            f.write('\n'.join(failed_words))
        print(f"Failed words saved to: failed_moe_words.txt")

if __name__ == '__main__':
    main()

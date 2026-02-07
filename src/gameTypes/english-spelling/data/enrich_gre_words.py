#!/usr/bin/env python3
"""
Enrich GRE Word List with Merriam-Webster Definitions

This script:
1. Reads GRE words from gre_words_github.json
2. Fetches definitions, parts of speech, and examples from Merriam-Webster API
3. Downloads audio pronunciations
4. Saves enriched data to gre_words_enriched.json

Usage:
    python3 enrich_gre_words.py

The script will process all words that have "needs_enrichment": true
"""

import json
import os
import time
import urllib.request
import urllib.error
from pathlib import Path

# API Configuration
MW_API_KEY = "cfc2a612-6202-4231-a810-d613df83c908"  # Collegiate Dictionary
MW_API_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json"
MW_AUDIO_BASE = "https://media.merriam-webster.com/audio/prons/en/us/mp3"

# Output directories
SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = Path("/Users/jeffkuo/My Drive/AIProjects/spellingbee/public/audio")

# Part of speech mapping to Chinese
POS_MAP = {
    'noun': '名詞',
    'verb': '動詞',
    'adjective': '形容詞',
    'adverb': '副詞',
    'preposition': '介詞',
    'conjunction': '連詞',
    'pronoun': '代詞',
    'interjection': '感嘆詞',
    'auxiliary verb': '助動詞',
    'definite article': '冠詞',
    'indefinite article': '冠詞',
}


def get_audio_subdir(audio_filename):
    """
    Determine the subdirectory for audio file based on MW rules.
    - If starts with "bix", subdir = "bix"
    - If starts with "gg", subdir = "gg"
    - If starts with number, subdir = "number"
    - Otherwise, first letter
    """
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


def fetch_word_data(word):
    """
    Fetch word data from Merriam-Webster API.

    Returns dict with: word, definition, sentence, partOfSpeech, audio_filename
    Or None if word not found.
    """
    url = f"{MW_API_URL}/{word}?key={MW_API_KEY}"

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))

            # Check if we got actual entries (not suggestions)
            if not data or not isinstance(data[0], dict):
                return None

            entry = data[0]

            # Extract headword (remove syllable markers)
            headword = entry.get('hwi', {}).get('hw', word)
            clean_word = headword.replace('*', '')

            # Extract part of speech
            fl = entry.get('fl', 'noun')
            pos_chinese = POS_MAP.get(fl.lower(), '名詞')

            # Extract short definition
            shortdef = entry.get('shortdef', [''])
            definition = shortdef[0] if shortdef else ''

            # Extract audio filename
            prs = entry.get('hwi', {}).get('prs', [])
            audio_filename = None
            if prs and 'sound' in prs[0]:
                audio_filename = prs[0]['sound'].get('audio')

            # Try to extract example sentence from definition
            sentence = ""
            try:
                defs = entry.get('def', [])
                if defs:
                    sseq = defs[0].get('sseq', [])
                    if sseq:
                        for sense in sseq:
                            if isinstance(sense, list) and len(sense) > 0:
                                for item in sense:
                                    if isinstance(item, list) and len(item) > 1:
                                        sense_data = item[1]
                                        if isinstance(sense_data, dict):
                                            dt = sense_data.get('dt', [])
                                            for dt_item in dt:
                                                if isinstance(dt_item, list) and dt_item[0] == 'vis':
                                                    vis_list = dt_item[1]
                                                    if vis_list:
                                                        # Get the example text
                                                        t = vis_list[0].get('t', '')
                                                        # Clean up formatting tags
                                                        t = t.replace('{it}', '').replace('{/it}', '')
                                                        t = t.replace('{ldquo}', '"').replace('{rdquo}', '"')
                                                        sentence = t
                                                        break
                                        if sentence:
                                            break
                                if sentence:
                                    break
            except Exception:
                pass

            # If no example sentence, create a simple one
            if not sentence:
                if pos_chinese == '名詞':
                    sentence = f"The {clean_word} is important."
                elif pos_chinese == '動詞':
                    sentence = f"They {clean_word} regularly."
                elif pos_chinese == '形容詞':
                    sentence = f"It was very {clean_word}."
                else:
                    sentence = f"The word {clean_word} is useful."

            return {
                'word': clean_word,
                'definition': definition,
                'sentence': sentence,
                'partOfSpeech': pos_chinese,
                'audio_filename': audio_filename
            }

    except urllib.error.HTTPError as e:
        print(f"  HTTP Error for '{word}': {e.code}")
        return None
    except urllib.error.URLError as e:
        print(f"  URL Error for '{word}': {e.reason}")
        return None
    except Exception as e:
        print(f"  Error for '{word}': {e}")
        return None


def download_audio(word, audio_filename):
    """
    Download audio file for a word.

    Returns True if successful, False otherwise.
    """
    if not audio_filename:
        return False

    subdir = get_audio_subdir(audio_filename)
    if not subdir:
        return False

    audio_url = f"{MW_AUDIO_BASE}/{subdir}/{audio_filename}.mp3"

    # Create audio directory if it doesn't exist
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    output_path = AUDIO_DIR / f"{word.lower()}.mp3"

    # Skip if already exists
    if output_path.exists():
        return True

    try:
        with urllib.request.urlopen(audio_url, timeout=10) as response:
            audio_data = response.read()

        with open(output_path, 'wb') as f:
            f.write(audio_data)

        return True

    except Exception as e:
        print(f"  Audio download error for '{word}': {e}")
        return False


def main():
    """Main execution function."""
    print("=" * 60)
    print("GRE Word List Enrichment with Merriam-Webster API")
    print("=" * 60)

    # Load GRE word list
    input_file = SCRIPT_DIR / "gre_words_github.json"

    if not input_file.exists():
        print(f"ERROR: Input file not found: {input_file}")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        words_data = json.load(f)

    print(f"\nLoaded {len(words_data)} GRE words from {input_file.name}")

    # Filter words that need enrichment
    words_to_enrich = [w for w in words_data if w.get('needs_enrichment', False)]
    print(f"Words to enrich: {len(words_to_enrich)}")

    # Process words
    enriched_words = []
    success_count = 0
    fail_count = 0
    audio_count = 0

    for i, word_entry in enumerate(words_to_enrich, 1):
        word = word_entry['word']
        print(f"\n[{i}/{len(words_to_enrich)}] Processing: {word}")

        # Fetch from API
        data = fetch_word_data(word)

        if data:
            enriched_entry = {
                'word': data['word'],
                'definition': data['definition'],
                'sentence': data['sentence'],
                'partOfSpeech': data['partOfSpeech'],
                'source': 'github-gre-collection'
            }

            # Download audio if available
            if data.get('audio_filename'):
                if download_audio(data['word'], data['audio_filename']):
                    audio_count += 1
                    print(f"  ✓ Audio downloaded")

            enriched_words.append(enriched_entry)
            success_count += 1
            print(f"  ✓ {data['partOfSpeech']}: {data['definition'][:60]}...")
        else:
            # Keep original entry but mark as failed
            enriched_words.append({
                'word': word,
                'definition': 'DEFINITION NOT FOUND',
                'sentence': f"The word {word} is used in advanced contexts.",
                'partOfSpeech': '名詞',
                'source': 'github-gre-collection',
                'enrichment_failed': True
            })
            fail_count += 1
            print(f"  ✗ Not found in dictionary")

        # Rate limiting - pause every 10 words
        if i % 10 == 0:
            time.sleep(0.5)
            print(f"\n--- Progress: {i}/{len(words_to_enrich)} ({success_count} success, {fail_count} failed) ---")

    # Save enriched data
    output_file = SCRIPT_DIR / "gre_words_enriched.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(enriched_words, f, ensure_ascii=False, indent=2)

    # Summary
    print("\n" + "=" * 60)
    print("ENRICHMENT COMPLETE!")
    print("=" * 60)
    print(f"\nTotal words processed: {len(words_to_enrich)}")
    print(f"Successfully enriched: {success_count} ({success_count/len(words_to_enrich)*100:.1f}%)")
    print(f"Failed to find: {fail_count} ({fail_count/len(words_to_enrich)*100:.1f}%)")
    print(f"Audio files downloaded: {audio_count}")
    print(f"\nOutput saved to: {output_file}")
    print(f"Audio files: {AUDIO_DIR}")
    print("\nNext steps:")
    print("1. Review gre_words_enriched.json")
    print("2. Manually fix any entries with 'enrichment_failed': true")
    print("3. Optionally add difficulty scores and CEFR levels")
    print("4. Consider creating a separate GRE level dictionary file")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Fix mismatched adverbs where audio plays base word instead of adverb.
- Remove adverbs where base word exists in dictionary
- Convert adverbs to base words where base is missing
"""

import json
import os
import shutil
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, 'src', 'gameTypes', 'english-spelling', 'data')
AUDIO_DIR = os.path.join(PROJECT_DIR, 'public', 'audio')
MW_KEY = os.environ.get("MW_COLLEGIATE_KEY", "")

# Adverbs to REMOVE (base word already exists)
ADVERBS_TO_REMOVE = [
    ('abstemiously', 'expert.json'),
    ('automatically', 'high.json'),
    ('carefully', 'middle.json'),
    ('closely', 'high.json'),
    ('commonly', 'high.json'),
    ('considerably', 'high.json'),
    ('consistently', 'high.json'),
    ('dramatically', 'high.json'),
    ('eagerly', 'university.json'),
    ('genetically', 'university.json'),
    ('gently', 'high.json'),
    ('globally', 'high.json'),
    ('gradually', 'high.json'),
    ('illegally', 'high.json'),
    ('implicitly', 'expert.json'),
    ('indirectly', 'high.json'),
    ('individually', 'high.json'),
    ('inherently', 'expert.json'),
    ('intensely', 'high.json'),
    ('keenly', 'high.json'),
    ('knowingly', 'high.json'),
    ('logically', 'high.json'),
    ('mildly', 'high.json'),
    ('morally', 'high.json'),
    ('mutually', 'high.json'),
    ('nationally', 'high.json'),
    ('neatly', 'high.json'),
    ('nicely', 'high.json'),
    ('paradoxically', 'university.json'),
    ('peacefully', 'high.json'),
    ('peculiarly', 'high.json'),
    ('persistently', 'high.json'),
    ('philosophically', 'university.json'),
    ('politely', 'high.json'),
    ('positively', 'high.json'),
    ('prematurely', 'university.json'),
    ('principally', 'high.json'),
    ('privately', 'high.json'),
    ('professionally', 'high.json'),
    ('profitably', 'university.json'),
    ('profoundly', 'high.json'),
    ('prominently', 'high.json'),
    ('proportionately', 'university.json'),
    ('proudly', 'high.json'),
    ('purposefully', 'high.json'),
    ('quantitatively', 'university.json'),
    ('quickly', 'middle.json'),
    ('randomly', 'high.json'),
    ('rapidly', 'high.json'),
    ('recklessly', 'university.json'),
    ('relentlessly', 'university.json'),
    ('reliably', 'high.json'),
    ('religiously', 'high.json'),
    ('resolutely', 'university.json'),
    ('respectfully', 'high.json'),
    ('rhetorically', 'university.json'),
    ('rigidly', 'university.json'),
    ('rigorously', 'university.json'),
    ('ritually', 'high.json'),
    ('romantically', 'high.json'),
    ('rudely', 'high.json'),
    ('ruefully', 'university.json'),
    ('ruthlessly', 'university.json'),
]

# Adverbs to CONVERT to base (base word missing)
ADVERBS_TO_CONVERT = [
    ('firmly', 'firm', 'high.json'),
    ('normally', 'normal', 'middle.json'),
    ('rationally', 'rational', 'high.json'),
    ('rightfully', 'rightful', 'university.json'),
]

def fetch_mw_definition(word):
    """Fetch definition from Merriam-Webster API"""
    url = f'https://www.dictionaryapi.com/api/v3/references/collegiate/json/{word}?key={MW_KEY}'
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())

        if isinstance(data[0], dict):
            # Get first definition
            defs = data[0].get('def', [{}])
            if defs:
                sseq = defs[0].get('sseq', [[]])
                if sseq and sseq[0]:
                    sense = sseq[0][0]
                    if len(sense) > 1 and isinstance(sense[1], dict):
                        dt = sense[1].get('dt', [])
                        for item in dt:
                            if item[0] == 'text':
                                # Clean up definition
                                definition = item[1]
                                definition = definition.replace('{bc}', '')
                                definition = definition.replace('{it}', '').replace('{/it}', '')
                                definition = definition.replace('{ldquo}', '"').replace('{rdquo}', '"')
                                return definition.strip()
            return None
    except Exception as e:
        print(f"  Error fetching {word}: {e}")
        return None

def remove_word_from_file(word, filename):
    """Remove a word entry from a dictionary file"""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_count = len(data)
    data = [entry for entry in data if entry['word'].lower() != word.lower()]
    new_count = len(data)

    if original_count != new_count:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    return False

def convert_word_in_file(old_word, new_word, filename, new_definition=None):
    """Convert a word entry to a different word"""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for entry in data:
        if entry['word'].lower() == old_word.lower():
            entry['word'] = new_word
            if new_definition:
                entry['definition'] = new_definition
            entry['partOfSpeech'] = '形容詞'
            # Generate a simple sentence
            entry['sentence'] = f"The word '{new_word}' is an adjective."
            break

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    print("=" * 60)
    print("Fixing Mismatched Adverbs")
    print("=" * 60)

    # Step 1: Remove adverbs where base word exists
    print(f"\n1. Removing {len(ADVERBS_TO_REMOVE)} adverbs (base word exists)...\n")
    removed_count = 0
    for adverb, filename in ADVERBS_TO_REMOVE:
        if remove_word_from_file(adverb, filename):
            print(f"  ✓ Removed '{adverb}' from {filename}")
            removed_count += 1

            # Remove audio file
            audio_path = os.path.join(AUDIO_DIR, f"{adverb}.mp3")
            if os.path.exists(audio_path):
                os.remove(audio_path)
                print(f"    → Deleted {adverb}.mp3")
        else:
            print(f"  ✗ '{adverb}' not found in {filename}")

    print(f"\n  Total removed: {removed_count}")

    # Step 2: Convert adverbs to base words
    print(f"\n2. Converting {len(ADVERBS_TO_CONVERT)} adverbs to base words...\n")
    for adverb, base, filename in ADVERBS_TO_CONVERT:
        print(f"  Converting '{adverb}' → '{base}' in {filename}")

        # Fetch definition for base word
        definition = fetch_mw_definition(base)
        if definition:
            print(f"    Definition: {definition[:60]}...")
        else:
            definition = f"having the quality of being {base}"
            print(f"    Using fallback definition")

        convert_word_in_file(adverb, base, filename, definition)
        print(f"    ✓ Updated dictionary entry")

        # Rename audio file
        old_audio = os.path.join(AUDIO_DIR, f"{adverb}.mp3")
        new_audio = os.path.join(AUDIO_DIR, f"{base}.mp3")
        if os.path.exists(old_audio) and not os.path.exists(new_audio):
            shutil.move(old_audio, new_audio)
            print(f"    ✓ Renamed {adverb}.mp3 → {base}.mp3")
        elif os.path.exists(new_audio):
            print(f"    → {base}.mp3 already exists")
            if os.path.exists(old_audio):
                os.remove(old_audio)
                print(f"    → Deleted duplicate {adverb}.mp3")

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == '__main__':
    main()

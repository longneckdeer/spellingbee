#!/usr/bin/env python3
"""
Fix dictionary issues:
1. Fix typos (use MW suggestions)
2. Remove inflected forms (violate citation form policy)
3. Remove archaic/non-existent words
"""

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent

# Load failed downloads
with open(SCRIPT_DIR / 'failed_audio_downloads.json', 'r') as f:
    failed = json.load(f)

# Manual typo corrections (word → correct_word)
TYPO_FIXES = {
    'conflagaration': 'conflagration',
    'decourous': 'decorous',
    'inerlocutor': 'interlocutor',
    'jucture': 'juncture',
    'manoeuver': 'maneuver',
    'rationlize': 'rationalize',
    'statcraft': 'statecraft',
    'solicitious': 'solicitous',
    'ubiquitious': 'ubiquitous',
    'uncouch': 'uncouth',
}

# Inflected forms to remove (violate citation form policy)
INFLECTED_FORMS = {
    'lives',      # plural of life OR verb form of live
    'leaves',     # plural of leaf OR verb form of leave
    'learned',    # past tense of learn
    'divorced',   # past tense of divorce
    'rolling',    # gerund of roll
    'came',       # past tense of come
    'clad',       # past tense of clothe
}

# Words not found in MW or clearly wrong - to be removed
# Check reason "Word not found" or obvious errors
WORDS_TO_REMOVE = set()

for item in failed:
    word = item['word']
    reason = item['reason']

    # Add inflected forms
    if word in INFLECTED_FORMS:
        WORDS_TO_REMOVE.add(word)

    # Add words not found in MW (archaic/non-existent)
    elif 'Word not found' in reason:
        WORDS_TO_REMOVE.add(word)

    # Add malformed words
    elif len(word) > 30 or ' ' in word:  # Suspiciously long or contains spaces
        WORDS_TO_REMOVE.add(word)

print(f"Typo fixes: {len(TYPO_FIXES)}")
print(f"Words to remove: {len(WORDS_TO_REMOVE)}")
print()

# Process each dictionary file
dict_files = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']

total_typos_fixed = 0
total_words_removed = 0

for dict_file in dict_files:
    dict_path = SCRIPT_DIR / dict_file

    with open(dict_path, 'r', encoding='utf-8') as f:
        words = json.load(f)

    original_count = len(words)
    new_words = []
    typos_fixed = 0
    words_removed = 0

    for word_data in words:
        word = word_data['word']

        # Check if it's a typo
        if word in TYPO_FIXES:
            correct_word = TYPO_FIXES[word]
            print(f"[{dict_file}] Fixing typo: {word} → {correct_word}")
            word_data['word'] = correct_word
            new_words.append(word_data)
            typos_fixed += 1

        # Check if it should be removed
        elif word in WORDS_TO_REMOVE:
            print(f"[{dict_file}] Removing: {word}")
            words_removed += 1
            # Don't add to new_words

        else:
            new_words.append(word_data)

    # Save updated dictionary
    if typos_fixed > 0 or words_removed > 0:
        with open(dict_path, 'w', encoding='utf-8') as f:
            json.dump(new_words, f, indent=2, ensure_ascii=False)

        print(f"[{dict_file}] Updated: {original_count} → {len(new_words)} words (-{original_count - len(new_words)})")
        print()

    total_typos_fixed += typos_fixed
    total_words_removed += words_removed

print(f"{'='*60}")
print(f"SUMMARY:")
print(f"Total typos fixed: {total_typos_fixed}")
print(f"Total words removed: {total_words_removed}")
print(f"Total changes: {total_typos_fixed + total_words_removed}")

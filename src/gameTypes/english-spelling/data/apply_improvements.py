#!/usr/bin/env python3
"""
Apply improved sentences to dictionary files.
"""

import json

def apply_improvements(improvements_file, dictionary_file):
    """Apply improvements from a batch file to the dictionary"""

    # Load improvements
    with open(improvements_file, 'r', encoding='utf-8') as f:
        improvements_data = json.load(f)

    source_file = improvements_data['source_file']
    improvements = improvements_data['improvements']

    # Create a mapping of word -> new sentence
    improvements_map = {
        item['word']: item['new_sentence']
        for item in improvements
    }

    # Load dictionary
    with open(dictionary_file, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)

    # Apply improvements
    changes = 0
    for entry in dictionary:
        word = entry.get('word', '')
        if word in improvements_map:
            old_sentence = entry.get('sentence', '')
            new_sentence = improvements_map[word]

            if old_sentence != new_sentence:
                entry['sentence'] = new_sentence
                changes += 1

    # Save updated dictionary
    if changes > 0:
        with open(dictionary_file, 'w', encoding='utf-8') as f:
            json.dump(dictionary, f, ensure_ascii=False, indent=2)
        print(f"✓ Applied {changes} improvements to {dictionary_file}")
    else:
        print(f"  No changes needed for {dictionary_file}")

    return changes

# Apply batch 1
print("Applying improved sentences...")
print("="*70)

total_changes = apply_improvements('improved_batch_1.json', 'middle.json')

print("="*70)
print(f"Total changes applied: {total_changes}")

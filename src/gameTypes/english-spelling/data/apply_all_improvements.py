#!/usr/bin/env python3
"""
Apply all improved sentences to dictionary files.
"""

import json

def apply_improvements(improvements_file, dictionary_file):
    """Apply improvements from a batch file to the dictionary"""

    # Load improvements
    with open(improvements_file, 'r', encoding='utf-8') as f:
        improvements_data = json.load(f)

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

    return changes

# Apply all improvements
improvements_batches = [
    ('improved_batch_2_high.json', 'high.json'),
    ('improved_batch_3_high.json', 'high.json'),
    ('improved_batch_4_university.json', 'university.json'),
    ('improved_batch_5_university.json', 'university.json'),
    ('improved_batch_6_expert.json', 'expert.json'),
    ('improved_batch_7_expert.json', 'expert.json'),
    ('improved_batch_8_expert.json', 'expert.json'),
]

print("Applying all improved sentences to dictionary files...")
print("="*70)

total_changes = 0

for improvements_file, dict_file in improvements_batches:
    changes = apply_improvements(improvements_file, dict_file)
    if changes > 0:
        print(f"✓ {dict_file}: Applied {changes} improvements")
    total_changes += changes

print("="*70)
print(f"Total improvements applied: {total_changes}")
print("\nAll dictionary files updated successfully!")

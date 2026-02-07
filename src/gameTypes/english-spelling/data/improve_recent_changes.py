#!/usr/bin/env python3
"""
Improve only the recently changed sentences from MW API.
We'll process them in batches for manual review and improvement.
"""

import json

# Load the sentence validation report to see which words were changed
with open('sentence_validation_report.json', 'r', encoding='utf-8') as f:
    validation_report = json.load(f)

# Words that were attempted to be fixed
words_to_check = {}
for filename, issues in validation_report.items():
    if issues and filename in ['middle.json', 'high.json', 'university.json', 'expert.json']:
        words_to_check[filename] = [item['word'] for item in issues]

print("Loading dictionaries to check recently changed sentences...")
print("="*70)

improved_needed = {}

for filename, word_list in words_to_check.items():
    with open(filename, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)

    to_improve = []

    for entry in dictionary:
        word = entry.get('word', '')
        if word in word_list:
            sentence = entry.get('sentence', '')
            to_improve.append({
                'word': word,
                'sentence': sentence,
                'definition': entry.get('definition', ''),
                'partOfSpeech': entry.get('partOfSpeech', '')
            })

    if to_improve:
        improved_needed[filename] = to_improve
        print(f"{filename}: {len(to_improve)} sentences to review")

# Save batches for processing
batch_size = 50
batch_num = 1

for filename, entries in improved_needed.items():
    for i in range(0, len(entries), batch_size):
        batch = entries[i:i+batch_size]
        batch_filename = f"improve_batch_{batch_num}_{filename}"

        with open(batch_filename, 'w', encoding='utf-8') as f:
            json.dump({
                'source_file': filename,
                'entries': batch
            }, f, ensure_ascii=False, indent=2)

        print(f"✓ Created {batch_filename} ({len(batch)} entries)")
        batch_num += 1

print("\n" + "="*70)
print(f"Total batches created: {batch_num - 1}")
print("\nNext: Process each batch to generate improved sentences")

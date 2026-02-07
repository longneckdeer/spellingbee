#!/usr/bin/env python3
"""
Validate that all sample sentences contain the word being spelled.
"""

import json
import re

def normalize_word(word):
    """Normalize word for comparison (lowercase, remove hyphens)"""
    return word.lower().replace('-', '').replace(' ', '')

def extract_words_from_sentence(sentence):
    """Extract all words from sentence, handling {wi} tags"""
    # Remove {wi} and {/wi} tags
    cleaned = sentence.replace('{wi}', '').replace('{/wi}', '')
    # Remove {d_link|text|ref} tags
    cleaned = re.sub(r'\{d_link\|([^}]+)\}', r'\1', cleaned)
    # Extract words (alphanumeric with hyphens)
    words = re.findall(r'\b[\w-]+\b', cleaned.lower())
    return words

def word_in_sentence(word, sentence):
    """Check if word appears in sentence (handles variations)"""
    if not sentence:
        return False

    sentence_words = extract_words_from_sentence(sentence)
    word_normalized = normalize_word(word)

    # Check exact match
    if word.lower() in [w.lower() for w in sentence_words]:
        return True

    # Check without hyphens (for hyphenated words)
    for sent_word in sentence_words:
        if normalize_word(sent_word) == word_normalized:
            return True

    # Check if word is part of a compound or inflected form
    for sent_word in sentence_words:
        sent_normalized = normalize_word(sent_word)
        # Check if word is at start of compound word
        if sent_normalized.startswith(word_normalized):
            return True
        # Check if word is a stem of inflected form
        if word_normalized in sent_normalized:
            return True

    return False

# Dictionary files to check
files = [
    'elementary.json',
    'middle.json',
    'high.json',
    'university.json',
    'expert.json'
]

print("Validating sample sentences...")
print("="*70)

total_words = 0
total_missing = 0
missing_by_file = {}

for filename in files:
    print(f"\nChecking {filename}...")

    with open(filename, 'r', encoding='utf-8') as f:
        words = json.load(f)

    missing = []
    for entry in words:
        word = entry.get('word', '')
        sentence = entry.get('sentence', '')

        if not word_in_sentence(word, sentence):
            missing.append({
                'word': word,
                'sentence': sentence
            })

    total_words += len(words)
    total_missing += len(missing)
    missing_by_file[filename] = missing

    if missing:
        print(f"  ❌ {len(missing)}/{len(words)} words missing from sentences")
    else:
        print(f"  ✓ All {len(words)} sentences contain their words")

print("\n" + "="*70)
print(f"SUMMARY: {total_missing}/{total_words} words missing from sentences")
print("="*70)

# Show details for missing words
if total_missing > 0:
    print("\nDETAILED REPORT:")
    print("="*70)

    for filename, missing in missing_by_file.items():
        if missing:
            print(f"\n{filename} - {len(missing)} issues:")
            print("-"*70)
            for item in missing[:10]:  # Show first 10
                print(f"\nWord: {item['word']}")
                print(f"Sentence: {item['sentence']}")

            if len(missing) > 10:
                print(f"\n... and {len(missing) - 10} more")

    # Save full report to file
    with open('sentence_validation_report.json', 'w', encoding='utf-8') as f:
        json.dump(missing_by_file, f, ensure_ascii=False, indent=2)
    print("\n✓ Full report saved to sentence_validation_report.json")
else:
    print("\n✅ All sample sentences are valid!")

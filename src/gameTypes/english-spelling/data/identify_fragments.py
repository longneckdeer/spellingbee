#!/usr/bin/env python3
"""
Identify sentence fragments that need to be improved.
"""

import json
import re

def is_complete_sentence(sentence):
    """Check if sentence is complete (has subject, verb, proper capitalization, punctuation)"""
    if not sentence:
        return False

    # Remove {wi}, {/wi}, {it}, {/it} tags
    cleaned = sentence.replace('{wi}', '').replace('{/wi}', '')
    cleaned = cleaned.replace('{it}', '').replace('{/it}', '')
    cleaned = re.sub(r'\{d_link\|([^}]+)\}', r'\1', cleaned)
    cleaned = cleaned.strip()

    # Check basic criteria
    if len(cleaned) < 10:  # Too short
        return False

    if not cleaned[0].isupper() and cleaned[0].isalpha():  # Should start with capital
        return False

    if not cleaned[-1] in '.!?':  # Should end with punctuation
        return False

    # Check for verb (simple heuristic - has common verb forms)
    verb_pattern = r'\b(is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|can|could|should|may|might|must|shall)\b'
    if not re.search(verb_pattern, cleaned, re.IGNORECASE):
        # Check for other verb forms (ends in -ed, -ing, -s for 3rd person)
        if not re.search(r'\b\w+(ed|ing|s)\b', cleaned):
            return False

    return True

# Load all dictionaries
files = ['middle.json', 'high.json', 'university.json', 'expert.json']

fragments = {}
total_fragments = 0

print("Identifying sentence fragments...")
print("="*70)

for filename in files:
    with open(filename, 'r', encoding='utf-8') as f:
        words = json.load(f)

    file_fragments = []

    for entry in words:
        word = entry.get('word', '')
        sentence = entry.get('sentence', '')

        if not is_complete_sentence(sentence):
            file_fragments.append({
                'word': word,
                'sentence': sentence,
                'definition': entry.get('definition', ''),
                'partOfSpeech': entry.get('partOfSpeech', '')
            })

    if file_fragments:
        fragments[filename] = file_fragments
        total_fragments += len(file_fragments)
        print(f"{filename}: {len(file_fragments)} fragments")

print("="*70)
print(f"Total fragments to fix: {total_fragments}")

# Save to file for processing
with open('fragments_to_fix.json', 'w', encoding='utf-8') as f:
    json.dump(fragments, f, ensure_ascii=False, indent=2)

print("\n✓ Saved fragments to fragments_to_fix.json")

# Show examples
print("\nSample fragments:")
print("-"*70)
for filename, items in list(fragments.items())[:2]:
    print(f"\n{filename}:")
    for item in items[:5]:
        print(f"  {item['word']}: \"{item['sentence']}\"")

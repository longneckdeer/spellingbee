#!/usr/bin/env python3
"""
Remove inflected verb forms from dictionaries, keeping only citation forms.
"""

import json
from pathlib import Path

# Words to keep even if they look like inflections
KEEP_WORDS = {
    # Legitimate nouns
    'cooking', 'parking', 'building', 'banking', 'training', 'meaning',
    'feeling', 'wedding', 'meeting', 'housing', 'clothing', 'shipping',
    'jeans', 'news', 'means', 'series', 'species',

    # Nouns that are plural forms but distinct entries
    'leaves', 'lives',  # Can be noun plurals

    # Auxiliary verbs
    'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would',

    # Words that are legitimately both verb and noun
    'breaks',  # noun: a break in action
}

# Common inflection patterns to check
def is_likely_inflection(word, definition, pos):
    """Check if a word is likely just an inflected form."""
    word_lower = word.lower()

    # Keep if in whitelist
    if word_lower in KEEP_WORDS:
        return False

    # Bad data indicators
    if 'See' in definition or 'past tense of' in definition.lower():
        return True

    # Verb forms with verb POS that end in common suffixes
    if any(marker in pos.lower() for marker in ['verb', '動詞']):
        # -ing forms
        if word_lower.endswith('ing') and len(word_lower) > 4:
            return True
        # -ed forms
        if word_lower.endswith('ed') and len(word_lower) > 3:
            return True
        # -s forms (but be careful with nouns)
        if word_lower.endswith('s') and not word_lower.endswith(('ss', 'us')):
            # Check if it's a simple -s addition
            base = word_lower[:-1]
            if len(base) >= 2:
                return True

    # Nouns that look like past tense verbs
    if 'noun' in pos.lower() or '名詞' in pos:
        # Past tense forms incorrectly labeled as nouns
        irregular_past = {
            'grew', 'knew', 'said', 'went', 'came', 'took', 'got',
            'made', 'gave', 'found', 'told', 'left', 'felt', 'kept',
        }
        if word_lower in irregular_past:
            return True

        # -ed forms labeled as nouns (likely errors)
        if word_lower.endswith('ed') and len(definition) < 50:
            return True

    return False

def clean_dictionary_file(filepath):
    """Remove inflected forms from a dictionary file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        words = json.load(f)

    original_count = len(words)
    removed = []
    kept = []

    for entry in words:
        word = entry['word']
        definition = entry.get('definition', '')
        pos = entry.get('partOfSpeech', '')

        if is_likely_inflection(word, definition, pos):
            removed.append(word)
        else:
            kept.append(entry)

    return kept, removed, original_count

def main():
    data_dir = Path(__file__).parent
    files = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']

    print('=' * 70)
    print('REMOVING INFLECTED FORMS - KEEPING CITATION FORMS ONLY')
    print('=' * 70)
    print()

    total_removed = 0
    total_original = 0
    all_removed = {}

    for filename in files:
        filepath = data_dir / filename

        if not filepath.exists():
            print(f'Skipping {filename} (not found)')
            continue

        kept, removed, original = clean_dictionary_file(filepath)
        total_removed += len(removed)
        total_original += original
        all_removed[filename] = removed

        # Save cleaned file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(kept, f, indent=2, ensure_ascii=False)

        print(f'{filename:20} {original:>5} -> {len(kept):>5} (removed {len(removed):>3})')
        if removed:
            print(f'  Removed: {", ".join(removed[:10])}')
            if len(removed) > 10:
                print(f'           ... and {len(removed) - 10} more')
        print()

    print('=' * 70)
    print(f'TOTAL: {total_original:>5} -> {total_original - total_removed:>5} (removed {total_removed:>3})')
    print('=' * 70)

    # Save removed words for review
    with open(data_dir / 'removed_inflected_forms.json', 'w', encoding='utf-8') as f:
        json.dump(all_removed, f, indent=2, ensure_ascii=False)

    print()
    print('Removed words saved to: removed_inflected_forms.json')

if __name__ == '__main__':
    main()

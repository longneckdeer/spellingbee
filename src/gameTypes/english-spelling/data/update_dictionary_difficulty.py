#!/usr/bin/env python3
"""
Comprehensive dictionary update script:
1. Assign difficulty ratings to SAT vocabulary (80-90 range)
2. Merge SAT words into dictionary (deduplicating)
3. Recalculate difficulty ratings for entire dictionary
4. Move words to appropriate levels

Difficulty Ranges:
- 0-12: 小學 A1 (MOE words 1-200)
- 12-25: 小學 A2 (MOE words 200-400)
- 25-40: 中學 B1 (MOE 401-1200)
- 40-55: 高中 B2 (CEEC high school)
- 55-70: 大學 C1 (academic)
- 70-80: 大學 C2 (near-native)
- 80-90: 英文高手 SAT
- 90-100: 英文高手 GRE/GMAT
"""

import json
import os
import re
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Dictionary files in order of difficulty
DICT_FILES = [
    ('elementary.json', 0, 25, '小學'),
    ('middle.json', 25, 40, '中學'),
    ('high.json', 40, 55, '高中'),
    ('university.json', 55, 80, '大學'),
    ('expert.json', 80, 100, '英文高手'),
]

# CEFR to difficulty range mapping
CEFR_RANGES = {
    'A1': (0, 12),
    'A2': (12, 25),
    'B1': (25, 40),
    'B2': (40, 55),
    'C1': (55, 70),
    'C2': (70, 80),
}

def load_json(filename):
    """Load a JSON file from the data directory."""
    path = os.path.join(SCRIPT_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_json(filename, data):
    """Save data to a JSON file."""
    path = os.path.join(SCRIPT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} words to {filename}")

def load_moe_words():
    """Load Taiwan MOE 1200 word list."""
    moe_path = os.path.join(SCRIPT_DIR, 'taiwan_moe_1200.txt')
    if os.path.exists(moe_path):
        with open(moe_path, 'r', encoding='utf-8') as f:
            words = [line.strip().lower() for line in f if line.strip()]
        return words
    return []

def load_cefr_reference():
    """Load CEFR reference lists."""
    cefr = load_json('cefr_reference_lists.json')
    word_to_cefr = {}
    if isinstance(cefr, dict):
        for level, words in cefr.items():
            for word in words:
                word_lower = word.lower()
                # Keep the lowest (easiest) CEFR level if word appears multiple times
                if word_lower not in word_to_cefr:
                    word_to_cefr[word_lower] = level
    return word_to_cefr

def calculate_spelling_complexity(word):
    """
    Calculate spelling complexity score (0-10).
    Higher = more difficult to spell.
    """
    score = 0
    word_lower = word.lower()

    # Length factor (longer words are harder)
    if len(word) > 10:
        score += 2
    elif len(word) > 7:
        score += 1

    # Silent letters and unusual patterns
    silent_patterns = ['ght', 'kn', 'wr', 'mb', 'mn', 'ps', 'pn', 'gn', 'rh']
    for pattern in silent_patterns:
        if pattern in word_lower:
            score += 1.5

    # Double letters (can be confusing)
    if re.search(r'(.)\1', word_lower):
        score += 0.5

    # Unusual letter combinations
    unusual = ['eau', 'ough', 'ious', 'eous', 'uous', 'ious', 'cie', 'cei',
               'xc', 'cqu', 'rrh', 'phth', 'sch']
    for pattern in unusual:
        if pattern in word_lower:
            score += 1.5

    # Words ending in unusual suffixes
    tricky_endings = ['ible', 'able', 'ence', 'ance', 'ous', 'ious', 'eous']
    for ending in tricky_endings:
        if word_lower.endswith(ending):
            score += 0.5

    # ie/ei confusion
    if 'ie' in word_lower or 'ei' in word_lower:
        score += 0.5

    return min(10, score)

def estimate_word_frequency(word):
    """
    Estimate word frequency score (0-10).
    Higher = less frequent (more difficult).
    Based on common word patterns and typical usage.
    """
    word_lower = word.lower()

    # Common prefixes/suffixes indicate academic/formal words
    academic_prefixes = ['anti', 'circum', 'contra', 'inter', 'intra', 'mal',
                         'meta', 'multi', 'neo', 'omni', 'peri', 'pseudo',
                         'quasi', 'retro', 'semi', 'trans', 'ultra']
    academic_suffixes = ['ology', 'istic', 'ation', 'ification', 'aceous',
                         'escent', 'itious', 'uous', 'acious']

    score = 5  # Base score

    for prefix in academic_prefixes:
        if word_lower.startswith(prefix):
            score += 1
            break

    for suffix in academic_suffixes:
        if word_lower.endswith(suffix):
            score += 1
            break

    # Longer words tend to be less frequent
    if len(word) > 12:
        score += 2
    elif len(word) > 9:
        score += 1

    # Latin/Greek roots (indicated by certain patterns)
    latin_greek = ['phil', 'phob', 'path', 'graph', 'morph', 'chron',
                   'theo', 'anthropo', 'cosm', 'psych']
    for root in latin_greek:
        if root in word_lower:
            score += 1
            break

    return min(10, max(0, score))

def assign_sat_difficulty(word_entry):
    """
    Assign difficulty score to SAT word (80-90 range).
    Ensures even distribution across the range.
    """
    word = word_entry['word']

    # Calculate factors
    spelling = calculate_spelling_complexity(word)  # 0-10
    frequency = estimate_word_frequency(word)  # 0-10

    # Combined score 0-20, map to 80-90
    combined = spelling + frequency
    difficulty = 80 + (combined / 20) * 10

    # Add small variation based on word length
    length_factor = min(len(word) / 15, 1) * 2  # 0-2 points
    difficulty += length_factor

    # Ensure within range with some randomness based on hash
    word_hash = sum(ord(c) for c in word) % 100
    micro_adjust = (word_hash / 100) * 2 - 1  # -1 to +1
    difficulty += micro_adjust

    return max(80, min(89, round(difficulty)))

def assign_gre_difficulty(word_entry):
    """
    Assign difficulty score to GRE/GMAT word (90-100 range).
    Ensures even distribution across the range.
    """
    word = word_entry['word']

    # Calculate factors
    spelling = calculate_spelling_complexity(word)  # 0-10
    frequency = estimate_word_frequency(word)  # 0-10

    # Combined score 0-20, map to 90-100
    combined = spelling + frequency
    difficulty = 90 + (combined / 20) * 10

    # Add variation based on word characteristics
    length_factor = min(len(word) / 15, 1) * 2
    difficulty += length_factor

    # Micro adjustment for distribution
    word_hash = sum(ord(c) for c in word) % 100
    micro_adjust = (word_hash / 100) * 2 - 1
    difficulty += micro_adjust

    return max(90, min(100, round(difficulty)))

def recalculate_difficulty(word_entry, moe_words, cefr_reference, is_sat=False, is_gre=False):
    """
    Recalculate difficulty for a word based on the new policy.
    """
    word = word_entry['word'].lower()

    # Check if it's a MOE word
    if word in moe_words:
        moe_index = moe_words.index(word)
        if moe_index < 400:
            # 小學 word (0-24) - use 0-24 to avoid boundary issue
            base = (moe_index / 400) * 24
            # Add small variation based on spelling
            spelling = calculate_spelling_complexity(word)
            variation = (spelling / 10) * 3  # 0-3 points
            return max(0, min(24, round(base + variation)))
        else:
            # 中學 word (25-39) - use 25-39 to avoid boundary
            position_in_middle = moe_index - 400
            total_middle = len(moe_words) - 400
            base = 25 + (position_in_middle / total_middle) * 14
            spelling = calculate_spelling_complexity(word)
            variation = (spelling / 10) * 2
            return max(25, min(39, round(base + variation)))

    # Check if it's marked as SAT or GRE
    if is_gre:
        return assign_gre_difficulty(word_entry)
    if is_sat:
        return assign_sat_difficulty(word_entry)

    # Use CEFR reference if available
    if word in cefr_reference:
        cefr = cefr_reference[word]
        if cefr in CEFR_RANGES:
            min_diff, max_diff = CEFR_RANGES[cefr]
            # Add variation based on spelling complexity and frequency
            spelling = calculate_spelling_complexity(word)
            frequency = estimate_word_frequency(word)
            combined = (spelling + frequency) / 20  # 0-1
            range_size = max_diff - min_diff - 1  # Leave room at top
            difficulty = min_diff + combined * range_size
            # Add micro variation
            word_hash = sum(ord(c) for c in word) % 100
            micro = (word_hash / 100) * 2 - 1
            return max(min_diff, min(max_diff - 1, round(difficulty + micro)))

    # Check existing cefr_level in word entry
    if 'cefr_level' in word_entry and word_entry['cefr_level'] in CEFR_RANGES:
        cefr = word_entry['cefr_level']
        min_diff, max_diff = CEFR_RANGES[cefr]
        spelling = calculate_spelling_complexity(word)
        frequency = estimate_word_frequency(word)
        combined = (spelling + frequency) / 20
        range_size = max_diff - min_diff - 1
        difficulty = min_diff + combined * range_size
        word_hash = sum(ord(c) for c in word) % 100
        micro = (word_hash / 100) * 2 - 1
        return max(min_diff, min(max_diff - 1, round(difficulty + micro)))

    # For words without CEFR: estimate based on characteristics
    # Use spelling and frequency to determine approximate level
    spelling = calculate_spelling_complexity(word)
    frequency = estimate_word_frequency(word)
    combined = spelling + frequency  # 0-20

    # Map combined score to difficulty ranges
    # Low combined (0-6): B1-B2 range (40-55)
    # Medium combined (7-12): B2-C1 range (45-70)
    # High combined (13-20): C1-C2 range (55-79)
    if combined <= 6:
        base_min, base_max = 40, 55
    elif combined <= 12:
        base_min, base_max = 45, 70
    else:
        base_min, base_max = 55, 79

    # Distribute within the range
    position = (combined % 7) / 7  # Position within sub-range
    difficulty = base_min + position * (base_max - base_min)

    # Add variation
    word_hash = sum(ord(c) for c in word) % 100
    micro = (word_hash / 100) * 4 - 2  # -2 to +2
    difficulty += micro

    return max(40, min(79, round(difficulty)))

def get_target_file(difficulty):
    """Determine which dictionary file a word belongs to based on difficulty."""
    for filename, min_diff, max_diff, _ in DICT_FILES:
        if min_diff <= difficulty < max_diff:
            return filename
    # Default to expert for difficulty >= 100
    return 'expert.json'

def main():
    print("=" * 60)
    print("Dictionary Difficulty Update Script")
    print("=" * 60)

    # Load reference data
    print("\nLoading reference data...")
    moe_words = load_moe_words()
    print(f"  MOE words: {len(moe_words)}")

    cefr_reference = load_cefr_reference()
    print(f"  CEFR reference: {len(cefr_reference)} words")

    # Load all dictionaries
    print("\nLoading dictionaries...")
    all_words = {}  # word -> (entry, source_file)

    for filename, _, _, _ in DICT_FILES:
        data = load_json(filename)
        print(f"  {filename}: {len(data)} words")
        for entry in data:
            word = entry['word'].lower()
            if word not in all_words:
                all_words[word] = (entry, filename)

    # Load SAT vocabulary
    sat_words = load_json('sat_vocabulary.json')
    print(f"  sat_vocabulary.json: {len(sat_words)} words")

    # Load GRE vocabulary
    gre_words = load_json('gregmat_vocab.json')
    print(f"  gregmat_vocab.json: {len(gre_words)} words")

    # Track SAT and GRE words
    sat_word_set = {w['word'].lower() for w in sat_words}
    gre_word_set = {w['word'].lower() for w in gre_words}

    # Step 1: Assign difficulty to SAT words and merge
    print("\n" + "=" * 60)
    print("Step 1: Processing SAT vocabulary...")
    print("=" * 60)

    sat_new = 0
    sat_updated = 0
    for entry in sat_words:
        word = entry['word'].lower()
        entry['word'] = word  # Normalize
        entry['cefr_level'] = 'C1'  # SAT words are generally C1+
        entry['difficulty'] = assign_sat_difficulty(entry)
        entry['source'] = 'SAT'

        if word in all_words:
            # Update existing entry with SAT flag
            existing, source = all_words[word]
            existing['source'] = existing.get('source', source.replace('.json', ''))
            if 'SAT' not in existing.get('source', ''):
                existing['source'] = existing['source'] + '+SAT'
            sat_updated += 1
        else:
            all_words[word] = (entry, 'sat_vocabulary.json')
            sat_new += 1

    print(f"  New SAT words to add: {sat_new}")
    print(f"  Existing words marked as SAT: {sat_updated}")

    # Step 2: Process GRE words similarly
    print("\n" + "=" * 60)
    print("Step 2: Processing GRE/GMAT vocabulary...")
    print("=" * 60)

    gre_new = 0
    gre_updated = 0
    for entry in gre_words:
        word = entry['word'].lower()
        entry['word'] = word
        if 'cefr_level' not in entry:
            entry['cefr_level'] = 'C2'
        if 'difficulty' not in entry or entry['difficulty'] < 90:
            entry['difficulty'] = assign_gre_difficulty(entry)
        entry['source'] = entry.get('source', '') + '+GRE' if entry.get('source') else 'GRE'

        if word in all_words:
            existing, source = all_words[word]
            existing['source'] = existing.get('source', source.replace('.json', ''))
            if 'GRE' not in existing.get('source', ''):
                existing['source'] = existing['source'] + '+GRE'
            # GRE difficulty overrides SAT for overlapping words
            existing['difficulty'] = max(existing.get('difficulty', 0), entry['difficulty'])
            gre_updated += 1
        else:
            all_words[word] = (entry, 'gregmat_vocab.json')
            gre_new += 1

    print(f"  New GRE words to add: {gre_new}")
    print(f"  Existing words marked as GRE: {gre_updated}")

    # Step 3: Recalculate all difficulties
    print("\n" + "=" * 60)
    print("Step 3: Recalculating all difficulty scores...")
    print("=" * 60)

    recalc_count = 0
    for word, (entry, source) in all_words.items():
        is_sat = word in sat_word_set
        is_gre = word in gre_word_set

        # Recalculate all words with fresh scores
        old_diff = entry.get('difficulty', None)
        new_diff = recalculate_difficulty(entry, moe_words, cefr_reference, is_sat, is_gre)
        entry['difficulty'] = new_diff
        recalc_count += 1

    print(f"  Recalculated {recalc_count} words")

    # Step 4: Redistribute words to correct files
    print("\n" + "=" * 60)
    print("Step 4: Redistributing words to correct difficulty levels...")
    print("=" * 60)

    # Organize words by target file
    new_dicts = defaultdict(list)

    for word, (entry, old_source) in all_words.items():
        difficulty = entry.get('difficulty', 50)

        # Special handling for MOE words
        if word in moe_words:
            moe_index = moe_words.index(word)
            if moe_index < 400:
                # 小學 - EXCLUSIVE to MOE words
                target = 'elementary.json'
                entry['taiwan_stage'] = '小學'
            else:
                # 中學 - MOE words go here
                target = 'middle.json'
                entry['taiwan_stage'] = '中學'
        else:
            # Remove taiwan_stage if word is not in MOE list
            if 'taiwan_stage' in entry:
                del entry['taiwan_stage']

            # NON-MOE words: 小學 is EXCLUSIVE, so minimum target is middle.json
            # Even if CEFR is A1/A2, non-MOE words go to middle.json minimum
            if difficulty < 25:
                # A1/A2 words that are NOT in MOE go to middle.json
                target = 'middle.json'
                # Adjust difficulty to fit middle range (25-40)
                entry['difficulty'] = max(25, min(40, 25 + (difficulty / 25) * 15))
            else:
                target = get_target_file(difficulty)

        new_dicts[target].append(entry)

    # Sort each dictionary and save
    print("\nFinal word counts by file:")
    total = 0
    for filename, min_diff, max_diff, level_name in DICT_FILES:
        words = new_dicts[filename]
        words.sort(key=lambda x: (x.get('difficulty', 0), x['word']))
        save_json(filename, words)

        # Stats
        if words:
            diffs = [w.get('difficulty', 0) for w in words]
            print(f"  {filename} ({level_name}): {len(words)} words, "
                  f"difficulty {min(diffs)}-{max(diffs)}")
        else:
            print(f"  {filename} ({level_name}): 0 words")
        total += len(words)

    print(f"\nTotal words in dictionary: {total}")

    # Print summary of changes
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  SAT words processed: {len(sat_words)} ({sat_new} new)")
    print(f"  GRE words processed: {len(gre_words)} ({gre_new} new)")
    print(f"  Total unique words: {total}")

if __name__ == '__main__':
    main()

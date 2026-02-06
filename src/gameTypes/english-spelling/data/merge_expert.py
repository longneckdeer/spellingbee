#!/usr/bin/env python3
"""
Merge SAT/GRE words into expert.json from high.json and university.json.

SAT-only words → difficulty 91-100
GRE words → difficulty 101-120
Non-SAT/GRE expert words → difficulty 101-120
"""

import json
import os

DATA_DIR = os.path.dirname(os.path.abspath(__file__))


def load_json(filename):
    with open(os.path.join(DATA_DIR, filename), 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(filename, data):
    with open(os.path.join(DATA_DIR, filename), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def linear_rescale(current_diff, source_min, source_max, target_min, target_max):
    """Rescale difficulty from source range to target range, preserving relative order."""
    if source_max == source_min:
        return round((target_min + target_max) / 2)
    ratio = (current_diff - source_min) / (source_max - source_min)
    new_diff = target_min + ratio * (target_max - target_min)
    return max(target_min, min(target_max, round(new_diff)))


def main():
    # Load SAT/GRE word sets (lowercase for matching)
    sat_data = load_json('sat_vocabulary.json')
    gre_data = load_json('gregmat_vocab.json')
    sat_words = {w['word'].lower() for w in sat_data}
    gre_words = {w['word'].lower() for w in gre_data}
    satgre_words = sat_words | gre_words

    print(f"SAT words: {len(sat_words)}")
    print(f"GRE words: {len(gre_words)}")
    print(f"Combined unique: {len(satgre_words)}")
    print(f"Overlap: {len(sat_words & gre_words)}")

    # Load all dictionary files
    files = {
        'elementary.json': load_json('elementary.json'),
        'middle.json': load_json('middle.json'),
        'high.json': load_json('high.json'),
        'university.json': load_json('university.json'),
        'expert.json': load_json('expert.json'),
    }

    # Count totals before
    total_before = sum(len(v) for v in files.values())
    print(f"\nBefore merge:")
    for fname, data in files.items():
        diffs = [w['difficulty'] for w in data]
        print(f"  {fname}: {len(data)} words, difficulty {min(diffs)}-{max(diffs)}")
    print(f"  Total: {total_before}")

    # Collect words to move to expert.json
    words_to_move = []  # (word_entry, source_file, category)

    # From high.json: extract SAT/GRE words
    high_satgre = [w for w in files['high.json'] if w['word'].lower() in satgre_words]
    high_remaining = [w for w in files['high.json'] if w['word'].lower() not in satgre_words]
    for w in high_satgre:
        cat = 'gre' if w['word'].lower() in gre_words else 'sat'
        words_to_move.append((w, 'high.json', cat))

    # From university.json: extract SAT/GRE words
    uni_satgre = [w for w in files['university.json'] if w['word'].lower() in satgre_words]
    uni_remaining = [w for w in files['university.json'] if w['word'].lower() not in satgre_words]
    for w in uni_satgre:
        cat = 'gre' if w['word'].lower() in gre_words else 'sat'
        words_to_move.append((w, 'university.json', cat))

    # From expert.json: classify existing words
    expert_satgre = [w for w in files['expert.json'] if w['word'].lower() in satgre_words]
    expert_non_satgre = [w for w in files['expert.json'] if w['word'].lower() not in satgre_words]

    print(f"\nWords to move from high.json: {len(high_satgre)}")
    print(f"Words to move from university.json: {len(uni_satgre)}")
    print(f"Expert SAT/GRE words (re-score): {len(expert_satgre)}")
    print(f"Expert non-SAT/GRE words (re-score): {len(expert_non_satgre)}")

    # === Re-score SAT-only words (target: 91-100) ===
    sat_only_words = []
    for w, source, cat in words_to_move:
        if cat == 'sat':
            sat_only_words.append(w)
    for w in expert_satgre:
        if w['word'].lower() not in gre_words:
            sat_only_words.append(w)

    if sat_only_words:
        diffs = [w['difficulty'] for w in sat_only_words]
        src_min, src_max = min(diffs), max(diffs)
        print(f"\nSAT-only words: {len(sat_only_words)}, current difficulty {src_min}-{src_max}")
        for w in sat_only_words:
            w['difficulty'] = linear_rescale(w['difficulty'], src_min, src_max, 91, 100)

    # === Re-score GRE words (target: 101-120) ===
    gre_move_words = []
    for w, source, cat in words_to_move:
        if cat == 'gre':
            gre_move_words.append(w)
    for w in expert_satgre:
        if w['word'].lower() in gre_words:
            gre_move_words.append(w)

    if gre_move_words:
        diffs = [w['difficulty'] for w in gre_move_words]
        src_min, src_max = min(diffs), max(diffs)
        print(f"GRE words: {len(gre_move_words)}, current difficulty {src_min}-{src_max}")
        for w in gre_move_words:
            w['difficulty'] = linear_rescale(w['difficulty'], src_min, src_max, 101, 120)

    # === Re-score non-SAT/GRE expert words (target: 101-120) ===
    if expert_non_satgre:
        diffs = [w['difficulty'] for w in expert_non_satgre]
        src_min, src_max = min(diffs), max(diffs)
        print(f"Non-SAT/GRE expert words: {len(expert_non_satgre)}, current difficulty {src_min}-{src_max}")
        for w in expert_non_satgre:
            w['difficulty'] = linear_rescale(w['difficulty'], src_min, src_max, 101, 120)

    # === Build new expert.json ===
    new_expert = []
    new_expert.extend(sat_only_words)
    new_expert.extend(gre_move_words)
    new_expert.extend(expert_non_satgre)

    # Sort by difficulty, then by word
    new_expert.sort(key=lambda w: (w['difficulty'], w['word'].lower()))

    # Update files
    files['high.json'] = sorted(high_remaining, key=lambda w: (w['difficulty'], w['word'].lower()))
    files['university.json'] = sorted(uni_remaining, key=lambda w: (w['difficulty'], w['word'].lower()))
    files['expert.json'] = new_expert

    # Verify no duplicates across all files
    all_words = []
    for fname, data in files.items():
        for w in data:
            all_words.append((w['word'].lower(), fname))

    word_counts = {}
    for word, fname in all_words:
        if word not in word_counts:
            word_counts[word] = []
        word_counts[word].append(fname)

    duplicates = {w: fs for w, fs in word_counts.items() if len(fs) > 1}
    if duplicates:
        print(f"\nWARNING: {len(duplicates)} duplicate words found across files!")
        for w, fs in sorted(duplicates.items())[:10]:
            print(f"  '{w}' in: {', '.join(fs)}")
    else:
        print("\nNo duplicate words across files.")

    # Verify difficulty ranges
    print(f"\nAfter merge:")
    for fname, data in files.items():
        diffs = [w['difficulty'] for w in data]
        print(f"  {fname}: {len(data)} words, difficulty {min(diffs)}-{max(diffs)}")

    total_after = sum(len(v) for v in files.values())
    print(f"  Total: {total_after}")

    assert total_before == total_after, f"Total word count changed! {total_before} → {total_after}"

    # Save modified files
    save_json('high.json', files['high.json'])
    save_json('university.json', files['university.json'])
    save_json('expert.json', files['expert.json'])

    print(f"\nSaved high.json, university.json, expert.json")
    print("Done!")


if __name__ == '__main__':
    main()

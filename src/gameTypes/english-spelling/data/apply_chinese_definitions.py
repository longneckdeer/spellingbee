#!/usr/bin/env python3
"""
Apply Chinese definitions from en_zh_dictionary.json to elementary, middle, high word lists.
University and expert levels keep English definitions only.
"""

import json
import os

# Files to add Chinese definitions
CHINESE_DEF_FILES = ['elementary.json', 'middle.json', 'high.json']

# Files that stay English-only
ENGLISH_ONLY_FILES = ['university.json', 'expert.json']

def main():
    print("=" * 60)
    print("Applying Chinese Definitions to Word Lists")
    print("=" * 60)

    # Load the Chinese dictionary
    print("\nLoading en_zh_dictionary.json...")
    with open('en_zh_dictionary.json', 'r', encoding='utf-8') as f:
        zh_dict = json.load(f)
    print(f"  Loaded {len(zh_dict):,} entries")

    total_added = 0
    total_missing = []

    # Process files that need Chinese definitions
    for filename in CHINESE_DEF_FILES:
        if not os.path.exists(filename):
            print(f"\nSkipping {filename} (not found)")
            continue

        print(f"\nProcessing {filename}...")

        with open(filename, 'r', encoding='utf-8') as f:
            words = json.load(f)

        added = 0
        missing = []

        for entry in words:
            word = entry.get('word', '').lower()

            if word in zh_dict:
                # Use 'short' definition for TTS (concise)
                entry['chinese_definition'] = zh_dict[word]['short']
                added += 1
            else:
                missing.append(entry.get('word', ''))
                # Remove any existing chinese_definition if word not found
                if 'chinese_definition' in entry:
                    del entry['chinese_definition']

        # Save updated file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(words, f, ensure_ascii=False, indent=2)

        print(f"  Total words: {len(words)}")
        print(f"  Added Chinese: {added}")
        print(f"  Missing: {len(missing)}")

        if missing:
            print(f"  Missing words: {', '.join(missing[:10])}" + ("..." if len(missing) > 10 else ""))

        total_added += added
        total_missing.extend(missing)

    # Verify English-only files don't have chinese_definition
    print("\n" + "-" * 60)
    print("Verifying English-only files (university, expert)...")

    for filename in ENGLISH_ONLY_FILES:
        if not os.path.exists(filename):
            continue

        with open(filename, 'r', encoding='utf-8') as f:
            words = json.load(f)

        # Remove any chinese_definition fields
        removed = 0
        for entry in words:
            if 'chinese_definition' in entry:
                del entry['chinese_definition']
                removed += 1

        if removed > 0:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(words, f, ensure_ascii=False, indent=2)
            print(f"  {filename}: Removed {removed} chinese_definition fields")
        else:
            print(f"  {filename}: OK (no chinese_definition)")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total Chinese definitions added: {total_added}")
    print(f"Total missing: {len(total_missing)}")

    # Save missing words
    if total_missing:
        with open('words_missing_chinese.json', 'w', encoding='utf-8') as f:
            json.dump(sorted(set(total_missing)), f, ensure_ascii=False, indent=2)
        print(f"Missing words saved to: words_missing_chinese.json")

    print("\nDone!")


if __name__ == '__main__':
    main()

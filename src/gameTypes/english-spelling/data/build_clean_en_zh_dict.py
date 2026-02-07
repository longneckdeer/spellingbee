#!/usr/bin/env python3
"""
Build a clean English-to-Chinese dictionary from StarDict 21世紀英漢漢英雙向詞典.
Creates a TTS-optimized JSON file that can be used as a source for word definitions.

Output: en_zh_dictionary.json
"""

import gzip
import struct
import json
import re
import os

def load_stardict():
    """Load and parse StarDict dictionary files."""
    print("Loading StarDict dictionary...")

    with open('stardict.idx', 'rb') as f:
        idx_data = f.read()

    with gzip.open('stardict.dict.dz', 'rb') as f:
        dict_data = f.read()

    entries = []
    pos = 0
    while pos < len(idx_data):
        end = idx_data.find(b'\x00', pos)
        if end == -1:
            break

        word = idx_data[pos:end].decode('utf-8', errors='ignore')
        pos = end + 1

        offset = struct.unpack('>I', idx_data[pos:pos+4])[0]
        size = struct.unpack('>I', idx_data[pos+4:pos+8])[0]
        pos += 8

        entries.append((word, offset, size))

    print(f"  Loaded {len(entries):,} raw entries")
    return entries, dict_data


def clean_for_tts(text):
    """
    Clean text for TTS - remove all non-speakable elements.
    """
    if not text:
        return None

    clean = text

    # Remove countable/uncountable markers: (C), (U)
    clean = re.sub(r'\([CU]\)', '', clean)

    # Remove angle bracket markers like <人>, <植物>
    clean = re.sub(r'<[^>]+>', '', clean)

    # Remove double angle brackets <<形容詞>>
    clean = re.sub(r'<<[^>]+>>', '', clean)

    # Remove square bracket usage notes [常構成復合字]
    clean = re.sub(r'\[[^\]]+\]', '', clean)

    # Remove parenthetical English content
    clean = re.sub(r'\([^)]*[a-zA-Z][^)]*\)', '', clean)

    # Remove single-quoted field labels like '植物', '昆蟲'
    clean = re.sub(r"'[^']+'\s*", '', clean)

    # Remove English words
    clean = re.sub(r'\b[a-zA-Z]+\b', '', clean)

    # Remove special symbols
    clean = re.sub(r'[◆→←↔※●○◎★☆【】]', '', clean)
    clean = re.sub(r'《[^》]*》', '', clean)

    # Standardize punctuation
    clean = re.sub(r'[;；]+', '，', clean)
    clean = re.sub(r',+', '，', clean)
    clean = re.sub(r'，+', '，', clean)
    clean = re.sub(r'^[，,\s]+', '', clean)
    clean = re.sub(r'[，,\s]+$', '', clean)
    clean = re.sub(r'\s+', '', clean)

    # Remove empty parentheses
    clean = re.sub(r'\(\s*\)', '', clean)
    clean = re.sub(r'（\s*）', '', clean)

    return clean.strip() if clean.strip() else None


def extract_definition(raw_text):
    """
    Extract clean Chinese definition from raw StarDict entry.
    Prioritizes numbered definitions (1, 2, 3) and lettered sub-definitions (a., b., c.).
    """
    lines = raw_text.split('\n')

    # First pass: find primary definitions (lines starting with "1 ", "a. ", etc.)
    primary_defs = []
    secondary_defs = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Skip pronunciation
        if '[' in line and any(c in line for c in 'әæɑɒʌɪʊɛɔʃʒθðŋˋˊˏ'):
            continue

        # Skip metadata
        if line.startswith('《') and '》' in line:
            continue
        if line.startswith('<<') and line.endswith('>>'):
            continue

        # Skip proverbs and special sections
        if '諺)' in line or '(諺' in line:
            continue
        if '【同義字】' in line or '【反義字】' in line or '【字源】' in line:
            continue

        # Skip cross-references
        if line.startswith('→') or line.startswith('cf.') or line.startswith('←→'):
            continue

        # Must have Chinese
        if not any('\u4e00' <= c <= '\u9fff' for c in line):
            continue

        # Skip example sentences (contain ~)
        if '~' in line:
            continue

        # Check if this is a numbered definition (1, 2, 3...)
        is_numbered = re.match(r'^[0-9]+\s', line)
        # Check if this is a lettered sub-definition (a., b., c...)
        is_lettered = re.match(r'^[a-z]\.\s', line)

        # Clean the line
        clean = re.sub(r'^[0-9]+\s*\.?\s*', '', line)
        clean = re.sub(r'^[a-z]\.\s*', '', clean)
        clean = clean_for_tts(clean)

        if not clean:
            continue

        chinese_count = sum(1 for c in clean if '\u4e00' <= c <= '\u9fff')

        # For primary definitions, accept even single character (like 貓)
        if is_numbered or is_lettered:
            if chinese_count >= 1:
                primary_defs.append(clean)
        else:
            # Secondary definitions need at least 2 chars
            if chinese_count >= 2:
                secondary_defs.append(clean)

        # Limit collection
        if len(primary_defs) >= 3:
            break

    # Use primary definitions if available, otherwise secondary
    definitions = primary_defs if primary_defs else secondary_defs[:3]

    if not definitions:
        return None, None

    # Short definition: first definition, max 20 chars
    short_def = definitions[0]
    if len(short_def) > 20:
        parts = short_def.split('，')
        short_def = '，'.join(parts[:2]) if len(parts) > 1 else short_def[:20]

    # Full definition: all definitions joined
    full_def = '；'.join(definitions)
    if len(full_def) > 100:
        full_def = full_def[:97] + '...'

    return short_def, full_def


def is_english_word(word):
    """Check if word is a valid English word."""
    if not word or not word[0].isalpha():
        return False

    ascii_letters = sum(1 for c in word if c.isascii() and c.isalpha())
    if ascii_letters < len(word) * 0.8:
        return False

    if any('\u4e00' <= c <= '\u9fff' for c in word):
        return False

    return True


def main():
    print("=" * 60)
    print("Building Clean English-Chinese Dictionary")
    print("Source: 21世紀英漢漢英雙向詞典 (StarDict)")
    print("=" * 60)

    if not os.path.exists('stardict.idx') or not os.path.exists('stardict.dict.dz'):
        print("ERROR: StarDict files not found.")
        return

    entries, dict_data = load_stardict()

    print("\nProcessing entries...")

    dictionary = {}
    processed = 0
    skipped = 0

    for word, offset, size in entries:
        if not is_english_word(word):
            skipped += 1
            continue

        raw_bytes = dict_data[offset:offset+size]

        try:
            raw_text = raw_bytes.decode('utf-8')
        except:
            try:
                raw_text = raw_bytes.decode('big5')
            except:
                skipped += 1
                continue

        short_def, full_def = extract_definition(raw_text)

        if short_def:
            word_lower = word.lower()

            if word_lower not in dictionary:
                dictionary[word_lower] = {
                    'word': word,
                    'short': short_def,
                    'full': full_def
                }
            processed += 1

        if processed % 10000 == 0:
            print(f"  Processed {processed:,} entries...")

    print(f"\nTotal English words with definitions: {len(dictionary):,}")
    print(f"Skipped: {skipped:,}")

    # Save dictionary
    output_file = 'en_zh_dictionary.json'
    print(f"\nSaving to {output_file}...")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(output_file) / 1024 / 1024
    print(f"  File size: {file_size:.1f} MB")

    # Show samples
    print("\n" + "=" * 60)
    print("SAMPLE ENTRIES (TTS-Ready)")
    print("=" * 60)

    samples = ['cat', 'dog', 'apple', 'run', 'school', 'book', 'beautiful', 'computer', 'happy', 'philosophy']
    for word in samples:
        if word in dictionary:
            entry = dictionary[word]
            print(f"\n{word}:")
            print(f"  Short: {entry['short']}")
            print(f"  Full:  {entry['full']}")

    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Add Chinese definitions from StarDict 21世紀英漢漢英雙向詞典 to dictionary files.
Optimized for TTS (Text-to-Speech) - definitions must be speakable.
"""

import gzip
import struct
import json
import re
import os

# Files to process
DICT_FILES = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']

def load_stardict():
    """Load and parse StarDict dictionary files."""
    print("Loading StarDict dictionary...")

    with open('stardict.idx', 'rb') as f:
        idx_data = f.read()

    with gzip.open('stardict.dict.dz', 'rb') as f:
        dict_data = f.read()

    # Build index
    stardict = {}
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

        stardict[word.lower()] = (offset, size)

    print(f"  Loaded {len(stardict):,} entries")
    return stardict, dict_data


def clean_for_tts(text):
    """
    Clean text for TTS - remove all non-speakable elements.
    """
    if not text:
        return None

    clean = text

    # Remove angle bracket markers like <人>, <植物>, <<形容詞>>
    clean = re.sub(r'<[^>]+>', '', clean)
    clean = re.sub(r'<<[^>]+>>', '', clean)

    # Remove square bracket markers like [常構成復合字]
    clean = re.sub(r'\[[^\]]+\]', '', clean)

    # Remove parenthetical English or markers
    clean = re.sub(r'\([^)]*[a-zA-Z][^)]*\)', '', clean)  # Contains English
    clean = re.sub(r'\(◆[^)]*\)', '', clean)  # Special notes
    clean = re.sub(r'\(cf\.[^)]*\)', '', clean)  # Cross-references
    clean = re.sub(r'（[^）]*[a-zA-Z][^）]*）', '', clean)  # Full-width parens with English

    # Remove single quotes with English like '植物'
    clean = re.sub(r"'[a-zA-Z\u4e00-\u9fff]+'", '', clean)

    # Remove any remaining English words
    clean = re.sub(r'\b[a-zA-Z]+\b', '', clean)

    # Remove special symbols
    clean = re.sub(r'[◆→←↔※●○◎★☆]', '', clean)

    # Remove guillemets 《》
    clean = re.sub(r'《[^》]*》', '', clean)

    # Clean up punctuation
    clean = re.sub(r'[;；]+', '，', clean)  # Semicolons to commas
    clean = re.sub(r',+', '，', clean)  # Standardize commas
    clean = re.sub(r'，+', '，', clean)  # Remove duplicate commas
    clean = re.sub(r'^[，,\s]+', '', clean)  # Remove leading commas
    clean = re.sub(r'[，,\s]+$', '', clean)  # Remove trailing commas
    clean = re.sub(r'\s+', '', clean)  # Remove spaces

    # Remove empty parentheses
    clean = re.sub(r'\(\s*\)', '', clean)
    clean = re.sub(r'（\s*）', '', clean)

    return clean.strip() if clean.strip() else None


def extract_chinese_definition(raw_definition):
    """
    Extract a clean, TTS-friendly Chinese definition.
    """
    lines = raw_definition.split('\n')

    for line in lines:
        line = line.strip()

        # Skip empty lines
        if not line:
            continue

        # Skip pronunciation lines
        if '[' in line and ']' in line:
            if any(c in line for c in 'әæɑɒʌɪʊɛɔʃʒθðŋˋˊˏ'):
                continue

        # Skip English-only lines
        if re.match(r'^[a-zA-Z][a-zA-Z.\-\']*$', line):
            continue

        # Skip etymology/metadata markers
        if line.startswith('《') and '》' in line:
            continue
        if line.startswith('<<') and line.endswith('>>'):
            continue

        # Skip proverbs, synonyms sections
        if '諺)' in line or '(諺' in line:
            continue
        if '【同義字】' in line or '【反義字】' in line or '【字源】' in line:
            continue

        # Skip cross-references
        if line.startswith('→') or line.startswith('cf.') or line.startswith('←→'):
            continue

        # Must have Chinese characters
        if not any('\u4e00' <= c <= '\u9fff' for c in line):
            continue

        # Skip example sentences (contain ~ placeholder or start with capitals)
        if '~' in line:
            continue
        if re.match(r'^[A-Z][a-z]', line):
            continue

        # Remove leading numbers/letters
        clean = re.sub(r'^[0-9]+\s*\.?\s*', '', line)
        clean = re.sub(r'^[a-z]\.\s*', '', clean)

        # Apply TTS cleaning
        clean = clean_for_tts(clean)

        if not clean:
            continue

        # Count Chinese characters
        chinese_count = sum(1 for c in clean if '\u4e00' <= c <= '\u9fff')
        if chinese_count < 2:
            continue

        # Limit length - take first part if too long
        if len(clean) > 20:
            parts = clean.split('，')
            # Take first 1-2 parts that are meaningful
            result_parts = []
            for part in parts:
                part = part.strip()
                if part and sum(1 for c in part if '\u4e00' <= c <= '\u9fff') >= 2:
                    result_parts.append(part)
                    if len('，'.join(result_parts)) >= 15:
                        break
            clean = '，'.join(result_parts[:2]) if result_parts else clean[:20]

        # Final validation
        if clean and sum(1 for c in clean if '\u4e00' <= c <= '\u9fff') >= 2:
            return clean

    return None


def get_definition(word, stardict, dict_data):
    """Look up a word and extract Chinese definition."""
    word_lower = word.lower()

    if word_lower not in stardict:
        return None

    offset, size = stardict[word_lower]
    raw_bytes = dict_data[offset:offset+size]

    try:
        raw_text = raw_bytes.decode('big5')
    except:
        try:
            raw_text = raw_bytes.decode('utf-8')
        except:
            return None

    return extract_chinese_definition(raw_text)


def process_dictionary_file(filename, stardict, dict_data):
    """Add Chinese definitions to a dictionary file."""
    print(f"\nProcessing {filename}...")

    with open(filename, 'r', encoding='utf-8') as f:
        words = json.load(f)

    if not isinstance(words, list):
        words = words.get('words', [])

    found = 0
    not_found = []

    for entry in words:
        word = entry.get('word', '')
        chinese_def = get_definition(word, stardict, dict_data)

        if chinese_def:
            entry['chinese_definition'] = chinese_def
            found += 1
        else:
            not_found.append(word)
            if 'chinese_definition' in entry:
                del entry['chinese_definition']

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f"  Total: {len(words)}, Added Chinese: {found}, Missing: {len(not_found)}")

    if not_found:
        print(f"  Missing: {', '.join(not_found[:10])}" + ("..." if len(not_found) > 10 else ""))

    return found, not_found


def main():
    print("=" * 60)
    print("Adding Chinese Definitions (TTS-Optimized)")
    print("Source: 21世紀英漢漢英雙向詞典")
    print("=" * 60)

    if not os.path.exists('stardict.idx') or not os.path.exists('stardict.dict.dz'):
        print("ERROR: StarDict files not found.")
        return

    stardict, dict_data = load_stardict()

    total_found = 0
    total_missing = []

    for filename in DICT_FILES:
        if os.path.exists(filename):
            found, missing = process_dictionary_file(filename, stardict, dict_data)
            total_found += found
            total_missing.extend(missing)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Words with Chinese definitions: {total_found}")
    print(f"Words missing definitions: {len(total_missing)}")

    if total_missing:
        with open('words_missing_chinese.json', 'w', encoding='utf-8') as f:
            json.dump(total_missing, f, ensure_ascii=False, indent=2)
        print(f"Missing words saved to: words_missing_chinese.json")


if __name__ == '__main__':
    main()

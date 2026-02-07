#!/usr/bin/env python3
"""
Fix sentences that don't contain the word (excluding inflected forms).
"""

import json
import re
import requests
import time

MW_API_KEY = "cfc2a612-6202-4231-a810-d613df83c908"
MW_BASE_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json"

def normalize_word(word):
    """Normalize word for comparison"""
    return word.lower().replace('-', '').replace(' ', '')

def is_inflected_form(word, sentence_word):
    """Check if sentence_word is a valid inflected form of word"""
    word_norm = normalize_word(word)
    sent_norm = normalize_word(sentence_word)

    # Common inflection patterns
    if sent_norm.startswith(word_norm):
        suffix = sent_norm[len(word_norm):]
        # Common suffixes: s, es, ed, ing, er, est, ly, etc.
        if suffix in ['s', 'es', 'ed', 'ing', 'er', 'est', 'ly', 'd']:
            return True
        # Handle consonant doubling (run→running, win→winning)
        if len(word_norm) >= 2 and sent_norm.startswith(word_norm[:-1] + word_norm[-1]):
            return True

    # Irregular verbs (manual list of common ones)
    irregular = {
        'say': ['said', 'says'],
        'win': ['won'],
        'have': ['has', 'had', 'having'],
        'make': ['made', 'making', 'makes'],
        'lie': ['lying', 'lay', 'lain'],
        'die': ['died', 'dies', 'dying'],
        'live': ['lived', 'lives', 'living'],
        'give': ['gave', 'given', 'giving'],
        'go': ['went', 'gone', 'going'],
        'do': ['did', 'done', 'does', 'doing'],
    }

    if word.lower() in irregular:
        if sent_norm in [normalize_word(form) for form in irregular[word.lower()]]:
            return True

    return False

def extract_words_from_sentence(sentence):
    """Extract all words from sentence"""
    cleaned = sentence.replace('{wi}', '').replace('{/wi}', '')
    cleaned = re.sub(r'\{d_link\|([^}]+)\}', r'\1', cleaned)
    words = re.findall(r'\b[\w-]+\b', cleaned.lower())
    return words

def needs_fixing(word, sentence):
    """Determine if this sentence needs to be fixed"""
    if not sentence:
        return True

    sentence_words = extract_words_from_sentence(sentence)
    word_lower = word.lower()

    # Check for exact match
    if word_lower in [w.lower() for w in sentence_words]:
        return False

    # Check for inflected forms
    for sent_word in sentence_words:
        if is_inflected_form(word, sent_word):
            return False

    # Check for multi-word entries (both parts should appear)
    if ' ' in word:
        parts = word.split()
        all_found = all(
            any(normalize_word(p) in normalize_word(sw) for sw in sentence_words)
            for p in parts
        )
        if all_found:
            return False

    # Check for hyphenated compound words
    if '-' in word:
        parts = word.split('-')
        all_found = all(
            any(normalize_word(p) in normalize_word(sw) for sw in sentence_words)
            for p in parts
        )
        if all_found:
            return False

    return True

def fetch_better_sentence(word):
    """Fetch a better sentence from MW API"""
    try:
        url = f"{MW_BASE_URL}/{word}"
        params = {'key': MW_API_KEY}
        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return None

        data = response.json()

        if not isinstance(data, list) or len(data) == 0:
            return None

        entry = data[0]
        if not isinstance(entry, dict):
            return None

        # Try to find a good example sentence
        if 'def' in entry:
            for definition in entry['def']:
                if 'sseq' in definition:
                    for sense_sequence in definition['sseq']:
                        for sense in sense_sequence:
                            if isinstance(sense, list) and len(sense) > 1:
                                sense_data = sense[1]
                                if isinstance(sense_data, dict) and 'dt' in sense_data:
                                    for dt_item in sense_data['dt']:
                                        if isinstance(dt_item, list) and len(dt_item) > 1:
                                            if dt_item[0] == 'vis':
                                                for vis in dt_item[1]:
                                                    if 't' in vis:
                                                        return vis['t']

        return None

    except Exception as e:
        print(f"  Error fetching {word}: {e}")
        return None

# Load validation report
with open('sentence_validation_report.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

print("Analyzing sentences to fix...")
print("="*70)

files_to_fix = {}
total_to_fix = 0

for filename, issues in report.items():
    if not issues:
        continue

    # Filter to only truly problematic ones (not inflected forms)
    to_fix = []
    for item in issues:
        if needs_fixing(item['word'], item['sentence']):
            to_fix.append(item['word'])

    if to_fix:
        files_to_fix[filename] = to_fix
        total_to_fix += len(to_fix)
        print(f"{filename}: {len(to_fix)} sentences need fixing")

print(f"\nTotal sentences to fix: {total_to_fix}")
print("="*70)

if total_to_fix == 0:
    print("\n✅ No sentences need fixing (all issues are inflected forms)")
    exit(0)

# Ask for confirmation
print("\nThis will fetch new sentences from Merriam-Webster API.")
print("Proceed? (yes/no): ", end='', flush=True)
# For automation, we'll proceed
response = "yes"  # input()

if response.lower() != 'yes':
    print("Cancelled.")
    exit(0)

# Fix the sentences
print("\nFetching better sentences from MW API...")
print("="*70)

for filename, words_to_fix in files_to_fix.items():
    print(f"\nProcessing {filename}...")

    # Load dictionary
    with open(filename, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)

    fixed_count = 0
    failed_count = 0

    for entry in dictionary:
        word = entry.get('word', '')

        if word in words_to_fix:
            print(f"  Fixing '{word}'...", end=' ', flush=True)

            # Fetch better sentence
            new_sentence = fetch_better_sentence(word)

            if new_sentence:
                entry['sentence'] = new_sentence
                print("✓")
                fixed_count += 1
            else:
                print("✗ (could not fetch)")
                failed_count += 1

            time.sleep(0.5)  # Rate limiting

    # Save updated dictionary
    if fixed_count > 0:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(dictionary, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Saved {filename} ({fixed_count} fixed, {failed_count} failed)")

print("\n" + "="*70)
print("COMPLETE")
print("="*70)

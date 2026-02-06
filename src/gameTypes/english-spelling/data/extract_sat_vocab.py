#!/usr/bin/env python3
"""
Extract SAT vocabulary from sat.vocab.pdf and save to sat_vocabulary.json
"""

import json
import re
import subprocess
import sys

# Part of speech mapping to Traditional Chinese
POS_MAP = {
    'v.': '動詞',
    'n.': '名詞',
    'adj.': '形容詞',
    'adv.': '副詞',
    'prep.': '介系詞',
    'conj.': '連接詞',
    'interj.': '感嘆詞',
    'pron.': '代名詞',
}

def extract_pdf_text(pdf_path):
    """Extract text from PDF using pdftotext command"""
    try:
        result = subprocess.run(
            ['pdftotext', '-layout', pdf_path, '-'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except FileNotFoundError:
        print("pdftotext not found. Trying with Python libraries...")
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            print("Please install pdfplumber: pip install pdfplumber")
            sys.exit(1)

def parse_vocabulary(text):
    """Parse vocabulary entries from extracted text"""
    words = []

    # Pattern to match vocabulary entries
    # Format: word (pos.) definition (Example sentence.)
    # Also handles numbered definitions like: word 1. (pos.) def 2. (pos.) def

    # Split into lines and process
    lines = text.split('\n')
    current_entry = ""

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Skip header/footer lines
        if 'SAT Words' in line or 'SparkNotes' in line or line.isdigit():
            continue
        if line.startswith('A -') or line.startswith('B -') or re.match(r'^[A-Z] -', line):
            continue
        if 'www.' in line or 'http' in line:
            continue

        current_entry += " " + line

    # Now parse the combined text
    # Pattern: word (pos.) definition (Example sentence in parentheses.)
    # Handle multi-definition: word 1. (pos.) def (example) 2. (pos.) def (example)

    # Split by word boundaries - words start with lowercase letter followed by space and (
    # Or numbered entries like "1. (v.)"

    # Better approach: find all words that start entries
    # Entry pattern: word (pos.) or word 1. (pos.)

    entry_pattern = re.compile(
        r'\b([a-z]+)\s+'  # word
        r'(?:1\.\s*)?'    # optional "1. "
        r'\(([a-z]+\.)\)\s*'  # (pos.)
        r'([^(]+)'        # definition
        r'\(([^)]+)\)'    # (example sentence)
    , re.IGNORECASE)

    # More flexible pattern for various formats
    text_combined = current_entry

    # Find all potential word entries
    # Format variations:
    # 1. "word (v.) definition (Example.)"
    # 2. "word 1. (v.) def (Ex.) 2. (v.) def (Ex.)"

    # Use a different approach - find word + pos patterns
    segments = re.split(r'(?<=[.!?])\)\s+(?=[a-z]+\s+(?:\d\.\s*)?\([a-z]+\.\))', text_combined, flags=re.IGNORECASE)

    for segment in segments:
        segment = segment.strip()
        if not segment:
            continue

        # Try to extract the first definition if there are multiple
        # Pattern for numbered: word 1. (pos.) def (example) 2. ...
        numbered_match = re.match(
            r'^([a-z]+)\s+1\.\s*\(([a-z]+\.)\)\s*(.+?)\(([^)]+)\)',
            segment,
            re.IGNORECASE | re.DOTALL
        )

        if numbered_match:
            word = numbered_match.group(1).lower()
            pos = numbered_match.group(2).lower()
            definition = numbered_match.group(3).strip()
            sentence = numbered_match.group(4).strip()

            pos_chinese = POS_MAP.get(pos, pos)

            words.append({
                'word': word,
                'definition': definition,
                'sentence': sentence,
                'partOfSpeech': pos_chinese
            })
            continue

        # Standard pattern: word (pos.) definition (example)
        standard_match = re.match(
            r'^([a-z]+)\s+\(([a-z]+\.)\)\s*(.+?)\(([^)]+)\)',
            segment,
            re.IGNORECASE | re.DOTALL
        )

        if standard_match:
            word = standard_match.group(1).lower()
            pos = standard_match.group(2).lower()
            definition = standard_match.group(3).strip()
            sentence = standard_match.group(4).strip()

            pos_chinese = POS_MAP.get(pos, pos)

            words.append({
                'word': word,
                'definition': definition,
                'sentence': sentence,
                'partOfSpeech': pos_chinese
            })

    return words

def parse_vocabulary_v2(text):
    """Alternative parsing approach - line by line with state machine"""
    words = []

    # Clean up the text
    text = re.sub(r'\s+', ' ', text)

    # Pattern to find word entries
    # Matches: word (pos.) definition (Example sentence.)
    pattern = re.compile(
        r'\b([a-z]{2,})\s+'           # word (at least 2 chars)
        r'(?:1\.\s*)?'                # optional "1. " for multi-def
        r'\(([a-z]+\.)\)\s*'          # (pos.)
        r'(to\s+[^(]+|[^(]+?)\s*'     # definition (often starts with "to" for verbs)
        r'\(([^)]+[.!?])\)'           # (Example sentence ending with punctuation)
    , re.IGNORECASE)

    for match in pattern.finditer(text):
        word = match.group(1).lower()
        pos = match.group(2).lower()
        definition = match.group(3).strip()
        sentence = match.group(4).strip()

        # Clean up definition
        definition = re.sub(r'\s+', ' ', definition)
        if definition.endswith(','):
            definition = definition[:-1]

        pos_chinese = POS_MAP.get(pos, pos)

        # Skip if word looks like noise
        if len(word) < 2 or word in ['the', 'and', 'for', 'but']:
            continue

        words.append({
            'word': word,
            'definition': definition,
            'sentence': sentence,
            'partOfSpeech': pos_chinese
        })

    return words

def parse_vocabulary_v3(text):
    """Most robust parsing - handle the specific PDF format"""
    words = []
    seen_words = set()

    # Clean text
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\s+', ' ', text)

    # Remove headers/footers
    text = re.sub(r'The 1000 Most Common SAT Words', '', text)
    text = re.sub(r'SparkNotes.*?LLC', '', text, flags=re.IGNORECASE)
    text = re.sub(r'[A-Z] - [A-Z]', '', text)  # Letter range headers
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}', '', text)  # Dates
    text = re.sub(r'www\.\S+', '', text)

    # Pattern for standard entries
    # word (pos.) definition text (Example sentence ending with period.)
    pattern = re.compile(
        r'\b([a-z]{2,})\s+'                    # word
        r'(?:1\.\s*)?'                         # optional 1.
        r'\(([vnaj][a-z]*\.)\)\s*'             # (v.) (n.) (adj.) (adv.)
        r'([^()]+?)'                           # definition
        r'\(([A-Z][^)]+[.!?])\)'              # (Sentence starting with capital)
    , re.IGNORECASE)

    for match in pattern.finditer(text):
        word = match.group(1).lower()
        pos = match.group(2).lower()
        definition = match.group(3).strip()
        sentence = match.group(4).strip()

        # Skip duplicates (keep first occurrence / first definition)
        if word in seen_words:
            continue
        seen_words.add(word)

        # Clean definition
        definition = definition.strip(' ,')
        definition = re.sub(r'\s+', ' ', definition)

        # Map part of speech
        pos_chinese = POS_MAP.get(pos, pos)

        words.append({
            'word': word,
            'definition': definition,
            'sentence': sentence,
            'partOfSpeech': pos_chinese
        })

    return words

def main():
    import os

    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(script_dir, 'sat.vocab.pdf')
    output_path = os.path.join(script_dir, 'sat_vocabulary.json')

    print(f"Extracting text from {pdf_path}...")
    text = extract_pdf_text(pdf_path)

    print(f"Extracted {len(text)} characters")

    print("Parsing vocabulary entries...")
    words = parse_vocabulary_v3(text)

    print(f"Found {len(words)} words")

    # Sort alphabetically
    words.sort(key=lambda x: x['word'])

    # Save to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_path}")

    # Show first few entries as sample
    print("\nSample entries:")
    for word in words[:5]:
        print(f"  {word['word']}: {word['definition'][:50]}...")

if __name__ == '__main__':
    main()

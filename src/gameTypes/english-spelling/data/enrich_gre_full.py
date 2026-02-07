#!/usr/bin/env python3
"""Full GRE Word Enrichment with Merriam-Webster API"""

import json
import urllib.request
import sys
import time
from datetime import datetime

start_time = datetime.now()
print(f"Started at: {start_time}", flush=True)
print("=" * 70, flush=True)

# Load GRE words
with open('gre_words_github.json', 'r') as f:
    gre_words = json.load(f)

print(f"Loaded {len(gre_words)} GRE words", flush=True)
print(f"Estimated time: ~2.5 hours (0.5s per word)\n", flush=True)

MW_API_KEY = "cfc2a612-6202-4231-a810-d613df83c908"
enriched_words = []
failed_words = []

for i, word_data in enumerate(gre_words, 1):
    word = word_data['word']

    # Progress update every 100 words
    if i % 100 == 0:
        elapsed = (datetime.now() - start_time).total_seconds()
        rate = i / elapsed
        remaining = (len(gre_words) - i) / rate / 60
        print(f"[{i}/{len(gre_words)}] ({i/len(gre_words)*100:.1f}%) - {len(enriched_words)} enriched, {len(failed_words)} failed - ETA: {remaining:.1f} min", flush=True)

        # Save checkpoint every 500 words
        if i % 500 == 0:
            with open(f'gre_words_checkpoint_{i}.json', 'w') as f:
                json.dump(enriched_words, f, ensure_ascii=False, indent=2)

    url = f"https://www.dictionaryapi.com/api/v3/references/collegiate/json/{word}?key={MW_API_KEY}"

    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read())

            if data and isinstance(data, list) and isinstance(data[0], dict):
                entry = data[0]

                # Get sentence if available
                sentence = ""
                if 'def' in entry and entry['def']:
                    for definition in entry['def']:
                        if 'sseq' in definition:
                            for sense_seq in definition['sseq']:
                                for sense in sense_seq:
                                    if sense[0] == 'sense' and 'dt' in sense[1]:
                                        for dt_item in sense[1]['dt']:
                                            if dt_item[0] == 'vis':
                                                for vis in dt_item[1]:
                                                    if 't' in vis:
                                                        sentence = vis['t'].replace('{it}', '').replace('{/it}', '').replace('{wi}', '').replace('{/wi}', '')
                                                        break
                                        if sentence:
                                            break
                                if sentence:
                                    break

                enriched = {
                    'word': word,
                    'definition': entry.get('shortdef', [''])[0] if 'shortdef' in entry else '',
                    'sentence': sentence or f"The word {word} is commonly used in English.",
                    'partOfSpeech': entry.get('fl', 'unknown'),
                    'source': 'GRE',
                    'difficulty': 112
                }

                # Adjust difficulty
                if len(word) >= 14:
                    enriched['difficulty'] = 118
                elif len(word) >= 12:
                    enriched['difficulty'] = 115
                elif len(word) >= 10:
                    enriched['difficulty'] = 113

                enriched_words.append(enriched)
            else:
                failed_words.append(word)

    except Exception as e:
        failed_words.append(word)

    time.sleep(0.5)

print(f"\n{'=' * 70}", flush=True)
print(f"Complete at: {datetime.now()}", flush=True)
print(f"Total: {len(enriched_words)} enriched, {len(failed_words)} failed", flush=True)

# Save final results
with open('gre_words_enriched.json', 'w') as f:
    json.dump(enriched_words, f, ensure_ascii=False, indent=2)

print(f"✓ Saved to gre_words_enriched.json", flush=True)

if failed_words:
    with open('gre_words_failed.txt', 'w') as f:
        f.write('\n'.join(failed_words))
    print(f"✓ Failed words saved to gre_words_failed.txt", flush=True)

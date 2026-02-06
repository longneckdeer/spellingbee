#!/usr/bin/env python3
import json
import os
import requests
import time
import sys

MW_KEY = os.environ.get("MW_COLLEGIATE_KEY", "")

with open('ceec_new_words.txt', 'r') as f:
    words = [w.strip() for w in f.readlines() if w.strip()]

print(f"Processing {len(words)} words...", flush=True)

POS_MAP = {
    'noun': '名詞',
    'verb': '動詞',
    'adjective': '形容詞',
    'adverb': '副詞',
    'preposition': '介系詞',
    'conjunction': '連接詞',
    'pronoun': '代名詞',
    'interjection': '感嘆詞',
}

results = []
failed = []

for i, word in enumerate(words):
    if i % 100 == 0:
        print(f"Progress: {i}/{len(words)} ({i*100//len(words)}%)", flush=True)

    url = f"https://www.dictionaryapi.com/api/v3/references/collegiate/json/{word}?key={MW_KEY}"
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()

        if data and isinstance(data[0], dict):
            entry = data[0]
            definition = entry.get('shortdef', [''])[0] if entry.get('shortdef') else ''
            fl = entry.get('fl', '')
            pos = '其他'
            for eng, chi in POS_MAP.items():
                if eng in fl.lower():
                    pos = chi
                    break

            results.append({
                'word': word,
                'definition': definition,
                'sentence': '',
                'partOfSpeech': pos,
                'difficulty': 50,
                'cefr_level': 'B2',
                'source': 'CEEC'
            })
        else:
            failed.append(word)
    except Exception as e:
        failed.append(word)

    time.sleep(0.12)

print(f"\nSuccessfully processed: {len(results)} words", flush=True)
print(f"Failed: {len(failed)} words", flush=True)

with open('ceec_high_school.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

if failed:
    with open('ceec_failed.txt', 'w') as f:
        f.write('\n'.join(failed))
    print(f"Failed words saved to ceec_failed.txt", flush=True)

print("Done! Saved to ceec_high_school.json", flush=True)

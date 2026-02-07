#!/usr/bin/env python3
"""
Merge GRE words into university.json and expert.json
"""

import json

# Load existing dictionaries
print("Loading existing dictionaries...")
with open('university.json', 'r', encoding='utf-8') as f:
    university = json.load(f)
print(f"  Loaded {len(university)} words from university.json")

with open('expert.json', 'r', encoding='utf-8') as f:
    expert = json.load(f)
print(f"  Loaded {len(expert)} words from expert.json")

# Load GRE words to merge
print("\nLoading GRE words...")
with open('gre_words_for_university.json', 'r', encoding='utf-8') as f:
    gre_university = json.load(f)
print(f"  Loaded {len(gre_university)} GRE words for university")

with open('gre_words_for_expert.json', 'r', encoding='utf-8') as f:
    gre_expert = json.load(f)
print(f"  Loaded {len(gre_expert)} GRE words for expert")

# Merge into university
print("\nMerging GRE words into university.json...")
university.extend(gre_university)
print(f"  New total: {len(university)} words")

# Merge into expert
print("Merging GRE words into expert.json...")
expert.extend(gre_expert)
print(f"  New total: {len(expert)} words")

# Save updated files
print("\nSaving updated dictionaries...")
with open('university.json', 'w', encoding='utf-8') as f:
    json.dump(university, f, ensure_ascii=False, indent=2)
print(f"  ✓ Saved university.json ({len(university)} words)")

with open('expert.json', 'w', encoding='utf-8') as f:
    json.dump(expert, f, ensure_ascii=False, indent=2)
print(f"  ✓ Saved expert.json ({len(expert)} words)")

print("\n" + "="*70)
print("MERGE COMPLETE")
print("="*70)
print(f"University level: {len(university)} words (difficulty 71-90)")
print(f"Expert level: {len(expert)} words (difficulty 91-120)")
print()

#!/usr/bin/env python3
"""
Find words that are not in citation form (inflected/derived forms).
These should be removed or replaced with their base forms.
"""

import json
import os

# Legitimate -ly words that are NOT derived adverbs
LEGITIMATE_LY_WORDS = {
    # Months
    'july',
    # Nouns ending in -ly
    'anomaly', 'assembly', 'bully', 'belly', 'jelly', 'rally', 'tally', 'ally',
    'folly', 'holly', 'jolly', 'molly', 'polly', 'dolly', 'golly', 'lolly',
    'homily', 'monopoly', 'contumely', 'melancholy', 'family', 'butterfly',
    # Verbs ending in -ly
    'apply', 'imply', 'multiply', 'fly', 'rely', 'reply', 'comply', 'supply', 'ply',
    # Primary adjectives (not derived from other words)
    'early', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'hourly',
    'elderly', 'deadly', 'friendly', 'lonely', 'lovely', 'holy', 'ugly',
    'likely', 'unlikely', 'heavenly', 'worldly', 'costly', 'ghastly', 'sickly',
    'orderly', 'cowardly', 'scholarly', 'fatherly', 'motherly', 'brotherly',
    'sisterly', 'neighborly', 'kingly', 'queenly', 'princely', 'leisurely',
    'timely', 'untimely', 'comely', 'seemly', 'unseemly', 'goodly',
    # Adverb/adjective that is primary form
    'only',
}

# Legitimate -ing words that are standalone nouns/adjectives
LEGITIMATE_ING_WORDS = {
    'building', 'feeling', 'morning', 'evening', 'meeting', 'wedding',
    'ceiling', 'ring', 'king', 'sing', 'bring', 'thing', 'spring', 'string',
    'swing', 'wing', 'sting', 'nothing', 'something', 'everything', 'anything',
    'clothing', 'painting', 'drawing', 'writing', 'reading', 'meaning',
    'warning', 'opening', 'beginning', 'ending', 'setting', 'blessing',
    'offering', 'suffering', 'hearing', 'living', 'saving', 'being',
    'interesting', 'amazing', 'surprising', 'exciting', 'boring', 'charming',
    'during', 'according', 'following', 'including', 'regarding', 'concerning',
}

# Legitimate -ed words that are standalone adjectives
LEGITIMATE_ED_WORDS = {
    'bed', 'red', 'fed', 'led', 'wed', 'shed', 'sled',
    'advanced', 'alleged', 'animated', 'beloved', 'blessed', 'crooked',
    'detailed', 'devoted', 'distinguished', 'educated', 'interested',
    'learned', 'marked', 'naked', 'ragged', 'rugged', 'sacred', 'wicked',
    'worried', 'tired', 'bored', 'excited', 'surprised', 'confused',
    'married', 'divorced', 'retired', 'aged', 'skilled', 'talented',
}

# Legitimate -er words (agent nouns, not comparatives)
LEGITIMATE_ER_WORDS = {
    'teacher', 'water', 'paper', 'letter', 'after', 'never', 'ever', 'over',
    'under', 'other', 'mother', 'father', 'brother', 'sister', 'finger',
    'winter', 'summer', 'number', 'member', 'remember', 'december', 'november',
    'october', 'september', 'center', 'enter', 'computer', 'corner', 'dinner',
    'manner', 'matter', 'better', 'butter', 'silver', 'river', 'cover',
    'discover', 'power', 'flower', 'tower', 'shower', 'answer', 'wonder',
    'thunder', 'hunger', 'anger', 'danger', 'stranger', 'trigger', 'tiger',
    'spider', 'order', 'border', 'murder', 'ladder', 'rubber', 'copper',
    'pepper', 'supper', 'upper', 'proper', 'super', 'whisper', 'chapter',
    'laughter', 'daughter', 'slaughter', 'monster', 'hamster', 'lobster',
    'oyster', 'mister', 'blister', 'cluster', 'plaster', 'master', 'disaster',
    'character', 'parameter', 'diameter', 'thermometer', 'kilometer', 'meter',
    'theater', 'sweater', 'weather', 'leather', 'feather', 'together', 'either',
    'neither', 'whether', 'rather', 'gather', 'lather', 'bother', 'smother',
    'another', 'deer', 'beer', 'cheer', 'steer', 'pioneer', 'volunteer',
    'engineer', 'career', 'peer', 'queer', 'sheer', 'sneer', 'veer',
    'offer', 'differ', 'suffer', 'buffer', 'staffer', 'refer', 'prefer',
    'transfer', 'infer', 'confer', 'defer',
    'layer', 'player', 'prayer', 'lawyer', 'buyer', 'employer', 'destroyer',
    'customer', 'consumer', 'producer', 'manufacturer', 'developer',
    'publisher', 'performer', 'reporter', 'supporter', 'voter', 'writer',
    'reader', 'leader', 'speaker', 'listener', 'viewer', 'user', 'owner',
    'driver', 'worker', 'farmer', 'soldier', 'officer', 'manager', 'director',
    'professor', 'doctor', 'lawyer', 'teacher', 'preacher', 'researcher',
    'designer', 'painter', 'singer', 'dancer', 'actor', 'sailor', 'tailor',
    'barrier', 'carrier', 'terrier', 'premier', 'glacier', 'frontier',
    'fiber', 'timber', 'amber', 'chamber', 'cucumber', 'slumber',
    'sober', 'ober', 'cyber', 'cider', 'spider', 'wider', 'rider', 'insider',
    'outsider', 'provider', 'divider', 'slider', 'glider',
    'her', 'per', 'sir', 'fur', 'blur', 'spur', 'stir', 'occur',
}

def find_derived_adverbs(word):
    """Check if word is a derived adverb (adjective + ly)"""
    word_lower = word.lower()
    if word_lower in LEGITIMATE_LY_WORDS:
        return None

    if word_lower.endswith('ly') and len(word_lower) > 3:
        # Try to find base adjective
        base = word_lower[:-2]

        # Handle special cases
        if word_lower.endswith('ily'):  # happily -> happy
            base = word_lower[:-3] + 'y'
        elif word_lower.endswith('ally') and len(word_lower) > 5:  # basically -> basic
            base = word_lower[:-4]
            if not base.endswith('ic'):  # manually -> manual (not manu)
                base = word_lower[:-2]
        elif word_lower.endswith('ibly'):  # possibly -> possible
            base = word_lower[:-4] + 'le'
        elif word_lower.endswith('ably'):  # probably -> probable
            base = word_lower[:-4] + 'le'
        elif word_lower.endswith('ely') and word_lower[-4] not in 'aeiou':  # merely -> mere
            base = word_lower[:-2]
        elif word_lower.endswith('ully'):  # fully -> full
            base = word_lower[:-2]
        elif word_lower.endswith('ily'):  # easily -> easy
            base = word_lower[:-3] + 'y'

        return base
    return None

def find_inflected_forms(words_data, filename):
    """Find all inflected forms in a word list"""
    issues = []

    for entry in words_data:
        word = entry.get('word', '')
        word_lower = word.lower()

        # Check for derived adverbs (-ly)
        base = find_derived_adverbs(word)
        if base:
            issues.append({
                'word': word,
                'base': base,
                'type': 'adverb-ly',
                'file': filename
            })
            continue

        # Check for -ing forms (gerunds)
        if word_lower.endswith('ing') and word_lower not in LEGITIMATE_ING_WORDS:
            if len(word_lower) > 4:
                # Try to determine base
                if word_lower.endswith('ying'):  # studying -> study
                    base = word_lower[:-4] + 'y'
                elif word_lower.endswith('ting') and word_lower[-5] not in 'aeiou':
                    base = word_lower[:-4] + 'te'  # writing -> write
                elif word_lower.endswith('ming') and word_lower[-5] == word_lower[-4]:
                    base = word_lower[:-4]  # swimming -> swim
                elif word_lower.endswith('ning') and word_lower[-5] == word_lower[-4]:
                    base = word_lower[:-4]  # running -> run
                else:
                    base = word_lower[:-3]  # walking -> walk

                issues.append({
                    'word': word,
                    'base': base,
                    'type': 'gerund-ing',
                    'file': filename
                })
                continue

        # Check for -ed forms (past tense/participle)
        if word_lower.endswith('ed') and word_lower not in LEGITIMATE_ED_WORDS:
            if len(word_lower) > 3:
                if word_lower.endswith('ied'):  # studied -> study
                    base = word_lower[:-3] + 'y'
                elif word_lower.endswith('ted') and word_lower[-4] == word_lower[-3]:
                    base = word_lower[:-3]  # stopped -> stop
                elif word_lower.endswith('ed') and word_lower[-3] in 'aeiou':
                    base = word_lower[:-1]  # hoped -> hope
                else:
                    base = word_lower[:-2]  # walked -> walk

                issues.append({
                    'word': word,
                    'base': base,
                    'type': 'past-ed',
                    'file': filename
                })
                continue

        # Check for plural -s/-es (basic check)
        if word_lower.endswith('ies') and len(word_lower) > 4:
            base = word_lower[:-3] + 'y'
            issues.append({
                'word': word,
                'base': base,
                'type': 'plural-ies',
                'file': filename
            })
        elif word_lower.endswith('es') and word_lower[-3] in 'sxzo' and len(word_lower) > 3:
            base = word_lower[:-2]
            issues.append({
                'word': word,
                'base': base,
                'type': 'plural-es',
                'file': filename
            })

    return issues

def main():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'gameTypes', 'english-spelling', 'data')
    files = ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']

    all_issues = []

    for filename in files:
        filepath = os.path.join(data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            issues = find_inflected_forms(data, filename)
            all_issues.extend(issues)

    # Group by type
    by_type = {}
    for issue in all_issues:
        t = issue['type']
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(issue)

    print(f"Found {len(all_issues)} potential inflected forms:\n")

    for issue_type, issues in sorted(by_type.items()):
        print(f"\n=== {issue_type.upper()} ({len(issues)} words) ===")
        for issue in sorted(issues, key=lambda x: x['word'].lower()):
            print(f"  {issue['word']} → {issue['base']} ({issue['file']})")

    # Output as JSON for further processing
    with open('/tmp/inflected_forms.json', 'w', encoding='utf-8') as f:
        json.dump(all_issues, f, indent=2, ensure_ascii=False)

    print(f"\n\nFull list saved to /tmp/inflected_forms.json")

if __name__ == '__main__':
    main()

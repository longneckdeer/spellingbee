#!/usr/bin/env python3
"""
Merriam-Webster Dictionary API Integration

This script:
1. Fetches word data from Merriam-Webster Collegiate Dictionary API
2. Downloads professional audio pronunciations
3. Expands dictionary with proper definitions and sentences
4. Organizes words by CEFR level

Usage:
    python3 merriam_webster_integration.py

API Keys stored in this file - DO NOT commit to public repos!
"""

import json
import os
import time
import urllib.request
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# API Configuration
MW_API_KEY = "cfc2a612-6202-4231-a810-d613df83c908"  # Collegiate Dictionary
MW_API_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json"
MW_AUDIO_BASE = "https://media.merriam-webster.com/audio/prons/en/us/mp3"

# Output directories
SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR / "audio_mw"
OUTPUT_DIR = SCRIPT_DIR

# Part of speech mapping to Chinese
POS_MAP = {
    'noun': '名詞',
    'verb': '動詞',
    'adjective': '形容詞',
    'adverb': '副詞',
    'preposition': '介詞',
    'conjunction': '連詞',
    'pronoun': '代詞',
    'interjection': '感嘆詞',
    'auxiliary verb': '助動詞',
    'definite article': '冠詞',
    'indefinite article': '冠詞',
}

# CEFR Level Word Lists
# These are target words to add for each level

A1_WORDS = [
    # Basic nouns
    "apple", "banana", "orange", "bread", "milk", "water", "juice", "egg",
    "car", "bus", "train", "plane", "bike", "boat", "truck",
    "tree", "flower", "grass", "sun", "moon", "star", "rain", "snow",
    "hand", "foot", "head", "eye", "ear", "nose", "mouth", "hair",
    "red", "blue", "green", "yellow", "black", "white", "pink", "brown",
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "mom", "dad", "baby", "boy", "girl", "man", "woman", "child",
    "cat", "dog", "bird", "fish", "horse", "cow", "pig", "sheep",
    "house", "room", "door", "window", "bed", "chair", "table", "desk",
    "school", "class", "book", "pen", "paper", "bag", "clock",
    # Basic verbs
    "eat", "drink", "sleep", "walk", "run", "jump", "sit", "stand",
    "read", "write", "draw", "sing", "dance", "play", "swim", "fly",
    "open", "close", "start", "stop", "come", "go", "see", "hear",
    "like", "love", "want", "need", "have", "give", "take", "make",
    # Basic adjectives
    "big", "small", "tall", "short", "long", "new", "old", "young",
    "good", "bad", "happy", "sad", "hot", "cold", "fast", "slow",
    "clean", "dirty", "easy", "hard", "full", "empty", "right", "wrong",
]

A2_WORDS = [
    # Elementary vocabulary
    "breakfast", "lunch", "dinner", "kitchen", "bathroom", "bedroom",
    "beautiful", "wonderful", "terrible", "excellent", "fantastic",
    "calendar", "birthday", "holiday", "weekend", "vacation",
    "restaurant", "hospital", "library", "museum", "airport",
    "computer", "telephone", "television", "camera", "radio",
    "chocolate", "sandwich", "vegetable", "strawberry", "pineapple",
    "elephant", "giraffe", "monkey", "penguin", "butterfly",
    "mountain", "river", "ocean", "island", "desert", "forest",
    "remember", "forget", "understand", "believe", "imagine",
    "practice", "exercise", "celebrate", "decorate", "organize",
    "dangerous", "important", "different", "interesting", "exciting",
    "sometimes", "usually", "always", "never", "often", "early",
    "together", "already", "almost", "enough", "probably",
    "because", "although", "however", "therefore", "instead",
    "neighbor", "customer", "passenger", "stranger", "audience",
]

B1_WORDS = [
    # Intermediate vocabulary - fewer needed, we have many B1 already
    "environment", "government", "education", "experience", "opportunity",
    "communicate", "participate", "appreciate", "contribute", "demonstrate",
    "responsibility", "relationship", "organization", "information", "technology",
    "comfortable", "professional", "successful", "independent", "traditional",
    "immediately", "especially", "unfortunately", "definitely", "absolutely",
]

B2_WORDS = [
    # Upper-intermediate vocabulary
    "acknowledge", "accomplish", "accumulate", "advocate", "allocate",
    "ambiguous", "analyze", "anticipate", "appreciate", "approximate",
    "arbitrary", "assessment", "assumption", "authority", "beneficial",
    "bureaucracy", "characteristic", "circumstance", "collaborate", "commodity",
    "comprehensive", "consequently", "considerable", "constitute", "constraint",
    "contemporary", "controversial", "cooperate", "correspondence", "criterion",
    "demonstrate", "deteriorate", "differentiate", "dilemma", "discrimination",
    "elaborate", "eliminate", "emphasize", "enterprise", "enthusiasm",
    "equivalent", "evaluate", "exaggerate", "facilitate", "fundamental",
    "guarantee", "hypothesis", "implement", "implication", "incentive",
    "incorporate", "infrastructure", "initiative", "innovative", "intellectual",
    "interpretation", "investigate", "legitimate", "manipulate", "mechanism",
    "methodology", "negotiate", "nevertheless", "obligation", "perspective",
    "phenomenon", "philosophy", "preliminary", "prestigious", "prevalent",
    "procurement", "propaganda", "psychological", "questionnaire", "reconcile",
    "reinforce", "reluctant", "reproduce", "reputation", "resignation",
    "sophisticated", "spontaneous", "statistical", "stereotype", "stimulate",
    "straightforward", "subsequently", "substantial", "superficial", "supplement",
    "sustainable", "sympathy", "synthesis", "transparent", "tremendous",
    "ultimately", "unanimous", "unprecedented", "vocabulary", "vulnerable",
]

C1_WORDS = [
    # Advanced vocabulary
    "aberration", "absolution", "abstinence", "accentuate", "accommodate",
    "acquiesce", "admonish", "aesthetic", "affiliation", "aggregate",
    "alleviate", "amalgamate", "ambivalent", "ameliorate", "anachronism",
    "antagonist", "apprehension", "articulate", "ascertain", "assimilate",
    "auspicious", "autonomous", "benevolent", "brevity", "catharsis",
    "caustic", "circumvent", "clandestine", "coalesce", "cognizant",
    "coherent", "colloquial", "commensurate", "compelling", "compulsory",
    "conciliatory", "condescending", "confluence", "connotation", "conscientious",
    "contingent", "converge", "corroborate", "culminate", "cumbersome",
    "debilitate", "decadence", "deference", "delineate", "deleterious",
    "demagogue", "denounce", "deprecate", "derivative", "desolate",
    "dichotomy", "didactic", "digression", "diminish", "discrepancy",
    "disparate", "disseminate", "dissolution", "divergent", "dogmatic",
    "ebullient", "eclectic", "efficacy", "eloquent", "elusive",
    "emancipate", "embellish", "empirical", "emulate", "encapsulate",
    "endemic", "enigmatic", "ephemeral", "equivocal", "eradicate",
    "erroneous", "esoteric", "ethereal", "euphemism", "exacerbate",
    "exemplify", "exhaustive", "exonerate", "expedite", "extrapolate",
]

C2_WORDS = [
    # Championship/Expert vocabulary
    "abstruse", "acrimonious", "antediluvian", "apotheosis", "approbation",
    "cacophony", "callipygian", "capricious", "circumlocution", "conflagration",
    "conundrum", "cynosure", "deleterious", "denouement", "diaphanous",
    "ebullience", "effervescent", "egregious", "encomium", "enervate",
    "ephemeral", "epitome", "equanimity", "evanescent", "excoriate",
    "exigent", "expunge", "fastidious", "fatuous", "feckless",
    "filibuster", "garrulous", "grandiloquent", "gratuitous", "gregarious",
    "harangue", "harbinger", "hegemony", "iconoclast", "ignominious",
    "impecunious", "impervious", "impugn", "inchoate", "incorrigible",
    "ineffable", "ineluctable", "inexorable", "inscrutable", "insidious",
    "intransigent", "inveigle", "irascible", "juxtaposition", "laconic",
    "legerdemain", "loquacious", "lugubrious", "magnanimous", "malfeasance",
    "mellifluous", "mendacious", "meretricious", "milieu", "misanthrope",
    "mnemonic", "munificent", "nefarious", "neophyte", "nihilism",
    "nomenclature", "obfuscate", "obsequious", "obstreperous", "onomatopoeia",
    "opprobrium", "oxymoron", "panacea", "paradigm", "parsimonious",
    "pedagogy", "pejorative", "pellucid", "perfidious", "pernicious",
    "perspicacious", "pertinacious", "platitude", "plethora", "polemic",
    "polyglot", "pragmatic", "precarious", "predilection", "prestidigitation",
    "prevaricate", "probity", "proclivity", "profligate", "promulgate",
    "propinquity", "prosaic", "puerile", "punctilious", "pusillanimous",
    "quagmire", "querulous", "quintessential", "quotidian", "rapprochement",
    "recalcitrant", "recondite", "redoubtable", "refractory", "remonstrate",
    "reprobate", "rescind", "reticent", "sagacious", "salubrious",
    "sanguine", "sardonic", "scintillating", "sedulous", "serendipity",
    "sesquipedalian", "simulacrum", "soliloquy", "soporific", "specious",
    "spurious", "staid", "stolid", "strident", "stultify",
    "subterfuge", "supercilious", "sycophant", "taciturn", "tangential",
    "tautology", "temerity", "tenacious", "tendentious", "tergiversate",
    "trepidation", "truculent", "ubiquitous", "umbrage", "unconscionable",
    "unctuous", "unequivocal", "untenable", "urbane", "vacillate",
    "vacuous", "vainglorious", "vapid", "venal", "venerate",
    "verisimilitude", "vicissitude", "vindicate", "vituperate", "voracious",
    "winnow", "winsome", "xenophobia", "zeitgeist", "zealot",
]


def get_audio_subdir(audio_filename):
    """
    Determine the subdirectory for audio file based on MW rules.
    - If starts with "bix", subdir = "bix"
    - If starts with "gg", subdir = "gg"
    - If starts with number, subdir = "number"
    - Otherwise, first letter
    """
    if not audio_filename:
        return None

    if audio_filename.startswith("bix"):
        return "bix"
    elif audio_filename.startswith("gg"):
        return "gg"
    elif audio_filename[0].isdigit():
        return "number"
    else:
        return audio_filename[0]


def fetch_word_data(word):
    """
    Fetch word data from Merriam-Webster API.

    Returns dict with: word, definition, partOfSpeech, audio_filename
    Or None if word not found.
    """
    url = f"{MW_API_URL}/{word}?key={MW_API_KEY}"

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))

            # Check if we got actual entries (not suggestions)
            if not data or not isinstance(data[0], dict):
                return None

            entry = data[0]

            # Extract headword (remove syllable markers)
            headword = entry.get('hwi', {}).get('hw', word)
            clean_word = headword.replace('*', '')

            # Extract part of speech
            fl = entry.get('fl', 'noun')
            pos_chinese = POS_MAP.get(fl.lower(), '名詞')

            # Extract short definition
            shortdef = entry.get('shortdef', [''])
            definition = shortdef[0] if shortdef else ''

            # Extract audio filename
            prs = entry.get('hwi', {}).get('prs', [])
            audio_filename = None
            if prs and 'sound' in prs[0]:
                audio_filename = prs[0]['sound'].get('audio')

            # Try to extract example sentence from definition
            sentence = ""
            try:
                defs = entry.get('def', [])
                if defs:
                    sseq = defs[0].get('sseq', [])
                    if sseq:
                        for sense in sseq:
                            if isinstance(sense, list) and len(sense) > 0:
                                for item in sense:
                                    if isinstance(item, list) and len(item) > 1:
                                        sense_data = item[1]
                                        if isinstance(sense_data, dict):
                                            dt = sense_data.get('dt', [])
                                            for dt_item in dt:
                                                if isinstance(dt_item, list) and dt_item[0] == 'vis':
                                                    vis_list = dt_item[1]
                                                    if vis_list:
                                                        # Get the example text
                                                        t = vis_list[0].get('t', '')
                                                        # Clean up formatting tags
                                                        t = t.replace('{it}', '').replace('{/it}', '')
                                                        t = t.replace('{ldquo}', '"').replace('{rdquo}', '"')
                                                        sentence = t
                                                        break
                                        if sentence:
                                            break
                                if sentence:
                                    break
            except Exception:
                pass

            # If no example sentence, create a simple one
            if not sentence:
                if pos_chinese == '名詞':
                    sentence = f"The {clean_word} is interesting."
                elif pos_chinese == '動詞':
                    sentence = f"They {clean_word} every day."
                elif pos_chinese == '形容詞':
                    sentence = f"It was very {clean_word}."
                else:
                    sentence = f"The word {clean_word} is useful."

            return {
                'word': clean_word,
                'definition': definition,
                'sentence': sentence,
                'partOfSpeech': pos_chinese,
                'audio_filename': audio_filename
            }

    except urllib.error.HTTPError as e:
        print(f"  HTTP Error for '{word}': {e.code}")
        return None
    except urllib.error.URLError as e:
        print(f"  URL Error for '{word}': {e.reason}")
        return None
    except Exception as e:
        print(f"  Error for '{word}': {e}")
        return None


def download_audio(word_data, output_dir):
    """
    Download audio file for a word.

    Returns True if successful, False otherwise.
    """
    audio_filename = word_data.get('audio_filename')
    if not audio_filename:
        return False

    subdir = get_audio_subdir(audio_filename)
    if not subdir:
        return False

    audio_url = f"{MW_AUDIO_BASE}/{subdir}/{audio_filename}.mp3"
    word = word_data['word']

    # Create word directory
    word_dir = output_dir / word.lower()
    word_dir.mkdir(parents=True, exist_ok=True)

    output_path = word_dir / f"{word}_word.mp3"

    # Skip if already exists
    if output_path.exists():
        return True

    try:
        with urllib.request.urlopen(audio_url, timeout=10) as response:
            audio_data = response.read()

        with open(output_path, 'wb') as f:
            f.write(audio_data)

        return True

    except Exception as e:
        print(f"  Audio download error for '{word}': {e}")
        return False


def process_word_list(words, cefr_level, difficulty_base):
    """
    Process a list of words and return dictionary entries.

    Args:
        words: List of words to process
        cefr_level: CEFR level (A1, A2, B1, B2, C1, C2)
        difficulty_base: Base difficulty for this level

    Returns:
        List of word entries
    """
    entries = []
    total = len(words)

    print(f"\nProcessing {total} {cefr_level} words...")
    print("-" * 50)

    for i, word in enumerate(words, 1):
        # Fetch from API
        data = fetch_word_data(word)

        if data:
            # Calculate difficulty within range
            position = i / total
            difficulty_range = 15 if cefr_level in ['A1', 'A2'] else 20
            difficulty = int(difficulty_base + (position * difficulty_range))
            difficulty = min(100, difficulty)

            # Determine Taiwan stage
            taiwan_stages = {
                'A1': '小學1-3年級',
                'A2': '小學4-6年級',
                'B1': '中學7-9年級',
                'B2': '高中10-12年級',
                'C1': '大學',
                'C2': '英文高手'
            }

            entry = {
                'word': data['word'],
                'definition': data['definition'],
                'sentence': data['sentence'],
                'partOfSpeech': data['partOfSpeech'],
                'difficulty': difficulty,
                'cefr_level': cefr_level,
                'taiwan_stage': taiwan_stages.get(cefr_level, ''),
                'audio_filename': data.get('audio_filename')
            }
            entries.append(entry)
            print(f"  [{i}/{total}] ✓ {word}: {data['definition'][:50]}...")

            # Download audio
            if data.get('audio_filename'):
                download_audio(data, AUDIO_DIR)
        else:
            print(f"  [{i}/{total}] ✗ {word}: Not found")

        # Rate limiting
        if i % 10 == 0:
            time.sleep(0.5)

    return entries


def load_existing_words():
    """Load all existing words from current dictionary files."""
    existing = set()

    for filename in ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']:
        filepath = SCRIPT_DIR / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                words = json.load(f)
                for w in words:
                    existing.add(w['word'].lower())

    return existing


def main():
    """Main execution function."""
    print("=" * 60)
    print("Merriam-Webster Dictionary Integration")
    print("=" * 60)

    # Create directories
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing words to avoid duplicates
    existing_words = load_existing_words()
    print(f"\nLoaded {len(existing_words)} existing words")

    # Process each CEFR level
    all_entries = {
        'A1': [],
        'A2': [],
        'B1': [],
        'B2': [],
        'C1': [],
        'C2': []
    }

    word_lists = [
        (A1_WORDS, 'A1', 0),
        (A2_WORDS, 'A2', 15),
        (B1_WORDS, 'B1', 30),
        (B2_WORDS, 'B2', 50),
        (C1_WORDS, 'C1', 70),
        (C2_WORDS, 'C2', 90),
    ]

    for words, cefr, base_diff in word_lists:
        # Filter out existing words
        new_words = [w for w in words if w.lower() not in existing_words]
        print(f"\n{cefr}: {len(words)} total, {len(new_words)} new words to add")

        if new_words:
            entries = process_word_list(new_words, cefr, base_diff)
            all_entries[cefr].extend(entries)

            # Add to existing set
            for e in entries:
                existing_words.add(e['word'].lower())

    # Save new words to separate file for review
    output_file = OUTPUT_DIR / "new_words_from_mw.json"

    combined = []
    for level, entries in all_entries.items():
        combined.extend(entries)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    # Summary
    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
    print("\nWords added by level:")
    for level, entries in all_entries.items():
        print(f"  {level}: {len(entries)} words")
    print(f"\nTotal new words: {len(combined)}")
    print(f"Saved to: {output_file}")
    print(f"Audio files: {AUDIO_DIR}")
    print("\nNext steps:")
    print("1. Review new_words_from_mw.json")
    print("2. Merge into main dictionary files")
    print("3. Run recalculate_difficulty_cefr.py")


if __name__ == "__main__":
    main()

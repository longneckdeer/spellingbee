#!/usr/bin/env python3
"""
Expand dictionary with more words from Merriam-Webster API.
Focus on filling gaps in CEFR levels.
"""

import json
import os
import time
import urllib.request
import urllib.error
from pathlib import Path

# API Configuration
MW_API_KEY = os.environ.get("MW_COLLEGIATE_KEY", "")
MW_API_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json"
MW_AUDIO_BASE = "https://media.merriam-webster.com/audio/prons/en/us/mp3"

SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR / "audio_mw"

POS_MAP = {
    'noun': '名詞',
    'verb': '動詞',
    'adjective': '形容詞',
    'adverb': '副詞',
    'preposition': '介詞',
    'conjunction': '連詞',
    'pronoun': '代詞',
    'interjection': '感嘆詞',
}

# Expanded word lists - focusing on commonly misspelled words and spelling bee favorites

A1_EXPANDED = [
    # Animals
    "rabbit", "turtle", "frog", "snake", "lion", "tiger", "bear", "wolf",
    "duck", "chicken", "goat", "deer", "fox", "owl", "bee", "ant",
    # Food
    "pizza", "pasta", "cheese", "butter", "sugar", "salt", "pepper", "soup",
    "cookie", "candy", "cake", "pie", "meat", "rice", "bean", "corn",
    # Body
    "arm", "leg", "back", "neck", "face", "chin", "knee", "toe",
    "finger", "thumb", "elbow", "shoulder", "stomach", "heart", "brain",
    # Nature
    "leaf", "rock", "sand", "dirt", "mud", "ice", "fire", "smoke",
    "cloud", "wind", "storm", "thunder", "lightning", "rainbow",
    # Home
    "roof", "wall", "floor", "stair", "gate", "fence", "yard", "garden",
    "lamp", "couch", "pillow", "blanket", "towel", "mirror", "shelf",
    # School
    "chalk", "board", "ruler", "eraser", "crayon", "marker", "glue", "tape",
    "math", "science", "art", "music", "gym", "lunch", "recess",
    # Clothes
    "shirt", "pants", "dress", "skirt", "coat", "jacket", "sweater", "hat",
    "shoe", "boot", "sock", "glove", "scarf", "belt", "pocket",
    # Actions
    "catch", "throw", "kick", "pull", "push", "climb", "slide", "swing",
    "clap", "wave", "point", "touch", "smell", "taste", "feel",
    # Adjectives
    "loud", "quiet", "soft", "hard", "light", "dark", "bright", "dim",
    "wet", "dry", "sharp", "dull", "smooth", "rough", "thick", "thin",
]

A2_EXPANDED = [
    # More complex nouns
    "adventure", "apartment", "calendar", "celebration", "champion",
    "character", "collection", "community", "competition", "condition",
    "conversation", "creature", "customer", "decision", "dictionary",
    "dinosaur", "direction", "discovery", "emergency", "equipment",
    "experiment", "explanation", "expression", "furniture", "generation",
    "geography", "helicopter", "ingredient", "instrument", "invitation",
    "jellyfish", "kangaroo", "kindergarten", "knowledge", "language",
    "lightning", "magazine", "medicine", "message", "motorcycle",
    "neighbor", "newspaper", "nightmare", "orchestra", "passenger",
    "photograph", "playground", "pollution", "population", "president",
    "principal", "profession", "professor", "program", "promise",
    "protection", "purchase", "question", "rectangle", "refrigerator",
    "regular", "religion", "republic", "resource", "rhinoceros",
    "schedule", "scissors", "secretary", "sentence", "shoulder",
    "situation", "skeleton", "solution", "somebody", "somewhere",
    "special", "spelling", "squirrel", "station", "stomach",
    "straight", "strength", "structure", "submarine", "successful",
    "suggestion", "surprise", "temperature", "terrible", "theater",
    "thousand", "tomorrow", "tongue", "triangle", "trouble",
    "umbrella", "uniform", "universe", "vacation", "valuable",
    "vegetable", "vehicle", "village", "visitor", "vocabulary",
    "volunteer", "waterfall", "weather", "wednesday", "wonderful",
    # Commonly misspelled
    "accommodate", "achieve", "acquire", "address", "amateur",
    "apparent", "argument", "beginning", "believe", "calendar",
    "category", "cemetery", "certain", "college", "column",
    "committee", "conscious", "deceive", "definite", "describe",
    "desperate", "different", "disappear", "disappoint", "discipline",
    "embarrass", "environment", "exaggerate", "excellent", "exercise",
    "existence", "experience", "familiar", "February", "foreign",
    "forty", "forward", "friend", "government", "grammar",
    "guarantee", "harass", "height", "hierarchy", "humorous",
    "ignorance", "immediate", "independent", "intelligence", "jewelry",
    "judgment", "knowledge", "leisure", "library", "license",
    "lieutenant", "maintenance", "maneuver", "marriage", "mathematics",
    "millennium", "miniature", "mischievous", "misspell", "necessary",
    "neighbor", "occasion", "occurred", "official", "opportunity",
]

B2_EXPANDED = [
    # Academic and professional vocabulary
    "abbreviation", "abnormal", "abolish", "abundance", "accelerate",
    "accessible", "accountable", "acquisition", "adaptation", "adequate",
    "adjacent", "adjustment", "administration", "adolescent", "aesthetic",
    "affirmative", "aggregate", "allegation", "allocation", "alteration",
    "alternative", "ambassador", "ambiguity", "amendment", "analogous",
    "anatomy", "anniversary", "anonymous", "anticipation", "apparatus",
    "applicable", "appreciation", "apprentice", "appropriate", "arbitrary",
    "architect", "architecture", "articulate", "aspiration", "assassination",
    "assertion", "assessment", "assignment", "association", "assumption",
    "astronomy", "attachment", "attainment", "attendance", "authentic",
    "authorization", "autobiography", "autonomous", "availability", "aviation",
    "bacteria", "bankruptcy", "beneficial", "bibliography", "biography",
    "biological", "bourgeois", "브 bureaucratic", "calculator", "capability",
    "capitalism", "cardiovascular", "catastrophe", "categorize", "certificate",
    "characteristic", "chronological", "circulation", "civilization", "clarification",
    "classification", "coefficient", "collaboration", "commemorate", "commentary",
    "commissioner", "commitment", "commodities", "commonplace", "communicate",
    "comparative", "compassionate", "compensation", "competence", "competitive",
    "complement", "complexity", "compliance", "component", "composition",
    "comprehension", "compromise", "compulsory", "concentration", "conception",
    "concurrent", "condemnation", "confederation", "configuration", "confirmation",
    "confrontation", "congregation", "conjunction", "consciousness", "consecutive",
    "consensus", "consequence", "conservation", "considerable", "consistency",
    "consolidate", "conspiracy", "constituency", "constitution", "construction",
    "consultation", "consumption", "contamination", "contemplation", "contemporary",
    "contentious", "contingency", "contradiction", "contribution", "controversial",
    "convenience", "conventional", "conversation", "conversion", "conviction",
    "cooperation", "coordination", "corporation", "correlation", "correspondence",
    "corruption", "counseling", "credibility", "criterion", "cultivation",
    "curiosity", "curriculum", "customary", "declaration", "dedication",
    "deficiency", "definitive", "degradation", "deliberate", "demonstration",
    "denomination", "deprivation", "derivative", "descendant", "designation",
    "destination", "determination", "devastation", "diagnosis", "differentiation",
    "diplomacy", "disability", "disappearance", "disappointment", "discipline",
    "disclosure", "discrimination", "displacement", "disposition", "disproportionate",
    "disruption", "dissertation", "distinction", "distribution", "diversification",
    "documentation", "dominance", "dysfunction", "ecclesiastical", "ecological",
]

C1_EXPANDED = [
    # Advanced academic vocabulary
    "aberrant", "abeyance", "abjure", "abnegate", "abrogate",
    "abscond", "abstention", "abstraction", "abysmal", "accede",
    "accentuate", "acclimate", "accolade", "accost", "accrue",
    "acerbic", "acquiescence", "acrimony", "adamant", "adjudicate",
    "admonition", "adroit", "adulation", "adversary", "advocacy",
    "affable", "affectation", "affidavit", "affliction", "aggrandize",
    "aggrieve", "alchemy", "alienation", "alleviation", "alliteration",
    "allusion", "altruism", "amalgamation", "ambience", "amelioration",
    "amenable", "amiable", "amicable", "amnesty", "amorphous",
    "anachronistic", "analogical", "anarchy", "anathema", "ancillary",
    "anecdotal", "animosity", "annihilate", "annotation", "anomaly",
    "antagonism", "anthropology", "antidote", "antipathy", "antiquated",
    "antithesis", "apathetic", "apocalyptic", "apocryphal", "appease",
    "appellation", "apprehensive", "aptitude", "arbitrary", "arbitration",
    "arcane", "archaic", "archetype", "arduous", "aristocracy",
    "articulation", "artifice", "ascetic", "aspersion", "assiduous",
    "assimilation", "assuage", "astute", "atrophy", "attenuate",
    "audacious", "augment", "auspicious", "austere", "authoritarian",
    "avarice", "aversion", "axiom", "bastion", "beatific",
    "bedlam", "beguile", "behemoth", "belabor", "beleaguer",
    "bellicose", "belligerent", "benediction", "benefactor", "benign",
    "berate", "beseech", "besmirch", "bestow", "betoken",
    "blasphemy", "blatant", "blight", "bombastic", "boorish",
    "bourgeois", "brandish", "bravado", "brevity", "bureaucracy",
    "burgeon", "burlesque", "buttress", "cabal", "cachet",
    "cadence", "cajole", "calamity", "caliber", "calumny",
    "candor", "cantankerous", "capacious", "capitulate", "capricious",
    "captious", "cardinal", "carnage", "carouse", "castigate",
    "catalyst", "categorical", "caustic", "cavalier", "caveat",
    "censorious", "censure", "cerebral", "certitude", "chagrin",
    "charlatan", "chastise", "chicanery", "chimerical", "choleric",
    "circuitous", "circumscribe", "circumspect", "circumvent", "clamor",
    "clandestine", "clemency", "cliché", "coalesce", "coercion",
    "cogent", "cognizant", "coherence", "collateral", "colloquial",
    "collusion", "combustion", "commensurate", "commiserate", "commodious",
    "compatible", "compendium", "complacent", "compliant", "complicity",
    "composure", "compunction", "concatenation", "conceit", "concerted",
    "concession", "conciliatory", "concoct", "concomitant", "concord",
    "concurrence", "condescend", "condolence", "conducive", "conflagration",
    "confluence", "conformity", "confound", "congenial", "conglomerate",
    "conjecture", "conjure", "connivance", "connoisseur", "conscientious",
    "consecrate", "consonance", "conspicuous", "consternation", "constrain",
    "consummate", "contagious", "contemplate", "contemptuous", "contention",
    "contiguous", "continuum", "contravene", "contrite", "contrived",
    "conundrum", "convene", "convergence", "conversant", "convivial",
    "convoluted", "copious", "corollary", "corpulent", "corroborate",
]

C2_EXPANDED = [
    # Championship and rare vocabulary
    "abnegation", "abstemious", "acephalous", "acquiescent", "adumbrate",
    "aegis", "afflatus", "agglomerate", "agoraphobia", "alacrity",
    "aleatory", "algorithm", "allotrope", "alopecia", "amaranthine",
    "ambidextrous", "ameliorate", "anacoluthon", "anagnorisis", "analgesic",
    "anaphora", "anfractuous", "animadversion", "antediluvian", "anthropomorphism",
    "antinomy", "antipodes", "aphorism", "apocope", "apogee",
    "apoplectic", "aporia", "apostasy", "apotheosis", "appurtenance",
    "arboreal", "arcanum", "archipelago", "arrogate", "asceticism",
    "asperity", "asseverate", "assonance", "atavism", "atelier",
    "augury", "autochthonous", "autodidact", "avatar", "avuncular",
    "badinage", "balustrade", "basilica", "bathos", "beatitude",
    "bedizen", "bellwether", "benighted", "bequest", "bête noire",
    "bibliophile", "bilious", "blatherskite", "bloviate", "brachiate",
    "braggadocio", "bric-a-brac", "bromide", "bucolic", "caduceus",
    "calligraphy", "callipygian", "calumniate", "canard", "canorous",
    "caparison", "capitulation", "captivate", "carcinogen", "cartography",
    "cataclysm", "catechism", "catharsis", "cauterize", "celerity",
    "chiaroscuro", "chimera", "chrysalis", "churlish", "circumlocution",
    "clairvoyant", "claustrophobia", "clerihew", "cloister", "codicil",
    "cognomen", "colophon", "comestible", "commination", "compendious",
    "concatenate", "concupiscence", "confabulate", "congeries", "contumacious",
    "contumely", "convocation", "copacetic", "cormorant", "cornucopia",
    "coruscate", "cosset", "countermand", "countervail", "crepuscular",
    "cupidity", "curmudgeon", "cynosure", "dalliance", "debacle",
    "declaim", "declivity", "decorum", "decrepitude", "defenestrate",
    "deign", "deleterious", "deliquesce", "demotic", "denouement",
    "deprecation", "deracinate", "dereliction", "derision", "derogate",
    "descant", "desiccate", "desideratum", "desuetude", "desultory",
    "devolve", "dexterity", "diablerie", "diacritical", "dialectic",
    "diaphanous", "diaspora", "diatribe", "dichotomy", "didactic",
    "diffident", "dilatory", "dilettante", "disabuse", "discombobulate",
    "discomfit", "discursive", "disingenuous", "disquisition", "dissemble",
    "dissimulate", "dissolution", "dissonance", "distrait", "divagation",
    "doppelganger", "dotage", "doughty", "dour", "draconian",
    "dudgeon", "dulcet", "ebullience", "ecumenical", "edacious",
    "edifice", "effervescence", "efficacious", "efflorescence", "effrontery",
    "effulgent", "egalitarian", "egregious", "élan", "eleemosynary",
    "elegy", "elision", "elocution", "emaciate", "emendation",
    "emollient", "emolument", "empiricism", "encomium", "endemic",
    "enervation", "ennui", "enormity", "ephemeron", "epicene",
    "epicurean", "epigram", "epilogue", "epiphany", "epistemology",
    "epithet", "equanimity", "equinox", "equipoise", "equivocate",
    "eremite", "erstwhile", "erudition", "eschatology", "escutcheon",
    "esoteric", "esprit", "ethereal", "etymology", "eugenics",
    "eulogy", "euphemism", "euphony", "evanescent", "excoriate",
    "exculpate", "execrable", "exegesis", "exemplar", "exigency",
    "existential", "exorcism", "expatiate", "expiate", "expletive",
    "expostulate", "expunge", "expurgate", "extant", "extemporaneous",
    "extenuate", "extirpate", "extraneous", "extrapolate", "facetious",
    "factitious", "fait accompli", "fastidious", "fatuous", "feckless",
    "fecund", "feign", "felicitous", "feral", "fervent",
    "festoon", "fiduciary", "filibuster", "fissure", "flaccid",
    "flagitious", "flagrant", "flibbertigibbet", "florid", "flotsam",
    "flummox", "foible", "foist", "folderol", "forbearance",
    "fortuitous", "fractious", "frangible", "fratricide", "frenetic",
    "friable", "froward", "frowzy", "fructify", "frugal",
    "fugacious", "fulminate", "fulsome", "funereal", "furtive",
    "fustigate", "gainsay", "gallimaufry", "gambit", "garrulous",
    "gasconade", "gauche", "genuflect", "gerrymander", "gesticulate",
    "glabrous", "grandiloquent", "gratuitous", "gregarious", "guffaw",
    "guile", "guileless", "gustatory", "hagiography", "halcyon",
    "hapless", "harangue", "harbinger", "hegemony", "heinous",
    "heliocentric", "hemophilia", "heresy", "hermetic", "heterodox",
    "heterogeneous", "heuristic", "hiatus", "hierarchy", "hieroglyphic",
    "hirsute", "historiography", "histrionic", "hoary", "homage",
    "homily", "homogeneous", "honorific", "hubris", "husbandry",
    "hyperbole", "iconoclast", "idiosyncrasy", "ignominious", "illimitable",
    "imbroglio", "immolate", "immutable", "impassive", "impecunious",
    "impediment", "imperious", "imperturbable", "impervious", "impetuous",
    "impinge", "implacable", "implicate", "impolitic", "importune",
    "imprecation", "imprimatur", "impromptu", "impudent", "impugn",
    "impunity", "imputation", "inadvertent", "inalienable", "incandescent",
    "incantation", "inchoate", "incipient", "incisive", "incognito",
    "incommodious", "incorrigible", "incredulous", "incubus", "inculcate",
    "inculpate", "incumbent", "incursion", "indefatigable", "indelible",
    "indigenous", "indigent", "indolent", "indomitable", "ineffable",
    "ineluctable", "inexorable", "infernal", "infinitesimal", "ingenuous",
    "ingratiate", "inimical", "inimitable", "iniquity", "innuendo",
    "inordinate", "inscrutable", "insidious", "insipid", "insouciant",
    "insuperable", "insurgent", "intemperate", "intercession", "interlocutor",
    "interminable", "internecine", "interpolate", "interregnum", "intimation",
    "intractable", "intransigent", "intrepid", "introspection", "inundate",
    "inure", "invective", "inveigh", "inveigle", "inveterate",
    "invidious", "irascible", "iridescent", "irresolute", "iterate",
]

def get_audio_subdir(audio_filename):
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
    url = f"{MW_API_URL}/{word}?key={MW_API_KEY}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            if not data or not isinstance(data[0], dict):
                return None

            entry = data[0]
            headword = entry.get('hwi', {}).get('hw', word).replace('*', '')
            fl = entry.get('fl', 'noun')
            pos_chinese = POS_MAP.get(fl.lower(), '名詞')
            shortdef = entry.get('shortdef', [''])
            definition = shortdef[0] if shortdef else ''

            prs = entry.get('hwi', {}).get('prs', [])
            audio_filename = None
            if prs and 'sound' in prs[0]:
                audio_filename = prs[0]['sound'].get('audio')

            return {
                'word': headword,
                'definition': definition,
                'partOfSpeech': pos_chinese,
                'audio_filename': audio_filename
            }
    except Exception as e:
        return None


def download_audio(word, audio_filename):
    if not audio_filename:
        return False
    subdir = get_audio_subdir(audio_filename)
    if not subdir:
        return False

    audio_url = f"{MW_AUDIO_BASE}/{subdir}/{audio_filename}.mp3"
    word_dir = AUDIO_DIR / word.lower()
    word_dir.mkdir(parents=True, exist_ok=True)
    output_path = word_dir / f"{word}_word.mp3"

    if output_path.exists():
        return True

    try:
        with urllib.request.urlopen(audio_url, timeout=10) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())
        return True
    except:
        return False


def load_existing_words():
    existing = set()
    for filename in ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']:
        filepath = SCRIPT_DIR / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                for w in json.load(f):
                    existing.add(w['word'].lower())
    return existing


def process_words(word_list, cefr_level, difficulty_base, existing_words):
    entries = []
    taiwan_stages = {
        'A1': '小學1-3年級', 'A2': '小學4-6年級', 'B1': '中學7-9年級',
        'B2': '高中10-12年級', 'C1': '大學', 'C2': '英文高手'
    }

    new_words = [w for w in word_list if w.lower() not in existing_words]
    total = len(new_words)

    print(f"\n{cefr_level}: Processing {total} new words...")

    for i, word in enumerate(new_words, 1):
        data = fetch_word_data(word)
        if data:
            position = i / max(total, 1)
            difficulty_range = 15 if cefr_level in ['A1', 'A2'] else 20
            difficulty = min(100, int(difficulty_base + (position * difficulty_range)))

            # Generate simple sentence
            if data['partOfSpeech'] == '名詞':
                sentence = f"The {data['word']} is remarkable."
            elif data['partOfSpeech'] == '動詞':
                sentence = f"They {data['word']} regularly."
            elif data['partOfSpeech'] == '形容詞':
                sentence = f"It was quite {data['word']}."
            else:
                sentence = f"The word {data['word']} is useful."

            entry = {
                'word': data['word'],
                'definition': data['definition'],
                'sentence': sentence,
                'partOfSpeech': data['partOfSpeech'],
                'difficulty': difficulty,
                'cefr_level': cefr_level,
                'taiwan_stage': taiwan_stages.get(cefr_level, '')
            }
            entries.append(entry)
            existing_words.add(data['word'].lower())

            # Download audio
            if data.get('audio_filename'):
                download_audio(data['word'], data['audio_filename'])

            if i % 20 == 0:
                print(f"  [{i}/{total}] {data['word']}")
                time.sleep(0.3)

        if i % 10 == 0:
            time.sleep(0.2)

    print(f"  Added {len(entries)} words")
    return entries


def main():
    print("=" * 60)
    print("Expanding Dictionary with More Words")
    print("=" * 60)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    existing_words = load_existing_words()
    print(f"Existing words: {len(existing_words)}")

    all_entries = []

    word_lists = [
        (A1_EXPANDED, 'A1', 0),
        (A2_EXPANDED, 'A2', 15),
        (B2_EXPANDED, 'B2', 50),
        (C1_EXPANDED, 'C1', 70),
        (C2_EXPANDED, 'C2', 85),
    ]

    for words, cefr, base_diff in word_lists:
        entries = process_words(words, cefr, base_diff, existing_words)
        all_entries.extend(entries)

    # Merge into dictionary files
    files = {}
    for filename in ['elementary.json', 'middle.json', 'high.json', 'university.json', 'expert.json']:
        with open(SCRIPT_DIR / filename, 'r') as f:
            files[filename] = json.load(f)

    for entry in all_entries:
        diff = entry.get('difficulty', 50)
        if diff <= 35:
            files['elementary.json'].append(entry)
        elif diff <= 55:
            files['middle.json'].append(entry)
        elif diff <= 75:
            files['high.json'].append(entry)
        elif diff <= 90:
            files['university.json'].append(entry)
        else:
            files['expert.json'].append(entry)

    for filename, words in files.items():
        words.sort(key=lambda x: x.get('difficulty', 0))
        with open(SCRIPT_DIR / filename, 'w') as f:
            json.dump(words, f, ensure_ascii=False, indent=2)
        print(f"{filename}: {len(words)} words")

    print(f"\nTotal new words added: {len(all_entries)}")
    print("Done!")


if __name__ == "__main__":
    main()

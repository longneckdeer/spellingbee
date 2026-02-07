#!/usr/bin/env python3
"""
Enhanced dictionary fixer for spelling bee game.
Uses comprehensive word analysis to generate proper Traditional Chinese definitions
and natural English sentences.
"""

import json
import os
import re

# Comprehensive word-to-definition mapping
WORD_DEFINITIONS = {
    # Core verbs
    "see": "看見", "seeing": "看見（動名詞）", "saw": "看見（過去式）", "seen": "看見（過去分詞）",
    "write": "寫", "writing": "寫作", "written": "書寫的；寫成的", "wrote": "寫（過去式）",
    "choose": "選擇", "choosing": "選擇（動名詞）", "chose": "選擇（過去式）", "chosen": "被選中的",
    "suggest": "建議", "suggesting": "建議（動名詞）", "suggested": "建議的",
    "afford": "負擔得起；提供", "affording": "負擔得起（動名詞）", "afforded": "負擔得起（過去式）",
    "allow": "允許", "allows": "允許（第三人稱單數）", "allowing": "允許（動名詞）", "allowed": "被允許的",
    "plan": "計劃", "planning": "計劃（動名詞）", "planned": "計劃好的",
    "suffer": "遭受；受苦", "suffers": "遭受（第三人稱單數）", "suffering": "痛苦", "suffered": "遭受了",
    "support": "支持；支撐", "supports": "支持（第三人稱單數）", "supporting": "支持的", "supported": "被支持的",
    "suppose": "假設；認為", "supposes": "假設（第三人稱單數）", "supposing": "假設", "supposed": "應該的；假設的",
    "include": "包括", "includes": "包括（第三人稱單數）", "including": "包括", "included": "被包括的",
    "watch": "觀看；手錶", "watches": "觀看（第三人稱單數）", "watching": "觀看（動名詞）", "watched": "被觀看的",
    "remember": "記得", "remembers": "記得（第三人稱單數）", "remembering": "記憶", "remembered": "被記住的",
    "consider": "考慮", "considers": "考慮（第三人稱單數）", "considering": "考慮", "considered": "被考慮的",
    "develop": "發展；開發", "develops": "發展（第三人稱單數）", "developing": "發展中的", "developed": "發達的；開發的",
    "promise": "承諾", "promises": "承諾（第三人稱單數）", "promising": "有前途的", "promised": "承諾的",
    "notice": "注意；通知", "notices": "注意（第三人稱單數）", "noticing": "注意（動名詞）", "noticed": "被注意的",
    "prepare": "準備", "prepares": "準備（第三人稱單數）", "preparing": "準備（動名詞）", "prepared": "準備好的",
    "protect": "保護", "protects": "保護（第三人稱單數）", "protecting": "保護（動名詞）", "protected": "受保護的",
    "receive": "接收；收到", "receives": "接收（第三人稱單數）", "receiving": "接收（動名詞）", "received": "收到的",
    "reduce": "減少", "reduces": "減少（第三人稱單數）", "reducing": "減少（動名詞）", "reduced": "減少的",
    "refuse": "拒絕", "refuses": "拒絕（第三人稱單數）", "refusing": "拒絕（動名詞）", "refused": "被拒絕的",
    "remain": "保持；剩餘", "remains": "遺體；保持", "remaining": "剩餘的", "remained": "保持了",
    "remove": "移除", "removes": "移除（第三人稱單數）", "removing": "移除（動名詞）", "removed": "被移除的",
    "repeat": "重複", "repeats": "重複（第三人稱單數）", "repeating": "重複的", "repeated": "重複的",
    "replace": "取代；替換", "replaces": "取代（第三人稱單數）", "replacing": "取代（動名詞）", "replaced": "被取代的",
    "report": "報告；報導", "reports": "報告（第三人稱單數）", "reporting": "報導", "reported": "被報導的",
    "represent": "代表", "represents": "代表（第三人稱單數）", "representing": "代表（動名詞）", "represented": "被代表的",

    # Common nouns
    "bottom": "底部",
    "career": "職業；生涯",
    "college": "大學；學院",
    "degree": "學位；程度",
    "dollar": "美元",
    "effort": "努力",
    "night": "夜晚",
    "right": "右邊；權利；正確的",
    "research": "研究",
    "argument": "爭論；論點",
    "army": "軍隊",
    "audience": "觀眾；聽眾",
    "behavior": "行為",
    "birth": "出生",
    "budget": "預算",
    "chairman": "主席",
    "character": "性格；角色；文字",
    "customer": "顧客",
    "director": "導演；主管",
    "community": "社區；社群",
    "school": "學校",

    # Common adjectives
    "correct": "正確的",
    "married": "已婚的",
    "narrow": "狹窄的",
    "overall": "整體的；全面的",
    "smooth": "光滑的；順利的",
    "sudden": "突然的",
    "weird": "奇怪的；怪異的",
    "willing": "願意的",
    "wooden": "木製的",
    "worried": "擔心的",
    "yellow": "黃色的",
    "angry": "生氣的",
    "beautiful": "美麗的；漂亮的",
    "confused": "困惑的",
    "creative": "有創造力的",
    "cultural": "文化的",
    "dangerous": "危險的",
    "dirty": "骯髒的",
    "empty": "空的",
    "familiar": "熟悉的",
    "historic": "歷史性的",
    "internal": "內部的",
    "pleasant": "令人愉快的",
    "powerful": "強大的",
    "practical": "實用的；實際的",
    "previous": "以前的；先前的",
    "religious": "宗教的",
    "southern": "南方的",
    "spiritual": "精神的；靈性的",
    "standard": "標準的",
    "national": "國家的；全國的",
    "equal": "平等的；相等的",
    "quiet": "安靜的",
    "little": "小的；少的",

    # Common words with multiple meanings
    "present": "目前的；禮物；呈現",
    "second": "第二；秒",
    "minute": "分鐘；微小的",
    "fine": "好的；罰款",
    "mean": "意思是；刻薄的",
    "kind": "種類；仁慈的",
    "close": "關閉；親密的",
}

# Sentence templates by part of speech
SENTENCE_TEMPLATES = {
    "動詞": {
        "base": [
            "I {word} every day.",
            "They {word} regularly.",
            "We need to {word} carefully.",
            "Please {word} this task.",
            "Students should {word} hard.",
        ],
        "ing": [
            "She is {word} right now.",
            "They are {word} together.",
            "He enjoys {word}.",
            "We started {word} yesterday.",
            "{word} is important for success.",
        ],
        "ed": [
            "They {word} yesterday.",
            "She has {word} many times.",
            "The work was {word} carefully.",
            "He {word} the instructions.",
            "We {word} last week.",
        ],
        "s": [
            "He {word} every morning.",
            "She {word} very well.",
            "It {word} quickly.",
            "Everyone {word} this rule.",
            "The teacher {word} carefully.",
        ],
    },
    "名詞": {
        "singular": [
            "The {word} is very important.",
            "This {word} is interesting.",
            "Everyone needs a {word}.",
            "The {word} was successful.",
            "I need a new {word}.",
        ],
        "plural": [
            "These {word} are useful.",
            "The {word} are very important.",
            "Many {word} were present.",
            "We have several {word}.",
            "All {word} are welcome.",
        ],
    },
    "形容詞": {
        "base": [
            "The weather is {word} today.",
            "It was a {word} experience.",
            "She is very {word}.",
            "This seems {word}.",
            "The room looks {word}.",
        ],
        "er": [
            "This is {word} than before.",
            "She is {word} than her sister.",
            "The new version is {word}.",
            "Today feels {word}.",
            "This method is {word}.",
        ],
        "est": [
            "This is the {word} one.",
            "She is the {word} student.",
            "That was the {word} day.",
            "He is the {word} person here.",
            "This is the {word} option.",
        ],
    },
    "副詞": {
        "ly": [
            "She spoke {word} to everyone.",
            "He worked {word} on the project.",
            "They responded {word}.",
            "The plan was executed {word}.",
            "She {word} agreed.",
        ],
    },
}

def analyze_word_form(word):
    """Analyze word to determine its form and base."""
    word_lower = word.lower()

    # Check for common endings
    if word_lower.endswith("ing"):
        return "ing", word_lower[:-3] if not word_lower[:-3].endswith("e") else word_lower[:-3] + "e"
    elif word_lower.endswith("ed"):
        base = word_lower[:-2]
        if base.endswith("i"):  # like "tried" -> "try"
            base = base[:-1] + "y"
        return "ed", base
    elif word_lower.endswith("s") and not word_lower.endswith("ss"):
        base = word_lower[:-1]
        if base.endswith("ie"):  # like "tries" -> "try"
            base = base[:-2] + "y"
        elif base.endswith("e"):  # like "reduces" -> "reduce"
            base = base
        return "s", base
    elif word_lower.endswith("ly"):
        return "ly", word_lower[:-2]
    elif word_lower.endswith("er") and len(word_lower) > 4:
        return "er", word_lower[:-2]
    elif word_lower.endswith("est") and len(word_lower) > 5:
        return "est", word_lower[:-3]

    return "base", word_lower

def get_smart_definition(word):
    """Get or generate a smart Traditional Chinese definition."""
    word_lower = word.lower()

    # Direct match
    if word_lower in WORD_DEFINITIONS:
        return WORD_DEFINITIONS[word_lower]

    # Analyze word form
    form, base = analyze_word_form(word)

    # Try to find base word
    if base in WORD_DEFINITIONS:
        base_def = WORD_DEFINITIONS[base]

        if form == "ing":
            return f"{base_def}（動名詞/進行式）"
        elif form == "ed":
            return f"{base_def}（過去式/過去分詞）"
        elif form == "s":
            return f"{base_def}（複數/第三人稱單數）"
        elif form == "ly":
            return f"{base_def}地"
        elif form == "er":
            return f"更{base_def}"
        elif form == "est":
            return f"最{base_def}"

    # Common suffix patterns
    if word_lower.endswith("tion") or word_lower.endswith("sion"):
        return f"{word}（名詞）"
    elif word_lower.endswith("ment"):
        return f"{word}（名詞）"
    elif word_lower.endswith("ness"):
        return f"{word}（名詞）"
    elif word_lower.endswith("able") or word_lower.endswith("ible"):
        return f"可{word[:- 4]}的"
    elif word_lower.endswith("ful"):
        return f"充滿{word[:-3]}的"
    elif word_lower.endswith("less"):
        return f"沒有{word[:-4]}的"
    elif word_lower.endswith("ous"):
        return f"{word[:-3]}的"
    elif word_lower.endswith("ive"):
        return f"{word[:-3]}的"
    elif word_lower.endswith("al"):
        return f"{word[:-2]}的"

    # If all else fails, return placeholder
    return f"{word}"

def get_smart_sentence(word, part_of_speech, definition):
    """Generate a contextually appropriate sentence."""
    word_lower = word.lower()
    form, base = analyze_word_form(word)

    # Determine word category
    if "動詞" in part_of_speech:
        if form == "ing":
            templates = SENTENCE_TEMPLATES["動詞"]["ing"]
        elif form == "ed":
            templates = SENTENCE_TEMPLATES["動詞"]["ed"]
        elif form == "s":
            templates = SENTENCE_TEMPLATES["動詞"]["s"]
        else:
            templates = SENTENCE_TEMPLATES["動詞"]["base"]

    elif "名詞" in part_of_speech:
        if word_lower.endswith("s"):
            templates = SENTENCE_TEMPLATES["名詞"]["plural"]
        else:
            templates = SENTENCE_TEMPLATES["名詞"]["singular"]

    elif "形容詞" in part_of_speech:
        if form == "er":
            templates = SENTENCE_TEMPLATES["形容詞"]["er"]
        elif form == "est":
            templates = SENTENCE_TEMPLATES["形容詞"]["est"]
        else:
            templates = SENTENCE_TEMPLATES["形容詞"]["base"]

    elif "副詞" in part_of_speech:
        templates = SENTENCE_TEMPLATES["副詞"]["ly"]

    else:
        # Default fallback
        templates = [f"The {word_lower} is important."]

    # Select appropriate template (use hash of word for consistency)
    import hashlib
    idx = int(hashlib.md5(word_lower.encode()).hexdigest(), 16) % len(templates)
    template = templates[idx]

    return template.replace("{word}", word_lower)

def should_fix_definition(definition, word):
    """Check if definition needs fixing."""
    if not definition:
        return True
    if "（詞）" in definition:
        return True
    if definition == word:
        return True
    if definition.endswith("的中文意思"):
        return True
    # Check for placeholder patterns like "word（名詞）"
    if definition == f"{word}（名詞）":
        return True
    if definition == f"{word}（動詞）":
        return True
    if definition == f"{word}（形容詞）":
        return True
    if definition == f"{word}（副詞）":
        return True
    if definition == f"{word}（動詞進行式）" and word.endswith("ing"):
        # This is acceptable for -ing forms without better definition
        return False
    if definition == f"{word}（動詞過去式）" and word.endswith("ed"):
        return False
    if definition == f"{word}（名詞）" and "（名詞）" in definition:
        return True

    return False

def should_fix_sentence(sentence, word):
    """Check if sentence needs fixing."""
    if not sentence:
        return True
    if f"The {word} is interesting" in sentence:
        return True
    if f"The {word} was interesting" in sentence:
        return True
    if len(sentence.split()) < 4:
        return True
    # Check for obviously bad patterns
    bad_patterns = [
        "is interesting.",
        "was interesting.",
        "are interesting.",
    ]
    for pattern in bad_patterns:
        if sentence.endswith(pattern) and sentence.count(" ") < 5:
            return True

    return False

def fix_entry(entry):
    """Fix a single dictionary entry with smart analysis."""
    word = entry.get("word", "")
    current_def = entry.get("definition", "")
    current_sentence = entry.get("sentence", "")
    part_of_speech = entry.get("partOfSpeech", "名詞")

    # Fix definition if needed
    if should_fix_definition(current_def, word):
        new_def = get_smart_definition(word)
        entry["definition"] = new_def

    # Fix sentence if needed
    if should_fix_sentence(current_sentence, word):
        new_sentence = get_smart_sentence(word, part_of_speech, entry["definition"])
        entry["sentence"] = new_sentence

    return entry

def fix_file(file_path):
    """Fix all entries in a JSON file."""
    print(f"\nProcessing: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not isinstance(data, list):
        print(f"Error: Expected list, got {type(data)}")
        return

    total = len(data)
    fixed_count = 0

    for i, entry in enumerate(data):
        if i % 100 == 0:
            print(f"  Progress: {i}/{total} ({i*100//total}%)")

        original_entry = entry.copy()
        fixed_entry = fix_entry(entry)

        if fixed_entry != original_entry:
            fixed_count += 1
            data[i] = fixed_entry

    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  Fixed {fixed_count}/{total} entries ({fixed_count*100//total}%)")
    print(f"  ✓ Completed: {file_path}")

def main():
    """Main function to fix all dictionary files."""
    base_path = "/Users/jeffkuo/My Drive/AIProjects/spellingbee/src/gameTypes/english-spelling/data"

    files = [
        "elementary.json",
        "middle.json",
        "high.json",
        "university.json",
        "expert.json"
    ]

    print("=" * 60)
    print("SPELLING BEE DICTIONARY FIXER V2")
    print("=" * 60)

    for filename in files:
        file_path = os.path.join(base_path, filename)
        if os.path.exists(file_path):
            fix_file(file_path)
        else:
            print(f"Warning: File not found: {file_path}")

    print("\n" + "=" * 60)
    print("ALL FILES PROCESSED")
    print("=" * 60)

if __name__ == "__main__":
    main()

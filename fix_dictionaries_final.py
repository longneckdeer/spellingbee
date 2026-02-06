#!/usr/bin/env python3
"""
Final comprehensive dictionary fixer that also corrects part of speech.
"""

import json
import os
import hashlib

# Comprehensive corrections
WORD_DATA = {
    # Verbs and their forms
    "see": {"def": "看見", "pos": "動詞", "sent": "I can see the mountains from here."},
    "seeing": {"def": "看見（動名詞/進行式）", "pos": "動詞", "sent": "She is seeing a doctor today."},
    "saw": {"def": "看見（過去式）；鋸子", "pos": "動詞", "sent": "I saw a beautiful sunset yesterday."},
    "seen": {"def": "看見（過去分詞）", "pos": "動詞", "sent": "Have you seen this movie before?"},

    "write": {"def": "寫", "pos": "動詞", "sent": "Please write your name here."},
    "writing": {"def": "寫作；書寫", "pos": "名詞", "sent": "Her writing is very clear and beautiful."},
    "written": {"def": "書面的；寫成的", "pos": "形容詞", "sent": "Please submit a written report by Friday."},
    "wrote": {"def": "寫（過去式）", "pos": "動詞", "sent": "She wrote a letter to her friend."},

    "choose": {"def": "選擇", "pos": "動詞", "sent": "You can choose any color you like."},
    "choosing": {"def": "選擇（動名詞）", "pos": "動詞", "sent": "Choosing the right answer is difficult."},
    "chose": {"def": "選擇（過去式）", "pos": "動詞", "sent": "He chose the blue shirt."},
    "chosen": {"def": "被選中的", "pos": "形容詞", "sent": "The chosen candidates will be notified."},

    "suggest": {"def": "建議", "pos": "動詞", "sent": "I suggest we leave early to avoid traffic."},
    "suggesting": {"def": "建議（動名詞）", "pos": "動詞", "sent": "He is suggesting a new approach."},
    "suggested": {"def": "建議的；提議的", "pos": "形容詞", "sent": "The suggested time is 3 PM."},
    "suggests": {"def": "建議（第三人稱單數）", "pos": "動詞", "sent": "She suggests taking a break."},

    "afford": {"def": "負擔得起；提供", "pos": "動詞", "sent": "We cannot afford such expensive tickets."},
    "affording": {"def": "負擔得起（動名詞）", "pos": "動詞", "sent": "Affording a house is difficult these days."},
    "afforded": {"def": "負擔得起（過去式）", "pos": "動詞", "sent": "They afforded the luxury vacation."},

    "allow": {"def": "允許", "pos": "動詞", "sent": "Please allow me to explain."},
    "allows": {"def": "允許（第三人稱單數）", "pos": "動詞", "sent": "This rule allows students to leave early."},
    "allowing": {"def": "允許（動名詞）", "pos": "動詞", "sent": "Allowing extra time helps students succeed."},
    "allowed": {"def": "被允許的；准許的", "pos": "形容詞", "sent": "Smoking is not allowed in this building."},

    "plan": {"def": "計劃", "pos": "名詞", "sent": "We need a detailed plan for the project."},
    "planning": {"def": "計劃（動名詞）；規劃", "pos": "名詞", "sent": "Careful planning leads to success."},
    "planned": {"def": "計劃好的", "pos": "形容詞", "sent": "The planned event will start at noon."},
    "plans": {"def": "計劃（複數）", "pos": "名詞", "sent": "Our plans for the weekend include hiking."},

    "suffer": {"def": "遭受；受苦", "pos": "動詞", "sent": "Many people suffer from allergies."},
    "suffers": {"def": "遭受（第三人稱單數）", "pos": "動詞", "sent": "She suffers from migraines."},
    "suffering": {"def": "痛苦；苦難", "pos": "名詞", "sent": "The suffering caused by war is terrible."},
    "suffered": {"def": "遭受了（過去式）", "pos": "動詞", "sent": "They suffered great losses."},

    "support": {"def": "支持；支撐", "pos": "動詞", "sent": "I will support your decision."},
    "supports": {"def": "支持（第三人稱單數）", "pos": "動詞", "sent": "The team supports the new policy."},
    "supporting": {"def": "支持的；配角的", "pos": "形容詞", "sent": "He played a supporting role in the movie."},
    "supported": {"def": "被支持的", "pos": "形容詞", "sent": "The supported programs will continue."},

    "suppose": {"def": "假設；認為", "pos": "動詞", "sent": "I suppose you are right."},
    "supposes": {"def": "假設（第三人稱單數）", "pos": "動詞", "sent": "The theory supposes certain conditions."},
    "supposing": {"def": "假設", "pos": "動詞", "sent": "Supposing it rains, what should we do?"},
    "supposed": {"def": "應該的；假設的", "pos": "形容詞", "sent": "You are supposed to finish by Friday."},

    "include": {"def": "包括", "pos": "動詞", "sent": "The price does not include tax."},
    "includes": {"def": "包括（第三人稱單數）", "pos": "動詞", "sent": "The package includes free shipping."},
    "including": {"def": "包括", "pos": "介詞", "sent": "Everyone is invited, including children."},
    "included": {"def": "被包括的", "pos": "形容詞", "sent": "Breakfast is included in the room rate."},

    "watch": {"def": "觀看；手錶", "pos": "動詞", "sent": "I watch the news every evening."},
    "watches": {"def": "觀看（第三人稱單數）；手錶（複數）", "pos": "動詞", "sent": "He watches movies on weekends."},
    "watching": {"def": "觀看（動名詞）", "pos": "動詞", "sent": "She is watching TV right now."},
    "watched": {"def": "被觀看的", "pos": "形容詞", "sent": "The most watched program of the year."},

    "remember": {"def": "記得；記住", "pos": "動詞", "sent": "Please remember to lock the door."},
    "remembers": {"def": "記得（第三人稱單數）", "pos": "動詞", "sent": "She remembers everything clearly."},
    "remembering": {"def": "記憶；回憶", "pos": "動詞", "sent": "Remembering names is difficult for me."},
    "remembered": {"def": "被記住的", "pos": "形容詞", "sent": "He will be remembered as a great leader."},

    "consider": {"def": "考慮", "pos": "動詞", "sent": "We should consider all options."},
    "considers": {"def": "考慮（第三人稱單數）", "pos": "動詞", "sent": "The committee considers each application."},
    "considering": {"def": "考慮；鑑於", "pos": "介詞", "sent": "Considering the weather, we should stay home."},
    "considered": {"def": "被考慮的；經過深思熟慮的", "pos": "形容詞", "sent": "This is a carefully considered decision."},

    "develop": {"def": "發展；開發", "pos": "動詞", "sent": "We need to develop new skills."},
    "develops": {"def": "發展（第三人稱單數）", "pos": "動詞", "sent": "The company develops software."},
    "developing": {"def": "發展中的；開發中的", "pos": "形容詞", "sent": "Many developing countries need assistance."},
    "developed": {"def": "發達的；開發的", "pos": "形容詞", "sent": "Japan is a highly developed nation."},

    "promise": {"def": "承諾；諾言", "pos": "動詞", "sent": "I promise to help you."},
    "promises": {"def": "承諾（複數/第三人稱單數）", "pos": "名詞", "sent": "He always keeps his promises."},
    "promising": {"def": "有前途的；有希望的", "pos": "形容詞", "sent": "She is a promising young scientist."},
    "promised": {"def": "承諾的；答應的", "pos": "形容詞", "sent": "The promised reward never came."},

    "notice": {"def": "注意；通知", "pos": "動詞", "sent": "Did you notice the change?"},
    "notices": {"def": "注意（第三人稱單數）；通知（複數）", "pos": "動詞", "sent": "He never notices small details."},
    "noticing": {"def": "注意（動名詞）", "pos": "動詞", "sent": "She is noticing more details now."},
    "noticed": {"def": "被注意的", "pos": "形容詞", "sent": "The most noticed feature is the design."},

    "prepare": {"def": "準備", "pos": "動詞", "sent": "We need to prepare for the exam."},
    "prepares": {"def": "準備（第三人稱單數）", "pos": "動詞", "sent": "She prepares dinner every night."},
    "preparing": {"def": "準備（動名詞）", "pos": "動詞", "sent": "Preparing for tests takes time."},
    "prepared": {"def": "準備好的；有準備的", "pos": "形容詞", "sent": "Are you prepared for the interview?"},

    "protect": {"def": "保護", "pos": "動詞", "sent": "We must protect the environment."},
    "protects": {"def": "保護（第三人稱單數）", "pos": "動詞", "sent": "The law protects consumers."},
    "protecting": {"def": "保護（動名詞）", "pos": "動詞", "sent": "Protecting nature is everyone's duty."},
    "protected": {"def": "受保護的", "pos": "形容詞", "sent": "This is a protected wildlife area."},

    "receive": {"def": "接收；收到", "pos": "動詞", "sent": "Did you receive my email?"},
    "receives": {"def": "接收（第三人稱單數）", "pos": "動詞", "sent": "She receives many letters."},
    "receiving": {"def": "接收（動名詞）", "pos": "動詞", "sent": "Receiving feedback helps us improve."},
    "received": {"def": "收到的；公認的", "pos": "形容詞", "sent": "The received wisdom says otherwise."},

    "reduce": {"def": "減少；降低", "pos": "動詞", "sent": "We need to reduce waste."},
    "reduces": {"def": "減少（第三人稱單數）", "pos": "動詞", "sent": "Exercise reduces stress."},
    "reducing": {"def": "減少（動名詞）", "pos": "動詞", "sent": "Reducing costs is a priority."},
    "reduced": {"def": "減少的；降低的", "pos": "形容詞", "sent": "The store offers reduced prices."},

    "refuse": {"def": "拒絕", "pos": "動詞", "sent": "I refuse to give up."},
    "refuses": {"def": "拒絕（第三人稱單數）", "pos": "動詞", "sent": "She refuses to compromise."},
    "refusing": {"def": "拒絕（動名詞）", "pos": "動詞", "sent": "Refusing help is sometimes necessary."},
    "refused": {"def": "被拒絕的", "pos": "形容詞", "sent": "The refused application can be resubmitted."},

    "remain": {"def": "保持；剩餘", "pos": "動詞", "sent": "Please remain seated."},
    "remains": {"def": "遺體；遺跡；保持", "pos": "名詞", "sent": "The remains of the castle are impressive."},
    "remaining": {"def": "剩餘的；剩下的", "pos": "形容詞", "sent": "The remaining time is limited."},
    "remained": {"def": "保持了（過去式）", "pos": "動詞", "sent": "He remained calm during the crisis."},

    "remove": {"def": "移除；去除", "pos": "動詞", "sent": "Please remove your shoes."},
    "removes": {"def": "移除（第三人稱單數）", "pos": "動詞", "sent": "This cleaner removes stains easily."},
    "removing": {"def": "移除（動名詞）", "pos": "動詞", "sent": "Removing the old paint takes time."},
    "removed": {"def": "被移除的；遠離的", "pos": "形容詞", "sent": "The removed items will be recycled."},

    "repeat": {"def": "重複", "pos": "動詞", "sent": "Could you repeat that, please?"},
    "repeats": {"def": "重複（第三人稱單數）", "pos": "動詞", "sent": "History often repeats itself."},
    "repeating": {"def": "重複的；反覆的", "pos": "形容詞", "sent": "The repeating pattern is beautiful."},
    "repeated": {"def": "重複的；再三的", "pos": "形容詞", "sent": "Despite repeated warnings, he continued."},

    "replace": {"def": "取代；替換", "pos": "動詞", "sent": "We need to replace the batteries."},
    "replaces": {"def": "取代（第三人稱單數）", "pos": "動詞", "sent": "This new model replaces the old one."},
    "replacing": {"def": "取代（動名詞）", "pos": "動詞", "sent": "Replacing old equipment is expensive."},
    "replaced": {"def": "被取代的", "pos": "形容詞", "sent": "The replaced parts are still usable."},

    "report": {"def": "報告；報導", "pos": "動詞", "sent": "Please report any problems immediately."},
    "reports": {"def": "報告（複數/第三人稱單數）", "pos": "名詞", "sent": "The reports show positive results."},
    "reporting": {"def": "報導；報告", "pos": "動詞", "sent": "She is reporting from the scene."},
    "reported": {"def": "被報導的；據報導的", "pos": "形容詞", "sent": "The reported incident is under investigation."},

    "represent": {"def": "代表；象徵", "pos": "動詞", "sent": "These numbers represent our progress."},
    "represents": {"def": "代表（第三人稱單數）", "pos": "動詞", "sent": "The flag represents our nation."},
    "representing": {"def": "代表（動名詞）", "pos": "動詞", "sent": "She is representing our school."},
    "represented": {"def": "被代表的", "pos": "形容詞", "sent": "All represented groups agreed."},

    # Common nouns
    "bottom": {"def": "底部；末端", "pos": "名詞", "sent": "The treasure is at the bottom of the ocean."},
    "career": {"def": "職業；生涯", "pos": "名詞", "sent": "She has a successful career in medicine."},
    "college": {"def": "大學；學院", "pos": "名詞", "sent": "He is studying at college now."},
    "degree": {"def": "學位；程度", "pos": "名詞", "sent": "She has a degree in engineering."},
    "dollar": {"def": "美元", "pos": "名詞", "sent": "The book costs ten dollars."},
    "effort": {"def": "努力；力氣", "pos": "名詞", "sent": "Success requires hard effort."},
    "night": {"def": "夜晚；晚上", "pos": "名詞", "sent": "The stars shine brightly at night."},
    "right": {"def": "右邊；權利；正確的", "pos": "名詞", "sent": "Turn right at the next corner."},
    "research": {"def": "研究", "pos": "名詞", "sent": "His research focuses on climate change."},
    "argument": {"def": "爭論；論點", "pos": "名詞", "sent": "They had an argument about politics."},
    "army": {"def": "軍隊", "pos": "名詞", "sent": "He joined the army after graduation."},
    "audience": {"def": "觀眾；聽眾", "pos": "名詞", "sent": "The audience applauded loudly."},
    "behavior": {"def": "行為；舉止", "pos": "名詞", "sent": "Good behavior is important in class."},
    "birth": {"def": "出生；誕生", "pos": "名詞", "sent": "She celebrated the birth of her daughter."},
    "budget": {"def": "預算", "pos": "名詞", "sent": "We need to stay within the budget."},
    "chairman": {"def": "主席；會長", "pos": "名詞", "sent": "The chairman will speak first."},
    "character": {"def": "性格；角色；文字", "pos": "名詞", "sent": "She has a strong character."},
    "customer": {"def": "顧客；客戶", "pos": "名詞", "sent": "The customer is always right."},
    "director": {"def": "導演；主管；董事", "pos": "名詞", "sent": "The director made an excellent film."},
    "community": {"def": "社區；社群", "pos": "名詞", "sent": "Our community is very welcoming."},
    "school": {"def": "學校", "pos": "名詞", "sent": "Children go to school to learn."},

    # Common adjectives
    "correct": {"def": "正確的；對的", "pos": "形容詞", "sent": "Your answer is correct."},
    "married": {"def": "已婚的", "pos": "形容詞", "sent": "They have been married for ten years."},
    "narrow": {"def": "狹窄的；勉強的", "pos": "形容詞", "sent": "The road is too narrow for two cars."},
    "overall": {"def": "整體的；全面的", "pos": "形容詞", "sent": "The overall performance was excellent."},
    "smooth": {"def": "光滑的；順利的", "pos": "形容詞", "sent": "The surface is very smooth."},
    "sudden": {"def": "突然的", "pos": "形容詞", "sent": "There was a sudden change in weather."},
    "weird": {"def": "奇怪的；怪異的", "pos": "形容詞", "sent": "That was a weird dream."},
    "willing": {"def": "願意的；樂意的", "pos": "形容詞", "sent": "She is willing to help anytime."},
    "wooden": {"def": "木製的；木頭的", "pos": "形容詞", "sent": "We have a beautiful wooden table."},
    "worried": {"def": "擔心的；憂慮的", "pos": "形容詞", "sent": "She looks worried about the test."},
    "yellow": {"def": "黃色的", "pos": "形容詞", "sent": "The sun is bright yellow today."},
    "angry": {"def": "生氣的；憤怒的", "pos": "形容詞", "sent": "He was angry about the decision."},
    "beautiful": {"def": "美麗的；漂亮的", "pos": "形容詞", "sent": "The sunset is beautiful tonight."},
    "confused": {"def": "困惑的；糊塗的", "pos": "形容詞", "sent": "I am confused about the instructions."},
    "creative": {"def": "有創造力的", "pos": "形容詞", "sent": "She is a very creative artist."},
    "cultural": {"def": "文化的", "pos": "形容詞", "sent": "We visited many cultural sites."},
    "dangerous": {"def": "危險的", "pos": "形容詞", "sent": "Swimming here is dangerous."},
    "dirty": {"def": "骯髒的；污穢的", "pos": "形容詞", "sent": "Your hands are dirty, wash them."},
    "empty": {"def": "空的；空虛的", "pos": "形容詞", "sent": "The room is completely empty."},
    "familiar": {"def": "熟悉的", "pos": "形容詞", "sent": "This place looks familiar to me."},
    "historic": {"def": "歷史性的；有歷史意義的", "pos": "形容詞", "sent": "This is a historic building."},
    "internal": {"def": "內部的；國內的", "pos": "形容詞", "sent": "This is an internal company matter."},
    "pleasant": {"def": "令人愉快的；舒適的", "pos": "形容詞", "sent": "We had a pleasant conversation."},
    "powerful": {"def": "強大的；有影響力的", "pos": "形容詞", "sent": "He is a powerful leader."},
    "practical": {"def": "實用的；實際的", "pos": "形容詞", "sent": "That is a practical solution."},
    "previous": {"def": "以前的；先前的", "pos": "形容詞", "sent": "I liked the previous version better."},
    "religious": {"def": "宗教的；虔誠的", "pos": "形容詞", "sent": "They are very religious people."},
    "southern": {"def": "南方的；南部的", "pos": "形容詞", "sent": "We live in the southern region."},
    "spiritual": {"def": "精神的；靈性的", "pos": "形容詞", "sent": "Meditation is a spiritual practice."},
    "standard": {"def": "標準的；普通的", "pos": "形容詞", "sent": "This is the standard procedure."},
    "national": {"def": "國家的；全國的", "pos": "形容詞", "sent": "National security is very important."},
    "equal": {"def": "平等的；相等的", "pos": "形容詞", "sent": "All people are created equal."},
    "quiet": {"def": "安靜的；寧靜的", "pos": "形容詞", "sent": "Please be quiet in the library."},
    "little": {"def": "小的；少的", "pos": "形容詞", "sent": "She has a little sister."},
}

def fix_entry(entry):
    """Fix entry with comprehensive data."""
    word = entry.get("word", "")
    word_lower = word.lower()

    # If we have comprehensive data for this word, use it
    if word_lower in WORD_DATA:
        data = WORD_DATA[word_lower]
        entry["definition"] = data["def"]
        entry["partOfSpeech"] = data["pos"]
        entry["sentence"] = data["sent"]
        return entry

    # Otherwise, check if we need to fix based on current data
    current_def = entry.get("definition", "")
    current_sentence = entry.get("sentence", "")

    # Fix broken sentences
    bad_patterns = [
        "is interesting",
        "was interesting",
        "are interesting",
        "were interesting",
    ]

    needs_sentence_fix = False
    for pattern in bad_patterns:
        if pattern in current_sentence and len(current_sentence.split()) < 7:
            needs_sentence_fix = True
            break

    if needs_sentence_fix:
        # Generate a better sentence based on part of speech
        pos = entry.get("partOfSpeech", "名詞")

        if "動詞" in pos:
            if word_lower.endswith("ing"):
                entry["sentence"] = f"{word.capitalize()} is an important skill."
            elif word_lower.endswith("ed"):
                entry["sentence"] = f"The {word_lower} items were reviewed."
            elif word_lower.endswith("s"):
                entry["sentence"] = f"This {word_lower} very well."
            else:
                entry["sentence"] = f"We {word_lower} regularly."

        elif "名詞" in pos:
            if word_lower.endswith("s"):
                entry["sentence"] = f"The {word_lower} are important."
            else:
                entry["sentence"] = f"The {word_lower} is significant."

        elif "形容詞" in pos:
            entry["sentence"] = f"It is very {word_lower}."

        elif "副詞" in pos:
            entry["sentence"] = f"She spoke {word_lower}."

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
    base_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "gameTypes", "english-spelling", "data")

    files = [
        "elementary.json",
        "middle.json",
        "high.json",
        "university.json",
        "expert.json"
    ]

    print("=" * 60)
    print("FINAL COMPREHENSIVE DICTIONARY FIX")
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

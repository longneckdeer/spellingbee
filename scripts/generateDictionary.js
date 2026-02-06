/**
 * Dictionary Generator for Spelling Bee Game
 * Creates comprehensive word lists with difficulty ratings (1-100) based on:
 * - CEFR level (language proficiency)
 * - Spelling difficulty (phonetic irregularities, length, patterns)
 * - Taiwanese student familiarity
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Scoring factors for spelling difficulty
const DIFFICULTY_FACTORS = {
  // Silent letters add difficulty
  silentLetters: ['k', 'w', 'b', 'g', 'h', 'l', 'p', 't', 'u', 'c'],

  // Irregular patterns that are commonly misspelled
  irregularPatterns: [
    'ough', 'eigh', 'ough', 'augh', 'tion', 'sion', 'cian',
    'ie', 'ei', 'ough', 'gh', 'ph', 'ch', 'ck', 'dge'
  ],

  // Double consonants can be tricky
  doubleLetter: /([a-z])\1/,

  // Vowel combinations
  vowelCombos: ['oo', 'ee', 'ea', 'ou', 'ue', 'ie', 'ei', 'oi', 'oy', 'au', 'aw']
}

/**
 * Calculate spelling difficulty score (1-100)
 */
function calculateSpellingDifficulty(word, cefrLevel) {
  let score = 0

  // Base score from CEFR level
  const cefrScores = {
    'A1': 10, 'A2': 20, 'B1': 35, 'B2': 55, 'C1': 75, 'C2': 90
  }
  score = cefrScores[cefrLevel] || 50

  // Length factor (longer words are harder)
  if (word.length >= 10) score += 15
  else if (word.length >= 8) score += 10
  else if (word.length >= 6) score += 5
  else if (word.length <= 3) score -= 5

  // Silent letters
  const lowerWord = word.toLowerCase()
  if (lowerWord.startsWith('k') && lowerWord[1] === 'n') score += 8 // knight, know
  if (lowerWord.startsWith('w') && lowerWord[1] === 'r') score += 8 // write, wrong
  if (lowerWord.includes('gh') && !lowerWord.endsWith('gh')) score += 10 // light, night
  if (lowerWord.match(/mb$/)) score += 8 // climb, thumb
  if (lowerWord.match(/gn/)) score += 8 // sign, foreign

  // Irregular patterns
  for (const pattern of DIFFICULTY_FACTORS.irregularPatterns) {
    if (lowerWord.includes(pattern)) {
      score += 5
      break
    }
  }

  // Double letters (can be confusing)
  const doubleMatches = lowerWord.match(DIFFICULTY_FACTORS.doubleLetter)
  if (doubleMatches) {
    score += doubleMatches.length * 3
  }

  // Multiple vowel combinations
  let vowelComboCount = 0
  for (const combo of DIFFICULTY_FACTORS.vowelCombos) {
    if (lowerWord.includes(combo)) vowelComboCount++
  }
  if (vowelComboCount >= 2) score += 8
  else if (vowelComboCount === 1) score += 3

  // Uncommon letters
  if (/[qxz]/.test(lowerWord)) score += 5

  // Cap at 100
  return Math.min(100, Math.max(1, Math.round(score)))
}

/**
 * Generate comprehensive word dictionary
 */
function generateDictionary() {
  const dictionary = {
    // Level 1: Elementary (小學) - Difficulty 1-25
    elementary: [],

    // Level 2: Middle School (中學) - Difficulty 20-45
    middle: [],

    // Level 3: High School (高中) - Difficulty 40-65
    high: [],

    // Level 4: University (大學) - Difficulty 60-85
    university: [],

    // Level 5: Expert (英文高手) - Difficulty 80-100
    expert: []
  }

  // A1 Level Words (CEFR A1)
  const a1Words = [
    // Basic nouns
    { word: 'cat', definition: '貓', sentence: 'The cat is sleeping.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'dog', definition: '狗', sentence: 'I have a dog.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'book', definition: '書', sentence: 'This is my book.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'pen', definition: '筆', sentence: 'I need a pen.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'day', definition: '日子', sentence: 'Have a nice day.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'hand', definition: '手', sentence: 'Raise your hand.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'car', definition: '汽車', sentence: 'That is my car.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'home', definition: '家', sentence: 'I am going home.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'water', definition: '水', sentence: 'I need some water.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'food', definition: '食物', sentence: 'This food is good.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'time', definition: '時間', sentence: 'What time is it?', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'year', definition: '年', sentence: 'Happy New Year!', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'work', definition: '工作', sentence: 'I go to work.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'school', definition: '學校', sentence: 'I go to school every day.', partOfSpeech: 'noun', cefr: 'A1' },
    { word: 'child', definition: '小孩', sentence: 'She has one child.', partOfSpeech: 'noun', cefr: 'A1' },

    // Basic verbs
    { word: 'go', definition: '去', sentence: 'I go to school.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'come', definition: '來', sentence: 'Please come here.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'see', definition: '看見', sentence: 'I can see you.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'know', definition: '知道', sentence: 'I know the answer.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'get', definition: '得到', sentence: 'Can I get this?', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'make', definition: '製作', sentence: 'Let me make dinner.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'take', definition: '拿', sentence: 'Take this book.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'want', definition: '想要', sentence: 'I want to go home.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'give', definition: '給', sentence: 'Give me the pen.', partOfSpeech: 'verb', cefr: 'A1' },
    { word: 'use', definition: '使用', sentence: 'Can I use your phone?', partOfSpeech: 'verb', cefr: 'A1' },

    // Basic adjectives
    { word: 'good', definition: '好的', sentence: 'This is good.', partOfSpeech: 'adjective', cefr: 'A1' },
    { word: 'new', definition: '新的', sentence: 'I have a new car.', partOfSpeech: 'adjective', cefr: 'A1' },
    { word: 'big', definition: '大的', sentence: 'That is a big house.', partOfSpeech: 'adjective', cefr: 'A1' },
    { word: 'old', definition: '舊的', sentence: 'This is an old book.', partOfSpeech: 'adjective', cefr: 'A1' },
    { word: 'long', definition: '長的', sentence: 'It is a long road.', partOfSpeech: 'adjective', cefr: 'A1' },
    { word: 'small', definition: '小的', sentence: 'I have a small cat.', partOfSpeech: 'adjective', cefr: 'A1' },
    { word: 'happy', definition: '快樂的', sentence: 'I am happy today.', partOfSpeech: 'adjective', cefr: 'A1' },
    { word: 'easy', definition: '容易的', sentence: 'This test is easy.', partOfSpeech: 'adjective', cefr: 'A1' },
  ]

  // A2 Level Words
  const a2Words = [
    { word: 'answer', definition: '回答', sentence: 'Please answer the question.', partOfSpeech: 'verb', cefr: 'A2' },
    { word: 'begin', definition: '開始', sentence: 'Let us begin the lesson.', partOfSpeech: 'verb', cefr: 'A2' },
    { word: 'breakfast', definition: '早餐', sentence: 'I eat breakfast at seven.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'brother', definition: '兄弟', sentence: 'I have one brother.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'busy', definition: '忙碌的', sentence: 'I am very busy today.', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'careful', definition: '小心的', sentence: 'Be careful with that!', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'church', definition: '教堂', sentence: 'They go to church on Sunday.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'clothes', definition: '衣服', sentence: 'I need new clothes.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'country', definition: '國家', sentence: 'Which country are you from?', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'daughter', definition: '女兒', sentence: 'She has two daughters.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'difficult', definition: '困難的', sentence: 'This question is difficult.', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'doctor', definition: '醫生', sentence: 'I need to see a doctor.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'evening', definition: '傍晚', sentence: 'Good evening everyone.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'expensive', definition: '昂貴的', sentence: 'That car is expensive.', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'favorite', definition: '最喜歡的', sentence: 'What is your favorite color?', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'foreign', definition: '外國的', sentence: 'She speaks a foreign language.', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'garden', definition: '花園', sentence: 'We have a small garden.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'hospital', definition: '醫院', sentence: 'He is in the hospital.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'husband', definition: '丈夫', sentence: 'This is my husband.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'impossible', definition: '不可能的', sentence: 'Nothing is impossible.', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'interesting', definition: '有趣的', sentence: 'This book is very interesting.', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'kitchen', definition: '廚房', sentence: 'She is cooking in the kitchen.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'language', definition: '語言', sentence: 'How many languages can you speak?', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'library', definition: '圖書館', sentence: 'I study at the library.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'magazine', definition: '雜誌', sentence: 'I read fashion magazines.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'message', definition: '訊息', sentence: 'Did you get my message?', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'necessary', definition: '必要的', sentence: 'Sleep is necessary for health.', partOfSpeech: 'adjective', cefr: 'A2' },
    { word: 'neighbor', definition: '鄰居', sentence: 'My neighbor is very friendly.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'orange', definition: '橘子', sentence: 'I like orange juice.', partOfSpeech: 'noun', cefr: 'A2' },
    { word: 'passport', definition: '護照', sentence: 'Please show me your passport.', partOfSpeech: 'noun', cefr: 'A2' },
  ]

  // B1 Level Words
  const b1Words = [
    { word: 'achieve', definition: '達成', sentence: 'We can achieve our goals.', partOfSpeech: 'verb', cefr: 'B1' },
    { word: 'although', definition: '雖然', sentence: 'Although it is raining, we will go.', partOfSpeech: 'conjunction', cefr: 'B1' },
    { word: 'ancient', definition: '古代的', sentence: 'These are ancient ruins.', partOfSpeech: 'adjective', cefr: 'B1' },
    { word: 'approximately', definition: '大約', sentence: 'It costs approximately fifty dollars.', partOfSpeech: 'adverb', cefr: 'B1' },
    { word: 'argument', definition: '爭論', sentence: 'They had an argument yesterday.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'atmosphere', definition: '氣氛', sentence: 'The atmosphere was very tense.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'benefit', definition: '好處', sentence: 'Exercise has many benefits.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'campaign', definition: '運動', sentence: 'They started a new campaign.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'chairman', definition: '主席', sentence: 'The chairman gave a speech.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'colleague', definition: '同事', sentence: 'My colleague helped me today.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'commercial', definition: '商業的', sentence: 'This is a commercial building.', partOfSpeech: 'adjective', cefr: 'B1' },
    { word: 'concentrate', definition: '集中', sentence: 'Please concentrate on your work.', partOfSpeech: 'verb', cefr: 'B1' },
    { word: 'conclusion', definition: '結論', sentence: 'What is your conclusion?', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'confidence', definition: '信心', sentence: 'She has great confidence.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'convenient', definition: '方便的', sentence: 'This location is very convenient.', partOfSpeech: 'adjective', cefr: 'B1' },
    { word: 'corporation', definition: '公司', sentence: 'He works for a large corporation.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'democracy', definition: '民主', sentence: 'We live in a democracy.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'disappear', definition: '消失', sentence: 'The sun will disappear soon.', partOfSpeech: 'verb', cefr: 'B1' },
    { word: 'enthusiastic', definition: '熱心的', sentence: 'She is enthusiastic about sports.', partOfSpeech: 'adjective', cefr: 'B1' },
    { word: 'environment', definition: '環境', sentence: 'We must protect the environment.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'experiment', definition: '實驗', sentence: 'We did an experiment in class.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'extraordinary', definition: '非凡的', sentence: 'That was an extraordinary performance.', partOfSpeech: 'adjective', cefr: 'B1' },
    { word: 'furthermore', definition: '此外', sentence: 'Furthermore, we need more time.', partOfSpeech: 'adverb', cefr: 'B1' },
    { word: 'government', definition: '政府', sentence: 'The government made a new law.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'guarantee', definition: '保證', sentence: 'I guarantee it will work.', partOfSpeech: 'verb', cefr: 'B1' },
    { word: 'immediately', definition: '立即', sentence: 'Come here immediately.', partOfSpeech: 'adverb', cefr: 'B1' },
    { word: 'independence', definition: '獨立', sentence: 'We celebrate our independence.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'intelligence', definition: '智力', sentence: 'He has high intelligence.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'investigation', definition: '調查', sentence: 'The police are conducting an investigation.', partOfSpeech: 'noun', cefr: 'B1' },
    { word: 'manufacture', definition: '製造', sentence: 'They manufacture cars.', partOfSpeech: 'verb', cefr: 'B1' },
  ]

  // B2 Level Words
  const b2Words = [
    { word: 'accommodate', definition: '容納', sentence: 'This hotel can accommodate two hundred guests.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'acknowledge', definition: '承認', sentence: 'He acknowledged his mistake.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'adolescent', definition: '青少年', sentence: 'Adolescents need guidance.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'aesthetic', definition: '美學的', sentence: 'This has great aesthetic value.', partOfSpeech: 'adjective', cefr: 'B2' },
    { word: 'ambiguous', definition: '模稜兩可的', sentence: 'His answer was ambiguous.', partOfSpeech: 'adjective', cefr: 'B2' },
    { word: 'apparently', definition: '顯然地', sentence: 'Apparently, she is not coming.', partOfSpeech: 'adverb', cefr: 'B2' },
    { word: 'bureaucracy', definition: '官僚體系', sentence: 'The bureaucracy slows everything down.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'circumstances', definition: '情況', sentence: 'Under the circumstances, we should wait.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'collaborate', definition: '合作', sentence: 'We need to collaborate on this project.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'compassion', definition: '同情', sentence: 'She showed great compassion.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'competent', definition: '有能力的', sentence: 'She is a competent manager.', partOfSpeech: 'adjective', cefr: 'B2' },
    { word: 'comprehend', definition: '理解', sentence: 'I cannot comprehend this concept.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'contemporary', definition: '當代的', sentence: 'This is contemporary art.', partOfSpeech: 'adjective', cefr: 'B2' },
    { word: 'controversy', definition: '爭議', sentence: 'This caused a lot of controversy.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'correspondence', definition: '通信', sentence: 'We maintain regular correspondence.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'demonstrate', definition: '展示', sentence: 'Let me demonstrate how it works.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'deteriorate', definition: '惡化', sentence: 'The situation will deteriorate.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'dilemma', definition: '困境', sentence: 'We face a serious dilemma.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'diminish', definition: '減少', sentence: 'The pain will diminish over time.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'discrimination', definition: '歧視', sentence: 'We must fight discrimination.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'disproportionate', definition: '不成比例的', sentence: 'The response was disproportionate.', partOfSpeech: 'adjective', cefr: 'B2' },
    { word: 'distinguish', definition: '區別', sentence: 'Can you distinguish the difference?', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'elaborate', definition: '詳細的', sentence: 'She gave an elaborate explanation.', partOfSpeech: 'adjective', cefr: 'B2' },
    { word: 'eloquent', definition: '雄辯的', sentence: 'He is an eloquent speaker.', partOfSpeech: 'adjective', cefr: 'B2' },
    { word: 'emphasize', definition: '強調', sentence: 'I want to emphasize this point.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'entrepreneur', definition: '企業家', sentence: 'She is a successful entrepreneur.', partOfSpeech: 'noun', cefr: 'B2' },
    { word: 'exaggerate', definition: '誇大', sentence: 'Do not exaggerate the problem.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'facilitate', definition: '促進', sentence: 'This will facilitate communication.', partOfSpeech: 'verb', cefr: 'B2' },
    { word: 'furthermore', definition: '此外', sentence: 'Furthermore, we need more evidence.', partOfSpeech: 'adverb', cefr: 'B2' },
    { word: 'hypothesis', definition: '假設', sentence: 'We tested our hypothesis.', partOfSpeech: 'noun', cefr: 'B2' },
  ]

  // C1 Level Words
  const c1Words = [
    { word: 'accumulate', definition: '累積', sentence: 'Dust tends to accumulate quickly.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'acquaintance', definition: '熟人', sentence: 'He is just an acquaintance.', partOfSpeech: 'noun', cefr: 'C1' },
    { word: 'alleviate', definition: '減輕', sentence: 'This medicine will alleviate the pain.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'ambivalent', definition: '矛盾的', sentence: 'She felt ambivalent about the decision.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'anachronistic', definition: '時代錯誤的', sentence: 'That idea is anachronistic.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'antagonistic', definition: '敵對的', sentence: 'He was antagonistic towards the proposal.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'arbitrary', definition: '任意的', sentence: 'The decision seemed arbitrary.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'assimilate', definition: '吸收', sentence: 'Immigrants gradually assimilate into society.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'atrocious', definition: '殘暴的', sentence: 'The weather was atrocious.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'benevolent', definition: '仁慈的', sentence: 'She has a benevolent nature.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'bureaucratic', definition: '官僚的', sentence: 'The process is too bureaucratic.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'capitulate', definition: '投降', sentence: 'They refused to capitulate.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'categorical', definition: '絕對的', sentence: 'He gave a categorical denial.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'circumvent', definition: '規避', sentence: 'They tried to circumvent the rules.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'coherent', definition: '連貫的', sentence: 'His argument was coherent.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'complacent', definition: '自滿的', sentence: 'We must not become complacent.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'conglomerate', definition: '企業集團', sentence: 'The company is now a conglomerate.', partOfSpeech: 'noun', cefr: 'C1' },
    { word: 'conjecture', definition: '推測', sentence: 'This is mere conjecture.', partOfSpeech: 'noun', cefr: 'C1' },
    { word: 'conscientious', definition: '認真的', sentence: 'She is a conscientious worker.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'contemplate', definition: '沉思', sentence: 'I need time to contemplate this.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'corroborate', definition: '證實', sentence: 'Evidence will corroborate my story.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'debilitate', definition: '使衰弱', sentence: 'The illness can debilitate patients.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'deference', definition: '尊重', sentence: 'He showed deference to his elders.', partOfSpeech: 'noun', cefr: 'C1' },
    { word: 'delineate', definition: '描繪', sentence: 'We need to delineate the boundaries.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'discrepancy', definition: '差異', sentence: 'There is a discrepancy in the accounts.', partOfSpeech: 'noun', cefr: 'C1' },
    { word: 'dogmatic', definition: '教條的', sentence: 'His views are too dogmatic.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'eloquence', definition: '雄辯', sentence: 'He spoke with great eloquence.', partOfSpeech: 'noun', cefr: 'C1' },
    { word: 'embellish', definition: '美化', sentence: 'She tends to embellish stories.', partOfSpeech: 'verb', cefr: 'C1' },
    { word: 'empirical', definition: '經驗的', sentence: 'We need empirical evidence.', partOfSpeech: 'adjective', cefr: 'C1' },
    { word: 'enumerate', definition: '列舉', sentence: 'Please enumerate the reasons.', partOfSpeech: 'verb', cefr: 'C1' },
  ]

  // C2 Level Words
  const c2Words = [
    { word: 'abstruse', definition: '深奧的', sentence: 'The theory is too abstruse for beginners.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'acrimonious', definition: '尖刻的', sentence: 'The debate became acrimonious.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'adumbrate', definition: '預示', sentence: 'Events adumbrate future changes.', partOfSpeech: 'verb', cefr: 'C2' },
    { word: 'ameliorate', definition: '改善', sentence: 'We must ameliorate the situation.', partOfSpeech: 'verb', cefr: 'C2' },
    { word: 'anachronism', definition: '時代錯誤', sentence: 'That custom is an anachronism.', partOfSpeech: 'noun', cefr: 'C2' },
    { word: 'apocryphal', definition: '不可信的', sentence: 'The story is probably apocryphal.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'assiduous', definition: '勤勉的', sentence: 'She is an assiduous student.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'beguile', definition: '欺騙', sentence: 'Do not let appearances beguile you.', partOfSpeech: 'verb', cefr: 'C2' },
    { word: 'bourgeois', definition: '中產階級的', sentence: 'He has bourgeois values.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'byzantine', definition: '複雜的', sentence: 'The regulations are byzantine.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'cacophony', definition: '刺耳的聲音', sentence: 'The traffic created a cacophony.', partOfSpeech: 'noun', cefr: 'C2' },
    { word: 'capricious', definition: '反覆無常的', sentence: 'Weather here is capricious.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'circumlocution', definition: '迂迴說法', sentence: 'Avoid circumlocution in your writing.', partOfSpeech: 'noun', cefr: 'C2' },
    { word: 'conflagration', definition: '大火災', sentence: 'The conflagration destroyed the forest.', partOfSpeech: 'noun', cefr: 'C2' },
    { word: 'connoisseur', definition: '鑑賞家', sentence: 'He is a connoisseur of fine wine.', partOfSpeech: 'noun', cefr: 'C2' },
    { word: 'deleterious', definition: '有害的', sentence: 'Smoking has deleterious effects.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'demagoguery', definition: '煽動', sentence: 'His speech was pure demagoguery.', partOfSpeech: 'noun', cefr: 'C2' },
    { word: 'desiccate', definition: '使乾燥', sentence: 'The heat will desiccate the plants.', partOfSpeech: 'verb', cefr: 'C2' },
    { word: 'didactic', definition: '說教的', sentence: 'The tone was too didactic.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'ebullient', definition: '熱情洋溢的', sentence: 'She has an ebullient personality.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'ecclesiastical', definition: '教會的', sentence: 'This is ecclesiastical property.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'effervescent', definition: '起泡的', sentence: 'Her personality is effervescent.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'egregious', definition: '極壞的', sentence: 'That was an egregious error.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'ephemeral', definition: '短暫的', sentence: 'Fame can be ephemeral.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'equivocate', definition: '說模稜兩可的話', sentence: 'Stop equivocating and answer directly.', partOfSpeech: 'verb', cefr: 'C2' },
    { word: 'erudite', definition: '博學的', sentence: 'He is an erudite scholar.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'esoteric', definition: '深奧的', sentence: 'The subject is quite esoteric.', partOfSpeech: 'adjective', cefr: 'C2' },
    { word: 'exacerbate', definition: '使惡化', sentence: 'This will exacerbate the problem.', partOfSpeech: 'verb', cefr: 'C2' },
    { word: 'exculpate', definition: '開脫', sentence: 'Evidence will exculpate him.', partOfSpeech: 'verb', cefr: 'C2' },
    { word: 'extrapolate', definition: '推斷', sentence: 'We can extrapolate from this data.', partOfSpeech: 'verb', cefr: 'C2' },
  ]

  // Process all words and assign to appropriate levels
  const allWords = [...a1Words, ...a2Words, ...b1Words, ...b2Words, ...c1Words, ...c2Words]

  allWords.forEach(wordData => {
    const difficulty = calculateSpellingDifficulty(wordData.word, wordData.cefr)
    const entry = { ...wordData, difficulty }

    // Assign to appropriate level based on difficulty score
    if (difficulty <= 25) {
      dictionary.elementary.push(entry)
    } else if (difficulty <= 45) {
      dictionary.middle.push(entry)
    } else if (difficulty <= 65) {
      dictionary.high.push(entry)
    } else if (difficulty <= 85) {
      dictionary.university.push(entry)
    } else {
      dictionary.expert.push(entry)
    }
  })

  // Sort each level by difficulty
  Object.keys(dictionary).forEach(level => {
    dictionary[level].sort((a, b) => a.difficulty - b.difficulty)
  })

  return dictionary
}

// Generate and save the dictionary
console.log('Generating spelling bee dictionary...')
const dictionary = generateDictionary()

// Create output directory
const dataDir = path.join(__dirname, '..', 'src', 'gameTypes', 'english-spelling', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Save each level to a separate file
Object.keys(dictionary).forEach(level => {
  const filename = `${level}.json`
  const filepath = path.join(dataDir, filename)
  fs.writeFileSync(filepath, JSON.stringify(dictionary[level], null, 2))
  console.log(`✓ Generated ${filename}: ${dictionary[level].length} words`)
  console.log(`  Difficulty range: ${dictionary[level][0].difficulty} - ${dictionary[level][dictionary[level].length - 1].difficulty}`)
})

console.log('\n✓ Dictionary generation complete!')
console.log(`Total words: ${Object.values(dictionary).reduce((sum, arr) => sum + arr.length, 0)}`)

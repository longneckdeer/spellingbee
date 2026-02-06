#!/usr/bin/env node
/**
 * Expand High, University, and Expert level dictionaries
 * using Merriam-Webster Dictionary API
 *
 * Get your free API key at: https://dictionaryapi.com/
 *
 * Usage:
 *   node scripts/expand-dictionary.js YOUR_API_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('❌ Error: API key required');
  console.error('Usage: node scripts/expand-dictionary.js YOUR_API_KEY');
  console.error('\nGet your free API key at: https://dictionaryapi.com/');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, '../src/gameTypes/english-spelling/data');

// Target word counts per level
const TARGETS = {
  high: { current: 651, target: 2000, file: 'high.json', difficultyRange: [50, 80] },
  university: { current: 501, target: 1500, file: 'university.json', difficultyRange: [70, 95] },
  expert: { current: 44, target: 500, file: 'expert.json', difficultyRange: [85, 100] }
};

// High-difficulty word lists by category
const WORD_LISTS = {
  // High level (50-80 difficulty): SAT/ACT level words
  high: [
    'aberration', 'abscond', 'accolade', 'acrimony', 'admonish', 'adversary', 'aesthetic',
    'alleviate', 'ambiguous', 'ameliorate', 'anachronism', 'analogous', 'anarchy', 'antagonist',
    'apathy', 'appease', 'arbitrary', 'archaic', 'arduous', 'articulate', 'ascertain', 'assiduous',
    'audacious', 'austere', 'avarice', 'benevolent', 'bolster', 'brevity', 'candid', 'capricious',
    'catalyst', 'caustic', 'censure', 'circumspect', 'clandestine', 'coerce', 'cogent', 'coherent',
    'complacent', 'conciliatory', 'condone', 'confound', 'congenial', 'conjecture', 'consensus',
    'conspicuous', 'contempt', 'contentious', 'contrite', 'conundrum', 'convey', 'copious',
    'corroborate', 'credible', 'cryptic', 'culminate', 'cunning', 'curtail', 'cynical', 'daunt',
    'decorum', 'defer', 'defunct', 'delineate', 'demagogue', 'denounce', 'deplore', 'deride',
    'derivative', 'despondent', 'despot', 'deter', 'detrimental', 'devoid', 'diatribe', 'didactic',
    'diffident', 'digress', 'diligent', 'discern', 'disdain', 'disparage', 'disparity', 'disseminate',
    'dissent', 'dissolution', 'dissonance', 'divergent', 'dormant', 'dubious', 'eccentric', 'efface',
    'efficacy', 'elicit', 'eloquent', 'elucidate', 'embellish', 'empirical', 'emulate', 'enigma',
    'ephemeral', 'equitable', 'equivocal', 'erudite', 'esoteric', 'eulogy', 'euphemism', 'exacerbate',
    'exonerate', 'expedient', 'expedite', 'explicit', 'exploit', 'extol', 'extraneous', 'fallacy',
    'fanatical', 'fastidious', 'feasible', 'fervent', 'fickle', 'florid', 'foment', 'fortuitous',
    'frivolous', 'frugal', 'futile', 'garrulous', 'gregarious', 'hackneyed', 'hamper', 'haughty',
    'hedonist', 'hegemony', 'heresy', 'heterogeneous', 'hypothesis', 'iconoclast', 'idiosyncrasy',
    'ignoble', 'immutable', 'impartial', 'impetuous', 'impetus', 'implement', 'implication',
    'implicit', 'inadvertent', 'inchoate', 'incongruous', 'incorporate', 'indifferent', 'indigenous',
    'indignant', 'indolent', 'inert', 'inevitable', 'ingenuous', 'inherent', 'innocuous', 'innovation',
    'insipid', 'insolent', 'instigate', 'intrepid', 'intrinsic', 'inundate', 'irascible', 'irresolute',
    'judicious', 'juxtapose', 'laconic', 'lament', 'laud', 'lavish', 'lethargic', 'levity',
    'litigate', 'lucid', 'luminous', 'magnanimous', 'malicious', 'malleable', 'maverick', 'meander',
    'mediate', 'mediocre', 'meticulous', 'mitigate', 'modicum', 'mollify', 'monotonous', 'morose',
    'mundane', 'myriad', 'nadir', 'nefarious', 'negligent', 'nostalgic', 'novel', 'noxious',
    'nuance', 'obdurate', 'obscure', 'obsolete', 'obstinate', 'obviate', 'ominous', 'opaque',
    'opulent', 'orthodox', 'ostentatious', 'paradigm', 'paradox', 'paragon', 'partisan', 'pastoral',
    'pedantic', 'penchant', 'permeate', 'perpetuate', 'persevere', 'pertinent', 'pervasive',
    'petulant', 'philanthropy', 'placate', 'plagiarize', 'plausible', 'plethora', 'poignant',
    'pragmatic', 'precarious', 'precipitate', 'preclude', 'precocious', 'precursor', 'predilection',
    'preeminent', 'prevalent', 'pristine', 'prodigal', 'prodigious', 'profane', 'profound',
    'profuse', 'proliferate', 'prolific', 'propensity', 'propriety', 'prosaic', 'proscribe',
    'proximity', 'prudent', 'pungent', 'querulous', 'quixotic', 'recalcitrant', 'recluse',
    'reconcile', 'redundant', 'refute', 'relegate', 'relinquish', 'remedial', 'renounce',
    'replete', 'reprehensible', 'reprimand', 'repudiate', 'rescind', 'resilient', 'resolute',
    'reticent', 'reverent', 'rhetoric', 'rigorous', 'robust', 'sagacious', 'salient', 'sanction',
    'sanguine', 'scrutinize', 'sectarian', 'singular', 'skeptical', 'solemn', 'solicitous',
    'sporadic', 'spurious', 'squander', 'static', 'stoic', 'stringent', 'sublime', 'subordinate',
    'substantiate', 'subtle', 'succinct', 'superfluous', 'suppress', 'surmise', 'surreptitious',
    'synthesis', 'tacit', 'tactful', 'tangential', 'tedious', 'temerity', 'tenacious', 'tentative',
    'terse', 'thwart', 'timorous', 'torpid', 'tractable', 'tranquil', 'transgress', 'transient',
    'trite', 'turbulent', 'ubiquitous', 'undermine', 'unscrupulous', 'untenable', 'utilitarian',
    'vacillate', 'venerable', 'veracity', 'verbose', 'viable', 'vigilant', 'vilify', 'vindicate',
    'virtuoso', 'virulent', 'viscous', 'volatile', 'wary', 'whimsical', 'zealot'
  ],

  // University level (70-95 difficulty): GRE level words
  university: [
    'abjure', 'abstruse', 'accede', 'acerbic', 'acquiesce', 'adulterate', 'aggregate', 'alacrity',
    'anodyne', 'antipathy', 'apocryphal', 'apposite', 'approbation', 'arcane', 'arrogate', 'ascetic',
    'assail', 'assuage', 'attenuate', 'audacity', 'auspicious', 'avaricious', 'axiom', 'banal',
    'belie', 'belligerent', 'bombastic', 'burgeon', 'cacophony', 'calumny', 'canonical', 'capacious',
    'capitulate', 'castigation', 'categorical', 'chicanery', 'circumlocution', 'coalesce', 'cogitate',
    'commensurate', 'compendium', 'complaisance', 'concord', 'conflagration', 'connoisseur', 'contiguous',
    'contumacious', 'corpulent', 'cosset', 'covetous', 'craven', 'culpable', 'dearth', 'debacle',
    'debauch', 'decadent', 'deleterious', 'delineation', 'demagogue', 'demur', 'deprecate', 'derelict',
    'desiccate', 'desultory', 'dexterous', 'didactic', 'dilatory', 'dirge', 'disabuse', 'disconcert',
    'discourse', 'disinterested', 'disparate', 'dissemble', 'dissolution', 'distend', 'dogmatic',
    'duplicity', 'ebullient', 'edify', 'effrontery', 'effusive', 'egregious', 'elegy', 'elocution',
    'emollient', 'endemic', 'enervate', 'engender', 'ennui', 'enormity', 'ephemeral', 'epistolary',
    'equanimity', 'equivocate', 'errant', 'eschew', 'estimable', 'eugenics', 'evanescent', 'evince',
    'exacerbate', 'execrable', 'exigent', 'expatiate', 'expiate', 'exposition', 'expurgate', 'extant',
    'extrapolate', 'extricate', 'facetious', 'fallacious', 'fatuous', 'fawn', 'feckless', 'felicitous',
    'fervid', 'fetid', 'flagrant', 'fledgling', 'flounder', 'foible', 'forbearance', 'forestall',
    'fortitude', 'fugacious', 'fulminate', 'fulsome', 'furtive', 'gainsay', 'glib', 'gullible',
    'gustatory', 'halcyon', 'hapless', 'harbinger', 'hermetic', 'iconoclast', 'idyllic', 'ignominy',
    'imbroglio', 'imminent', 'impecunious', 'imperious', 'imperturbable', 'implacable', 'importune',
    'impugn', 'impute', 'incipient', 'incisive', 'incontrovertible', 'incorrigible', 'inculcate',
    'indemnify', 'indigence', 'indomitable', 'indubitable', 'ineffable', 'ineluctable', 'inexorable',
    'ingenious', 'ingratiate', 'injunction', 'innate', 'inscrutable', 'insidious', 'insinuate',
    'insouciant', 'intemperance', 'intractable', 'intransigent', 'inveigh', 'inveigle', 'irrefutable',
    'lachrymose', 'lacuna', 'languor', 'largess', 'lascivious', 'latent', 'laudable', 'libertine',
    'licentious', 'limpid', 'lissome', 'lugubrious', 'maelstrom', 'magnate', 'malapropism',
    'malediction', 'malinger', 'maudlin', 'mendacious', 'mendicant', 'mercurial', 'meretricious',
    'missive', 'mitigate', 'modish', 'mordant', 'moribund', 'multifarious', 'munificent', 'nebulous',
    'neophyte', 'noisome', 'nomenclature', 'nonplussed', 'nugatory', 'obdurate', 'obfuscate',
    'oblique', 'obsequious', 'obstreperous', 'obtuse', 'occlude', 'odious', 'officious', 'onerous',
    'opprobrium', 'paean', 'palliate', 'panegyric', 'parsimonious', 'patent', 'pathological',
    'paucity', 'pecuniary', 'pellucid', 'penchant', 'penitent', 'penurious', 'perdition', 'perfidy',
    'perfunctory', 'pernicious', 'perspicacious', 'petulant', 'phlegmatic', 'piety', 'platitude',
    'plenitude', 'plumb', 'polemic', 'portent', 'portentous', 'precipitous', 'predilection',
    'preponderance', 'prescient', 'prevaricate', 'probity', 'proclivity', 'procrastinate', 'prodigal',
    'profligate', 'progenitor', 'prognosticate', 'prolixity', 'promulgate', 'propitiate', 'propitious',
    'prosaic', 'proscribe', 'protagonist', 'protean', 'provincial', 'prudence', 'pugnacious',
    'pulchritude', 'punctilious', 'purgatory', 'pusillanimous', 'quandary', 'quiescent', 'quintessential',
    'quotidian', 'raconteur', 'rancorous', 'rapacious', 'recondite', 'recrimination', 'redolent',
    'redoubtable', 'redress', 'refractory', 'refulgent', 'relegate', 'remonstrate', 'renege',
    'reprobate', 'requite', 'restive', 'reticence', 'ribald', 'rife', 'rococo', 'roil',
    'ruminate', 'saccharine', 'sacrosanct', 'salacious', 'salubrious', 'salutary', 'satiate',
    'scintilla', 'scurrilous', 'seminal', 'sententious', 'sequester', 'serendipity', 'shard',
    'sinecure', 'sobriquet', 'solicitous', 'soporific', 'specious', 'spurious', 'stentorian',
    'stolid', 'stratagem', 'striated', 'strident', 'subjugate', 'sublime', 'subpoena', 'subsume',
    'subversive', 'sui generis', 'supercilious', 'supplant', 'supplicant', 'surfeit', 'surmount',
    'sybarite', 'sycophant', 'synergy', 'syntax', 'taciturn', 'talisman', 'tautology', 'temerity',
    'temporal', 'tendentious', 'tenuous', 'tirade', 'toady', 'tome', 'tortuous', 'traduce',
    'trenchant', 'trepidation', 'truculent', 'turpitude', 'tyro', 'umbrage', 'unctuous', 'underscore',
    'unequivocal', 'unfettered', 'unimpeachable', 'unprepossessing', 'unrequited', 'unwitting',
    'urbane', 'usurp', 'vacuous', 'variegated', 'venal', 'venerate', 'verisimilitude', 'vex',
    'vicarious', 'vicissitude', 'vindictive', 'vitiate', 'vitriolic', 'vituperate', 'vivacious',
    'vociferous', 'volition', 'voluble', 'voracious', 'wanton', 'welter', 'whet', 'willful',
    'winsome', 'wistful', 'wizened', 'wraith', 'wrath', 'xenophobia', 'yoke', 'zeal', 'zenith'
  ],

  // Expert level (85-100 difficulty): Advanced academic/professional
  expert: [
    'abecedarian', 'abstemious', 'adumbrate', 'aegis', 'affable', 'algorithm', 'anachronistic',
    'anathema', 'antediluvian', 'antithesis', 'apotheosis', 'arboreal', 'atavistic', 'autodidact',
    'axiomatic', 'bathetic', 'beleaguer', 'bellicose', 'bifurcate', 'binary', 'byzantine',
    'cabal', 'cadre', 'cajole', 'calumny', 'camaraderie', 'canard', 'cant', 'castigate',
    'catalyst', 'cavil', 'censorious', 'charlatan', 'chimera', 'circuitous', 'cloying',
    'cogent', 'colloquy', 'commensurate', 'concatenate', 'conflate', 'connive', 'consanguinity',
    'consilience', 'continuum', 'conundrum', 'coruscate', 'cosmopolitan', 'coterie', 'countenance',
    'credo', 'cynosure', 'decorous', 'defenestrate', 'demagogue', 'denizen', 'detritus',
    'deus ex machina', 'dialectic', 'dichotomy', 'diffidence', 'dilettante', 'discursive',
    'dissimulate', 'draconian', 'edict', 'effete', 'effigy', 'egalitarian', 'eleemosynary',
    'elucidate', 'empirical', 'endemic', 'enigmatic', 'ennui', 'epistemology', 'epitome',
    'equitable', 'ersatz', 'erudition', 'euphonious', 'exacerbate', 'excoriate', 'exegesis',
    'exhort', 'existential', 'expunge', 'extirpate', 'facile', 'fait accompli', 'fallacious',
    'fastidious', 'febrile', 'fecund', 'fiat', 'flout', 'fractious', 'fulcrum', 'fustian',
    'garrulous', 'grandiloquent', 'gravitas', 'gratis', 'gregarious', 'harangue', 'hegemonic',
    'hermetic', 'heterodox', 'histrionic', 'homogeneous', 'hubris', 'hypertrophy', 'iconography',
    'ideology', 'ignominious', 'immolate', 'impertinent', 'impervious', 'importunate', 'imprimatur',
    'inalienable', 'incandescent', 'inchoate', 'incongruous', 'indefatigable', 'indemnity',
    'inexorable', 'infrastructure', 'insouciant', 'interpolate', 'interregnum', 'intransigence',
    'intrinsic', 'inure', 'invective', 'invocation', 'jejune', 'juggernaut', 'lachrymose',
    'laissez-faire', 'lampoon', 'largesse', 'leitmotif', 'libertarian', 'litany', 'litigate',
    'lucubration', 'machiavellian', 'magisterial', 'magnanimity', 'malapropism', 'mangle',
    'manifesto', 'martyr', 'maudlin', 'mellifluous', 'mendacity', 'metonymy', 'milieu',
    'modicum', 'monarchy', 'moratorium', 'multifarious', 'mundane', 'nascent', 'neologism',
    'nihilism', 'nomenclature', 'non sequitur', 'nostrum', 'numinous', 'obdurate', 'obsequious',
    'oligarchy', 'ominous', 'ontological', 'organism', 'orthodox', 'ossify', 'ostensible',
    'pablum', 'palimpsest', 'panacea', 'pandemic', 'panegyric', 'parameter', 'pariah',
    'parlance', 'parochial', 'parsimony', 'pastiche', 'pathos', 'pecuniary', 'pedagogue',
    'pellucid', 'penchant', 'peremptory', 'peripatetic', 'pernicious', 'perspicacity', 'peruse',
    'philistine', 'pithy', 'plaintive', 'plenary', 'polemical', 'pontificate', 'portentous',
    'posthumous', 'pragmatism', 'precept', 'precipice', 'precocious', 'predicate', 'prescient',
    'primordial', 'proclivity', 'profligate', 'progenitor', 'promulgate', 'propensity', 'prosody',
    'protean', 'protocol', 'provenance', 'provincial', 'puerile', 'punctilious', 'pyrrhic',
    'quagmire', 'qualitative', 'quantum', 'querulous', 'quibble', 'quintessence', 'quixotic',
    'rancor', 'rapprochement', 'ratiocination', 'rebus', 'recidivism', 'reciprocal',
    'reconnoiter', 'redact', 'refract', 'regimen', 'reiterate', 'reliquary', 'remuneration',
    'reparation', 'repercussion', 'repository', 'rescind', 'resilience', 'resonance', 'restitution',
    'retrograde', 'revanchism', 'ribald', 'rigor', 'rubric', 'sacrosanct', 'sagacity',
    'salient', 'sangfroid', 'sapient', 'sarcophagus', 'sardonic', 'saturnine', 'schadenfreude',
    'schism', 'scintillating', 'scrupulous', 'sedition', 'semantic', 'seminal', 'sequester',
    'serendipitous', 'sinuous', 'sobriquet', 'solipsism', 'somnolent', 'sophistry', 'specious',
    'spurious', 'staid', 'stentorian', 'stigma', 'stoicism', 'stricture', 'stultify',
    'subjective', 'sublimate', 'subsidy', 'substantive', 'subterfuge', 'succinct', 'sui generis',
    'superlative', 'supplicate', 'surfeit', 'surreptitious', 'surrogate', 'syllogism', 'symbiosis',
    'syncopation', 'synergy', 'taciturn', 'talisman', 'tantamount', 'tautological', 'taxonomy',
    'temerity', 'temporal', 'tenable', 'tenebrous', 'tergiversation', 'tertiary', 'theocracy',
    'timorous', 'titular', 'totem', 'touchstone', 'tractable', 'transcendent', 'transient',
    'transmute', 'trenchant', 'triumvirate', 'trope', 'truncate', 'tumultuous', 'turbid',
    'turgid', 'tyro', 'ubiquity', 'ulterior', 'ultimatum', 'unalloyed', 'unconscionable',
    'unctuous', 'undulate', 'unilateral', 'unprecedented', 'unrequited', 'untoward', 'usurious',
    'utilitarian', 'utopia', 'vacillate', 'vapid', 'variegated', 'vehement', 'venal',
    'verisimilitude', 'vernacular', 'vexatious', 'vicarious', 'vicissitude', 'vigilante', 'vim',
    'vindicate', 'virulent', 'visceral', 'vitiate', 'vituperation', 'vociferous', 'vogue',
    'volition', 'voluble', 'zeitgeist', 'zenith', 'zephyr'
  ]
};

async function fetchWordData(word) {
  try {
    const url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`  ⚠️  No data for "${word}"`);
      return null;
    }

    const entry = data[0];

    // Check if it's a string (suggestion) rather than actual data
    if (typeof entry === 'string') {
      console.log(`  ⚠️  "${word}" not found (suggestions: ${data.join(', ')})`);
      return null;
    }

    // Extract data
    const partOfSpeech = entry.fl || 'noun';
    const definitions = entry.shortdef || [];
    const definition = definitions[0] || `Definition of ${word}`;

    // Create a simple example sentence
    const sentence = createSentence(word, partOfSpeech);

    return {
      word,
      definition,
      sentence,
      partOfSpeech,
      difficulty: 50, // Will be set based on level
      cefr_level: 'C1'
    };
  } catch (error) {
    console.error(`  ❌ Error fetching "${word}":`, error.message);
    return null;
  }
}

function createSentence(word, pos) {
  // Generate grammatically correct sentences based on part of speech
  const sentences = {
    noun: [
      `The ${word} was clearly visible from the window.`,
      `Understanding the ${word} requires careful study.`,
      `The professor explained the concept of ${word}.`
    ],
    verb: [
      `They decided to ${word} the situation carefully.`,
      `It is important to ${word} before making decisions.`,
      `The expert can ${word} with great precision.`
    ],
    adjective: [
      `The ${word} approach proved to be effective.`,
      `Her ${word} manner impressed everyone.`,
      `The results were surprisingly ${word}.`
    ],
    adverb: [
      `She spoke ${word} to the audience.`,
      `The plan proceeded ${word} as expected.`,
      `They worked ${word} throughout the night.`
    ]
  };

  const category = pos.toLowerCase();
  const options = sentences[category] || sentences.noun;
  return options[Math.floor(Math.random() * options.length)];
}

function calculateDifficulty(level, index, total) {
  const ranges = TARGETS[level].difficultyRange;
  const [min, max] = ranges;

  // Distribute evenly across the difficulty range
  const progress = index / total;
  return Math.round(min + (max - min) * progress);
}

async function expandLevel(level) {
  console.log(`\n┌${'─'.repeat(60)}┐`);
  console.log(`│ ${level.toUpperCase().padEnd(58)} │`);
  console.log(`└${'─'.repeat(60)}┘`);

  const config = TARGETS[level];
  const words = WORD_LISTS[level];
  const needed = config.target - config.current;

  console.log(`Current: ${config.current} words`);
  console.log(`Target:  ${config.target} words`);
  console.log(`Adding:  ${Math.min(needed, words.length)} new words\n`);

  // Load existing data
  const filePath = path.join(DATA_DIR, config.file);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const existingWords = new Set(existing.map(w => w.word.toLowerCase()));

  const newWords = [];
  let processed = 0;

  for (const word of words.slice(0, needed)) {
    if (existingWords.has(word.toLowerCase())) {
      console.log(`  ⏭️  Skipping "${word}" (already exists)`);
      continue;
    }

    console.log(`  📥 Fetching: ${word}...`);
    const wordData = await fetchWordData(word);

    if (wordData) {
      // Assign difficulty based on position in list
      wordData.difficulty = calculateDifficulty(level, processed, words.length);
      newWords.push(wordData);
      console.log(`  ✅ Added "${word}" (difficulty: ${wordData.difficulty})`);
    }

    processed++;

    // Rate limit: wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));

    // Break if we've reached our target
    if (existing.length + newWords.length >= config.target) {
      console.log(`\n  🎯 Reached target of ${config.target} words!`);
      break;
    }
  }

  // Merge and save
  if (newWords.length > 0) {
    const combined = [...existing, ...newWords];
    fs.writeFileSync(filePath, JSON.stringify(combined, null, 2), 'utf8');
    console.log(`\n  ✅ Saved ${newWords.length} new words to ${config.file}`);
    console.log(`  📊 Total words: ${combined.length}`);
  } else {
    console.log(`\n  ⚠️  No new words added`);
  }

  return newWords.length;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     EXPAND SPELLING BEE DICTIONARY                        ║');
  console.log('║     Using Merriam-Webster Dictionary API                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const levels = ['high', 'university', 'expert'];
  let totalAdded = 0;

  for (const level of levels) {
    const added = await expandLevel(level);
    totalAdded += added;
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  Total words added: ${totalAdded}`);
  console.log(`\n  ✅ Dictionary expansion complete!\n`);
}

main().catch(console.error);

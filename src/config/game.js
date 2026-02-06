export const GAME_CONFIG = {
  // Table/seat settings
  tableCount: 25,
  tableSpacing: 10,
  tableMinLetters: 9,
  tableFontSize: 13,
  tableHeight: 48,
  tablePaddingX: 12,

  // Timer settings (in seconds)
  roundTimeSeconds: 120, // Standard spelling bee: 2 minutes per word
  interGameSeconds: 30,
  roundEndDelaySeconds: 10, // Review period after each round
  firstRoundDelaySeconds: 5, // Preparation time before first round starts

  // Game settings
  minPlayersToStart: 1,
  maxWordLength: 20,

  // Connection settings (in milliseconds)
  connectionTimeoutMs: 5000,
  connectionRetryMs: 1000,

  // TTS settings (speech rates: 0.1 = very slow, 1.0 = normal, 2.0 = fast)
  tts: {
    wordRate: 0.6,          // Very slow for spelling the word
    sentenceRate: 0.8,      // Moderately slow for sentence
    posRate: 0.9,           // Near normal for part of speech
    definitionRate: 0.85,   // Slightly slow for definition
    pauseAfterWord: 1500,   // Pause after each word (ms)
    pauseAfterPos: 1500,    // Pause after part of speech (ms)
    pauseAfterDef: 1500     // Pause after definition (ms)
  }
}

/**
 * Calculate the minimum table width needed to display letters without shrinking
 * @param {number} letterCount - Number of letters to fit
 * @param {number} fontSize - Font size in pixels
 * @param {number} paddingX - Horizontal padding (both sides combined)
 * @returns {number} - Minimum width in pixels
 */
export function calculateMinTableWidth(
  letterCount = GAME_CONFIG.tableMinLetters,
  fontSize = GAME_CONFIG.tableFontSize,
  paddingX = GAME_CONFIG.tablePaddingX
) {
  // Average character width is approximately 0.6 * fontSize for uppercase
  // Plus letter-spacing of 1px per character
  const charWidth = fontSize * 0.6 + 1
  return Math.ceil(letterCount * charWidth + paddingX)
}

/**
 * Calculate the optimal classroom grid layout
 * @param {number} tableCount - Number of tables
 * @param {number} containerWidth - Available container width in pixels
 * @param {number} spacing - Spacing between tables in pixels
 * @returns {Object} - { columns, rows, tableWidth, totalWidth, totalHeight }
 */
export function calculateClassroomLayout(
  tableCount = GAME_CONFIG.tableCount,
  containerWidth = 620,
  spacing = GAME_CONFIG.tableSpacing
) {
  const minTableWidth = calculateMinTableWidth()

  // Calculate rows first to determine row spacing
  const baseColumns = 5
  const estimatedRows = Math.ceil(tableCount / baseColumns)

  // Gradually reduce ROW spacing as rows increase (1px less per extra row beyond 5)
  // Base: 5 rows = 9px, each additional row reduces by 1px, minimum 4px
  const extraRows = Math.max(0, estimatedRows - 5)
  const rowSpacing = Math.max(4, 9 - extraRows)

  // Column spacing stays constant
  const columnSpacing = spacing

  // Calculate maximum columns that can fit
  // containerWidth = columns * tableWidth + (columns - 1) * spacing
  // containerWidth = columns * (tableWidth + spacing) - spacing
  // columns = (containerWidth + spacing) / (tableWidth + spacing)
  const maxColumns = Math.floor((containerWidth + columnSpacing) / (minTableWidth + columnSpacing))

  // Find the best column count (closest to square, favoring more columns)
  let bestColumns = 1
  let bestScore = Infinity

  for (let cols = 1; cols <= Math.min(maxColumns, tableCount); cols++) {
    const rows = Math.ceil(tableCount / cols)
    // Score: prefer layouts closer to square, with slight preference for more columns
    const ratio = cols / rows
    const score = Math.abs(ratio - 1) + (rows > cols ? 0.1 : 0)

    if (score < bestScore) {
      bestScore = score
      bestColumns = cols
    }
  }

  const columns = bestColumns
  const rows = Math.ceil(tableCount / columns)

  // Calculate actual table width to fill the container
  const tableWidth = Math.floor((containerWidth - (columns - 1) * columnSpacing) / columns)

  // Calculate total dimensions
  const totalWidth = columns * tableWidth + (columns - 1) * columnSpacing
  const rowHeight = GAME_CONFIG.tableHeight + 14 // 14px for label above table
  const totalHeight = rows * rowHeight + (rows - 1) * rowSpacing

  return {
    columns,
    rows,
    tableWidth,
    tableHeight: GAME_CONFIG.tableHeight,
    columnSpacing,
    rowSpacing,
    totalWidth,
    totalHeight,
    minTableWidth
  }
}

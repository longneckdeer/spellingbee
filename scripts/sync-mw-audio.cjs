#!/usr/bin/env node

/**
 * Sync Merriam-Webster audio files from source to public directory
 *
 * Source: src/gameTypes/english-spelling/data/audio_mw/{word}/{word}_word.mp3
 * Target: public/audio/{word}.mp3
 *
 * Usage: node scripts/sync-mw-audio.js
 */

const fs = require('fs')
const path = require('path')

const SOURCE_DIR = path.join(__dirname, '../src/gameTypes/english-spelling/data/audio_mw')
const TARGET_DIR = path.join(__dirname, '../public/audio')

function syncAudioFiles() {
  console.log('Syncing Merriam-Webster audio files...')
  console.log(`Source: ${SOURCE_DIR}`)
  console.log(`Target: ${TARGET_DIR}`)
  console.log('')

  // Ensure target directory exists
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true })
    console.log('Created target directory')
  }

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('Error: Source directory does not exist!')
    process.exit(1)
  }

  // Get all word directories
  const wordDirs = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  console.log(`Found ${wordDirs.length} word directories`)
  console.log('')

  let copied = 0
  let skipped = 0
  let errors = 0

  for (const word of wordDirs) {
    const sourceFile = path.join(SOURCE_DIR, word, `${word}_word.mp3`)
    const targetFile = path.join(TARGET_DIR, `${word}.mp3`)

    try {
      // Check if source file exists
      if (!fs.existsSync(sourceFile)) {
        console.warn(`  Warning: ${sourceFile} not found`)
        errors++
        continue
      }

      // Check if target already exists and is up to date
      if (fs.existsSync(targetFile)) {
        const sourceStat = fs.statSync(sourceFile)
        const targetStat = fs.statSync(targetFile)

        if (targetStat.mtime >= sourceStat.mtime && targetStat.size === sourceStat.size) {
          skipped++
          continue
        }
      }

      // Copy file
      fs.copyFileSync(sourceFile, targetFile)
      console.log(`  Copied: ${word}.mp3`)
      copied++
    } catch (err) {
      console.error(`  Error copying ${word}: ${err.message}`)
      errors++
    }
  }

  console.log('')
  console.log('Sync complete!')
  console.log(`  Copied: ${copied}`)
  console.log(`  Skipped (up to date): ${skipped}`)
  console.log(`  Errors: ${errors}`)
  console.log(`  Total: ${wordDirs.length}`)
}

// Run if called directly
if (require.main === module) {
  syncAudioFiles()
}

module.exports = { syncAudioFiles }

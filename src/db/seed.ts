import { db } from "./index"
import { swearWords } from "./schema"

const commonSwearWords = [
  "ass",
  "bastard",
  "bitch",
  "damn",
  "fuck",
  "shit",
  "crap",
  "hell",
  "dick",
  "piss",
]

async function seed() {
  console.log("🌱 Seeding database with common swear words...")

  try {
    // Insert swear words
    for (const word of commonSwearWords) {
      await db.insert(swearWords).values({ word }).onConflictDoNothing()
    }

    console.log("✅ Database seeding completed successfully")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  }
}

// Execute seed function
function runSeed() {
  seed().catch(console.error)
}

export { seed, runSeed }

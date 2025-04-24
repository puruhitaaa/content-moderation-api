import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { ProfanityCheckerService } from "../services"

// Create a Hono app for the profanity checker service
const profanityChecker = new Hono()
const service = new ProfanityCheckerService()

// Schema for the check endpoint request
const checkSchema = z.object({
  text: z.string().min(1, "Text is required"),
})

// Check endpoint: POST /check
profanityChecker.post("/check", zValidator("json", checkSchema), async (c) => {
  const { text } = c.req.valid("json")

  try {
    const result = await service.checkProfanity(text)
    return c.json({ result })
  } catch (error) {
    console.error("Error in profanity check:", error)
    return c.json({ error: "Failed to process text" }, 500)
  }
})

// Check word endpoint: GET /word/:word
profanityChecker.get("/word/:word", async (c) => {
  const word = c.req.param("word")

  try {
    const isSwearWord = await service.isSwearWord(word)
    return c.json({ isSwearWord })
  } catch (error) {
    console.error("Error checking word:", error)
    return c.json({ error: "Failed to check word" }, 500)
  }
})

export default profanityChecker

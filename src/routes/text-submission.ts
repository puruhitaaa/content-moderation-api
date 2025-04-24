import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { TextSubmissionService } from "../services"

// Create a Hono app for the text submission service
const textSubmission = new Hono()
const service = new TextSubmissionService()

// Schema for the submit endpoint request
const submitSchema = z.object({
  text: z.string().min(1, "Text is required"),
})

// Submit endpoint: POST /submit
textSubmission.post("/submit", zValidator("json", submitSchema), async (c) => {
  const { text } = c.req.valid("json")

  try {
    const result = await service.submitText(text)
    return c.json(result)
  } catch (error) {
    console.error("Error in text submission:", error)
    return c.json({ error: "Failed to process submission" }, 500)
  }
})

// History endpoint: GET /history
textSubmission.get("/history", async (c) => {
  const limitParam = c.req.query("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 10

  try {
    const history = await service.getSubmissionHistory(limit)
    return c.json({ submissions: history })
  } catch (error) {
    console.error("Error getting submission history:", error)
    return c.json({ error: "Failed to retrieve submission history" }, 500)
  }
})

export default textSubmission

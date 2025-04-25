import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { ProfanityCheckerService } from "../services"
import {
  CheckProfanityRequestSchema,
  CheckProfanityResponseSchema,
  ErrorSchema,
  WordCheckResponseSchema,
  WordParamSchema,
} from "../schemas/openapi"

// Create a Hono app for the profanity checker service
const profanityChecker = new OpenAPIHono()
const service = new ProfanityCheckerService()

// Check endpoint: POST /check
const checkRoute = createRoute({
  method: "post",
  path: "/check",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CheckProfanityRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Text profanity check result",
      content: {
        "application/json": {
          schema: CheckProfanityResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
  tags: ["Profanity Checker"],
})

profanityChecker.openapi(checkRoute, async (c) => {
  const { text } = c.req.valid("json") as { text: string }

  try {
    const result = await service.checkProfanity(text)
    return c.json({ result: result }, 200)
  } catch (error) {
    console.error("Error in profanity check:", error)
    return c.json({ error: "Failed to process text" }, 500)
  }
})

// Check word endpoint: GET /word/:word
const wordCheckRoute = createRoute({
  method: "get",
  path: "/word/{word}",
  request: {
    params: WordParamSchema,
  },
  responses: {
    200: {
      description: "Word check result",
      content: {
        "application/json": {
          schema: WordCheckResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
  tags: ["Profanity Checker"],
})

profanityChecker.openapi(wordCheckRoute, async (c) => {
  const { word } = c.req.valid("param") as { word: string }

  try {
    const isSwearWord = await service.isSwearWord(word)
    return c.json({ isSwearWord: isSwearWord }, 200)
  } catch (error) {
    console.error("Error checking word:", error)
    return c.json({ error: "Failed to check word" }, 500)
  }
})

export default profanityChecker

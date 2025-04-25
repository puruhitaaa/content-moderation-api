import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { TextSubmissionService, ProfanityCheckerService } from "../services"
import {
  TextSubmitRequestSchema,
  TextSubmissionResponseSchema,
  SubmissionHistoryResponseSchema,
  ErrorSchema,
  WordCreateRequestSchema,
  WordCreateResponseSchema,
} from "../schemas/openapi"
import { z } from "@hono/zod-openapi"

// Create a Hono app for the text submission service
const textSubmission = new OpenAPIHono()
const service = new TextSubmissionService()
const profanityService = new ProfanityCheckerService()

// Submit endpoint: POST /submit
const submitRoute = createRoute({
  method: "post",
  path: "/submit",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TextSubmitRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Text submission result",
      content: {
        "application/json": {
          schema: TextSubmissionResponseSchema,
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
  tags: ["Text Submission"],
})

textSubmission.openapi(submitRoute, async (c) => {
  const { text } = c.req.valid("json") as { text: string }

  try {
    const result = await service.submitText(text)
    return c.json(result, 200)
  } catch (error) {
    console.error("Error in text submission:", error)
    return c.json({ error: "Failed to process submission" }, 500)
  }
})

// History endpoint: GET /history
const historyRoute = createRoute({
  method: "get",
  path: "/history",
  request: {
    query: z.object({
      limit: z.string().optional().openapi({
        description: "Maximum number of submissions to return",
        example: "10",
      }),
    }),
  },
  responses: {
    200: {
      description: "Submission history",
      content: {
        "application/json": {
          schema: SubmissionHistoryResponseSchema,
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
  tags: ["Text Submission"],
})

textSubmission.openapi(historyRoute, async (c) => {
  const limitParam = c.req.query("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 10

  try {
    const history = await service.getSubmissionHistory(limit)
    return c.json({ submissions: history }, 200)
  } catch (error) {
    console.error("Error getting submission history:", error)
    return c.json({ error: "Failed to retrieve submission history" }, 500)
  }
})

// Word creation endpoint: POST /word
const addWordRoute = createRoute({
  method: "post",
  path: "/word",
  request: {
    body: {
      content: {
        "application/json": {
          schema: WordCreateRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Swear word creation result",
      content: {
        "application/json": {
          schema: WordCreateResponseSchema,
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
  tags: ["Text Submission"],
})

textSubmission.openapi(addWordRoute, async (c) => {
  const { word } = c.req.valid("json") as { word: string }
  try {
    const newEntry = await profanityService.addSwearWord(word)
    return c.json(newEntry, 201)
  } catch (error) {
    console.error("Error adding new swear word:", error)
    return c.json({ error: "Failed to add swear word" }, 500)
  }
})

export default textSubmission

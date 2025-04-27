import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { SentimentAnalyzerService, ProfanityCheckerService } from "../services"
import { z } from "zod"

// Define schemas for request and response
const AnalyzeSentimentRequestSchema = z.object({
  text: z.string().min(1).describe("Text to analyze for sentiment"),
})

const SentimentAnalysisResponseSchema = z.object({
  sentiment: z
    .enum(["positive", "negative", "neutral", "mixed"])
    .describe("Overall sentiment"),
  score: z
    .number()
    .describe("Sentiment score from -1 (negative) to 1 (positive)"),
  toxicity: z.boolean().describe("Whether the content is potentially toxic"),
  explanation: z
    .string()
    .optional()
    .describe("Optional explanation of the analysis"),
  profanityCheck: z
    .object({
      containsProfanity: z
        .boolean()
        .describe("Whether the text contains profanity"),
      profaneWords: z
        .array(z.string())
        .optional()
        .describe("List of profane words found if any"),
    })
    .describe("Integrated profanity check results"),
})

const ErrorSchema = z.object({
  error: z.string().describe("Error message"),
})

// Create a Hono app for the sentiment analyzer service
const sentimentAnalyzer = new OpenAPIHono()
const sentimentService = new SentimentAnalyzerService()
const profanityService = new ProfanityCheckerService() // Use the profanity service to enhance analysis

// Analyze endpoint: POST /analyze
const analyzeRoute = createRoute({
  method: "post",
  path: "/analyze",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AnalyzeSentimentRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Sentiment analysis result",
      content: {
        "application/json": {
          schema: SentimentAnalysisResponseSchema,
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
  tags: ["Sentiment Analyzer"],
})

sentimentAnalyzer.openapi(analyzeRoute, async (c) => {
  const { text } = c.req.valid("json") as { text: string }

  try {
    // Run sentiment analysis and profanity check in parallel
    const [sentimentResult, profanityResult] = await Promise.all([
      sentimentService.analyzeSentiment(text),
      profanityService.checkProfanity(text),
    ])

    // Determine if profanity was found and extract profane words if any
    const containsProfanity = profanityResult.startsWith(
      "Text contains profanity"
    )
    const profaneWords: string[] = []

    if (containsProfanity) {
      // Extract the profane words from the response
      const match = profanityResult.match(
        /Text contains profanity(?:\s+\(detected by AI\))?\:\s+(.+)/
      )
      if (match && match[1]) {
        profaneWords.push(...match[1].split(", ").map((word) => word.trim()))
      }
    }

    // Combine sentiment analysis with profanity check
    return c.json(
      {
        ...sentimentResult,
        profanityCheck: {
          containsProfanity,
          profaneWords: profaneWords.length > 0 ? profaneWords : undefined,
        },
      },
      200
    )
  } catch (error) {
    console.error("Error in sentiment analysis:", error)
    return c.json({ error: "Failed to analyze text" }, 500)
  }
})

export default sentimentAnalyzer

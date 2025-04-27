import { z } from "@hono/zod-openapi"

// Common schemas
export const ErrorSchema = z
  .object({
    error: z.string().openapi({
      example: "Failed to process request",
    }),
  })
  .openapi("Error")

// Profanity Checker schemas
export const CheckProfanityRequestSchema = z
  .object({
    text: z.string().min(1).openapi({
      description: "Text to check for profanity",
      example: "This is a sample text to check",
    }),
  })
  .openapi("CheckProfanityRequest")

export const CheckProfanityResponseSchema = z
  .object({
    result: z.union([z.string(), z.boolean()]).openapi({
      example: "This is a sample text",
      description: "Original text if no profanity is found, false otherwise",
    }),
  })
  .openapi("CheckProfanityResponse")

export const WordCheckResponseSchema = z
  .object({
    isSwearWord: z.boolean().openapi({
      example: false,
      description: "Whether the word is a swear word",
    }),
  })
  .openapi("WordCheckResponse")

// Sentiment Analysis schemas
export const SentimentAnalysisRequestSchema = z
  .object({
    text: z.string().min(1).openapi({
      description: "Text to analyze for sentiment",
      example: "I really love this product, it's fantastic!",
    }),
  })
  .openapi("SentimentAnalysisRequest")

export const SentimentAnalysisResponseSchema = z
  .object({
    sentiment: z.enum(["positive", "negative", "neutral", "mixed"]).openapi({
      description: "The detected sentiment of the text",
      example: "positive",
    }),
    score: z.number().openapi({
      description: "Sentiment score from -1 (negative) to 1 (positive)",
      example: 0.92,
    }),
    toxicity: z.boolean().openapi({
      description: "Whether the content is potentially toxic",
      example: false,
    }),
    explanation: z.string().optional().openapi({
      description: "Optional explanation of the analysis",
      example:
        "The text contains very positive language with strong affirmation.",
    }),
    profanityCheck: z
      .object({
        containsProfanity: z.boolean().openapi({
          description: "Whether profanity was detected",
          example: false,
        }),
        profaneWords: z
          .array(z.string())
          .optional()
          .openapi({
            description: "List of profane words found if any",
            example: ["badword"],
          }),
      })
      .openapi({
        description: "Results of the profanity check",
      }),
  })
  .openapi("SentimentAnalysisResponse")

// Text Submission schemas
export const TextSubmitRequestSchema = z
  .object({
    text: z.string().min(1).openapi({
      description: "Text to submit for moderation",
      example: "This is a sample text submission",
    }),
    analyzeSentiment: z.boolean().optional().openapi({
      description: "Whether to analyze sentiment of the text",
      example: true,
    }),
  })
  .openapi("TextSubmitRequest")

// Sentiment data schema for reuse
const SentimentDataSchema = z
  .object({
    sentiment: z.enum(["positive", "negative", "neutral", "mixed"]).openapi({
      description: "The detected sentiment",
      example: "positive",
    }),
    score: z.number().openapi({
      description: "Sentiment score from -1 (negative) to 1 (positive)",
      example: 0.75,
    }),
    toxicity: z.boolean().openapi({
      description: "Whether the content is potentially toxic",
      example: false,
    }),
    explanation: z.string().optional().openapi({
      description: "Explanation of the sentiment analysis",
      example: "The text expresses a positive opinion.",
    }),
  })
  .openapi("SentimentData")

export const TextSubmissionResponseSchema = z
  .object({
    originalText: z.string().openapi({
      description: "Original submitted text",
      example: "This is a sample text submission",
    }),
    moderatedResult: z.union([z.string(), z.boolean()]).openapi({
      description: "Original text if no profanity is found, false otherwise",
      example: "This is a sample text submission",
    }),
    timestamp: z.number().openapi({
      description: "Submission timestamp (Unix time)",
      example: 1714019949,
    }),
    sentiment: SentimentDataSchema.optional().openapi({
      description: "Sentiment analysis results if requested",
    }),
  })
  .openapi("TextSubmissionResponse")

export const SubmissionHistoryResponseSchema = z
  .object({
    submissions: z.array(TextSubmissionResponseSchema),
  })
  .openapi("SubmissionHistoryResponse")

// Word parameter schema
export const WordParamSchema = z
  .object({
    word: z.string().openapi({
      param: {
        name: "word",
        in: "path",
      },
      description: "Word to check",
      example: "example",
    }),
  })
  .openapi("WordParam")

export const WordCreateRequestSchema = z
  .object({
    word: z.string().min(1).openapi({
      description: "Swear word to add to the list",
      example: "badword",
    }),
  })
  .openapi("WordCreateRequest")

export const WordCreateResponseSchema = z
  .object({
    id: z.number().openapi({
      description: "ID of the created swear word",
      example: 1,
    }),
    word: z.string().openapi({
      description: "Swear word added",
      example: "badword",
    }),
  })
  .openapi("WordCreateResponse")

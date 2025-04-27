import { db } from "../db"
import { submissions } from "../db/schema"
import { ProfanityCheckerService } from "./profanity-checker"
import { SentimentAnalyzerService } from "./sentiment-analyzer"
import { desc } from "drizzle-orm"

// Interface for the text submission request
export interface TextSubmissionRequest {
  text: string
  analyzeSentiment?: boolean // Optional flag to include sentiment analysis
}

// Interface for the text submission response
export interface TextSubmissionResponse {
  originalText: string
  moderatedResult: string | false
  timestamp: number
  sentiment?: {
    sentiment: "positive" | "negative" | "neutral" | "mixed"
    score: number
    toxicity: boolean
    explanation?: string
  }
}

/**
 * Text Submission Service
 * Handles text submissions, checks them for profanity,
 * and logs the results to the database
 */
export class TextSubmissionService {
  private profanityChecker: ProfanityCheckerService
  private sentimentAnalyzer: SentimentAnalyzerService

  constructor() {
    this.profanityChecker = new ProfanityCheckerService()
    this.sentimentAnalyzer = new SentimentAnalyzerService()
  }

  /**
   * Submit text for content moderation
   * @param text The text to check
   * @param analyzeSentiment Whether to include sentiment analysis
   * @returns The submission result object
   */
  async submitText(
    text: string,
    analyzeSentiment = false
  ): Promise<TextSubmissionResponse> {
    // Prepare promises for parallel execution
    const promises: [Promise<string>, Promise<any>?] = [
      this.profanityChecker.checkProfanity(text),
    ]

    // Add sentiment analysis if requested
    if (analyzeSentiment) {
      promises.push(this.sentimentAnalyzer.analyzeSentiment(text))
    }

    // Execute promises in parallel
    const [moderatedOutput, sentimentResult] = await Promise.all(promises)

    const timestamp = Math.floor(Date.now() / 1000) // Unix timestamp

    // Determine if content should be blocked based on both profanity and sentiment
    let finalOutput = moderatedOutput

    // If no profanity was found but sentiment analysis shows high toxicity,
    // we can still flag the content
    if (
      analyzeSentiment &&
      sentimentResult &&
      sentimentResult.toxicity &&
      !moderatedOutput.startsWith("Text contains profanity")
    ) {
      finalOutput = `Text flagged for toxic content (sentiment toxicity score: ${sentimentResult.score})`
    }

    // Insert into database with sentiment data if available
    const [submission] = await db
      .insert(submissions)
      .values({
        originalText: text,
        moderatedOutput: finalOutput,
        timestamp,
        // Store sentiment data in JSON format if available
        additionalData:
          analyzeSentiment && sentimentResult
            ? JSON.stringify({
                sentiment: sentimentResult.sentiment,
                score: sentimentResult.score,
                toxicity: sentimentResult.toxicity,
              })
            : null,
      })
      .returning()

    // Build response object
    const response: TextSubmissionResponse = {
      originalText: submission.originalText,
      moderatedResult: finalOutput === "false" ? false : finalOutput,
      timestamp: submission.timestamp,
    }

    // Add sentiment data if analyzed
    if (analyzeSentiment && sentimentResult) {
      response.sentiment = {
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        toxicity: sentimentResult.toxicity,
        explanation: sentimentResult.explanation,
      }
    }

    return response
  }

  /**
   * Get submission history
   * @param limit Maximum number of submissions to return
   * @returns Array of submissions
   */
  async getSubmissionHistory(limit = 10): Promise<TextSubmissionResponse[]> {
    const results = await db
      .select()
      .from(submissions)
      .limit(limit)
      .orderBy(desc(submissions.timestamp))

    return results.map((submission) => {
      const response: TextSubmissionResponse = {
        originalText: submission.originalText,
        moderatedResult:
          submission.moderatedOutput === "false"
            ? false
            : submission.moderatedOutput,
        timestamp: submission.timestamp,
      }

      // Add sentiment data if it exists
      if (submission.additionalData) {
        try {
          const additionalData = JSON.parse(submission.additionalData)
          if (additionalData.sentiment) {
            response.sentiment = {
              sentiment: additionalData.sentiment,
              score: additionalData.score,
              toxicity: additionalData.toxicity,
            }
          }
        } catch (e) {
          // Ignore parsing errors for backward compatibility
        }
      }

      return response
    })
  }
}

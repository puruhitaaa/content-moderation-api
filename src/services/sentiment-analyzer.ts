import { GoogleGenAI } from "@google/genai"

// Interface for sentiment analysis response
export interface SentimentAnalysisResponse {
  sentiment: "positive" | "negative" | "neutral" | "mixed"
  score: number // -1 (very negative) to 1 (very positive)
  toxicity: boolean // Whether the content is considered toxic regardless of sentiment
  explanation?: string // Optional explanation of the analysis
}

/**
 * Sentiment Analyzer Service
 * Analyzes the sentiment and potential toxicity of text content
 */
export class SentimentAnalyzerService {
  private ai: GoogleGenAI

  /**
   * Analyze sentiment of given text
   * @param text The text to analyze
   * @returns SentimentAnalysisResponse with sentiment details
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysisResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: process.env.GENAI_MODEL || "gemini-1.5-flash",
        contents: `Analyze the sentiment of the following text. Return a JSON object with these properties:
        - sentiment: one of "positive", "negative", "neutral", or "mixed"
        - score: a number from -1 (very negative) to 1 (very positive)
        - toxicity: a boolean indicating if the content is potentially harmful, toxic, or inappropriate regardless of sentiment
        - explanation: a brief explanation of your analysis (optional)
        
        Text to analyze: "${text}"
        
        Response format: {
          "sentiment": "positive|negative|neutral|mixed",
          "score": number,
          "toxicity": boolean,
          "explanation": "string" (optional)
        }`,
      })

      // Extract JSON from response
      const rawContent = response.text ?? "{}"
      let content = rawContent

      // Handle possible markdown code blocks
      if (content.includes("```")) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
          content = match[1].trim()
        }
      }

      content = content.trim()

      // Parse the JSON response
      try {
        const result = JSON.parse(content) as SentimentAnalysisResponse
        return {
          sentiment: result.sentiment || "neutral",
          score: typeof result.score === "number" ? result.score : 0,
          toxicity: !!result.toxicity,
          explanation: result.explanation,
        }
      } catch (parseError) {
        console.error(
          "Failed to parse JSON sentiment response:",
          parseError,
          "Raw content:",
          rawContent
        )
        // Return a default response in case of parsing error
        return {
          sentiment: "neutral",
          score: 0,
          toxicity: false,
          explanation: "Error parsing sentiment analysis response",
        }
      }
    } catch (err) {
      console.error("Error analyzing sentiment:", err)
      // Return default values in case of error
      return {
        sentiment: "neutral",
        score: 0,
        toxicity: false,
        explanation: "Error occurred during sentiment analysis",
      }
    }
  }

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" })
  }
}

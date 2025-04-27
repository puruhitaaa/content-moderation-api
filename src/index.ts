import { OpenAPIHono } from "@hono/zod-openapi"
import { swaggerUI } from "@hono/swagger-ui"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { profanityChecker, textSubmission, sentimentAnalyzer } from "./routes"

// Create main Hono app
const app = new OpenAPIHono()

// Middleware
app.use("*", logger())
app.use("*", cors())

// Home route
app.get("/", (c) => {
  return c.json({
    message: "Content Moderation Microservices API",
    services: {
      profanityChecker: "/api/profanity",
      textSubmission: "/api/text",
      sentimentAnalyzer: "/api/sentiment",
    },
    documentation: "/docs",
  })
})

// Mount the profanity checker service
app.route("/api/profanity", profanityChecker)

// Mount the text submission service
app.route("/api/text", textSubmission)

// Mount the sentiment analyzer service
app.route("/api/sentiment", sentimentAnalyzer)

// Add the Swagger UI
app.get("/docs", swaggerUI({ url: "/openapi.json" }))

// Generate OpenAPI documentation
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Content Moderation Microservices API",
    version: "1.0.0",
    description:
      "API for checking and submitting text content for profanity moderation",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
})

// Start the server
const port = parseInt(process.env.PORT || "3000", 10)
console.log(`Server running at http://localhost:${port}`)
console.log(`API Documentation available at http://localhost:${port}/docs`)

export default app

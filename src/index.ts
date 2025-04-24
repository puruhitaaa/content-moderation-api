import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { profanityChecker, textSubmission } from "./routes"

// Create main Hono app
const app = new Hono()

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
    },
  })
})

// Mount the profanity checker service
app.route("/api/profanity", profanityChecker)

// Mount the text submission service
app.route("/api/text", textSubmission)

// Start the server
const port = parseInt(process.env.PORT || "3000", 10)
console.log(`Server running at http://localhost:${port}`)

export default app

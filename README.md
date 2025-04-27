# Content Moderation Microservices

A system of interconnected microservices for comprehensive content moderation, built with Hono, Bun, and SQLite.

## Services

1. **Text Submission Service**: The main entry point that receives text input, processes it through other services, and stores moderation results.
2. **Profanity Checker Service**: Checks input for profanity using both a local word database and AI-powered detection.
3. **Sentiment Analyzer Service**: Analyzes the emotional tone and toxicity of text content, working alongside profanity detection.

## Service Connections

- **Text Submission → Profanity Checker**: The text submission service calls the profanity checker to identify inappropriate language.
- **Text Submission → Sentiment Analyzer**: When sentiment analysis is requested, the text submission service processes emotional context alongside profanity.
- **Sentiment Analyzer → Profanity Checker**: The sentiment analyzer integrates profanity checking to provide comprehensive content assessment in a single request.

## Setup

### Prerequisites

1. **Install Bun**: Visit the [official Bun website](https://bun.sh/) and follow the installation instructions for your operating system:

   ```bash
   # For macOS or Linux
   curl -fsSL https://bun.sh/install | bash

   # For Windows (via WSL)
   # First install WSL if you haven't already, then run the above command
   ```

2. **Set up environment variables**: Copy the example environment file and update it with your API keys:

   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Open and edit the .env file with your preferred editor
   # Be sure to add your Google API key
   ```

### Installation and Setup

```bash
# Install dependencies
bun install

# Set up the database (migrations and seed data)
bun run db:setup

# Start the development server
bun run dev
```

## API Endpoints

### Text Submission Service

#### Submit Text

- **URL**: `/api/text/submit`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "text": "Your text to check",
    "analyzeSentiment": true
  }
  ```
- **Response**:
  ```json
  {
    "originalText": "Your text to check",
    "moderatedResult": "Your text to check" or false,
    "timestamp": 1621234567,
    "sentiment": {
      "sentiment": "positive",
      "score": 0.75,
      "toxicity": false,
      "explanation": "The text expresses a positive opinion."
    }
  }
  ```

#### Get Submission History

- **URL**: `/api/text/history`
- **Method**: `GET`
- **Query Parameters**:
  - `limit` (optional): Maximum number of submissions to return (default: 10)
- **Response**:
  ```json
  {
    "submissions": [
      {
        "originalText": "Text 1",
        "moderatedResult": "Text 1" or false,
        "timestamp": 1621234567,
        "sentiment": {
          "sentiment": "positive",
          "score": 0.75,
          "toxicity": false
        }
      },
      ...
    ]
  }
  ```

### Profanity Checker Service

#### Check Text

- **URL**: `/api/profanity/check`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "text": "Your text to check"
  }
  ```
- **Response**:
  ```json
  {
    "result": "Your text to check" or "Text contains profanity: badword1, badword2"
  }
  ```

#### Check Word

- **URL**: `/api/profanity/word/:word`
- **Method**: `GET`
- **URL Parameters**:
  - `word`: The word to check
- **Response**:
  ```json
  {
    "isSwearWord": true or false
  }
  ```

### Sentiment Analyzer Service

#### Analyze Sentiment

- **URL**: `/api/sentiment/analyze`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "text": "Your text to analyze"
  }
  ```
- **Response**:
  ```json
  {
    "sentiment": "positive",
    "score": 0.92,
    "toxicity": false,
    "explanation": "The text expresses a positive opinion.",
    "profanityCheck": {
      "containsProfanity": false,
      "profaneWords": ["word1", "word2"] // Only present if profanity found
    }
  }
  ```

## Database

The application uses SQLite with Drizzle ORM for data persistence:

- `swear_words` table: Stores a list of profane words to check against
- `submissions` table: Logs all text submissions, their moderation results, and sentiment analysis data

## Technologies Used

- **Hono**: Fast, lightweight web framework
- **Bun**: JavaScript runtime and package manager
- **Drizzle ORM**: TypeScript ORM for SQLite
- **SQLite**: File-based database
- **Zod**: Schema validation
- **Google Gemini AI**: AI-powered content moderation and sentiment analysis

Visit http://localhost:3000 to access the API
Visit http://localhost:3000/docs for interactive API documentation

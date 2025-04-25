# Content Moderation Microservices

A system of two interconnected microservices for content moderation, built with Hono, Bun, and SQLite.

## Services

1. **Text Submission Service**: Receives text input and communicates with the Profanity Checker Service.
2. **Profanity Checker Service**: Checks input for profanity and returns either a boolean false (if profanity found) or the original string.

## Environment Variables

Before starting the server, set the following environment variables:

```bash
# Your Google GenAI API key
export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"

# (Optional) Override the default Genie model (default: gemini-2.0-flash)
export GENAI_MODEL="gemini-2.0-flash"
```

## Setup

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
    "text": "Your text to check"
  }
  ```
- **Response**:
  ```json
  {
    "originalText": "Your text to check",
    "moderatedResult": "Your text to check" or false,
    "timestamp": 1621234567
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
        "timestamp": 1621234567
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
    "result": "Your text to check" or false
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

## Database

The application uses SQLite with Drizzle ORM for data persistence:

- `swear_words` table: Stores a list of profane words to check against
- `submissions` table: Logs all text submissions and their moderation results

## Technologies Used

- **Hono**: Fast, lightweight web framework
- **Bun**: JavaScript runtime and package manager
- **Drizzle ORM**: TypeScript ORM for SQLite
- **SQLite**: File-based database
- **Zod**: Schema validation

open http://localhost:3000

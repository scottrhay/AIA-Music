# AIASpeech API Documentation

Base URL: `https://speech.aiacopilot.com/api/v1`

## Authentication

Most endpoints require authentication using JWT tokens.

### Get Token

**POST** `/auth/login`

Request:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@aiacopilot.com",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  }
}
```

### Use Token

Include in all authenticated requests:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

### Authentication

#### Register User

**POST** `/auth/register`

Request:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Get Current User

**GET** `/auth/me`

Requires authentication.

#### List All Users

**GET** `/auth/users`

Requires authentication.

---

### Songs

#### List Songs

**GET** `/songs`

Query Parameters:
- `status` - Filter by status (create, submitted, completed, all)
- `style_id` - Filter by style ID
- `vocal_gender` - Filter by vocal gender (male, female, other, all)
- `search` - Search in title and lyrics
- `all_users` - Show all team songs (true/false)

Example:
```
GET /songs?status=completed&style_id=1&search=prayer
```

#### Get Song

**GET** `/songs/:id`

#### Create Song

**POST** `/songs`

Request:
```json
{
  "specific_title": "My New Song",
  "specific_lyrics": "These are my song lyrics...",
  "prompt_to_generate": "Optional custom prompt",
  "style_id": 1,
  "vocal_gender": "male",
  "status": "create"
}
```

#### Update Song

**PUT** `/songs/:id`

Request body same as Create Song.

#### Delete Song

**DELETE** `/songs/:id`

#### Get Song Statistics

**GET** `/songs/stats`

Query Parameters:
- `all_users` - Include all users (true/false)

Response:
```json
{
  "total": 150,
  "create": 10,
  "submitted": 5,
  "completed": 135,
  "unspecified": 0
}
```

---

### Styles

#### List Styles

**GET** `/styles`

Response:
```json
{
  "styles": [
    {
      "id": 1,
      "name": "Matt Dubb x TRON Hybrid",
      "genre": "EDM pop with Jewish dance influence...",
      "beat": "upbeat festival rhythm...",
      "mood": "energetic, inspiring...",
      "vocals": "melodic male pop vocal...",
      "instrumentation": "bright supersaws...",
      "style_description": "modern Matt Dubb dance...",
      "created_by": "admin",
      "created_at": "2024-01-01T00:00:00"
    }
  ],
  "total": 1
}
```

#### Get Style

**GET** `/styles/:id`

#### Create Style

**POST** `/styles`

Request:
```json
{
  "name": "My Custom Style",
  "genre": "Genre description",
  "beat": "Beat description",
  "mood": "Mood description",
  "vocals": "Vocals description",
  "instrumentation": "Instrumentation description",
  "style_description": "Overall style description"
}
```

#### Update Style

**PUT** `/styles/:id`

Request body same as Create Style.

#### Delete Style

**DELETE** `/styles/:id`

Note: Cannot delete styles that are being used by songs.

---

### Webhooks (for n8n)

#### Azure Speech Callback

**POST** `/webhooks/azure-callback`

Called by n8n when Azure Speech completes song generation.

Request:
```json
{
  "task_id": "azure-task-id-xyz",
  "status": "completed",
  "msg": "All generated successfully.",
  "data": [
    {
      "audio_url": "https://cdn.azure.speech/...",
      "title": "Generated Title 1"
    },
    {
      "audio_url": "https://cdn.azure.speech/...",
      "title": "Generated Title 2"
    }
  ]
}
```

#### Azure Speech Submitted

**POST** `/webhooks/azure-submitted`

Called by n8n after successfully submitting to Azure Speech API.

Request:
```json
{
  "song_id": 123,
  "task_id": "azure-task-id-xyz"
}
```

---

### Utility

#### Health Check

**GET** `/health`

No authentication required.

Response:
```json
{
  "status": "healthy",
  "service": "AIASpeech API"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not allowed)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. May be added in future versions.

## CORS

Allowed origins:
- `https://speech.aiacopilot.com`
- `http://localhost:3000` (development)

## Examples

### Create a Song and Submit to Azure Speech

```bash
# 1. Login
TOKEN=$(curl -X POST https://speech.aiacopilot.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Create song
curl -X POST https://speech.aiacopilot.com/api/v1/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "specific_title": "My Amazing Song",
    "specific_lyrics": "Verse 1...",
    "style_id": 1,
    "vocal_gender": "male",
    "status": "create"
  }'

# 3. n8n will pick it up automatically and submit to Azure Speech
# 4. Webhook will update status to "completed" with download URLs
```

### Search for Completed Songs

```bash
curl -X GET "https://speech.aiacopilot.com/api/v1/songs?status=completed&search=prayer" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Song Statistics

```bash
curl -X GET "https://speech.aiacopilot.com/api/v1/songs/stats?all_users=true" \
  -H "Authorization: Bearer $TOKEN"
```

# REST API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via session cookies.
Send requests with `credentials: 'include'` option.

### Auth Endpoints

#### POST /auth/register

Register a new user.

**Request Body:**

```json
{
  "username": "string (3-20 chars)",
  "password": "string (min 6 chars)",
  "displayName": "string (1-32 chars)"
}
```

**Response:**

```json
{
  "user": {
    "id": number,
    "username": string,
    "displayName": string,
    "avatarUrl": string | null,
    "status": "online" | "away" | "busy" | "offline",
    "createdAt": string
  }
}
```

**Status Codes:**

- 201 Created - Success
- 400 Bad Request - Validation error
- 409 Conflict - Username already taken

---

#### POST /auth/login

Log in an existing user.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "user": {
    "id": number,
    "username": string,
    "displayName": string,
    "avatarUrl": string | null,
    "status": "online",
    "createdAt": string
  }
}
```

**Status Codes:**

- 200 OK - Success
- 401 Unauthorized - Invalid credentials

---

#### POST /auth/logout

Log out the current user.

**Response:**

```json
{
  "ok": true
}
```

---

#### GET /auth/me

Get the current authenticated user.

**Response:**

```json
{
  "user": User | null
}
```

---

### User Endpoints

#### GET /users/:userId

Get a user's profile.

**Response:**

```json
{
  "id": number,
  "username": string,
  "displayName": string,
  "avatarUrl": string | null,
  "bannerUrl": string | null,
  "bio": string | null,
  "pronouns": string | null,
  "website": string | null,
  "location": string | null,
  "status": string,
  "customStatus": string | null,
  "accentColor": string | null,
  "profileGradient": string | null,
  "badges": string[],
  "createdAt": string
}
```

---

#### PATCH /users/:userId

Update user profile (authenticated user only).

**Request Body:**

```json
{
  "displayName"?: string,
  "bio"?: string,
  "pronouns"?: string,
  "website"?: string,
  "location"?: string,
  "customStatus"?: string,
  "accentColor"?: string,
  "profileGradient"?: string,
  "status"?: "online" | "away" | "busy" | "offline"
}
```

**Response:** Updated user object

---

### Room Endpoints

#### GET /rooms

Get all rooms the user is a member of.

**Response:**

```json
[
  {
    "id": string,
    "name": string,
    "inviteCode": string,
    "ownerId": number,
    "quality": string,
    "isActive": boolean,
    "memberCount": number,
    "members": User[],
    "createdAt": string
  }
]
```

---

#### POST /rooms

Create a new room.

**Request Body:**

```json
{
  "name": "string",
  "quality"?: "360p" | "480p" | "720p" | "1080p" | "1440p"
}
```

**Response:** Created room object

---

#### GET /rooms/:roomId

Get a specific room.

**Response:** Room object with members

---

#### PATCH /rooms/:roomId

Update room settings (owner only).

**Request Body:**

```json
{
  "name"?: string,
  "quality"?: string
}
```

---

#### DELETE /rooms/:roomId

Delete a room (owner only).

---

#### POST /rooms/:roomId/leave

Leave a room.

**Response:**

```json
{
  "ok": true
}
```

---

#### POST /rooms/join-by-code

Join a room using an invite code.

**Request Body:**

```json
{
  "inviteCode": string
}
```

**Response:** Room object

---

### Message Endpoints

#### GET /rooms/:roomId/messages

Get messages in a room.

**Query Parameters:**

- `before` (number): Get messages before this ID
- `limit` (number, default 50, max 100): Number of messages to return

**Response:**

```json
[
  {
    "id": number,
    "roomId": string,
    "userId": number,
    "content": string,
    "type": "text" | "file" | "system",
    "replyToId": number | null,
    "isDeleted": boolean,
    "editedAt": string | null,
    "createdAt": string,
    "user": User,
    "reactions": {
      "emoji": {
        "count": number,
        "userIds": number[]
      }
    },
    "replyTo": Message | null
  }
]
```

---

#### POST /rooms/:roomId/messages

Send a message to a room.

**Request Body:**

```json
{
  "content": string,
  "replyToId"?: number
}
```

**Response:** Created message object

---

#### PATCH /rooms/:roomId/messages/:messageId

Edit a message (author only).

**Request Body:**

```json
{
  "content": string
}
```

---

#### DELETE /rooms/:roomId/messages/:messageId

Delete a message (author only).

---

#### POST /rooms/:roomId/messages/:messageId/reactions

Toggle a reaction on a message.

**Request Body:**

```json
{
  "emoji": string
}
```

---

#### POST /rooms/:roomId/upload

Upload a file to a room.

**Request Body:**

```json
{
  "dataUrl": string,
  "fileName": string,
  "caption"?: string,
  "replyToId"?: number
}
```

**Response:** Created message object with file attachment

---

#### GET /rooms/:roomId/messages/search

Search messages in a room.

**Query Parameters:**

- `q` (string, min 2 chars): Search query

**Response:** Array of matching messages

---

### Friends Endpoints

#### GET /friends

Get user's friends, incoming and outgoing requests.

**Response:**

```json
{
  "friends": [
    {
      "user": User,
      "since": string,
      "status": string
    }
  ],
  "incoming": [
    {
      "user": User,
      "requestedAt": string
    }
  ],
  "outgoing": [
    {
      "user": User,
      "requestedAt": string
    }
  ]
}
```

---

#### GET /friends/search

Search for users by username or display name.

**Query Parameters:**

- `q` (string): Search query

**Response:**

```json
[
  {
    "id": number,
    "username": string,
    "displayName": string,
    "avatarUrl": string | null,
    "status": string
  }
]
```

---

#### POST /friends/request

Send a friend request.

**Request Body:**

```json
{
  "userId": number
}
```

**Response:**

```json
{
  "status": "pending" | "accepted",
  "user": User
}
```

---

#### POST /friends/accept

Accept a friend request.

**Request Body:**

```json
{
  "userId": number
}
```

---

#### POST /friends/reject

Reject a friend request.

**Request Body:**

```json
{
  "userId": number
}
```

---

#### DELETE /friends/:userId

Remove a friend.

---

#### POST /friends/block

Block a user.

**Request Body:**

```json
{
  "userId": number
}
```

---

#### GET /friends/status/:userId

Get friendship status with a user.

**Response:**

```json
{
  "status": "none" | "pending" | "friends" | "blocked" | "you_blocked"
}
```

---

### DM Endpoints

#### GET /dms

Get all DM conversations.

**Response:**

```json
[
  {
    "id": string,
    "otherUser": User,
    "lastMessage": {
      "content": string,
      "type": string,
      "userId": number,
      "createdAt": string
    } | null,
    "updatedAt": string
  }
]
```

---

#### POST /dms/open

Open or create a DM conversation with a user.

**Request Body:**

```json
{
  "userId": number
}
```

**Response:**

```json
{
  "id": string,
  "otherUser": User
}
```

---

#### GET /dms/:conversationId/messages

Get messages in a DM conversation.

**Query Parameters:**

- `before` (number): Get messages before this ID
- `limit` (number, default 50, max 50): Number of messages to return

**Response:** Array of DM messages

---

#### POST /dms/:conversationId/messages

Send a message in a DM conversation.

**Request Body:**

```json
{
  "content": string,
  "replyToId"?: number
}
```

---

#### POST /dms/:conversationId/upload

Upload a file to a DM conversation.

**Request Body:**

```json
{
  "dataUrl": string,
  "fileName": string,
  "caption"?: string
}
```

---

### Health & Utility Endpoints

#### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

---

#### GET /csrf

Get a CSRF token for form submissions.

**Response:**

```json
{
  "csrfToken": string
}
```

---

#### POST /csrf/refresh

Refresh the CSRF token.

**Response:**

```json
{
  "csrfToken": string,
  "expiresAt": string
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "message": string,
    "code": string
  }
}
```

### Common Error Codes

| Code                  | HTTP Status | Description                         |
| --------------------- | ----------- | ----------------------------------- |
| `VALIDATION_ERROR`    | 400         | Request validation failed           |
| `NOT_AUTHENTICATED`   | 401         | Authentication required             |
| `NOT_AUTHORIZED`      | 403         | User not authorized for this action |
| `NOT_FOUND`           | 404         | Resource not found                  |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests                   |
| `CONFLICT`            | 409         | Resource already exists             |
| `INTERNAL_ERROR`      | 500         | Internal server error               |

## Rate Limiting

- **API Routes**: 1000 requests per 15 minutes per IP
- **Auth Routes**: 10 requests per 15 minutes per IP (login, register)

Response headers include:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when window resets

## Socket.IO Events

See the server source code for WebSocket event handlers.

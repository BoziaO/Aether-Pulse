# System Architecture

## Overview

Nicori follows a **monorepo architecture** with clear separation between client, server, and shared code. The
application is built on modern web technologies with a focus on real-time communication.

## Monorepo Structure

```
nicori/
├── client/           # Vue 3 Frontend
│   ├── src/
│   │   ├── app/      # Router, layouts
│   │   ├── components/ # Reusable UI components
│   │   ├── stores/   # Pinia state management
│   │   ├── services/ # API, Socket, RTC services
│   │   ├── views/    # Page views
│   │   └── styles/   # CSS and themes
│   └── vite.config.ts
│
├── server/           # Node.js Backend
│   ├── src/
│   │   ├── routes/   # Express API routes
│   │   ├── middleware/ # Express middleware
│   │   └── utils/    # Helper utilities
│   └── build.mjs
│
├── shared/           # Shared Code
│   ├── db/           # Database schema and migrations
│   ├── api-zod/      # API schemas and validation
│   └── api-spec/     # OpenAPI specification
│
├── docker/           # Docker configuration
│   ├── client/
│   │   └── Dockerfile
│   ├── server/
│   │   └── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
└── docs/            # Documentation
```

## Data Flow Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Vue Router                            │
│  /auth    /    /room/:id    /profile    /friends    /dm   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    Pinia Stores                            │
│  auth.store    room.store    rtc.store    chat.store     │
│  friends.store  dm.store    presence.store  settings.store│
└─────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────┐           ┌─────────────────────┐
│   API Services       │           │    Socket Service    │
│  room.api.ts         │           │   socket.ts          │
│  auth.api.ts         │           │                     │
│  user.api.ts         │           └─────────────────────┘
│  friends.api.ts      │                   │
│  dm.api.ts           │                   ▼
└─────────────────────┘            ┌─────────────────────┐
                                  │  Socket.IO Events    │
                                  │  chat-message        │
                                  │  user-joined         │
                                  │  call-user-joined   │
                                  └─────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                          │
│  app.ts (middleware, routes)                              │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Middleware                              │
│  helmet          cors           rate-limit   session      │
│  pino-http      cookie-parser  csrf (optional)            │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    API Routes                              │
│  /api/auth       /api/rooms      /api/messages            │
│  /api/users      /api/friends    /api/dms                 │
│  /api/health     /api/csrf                                 │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Socket.IO Server                        │
│  server.ts (WebSocket handlers)                          │
│  - Connection management                                  │
│  - Room joining/leaving                                   │
│  - Call signaling (offer/answer/ice)                      │
│  - Real-time messaging                                    │
│  - Presence updates                                       │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Database                                │
│  SQLite (development) / PostgreSQL (production)            │
│  Drizzle ORM for type-safe queries                         │
│                                                             │
│  Tables:                                                  │
│  - users                 - rooms                          │
│  - room_members          - messages                       │
│  - message_reactions    - friends                         │
│  - friend_requests       - dm_conversations              │
│  - dm_messages           - user_settings                 │
└─────────────────────────────────────────────────────────┘
```

## Real-Time Communication Architecture

### WebRTC Data Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  User A  │      │  User B  │      │  User C  │
│ Browser  │      │ Browser  │      │ Browser  │
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │
     │ STUN/TURN       │                 │
     │ Request         │                 │
     ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                    STUN/TURN Server                        │
│  (Coturn) - For NAT traversal                              │
└─────────────────────────────────────────────────────────┘
     │                 │                 │
     │ ICE Candidates  │                 │
     │ ←─────────────→ │                 │
     │   (via Socket) │                 │
     ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                    Socket.IO Server                         │
│  Signaling: offer, answer, ICE candidates                   │
└─────────────────────────────────────────────────────────┘
     │                 │                 │
     │ Peer Connection │                 │
     │ ←─────────────→ │ ←─────────────→ │
     │   (Direct P2P) │   (Direct P2P)    │
     ▼                 ▼                 ▼
  [ Audio/Video      [ Audio/Video      [ Audio/Video
    Stream ]           Stream ]           Stream ]
```

### Spatial Audio Implementation

```
┌─────────────────────────────────────────────────────────┐
│                    Audio Context                           │
│  Web Audio API / Howler.js                                │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Position Calculation                   │
│  Based on user positions in room:                         │
│  - Each user has (x, y, z) coordinates                     │
│  - Distance affects volume and panning                   │
│  - Direction affects stereo panning (L/R)                │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Audio Processing                        │
│  For each remote stream:                                  │
│  1. Create AudioContext and MediaStreamSource              │
│  2. Create StereoPannerNode for L/R positioning            │
│  3. Create GainNode for volume control                    │
│  4. Connect: Source → Panner → Gain → Destination          │
│  5. Update panner.positionX/Y based on user position     │
│  6. Update gain.value based on distance                   │
└─────────────────────────────────────────────────────────┘
```

## State Management (Pinia)

### Store Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         Auth Store                         │
│  - user: User | null                                       │
│  - loading: boolean                                        │
│  - error: string | null                                     │
│  - isLoggedIn: computed                                    │
│  - login(), register(), logout(), fetchMe(), updateProfile()│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                         Room Store                          │
│  - rooms: Room[]                                           │
│  - currentRoom: Room | null                               │
│  - loading: boolean                                        │
│  - fetchRooms(), createRoom(), joinByCode(), loadRoom()   │
│  - updateRoom(), deleteRoom(), leaveRoom()                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                         RTC Store                           │
│  - localStream: MediaStream | null                         │
│  - remoteStreams: Map<number, MediaStream>                 │
│  - isMuted: boolean                                         │
│  - isVideoOn: boolean                                       │
│  - inCall: boolean                                          │
│  - roomUsers: number[]                                     │
│  - callUsers: Map<number, string>                          │
│  - joinRoom(), leaveRoom(), startCall(), endCall()         │
│  - toggleMute(), toggleVideo()                             │
│  - shareScreen(), stopScreenShare()                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                         Chat Store                          │
│  - messages: Message[]                                     │
│  - typingUsers: Set<number>                                │
│  - loadMessages(), sendMessage(), editMessage()           │
│  - deleteMessage(), toggleReaction()                       │
│  - addTypingUser(), removeTypingUser()                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                         DM Store                            │
│  - conversations: DmConversation[]                          │
│  - messages: DmMessage[]                                   │
│  - currentConversationId: string | null                    │
│  - fetchConversations(), openWith(), loadMessages()        │
│  - sendMessage(), uploadFile()                             │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

### Frontend Error Handling

1. **API Errors**: Caught in api client, propagated to stores
2. **Socket Errors**: Handled in store socket event handlers
3. **Component Errors**: Displayed via Toast notifications
4. **UI Errors**: Shown inline with error messages

### Backend Error Handling

1. **Route Validation**: Zod schema validation
2. **Authentication**: Session middleware
3. **Authorization**: Room membership checks
4. **Database Errors**: Try-catch blocks with proper logging
5. **Global Handler**: Catches unhandled errors, returns JSON

## Performance Considerations

- **Lazy Loading**: Heavy components (VideoCall) can be lazy-loaded
- **Code Splitting**: Vite handles code splitting automatically
- **Bundle Optimization**: Dependencies are properly tree-shaken
- **Memory Management**: Socket listeners are cleaned up on unmount
- **Debouncing**: Typing indicators and search are debounced

## Scalability Considerations

- **Horizontal Scaling**: Stateless server design
- **Session Storage**: Can be swapped to Redis for multi-instance
- **Socket.IO**: Redis adapter for pub/sub across instances
- **Database**: PostgreSQL for production with connection pooling
- **File Uploads**: Can be offloaded to S3 or similar
- **Rate Limiting**: Per-IP rate limiting for API protection

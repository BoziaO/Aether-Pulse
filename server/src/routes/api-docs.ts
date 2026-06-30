import { Router } from 'express'

const router = Router()

router.get('/api-docs', (_req, res) => {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Nicori API',
      description: 'Otwarte API platformy Nicori - komunikacja w czasie rzeczywistym',
      version: '1.0.0',
      contact: {
        name: 'Nicori Team',
        url: 'https://github.com/BoziaO/Nicori',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      { url: '/api', description: 'API' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            displayName: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['online', 'away', 'busy', 'offline'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            inviteCode: { type: 'string' },
            ownerId: { type: 'string' },
            memberCount: { type: 'integer' },
            isActive: { type: 'boolean' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            roomId: { type: 'string' },
            userId: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string', enum: ['text', 'file', 'system'] },
            createdAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          security: [],
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Rejestracja',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'password', 'displayName'],
                  properties: {
                    username: { type: 'string', minLength: 3, maxLength: 20 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    displayName: { type: 'string', minLength: 1, maxLength: 32 },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Zarejestrowano' },
            '409': { description: 'Nazwa uzytkownika zajeta' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Logowanie',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Zalogowano' },
            '401': { description: 'Bledne dane' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Aktualny uzytkownik',
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Nie zalogowano' },
          },
        },
      },
      '/rooms': {
        get: {
          tags: ['Rooms'],
          summary: 'Lista pokoi',
          responses: {
            '200': {
              description: 'Lista pokoi',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Room' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Rooms'],
          summary: 'Utworz pokoj',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    quality: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Utworzono' },
          },
        },
      },
      '/rooms/{roomId}/messages': {
        get: {
          tags: ['Messages'],
          summary: 'Wiadomosci w pokoju',
          parameters: [
            { name: 'roomId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'before', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Wiadomosci',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Message' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Messages'],
          summary: 'Wyslij wiadomosc',
          parameters: [
            { name: 'roomId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: { type: 'string' },
                    replyToId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Wyslano' },
          },
        },
      },
      '/friends': {
        get: {
          tags: ['Friends'],
          summary: 'Lista znajomych',
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
      '/friends/request': {
        post: {
          tags: ['Friends'],
          summary: 'Wyslij zaproszenie',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId'],
                  properties: {
                    userId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
      '/dms': {
        get: {
          tags: ['DMs'],
          summary: 'Lista konwersacji',
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
      '/users/{userId}': {
        get: {
          tags: ['Users'],
          summary: 'Profil uzytkownika',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
    },
  }

  res.json(spec)
})

export default router

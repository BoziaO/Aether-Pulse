# Docker Deployment Guide

## Overview

Nicori can be deployed using Docker for development or production. This guide covers setting up the application
with Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)
- Minimum 4GB RAM, 2 CPU cores

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/nicori.git
cd nicori
```

### 2. Copy Environment File

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Create Docker Network and Volumes

The docker-compose.yml already includes everything needed.

### 4. Start All Services

```bash
# Start all services (development mode)
docker-compose -f docker/docker-compose.yml up -d

# View running containers
docker-compose -f docker/docker-compose.yml ps
```

### 5. Access the Application

- **Frontend**: http://localhost:80 (via Nginx)
- **Backend API**: http://localhost:3000/api
- **Database**: localhost:5432 (PostgreSQL)
- **Redis**: localhost:6379

## Production Deployment

### 1. Configure Environment Variables

Edit `.env` with production values:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://nicori:your_password@db:5432/nicori
SESSION_SECRET=your_very_strong_secret_here
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
CLIENT_URL=https://your-domain.com
REDIS_URL=redis://redis:6379
```

### 2. Build and Start

```bash
# Build images
docker-compose -f docker/docker-compose.yml build

# Start services
docker-compose -f docker/docker-compose.yml up -d
```

### 3. Verify Deployment

```bash
# Check service logs
docker-compose -f docker/docker-compose.yml logs -f

# Test API
docker-compose -f docker/docker-compose.yml exec server curl http://localhost:3000/api/health

# Test database connection
docker-compose -f docker/docker-compose.yml exec db psql -U nicori -d nicori -c "SELECT 1;"
```

## Docker Compose Configuration

The `docker/docker-compose.yml` file defines the following services:

### Services

| Service | Port | Description                            |
| ------- | ---- | -------------------------------------- |
| nginx   | 80   | Reverse proxy and static file server   |
| client  | 3001 | Vue frontend (built, served via Nginx) |
| server  | 3000 | Node.js backend                        |
| db      | 5432 | PostgreSQL database                    |
| redis   | 6379 | Redis for sessions and Socket.io       |
| turn    | 3478 | Coturn TURN server for WebRTC          |

### Volumes

- `db-data`: Persistent PostgreSQL data
- `redis-data`: Persistent Redis data

### Networks

- `nicori-network`: Internal Docker network for service communication

## Customizing the Configuration

### Changing Ports

Edit `docker/docker-compose.yml` to change exposed ports:

```yaml
services:
  nginx:
    ports:
      - '80:80' # Change to "8080:80" to expose on port 8080
  server:
    ports:
      - '3000:3000' # Change to "3001:3000" to expose on port 3001
  db:
    ports:
      - '5432:5432' # Remove to disable external DB access
```

### Using External Database

To use an external PostgreSQL database instead of the container:

```yaml
services:
  server:
    environment:
      - DATABASE_URL=postgresql://user:password@your-external-db:5432/nicori
    # Remove db dependency
    # depends_on:
    #   - db
```

### Using External Redis

```yaml
services:
  server:
    environment:
      - REDIS_URL=redis://your-external-redis:6379
    # Remove redis dependency
    # depends_on:
    #   - redis
```

## Building Images Manually

### Build Server Image

```bash
docker build -t nicori-server:latest -f docker/server/Dockerfile .
```

### Build Client Image

```bash
docker build -t nicori-client:latest -f docker/client/Dockerfile .
```

### Run Containers

```bash
# Run PostgreSQL
docker run -d --name nicori-db \
  -e POSTGRES_USER=nicori \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=nicori \
  -p 5432:5432 \
  -v nicori-db-data:/var/lib/postgresql/data \
  postgres:15-alpine

# Run Redis
docker run -d --name nicori-redis \
  -p 6379:6379 \
  -v nicori-redis-data:/data \
  redis:7-alpine

# Run Server
docker run -d --name nicori-server \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL=postgresql://nicori:your_password@host.docker.internal:5432/nicori \
  -e SESSION_SECRET=your_secret \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  nicori-server:latest

# Run Client (via Nginx)
docker run -d --name nicori-client \
  -p 80:80 \
  nicori-client:latest
```

## Docker Hub / Registry

### Build and Push Images

```bash
# Login to Docker Hub
docker login

# Build and tag
docker build -t your-username/nicori-server:latest -f docker/server/Dockerfile .
docker build -t your-username/nicori-client:latest -f docker/client/Dockerfile .

# Push to registry
docker push your-username/nicori-server:latest
docker push your-username/nicori-client:latest
```

### Pull and Run

```bash
# Pull images
docker pull your-username/nicori-server:latest
docker pull your-username/nicori-client:latest

# Run with docker-compose using custom images
# Edit docker/docker-compose.yml to use your images
docker-compose -f docker/docker-compose.yml up -d
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find and kill the process using the port
sudo lsof -i :3000
kill -9 <PID>

# Or use a different port in docker-compose.yml
```

#### Permission Issues

```bash
# Make sure Docker can create volumes
sudo chown -R $USER:$USER /var/run/docker.sock

# For PostgreSQL data directory
sudo chown -R 1000:1000 /path/to/volume
```

#### Database Connection Issues

```bash
# Check database logs
docker-compose -f docker/docker-compose.yml logs db

# Connect to database manually
docker-compose -f docker/docker-compose.yml exec db psql -U nicori -d nicori

# Test connection from server container
docker-compose -f docker/docker-compose.yml exec server node -e "
const { db } = require('./shared/db');
db.select().from(usersTable).then(r => console.log('DB connection OK', r)).catch(e => console.error(e))
"
```

#### Redis Connection Issues

```bash
# Test Redis connection
docker-compose -f docker/docker-compose.yml exec server redis-cli ping
# Should return "PONG"
```

#### WebRTC/TURN Issues

If WebRTC connections fail:

```bash
# Check TURN server logs
docker-compose -f docker/docker-compose.yml logs turn

# Verify TURN server is running
netstat -tulnp | grep 3478

# Check firewall settings
sudo ufw allow 3478
sudo ufw allow 49152:49162
```

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker/docker-compose.yml logs -f

# Specific service
/docker-compose -f docker/docker-compose.yml logs -f server
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# Or use ctop
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock quay.io/vektorlab/ctop
```

## Updates

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml build --no-cache
docker-compose -f docker/docker-compose.yml up -d

# Run database migrations if needed
# (Drizzle will auto-migrate in development)
```

### Updating Dependencies

```bash
# Update pnpm-lock.yaml
pnpm up

# Rebuild Docker images
docker-compose -f docker/docker-compose.yml build --no-cache
```

## Security Considerations

### Secrets Management

- Never commit secrets to Git
- Use `.env` file with `gitignore`
- For production, use Docker secrets or environment variable manager

### HTTPS

Configure HTTPS with Nginx or a reverse proxy like Traefik:

```yaml
services:
  nginx:
    ports:
      - '443:443'
    volumes:
      - /path/to/ssl/cert.pem:/etc/nginx/ssl/cert.pem:ro
      - /path/to/ssl/key.pem:/etc/nginx/ssl/key.pem:ro
```

Update `docker/nginx.conf` to use SSL:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }

    # Rest of configuration
    ...
}
```

### Database Security

- Use strong passwords
- Create dedicated database users
- Restrict database access to specific IPs
- Enable PostgreSQL authentication

### Network Security

- Use Docker's internal network for service communication
- Don't expose database ports externally in production
- Use firewalls to restrict access

## Scaling

For production scaling, consider:

1. **Multiple Server Instances**: Run multiple server containers behind a load balancer
2. **Redis for Session Storage**: Use Redis to share sessions across instances
3. **Redis Adapter for Socket.IO**: Enable Socket.io Redis adapter for multi-instance support
4. **Database Connection Pooling**: Configure connection pool for PostgreSQL
5. **Horizontal Scaling**: Use Kubernetes or Docker Swarm for orchestration

### Example Scaled Setup

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /path/to/ssl:/etc/nginx/ssl:ro
    depends_on:
      - server
    deploy:
      replicas: 1

  server:
    build:
      context: .
      dockerfile: docker/server/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://nicori:password@db:5432/nicori
      - REDIS_URL=redis://redis:6379
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - db
      - redis
    deploy:
      replicas: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=nicori
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=nicori
    volumes:
      - db-data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7
    volumes:
      - redis-data:/data
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

volumes:
  db-data:
  redis-data:
```

Run with:

```bash
docker stack deploy -c docker-compose.prod.yml nicori
```

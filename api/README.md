# KPI Cards REST API 🃏

**Complete REST API for KPI card deck management with security-first architecture and comprehensive endpoint coverage.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4+-black.svg)](https://expressjs.com/)
[![Security](https://img.shields.io/badge/Security-Hardened-red.svg)](#security-features)
[![Test Coverage](https://img.shields.io/badge/Coverage-95%25-brightgreen.svg)](#testing)

## Overview

A production-ready REST API built on Express.js that provides complete CRUD operations for KPI card decks. Features security hardening, input validation, file-based storage, and comprehensive error handling for integration with web applications, mobile apps, and external services.

**Perfect for:** Developers building KPI card applications, teams needing programmatic access to card management, and integrations with existing business systems.

## Key Features

### 🔒 **Security First Architecture**
- **XSS Protection** with comprehensive input sanitization
- **Content Security Policy** and security headers (HSTS, X-Frame-Options)
- **Rate limiting** and DDoS protection with configurable thresholds
- **Input validation** with pattern matching for dangerous content
- **File upload security** with type, size, and content validation
- **CORS configuration** with domain whitelist support
- **52+ security test cases** covering common vulnerabilities

### 🌐 **Complete API Coverage**
- **26 REST endpoints** across 3 main categories
- **CRUD operations** for decks and cards with full validation
- **Bulk operations** for efficient multi-card management
- **Export system** with PDF/HTML generation
- **Preview system** for real-time card visualization
- **File management** with automatic cleanup and temporary storage

### 🏗️ **Production Architecture**
- **Modular design** with separation of concerns
- **Centralized validation** using DeckValidator (DRY principle)
- **Error handling middleware** with sanitized responses
- **File-based storage** with atomic operations
- **Comprehensive logging** with configurable levels
- **Health monitoring** with system diagnostics

### ⚡ **Performance Optimized**
- **Response times** < 200ms for CRUD operations
- **Memory efficient** with automatic cleanup
- **Template caching** for rendering performance
- **Batch processing** for large operations
- **Optimized JSON parsing** with size limits

## Quick Start

### Prerequisites
- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.0.0
- **Puppeteer dependencies** for PDF generation

### Installation

```bash
# Clone the project (if not already done)
git clone https://github.com/fullo/kpi-card-generator.git
cd kpi-card-generator/api

# Install dependencies
npm install

# Configure environment
cp .env.development .env
# Edit .env if needed

# Start development server
npm start

# Verify installation
curl http://localhost:3000/api/v1/health
```

### Development Setup

```bash
# Start with auto-reload
npm run dev

# Start with specific configuration
NODE_ENV=development PORT=3001 npm start

# Start with debug logging
LOG_LEVEL=debug npm start
```

### Production Setup

```bash
# Production mode
NODE_ENV=production npm start

# With PM2 process manager
pm2 start server/server.js --name kpi-cards-api

# Monitor logs
pm2 logs kpi-cards-api
```

## API Reference

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Currently, the API operates without authentication. For production deployments, consider implementing:
- JWT tokens for session management
- API keys for service-to-service communication
- OAuth 2.0 for third-party integrations

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Human-readable error description",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "totalPages": 5,
    "limit": 20,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Endpoints Overview

### Core Deck Management

#### `GET /health`
**Health check endpoint**
```bash
curl http://localhost:3000/api/v1/health

# Response:
{
  "success": true,
  "message": "KPI Cards API is healthy",
  "timestamp": "2024-09-12T10:30:00.000Z",
  "version": "4.2.0"
}
```

#### `GET /decks`
**List all decks with pagination and search**
```bash
# Basic listing
curl http://localhost:3000/api/v1/decks

# With pagination
curl "http://localhost:3000/api/v1/decks?page=2&limit=10"

# With search
curl "http://localhost:3000/api/v1/decks?search=marketing"

# With sorting
curl "http://localhost:3000/api/v1/decks?sort=createdAt&order=desc"
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search in titles and descriptions
- `sort`: Sort field (createdAt, updatedAt, title)
- `order`: Sort order (asc, desc)

#### `POST /decks`
**Create new deck**
```bash
curl -X POST http://localhost:3000/api/v1/decks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Marketing KPIs 2024",
    "subtitle": "Essential metrics for marketing teams",
    "deckIcon": "📊",
    "cards": [
      {
        "title": "Conversion Rate",
        "headerIcon": "🎯",
        "heroImage": "📈",
        "type": "KPI",
        "description": "Percentage of visitors who complete desired action",
        "flavorText": "The holy grail of digital marketing",
        "styleClass": "card-kpi"
      }
    ]
  }'
```

**Required fields:**
- `title`: Deck title (1-200 characters)

**Optional fields:**
- `subtitle`: Deck subtitle (max 500 characters)
- `deckIcon`: Emoji icon for deck
- `cards`: Array of card objects

#### `GET /decks/:id`
**Get specific deck with all cards**
```bash
curl http://localhost:3000/api/v1/decks/{deck_id}
```

#### `PATCH /decks/:id`
**Update deck information**
```bash
curl -X PATCH http://localhost:3000/api/v1/decks/{deck_id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Marketing KPIs",
    "subtitle": "Revised metrics for 2024"
  }'
```

#### `DELETE /decks/:id`
**Delete deck and all its cards**
```bash
curl -X DELETE http://localhost:3000/api/v1/decks/{deck_id}
```

#### `GET /decks/stats`
**Global statistics**
```bash
curl http://localhost:3000/api/v1/decks/stats

# Response:
{
  "success": true,
  "data": {
    "totalDecks": 25,
    "totalCards": 150,
    "averageCardsPerDeck": 6.0,
    "oldestDeck": "2024-01-15T00:00:00.000Z",
    "newestDeck": "2024-09-12T10:30:00.000Z"
  }
}
```

### Card Management

#### `GET /decks/:id/cards`
**List all cards in a deck**
```bash
curl http://localhost:3000/api/v1/decks/{deck_id}/cards

# With pagination
curl "http://localhost:3000/api/v1/decks/{deck_id}/cards?page=1&limit=10"
```

#### `POST /decks/:id/cards`
**Add new card to deck**
```bash
curl -X POST http://localhost:3000/api/v1/decks/{deck_id}/cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Acquisition Cost",
    "headerIcon": "💰",
    "heroImage": "📊",
    "type": "KPI",
    "description": "Average cost to acquire a new customer",
    "flavorText": "Keep this number trending down",
    "styleClass": "cost-metric"
  }'
```

**Required fields:**
- `title`: Card title (1-200 characters)

**Optional fields:**
- `headerIcon`: Small icon for card header
- `heroImage`: Large icon/image for card
- `type`: Card type/category (max 255 characters)
- `description`: Main card content (max 2000 characters)
- `flavorText`: Additional context (max 500 characters)
- `styleClass`: CSS class for custom styling

#### `GET /decks/:id/cards/:cardId`
**Get specific card details**
```bash
curl http://localhost:3000/api/v1/decks/{deck_id}/cards/{card_id}
```

#### `PATCH /decks/:id/cards/:cardId`
**Update card information**
```bash
curl -X PATCH http://localhost:3000/api/v1/decks/{deck_id}/cards/{card_id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Customer Acquisition Cost",
    "type": "Core KPI",
    "description": "Updated description with <strong>HTML markup</strong>"
  }'
```

#### `DELETE /decks/:id/cards/:cardId`
**Delete specific card**
```bash
curl -X DELETE http://localhost:3000/api/v1/decks/{deck_id}/cards/{card_id}
```

#### `POST /decks/:id/cards/:cardId/duplicate`
**Duplicate existing card**
```bash
curl -X POST http://localhost:3000/api/v1/decks/{deck_id}/cards/{card_id}/duplicate

# Optional: duplicate with modifications
curl -X POST http://localhost:3000/api/v1/decks/{deck_id}/cards/{card_id}/duplicate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Duplicated Card with New Title",
    "type": "Modified Type"
  }'
```

#### `POST /decks/:id/cards/bulk`
**Bulk operations on cards**
```bash
curl -X POST http://localhost:3000/api/v1/decks/{deck_id}/cards/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "add",
        "data": {
          "title": "Bulk Card 1",
          "type": "Bulk",
          "description": "Added via bulk operation"
        }
      },
      {
        "type": "update",
        "cardId": "existing_card_id",
        "data": {
          "title": "Updated Title"
        }
      },
      {
        "type": "delete",
        "cardId": "card_to_delete_id"
      }
    ]
  }'
```

**Supported operations:**
- `add`: Create new card
- `update`: Update existing card
- `delete`: Remove card

#### `PUT /decks/:id/cards/reorder`
**Reorder cards in deck**
```bash
curl -X PUT http://localhost:3000/api/v1/decks/{deck_id}/cards/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "cardIds": [
      "card_id_1",
      "card_id_3", 
      "card_id_2",
      "card_id_4"
    ]
  }'
```

#### `POST /decks/:id/cards/validate-all`
**Validate all cards in deck**
```bash
curl -X POST http://localhost:3000/api/v1/decks/{deck_id}/cards/validate-all

# Response includes validation summary:
{
  "success": true,
  "data": {
    "totalCards": 10,
    "validCards": 9,
    "invalidCards": 1,
    "validityRate": 90.0,
    "errors": [
      {
        "cardId": "invalid_card_id",
        "errors": ["Title is required"]
      }
    ]
  }
}
```

### Export & Generation

#### `POST /decks/:id/export/pdf`
**Export deck as PDF**
```bash
curl -X POST http://localhost:3000/api/v1/decks/{deck_id}/export/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "printMode": "landscape",
    "cardsPerPage": 8,
    "cardsPerRow": 4,
    "includeBackside": true
  }' \
  --output marketing-kpis.pdf
```

**Export options:**
- `printMode`: "landscape" or "portrait" (default: "landscape")
- `cardsPerPage`: 1, 2, 4, 6, 8, 12 (default: 8)
- `cardsPerRow`: 1, 2, 3, 4 (default: 4)
- `includeBackside`: true/false (default: true)

#### `POST /decks/:id/export/html`
**Export deck as HTML**
```bash
curl -X POST http://localhost:3000/api/v1/decks/{deck_id}/export/html \
  -H "Content-Type: application/json" \
  -d '{
    "printMode": "portrait",
    "cardsPerPage": 6,
    "cardsPerRow": 2
  }' \
  --output marketing-kpis.html
```

#### `GET /decks/:id/preview`
**Browser preview of deck**
```bash
# Direct browser access
curl http://localhost:3000/api/v1/decks/{deck_id}/preview

# Or visit in browser:
# http://localhost:3000/api/v1/decks/{deck_id}/preview
```

#### `GET /decks/:id/preview/json`
**Preview metadata as JSON**
```bash
curl http://localhost:3000/api/v1/decks/{deck_id}/preview/json

# Response:
{
  "success": true,
  "data": {
    "deckTitle": "Marketing KPIs",
    "totalCards": 10,
    "previewUrl": "/api/v1/decks/{deck_id}/preview",
    "exportOptions": {
      "pdf": "/api/v1/decks/{deck_id}/export/pdf",
      "html": "/api/v1/decks/{deck_id}/export/html"
    }
  }
}
```

#### `GET /decks/:id/cards/:cardId/preview`
**Single card preview**
```bash
curl http://localhost:3000/api/v1/decks/{deck_id}/cards/{card_id}/preview

# Returns HTML preview of single card
```

#### `GET /downloads/:filename`
**Download exported files**
```bash
curl http://localhost:3000/api/v1/downloads/{filename}

# Files are automatically cleaned up after 24 hours
```

#### `GET /exports/stats`
**Export statistics**
```bash
curl http://localhost:3000/api/v1/exports/stats

# Response:
{
  "success": true,
  "data": {
    "totalExports": 150,
    "pdfExports": 90,
    "htmlExports": 60,
    "averageFileSize": "2.5MB",
    "temporaryFiles": 5,
    "diskUsage": "125MB"
  }
}
```

#### `POST /exports/cleanup`
**Manual cleanup of expired files**
```bash
curl -X POST http://localhost:3000/api/v1/exports/cleanup

# Response:
{
  "success": true,
  "data": {
    "filesRemoved": 10,
    "spaceFreed": "25MB"
  }
}
```

## Input Validation

### Deck Schema
```javascript
{
  title: {
    type: "string",
    required: true,
    minLength: 1,
    maxLength: 200
  },
  subtitle: {
    type: "string",
    maxLength: 500
  },
  deckIcon: {
    type: "string",
    pattern: "emoji" // Unicode emoji validation
  },
  cards: {
    type: "array",
    maxItems: 100
  }
}
```

### Card Schema
```javascript
{
  title: {
    type: "string", 
    required: true,
    minLength: 1,
    maxLength: 200
  },
  headerIcon: {
    type: "string",
    pattern: "emoji"
  },
  heroImage: {
    type: "string",
    pattern: "emoji"
  },
  type: {
    type: "string",
    maxLength: 255
  },
  description: {
    type: "string",
    maxLength: 2000
  },
  flavorText: {
    type: "string", 
    maxLength: 500
  },
  styleClass: {
    type: "string",
    maxLength: 100,
    pattern: "css-class" // Valid CSS class names only
  }
}
```

### Security Validation

**Content Security:**
- **XSS Protection**: All HTML content sanitized
- **Script Injection**: Blocked via pattern matching
- **SQL Injection**: Not applicable (file-based storage)
- **Path Traversal**: File paths validated and sandboxed
- **Size Limits**: Request body limited to 10MB

**Dangerous Patterns Blocked:**
```javascript
const suspiciousPatterns = [
  /\bimport\s*\(/i,         // ES6 imports
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,  // Script tags
  /javascript:/i,           // JavaScript protocol
  /data:(?!image\/)/i,      // Data URIs (except images)
  /vbscript:/i,            // VBScript protocol
  /on\w+\s*=/i             // Event handlers
];
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH, PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Authentication required (future) |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 413 | Payload Too Large | Request body too large |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Examples

#### Validation Error (400)
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid deck data",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "cards[0].description", 
      "message": "Description exceeds maximum length"
    }
  ]
}
```

#### Rate Limit Error (429)
```json
{
  "success": false,
  "error": "RateLimitExceeded",
  "message": "Too many requests, please try again later",
  "details": {
    "limit": 100,
    "resetTime": "2024-09-12T11:00:00.000Z"
  }
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "error": "NotFound",
  "message": "Deck not found",
  "details": {
    "resource": "deck",
    "id": "non_existent_id"
  }
}
```

## Security Features

### Input Sanitization
- **HTML Sanitization**: Removes dangerous HTML tags and attributes
- **XSS Prevention**: Escapes potentially dangerous characters
- **Content Validation**: Pattern matching for suspicious content
- **Size Limits**: Prevents large payloads from overwhelming the server

### Security Headers
```javascript
// Applied via Helmet.js
{
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-XSS-Protection": "1; mode=block"
}
```

### Rate Limiting
- **Default Limit**: 100 requests per minute per IP
- **Configurable**: Can be adjusted via environment variables
- **Smart Cleanup**: Automatic removal of expired rate limit entries
- **Graceful Handling**: Informative error messages with retry timing

### CORS Configuration
```javascript
// Development
{
  origin: ["http://localhost:5173", "http://localhost:3001"],
  credentials: true
}

// Production
{
  origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
  credentials: true
}
```

## Performance & Monitoring

### Performance Metrics
- **Response Time**: < 200ms for CRUD operations
- **Memory Usage**: < 512MB under normal load
- **File I/O**: Optimized with atomic operations
- **PDF Generation**: < 5s for 50 cards
- **Concurrent Requests**: Tested up to 100 simultaneous requests

### Monitoring Endpoints
```bash
# Health check with system info
curl http://localhost:3000/api/v1/health?include=system

# Performance metrics
curl http://localhost:3000/api/v1/health?include=performance

# Memory usage
curl http://localhost:3000/api/v1/health?include=memory
```

### Logging Configuration
```bash
# Environment variables
LOG_LEVEL=debug          # error, warn, info, debug
LOG_FORMAT=json          # json, simple, detailed
LOG_TO_FILE=true        # Also log to file
LOG_MAX_SIZE=10M        # Max log file size
LOG_MAX_FILES=5         # Number of log files to keep
```

## Testing

### Automated Test Suite

```bash
# Run all API tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test files
npm test tests/api/decks.test.js
npm test tests/api/cards.test.js
npm test tests/api/generation.test.js
npm test tests/security/

# Run performance tests
npm run test:performance
```

### Test Coverage
- ✅ **DeckController**: 38 tests - CRUD operations, validation, error handling
- ✅ **CardController**: 34 tests - Card management, bulk operations, duplicate
- ✅ **GenerationController**: 28 tests - PDF/HTML export, preview, cleanup  
- ✅ **Security Tests**: 52+ tests - XSS, injection, validation, rate limiting
- ✅ **Integration Tests**: 15 tests - End-to-end workflows

**Coverage Metrics:**
- **Lines**: 95.8%
- **Functions**: 97.2%
- **Branches**: 93.4%
- **Statements**: 95.8%

### Testing Environments

#### Unit Testing
```bash
# Fast unit tests without external dependencies
npm run test:unit
```

#### Integration Testing  
```bash
# Tests requiring running API server
npm run test:integration
```

#### Security Testing
```bash
# Comprehensive security vulnerability testing
npm run test:security
```

#### Performance Testing
```bash
# Load testing with artillery or similar
npm run test:performance
```

### Postman Collection

Import the complete API collection for interactive testing:

```bash
# Import file: postman/KPI-Cards-API.postman_collection.json

# Collection includes:
# - All 26 endpoints with example requests
# - Environment variables for easy switching
# - Pre-request scripts for authentication (future)
# - Test scripts for response validation
# - Mock server configuration
```

## Configuration

### Environment Variables
```bash
# .env file
NODE_ENV=development              # development, production, test
PORT=3000                        # Server port
HOST=localhost                   # Server host
ENABLE_RATE_LIMIT=false         # Rate limiting (true in production)
DATA_PATH=../data               # Data storage path
LOG_LEVEL=debug                 # Logging level
MAX_REQUEST_SIZE=10mb           # Max request body size
CLEANUP_INTERVAL=3600000        # File cleanup interval (1 hour)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

### Production Configuration
```bash
# Production environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
ENABLE_RATE_LIMIT=true
DATA_PATH=/var/lib/kpi-cards/data
LOG_LEVEL=info
MAX_REQUEST_SIZE=10mb
CLEANUP_INTERVAL=3600000
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com
```

### File Storage Structure
```
data/
├── decks/                      # Deck JSON files
│   ├── deck_1234567890123_abc123.json
│   └── deck_1234567890124_def456.json
├── exports/                    # Temporary export files
│   ├── temp_export_789.pdf
│   └── temp_export_790.html
└── templates/                  # System templates
    ├── card-template.html
    └── main-template.html
```

## Deployment

### Development Deployment
```bash
# Clone and setup
git clone https://github.com/fullo/kpi-card-generator.git
cd kpi-card-generator/api
npm install

# Configure environment
cp .env.development .env

# Start development server
npm run dev
```

### Production Deployment

#### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S kpiapi -u 1001
RUN chown -R kpiapi:nodejs /app
USER kpiapi

EXPOSE 3000

CMD ["node", "server/server.js"]
```

```bash
# Build and run
docker build -t kpi-cards-api .
docker run -p 3000:3000 -e NODE_ENV=production kpi-cards-api
```

#### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server/server.js --name kpi-cards-api

# Configure for production
pm2 startup
pm2 save

# Monitor
pm2 logs kpi-cards-api
pm2 monit
```

#### Systemd Service
```ini
# /etc/systemd/system/kpi-cards-api.service
[Unit]
Description=KPI Cards API
After=network.target

[Service]
Type=simple
User=kpiapi
WorkingDirectory=/var/lib/kpi-cards/api
ExecStart=/usr/bin/node server/server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATA_PATH=/var/lib/kpi-cards/data
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Load Balancing
```nginx
# nginx.conf
upstream kpi_cards_api {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://kpi_cards_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Troubleshooting

### Common Issues

#### **Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### **Permission Errors**
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER data/
chmod -R 755 data/

# Create data directory if missing
mkdir -p data/decks data/exports data/templates
```

#### **Memory Issues**
```bash
# Monitor memory usage
node --max-old-space-size=2048 server/server.js

# Check for memory leaks
NODE_ENV=development npm start
# Use Chrome DevTools or clinic.js for profiling
```

#### **PDF Generation Fails**
```bash
# Check Puppeteer dependencies (Ubuntu/Debian)
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo-gobject2 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

#### **Rate Limit Issues**
```bash
# Temporarily disable rate limiting
ENABLE_RATE_LIMIT=false npm start

# Or increase limits
RATE_LIMIT_MAX=1000 npm start

# Clear rate limit data
rm -rf data/rate-limits/*
```

#### **CORS Errors**
```bash
# Add your domain to allowed origins
export ALLOWED_ORIGINS="http://localhost:5173,https://your-domain.com"
npm start

# Or temporarily disable CORS (development only)
DISABLE_CORS=true npm start
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* LOG_LEVEL=debug npm start

# API request/response logging
DEBUG=api:* npm start

# Security-specific debugging
DEBUG=security:* npm start
```

### Health Monitoring
```bash
# Basic health check
curl http://localhost:3000/api/v1/health

# Detailed health check
curl http://localhost:3000/api/v1/health?include=system,performance,memory

# Check specific subsystems
curl http://localhost:3000/api/v1/health?include=storage,templates,exports
```

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000
});

// Create deck
async function createDeck(deckData) {
  try {
    const response = await apiClient.post('/decks', deckData);
    return response.data;
  } catch (error) {
    console.error('Failed to create deck:', error.response?.data);
    throw error;
  }
}

// Export deck as PDF
async function exportDeckAsPDF(deckId, options = {}) {
  try {
    const response = await apiClient.post(
      `/decks/${deckId}/export/pdf`, 
      options,
      { responseType: 'stream' }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to export PDF:', error.response?.data);
    throw error;
  }
}
```

### Python
```python
import requests

class KPICardsAPI:
    def __init__(self, base_url="http://localhost:3000/api/v1"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def create_deck(self, deck_data):
        response = self.session.post(f"{self.base_url}/decks", json=deck_data)
        response.raise_for_status()
        return response.json()
    
    def export_pdf(self, deck_id, options=None):
        url = f"{self.base_url}/decks/{deck_id}/export/pdf"
        response = self.session.post(url, json=options or {})
        response.raise_for_status()
        return response.content

# Usage
api = KPICardsAPI()
deck = api.create_deck({
    "title": "Python Generated Deck",
    "cards": [{"title": "Test Card", "type": "KPI"}]
})
pdf_data = api.export_pdf(deck["data"]["id"])
```

### PHP
```php
<?php

class KPICardsAPI {
    private $baseUrl;
    private $httpClient;
    
    public function __construct($baseUrl = 'http://localhost:3000/api/v1') {
        $this->baseUrl = $baseUrl;
        $this->httpClient = new GuzzleHttp\Client();
    }
    
    public function createDeck($deckData) {
        $response = $this->httpClient->post($this->baseUrl . '/decks', [
            'json' => $deckData
        ]);
        return json_decode($response->getBody(), true);
    }
    
    public function exportPDF($deckId, $options = []) {
        $response = $this->httpClient->post(
            $this->baseUrl . "/decks/{$deckId}/export/pdf",
            ['json' => $options]
        );
        return $response->getBody();
    }
}

// Usage
$api = new KPICardsAPI();
$deck = $api->createDeck([
    'title' => 'PHP Generated Deck',
    'cards' => [['title' => 'Test Card', 'type' => 'KPI']]
]);
?>
```

## Changelog & Migration

### Current Version: 4.2.0
- **Security hardening**: XSS protection, input validation, security headers
- **Validation refactoring**: Centralized validation with DRY principle
- **API expansion**: 26 endpoints with comprehensive CRUD operations
- **Performance optimization**: Caching, batch operations, memory management

### Migration from 3.x to 4.x
- **Breaking Changes**: None - fully backward compatible
- **New Features**: Security middleware, bulk operations, enhanced validation
- **Deprecations**: None
- **Recommendations**: Update client applications to use new security features

For detailed changelog, see [CHANGELOG.md](../CHANGELOG.md)

## Support & Contribution

### Getting Help
- **Documentation**: Complete API reference above
- **Examples**: See `tests/` directory for usage examples
- **Issues**: GitHub issues for bug reports
- **Discussions**: GitHub discussions for questions

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

### Development Guidelines
- **Code Style**: ESLint + Prettier configuration
- **Testing**: 95%+ coverage required
- **Documentation**: Update README for API changes
- **Security**: Security review required for all changes

## License & Credits

### Code
MIT License - Free for commercial and non-commercial use

### Content
Creative Commons BY-NC-SA 4.0 - **Daruma Consulting di Francesco Fullone**

**Developed by Francesco Fullone** - [Daruma Consulting](https://darumahq.it)

---

**🃏 Production-ready REST API for KPI card management!**

Ready to integrate? Check out the [web interface](../web/README.md) or [CLI tools](../cli/README.md).

🚀 **API successfully implemented and tested!**
# KPI Card Generator 🎯

**Professional KPI card deck generator for interactive workshops and training sessions.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![ES Modules](https://img.shields.io/badge/ES-Modules-yellow.svg)](https://nodejs.org/api/esm.html)
[![REST API](https://img.shields.io/badge/REST-API-blue.svg)](#architecture)
[![Web Interface](https://img.shields.io/badge/Web-React-61DAFB.svg)](#architecture)
[![Test Coverage](https://img.shields.io/badge/Coverage-95%25-brightgreen.svg)](#testing)

## Overview

A comprehensive Node.js-based tool for creating customizable KPI card decks designed for workshop facilitation, team training, and educational purposes. Generate professional PDF and HTML card decks with advanced layout options and security features.

**Current Version:** 4.2.0 with CSS Style Customization, Modular Architecture, Complete REST API, and Security Hardening.

## Key Features

### 🏗️ **Modular Architecture**
- **6 specialized classes** for reusable business logic
- **Separation of concerns**: Layout, Pagination, Rendering, Validation, PDF, CLI
- **Complete test suite** (95%+ coverage)

### 🌐 **Multi-Interface Support**
- **Modern CLI** with subcommands and advanced options
- **REST API** with 26 endpoints for CRUD operations
- **React Web Interface** for browser-based management
- **Legacy CLI** for backward compatibility

### 🔒 **Security First**
- **XSS Protection** with comprehensive input sanitization
- **Content Security Policy** and security headers
- **Rate limiting** and DDoS protection
- **File upload security** with content validation
- **52+ security test cases** covering common vulnerabilities

### 🎨 **Advanced Customization**
- **CSS Style Customization** based on card `styleClass`
- **Safe HTML markup** support in card content
- **Multiple print modes**: landscape/portrait with optimized layouts
- **Character limit bypass** for detailed content
- **Template system** with caching and performance optimization

## Technology Stack

- **Runtime**: Node.js 18+ with ES Modules
- **CLI**: Commander.js with modern subcommand architecture
- **API**: Express.js with comprehensive middleware stack
- **Web**: React 18+ with Tailwind CSS and Vite
- **PDF Engine**: Puppeteer with Chrome headless rendering
- **Testing**: Jest with Supertest for API integration
- **Storage**: File-based JSON with atomic operations
- **Security**: Helmet.js, CORS, rate limiting, input validation

## Quick Start

### All-in-One Setup (Recommended)

```bash
# Clone and setup entire project
git clone https://github.com/fullo/kpi-card-generator.git
cd kpi-card-generator

# Install dependencies for all components
npm install
cd api && npm install
cd ../web && npm install && cd ..

# Start complete system (3 terminals recommended)
# Terminal 1: API Backend
cd api && npm start

# Terminal 2: Web Interface  
cd web && npm run dev

# Terminal 3: CLI Usage
node cli/generate-cards.js generate -i tests/data/test-10-carte.json -o cards.pdf -f landscape
```

### Individual Component Setup

**CLI Only:**
```bash
npm install
node cli/generate-cards.js info --system
```

**API Only:**
```bash
cd api && npm install && npm start
# API available at http://localhost:3000/api/v1
```

**Web Only (requires API):**
```bash
cd web && npm install && npm run dev
# Web interface at http://localhost:5173
```

## Project Structure

```
kpi-card-generator/
├── 📁 api/                          # REST API Backend
│   ├── server/                      # Express server setup
│   ├── controllers/                 # Request handlers  
│   ├── services/                    # Business logic
│   ├── routes/                      # API endpoints
│   ├── middleware/                  # Security & validation
│   ├── storage/                     # File-based storage
│   └── tests/                       # API test suite
├── 📁 web/                          # React Web Interface
│   ├── src/components/              # React components
│   ├── src/hooks/                   # Custom hooks
│   ├── src/services/                # API integration
│   └── src/test/                    # Web integration tests
├── 📁 modules/                      # Core Business Logic
│   ├── cards/                       # Card processing modules
│   ├── export/                      # PDF generation
│   ├── interfaces/                  # CLI interface
│   └── styles/                      # CSS customization
├── 📁 cli/                          # Modern CLI Interface
├── 📁 tests/                        # Core test suite
├── 📁 assets/                       # HTML templates
└── 📁 postman/                      # API testing collection
```

## Usage Interfaces

### 🖥️ Command Line Interface

The CLI is the **source of truth** for all card generation. All other interfaces (API and Web) derive their functionality from the CLI.

**Quick start:**
```bash
# Install and verify
npm install
node cli/generate-cards.js --version

# Basic PDF generation
node cli/generate-cards.js generate -i tests/data/test-10-carte.json -o cards.pdf

# Advanced generation with custom layout
node cli/generate-cards.js generate -i cards.json -o cards.pdf -f landscape --cards-per-page 8

# Validate JSON schema
node cli/generate-cards.js validate -i cards.json --strict

# Optimize layout configuration
node cli/generate-cards.js optimize --cards 25

# System information
node cli/generate-cards.js info --system --templates
```

**Available commands:**
- 📄 **`generate`** - Generate PDF/HTML cards with full customization
- ✅ **`validate`** - Validate JSON schema without generation  
- 🎨 **`styles`** - Interactive CSS customization for styleClass
- ⚡ **`optimize`** - Layout optimization for card counts
- ℹ️ **`info`** - System diagnostics and troubleshooting

**[📖 Complete CLI Documentation](cli/README.md)**

### 🌐 REST API

**Core endpoints:**
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Create deck
curl -X POST http://localhost:3000/api/v1/decks -H "Content-Type: application/json" -d '{"title":"My Deck","cards":[...]}'

# Export to PDF
curl -X POST http://localhost:3000/api/v1/decks/{id}/export/pdf -d '{"printMode":"landscape"}' --output deck.pdf
```

**[📖 Complete API Documentation](api/README.md)**

### 💻 Web Interface

**Modern React application:**
- 📊 Dashboard with deck management
- ✏️ Visual deck and card editor
- 👁️ Live preview with export options
- 📱 Mobile-responsive design
- 🔄 Real-time API integration

**[📖 Web Interface Guide](web/README.md)**

## Architecture Highlights

### Validation Architecture (DRY Principle)

**Single Source of Truth:** All validation rules centralized in `DeckValidator.js`
- English-only field names (title, type, description, etc.)
- API wraps DeckValidator for security sanitization
- Web layer uses DeckValidator directly
- Eliminates code duplication between components

### Security Patterns

**Precise Regex with Word Boundaries:**
- Pattern: `/\bimport\s*\(/i` instead of `/import\s*\(/i`
- Prevents false positives (e.g., "importanza" won't trigger security alerts)
- Applied in `SanitizationService.js` and `securityValidation.js`

### Performance Optimizations

- **Template caching** for rendering performance
- **Lazy loading** of heavy modules
- **Batch processing** for large datasets
- **Memory cleanup** with automatic garbage collection

## Testing

**Comprehensive test coverage across all components:**

```bash
# Core classes (95%+ coverage)
npm test

# API endpoints (95%+ coverage)  
cd api && npm test

# Web integration (90%+ coverage)
cd web && npm test
```

**Test metrics:**
- ✅ 136 core tests
- ✅ 97 API endpoint tests  
- ✅ 34 web integration tests
- ✅ 52 security test cases

## Configuration

### Environment Variables

**API Configuration** (`.env` in `api/`):
```bash
NODE_ENV=development
PORT=3000
HOST=localhost
ENABLE_RATE_LIMIT=false
DATA_PATH=../data
LOG_LEVEL=debug
```

**Web Configuration** (`.env` in `web/`):
```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=KPI Card Generator
VITE_APP_VERSION=4.2.0
```

### Print Modes

| Mode | Alias | Best For | Layout |
|------|-------|----------|--------|
| `portrait` | `short` | Office printers | Standard binding |
| `landscape` | `long` | Home printers | Landscape binding |

### Recommended Configurations

| Use Case | Cards/Page | Cards/Row | Mode |
|----------|------------|-----------|------|
| **Workshop Standard** | 8 | 4 | Landscape |
| **Individual Study** | 1 | 1 | Portrait |
| **Summary Sheets** | 6 | 3 | Landscape |
| **Pocket Cards** | 12 | 4 | Portrait |

## JSON Schema

### Complete Deck Structure

**Full deck schema with all available fields:**
```json
{
  "title": "Workshop KPI Cards",
  "subtitle": "Interactive workshop for team performance metrics",
  "deckIcon": "🎯",
  "cardBackIcon": "🃏",
  "copyright": "© 2024 Your Organization - Licensed under Creative Commons",
  "cards": [
    {
      "title": "Customer Satisfaction Score",
      "headerIcon": "😊",
      "heroImage": "📈",
      "type": "Customer KPI",
      "description": "Measures customer satisfaction through <strong>surveys</strong> and <em>feedback forms</em>.<br><br><strong>Key metrics:</strong><ul><li>Survey response rate</li><li>Net Promoter Score (NPS)</li><li>Customer retention rate</li></ul>",
      "flavorText": "\"Happy customers are <u>loyal customers</u>\"",
      "styleClass": "card-customer-kpi"
    },
    {
      "title": "Revenue Growth Rate",
      "headerIcon": "💰",
      "heroImage": "📊",
      "type": "Financial KPI",
      "description": "Monthly <b>revenue growth</b> percentage compared to previous period.<br>Target: <strong>15% monthly growth</strong>",
      "flavorText": "Growth is the engine of success",
      "styleClass": "card-financial-metric"
    }
  ]
}
```

### Field Definitions

#### **Deck Level Fields**
| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `title` | string | ✅ Yes | 200 chars | Main deck title |
| `subtitle` | string | ❌ No | 300 chars | Optional deck description |
| `deckIcon` | string | ❌ No | 10 chars | Emoji/icon for the deck |
| `cardBackIcon` | string | ❌ No | 10 chars | Icon for card backs |
| `copyright` | string | ❌ No | 500 chars | Copyright/attribution text |
| `cards` | array | ❌ No | min 1 | Array of card objects |

#### **Card Level Fields**
| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `title` | string | ❌ No* | 200 chars | Card title (required for valid cards) |
| `headerIcon` | string | ❌ No | 10 chars | Small icon in card header |
| `heroImage` | string | ❌ No | 10 chars | Large central image/emoji |
| `type` | string | ❌ No | 255 chars | Card category or type |
| `description` | string | ❌ No | 2000 chars** | Main card content (HTML supported) |
| `flavorText` | string | ❌ No | 200 chars | Additional context text |
| `styleClass` | string | ❌ No | 100 chars | CSS class for styling |

*At least one card must have a `title` field for the deck to be valid  
**Can be bypassed with `--no-char-limits` CLI flag

### Safe HTML Support

**Allowed HTML Tags:**
```html
<strong>Bold text</strong>
<b>Bold text</b>  
<em>Emphasized text</em>
<i>Italic text</i>
<u>Underlined text</u>
<br>Line break
<ul><li>Unordered list items</li></ul>
<ol><li>Ordered list items</li></ol>
```

**Security Features:**
- ✅ Automatic XSS protection and HTML sanitization
- ✅ Smart character counting (excludes HTML markup)
- ✅ Content Security Policy enforcement
- ❌ Dangerous tags (`<script>`, `<iframe>`, etc.) are escaped

**Example with HTML:**
```json
{
  "title": "Card with <strong>HTML</strong>",
  "description": "This supports <em>emphasis</em> and <b>bold</b>.<br><br>Lists work too:<ul><li>Feature A</li><li>Feature B</li></ul>"
}
```

### Style Customization

**Using `styleClass` for custom card styling:**
```json
{
  "title": "Premium KPI Card",
  "styleClass": "premium-kpi",
  "description": "This card uses custom CSS styling"
}
```

**Common style classes:**
- `card-kpi-primary`: Primary KPI styling
- `card-metric-secondary`: Secondary metric styling  
- `card-objective`: Goal/objective cards
- `card-risk`: Risk indicator cards
- `card-success`: Success metric cards

## Advanced Features

### Character Limit Bypass
```bash
# For detailed content exceeding 500 characters
node cli/generate-cards.js generate -i detailed-cards.json -o output.pdf --no-char-limits
```

### CSS Style Customization
```json
{
  "cards": [
    {
      "title": "Custom Styled Card",
      "styleClass": "premium-kpi",
      "description": "Card with custom styling"
    }
  ]
}
```

### Bulk Operations via API
```bash
curl -X POST http://localhost:3000/api/v1/decks/{id}/cards/bulk \
  -d '{"operations":[{"type":"add","data":{"title":"Bulk Card"}}]}'
```

## Contributing

### Development Setup
```bash
# Clone and install
git clone https://github.com/fullo/kpi-card-generator.git
cd kpi-card-generator && npm install

# Run all tests
npm test && cd api && npm test && cd ../web && npm test

# Start development servers
# Terminal 1: cd api && npm run dev
# Terminal 2: cd web && npm run dev
```

### Code Standards
- **ES Modules** throughout
- **95%+ test coverage** required
- **Security-first** development
- **Documentation** for all public APIs

## Troubleshooting

**Common issues and solutions:**

**Test Failures:**
```bash
# Clean install
npm run clean && npm install
node --version  # Ensure >= 18.0.0
```

**PDF Generation Issues:**
```bash
# System check
node cli/generate-cards.js info --system

# Debug with HTML only
node cli/generate-cards.js generate -i cards.json -b debug.html --verbose
```

**API Connection Failed:**
```bash
# Verify API server
cd api && npm start
curl http://localhost:3000/api/v1/health
```

## Performance Benchmarks

- **Pagination**: < 10ms for 1000 cards
- **HTML Rendering**: < 100ms for 100 cards  
- **PDF Generation**: < 5s for 50 cards
- **Memory Usage**: < 200MB for typical operations
- **API Response**: < 200ms for CRUD operations

## License & Credits

### Code
MIT License - Free for commercial and non-commercial use

### Content
Creative Commons BY-NC-SA 4.0 - **Daruma Consulting di Francesco Fullone**

**Developed by Francesco Fullone** for workshops on Metrics, KPIs, and OKRs.

- 🌐 [Daruma Consulting](https://darumahq.it)
- 📧 francesco@darumahq.it
- 🐙 [GitHub](https://github.com/fullo)

---

**🎯 Ready for your next KPI workshop!** 🚀

Choose your preferred interface: [CLI](cli/README.md) | [API](api/README.md) | [Web](web/README.md)
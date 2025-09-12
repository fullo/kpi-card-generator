# 🌐 API REST - KPI Card Generator

## 📋 Panoramica del Progetto

### 🎯 Obiettivo
Creare un'API REST che esponga le funzionalità del KPI Card Generator attraverso endpoint HTTP, riutilizzando completamente le classi già implementate seguendo il principio DRY.

### 🏗️ Architettura Target
```
api/
├── 📁 server/                   # Server Express.js
│   ├── app.js                   # Configurazione Express principale
│   ├── server.js                # Entry point con clustering
│   └── config/                  # Configurazioni ambiente
├── 📁 routes/                   # Endpoint REST organizzati
│   ├── index.js                 # Route aggregation
│   ├── decks.js                 # CRUD mazzi di carte
│   ├── cards.js                 # Gestione singole carte
│   ├── validation.js            # Endpoint validazione
│   ├── generation.js            # Export PDF/HTML
│   └── templates.js             # Gestione template
├── 📁 middleware/               # Middleware Express
│   ├── errorHandler.js          # Error handling centralizzato
│   ├── validation.js            # Request validation
│   ├── rateLimit.js             # Rate limiting
│   └── logging.js               # Request logging
├── 📁 controllers/              # Business logic
│   ├── DeckController.js        # Controller mazzi
│   ├── CardController.js        # Controller carte
│   ├── ValidationController.js  # Controller validazione
│   └── GenerationController.js  # Controller export
└── 📁 services/                 # Wrapper delle classi esistenti
    ├── DeckService.js           # Usa DeckValidator + CardPaginator
    ├── RenderService.js         # Usa CardRenderer
    ├── PDFService.js            # Usa PDFGenerator
    └── LayoutService.js         # Usa LayoutCalculator
```

## 🔌 Endpoint API Design

### 📚 Base URL
```
http://localhost:3000/api/v1
```

### 🗂️ Endpoint Overview

| Gruppo | Endpoint | Metodo | Descrizione |
|--------|----------|--------|-------------|
| **Decks** | `/decks` | GET | Lista tutti i mazzi |
| | `/decks` | POST | Crea nuovo mazzo |
| | `/decks/:id` | GET | Dettagli mazzo specifico |
| | `/decks/:id` | PUT | Aggiorna mazzo completo |
| | `/decks/:id` | PATCH | Aggiorna parziale mazzo |
| | `/decks/:id` | DELETE | Elimina mazzo |
| **Cards** | `/decks/:id/cards` | GET | Liste carte del mazzo |
| | `/decks/:id/cards` | POST | Aggiungi carta al mazzo |
| | `/decks/:id/cards/:cardId` | PUT | Aggiorna carta |
| | `/decks/:id/cards/:cardId` | DELETE | Elimina carta |
| **Validation** | `/validation/deck` | POST | Valida struttura mazzo |
| | `/validation/card` | POST | Valida singola carta |
| **Generation** | `/decks/:id/export/pdf` | POST | Esporta mazzo in PDF |
| | `/decks/:id/export/html` | POST | Esporta mazzo in HTML |
| | `/decks/:id/preview` | GET | Anteprima HTML del mazzo |
| **Templates** | `/templates` | GET | Lista template disponibili |
| | `/templates/:name` | GET | Dettagli template specifico |

## 📖 Dettaglio Endpoint

### 🗂️ Mazzi (Decks)

#### `GET /api/v1/decks`
Lista tutti i mazzi disponibili con metadata.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "deck_001",
      "titolo": "Workshop KPI Marketing",
      "sottotitolo": "Metriche per team marketing",
      "cardCount": 12,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

#### `POST /api/v1/decks`
Crea un nuovo mazzo di carte.

**Request Body:**
```json
{
  "titolo": "Nuovo Mazzo KPI",
  "sottotitolo": "Descrizione del mazzo",
  "icona_esercizio": "🎯",
  "carte": []
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "deck_002",
    "titolo": "Nuovo Mazzo KPI",
    "sottotitolo": "Descrizione del mazzo",
    "icona_esercizio": "🎯",
    "carte": [],
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": []
    },
    "createdAt": "2024-01-17T09:15:00Z"
  }
}
```

#### `GET /api/v1/decks/:id`
Recupera dettagli completi di un mazzo specifico.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "deck_001",
    "titolo": "Workshop KPI Marketing",
    "sottotitolo": "Metriche per team marketing",
    "icona_esercizio": "📊",
    "carte": [
      {
        "id": "card_001",
        "titolo": "Conversion Rate",
        "icona": "🎯",
        "emoji": "📈",
        "tipo": "KPI",
        "testo": "Percentuale di visitatori che completano l'azione desiderata",
        "flavor": "Il santo graal del marketing digitale",
        "classe": "card-kpi"
      }
    ],
    "stats": {
      "cardCount": 12,
      "estimatedPages": 2,
      "categories": ["KPI", "Vanity Metrics", "Obiettivi"]
    },
    "validation": {
      "isValid": true,
      "lastValidated": "2024-01-17T09:15:00Z"
    }
  }
}
```

### 🃏 Carte (Cards)

#### `POST /api/v1/decks/:id/cards`
Aggiunge una nuova carta al mazzo.

**Request Body:**
```json
{
  "titolo": "Customer Lifetime Value",
  "icona": "💰",
  "emoji": "📊", 
  "tipo": "KPI",
  "testo": "Valore totale che un cliente porta all'azienda durante tutta la relazione",
  "flavor": "Non tutti i clienti sono uguali",
  "classe": "card-kpi"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "card_013",
    "titolo": "Customer Lifetime Value",
    "icona": "💰",
    "emoji": "📊",
    "tipo": "KPI", 
    "testo": "Valore totale che un cliente porta all'azienda durante tutta la relazione",
    "flavor": "Non tutti i clienti sono uguali",
    "classe": "card-kpi",
    "position": 13,
    "validation": {
      "isValid": true,
      "errors": []
    }
  }
}
```

### ✅ Validazione

#### `POST /api/v1/validation/deck`
Valida un intero mazzo senza salvarlo.

**Request Body:**
```json
{
  "titolo": "Test Mazzo",
  "carte": [
    {
      "titolo": "Test Card",
      "tipo": "KPI"
    }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "errors": [
      {
        "field": "carte[0].testo",
        "message": "Il campo 'testo' è obbligatorio per ogni carta",
        "code": "REQUIRED_FIELD"
      }
    ],
    "warnings": [
      {
        "field": "carte[0].flavor",
        "message": "Il campo 'flavor' migliora l'esperienza utente",
        "code": "RECOMMENDED_FIELD"
      }
    ],
    "stats": {
      "totalCards": 1,
      "validCards": 0,
      "estimatedPages": 1
    }
  }
}
```

### 📄 Export e Generazione

#### `POST /api/v1/decks/:id/export/pdf`
Genera ed esporta il mazzo in formato PDF.

**Request Body:**
```json
{
  "options": {
    "printMode": "landscape",
    "cardsPerPage": 8,
    "cardsPerRow": 4,
    "template": "default",
    "margins": {
      "top": "0.5cm",
      "bottom": "0.5cm", 
      "left": "0.5cm",
      "right": "0.5cm"
    }
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/api/v1/downloads/deck_001_20240117.pdf",
    "filename": "workshop_kpi_marketing.pdf",
    "size": 2048576,
    "pages": 2,
    "generatedAt": "2024-01-17T10:30:00Z",
    "expiresAt": "2024-01-17T22:30:00Z"
  }
}
```

#### `GET /api/v1/decks/:id/preview`
Genera anteprima HTML del mazzo per preview nel browser.

**Query Parameters:**
- `printMode`: landscape|portrait (default: landscape)
- `template`: nome template da utilizzare (default: default)

**Response 200:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Preview: Workshop KPI Marketing</title>
    <!-- CSS e stili iniettati -->
</head>
<body>
    <!-- HTML delle carte renderizzate -->
</body>
</html>
```

## 🔧 Utilizzo delle Classi Esistenti

### 📝 Mapping Classi → Servizi API

```javascript
// services/DeckService.js
import { DeckValidator } from '../../../class/DeckValidator.js';
import { CardPaginator } from '../../../class/CardPaginator.js';

export class DeckService {
    constructor() {
        this.validator = new DeckValidator();
        this.paginator = new CardPaginator();
    }
    
    async validateDeck(deckData) {
        return this.validator.validateDeck(deckData);
    }
    
    async paginateDeck(deckData, options) {
        const validation = await this.validateDeck(deckData);
        if (!validation.isValid) {
            throw new ValidationError(validation.errors);
        }
        
        return this.paginator.paginateCards(
            deckData.carte, 
            options.cardsPerPage, 
            options.cardsPerRow
        );
    }
}
```

```javascript
// services/RenderService.js  
import { CardRenderer } from '../../../class/CardRenderer.js';
import { LayoutCalculator } from '../../../class/LayoutCalculator.js';

export class RenderService {
    constructor() {
        this.renderer = new CardRenderer();
        this.layoutCalc = new LayoutCalculator();
    }
    
    async renderDeckHTML(paginatedData, deckData, options) {
        // Calcola layout speculari per ogni pagina
        const layouts = paginatedData.map(page => ({
            ...page,
            backs: this.layoutCalc.calculateMirrorLayout(
                page.cards, 
                options.cardsPerRow, 
                options.printMode
            )
        }));
        
        // Renderizza HTML finale
        return await this.renderer.renderCards(layouts, deckData, options);
    }
}
```

```javascript
// services/PDFService.js
import { PDFGenerator } from '../../../class/PDFGenerator.js';

export class PDFService {
    constructor() {
        this.pdfGen = new PDFGenerator({
            timeout: 30000,
            memoryLimit: 512
        });
    }
    
    async generatePDF(htmlContent, options) {
        const result = await this.pdfGen.generatePDF(htmlContent, null, {
            landscape: options.printMode === 'landscape',
            format: 'A4',
            margins: options.margins,
            printBackground: true
        });
        
        return {
            buffer: result.buffer,
            size: result.size,
            pages: result.pages,
            duration: result.duration
        };
    }
}
```

### 🎮 Controller Integration

```javascript
// controllers/GenerationController.js
export class GenerationController {
    constructor() {
        this.deckService = new DeckService();
        this.renderService = new RenderService();
        this.pdfService = new PDFService();
    }
    
    async exportPDF(req, res) {
        try {
            const { id } = req.params;
            const options = req.body.options || {};
            
            // 1. Recupera e valida il mazzo
            const deck = await this.getDeck(id);
            const validation = await this.deckService.validateDeck(deck);
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Mazzo non valido',
                    details: validation.errors
                });
            }
            
            // 2. Paginazione usando CardPaginator
            const paginatedData = await this.deckService.paginateDeck(deck, options);
            
            // 3. Rendering HTML usando CardRenderer + LayoutCalculator
            const html = await this.renderService.renderDeckHTML(paginatedData, deck, options);
            
            // 4. Generazione PDF usando PDFGenerator
            const pdfResult = await this.pdfService.generatePDF(html, options);
            
            // 5. Salva temporaneamente e restituisci download URL
            const downloadInfo = await this.saveTemporaryFile(pdfResult, deck, options);
            
            res.json({
                success: true,
                data: downloadInfo
            });
            
        } catch (error) {
            next(error);
        }
    }
}
```

## 🛠️ Stack Tecnologico

### 🏗️ Framework e Librerie
- **Express.js** - Web framework per Node.js
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging
- **Express-rate-limit** - Rate limiting
- **Joi** - Request validation
- **Multer** - File upload handling
- **Node-cron** - Cleanup task scheduling

### 📁 Persistence Layer
```javascript
// Per ora: File system con JSON
// Futuro: Database (MongoDB, PostgreSQL)

// storage/FileStore.js
export class FileStore {
    constructor(basePath = './data') {
        this.basePath = basePath;
    }
    
    async saveDeck(deck) {
        const filename = `${this.basePath}/decks/${deck.id}.json`;
        await fs.writeFile(filename, JSON.stringify(deck, null, 2));
        return deck;
    }
    
    async getDeck(id) {
        const filename = `${this.basePath}/decks/${id}.json`;
        const content = await fs.readFile(filename, 'utf-8');
        return JSON.parse(content);
    }
}
```

### 🔒 Security & Error Handling
```javascript
// middleware/errorHandler.js
export const errorHandler = (error, req, res, next) => {
    // Log error per debugging
    console.error('API Error:', error);
    
    // Errori di validazione
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Dati non validi',
            details: error.details
        });
    }
    
    // Errori delle classi esistenti
    if (error.name === 'PDFGenerationError') {
        return res.status(500).json({
            success: false,
            error: 'Errore nella generazione PDF',
            message: error.message
        });
    }
    
    // Errore generico
    res.status(500).json({
        success: false,
        error: 'Errore interno del server',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Si è verificato un errore'
    });
};
```

## 📋 Piano di Implementazione Iterativo

### 🎯 Iterazione 1: API Foundation (2-3 giorni)
**Obiettivo**: Server Express base con endpoint CRUD mazzi

**Deliverables:**
- [ ] Server Express configurato con middleware base
- [ ] Endpoint `GET|POST|PUT|DELETE /decks`
- [ ] Integrazione `DeckValidator` per validazione
- [ ] FileStore per persistence JSON
- [ ] Error handling centralizzato
- [ ] Test API con Postman/Insomnia

**File da creare:**
```
api/
├── server/app.js
├── routes/decks.js  
├── controllers/DeckController.js
├── services/DeckService.js
├── middleware/errorHandler.js
└── storage/FileStore.js
```

### 🎯 Iterazione 2: Card Management (1-2 giorni)
**Obiettivo**: Gestione CRUD delle singole carte

**Deliverables:**
- [ ] Endpoint `/decks/:id/cards` completi
- [ ] Validazione singole carte
- [ ] Reorder carte nel mazzo
- [ ] Bulk operations (aggiungi multiple carte)

### 🎯 Iterazione 3: Export & Generation (2-3 giorni)  
**Obiettivo**: Export PDF e HTML preview

**Deliverables:**
- [ ] Endpoint `/decks/:id/export/pdf`
- [ ] Endpoint `/decks/:id/preview` 
- [ ] Integrazione completa di tutte le classi esistenti
- [ ] File temporanei con cleanup automatico
- [ ] Progress tracking per operazioni lunghe

### 🎯 Iterazione 4: Advanced Features (1-2 giorni)
**Obiettivo**: Funzionalità avanzate e ottimizzazioni

**Deliverables:**
- [ ] Template management endpoints
- [ ] Batch export multipli mazzi
- [ ] Rate limiting e security
- [ ] API documentation (Swagger)
- [ ] Performance monitoring

## 🧪 Testing Strategy

### 📋 Test Suite per API
```javascript
// tests/api/decks.test.js
describe('Decks API', () => {
    test('GET /decks should return empty array initially', async () => {
        const response = await request(app).get('/api/v1/decks');
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
    
    test('POST /decks should create valid deck', async () => {
        const newDeck = {
            titolo: 'Test Deck',
            carte: []
        };
        
        const response = await request(app)
            .post('/api/v1/decks')
            .send(newDeck);
            
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.titolo).toBe('Test Deck');
    });
    
    test('POST /decks should reject invalid deck', async () => {
        const invalidDeck = { /* missing required fields */ };
        
        const response = await request(app)
            .post('/api/v1/decks') 
            .send(invalidDeck);
            
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});
```

## 📊 Metriche di Successo

### 🎯 Performance Targets
- [ ] **Response Time**: < 200ms per CRUD operations
- [ ] **PDF Generation**: < 5s per 50 carte
- [ ] **Memory Usage**: < 512MB per richiesta
- [ ] **Concurrent Users**: 50+ simultanei senza degrado

### ✅ Quality Gates
- [ ] **Test Coverage**: ≥ 80% su controllers e services
- [ ] **API Documentation**: 100% endpoint documentati
- [ ] **Error Handling**: Tutti error case gestiti gracefully
- [ ] **Validation**: Input validation completa su tutti endpoint

## 🚀 Setup e Deployment

### 📦 Inizializzazione Progetto

#### Setup Base
```bash
# 1. Crea struttura progetto
mkdir kpi-cards-api
cd kpi-cards-api

# 2. Inizializza package.json
npm init -y

# 3. Installa dipendenze produzione
npm install express helmet cors morgan joi express-rate-limit swagger-ui-express yamljs node-cron

# 4. Installa dipendenze development
npm install --save-dev jest supertest nodemon dotenv eslint prettier

# 5. Crea struttura directory
mkdir -p {api/server,api/routes,api/controllers,api/services,api/middleware,api/storage}
mkdir -p {docs,tests,postman/environments,data/{decks,templates,exports}}

# 6. Setup files di configurazione
touch {Dockerfile,docker-compose.yml,.env.development,.env.production}
touch {docs/swagger.yaml,postman/KPI-Cards-API.json}
```

#### Package.json Scripts
```json
{
  "name": "kpi-cards-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node api/server/server.js",
    "dev": "nodemon api/server/server.js",
    "test": "NODE_ENV=test jest",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:coverage": "NODE_ENV=test jest --coverage",
    "lint": "eslint api/ tests/",
    "lint:fix": "eslint api/ tests/ --fix",
    "format": "prettier --write api/ tests/",
    "docker:build": "docker build -t kpi-cards-api .",
    "docker:run": "docker-compose up -d",
    "docker:stop": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "cleanup": "node scripts/cleanup-expired-files.js",
    "docs:serve": "swagger-ui-serve docs/swagger.yaml"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 🔧 Development Workflow

#### Ambiente di Sviluppo
```bash
# 1. Clone del progetto con classi esistenti
git clone <repository-url>
cd kpi-cards-api

# 2. Setup symlink alle classi esistenti (DRY principle)
ln -s ../kpi-card-generator/class ./class

# 3. Install e setup
npm install
cp .env.development .env

# 4. Avvio ambiente development
npm run dev

# 5. Test API
curl http://localhost:3000/api/v1/health

# 6. Accesso Swagger UI
open http://localhost:3000/api-docs
```

#### Docker Development
```bash
# Sviluppo con Docker (hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Logs in tempo reale
docker-compose logs -f kpi-cards-api

# Restart singolo servizio
docker-compose restart kpi-cards-api

# Cleanup completo
docker-compose down -v
docker system prune -f
```

### 🧪 Testing Strategy

#### Test Commands
```bash
# Test unitari API
npm test

# Test con coverage
npm run test:coverage

# Test watch mode per development
npm run test:watch

# Test integrazione con Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Test performance con artillery
npx artillery quick --count 10 --num 20 http://localhost:3000/api/v1/decks

# Test Postman collection
newman run postman/KPI-Cards-API.json -e postman/environments/development.json
```

#### Continuous Integration
```yaml
# .github/workflows/api-test.yml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - name: Test Docker build
        run: docker build -t test-api .
```

### 🌐 Production Deployment

#### Production Setup
```bash
# 1. Build production image
docker build -t kpi-cards-api:latest .

# 2. Deploy con Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Health check
curl -f http://localhost:3000/api/v1/health

# 4. Setup backup automatico
crontab -e
# Aggiungi: 0 2 * * * /usr/local/bin/backup-data.sh

# 5. Setup monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

#### Monitoring e Logging
```javascript
// Setup per produzione in app.js
if (process.env.NODE_ENV === 'production') {
    // Winston logging
    app.use(winston.logger);
    
    // Prometheus metrics
    app.use('/metrics', prometheus.register.metrics());
    
    // Health checks
    app.get('/health', healthCheck);
    app.get('/ready', readinessCheck);
}
```

### 📚 Documentazione API

#### Generazione Documentazione
```bash
# Swagger UI locale
npm run docs:serve

# Generazione documentazione statica
swagger-codegen generate -i docs/swagger.yaml -l html2 -o docs/html

# Export Postman documentation
postman collection export KPI-Cards-API.json --format json

# Generazione client SDK
swagger-codegen generate -i docs/swagger.yaml -l javascript -o sdk/javascript
```

#### Hosting Documentazione
```yaml
# docs/docker-compose.yml - Hosting documentazione
version: '3.8'
services:
  docs:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    environment:
      - NGINX_PORT=80
```

## ✅ Ready for Implementation

Il documento tecnico è ora **completo e production-ready** con:

### 🎯 **Ambiente Completo**
- ✅ **Docker** per containerizzazione e sviluppo standardizzato
- ✅ **Swagger/OpenAPI** per documentazione interattiva completa
- ✅ **Postman Collection** per test manuali e automation
- ✅ **File-based Storage** dettagliato con cleanup automatico
- ✅ **CI/CD** pipeline per testing automatico

### 📋 **Implementazione Strutturata**  
- ✅ **Iterazione 1** dettagliata e pronta per iniziare
- ✅ **Quality Gates** specifici per ogni milestone
- ✅ **Testing Strategy** comprehensive
- ✅ **Performance Targets** chiari e misurabili

### 🔄 **DRY Principle Rispettato**
- ✅ Riutilizzo completo delle 6 classi esistenti
- ✅ Service layer che wrappa senza duplicare logica
- ✅ Symlink per evitare copia codice esistente

**Prossimo Step**: Iniziare implementazione Iterazione 1 con setup del server Express base e primi endpoint CRUD mazzi! 🚀

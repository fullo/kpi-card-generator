# 🔒 Security Hardening - KPI Card Generator

## 📋 Panoramica del Progetto

### 🎯 Obiettivo
Implementare una security validation completa per prevenire vulnerabilità XSS, injection attacks, e altre minacce di sicurezza nell'applicazione web e API REST del KPI Card Generator, garantendo la sicurezza dei dati utente e l'integrità del sistema.

### 🚨 Security Assessment Attuale

#### ⚠️ Vulnerabilità Identificate

##### **1. Cross-Site Scripting (XSS)**
```javascript
// VULNERABILE: Rendering diretto senza sanitizzazione
// In CardRenderer.js
replace(placeholder, value) {
    return template.replace(new RegExp(placeholder, 'g'), value); // ❌ NO SANITIZATION
}

// In Vue components  
<div v-html="card.testo"></div> // ❌ DANGEROUS: Raw HTML injection
```

##### **2. Input Validation Insufficiente**
```javascript
// API: Manca validazione approfondita
POST /api/v1/decks
{
    "titolo": "<script>alert('XSS')</script>", // ❌ Script injection
    "carte": [{
        "testo": "javascript:alert('XSS')" // ❌ JavaScript URI injection
    }]
}
```

##### **3. File Upload Security**
```javascript
// Web: File upload senza validazione tipo/dimensione
const fileInput = document.getElementById('upload');
// ❌ Nessun controllo su: tipo file, dimensione, contenuto
```

##### **4. CORS e Headers Security**
```javascript
// API: CORS troppo permissivo
app.use(cors({
    origin: '*' // ❌ Accetta richieste da qualsiasi dominio
}));
```

##### **5. Error Information Disclosure**
```javascript
// API: Stack trace esposti in produzione
res.status(500).json({
    error: error.message,
    stack: error.stack // ❌ Information disclosure
});
```

## 🛡️ Security Implementation Strategy

### 🔐 Phase 1: Input Sanitization & XSS Prevention

#### **HTML Sanitization Library**
```bash
# Installazione DOMPurify per sanitizzazione client-side
npm install dompurify
npm install --save-dev @types/dompurify

# Sanitizzazione server-side con validator.js
npm install validator xss
npm install sanitize-html
```

#### **Sanitization Service**
```javascript
// services/SanitizationService.js
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';
import xss from 'xss';

export class SanitizationService {
    constructor() {
        // Setup DOM per server-side DOMPurify
        const window = new JSDOM('').window;
        this.DOMPurify = DOMPurify(window);
        
        // Configurazione whitelist XSS
        this.xssOptions = {
            whiteList: {
                strong: [],
                em: [],
                u: [],
                br: [],
                p: [],
                span: ['class']
            },
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script', 'style']
        };
    }
    
    /**
     * Sanitizza HTML rimuovendo script e tag pericolosi
     */
    sanitizeHTML(input) {
        if (typeof input !== 'string') return '';
        
        // Prima sanitizzazione con XSS
        const xssCleaned = xss(input, this.xssOptions);
        
        // Seconda sanitizzazione con DOMPurify
        return this.DOMPurify.sanitize(xssCleaned, {
            ALLOWED_TAGS: ['strong', 'em', 'u', 'br', 'p', 'span'],
            ALLOWED_ATTR: ['class'],
            FORBID_SCRIPT: true,
            FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'img'],
            FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
        });
    }
    
    /**
     * Sanitizza testo per uso in attributi
     */
    sanitizeAttribute(input) {
        if (typeof input !== 'string') return '';
        return validator.escape(input);
    }
    
    /**
     * Valida e sanitizza URL
     */
    sanitizeURL(input) {
        if (typeof input !== 'string') return '';
        
        // Blocca javascript: e data: URIs
        if (/^(javascript|data|vbscript):/i.test(input)) {
            return '';
        }
        
        return validator.isURL(input) ? validator.escape(input) : '';
    }
    
    /**
     * Sanitizza file names
     */
    sanitizeFileName(input) {
        if (typeof input !== 'string') return '';
        
        // Rimuove caratteri pericolosi e path traversal
        return input
            .replace(/[^a-zA-Z0-9.-_]/g, '')
            .replace(/\.\./g, '')
            .replace(/^\.+/, '')
            .substring(0, 255);
    }
    
    /**
     * Valida e sanitizza dati di una carta
     */
    sanitizeCard(card) {
        if (!card || typeof card !== 'object') {
            throw new Error('Invalid card data');
        }
        
        return {
            titolo: this.sanitizeHTML(card.titolo || '').substring(0, 100),
            icona: this.sanitizeAttribute(card.icona || '').substring(0, 10),
            emoji: this.sanitizeAttribute(card.emoji || '').substring(0, 10),
            tipo: this.sanitizeAttribute(card.tipo || '').substring(0, 50),
            testo: this.sanitizeHTML(card.testo || '').substring(0, 500),
            flavor: this.sanitizeHTML(card.flavor || '').substring(0, 200),
            classe: this.sanitizeAttribute(card.classe || '').substring(0, 50)
        };
    }
    
    /**
     * Valida e sanitizza dati di un mazzo
     */
    sanitizeDeck(deck) {
        if (!deck || typeof deck !== 'object') {
            throw new Error('Invalid deck data');
        }
        
        const sanitized = {
            titolo: this.sanitizeHTML(deck.titolo || '').substring(0, 100),
            sottotitolo: this.sanitizeHTML(deck.sottotitolo || '').substring(0, 200),
            icona_esercizio: this.sanitizeAttribute(deck.icona_esercizio || '').substring(0, 10),
            carte: []
        };
        
        // Sanitizza ogni carta
        if (Array.isArray(deck.carte)) {
            sanitized.carte = deck.carte
                .slice(0, 100) // Max 100 carte per mazzo
                .map(card => this.sanitizeCard(card));
        }
        
        return sanitized;
    }
}
```

#### **Updated CardRenderer with Security**
```javascript
// class/CardRenderer.js - Security enhanced
import { SanitizationService } from '../services/SanitizationService.js';

export class CardRenderer {
    constructor(templatePath, options = {}) {
        this.templatePath = templatePath;
        this.sanitizer = new SanitizationService();
        this.options = {
            strict: true,
            debugMode: false,
            allowHTML: false, // ❌ Default: no HTML allowed
            ...options
        };
    }
    
    /**
     * Replacement con sanitizzazione automatica
     */
    replace(template, placeholder, value, context = 'html') {
        if (typeof value !== 'string') {
            value = String(value || '');
        }
        
        // Sanitizzazione basata sul context
        let sanitizedValue;
        switch (context) {
            case 'html':
                sanitizedValue = this.sanitizer.sanitizeHTML(value);
                break;
            case 'attribute':
                sanitizedValue = this.sanitizer.sanitizeAttribute(value);
                break;
            case 'url':
                sanitizedValue = this.sanitizer.sanitizeURL(value);
                break;
            default:
                sanitizedValue = this.sanitizer.sanitizeHTML(value);
        }
        
        // Log in debug mode
        if (this.options.debugMode && value !== sanitizedValue) {
            console.warn(`🔒 Sanitized: "${value}" → "${sanitizedValue}"`);
        }
        
        return template.replace(
            new RegExp(placeholder, 'g'), 
            sanitizedValue
        );
    }
    
    /**
     * Render carta con security
     */
    renderCard(card, type = 'front') {
        // Pre-sanitizza l'intera carta
        const sanitizedCard = this.sanitizer.sanitizeCard(card);
        
        // Rendering normale con dati sanitizzati
        return super.renderCard(sanitizedCard, type);
    }
}
```

### 🔐 Phase 2: API Security Hardening

#### **Enhanced Input Validation Middleware**
```javascript
// middleware/securityValidation.js
import Joi from 'joi';
import { SanitizationService } from '../services/SanitizationService.js';

const sanitizer = new SanitizationService();

// Schema validation con security checks
const cardSchema = Joi.object({
    titolo: Joi.string()
        .min(1).max(100)
        .pattern(/^[^<>{}]*$/) // No HTML brackets
        .required()
        .messages({
            'string.pattern.base': 'Title contains invalid characters'
        }),
    
    icona: Joi.string()
        .max(10)
        .pattern(/^[\p{Emoji}\p{Symbol}]*$/u) // Only emoji/symbols
        .allow(''),
        
    emoji: Joi.string()
        .max(10)
        .pattern(/^[\p{Emoji}]*$/u) // Only emoji
        .allow(''),
        
    tipo: Joi.string()
        .max(50)
        .valid('KPI', 'Vanity Metric', 'Obiettivo', 'Conflitto')
        .required(),
        
    testo: Joi.string()
        .min(1).max(500)
        .required(),
        
    flavor: Joi.string()
        .max(200)
        .allow(''),
        
    classe: Joi.string()
        .max(50)
        .pattern(/^[a-zA-Z0-9_-]*$/) // CSS class naming
        .allow('')
});

const deckSchema = Joi.object({
    titolo: Joi.string()
        .min(1).max(100)
        .required(),
        
    sottotitolo: Joi.string()
        .max(200)
        .allow(''),
        
    icona_esercizio: Joi.string()
        .max(10)
        .pattern(/^[\p{Emoji}\p{Symbol}]*$/u)
        .allow(''),
        
    carte: Joi.array()
        .items(cardSchema)
        .max(100) // Max 100 carte per mazzo
        .required()
});

export const validateAndSanitizeDeck = (req, res, next) => {
    try {
        // 1. Schema validation
        const { error, value } = deckSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }
        
        // 2. Deep sanitization
        req.body = sanitizer.sanitizeDeck(value);
        
        // 3. Additional security checks
        if (containsSuspiciousPatterns(req.body)) {
            return res.status(400).json({
                success: false,
                error: 'Security validation failed',
                message: 'Content contains potentially malicious patterns'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Security validation error'
        });
    }
};

function containsSuspiciousPatterns(data) {
    const suspiciousPatterns = [
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
        /<script/i,
        /on\w+\s*=/i,
        /expression\s*\(/i,
        /import\s*\(/i,
        /eval\s*\(/i
    ];
    
    const jsonString = JSON.stringify(data);
    return suspiciousPatterns.some(pattern => pattern.test(jsonString));
}
```

#### **Secure CORS and Headers**
```javascript
// middleware/securityHeaders.js
import helmet from 'helmet';

export const securityHeaders = [
    helmet({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Solo per debugging
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'none'"],
                frameSrc: ["'none'"]
            },
        },
        // HSTS
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        // Altri headers di sicurezza
        noSniff: true,
        frameguard: { action: 'deny' },
        xssFilter: true,
        referrerPolicy: { policy: 'same-origin' }
    })
];

export const corsConfig = {
    origin: (origin, callback) => {
        // Lista domini autorizzati
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        // Permetti richieste senza origin (es. Postman) in development
        if (!origin && process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 ore
};
```

#### **Secure File Upload**
```javascript
// middleware/fileUpload.js
import multer from 'multer';
import path from 'path';
import { createHash } from 'crypto';

const ALLOWED_MIME_TYPES = [
    'application/json',
    'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        // Nome file sicuro con hash
        const hash = createHash('md5').update(Date.now().toString()).digest('hex');
        const ext = path.extname(file.originalname);
        cb(null, `upload_${hash}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Validazione MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('File type not allowed'), false);
    }
    
    // Validazione estensione
    const allowedExts = ['.json', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
        return cb(new Error('File extension not allowed'), false);
    }
    
    // Validazione nome file
    if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
        return cb(new Error('Invalid file name'), false);
    }
    
    cb(null, true);
};

export const secureFileUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 5
    }
}).single('deckFile');

export const validateUploadedJSON = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded'
        });
    }
    
    try {
        // Leggi e valida JSON
        const fileContent = require('fs').readFileSync(req.file.path, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
        // Validazione struttura base
        if (!jsonData.titolo || !Array.isArray(jsonData.carte)) {
            throw new Error('Invalid deck structure');
        }
        
        // Controllo dimensioni ragionevoli
        if (jsonData.carte.length > 100) {
            throw new Error('Too many cards in deck');
        }
        
        req.uploadedDeck = jsonData;
        next();
    } catch (error) {
        // Cleanup file su errore
        require('fs').unlinkSync(req.file.path);
        
        res.status(400).json({
            success: false,
            error: 'Invalid JSON file',
            details: error.message
        });
    }
};
```

### 🔐 Phase 3: Frontend Security Hardening

#### **Vue.js Security Configuration**
```javascript
// composables/useSecurity.js
import DOMPurify from 'dompurify';

export function useSecurity() {
    /**
     * Sanitizza HTML per v-html sicuro
     */
    const sanitizeHTML = (input) => {
        if (typeof input !== 'string') return '';
        
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: ['strong', 'em', 'u', 'br', 'p'],
            ALLOWED_ATTR: [],
            FORBID_SCRIPT: true,
            FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style']
        });
    };
    
    /**
     * Valida input utente in real-time
     */
    const validateInput = (value, type = 'text') => {
        if (typeof value !== 'string') return false;
        
        switch (type) {
            case 'title':
                return /^[^<>{}]{1,100}$/.test(value);
            case 'text':
                return value.length <= 500;
            case 'emoji':
                return /^[\p{Emoji}]*$/u.test(value) && value.length <= 10;
            case 'css-class':
                return /^[a-zA-Z0-9_-]*$/.test(value);
            default:
                return true;
        }
    };
    
    /**
     * Controlla contenuto sospetto
     */
    const isSuspicious = (content) => {
        const suspiciousPatterns = [
            /javascript:/i,
            /data:text\/html/i,
            /<script/i,
            /on\w+\s*=/i
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(content));
    };
    
    return {
        sanitizeHTML,
        validateInput,
        isSuspicious
    };
}
```

#### **Secure Vue Components**
```vue
<!-- components/cards/SecureCardEditor.vue -->
<template>
  <div class="card-editor">
    <form @submit.prevent="handleSubmit">
      <!-- Titolo con validazione -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">
          Titolo
        </label>
        <input
          v-model="form.titolo"
          type="text"
          maxlength="100"
          class="mt-1 block w-full rounded-md border-gray-300"
          :class="{
            'border-red-500': !isValidTitle,
            'border-green-500': isValidTitle && form.titolo
          }"
          @input="validateTitle"
          @paste="handlePaste"
        >
        <p v-if="!isValidTitle" class="mt-1 text-sm text-red-600">
          Titolo non valido (no HTML, max 100 caratteri)
        </p>
      </div>
      
      <!-- Testo con sanitizzazione -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">
          Descrizione
        </label>
        <textarea
          v-model="form.testo"
          maxlength="500"
          rows="4"
          class="mt-1 block w-full rounded-md border-gray-300"
          :class="{
            'border-red-500': !isValidText,
            'border-green-500': isValidText && form.testo
          }"
          @input="validateText"
          @paste="handlePaste"
        />
        <p v-if="!isValidText" class="mt-1 text-sm text-red-600">
          Testo contiene contenuti non sicuri
        </p>
        <p class="mt-1 text-sm text-gray-500">
          {{ form.testo.length }}/500 caratteri
        </p>
      </div>
      
      <!-- Preview sicuro -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">
          Anteprima
        </label>
        <div 
          class="p-4 border rounded-md bg-gray-50"
          v-html="sanitizedPreview"
        />
      </div>
      
      <button
        type="submit"
        :disabled="!isFormValid || isSubmitting"
        class="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {{ isSubmitting ? 'Salvando...' : 'Salva Carta' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSecurity } from '@/composables/useSecurity'

const { sanitizeHTML, validateInput, isSuspicious } = useSecurity()

const form = ref({
  titolo: '',
  testo: '',
  icona: '',
  emoji: '',
  tipo: 'KPI'
})

const isValidTitle = computed(() => 
  validateInput(form.value.titolo, 'title') && !isSuspicious(form.value.titolo)
)

const isValidText = computed(() => 
  validateInput(form.value.testo, 'text') && !isSuspicious(form.value.testo)
)

const isFormValid = computed(() => 
  isValidTitle.value && isValidText.value && form.value.titolo && form.value.testo
)

const sanitizedPreview = computed(() => 
  sanitizeHTML(form.value.testo)
)

const isSubmitting = ref(false)

const validateTitle = () => {
  // Real-time validation feedback
  if (isSuspicious(form.value.titolo)) {
    console.warn('🔒 Suspicious content detected in title')
  }
}

const validateText = () => {
  // Real-time validation feedback
  if (isSuspicious(form.value.testo)) {
    console.warn('🔒 Suspicious content detected in text')
  }
}

const handlePaste = (event) => {
  // Intercetta e sanitizza contenuto incollato
  event.preventDefault()
  const paste = (event.clipboardData || window.clipboardData).getData('text')
  const sanitized = sanitizeHTML(paste)
  
  if (paste !== sanitized) {
    console.warn('🔒 Pasted content was sanitized')
  }
  
  const target = event.target
  target.value = target.value + sanitized
  form.value[target.name] = target.value
}

const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  try {
    // Submit con dati pre-sanitizzati
    const sanitizedData = {
      titolo: sanitizeHTML(form.value.titolo),
      testo: sanitizeHTML(form.value.testo),
      icona: form.value.icona,
      emoji: form.value.emoji,
      tipo: form.value.tipo
    }
    
    await submitCard(sanitizedData)
  } catch (error) {
    console.error('Error submitting card:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

### 🔐 Phase 4: Security Testing & Monitoring

#### **Security Test Suite**
```javascript
// tests/security/xss.test.js
import { SanitizationService } from '../../services/SanitizationService.js';

describe('XSS Prevention Tests', () => {
    const sanitizer = new SanitizationService();
    
    const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<svg onload=alert("XSS")>',
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<select onfocus=alert("XSS") autofocus>',
        '<textarea onfocus=alert("XSS") autofocus>',
        '<keygen onfocus=alert("XSS") autofocus>',
        '<video><source onerror="alert(\'XSS\')">',
        '<audio src=x onerror=alert("XSS")>',
        '<details open ontoggle=alert("XSS")>',
        '<marquee onstart=alert("XSS")>',
        '"><script>alert("XSS")</script>',
        '\';alert("XSS");//',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4='
    ];
    
    test.each(xssPayloads)('should sanitize XSS payload: %s', (payload) => {
        const result = sanitizer.sanitizeHTML(payload);
        
        // Verifica che script tag siano rimossi
        expect(result).not.toMatch(/<script/i);
        expect(result).not.toMatch(/javascript:/i);
        expect(result).not.toMatch(/onerror/i);
        expect(result).not.toMatch(/onload/i);
        expect(result).not.toMatch(/onfocus/i);
        expect(result).not.toMatch(/data:text\/html/i);
        
        // Log per debug
        if (result !== '' && result !== payload) {
            console.log(`🔒 Sanitized: "${payload}" → "${result}"`);
        }
    });
    
    test('should preserve safe HTML tags', () => {
        const safeHTML = '<p>Testo con <strong>grassetto</strong> e <em>corsivo</em></p>';
        const result = sanitizer.sanitizeHTML(safeHTML);
        
        expect(result).toContain('<p>');
        expect(result).toContain('<strong>');
        expect(result).toContain('<em>');
        expect(result).toContain('Testo con');
    });
    
    test('should handle edge cases', () => {
        expect(sanitizer.sanitizeHTML(null)).toBe('');
        expect(sanitizer.sanitizeHTML(undefined)).toBe('');
        expect(sanitizer.sanitizeHTML(123)).toBe('');
        expect(sanitizer.sanitizeHTML('')).toBe('');
    });
});

// tests/security/api-security.test.js  
import request from 'supertest';
import app from '../../server/app.js';

describe('API Security Tests', () => {
    test('should reject XSS in deck creation', async () => {
        const maliciousDeck = {
            titolo: '<script>alert("XSS")</script>',
            sottotitolo: 'Test',
            carte: []
        };
        
        const response = await request(app)
            .post('/api/v1/decks')
            .send(maliciousDeck);
            
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/validation failed/i);
    });
    
    test('should reject oversized payload', async () => {
        const largeDeck = {
            titolo: 'Test',
            carte: Array(200).fill({
                titolo: 'Test Card',
                testo: 'A'.repeat(1000)
            })
        };
        
        const response = await request(app)
            .post('/api/v1/decks')
            .send(largeDeck);
            
        expect(response.status).toBe(400);
    });
    
    test('should enforce CORS policy', async () => {
        const response = await request(app)
            .get('/api/v1/decks')
            .set('Origin', 'http://evil-site.com');
            
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
    
    test('should have security headers', async () => {
        const response = await request(app)
            .get('/api/v1/health');
            
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
});
```

#### **Security Monitoring**
```javascript
// middleware/securityMonitoring.js
import fs from 'fs';
import path from 'path';

class SecurityMonitor {
    constructor() {
        this.logFile = path.join(process.cwd(), 'logs', 'security.log');
        this.alertThreshold = 5; // 5 attacchi in 1 minuto
        this.attackCounts = new Map();
    }
    
    logSuspiciousActivity(req, type, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            type: type,
            details: details,
            severity: this.getSeverity(type)
        };
        
        // Log su file
        this.writeLog(logEntry);
        
        // Tracking per rate limiting
        this.trackAttack(req.ip);
        
        // Alert se soglia superata
        if (this.shouldAlert(req.ip)) {
            this.sendAlert(logEntry);
        }
    }
    
    getSeverity(type) {
        const severityMap = {
            'XSS_ATTEMPT': 'HIGH',
            'SQL_INJECTION': 'HIGH', 
            'FILE_UPLOAD_ABUSE': 'MEDIUM',
            'RATE_LIMIT_EXCEEDED': 'MEDIUM',
            'INVALID_INPUT': 'LOW',
            'CORS_VIOLATION': 'MEDIUM'
        };
        return severityMap[type] || 'LOW';
    }
    
    writeLog(entry) {
        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFile(this.logFile, logLine, (err) => {
            if (err) console.error('Failed to write security log:', err);
        });
    }
    
    trackAttack(ip) {
        const now = Date.now();
        const key = `${ip}_${Math.floor(now / 60000)}`; // Finestra di 1 minuto
        
        this.attackCounts.set(key, (this.attackCounts.get(key) || 0) + 1);
        
        // Cleanup vecchie entries
        for (const [k, v] of this.attackCounts.entries()) {
            if (k.split('_')[1] < Math.floor(now / 60000) - 5) {
                this.attackCounts.delete(k);
            }
        }
    }
    
    shouldAlert(ip) {
        const now = Date.now();
        const key = `${ip}_${Math.floor(now / 60000)}`;
        return this.attackCounts.get(key) >= this.alertThreshold;
    }
    
    sendAlert(logEntry) {
        // In produzione: invia email, notifica Slack, etc.
        console.error('🚨 SECURITY ALERT:', logEntry);
    }
}

const monitor = new SecurityMonitor();

export const securityMonitoring = (req, res, next) => {
    // Monitora input sospetti
    const body = JSON.stringify(req.body);
    if (containsXSSPattern(body)) {
        monitor.logSuspiciousActivity(req, 'XSS_ATTEMPT', { 
            body: req.body,
            detected: 'XSS patterns in request body'
        });
    }
    
    // Monitora file upload sospetti
    if (req.file && !isValidFileType(req.file)) {
        monitor.logSuspiciousActivity(req, 'FILE_UPLOAD_ABUSE', {
            filename: req.file.originalname,
            mimetype: req.file.mimetype
        });
    }
    
    next();
};

function containsXSSPattern(input) {
    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror/i,
        /onload/i,
        /data:text\/html/i
    ];
    return xssPatterns.some(pattern => pattern.test(input));
}

function isValidFileType(file) {
    const allowedTypes = ['application/json', 'text/plain'];
    return allowedTypes.includes(file.mimetype);
}
```

## 🎯 Implementation Timeline

### 📅 **Week 1: Core Security Infrastructure**
- [ ] Install and configure security libraries (DOMPurify, helmet, etc.)
- [ ] Implement SanitizationService with comprehensive XSS protection
- [ ] Update CardRenderer with security-first approach
- [ ] Create security validation middleware for API

### 📅 **Week 2: API Security Hardening**  
- [ ] Implement secure CORS and CSP headers
- [ ] Add comprehensive input validation and sanitization
- [ ] Secure file upload with type validation and scanning
- [ ] Add rate limiting and DDoS protection
- [ ] Implement security monitoring and logging

### 📅 **Week 3: Frontend Security Implementation**
- [ ] Update Vue components with security-first patterns
- [ ] Implement client-side input validation and sanitization
- [ ] Add Content Security Policy compliance
- [ ] Create secure form handling with paste protection
- [ ] Update all v-html usage with sanitization

### 📅 **Week 4: Testing & Hardening**
- [ ] Comprehensive security test suite (XSS, injection, file upload)
- [ ] Penetration testing simulation
- [ ] Security audit with OWASP ZAP or similar tools
- [ ] Performance impact assessment
- [ ] Security documentation and team training

## 🏆 Security Quality Gates

### ✅ **Level 1: Basic Protection**
- [ ] All user input sanitized before rendering
- [ ] XSS protection active on all endpoints
- [ ] File upload restrictions enforced
- [ ] Basic security headers implemented

### ✅ **Level 2: Advanced Security**  
- [ ] Content Security Policy fully configured
- [ ] Rate limiting and DDoS protection active
- [ ] Security monitoring and alerting operational
- [ ] Comprehensive input validation across all surfaces

### ✅ **Level 3: Production Ready**
- [ ] Full security test suite passing (100+ test cases)
- [ ] Penetration testing completed without critical findings
- [ ] Security monitoring and incident response procedures
- [ ] Security audit documentation complete

## 🚨 Critical Security Checklist

Before deploying to production:

- [ ] **XSS Protection**: All user input sanitized in both client and server
- [ ] **Input Validation**: Comprehensive validation on all API endpoints  
- [ ] **File Upload Security**: Type validation, size limits, virus scanning
- [ ] **CORS Configuration**: Restrictive CORS policy for production domains
- [ ] **Security Headers**: CSP, HSTS, XSS protection headers configured
- [ ] **Error Handling**: No sensitive information disclosed in error messages
- [ ] **Rate Limiting**: Protect against brute force and DDoS attacks
- [ ] **Security Monitoring**: Real-time monitoring and alerting active
- [ ] **HTTPS Enforcement**: All communication encrypted in production
- [ ] **Security Testing**: Automated security tests in CI/CD pipeline

---

**⚡ Ready for Security Implementation**: The complete security hardening plan is now ready with comprehensive XSS prevention, input validation, secure file handling, and monitoring systems! 🔒
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import apiRoutes from '../routes/index.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';

/**
 * Express App Configuration
 * KPI Cards API Server
 */

const app = express();

// Trust proxy (necessario per rate limiting e logging corretto)
app.set('trust proxy', 1);

// Enhanced Security middleware
app.use(helmet({
    // Content Security Policy - Enhanced for security
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Only for development - remove in production
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'none'"],
            frameSrc: ["'none'"],
            sandboxSrc: ["'none'"]
        },
    },
    // HSTS - Force HTTPS
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    // Additional security headers
    noSniff: true, // Prevent MIME sniffing
    frameguard: { action: 'deny' }, // Prevent clickjacking
    xssFilter: true, // Enable XSS filtering
    referrerPolicy: { policy: 'same-origin' }
}));

// Enhanced CORS configuration with security
const corsConfig = {
    origin: (origin, callback) => {
        // In development, allow all origins for easier development
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            return callback(null, true);
        }
        
        // Lista domini autorizzati per production
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    maxAge: 86400 // 24 hours
};

app.use(cors(corsConfig));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limite richieste per IP
    message: {
        success: false,
        error: 'Troppe richieste',
        message: 'Hai superato il limite di richieste. Riprova tra 15 minuti.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Applica rate limiting solo in produzione o se specificato
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({
    limit: '10mb', // Limite per upload file JSON
    type: 'application/json'
}));

app.use(express.urlencoded({ 
    extended: true,
    limit: '10mb'
}));

// Logging middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    skip: (req, res) => req.path === '/api/v1/health' // Skip health check logs
}));

// Request timestamp middleware
app.use((req, res, next) => {
    req.timestamp = new Date().toISOString();
    next();
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'KPI Cards API Server',
        version: '1.0.0',
        documentation: '/api-docs',
        api: '/api/v1',
        health: '/api/v1/health'
    });
});

// API routes
app.use('/api/v1', apiRoutes);

// Swagger documentation (placeholder per ora)
app.get('/api-docs', (req, res) => {
    res.json({
        success: true,
        message: 'Swagger documentation will be available here',
        endpoints: {
            'GET /api/v1/decks': 'Lista tutti i mazzi',
            'POST /api/v1/decks': 'Crea nuovo mazzo',
            'GET /api/v1/decks/:id': 'Dettagli mazzo',
            'PUT /api/v1/decks/:id': 'Aggiorna mazzo',
            'DELETE /api/v1/decks/:id': 'Elimina mazzo'
        }
    });
});

// 404 handler per route non trovate
app.use(notFoundHandler);

// Error handler centralizzato
app.use(errorHandler);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM ricevuto, chiusura server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT ricevuto, chiusura server...');
    process.exit(0);
});

export default app;
import express from 'express';
import decksRoutes from './decks.js';
import cardsRoutes from './cards.js';
import generationRoutes, { exportRouter, previewRouter, cardPreviewRouter } from './generation.js';

const router = express.Router();

/**
 * API Routes aggregation
 * Base path: /api/v1
 */

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'KPI Cards API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Mazzi routes
router.use('/decks', decksRoutes);

// Carte routes (nested under decks)
router.use('/decks/:id/cards', cardsRoutes);

// Export routes (nested under decks)
router.use('/decks/:id/export', exportRouter);

// Preview routes (nested under decks) 
router.use('/decks/:id/preview', previewRouter);

// Card preview routes (nested under decks/cards)
router.use('/decks/:id/cards/:cardId', cardPreviewRouter);

// Generation standalone routes (downloads, stats, cleanup)
router.use('/', generationRoutes);

// API Info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'KPI Cards API v1',
        documentation: '/api-docs',
        endpoints: {
            health: '/api/v1/health',
            decks: '/api/v1/decks',
            stats: '/api/v1/decks/stats',
            cards: '/api/v1/decks/:id/cards',
            exports: '/api/v1/decks/:id/export',
            preview: '/api/v1/decks/:id/preview',
            downloads: '/api/v1/downloads/:filename'
        },
        version: '1.0.0'
    });
});

export default router;
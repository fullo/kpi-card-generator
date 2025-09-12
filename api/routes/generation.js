import express from 'express';
import { GenerationController } from '../controllers/GenerationController.js';
import { 
    validateExportOptions,
    validateRateLimit 
} from '../middleware/securityValidation.js';

const router = express.Router();
const generationController = new GenerationController();

/**
 * Routes per export e generazione
 * Base paths: 
 * - /api/v1/decks/:id/export/*
 * - /api/v1/decks/:id/preview/*
 * - /api/v1/downloads/*
 * - /api/v1/exports/*
 */

// Export endpoints (nested under decks)
const exportRouter = express.Router({ mergeParams: true });

// POST /decks/:id/export/pdf - Esporta mazzo in PDF (con validazione security)
exportRouter.post('/pdf', validateRateLimit, validateExportOptions, generationController.exportPDF);

// POST /decks/:id/export/json - Esporta mazzo in JSON (con validazione security)
exportRouter.post('/json', validateRateLimit, validateExportOptions, generationController.exportJSON);

// Preview endpoints (nested under decks)  
const previewRouter = express.Router({ mergeParams: true });

// GET /decks/:id/preview - Anteprima HTML completa per browser
previewRouter.get('/', generationController.previewHTML);

// GET /decks/:id/preview/json - Info anteprima in JSON
previewRouter.get('/json', generationController.previewInfo);

// POST /decks/:id/cards/:cardId/preview - Anteprima singola carta
const cardPreviewRouter = express.Router({ mergeParams: true });
cardPreviewRouter.get('/preview', generationController.previewCard);

// Downloads endpoint (standalone)
router.get('/downloads/:filename', generationController.downloadFile);

// Export management endpoints (standalone)
router.get('/exports/stats', generationController.getExportStats);
router.post('/exports/cleanup', generationController.cleanupExpiredFiles);

// Export subrouter con mergeParams per :id del deck
export { exportRouter, previewRouter, cardPreviewRouter };
export default router;
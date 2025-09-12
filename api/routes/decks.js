import express from 'express';
import { DeckController } from '../controllers/DeckController.js';
import { StylesController } from '../controllers/StylesController.js';
import { 
    validateAndSanitizeDeck,
    validateRateLimit 
} from '../middleware/securityValidation.js';

const router = express.Router();
const deckController = new DeckController();
const stylesController = new StylesController();

/**
 * Routes per gestione mazzi di carte
 * Base path: /api/v1/decks
 */

// GET /decks - Lista tutti i mazzi (con paginazione e search)
router.get('/', validateRateLimit, deckController.getAllDecks);

// GET /decks/stats - Statistiche globali  
router.get('/stats', deckController.getGlobalStats);

// GET /decks/:id - Dettagli mazzo specifico
router.get('/:id', deckController.getDeck);

// POST /decks - Crea nuovo mazzo (con validazione security)
router.post('/', validateRateLimit, deckController.createDeck);

// PUT /decks/:id - Aggiorna mazzo completo (con validazione security)
router.put('/:id', validateRateLimit, validateAndSanitizeDeck, deckController.updateDeck);

// PATCH /decks/:id - Aggiornamento parziale (con validazione security)
router.patch('/:id', validateRateLimit, validateAndSanitizeDeck, deckController.patchDeck);

// DELETE /decks/:id - Elimina mazzo
router.delete('/:id', validateRateLimit, deckController.deleteDeck);

// POST /decks/:id/validate - Valida mazzo specifico
router.post('/:id/validate', deckController.validateDeck);

// POST /decks/:id/paginate - Pagina mazzo per generazione
router.post('/:id/paginate', deckController.paginateDeck);

// ===== STYLES ROUTES =====

// GET /decks/:id/styles - Ottieni configurazione stili esistente
router.get('/:id/styles', stylesController.getStyles);

// GET /decks/:id/styles/available - Ottieni le classi di stile disponibili
router.get('/:id/styles/available', stylesController.getAvailableClasses);

// GET /decks/:id/styles/preview - Genera CSS per preview esistente
router.get('/:id/styles/preview', stylesController.previewCSS);

// POST /decks/:id/styles - Crea o aggiorna configurazione stili (con validazione security)
router.post('/:id/styles', validateRateLimit, stylesController.saveStyles);

// POST /decks/:id/styles/preview - Preview CSS da configurazione temporanea
router.post('/:id/styles/preview', validateRateLimit, stylesController.previewTempCSS);

// DELETE /decks/:id/styles - Rimuovi configurazione stili
router.delete('/:id/styles', validateRateLimit, stylesController.deleteStyles);

export default router;
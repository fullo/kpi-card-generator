import express from 'express';
import { CardController } from '../controllers/CardController.js';
import { 
    validateAndSanitizeCard,
    validateRateLimit 
} from '../middleware/securityValidation.js';

const router = express.Router({ mergeParams: true }); // Importante per accedere a :id del deck
const cardController = new CardController();

/**
 * Routes per gestione singole carte
 * Base path: /api/v1/decks/:id/cards
 */

// GET /decks/:id/cards - Lista tutte le carte del mazzo (con sorting)
router.get('/', cardController.getCards);

// GET /decks/:id/cards/:cardId - Dettagli carta specifica
router.get('/:cardId', cardController.getCard);

// POST /decks/:id/cards - Aggiunge nuova carta al mazzo (con validazione security)
router.post('/', validateRateLimit, validateAndSanitizeCard, cardController.addCard);

// PUT /decks/:id/cards/:cardId - Aggiorna carta completa (con validazione security)
router.put('/:cardId', validateRateLimit, validateAndSanitizeCard, cardController.updateCard);

// PATCH /decks/:id/cards/:cardId - Aggiornamento parziale carta (con validazione security)
router.patch('/:cardId', validateRateLimit, validateAndSanitizeCard, cardController.patchCard);

// DELETE /decks/:id/cards/:cardId - Elimina carta
router.delete('/:cardId', cardController.deleteCard);

// POST /decks/:id/cards/:cardId/duplicate - Duplica carta esistente
router.post('/:cardId/duplicate', cardController.duplicateCard);

// PUT /decks/:id/cards/reorder - Riordina carte nel mazzo
router.put('/reorder', cardController.reorderCards);

// POST /decks/:id/cards/bulk - Operazioni bulk su multiple carte
router.post('/bulk', cardController.bulkOperations);

// POST /decks/:id/cards/validate-all - Valida tutte le carte del mazzo
router.post('/validate-all', cardController.validateAllCards);

export default router;
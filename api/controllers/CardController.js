import { CardService } from '../services/CardService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * CardController - Gestisce endpoint REST per le singole carte
 */
export class CardController {
    constructor() {
        this.cardService = new CardService();
    }

    /**
     * GET /decks/:id/cards - Lista tutte le carte del mazzo
     */
    getCards = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const { sort = 'position', order = 'asc' } = req.query;

        const cards = await this.cardService.getCards(deckId);

        // Ordinamento opzionale
        if (sort && cards.length > 0) {
            cards.sort((a, b) => {
                let aVal = a[sort];
                let bVal = b[sort];
                
                // Gestisce ordinamento numerico per posizione
                if (sort === 'position') {
                    aVal = parseInt(aVal) || 0;
                    bVal = parseInt(bVal) || 0;
                }
                
                if (order === 'desc') {
                    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                } else {
                    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                }
            });
        }

        res.json({
            success: true,
            data: cards,
            meta: {
                totalCards: cards.length,
                deckId: deckId,
                sort: sort,
                order: order
            }
        });
    });

    /**
     * GET /decks/:id/cards/:cardId - Dettagli carta specifica
     */
    getCard = asyncHandler(async (req, res) => {
        const { id: deckId, cardId } = req.params;
        const card = await this.cardService.getCard(deckId, cardId);

        res.json({
            success: true,
            data: card
        });
    });

    /**
     * POST /decks/:id/cards - Aggiunge nuova carta al mazzo
     */
    addCard = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const cardData = req.body;

        // Validation is handled by middleware (validateAndSanitizeCard)
        // No need for duplicate validation here
        
        const newCard = await this.cardService.addCard(deckId, cardData);

        res.status(201).json({
            success: true,
            data: newCard,
            message: 'Carta aggiunta con successo'
        });
    });

    /**
     * PUT /decks/:id/cards/:cardId - Aggiorna carta completa
     */
    updateCard = asyncHandler(async (req, res) => {
        const { id: deckId, cardId } = req.params;
        const updates = req.body;

        const updatedCard = await this.cardService.updateCard(deckId, cardId, updates);

        res.json({
            success: true,
            data: updatedCard,
            message: 'Carta aggiornata con successo'
        });
    });

    /**
     * PATCH /decks/:id/cards/:cardId - Aggiornamento parziale carta
     */
    patchCard = asyncHandler(async (req, res) => {
        const { id: deckId, cardId } = req.params;
        const updates = req.body;

        // Per PATCH, accettiamo solo aggiornamenti parziali
        const allowedFields = ['title', 'headerIcon', 'heroImage', 'type', 'description', 'flavorText', 'styleClass'];
        const filteredUpdates = {};
        
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });

        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nessun campo valido da aggiornare',
                message: `Campi ammessi: ${allowedFields.join(', ')}`
            });
        }

        const updatedCard = await this.cardService.updateCard(deckId, cardId, filteredUpdates);

        res.json({
            success: true,
            data: updatedCard,
            message: 'Carta aggiornata parzialmente con successo'
        });
    });

    /**
     * DELETE /decks/:id/cards/:cardId - Elimina carta
     */
    deleteCard = asyncHandler(async (req, res) => {
        const { id: deckId, cardId } = req.params;
        const result = await this.cardService.deleteCard(deckId, cardId);

        res.json({
            success: true,
            data: result,
            message: 'Carta eliminata con successo'
        });
    });

    /**
     * POST /decks/:id/cards/:cardId/duplicate - Duplica carta
     */
    duplicateCard = asyncHandler(async (req, res) => {
        const { id: deckId, cardId } = req.params;
        const duplicatedCard = await this.cardService.duplicateCard(deckId, cardId);

        res.status(201).json({
            success: true,
            data: duplicatedCard,
            message: 'Carta duplicata con successo'
        });
    });

    /**
     * PUT /decks/:id/cards/reorder - Riordina carte
     */
    reorderCards = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const { cardOrder } = req.body;

        if (!Array.isArray(cardOrder)) {
            return res.status(400).json({
                success: false,
                error: 'Ordinamento non valido',
                message: 'cardOrder deve essere un array di ID carte'
            });
        }

        const result = await this.cardService.reorderCards(deckId, cardOrder);

        res.json({
            success: true,
            data: result,
            message: 'Carte riordinate con successo'
        });
    });

    /**
     * POST /decks/:id/cards/bulk - Operazioni bulk
     */
    bulkOperations = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const { operations } = req.body;

        if (!Array.isArray(operations)) {
            return res.status(400).json({
                success: false,
                error: 'Operazioni non valide',
                message: 'operations deve essere un array di operazioni'
            });
        }

        if (operations.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nessuna operazione',
                message: 'Fornire almeno una operazione da eseguire'
            });
        }

        const result = await this.cardService.bulkOperations(deckId, operations);

        const statusCode = result.hasErrors ? 207 : 200; // 207 Multi-Status se ci sono errori parziali

        res.status(statusCode).json({
            success: !result.hasErrors,
            data: result,
            message: result.hasErrors 
                ? `${result.successfulOperations} operazioni completate, ${result.failedOperations} fallite`
                : `Tutte le ${result.totalOperations} operazioni completate con successo`
        });
    });

    /**
     * POST /decks/:id/cards/validate-all - Valida tutte le carte del mazzo
     */
    validateAllCards = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const cards = await this.cardService.getCards(deckId);

        const validationResults = [];
        let validCards = 0;
        let invalidCards = 0;

        for (const card of cards) {
            try {
                const validation = this.cardService.validator.validateCard(card);
                validationResults.push({
                    cardId: card.id,
                    cardTitle: card.title || 'Untitled Card',
                    position: card.position,
                    isValid: validation.isValid,
                    status: validation.isValid ? '✅ OK' : '❌ KO',
                    statusMessage: validation.isValid ? 'Card is valid' : `Card has ${validation.errors.length} error(s)`,
                    errors: validation.errors || [],
                    warnings: validation.warnings || []
                });

                if (validation.isValid) {
                    validCards++;
                } else {
                    invalidCards++;
                }
            } catch (error) {
                validationResults.push({
                    cardId: card.id,
                    cardTitle: card.title || 'Untitled Card',
                    position: card.position,
                    isValid: false,
                    status: '❌ KO',
                    statusMessage: `Validation error: ${error.message}`,
                    errors: [{ message: error.message }],
                    warnings: []
                });
                invalidCards++;
            }
        }

        res.json({
            success: true,
            data: {
                deckId,
                totalCards: cards.length,
                validCards,
                invalidCards,
                validityRatio: cards.length > 0 ? ((validCards / cards.length) * 100).toFixed(1) : '0.0',
                results: validationResults
            }
        });
    });
}
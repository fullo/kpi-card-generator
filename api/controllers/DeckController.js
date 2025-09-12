import { DeckService } from '../services/DeckService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * DeckController - Gestisce endpoint REST per i mazzi
 */
export class DeckController {
    constructor() {
        this.deckService = new DeckService();
    }

    /**
     * GET /decks - Lista tutti i mazzi
     */
    getAllDecks = asyncHandler(async (req, res) => {
        const { search, limit = 20, offset = 0 } = req.query;
        
        let decks;
        if (search) {
            decks = await this.deckService.searchDecks(search);
        } else {
            decks = await this.deckService.getAllDecks();
        }

        // Paginazione
        const startIndex = parseInt(offset);
        const itemsPerPage = parseInt(limit);
        const paginatedDecks = decks.slice(startIndex, startIndex + itemsPerPage);

        // Metadata per la paginazione
        const totalItems = decks.length;
        const currentPage = Math.floor(startIndex / itemsPerPage) + 1;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        res.json({
            success: true,
            data: paginatedDecks,
            meta: {
                total: totalItems,
                page: currentPage,
                totalPages,
                limit: itemsPerPage,
                offset: startIndex,
                hasNext: (startIndex + itemsPerPage) < totalItems,
                hasPrevious: startIndex > 0
            }
        });
    });

    /**
     * GET /decks/:id - Dettagli mazzo specifico
     */
    getDeck = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const deck = await this.deckService.getDeck(id);

        res.json({
            success: true,
            data: deck
        });
    });

    /**
     * POST /decks - Crea nuovo mazzo
     */
    createDeck = asyncHandler(async (req, res) => {
        const deckData = req.body;
        
        console.log('DEBUG: Received request body:', JSON.stringify(deckData, null, 2));
        console.log('DEBUG: deckData.title value:', deckData.title, 'Type:', typeof deckData.title);
        
        // Validazioni base sui dati richiesti - solo schema inglese
        if (!deckData.title) {
            console.log('DEBUG: Title validation failed, deckData:', deckData);
            return res.status(400).json({
                success: false,
                error: 'Title required',
                message: 'The "title" field is required to create a deck'
            });
        }

        const newDeck = await this.deckService.createDeck(deckData);

        res.status(201).json({
            success: true,
            data: newDeck,
            message: 'Mazzo creato con successo'
        });
    });

    /**
     * PUT /decks/:id - Aggiorna mazzo completo
     */
    updateDeck = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;

        const updatedDeck = await this.deckService.updateDeck(id, updates);

        res.json({
            success: true,
            data: updatedDeck,
            message: 'Mazzo aggiornato con successo'
        });
    });

    /**
     * PATCH /decks/:id - Aggiornamento parziale mazzo
     */
    patchDeck = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;

        // Per PATCH, accettiamo solo aggiornamenti parziali (English schema only)
        const allowedFields = ['title', 'subtitle', 'deckIcon', 'cardBackIcon', 'copyright', 'cards'];
        const filteredUpdates = {};
        
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                // Skip empty strings for optional fields to avoid validation errors
                if (typeof updates[field] === 'string' && updates[field].trim() === '' && 
                    ['deckIcon', 'cardBackIcon', 'subtitle'].includes(field)) {
                    return;
                }
                filteredUpdates[field] = updates[field];
            }
        });

        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update',
                message: `Allowed fields: ${allowedFields.join(', ')}`
            });
        }

        const updatedDeck = await this.deckService.updateDeck(id, filteredUpdates);

        res.json({
            success: true,
            data: updatedDeck,
            message: 'Mazzo aggiornato parzialmente con successo'
        });
    });

    /**
     * DELETE /decks/:id - Elimina mazzo
     */
    deleteDeck = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await this.deckService.deleteDeck(id);

        res.json({
            success: true,
            data: result,
            message: 'Mazzo eliminato con successo'
        });
    });

    /**
     * GET /decks/stats - Statistiche globali
     */
    getGlobalStats = asyncHandler(async (req, res) => {
        const stats = await this.deckService.getGlobalStats();

        res.json({
            success: true,
            data: stats
        });
    });

    /**
     * POST /decks/:id/validate - Valida un mazzo specifico
     */
    validateDeck = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const deck = await this.deckService.getDeck(id);
        const validation = await this.deckService.validateDeck(deck);

        res.json({
            success: true,
            data: validation
        });
    });

    /**
     * POST /decks/:id/paginate - Pagina un mazzo per la generazione
     */
    paginateDeck = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const options = req.body.options || {};
        
        const deck = await this.deckService.getDeck(id);
        const paginatedData = await this.deckService.paginateDeck(deck, options);

        res.json({
            success: true,
            data: {
                deckId: id,
                pages: paginatedData,
                totalCards: deck.cards?.length || 0,
                options: {
                    cardsPerPage: options.cardsPerPage || 8,
                    cardsPerRow: options.cardsPerRow || 4
                }
            }
        });
    });
}
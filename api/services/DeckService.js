import { DeckValidator } from '../../modules/cards/validation/DeckValidator.js';
import { CardPaginator } from '../../modules/cards/pagination/CardPaginator.js';
import { FileStore } from '../storage/FileStore.js';

/**
 * DeckService - Business logic per gestione mazzi
 * Integra le classi esistenti con l'API REST
 */
export class DeckService {
    constructor() {
        this.validator = new DeckValidator();
        this.paginator = new CardPaginator();
        this.fileStore = new FileStore();
    }

    /**
     * Valida un mazzo utilizzando DeckValidator esistente
     */
    async validateDeck(deckData) {
        try {
            return this.validator.validateExercise(deckData);
        } catch (error) {
            throw new Error(`Errore nella validazione: ${error.message}`);
        }
    }

    /**
     * Recupera tutti i mazzi
     */
    async getAllDecks() {
        return await this.fileStore.getAllDecks();
    }

    /**
     * Recupera un mazzo specifico per ID
     */
    async getDeck(id) {
        if (!id || typeof id !== 'string') {
            throw new Error('ID mazzo non valido');
        }

        const deck = await this.fileStore.getDeck(id);
        
        // Applica valori di default per compatibilità con mazzi esistenti
        const deckWithDefaults = {
            ...deck,
            cardBackIcon: deck.cardBackIcon || '🃏',
            copyright: deck.copyright || 'Daruma Consulting di Francesco Fullone - CC BY-SA-NC'
        };
        
        // Aggiunge statistiche calcolate
        const stats = this.calculateDeckStats(deckWithDefaults);
        
        return {
            ...deckWithDefaults,
            stats
        };
    }

    /**
     * Ottieni il percorso del file del mazzo per ID
     */
    getDeckPath(id) {
        if (!id || typeof id !== 'string') {
            throw new Error('ID mazzo non valido');
        }
        // Costruisce il path seguendo la stessa logica del FileStore
        return this.fileStore.decksPath + '/' + id + '.json';
    }

    /**
     * Crea un nuovo mazzo
     */
    async createDeck(deckData) {
        // Applica valori di default per nuovi mazzi (solo schema inglese)
        const deckWithDefaults = {
            cardBackIcon: '🃏',
            copyright: 'Daruma Consulting di Francesco Fullone - CC BY-SA-NC',
            ...deckData
        };

        // Valida i dati del mazzo
        const validation = await this.validateDeck(deckWithDefaults);
        
        if (!validation.isValid) {
            const error = new Error('Dati del mazzo non validi');
            error.name = 'ValidationError';
            error.details = validation.errors;
            throw error;
        }

        // Salva il mazzo
        const savedDeck = await this.fileStore.saveDeck(deckWithDefaults);
        
        return {
            ...savedDeck,
            validation,
            stats: this.calculateDeckStats(savedDeck)
        };
    }

    /**
     * Aggiorna un mazzo esistente
     */
    async updateDeck(id, updates) {
        // Verifica che il mazzo esista
        const exists = await this.fileStore.deckExists(id);
        if (!exists) {
            throw new Error(`Mazzo con ID ${id} non trovato`);
        }

        // Se ci sono aggiornamenti alle carte, valida il mazzo completo
        if (updates.cards || updates.title) {
            const existingDeck = await this.fileStore.getDeck(id);
            
            // Filter out empty string values for optional fields to avoid validation errors
            const cleanedUpdates = Object.fromEntries(
                Object.entries(updates).filter(([key, value]) => {
                    if (typeof value === 'string' && value.trim() === '' && 
                        ['deckIcon', 'cardBackIcon', 'subtitle'].includes(key)) {
                        return false;
                    }
                    return true;
                })
            );
            
            const updatedData = { ...existingDeck, ...cleanedUpdates };
            
            const validation = await this.validateDeck(updatedData);
            if (!validation.isValid) {
                const error = new Error('Dati del mazzo aggiornato non validi');
                error.name = 'ValidationError';
                error.details = validation.errors;
                throw error;
            }
        }

        // Aggiorna il mazzo
        const updatedDeck = await this.fileStore.updateDeck(id, updates);
        
        return {
            ...updatedDeck,
            stats: this.calculateDeckStats(updatedDeck)
        };
    }

    /**
     * Elimina un mazzo
     */
    async deleteDeck(id) {
        return await this.fileStore.deleteDeck(id);
    }

    /**
     * Pagina un mazzo per la generazione
     */
    async paginateDeck(deckData, options = {}) {
        const validation = await this.validateDeck(deckData);
        if (!validation.isValid) {
            const error = new Error('Impossibile paginare un mazzo non valido');
            error.name = 'ValidationError';
            error.details = validation.errors;
            throw error;
        }

        const defaultOptions = {
            cardsPerPage: 8,
            cardsPerRow: 4
        };

        const paginationOptions = { ...defaultOptions, ...options };

        return this.paginator.paginateCards(
            deckData.cards,
            paginationOptions.cardsPerPage,
            paginationOptions.cardsPerRow
        );
    }

    /**
     * Calcola statistiche per un mazzo
     */
    calculateDeckStats(deck) {
        if (!deck.cards || !Array.isArray(deck.cards)) {
            return {
                cardCount: 0,
                estimatedPages: 0,
                categories: [],
                hasWarnings: false
            };
        }

        const cardCount = deck.cards.length;
        const estimatedPages = Math.ceil(cardCount / 8); // Default 8 cards per page
        
        // Calcola categorie uniche (solo schema inglese)
        const categories = [...new Set(deck.cards.map(card => card.type).filter(Boolean))];
        
        // Verifica se ci sono warning
        const validation = this.validator.validateExercise(deck);
        const hasWarnings = validation.warnings && validation.warnings.length > 0;

        return {
            cardCount,
            estimatedPages,
            categories,
            hasWarnings,
            lastValidated: new Date().toISOString()
        };
    }

    /**
     * Ottieni statistiche globali
     */
    async getGlobalStats() {
        return await this.fileStore.getStats();
    }

    /**
     * Cerca mazzi per titolo o contenuto
     */
    async searchDecks(query) {
        const allDecks = await this.fileStore.getAllDecks();
        
        if (!query || query.trim().length === 0) {
            return allDecks;
        }

        const searchTerm = query.toLowerCase().trim();
        
        return allDecks.filter(deck => 
            deck.title?.toLowerCase().includes(searchTerm) ||
            deck.subtitle?.toLowerCase().includes(searchTerm)
        );
    }
}
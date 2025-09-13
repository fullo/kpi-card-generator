import { DeckValidator } from '../../modules/cards/validation/DeckValidator.js';
import { FileStore } from '../storage/FileStore.js';

/**
 * CardService - Business logic per gestione singole cards
 * Gestisce operazioni CRUD su cards individuali all'interno dei mazzi
 */
export class CardService {
    constructor() {
        this.validator = new DeckValidator();
        this.fileStore = new FileStore();
    }

    /**
     * Genera un ID unico per una carta
     */
    generateCardId() {
        return `card_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Recupera tutte le cards di un mazzo
     */
    async getCards(deckId) {
        const deck = await this.fileStore.getDeck(deckId);
        
        if (!deck.cards || !Array.isArray(deck.cards)) {
            return [];
        }

        // Aggiunge ID univoci alle cards se non presenti e posizione
        return deck.cards.map((card, index) => ({
            ...card,
            id: card.id || `${deckId}_card_${index}`,
            position: index + 1
        }));
    }

    /**
     * Recupera una carta specifica
     */
    async getCard(deckId, cardId) {
        const cards = await this.getCards(deckId);
        const card = cards.find(c => c.id === cardId);
        
        if (!card) {
            throw new Error(`Carta con ID ${cardId} non trovata nel mazzo ${deckId}`);
        }
        
        return card;
    }

    /**
     * Aggiunge una nuova carta al mazzo
     */
    async addCard(deckId, cardData) {
        const deck = await this.fileStore.getDeck(deckId);
        
        // Genera ID per la carta se non presente
        const newCard = {
            ...cardData,
            id: cardData.id || this.generateCardId()
        };

        // Valida la carta singola
        const cardValidation = this.validator.validateCard(newCard);
        if (!cardValidation.isValid) {
            const error = new Error('Dati carta non validi');
            error.name = 'ValidationError';
            error.details = cardValidation.errors;
            throw error;
        }

        // Inizializza l'array cards se non esiste
        if (!deck.cards) {
            deck.cards = [];
        }

        // Aggiunge la carta al mazzo
        deck.cards.push(newCard);

        // Valida il mazzo completo
        const deckValidation = this.validator.validateExercise(deck);
        
        // Salva il mazzo aggiornato
        const updatedDeck = await this.fileStore.updateDeck(deckId, deck);

        // Restituisce la carta aggiunta con metadata
        const addedCard = {
            ...newCard,
            position: deck.cards.length,
            validation: cardValidation,
            deckValidation: deckValidation
        };

        return addedCard;
    }

    /**
     * Aggiorna una carta esistente
     */
    async updateCard(deckId, cardId, updates) {
        const deck = await this.fileStore.getDeck(deckId);
        
        if (!deck.cards || !Array.isArray(deck.cards)) {
            throw new Error(`Nessuna carta trovata nel mazzo ${deckId}`);
        }

        // Trova l'indice della carta
        const cardIndex = deck.cards.findIndex(card => {
            return card.id === cardId || `${deckId}_card_${deck.cards.indexOf(card)}` === cardId;
        });

        if (cardIndex === -1) {
            throw new Error(`Carta con ID ${cardId} non trovata`);
        }

        // Aggiorna la carta
        const updatedCard = {
            ...deck.cards[cardIndex],
            ...updates,
            id: deck.cards[cardIndex].id || cardId // Mantiene l'ID esistente
        };

        // Valida la carta aggiornata
        const cardValidation = this.validator.validateCard(updatedCard);
        if (!cardValidation.isValid) {
            const error = new Error('Dati carta aggiornata non validi');
            error.name = 'ValidationError';
            error.details = cardValidation.errors;
            throw error;
        }

        // Aggiorna la carta nel mazzo
        deck.cards[cardIndex] = updatedCard;

        // Valida il mazzo completo
        const deckValidation = this.validator.validateExercise(deck);

        // Salva il mazzo
        await this.fileStore.updateDeck(deckId, deck);

        return {
            ...updatedCard,
            position: cardIndex + 1,
            validation: cardValidation,
            deckValidation: deckValidation
        };
    }

    /**
     * Elimina una carta dal mazzo
     */
    async deleteCard(deckId, cardId) {
        const deck = await this.fileStore.getDeck(deckId);
        
        if (!deck.cards || !Array.isArray(deck.cards)) {
            throw new Error(`Nessuna carta trovata nel mazzo ${deckId}`);
        }

        // Trova l'indice della carta
        const cardIndex = deck.cards.findIndex(card => {
            return card.id === cardId || `${deckId}_card_${deck.cards.indexOf(card)}` === cardId;
        });

        if (cardIndex === -1) {
            throw new Error(`Carta con ID ${cardId} non trovata`);
        }

        // Rimuove la carta
        const deletedCard = deck.cards.splice(cardIndex, 1)[0];

        // Salva il mazzo aggiornato
        await this.fileStore.updateDeck(deckId, deck);

        return {
            id: cardId,
            deleted: true,
            card: deletedCard,
            remainingCards: deck.cards.length
        };
    }

    /**
     * Riordina le cards nel mazzo
     */
    async reorderCards(deckId, cardOrder) {
        const deck = await this.fileStore.getDeck(deckId);
        
        if (!deck.cards || !Array.isArray(deck.cards)) {
            throw new Error(`Nessuna carta trovata nel mazzo ${deckId}`);
        }

        if (!Array.isArray(cardOrder) || cardOrder.length !== deck.cards.length) {
            throw new Error('Array di ordinamento non valido');
        }

        // Verifica che tutti gli ID siano presenti
        const currentIds = deck.cards.map((card, index) => 
            card.id || `${deckId}_card_${index}`
        );
        
        const missingIds = cardOrder.filter(id => !currentIds.includes(id));
        if (missingIds.length > 0) {
            throw new Error(`ID cards non trovati: ${missingIds.join(', ')}`);
        }

        // Riordina le cards secondo l'array fornito
        const reorderedCards = cardOrder.map(cardId => {
            const cardIndex = currentIds.indexOf(cardId);
            return deck.cards[cardIndex];
        });

        deck.cards = reorderedCards;

        // Salva il mazzo riordinato
        await this.fileStore.updateDeck(deckId, deck);

        return {
            deckId,
            reordered: true,
            totalCards: deck.cards.length,
            newOrder: cardOrder
        };
    }

    /**
     * Operazioni bulk su multiple cards
     */
    async bulkOperations(deckId, operations) {
        const deck = await this.fileStore.getDeck(deckId);
        const results = [];
        let hasErrors = false;

        if (!Array.isArray(operations)) {
            throw new Error('Operations deve essere un array');
        }

        for (const operation of operations) {
            try {
                let result;
                
                switch (operation.type) {
                    case 'add':
                        result = await this._bulkAddCard(deck, operation.data);
                        break;
                    case 'update':
                        result = await this._bulkUpdateCard(deck, operation.cardId, operation.data);
                        break;
                    case 'delete':
                        result = await this._bulkDeleteCard(deck, operation.cardId);
                        break;
                    default:
                        throw new Error(`Operazione non supportata: ${operation.type}`);
                }
                
                results.push({ ...result, success: true });
            } catch (error) {
                hasErrors = true;
                results.push({
                    success: false,
                    error: error.message,
                    operation: operation.type,
                    cardId: operation.cardId
                });
            }
        }

        // Salva il mazzo solo se ci sono stati cambiamenti validi
        if (results.some(r => r.success)) {
            await this.fileStore.updateDeck(deckId, deck);
        }

        return {
            deckId,
            totalOperations: operations.length,
            successfulOperations: results.filter(r => r.success).length,
            failedOperations: results.filter(r => !r.success).length,
            hasErrors,
            results
        };
    }

    /**
     * Helper per bulk add
     */
    async _bulkAddCard(deck, cardData) {
        const newCard = {
            ...cardData,
            id: cardData.id || this.generateCardId()
        };

        const validation = this.validator.validateCard(newCard);
        if (!validation.isValid) {
            throw new Error(`Carta non valida: ${validation.errors[0]?.message}`);
        }

        if (!deck.cards) deck.cards = [];
        deck.cards.push(newCard);

        return { type: 'add', cardId: newCard.id, position: deck.cards.length };
    }

    /**
     * Helper per bulk update
     */
    async _bulkUpdateCard(deck, cardId, updates) {
        const cardIndex = deck.cards?.findIndex(card => 
            card.id === cardId || `${deck.id}_card_${deck.cards.indexOf(card)}` === cardId
        );

        if (cardIndex === -1) {
            throw new Error(`Carta ${cardId} non trovata`);
        }

        const updatedCard = { ...deck.cards[cardIndex], ...updates };
        const validation = this.validator.validateCard(updatedCard);
        
        if (!validation.isValid) {
            throw new Error(`Carta aggiornata non valida: ${validation.errors[0]?.message}`);
        }

        deck.cards[cardIndex] = updatedCard;
        return { type: 'update', cardId, position: cardIndex + 1 };
    }

    /**
     * Helper per bulk delete
     */
    async _bulkDeleteCard(deck, cardId) {
        const cardIndex = deck.cards?.findIndex(card => 
            card.id === cardId || `${deck.id}_card_${deck.cards.indexOf(card)}` === cardId
        );

        if (cardIndex === -1) {
            throw new Error(`Carta ${cardId} non trovata`);
        }

        deck.cards.splice(cardIndex, 1);
        return { type: 'delete', cardId, removedPosition: cardIndex + 1 };
    }

    /**
     * Duplica una carta esistente
     */
    async duplicateCard(deckId, cardId) {
        const originalCard = await this.getCard(deckId, cardId);
        
        // Rimuove l'ID originale e modifica il titolo
        const duplicatedCard = {
            ...originalCard,
            id: this.generateCardId(),
            title: `${originalCard.title} (Copia)`,
            position: undefined // Sarà assegnata durante l'aggiunta
        };

        return await this.addCard(deckId, duplicatedCard);
    }
}
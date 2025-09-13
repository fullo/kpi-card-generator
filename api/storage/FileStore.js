import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FileStore - Gestione persistence file-based per mazzi di carte
 * Implementa CRUD operations con file JSON
 */
export class FileStore {
    constructor(basePath = '../data') {
        // Risolve il path relativo alla directory corrente
        this.basePath = path.resolve(__dirname, basePath);
        this.decksPath = path.join(this.basePath, 'decks');
        this.templatesPath = path.join(this.basePath, 'templates');
        
        // Inizializza le directory se non esistono
        this.initialize();
    }

    /**
     * Inizializza le directory necessarie
     */
    async initialize() {
        try {
            await fs.mkdir(this.basePath, { recursive: true });
            await fs.mkdir(this.decksPath, { recursive: true });
            await fs.mkdir(this.templatesPath, { recursive: true });
        } catch (error) {
            console.error('Errore inizializzazione FileStore:', error);
        }
    }

    /**
     * Genera un ID unico per un nuovo mazzo
     */
    generateId() {
        return `deck_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Salva un mazzo su file
     */
    async saveDeck(deck) {
        if (!deck.id) {
            deck.id = this.generateId();
        }

        const now = new Date().toISOString();
        const deckData = {
            ...deck,
            updatedAt: now,
            createdAt: deck.createdAt || now
        };

        const filename = path.join(this.decksPath, `${deck.id}.json`);
        
        try {
            await fs.writeFile(filename, JSON.stringify(deckData, null, 2), 'utf-8');
            return deckData;
        } catch (error) {
            throw new Error(`Errore nel salvare il mazzo ${deck.id}: ${error.message}`);
        }
    }

    /**
     * Recupera un mazzo per ID
     */
    async getDeck(id) {
        const filename = path.join(this.decksPath, `${id}.json`);
        
        try {
            const content = await fs.readFile(filename, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Mazzo con ID ${id} non trovato`);
            }
            throw new Error(`Errore nel leggere il mazzo ${id}: ${error.message}`);
        }
    }

    /**
     * Recupera tutti i mazzi con metadata
     */
    async getAllDecks() {
        try {
            const files = await fs.readdir(this.decksPath);
            // Filter only actual deck files, exclude style files and backups
            const deckFiles = files.filter(file => 
                file.endsWith('.json') && 
                !file.includes('.styles.') && 
                !file.includes('.backup')
            );
            
            const decks = await Promise.all(
                deckFiles.map(async (file) => {
                    try {
                        const content = await fs.readFile(
                            path.join(this.decksPath, file), 
                            'utf-8'
                        );
                        const deck = JSON.parse(content);
                        
                        // Skip files that don't have an ID (not valid deck files)
                        if (!deck.id) {
                            return null;
                        }
                        
                        // Restituisce solo metadata per la lista (supporto schema English e Italian)
                        const cards = deck.cards || deck.carte || [];
                        
                        // Skip decks with 0 cards (empty decks)
                        if (cards.length === 0) {
                            return null;
                        }
                        
                        return {
                            id: deck.id,
                            title: deck.title || deck.titolo,
                            subtitle: deck.subtitle || deck.sottotitolo,
                            deckIcon: deck.deckIcon || deck.icona_esercizio,
                            cardCount: cards.length,
                            createdAt: deck.createdAt,
                            updatedAt: deck.updatedAt
                        };
                    } catch (error) {
                        console.error(`Errore nel leggere il file ${file}:`, error);
                        return null;
                    }
                })
            );

            // Filtra i mazzi validi e ordina per data di aggiornamento
            return decks
                .filter(deck => deck !== null)
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                
        } catch (error) {
            console.error('Errore nel recuperare i mazzi:', error);
            return [];
        }
    }

    /**
     * Aggiorna un mazzo esistente
     */
    async updateDeck(id, updates) {
        const existingDeck = await this.getDeck(id);
        const updatedDeck = {
            ...existingDeck,
            ...updates,
            id: existingDeck.id, // Mantiene l'ID originale
            createdAt: existingDeck.createdAt, // Mantiene la data di creazione
            updatedAt: new Date().toISOString()
        };
        
        return await this.saveDeck(updatedDeck);
    }

    /**
     * Elimina un mazzo
     */
    async deleteDeck(id) {
        const filename = path.join(this.decksPath, `${id}.json`);
        
        try {
            await fs.unlink(filename);
            return { id, deleted: true };
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Mazzo con ID ${id} non trovato`);
            }
            throw new Error(`Errore nell'eliminare il mazzo ${id}: ${error.message}`);
        }
    }

    /**
     * Verifica se un mazzo esiste
     */
    async deckExists(id) {
        const filename = path.join(this.decksPath, `${id}.json`);
        try {
            await fs.access(filename);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Ottieni statistiche sui mazzi
     */
    async getStats() {
        const decks = await this.getAllDecks();
        const totalCards = decks.reduce((sum, deck) => sum + deck.cardCount, 0);
        
        return {
            totalDecks: decks.length,
            totalCards: totalCards,
            averageCardsPerDeck: decks.length > 0 ? Math.round(totalCards / decks.length) : 0,
            lastUpdated: decks.length > 0 ? decks[0].updatedAt : null
        };
    }
}
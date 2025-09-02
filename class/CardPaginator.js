/**
 * CardPaginator - Gestisce la divisione delle carte in pagine e fogli
 * 
 * Responsabilità:
 * - Divisione carte in fogli in base alla configurazione
 * - Gestione placeholder per completare griglie
 * - Validazione parametri di paginazione
 * - Calcolo metriche sui fogli generati
 */
export class CardPaginator {

    /**
     * Valida i parametri di paginazione
     * @param {number} cardsPerPage - Carte per pagina
     * @param {number} cardsPerRow - Carte per riga
     * @returns {boolean} True se i parametri sono validi
     */
    static validatePaginationParams(cardsPerPage, cardsPerRow) {
        if (!cardsPerPage || !cardsPerRow) return false;
        if (cardsPerPage <= 0 || cardsPerRow <= 0) return false;
        if (!Number.isInteger(cardsPerPage) || !Number.isInteger(cardsPerRow)) return false;
        if (cardsPerRow > cardsPerPage) return false;
        if (cardsPerPage % cardsPerRow !== 0) return false;
        
        return true;
    }

    /**
     * Calcola il numero di placeholder necessari per completare una pagina
     * @param {number} cardCount - Numero di carte nella pagina
     * @param {number} cardsPerPage - Carte per pagina completa
     * @returns {number} Numero di placeholder da aggiungere
     */
    static calculatePlaceholdersNeeded(cardCount, cardsPerPage) {
        if (cardCount >= cardsPerPage) return 0;
        return cardsPerPage - cardCount;
    }

    /**
     * Crea una pagina con carte e placeholder
     * @param {Array<Object>} cards - Array di carte per la pagina
     * @param {number} cardsPerPage - Numero totale di carte per pagina
     * @returns {Array<Object>} Array di carte con placeholder aggiunti
     */
    static createPageWithPlaceholders(cards, cardsPerPage) {
        const pageCards = [...cards];
        const placeholdersNeeded = this.calculatePlaceholdersNeeded(cards.length, cardsPerPage);
        
        for (let i = 0; i < placeholdersNeeded; i++) {
            pageCards.push({ isPlaceholder: true, id: `placeholder-${i}` });
        }
        
        return pageCards;
    }

    /**
     * Divide un array di carte in pagine
     * @param {Array<Object>} cards - Array di tutte le carte
     * @param {number} cardsPerPage - Numero di carte per pagina
     * @param {number} cardsPerRow - Numero di carte per riga
     * @returns {{pages: Array, metrics: Object}} Oggetto con pagine e metriche
     */
    static paginateCards(cards, cardsPerPage = 8, cardsPerRow = 4) {
        // Validazione input
        if (!Array.isArray(cards)) {
            throw new Error('Cards deve essere un array');
        }

        if (!this.validatePaginationParams(cardsPerPage, cardsPerRow)) {
            throw new Error(`Parametri di paginazione non validi: cardsPerPage=${cardsPerPage}, cardsPerRow=${cardsPerRow}`);
        }

        // Caso speciale: array vuoto
        if (cards.length === 0) {
            return {
                pages: [],
                metrics: {
                    totalCards: 0,
                    totalPages: 0,
                    totalPlaceholders: 0,
                    cardsPerPage,
                    cardsPerRow
                }
            };
        }

        const pages = [];
        const totalCards = cards.length;
        const totalPages = Math.ceil(totalCards / cardsPerPage);
        let totalPlaceholders = 0;

        // Crea le pagine
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const startIdx = pageIndex * cardsPerPage;
            const endIdx = Math.min(startIdx + cardsPerPage, totalCards);
            const pageCards = cards.slice(startIdx, endIdx);
            
            const pageWithPlaceholders = this.createPageWithPlaceholders(pageCards, cardsPerPage);
            const placeholdersInPage = cardsPerPage - pageCards.length;
            totalPlaceholders += placeholdersInPage;
            
            pages.push(pageWithPlaceholders);
        }

        const metrics = {
            totalCards,
            totalPages,
            totalPlaceholders,
            cardsPerPage,
            cardsPerRow,
            averageCardsPerPage: totalCards / totalPages,
            efficiency: (totalCards / (totalPages * cardsPerPage)) * 100
        };

        return { pages, metrics };
    }

    /**
     * Calcola layout completi con fronti e retri per tutte le pagine
     * @param {Array<Object>} cards - Array di carte
     * @param {number} cardsPerPage - Carte per pagina
     * @param {number} cardsPerRow - Carte per riga
     * @param {string} printMode - Modalità di stampa per il layout speculare
     * @param {Function} layoutCalculator - Funzione per calcolare il layout speculare
     * @returns {Array<{fronts: Array, backs: Array}>} Array di pagine con fronti e retri
     */
    static createPaginatedLayouts(cards, cardsPerPage, cardsPerRow, printMode, layoutCalculator) {
        const { pages } = this.paginateCards(cards, cardsPerPage, cardsPerRow);
        
        return pages.map(pageCards => ({
            fronts: pageCards,
            backs: layoutCalculator.call(null, pageCards, cardsPerRow, printMode)
        }));
    }

    /**
     * Restituisce statistiche dettagliate sulla paginazione
     * @param {Array<Object>} cards - Array di carte
     * @param {number} cardsPerPage - Carte per pagina
     * @param {number} cardsPerRow - Carte per riga
     * @returns {Object} Statistiche dettagliate
     */
    static getPaginationStats(cards, cardsPerPage = 8, cardsPerRow = 4) {
        const { metrics } = this.paginateCards(cards, cardsPerPage, cardsPerRow);
        
        const rowsPerPage = cardsPerPage / cardsPerRow;
        const lastPageCards = cards.length % cardsPerPage || cardsPerPage;
        const lastPageRows = Math.ceil(lastPageCards / cardsPerRow);
        const emptyRowsInLastPage = rowsPerPage - lastPageRows;
        
        return {
            ...metrics,
            rowsPerPage,
            lastPageCards,
            lastPageRows,
            emptyRowsInLastPage,
            isLastPageComplete: lastPageCards === cardsPerPage,
            wastePercentage: ((metrics.totalPlaceholders / (metrics.totalPages * cardsPerPage)) * 100).toFixed(1)
        };
    }

    /**
     * Ottimizza la configurazione di paginazione per minimizzare gli sprechi
     * @param {number} totalCards - Numero totale di carte
     * @param {Array<number>} possibleCardsPerPage - Configurazioni possibili di carte per pagina
     * @returns {Object} Configurazione ottimale
     */
    static optimizePagination(totalCards, possibleCardsPerPage = [4, 6, 8, 9, 10, 12]) {
        if (totalCards === 0) {
            return { cardsPerPage: 8, cardsPerRow: 4, efficiency: 100 };
        }

        let bestConfig = null;
        let bestEfficiency = 0;

        possibleCardsPerPage.forEach(cardsPerPage => {
            // Trova divisori validi per cardsPerRow
            const possibleCardsPerRow = [];
            for (let i = 1; i <= cardsPerPage; i++) {
                if (cardsPerPage % i === 0) {
                    possibleCardsPerRow.push(i);
                }
            }

            possibleCardsPerRow.forEach(cardsPerRow => {
                try {
                    const { metrics } = this.paginateCards(
                        new Array(totalCards).fill({}), 
                        cardsPerPage, 
                        cardsPerRow
                    );
                    
                    if (metrics.efficiency > bestEfficiency) {
                        bestEfficiency = metrics.efficiency;
                        bestConfig = {
                            cardsPerPage,
                            cardsPerRow,
                            efficiency: metrics.efficiency,
                            totalPages: metrics.totalPages,
                            totalPlaceholders: metrics.totalPlaceholders
                        };
                    }
                } catch (error) {
                    // Configurazione non valida, ignora
                }
            });
        });

        return bestConfig || { cardsPerPage: 8, cardsPerRow: 4, efficiency: 0 };
    }

    /**
     * Verifica se una configurazione di paginazione è valida per un dato numero di carte
     * @param {number} totalCards - Numero totale di carte
     * @param {number} cardsPerPage - Carte per pagina
     * @param {number} cardsPerRow - Carte per riga
     * @returns {{isValid: boolean, reason?: string}} Risultato della validazione
     */
    static validateConfiguration(totalCards, cardsPerPage, cardsPerRow) {
        if (!this.validatePaginationParams(cardsPerPage, cardsPerRow)) {
            return {
                isValid: false,
                reason: `Parametri non validi: cardsPerPage=${cardsPerPage}, cardsPerRow=${cardsPerRow}`
            };
        }

        if (totalCards < 0) {
            return {
                isValid: false,
                reason: 'Il numero di carte non può essere negativo'
            };
        }

        return { isValid: true };
    }
}
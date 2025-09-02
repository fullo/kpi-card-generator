/**
 * LayoutCalculator - Gestisce i calcoli per il layout speculare delle carte
 * 
 * Responsabilità:
 * - Calcolo ordinamenti speculari per stampa fronte-retro
 * - Gestione modalità landscape/portrait + legacy shortside/longside
 * - Normalizzazione input case-insensitive
 * - Validazione modalità di stampa
 */
export class LayoutCalculator {
    
    /**
     * Modalità di stampa supportate con le loro varianti
     */
    static PRINT_MODES = {
        // Modalità principale: capovolgi sul lato corto (inverte colonne nelle righe)
        SHORT: ['short', 'shortside', 'short-side', 'portrait'],
        // Modalità principale: capovolgi sul lato lungo (inverte righe)
        LONG: ['long', 'longside', 'long-side', 'landscape']
    };

    /**
     * Normalizza la modalità di stampa in formato standard
     * @param {string} mode - Modalità di stampa da normalizzare
     * @returns {string} Modalità normalizzata ('short' o 'long')
     */
    static normalizeMode(mode) {
        if (!mode || typeof mode !== 'string') {
            return 'short';
        }

        const normalizedMode = mode.toLowerCase().trim();
        
        if (this.PRINT_MODES.SHORT.includes(normalizedMode)) {
            return 'short';
        }
        if (this.PRINT_MODES.LONG.includes(normalizedMode)) {
            return 'long';
        }
        
        // Default fallback
        return 'short';
    }

    /**
     * Valida se una modalità di stampa è supportata
     * @param {string} mode - Modalità da validare
     * @returns {boolean} True se la modalità è valida
     */
    static isValidMode(mode) {
        if (!mode || typeof mode !== 'string') {
            return false;
        }

        const normalizedMode = mode.toLowerCase().trim();
        return [...this.PRINT_MODES.SHORT, ...this.PRINT_MODES.LONG].includes(normalizedMode);
    }

    /**
     * Restituisce informazioni leggibili sulla modalità di stampa
     * @param {string} mode - Modalità di stampa
     * @returns {{mode: string, description: string, flipSide: string}} Informazioni sulla modalità
     */
    static getModeInfo(mode) {
        const normalizedMode = this.normalizeMode(mode);
        
        if (normalizedMode === 'long') {
            return {
                mode: 'long',
                description: 'Capovolgi sul lato lungo',
                flipSide: 'lungo'
            };
        }
        
        return {
            mode: 'short', 
            description: 'Capovolgi sul lato corto',
            flipSide: 'corto'
        };
    }

    /**
     * Calcola il layout speculare per la stampa fronte-retro
     * @param {Array<Object>} fronts - Array delle carte del fronte
     * @param {number} cardsPerRow - Numero di carte per riga
     * @param {string} printMode - Modalità di stampa ('short', 'long', 'portrait', 'landscape', etc.)
     * @returns {Array<Object>} Array delle carte del retro ordinate per la stampa speculare
     */
    static calculateMirrorLayout(fronts, cardsPerRow, printMode = 'short') {
        if (!Array.isArray(fronts) || fronts.length === 0) {
            return [];
        }

        if (!cardsPerRow || cardsPerRow <= 0) {
            throw new Error('cardsPerRow deve essere un numero positivo');
        }

        const normalizedMode = this.normalizeMode(printMode);
        
        // Dividi le carte in righe
        const allRows = [];
        const rows = Math.ceil(fronts.length / cardsPerRow);
        
        for (let i = 0; i < rows; i++) {
            const rowCards = fronts.slice(i * cardsPerRow, (i + 1) * cardsPerRow);
            allRows.push(rowCards);
        }
        
        let processedRows;

        if (normalizedMode === 'long') {
            // Modalità Long-Side: Inverte l'ordine delle righe
            processedRows = [...allRows].reverse();
        } else {
            // Modalità Short-Side (default): Inverte le carte in ogni riga
            processedRows = allRows.map(row => [...row].reverse());
        }
        
        return processedRows.flat();
    }

    /**
     * Funzione di compatibilità per la versione precedente
     * @deprecated Usa calculateMirrorLayout invece
     */
    static calculateLayouts(fronts, cardsPerRow, flipMode) {
        console.warn('calculateLayouts è deprecata, usa calculateMirrorLayout');
        return this.calculateMirrorLayout(fronts, cardsPerRow, flipMode);
    }
}
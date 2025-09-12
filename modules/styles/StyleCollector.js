/**
 * StyleCollector - Raccoglie styleClass uniche da un mazzo di carte
 * 
 * Responsabilità:
 * - Analizza un deck JSON per trovare tutti i valori styleClass unici
 * - Filtra e pulisce i valori duplicati
 * - Fornisce statistiche sui stili trovati
 */
export class StyleCollector {
    
    /**
     * Estrae tutte le styleClass uniche da un deck
     * @param {Object} deck - Oggetto deck con array di carte
     * @returns {Array<string>} Array di stringhe styleClass uniche
     */
    static extractUniqueStyleClasses(deck) {
        if (!deck || !Array.isArray(deck.cards)) {
            return [];
        }

        const styleClasses = new Set();

        deck.cards.forEach(card => {
            if (card.styleClass && typeof card.styleClass === 'string') {
                const cleanStyleClass = card.styleClass.trim();
                if (cleanStyleClass.length > 0) {
                    styleClasses.add(cleanStyleClass);
                }
            }
        });

        return Array.from(styleClasses).sort();
    }

    /**
     * Analizza la distribuzione delle styleClass nel deck
     * @param {Object} deck - Oggetto deck con array di carte
     * @returns {Object} Statistiche sulla distribuzione degli stili
     */
    static analyzeStyleDistribution(deck) {
        if (!deck || !Array.isArray(deck.cards)) {
            return {
                totalCards: 0,
                totalUniqueStyles: 0,
                styleDistribution: {},
                cardsWithoutStyle: 0
            };
        }

        const distribution = {};
        let cardsWithoutStyle = 0;

        deck.cards.forEach(card => {
            if (card.styleClass && typeof card.styleClass === 'string') {
                const cleanStyleClass = card.styleClass.trim();
                if (cleanStyleClass.length > 0) {
                    distribution[cleanStyleClass] = (distribution[cleanStyleClass] || 0) + 1;
                } else {
                    cardsWithoutStyle++;
                }
            } else {
                cardsWithoutStyle++;
            }
        });

        return {
            totalCards: deck.cards.length,
            totalUniqueStyles: Object.keys(distribution).length,
            styleDistribution: distribution,
            cardsWithoutStyle: cardsWithoutStyle
        };
    }

    /**
     * Verifica se un deck ha styleClass configurabili
     * @param {Object} deck - Oggetto deck con array di carte
     * @returns {boolean} True se il deck ha almeno una styleClass
     */
    static hasConfigurableStyles(deck) {
        const uniqueStyles = this.extractUniqueStyleClasses(deck);
        return uniqueStyles.length > 0;
    }

    /**
     * Genera un report leggibile sulla distribuzione degli stili
     * @param {Object} deck - Oggetto deck con array di carte
     * @returns {string} Report formattato per l'utente
     */
    static generateStyleReport(deck) {
        const analysis = this.analyzeStyleDistribution(deck);
        
        if (analysis.totalUniqueStyles === 0) {
            return "❌ Nessuna styleClass trovata nel deck. Aggiungi styleClass alle carte per abilitare la personalizzazione.";
        }

        let report = `✅ Trovate ${analysis.totalUniqueStyles} styleClass uniche nel deck:\n\n`;
        
        Object.entries(analysis.styleDistribution)
            .sort(([, a], [, b]) => b - a) // Ordina per numero di carte decrescente
            .forEach(([styleClass, count]) => {
                report += `  • ${styleClass}: ${count} carte\n`;
            });

        if (analysis.cardsWithoutStyle > 0) {
            report += `\n⚠️  ${analysis.cardsWithoutStyle} carte senza styleClass (non personalizzabili)`;
        }

        return report;
    }

    /**
     * Valida se una styleClass è un identificatore CSS valido
     * @param {string} styleClass - Nome della classe da validare
     * @returns {boolean} True se è un identificatore CSS valido
     */
    static isValidCSSClass(styleClass) {
        if (!styleClass || typeof styleClass !== 'string') {
            return false;
        }

        // Regex per identificatori CSS validi: 
        // - Inizia con lettera, underscore o dash
        // - Contiene solo lettere, numeri, dash, underscore
        // - Non può essere vuoto
        const cssClassRegex = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/;
        return cssClassRegex.test(styleClass.trim());
    }

    /**
     * Filtra le styleClass valide da un array
     * @param {Array<string>} styleClasses - Array di styleClass da filtrare
     * @returns {Object} Oggetto con valid e invalid arrays
     */
    static validateStyleClasses(styleClasses) {
        const valid = [];
        const invalid = [];

        styleClasses.forEach(styleClass => {
            if (this.isValidCSSClass(styleClass)) {
                valid.push(styleClass);
            } else {
                invalid.push(styleClass);
            }
        });

        return { valid, invalid };
    }
}
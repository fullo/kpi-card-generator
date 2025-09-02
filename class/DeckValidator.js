import { CardRenderer } from './CardRenderer.js';

/**
 * DeckValidator - Gestisce la validazione dei dati JSON delle carte
 * 
 * Responsabilità:
 * - Validazione schema JSON
 * - Controllo campi obbligatori
 * - Validazione tipi di dati
 * - Business rules validation
 * - Generazione messaggi di errore user-friendly
 * - Conteggio caratteri escludendo markup HTML
 */
export class DeckValidator {

    /**
     * Schema di validazione per i dati dell'esercizio
     */
    static EXERCISE_SCHEMA = {
        titolo: { required: true, type: 'string', maxLength: 200 },
        sottotitolo: { required: false, type: 'string', maxLength: 300 },
        icona_esercizio: { required: false, type: 'string', maxLength: 10 },
        carte: { required: true, type: 'array', minLength: 1 }
    };

    /**
     * Schema di validazione per una singola carta
     */
    static CARD_SCHEMA = {
        titolo: { required: true, type: 'string', maxLength: 100 },
        icona: { required: false, type: 'string', maxLength: 10 },
        emoji: { required: false, type: 'string', maxLength: 10 },
        tipo: { required: false, type: 'string', maxLength: 50 },
        testo: { required: false, type: 'string', maxLength: 500 },
        flavor: { required: false, type: 'string', maxLength: 200 },
        classe: { required: false, type: 'string', maxLength: 100 }
    };

    /**
     * Lista di icone/emoji valide (opzionale per validazione strict)
     */
    static VALID_ICONS = [
        '⭐', '🎯', '📊', '📈', '💡', '🔧', '⚙️', '🎨', '📝', '🚀',
        '💰', '📋', '🏆', '🎪', '🌟', '⚡', '🔥', '💎', '🎲', '🎮'
    ];

    /**
     * Configurazione di default per la validazione
     */
    static DEFAULT_CONFIG = {
        strictIconValidation: false,
        allowEmptyFields: true,
        validateEncoding: true,
        countHtmlAsText: true,
        bypassCharacterLimits: false,
        locale: 'it'
    };

    /**
     * Costruttore del validator
     * @param {Object} config - Configurazione opzionale
     */
    constructor(config = {}) {
        this.config = { ...DeckValidator.DEFAULT_CONFIG, ...config };
    }

    /**
     * Valida il tipo di un valore
     * @param {*} value - Valore da validare
     * @param {string} expectedType - Tipo atteso
     * @returns {boolean} True se il tipo è corretto
     */
    static validateType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return value !== null && typeof value === 'object' && !Array.isArray(value);
            default:
                return false;
        }
    }

    /**
     * Valida una stringa per lunghezza e encoding
     * @param {string} value - Stringa da validare
     * @param {Object} rules - Regole di validazione
     * @returns {{isValid: boolean, errors: Array<string>}} Risultato della validazione
     */
    validateString(value, rules = {}) {
        const errors = [];

        // Salta controlli lunghezza se bypass è abilitato
        if (this.config.bypassCharacterLimits) {
            // Solo validazione encoding se abilitata
            if (this.config.validateEncoding) {
                try {
                    // Test encoding UTF-8
                    encodeURIComponent(value);
                } catch (error) {
                    errors.push('Encoding non valido - caratteri non supportati');
                }
            }
            return { isValid: errors.length === 0, errors };
        }

        // Usa il conteggio caratteri che esclude il markup HTML se configurato
        const textLength = this.config.countHtmlAsText ? 
            CardRenderer.countTextCharacters(value) : 
            value.length;

        if (rules.maxLength && textLength > rules.maxLength) {
            const lengthInfo = this.config.countHtmlAsText ? 
                `max ${rules.maxLength} caratteri di testo, attuale ${textLength} (${value.length} con markup)` :
                `max ${rules.maxLength} caratteri, attuale ${textLength}`;
            errors.push(`La stringa è troppo lunga (${lengthInfo})`);
        }

        if (rules.minLength && textLength < rules.minLength) {
            const lengthInfo = this.config.countHtmlAsText ? 
                `min ${rules.minLength} caratteri di testo, attuale ${textLength} (${value.length} con markup)` :
                `min ${rules.minLength} caratteri, attuale ${textLength}`;
            errors.push(`La stringa è troppo corta (${lengthInfo})`);
        }

        // Validazione encoding UTF-8
        if (this.config.validateEncoding) {
            try {
                // Prova a encode/decode per verificare UTF-8 valido
                const encoded = encodeURIComponent(value);
                const decoded = decodeURIComponent(encoded);
                if (decoded !== value) {
                    errors.push('Encoding del testo non valido');
                }
            } catch (error) {
                errors.push('Caratteri non validi nel testo');
            }
        }

        // Verifica caratteri di controllo pericolosi
        if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) {
            errors.push('Contiene caratteri di controllo non validi');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida un campo singolo secondo lo schema
     * @param {*} value - Valore del campo
     * @param {string} fieldName - Nome del campo
     * @param {Object} schema - Schema di validazione
     * @returns {{isValid: boolean, errors: Array<string>}} Risultato della validazione
     */
    validateField(value, fieldName, schema) {
        const errors = [];
        const rules = schema[fieldName];

        if (!rules) {
            return { isValid: true, errors: [] };
        }

        // Controlla campo obbligatorio
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`Il campo '${fieldName}' è obbligatorio`);
            return { isValid: false, errors };
        }

        // Se il campo è vuoto e non obbligatorio, è valido
        if (!rules.required && (value === undefined || value === null || value === '')) {
            return { isValid: true, errors: [] };
        }

        // Valida tipo
        if (!this.constructor.validateType(value, rules.type)) {
            errors.push(`Il campo '${fieldName}' deve essere di tipo ${rules.type}`);
            return { isValid: false, errors };
        }

        // Validazioni specifiche per tipo
        if (rules.type === 'string') {
            const stringValidation = this.validateString(value, rules);
            errors.push(...stringValidation.errors);
        }

        if (rules.type === 'array') {
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Il campo '${fieldName}' deve contenere almeno ${rules.minLength} elementi`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Il campo '${fieldName}' può contenere al massimo ${rules.maxLength} elementi`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida una singola carta
     * @param {Object} card - Oggetto carta
     * @param {number} cardIndex - Indice della carta per i messaggi di errore
     * @returns {{isValid: boolean, errors: Array<string>, warnings: Array<string>}} Risultato della validazione
     */
    validateCard(card, cardIndex = 0) {
        const errors = [];
        const warnings = [];

        if (!card || typeof card !== 'object') {
            errors.push(`Carta ${cardIndex + 1}: deve essere un oggetto valido`);
            return { isValid: false, errors, warnings };
        }

        // Valida ogni campo secondo lo schema
        for (const [fieldName, rules] of Object.entries(this.constructor.CARD_SCHEMA)) {
            const fieldValidation = this.validateField(card[fieldName], fieldName, this.constructor.CARD_SCHEMA);
            
            if (!fieldValidation.isValid) {
                fieldValidation.errors.forEach(error => {
                    errors.push(`Carta ${cardIndex + 1}: ${error}`);
                });
            }
        }

        // Validazioni business specifiche
        if (card.icona && this.config.strictIconValidation) {
            if (!this.constructor.VALID_ICONS.includes(card.icona)) {
                warnings.push(`Carta ${cardIndex + 1}: icona '${card.icona}' non è nella lista di icone raccomandate`);
            }
        }

        // Controlla combinazioni di campi
        if (!card.testo && !card.flavor && !card.icona && !card.emoji) {
            warnings.push(`Carta ${cardIndex + 1}: la carta ha solo il titolo, potrebbe essere troppo vuota`);
        }

        // Valida classi CSS se presenti
        if (card.classe) {
            if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(card.classe)) {
                errors.push(`Carta ${cardIndex + 1}: la classe CSS '${card.classe}' non è valida`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Valida i dati completi dell'esercizio
     * @param {Object} exerciseData - Dati dell'esercizio
     * @returns {{isValid: boolean, errors: Array<string>, warnings: Array<string>, stats: Object}} Risultato della validazione completa
     */
    validateExercise(exerciseData) {
        const errors = [];
        const warnings = [];
        const stats = {
            totalCards: 0,
            validCards: 0,
            cardsWithWarnings: 0,
            uniqueTitles: 0
        };

        // Controllo base: deve essere un oggetto
        if (!exerciseData || typeof exerciseData !== 'object') {
            errors.push('I dati dell\'esercizio devono essere un oggetto JSON valido');
            return { isValid: false, errors, warnings, stats };
        }

        // Valida campi dell'esercizio secondo lo schema
        for (const [fieldName, rules] of Object.entries(this.constructor.EXERCISE_SCHEMA)) {
            const fieldValidation = this.validateField(exerciseData[fieldName], fieldName, this.constructor.EXERCISE_SCHEMA);
            
            if (!fieldValidation.isValid) {
                errors.push(...fieldValidation.errors);
            }
        }

        // Se non ha array di carte, non possiamo continuare
        if (!Array.isArray(exerciseData.carte)) {
            return { isValid: false, errors, warnings, stats };
        }

        stats.totalCards = exerciseData.carte.length;

        // Valida ogni carta
        const cardTitles = new Set();
        
        exerciseData.carte.forEach((card, index) => {
            const cardValidation = this.validateCard(card, index);
            
            if (cardValidation.isValid) {
                stats.validCards++;
            }

            if (cardValidation.warnings.length > 0) {
                stats.cardsWithWarnings++;
                warnings.push(...cardValidation.warnings);
            }

            errors.push(...cardValidation.errors);

            // Controlla duplicati nei titoli
            if (card && card.titolo) {
                if (cardTitles.has(card.titolo)) {
                    warnings.push(`Titolo duplicato trovato: "${card.titolo}"`);
                } else {
                    cardTitles.add(card.titolo);
                }
            }
        });

        stats.uniqueTitles = cardTitles.size;

        // Validazioni generali del deck
        if (stats.totalCards > 100) {
            warnings.push(`Il deck ha ${stats.totalCards} carte, potrebbe essere troppo grande per l'uso pratico`);
        }

        if (stats.totalCards < 4) {
            warnings.push(`Il deck ha solo ${stats.totalCards} carte, potrebbe essere troppo piccolo per essere utile`);
        }

        // Rapporto validità
        const validityRatio = stats.totalCards > 0 ? (stats.validCards / stats.totalCards) * 100 : 0;
        if (validityRatio < 80) {
            errors.push(`Solo ${validityRatio.toFixed(1)}% delle carte sono valide, il deck potrebbe non funzionare correttamente`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats: {
                ...stats,
                validityRatio: validityRatio.toFixed(1)
            }
        };
    }

    /**
     * Valida un file JSON parsato
     * @param {string} jsonString - String JSON da validare e parsare
     * @returns {{isValid: boolean, data?: Object, errors: Array<string>, warnings: Array<string>, stats?: Object}} Risultato completo
     */
    validateJSON(jsonString) {
        let data;

        // Prima prova a parsare il JSON
        try {
            data = JSON.parse(jsonString);
        } catch (error) {
            return {
                isValid: false,
                errors: [`JSON non valido: ${error.message}`],
                warnings: [],
                stats: null
            };
        }

        // Poi valida il contenuto
        const validation = this.validateExercise(data);

        return {
            ...validation,
            data: validation.isValid ? data : undefined
        };
    }

    /**
     * Genera un report dettagliato di validazione
     * @param {Object} validationResult - Risultato della validazione
     * @returns {string} Report formattato
     */
    generateReport(validationResult) {
        const lines = [];
        
        if (validationResult.isValid) {
            lines.push('✅ VALIDAZIONE COMPLETATA CON SUCCESSO\n');
        } else {
            lines.push('❌ VALIDAZIONE FALLITA\n');
        }

        if (validationResult.stats) {
            lines.push('📊 STATISTICHE:');
            lines.push(`   • Carte totali: ${validationResult.stats.totalCards}`);
            lines.push(`   • Carte valide: ${validationResult.stats.validCards}`);
            lines.push(`   • Titoli unici: ${validationResult.stats.uniqueTitles}`);
            lines.push(`   • Tasso di validità: ${validationResult.stats.validityRatio}%`);
            lines.push('');
        }

        if (validationResult.errors.length > 0) {
            lines.push('🔴 ERRORI:');
            validationResult.errors.forEach(error => {
                lines.push(`   • ${error}`);
            });
            lines.push('');
        }

        if (validationResult.warnings.length > 0) {
            lines.push('🟡 AVVERTIMENTI:');
            validationResult.warnings.forEach(warning => {
                lines.push(`   • ${warning}`);
            });
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Metodo di convenienza per validazione completa con report
     * @param {string} jsonString - JSON string da validare
     * @returns {{result: Object, report: string}} Risultato con report
     */
    validateWithReport(jsonString) {
        const result = this.validateJSON(jsonString);
        const report = this.generateReport(result);

        return { result, report };
    }
}
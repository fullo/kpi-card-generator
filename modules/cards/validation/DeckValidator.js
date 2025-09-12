import { CardRenderer } from '../rendering/CardRenderer.js';
import { ValidationEngine } from '../../validation/core/ValidationEngine.js';
import { CLIAdapter } from '../../validation/adapters/CLIAdapter.js';

/**
 * DeckValidator - Backwards compatibility wrapper for ValidationEngine
 * 
 * DEPRECATED: This class is now a thin wrapper around the new ValidationEngine.
 * For new code, use ValidationEngine directly or the appropriate platform adapter.
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
     * Schema di validazione per i dati dell'esercizio (solo schema inglese)
     */
    static EXERCISE_SCHEMA = {
        title: { required: true, type: 'string', maxLength: 200 },
        subtitle: { required: false, type: 'string', maxLength: 300 },
        deckIcon: { required: false, type: 'string', maxLength: 10 },
        cardBackIcon: { required: false, type: 'string', maxLength: 10 },
        copyright: { required: false, type: 'string', maxLength: 500 },
        cards: { required: false, type: 'array', minLength: 1 }
    };

    /**
     * Schema di validazione per una singola carta (solo schema inglese)
     */
    static CARD_SCHEMA = {
        title: { required: false, type: 'string', maxLength: 200 },
        headerIcon: { required: false, type: 'string', maxLength: 10 },
        heroImage: { required: false, type: 'string', maxLength: 10 },
        type: { required: false, type: 'string', maxLength: 255 },
        description: { required: false, type: 'string', maxLength: 2000 },
        flavorText: { required: false, type: 'string', maxLength: 200 },
        styleClass: { required: false, type: 'string', maxLength: 100 }
    };

    /**
     * Valida se una stringa contiene emoji Unicode valide
     * @param {string} str - Stringa da validare
     * @returns {boolean} True se contiene solo emoji valide
     */
    static isValidEmoji(str) {
        if (!str || typeof str !== 'string') return true; // Campi vuoti sono OK
        
        // Simple validation: allow up to 3 Unicode characters (covers all emoji, symbols, text)
        const trimmed = str.trim();
        return trimmed.length <= 3;
    }

    /**
     * Quick validation for API and web components
     * @param {Object} deck - Deck object to validate
     * @returns {Object} { isValid: boolean, errors: Array }
     */
    static validateDeckQuick(deck) {
        const errors = [];

        // Validate deck title (required)
        if (!deck.title || typeof deck.title !== 'string' || deck.title.trim().length === 0) {
            errors.push({
                field: 'title',
                message: 'Deck title is required',
                value: deck.title
            });
        } else if (deck.title.length > 200) {
            errors.push({
                field: 'title', 
                message: 'Title must be less than 200 characters',
                value: deck.title
            });
        }

        // Validate optional fields
        if (deck.subtitle && deck.subtitle.length > 300) {
            errors.push({
                field: 'subtitle',
                message: 'Subtitle must be less than 300 characters', 
                value: deck.subtitle
            });
        }

        if (deck.deckIcon && deck.deckIcon.length > 10) {
            errors.push({
                field: 'deckIcon',
                message: 'Deck icon must be less than 10 characters',
                value: deck.deckIcon
            });
        }

        if (deck.cardBackIcon && deck.cardBackIcon.length > 10) {
            errors.push({
                field: 'cardBackIcon', 
                message: 'Card back icon must be less than 10 characters',
                value: deck.cardBackIcon
            });
        }

        if (deck.copyright && deck.copyright.length > 500) {
            errors.push({
                field: 'copyright',
                message: 'Copyright must be less than 500 characters',
                value: deck.copyright  
            });
        }

        // Validate cards array
        if (deck.cards && Array.isArray(deck.cards)) {
            deck.cards.forEach((card, index) => {
                const cardErrors = this.validateCardQuick(card);
                cardErrors.errors.forEach(error => {
                    errors.push({
                        field: `cards.${index}.${error.field}`,
                        message: error.message,
                        value: error.value
                    });
                });
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Quick validation for individual cards
     * @param {Object} card - Card object to validate
     * @returns {Object} { isValid: boolean, errors: Array }
     */
    static validateCardQuick(card) {
        const errors = [];

        // Validate card title (not required but if present, check length)
        if (card.title && card.title.length > 200) {
            errors.push({
                field: 'title',
                message: 'Card title must be less than 200 characters',
                value: card.title
            });
        }

        // Validate optional fields
        if (card.headerIcon && card.headerIcon.length > 10) {
            errors.push({
                field: 'headerIcon',
                message: 'Header icon must be less than 10 characters',
                value: card.headerIcon
            });
        }

        if (card.heroImage && card.heroImage.length > 10) {
            errors.push({
                field: 'heroImage',
                message: 'Hero image must be less than 10 characters', 
                value: card.heroImage
            });
        }

        if (card.type && card.type.length > 255) {
            errors.push({
                field: 'type',
                message: 'Card type must be less than 255 characters',
                value: card.type
            });
        }

        if (card.description && card.description.length > 2000) {
            errors.push({
                field: 'description',
                message: 'Description must be less than 2000 characters',
                value: card.description
            });
        }

        if (card.flavorText && card.flavorText.length > 200) {
            errors.push({
                field: 'flavorText',
                message: 'Flavor text must be less than 200 characters',
                value: card.flavorText
            });
        }

        if (card.styleClass && card.styleClass.length > 100) {
            errors.push({
                field: 'styleClass',
                message: 'Style class must be less than 100 characters',
                value: card.styleClass
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

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

        // Note: card title is not required per CARD_SCHEMA (required: false)
        // This matches the schema definition and validateCardQuick behavior

        // Valida campi presenti secondo lo schema inglese
        for (const [fieldName, rules] of Object.entries(this.constructor.CARD_SCHEMA)) {
            if (card.hasOwnProperty(fieldName)) {
                const fieldValidation = this.validateField(card[fieldName], fieldName, this.constructor.CARD_SCHEMA);
                
                if (!fieldValidation.isValid) {
                    fieldValidation.errors.forEach(error => {
                        errors.push(`Carta ${cardIndex + 1}: ${error}`);
                    });
                }
            }
        }

        // Validazioni business specifiche per icone/emoji (schema inglese)
        if (card.headerIcon && this.config.strictIconValidation) {
            if (!this.constructor.isValidEmoji(card.headerIcon)) {
                warnings.push(`Carta ${cardIndex + 1}: headerIcon '${card.headerIcon}' non è un emoji Unicode valido`);
            }
        }

        if (card.heroImage && this.config.strictIconValidation) {
            if (!this.constructor.isValidEmoji(card.heroImage)) {
                warnings.push(`Carta ${cardIndex + 1}: heroImage '${card.heroImage}' non è un emoji Unicode valido`);
            }
        }

        // Controlla combinazioni di campi per contenuto minimo
        const hasContent = card.description || card.flavorText || card.headerIcon || card.heroImage;
        if (!hasContent) {
            warnings.push(`Carta ${cardIndex + 1}: la carta ha solo il titolo, potrebbe essere troppo vuota`);
        }

        // Valida classi CSS se presenti (schema inglese)
        if (card.styleClass) {
            if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(card.styleClass)) {
                errors.push(`Carta ${cardIndex + 1}: la styleClass CSS '${card.styleClass}' non è valida`);
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
    async validateExercise(exerciseData) {
        try {
            // Use the new ValidationEngine through CLIAdapter
            const result = await CLIAdapter.validateDeck(exerciseData, {
                context: 'deckvalidator_compatibility',
                // Configure for backwards compatibility
                sanitization: { enabled: false }, // DeckValidator didn't sanitize
                security: { enabled: false, strict: false } // DeckValidator didn't do security checks
            });

            // Convert new format to old format for backwards compatibility
            return {
                isValid: result.isValid,
                errors: result.errors.map(e => e.message || e),
                warnings: result.warnings.map(w => w.message || w),
                stats: {
                    totalCards: result.stats?.cardCount || 0,
                    validCards: result.stats?.cardCount || 0, // Assume all cards valid if no errors
                    cardsWithWarnings: result.warnings.length,
                    uniqueTitles: result.stats?.cardCount || 0, // Simplified
                    validityRatio: result.isValid ? '100.0' : '0.0'
                }
            };
        } catch (error) {
            // Fallback to legacy implementation if ValidationEngine fails
            console.warn('ValidationEngine failed, falling back to legacy validation:', error.message);
            return this._legacyValidateExercise(exerciseData);
        }
    }

    /**
     * Legacy validation implementation (fallback)
     * @private
     */
    _legacyValidateExercise(exerciseData) {
        const errors = [];
        const warnings = [];
        const stats = {
            totalCards: 0,
            validCards: 0,
            cardsWithWarnings: 0,
            uniqueTitles: 0
        };

        // Basic validation: must be an object
        if (!exerciseData || typeof exerciseData !== 'object') {
            errors.push('Exercise data must be a valid JSON object');
            return { isValid: false, errors, warnings, stats };
        }

        // Verify title exists (English schema only)
        if (!exerciseData.title) {
            errors.push('Deck must have a title (field "title")');
            return { isValid: false, errors, warnings, stats };
        }

        // Valida i campi presenti nell'esercizio secondo lo schema inglese
        for (const [fieldName, rules] of Object.entries(this.constructor.EXERCISE_SCHEMA)) {
            if (exerciseData.hasOwnProperty(fieldName)) {
                const fieldValidation = this.validateField(exerciseData[fieldName], fieldName, this.constructor.EXERCISE_SCHEMA);
                
                if (!fieldValidation.isValid) {
                    errors.push(...fieldValidation.errors);
                }
            }
        }

        // Solo schema inglese per le carte
        const cardsArray = exerciseData.cards;
        
        // If cards array is missing, we cannot continue
        if (!Array.isArray(cardsArray)) {
            errors.push('Deck must contain an array of cards (field "cards")');
            return { isValid: false, errors, warnings, stats };
        }

        stats.totalCards = cardsArray.length;

        // Valida ogni carta
        const cardTitles = new Set();
        
        cardsArray.forEach((card, index) => {
            const cardValidation = this.validateCard(card, index);
            
            if (cardValidation.isValid) {
                stats.validCards++;
            }

            if (cardValidation.warnings.length > 0) {
                stats.cardsWithWarnings++;
                warnings.push(...cardValidation.warnings);
            }

            errors.push(...cardValidation.errors);

            // Controlla duplicati nei titoli (supporta schema inglese e italiano)
            const cardTitle = card && (card.title || card.titolo);
            if (cardTitle) {
                if (cardTitles.has(cardTitle)) {
                    warnings.push(`Titolo duplicato trovato: "${cardTitle}"`);
                } else {
                    cardTitles.add(cardTitle);
                }
            }
        });

        stats.uniqueTitles = cardTitles.size;

        // Validazioni generali del deck
        if (stats.totalCards > 100) {
            warnings.push(`Deck has ${stats.totalCards} cards, might be too large for practical use`);
        }

        if (stats.totalCards < 4) {
            warnings.push(`Deck has only ${stats.totalCards} cards, might be too small to be useful`);
        }

        // Rapporto validità - assicuriamoci che non sia undefined
        const validityRatio = stats.totalCards > 0 ? (stats.validCards / stats.totalCards) * 100 : 0;
        if (validityRatio < 80 && stats.totalCards > 0) {
            errors.push(`Solo ${validityRatio.toFixed(1)}% delle carte sono valide, il deck potrebbe non funzionare correttamente`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats: {
                ...stats,
                validityRatio: stats.totalCards > 0 ? validityRatio.toFixed(1) : '0.0'
            }
        };
    }

    /**
     * Valida un file JSON parsato
     * @param {string} jsonString - String JSON da validare e parsare
     * @returns {{isValid: boolean, data?: Object, errors: Array<string>, warnings: Array<string>, stats?: Object}} Risultato completo
     */
    async validateJSON(jsonString) {
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
        const validation = await this.validateExercise(data);

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
    async validateWithReport(jsonString) {
        const result = await this.validateJSON(jsonString);
        const report = this.generateReport(result);

        return { result, report };
    }
}
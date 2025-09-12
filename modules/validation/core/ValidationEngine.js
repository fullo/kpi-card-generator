import { ValidationError } from '../ValidationError.js';
import { SecurityRules } from './SecurityRules.js';
import { SanitizationRules } from './SanitizationRules.js';

/**
 * ValidationEngine - Core platform-agnostic validation orchestrator
 * 
 * Provides a unified interface for all validation operations across CLI, API, and Web
 * Coordinates security, sanitization, schema, and business rule validation
 */
export class ValidationEngine {
    
    /**
     * Default validation options
     */
    static getDefaultOptions() {
        return {
            // Security validation
            security: {
                enabled: true,
                strict: false // If true, fails on warnings too
            },
            
            // Sanitization options
            sanitization: {
                enabled: true,
                allowedTags: ['strong', 'em', 'u', 'br', 'p'],
                allowedAttributes: [],
                stripDisallowed: true
            },
            
            // Schema validation
            schema: {
                enabled: true,
                requireTitle: true,
                requireCards: false, // Cards array can be empty
                maxCards: 100,
                maxTitleLength: 100,
                maxDescriptionLength: 500
            },
            
            // Business rules
            business: {
                enabled: true,
                allowDuplicateTitles: true, // Allow duplicate card titles
                requireUniqueIds: false // Don't require unique card IDs
            },
            
            // Context information
            context: 'unknown',
            platform: 'unknown' // 'cli', 'api', 'web'
        };
    }

    /**
     * Validate and optionally sanitize a complete deck
     * @param {Object} deckData - Deck data to validate
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} - Validation result with sanitized data
     */
    static async validateDeck(deckData, options = {}) {
        const opts = { ...this.getDefaultOptions(), ...options };
        const errors = [];
        const warnings = [];
        let sanitizedData = deckData;

        // Step 1: Basic structure validation
        if (!deckData || typeof deckData !== 'object') {
            errors.push(ValidationError.schema('Invalid deck data structure'));
            return {
                isValid: false,
                errors,
                warnings,
                sanitizedData: null
            };
        }

        // Step 2: Security validation (if enabled)
        if (opts.security.enabled) {
            try {
                const securityResult = SecurityRules.validateDeckSecurity(deckData, {
                    context: opts.context
                });
                
                errors.push(...securityResult.errors);
                warnings.push(...securityResult.warnings);
                
                // If security validation fails and we're in strict mode, stop here
                if (!securityResult.isValid && opts.security.strict) {
                    return {
                        isValid: false,
                        errors,
                        warnings,
                        sanitizedData: null
                    };
                }
            } catch (error) {
                errors.push(ValidationError.security(`Security validation failed: ${error.message}`));
            }
        }

        // Step 3: Sanitization (if enabled and security passed or non-strict)
        if (opts.sanitization.enabled && (errors.length === 0 || !opts.security.strict)) {
            try {
                sanitizedData = await SanitizationRules.sanitizeDeck(deckData, opts.sanitization);
            } catch (error) {
                errors.push(ValidationError.sanitization(`Sanitization failed: ${error.message}`));
                sanitizedData = deckData; // Keep original if sanitization fails
            }
        }

        // Step 4: Schema validation on sanitized data
        if (opts.schema.enabled) {
            const schemaResult = this.validateDeckSchema(sanitizedData, opts.schema);
            errors.push(...schemaResult.errors);
            warnings.push(...schemaResult.warnings);
        }

        // Step 5: Business rules validation
        if (opts.business.enabled) {
            const businessResult = this.validateDeckBusinessRules(sanitizedData, opts.business);
            errors.push(...businessResult.errors);
            warnings.push(...businessResult.warnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sanitizedData,
            stats: this.calculateDeckStats(sanitizedData)
        };
    }

    /**
     * Validate deck schema structure
     * @param {Object} deckData - Deck to validate
     * @param {Object} schemaOptions - Schema validation options
     * @returns {Object} - Validation result
     */
    static validateDeckSchema(deckData, schemaOptions = {}) {
        const errors = [];
        const warnings = [];

        // Check required fields
        if (schemaOptions.requireTitle) {
            const title = deckData.title || deckData.titolo;
            if (!title || typeof title !== 'string' || !title.trim()) {
                errors.push(ValidationError.schema('Deck title is required', 'title'));
            } else if (title.length > schemaOptions.maxTitleLength) {
                errors.push(ValidationError.schema(
                    `Deck title too long (max ${schemaOptions.maxTitleLength} characters)`,
                    'title'
                ));
            }
        }

        // Validate cards array
        const cards = deckData.cards || deckData.carte || [];
        if (schemaOptions.requireCards && (!Array.isArray(cards) || cards.length === 0)) {
            errors.push(ValidationError.schema('Deck must contain at least one card', 'cards'));
        }

        if (Array.isArray(cards)) {
            if (cards.length > schemaOptions.maxCards) {
                errors.push(ValidationError.schema(
                    `Too many cards (max ${schemaOptions.maxCards})`,
                    'cards'
                ));
            }

            // Validate each card
            cards.forEach((card, index) => {
                const cardResult = this.validateCardSchema(card, schemaOptions, index);
                errors.push(...cardResult.errors);
                warnings.push(...cardResult.warnings);
            });
        }

        // Validate optional fields
        const subtitle = deckData.subtitle || deckData.sottotitolo;
        if (subtitle && typeof subtitle !== 'string') {
            errors.push(ValidationError.schema('Deck subtitle must be a string', 'subtitle'));
        }

        const deckIcon = deckData.deckIcon || deckData.icona_esercizio;
        if (deckIcon && !SanitizationRules.isValidEmoji(deckIcon)) {
            warnings.push(ValidationError.schema('Deck icon may not display correctly', 'deckIcon', {
                severity: 'warning'
            }));
        }

        return { errors, warnings };
    }

    /**
     * Validate individual card schema
     * @param {Object} card - Card to validate
     * @param {Object} schemaOptions - Schema validation options
     * @param {number} cardIndex - Card index for error reporting
     * @returns {Object} - Validation result
     */
    static validateCardSchema(card, schemaOptions, cardIndex = 0) {
        const errors = [];
        const warnings = [];

        if (!card || typeof card !== 'object') {
            errors.push(ValidationError.schema(
                `Card ${cardIndex + 1} has invalid structure`,
                `cards[${cardIndex}]`
            ));
            return { errors, warnings };
        }

        // Validate text fields
        const title = card.title || card.titolo;
        if (title && title.length > schemaOptions.maxTitleLength) {
            errors.push(ValidationError.schema(
                `Card ${cardIndex + 1} title too long (max ${schemaOptions.maxTitleLength} characters)`,
                `cards[${cardIndex}].title`
            ));
        }

        const description = card.description || card.testo;
        if (description && description.length > schemaOptions.maxDescriptionLength) {
            errors.push(ValidationError.schema(
                `Card ${cardIndex + 1} description too long (max ${schemaOptions.maxDescriptionLength} characters)`,
                `cards[${cardIndex}].description`
            ));
        }

        // Validate emoji fields
        const headerIcon = card.headerIcon || card.icona;
        if (headerIcon && !SanitizationRules.isValidEmoji(headerIcon)) {
            warnings.push(ValidationError.schema(
                `Card ${cardIndex + 1} header icon may not display correctly`,
                `cards[${cardIndex}].headerIcon`,
                { severity: 'warning' }
            ));
        }

        const heroImage = card.heroImage || card.emoji;
        if (heroImage && !SanitizationRules.isValidEmoji(heroImage)) {
            warnings.push(ValidationError.schema(
                `Card ${cardIndex + 1} hero image may not display correctly`,
                `cards[${cardIndex}].heroImage`,
                { severity: 'warning' }
            ));
        }

        // Validate CSS class
        const styleClass = card.styleClass || card.classe;
        if (styleClass && !SanitizationRules.isValidCSSClass(styleClass)) {
            warnings.push(ValidationError.schema(
                `Card ${cardIndex + 1} style class may not work correctly`,
                `cards[${cardIndex}].styleClass`,
                { severity: 'warning' }
            ));
        }

        return { errors, warnings };
    }

    /**
     * Validate business rules for deck
     * @param {Object} deckData - Deck to validate
     * @param {Object} businessOptions - Business rules options
     * @returns {Object} - Validation result
     */
    static validateDeckBusinessRules(deckData, businessOptions = {}) {
        const errors = [];
        const warnings = [];

        const cards = deckData.cards || deckData.carte || [];
        
        if (!businessOptions.allowDuplicateTitles && Array.isArray(cards)) {
            // Check for duplicate card titles
            const titleCounts = new Map();
            cards.forEach((card, index) => {
                const title = card.title || card.titolo || '';
                if (title.trim()) {
                    const normalizedTitle = title.trim().toLowerCase();
                    if (!titleCounts.has(normalizedTitle)) {
                        titleCounts.set(normalizedTitle, []);
                    }
                    titleCounts.get(normalizedTitle).push(index + 1);
                }
            });

            titleCounts.forEach((indices, title) => {
                if (indices.length > 1) {
                    warnings.push(ValidationError.business(
                        `Duplicate card title "${title}" found in cards: ${indices.join(', ')}`,
                        'cards',
                        { severity: 'warning' }
                    ));
                }
            });
        }

        return { errors, warnings };
    }

    /**
     * Quick validation for high-performance scenarios
     * @param {Object} data - Data to validate
     * @param {Object} options - Validation options
     * @returns {boolean} - True if data passes quick validation
     */
    static quickValidate(data, options = {}) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Quick security check
        const dataString = JSON.stringify(data);
        if (!SecurityRules.quickSecurityCheck(dataString)) {
            return false;
        }

        // Quick schema check
        const title = data.title || data.titolo;
        if (!title || typeof title !== 'string' || !title.trim()) {
            return false;
        }

        return true;
    }

    /**
     * Validate file upload content for security
     * @param {string} fileContent - Content of uploaded file
     * @param {string} mimeType - MIME type of file
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    static validateFileUploadSecurity(fileContent, mimeType, options = {}) {
        return SecurityRules.validateFileUploadSecurity(fileContent, mimeType, options);
    }

    /**
     * Calculate statistics about the deck
     * @param {Object} deckData - Deck data
     * @returns {Object} - Deck statistics
     */
    static calculateDeckStats(deckData) {
        if (!deckData || typeof deckData !== 'object') {
            return {
                cardCount: 0,
                hasTitle: false,
                hasSubtitle: false,
                estimatedPages: 0,
                categories: []
            };
        }

        const cards = deckData.cards || deckData.carte || [];
        const cardCount = Array.isArray(cards) ? cards.length : 0;
        
        // Calculate categories from card types
        const categories = new Set();
        if (Array.isArray(cards)) {
            cards.forEach(card => {
                const type = card.type || card.tipo;
                if (type && typeof type === 'string') {
                    categories.add(type);
                }
            });
        }

        // Estimate pages (8 cards per page is default)
        const estimatedPages = Math.ceil(cardCount / 8);

        return {
            cardCount,
            hasTitle: !!(deckData.title || deckData.titolo),
            hasSubtitle: !!(deckData.subtitle || deckData.sottotitolo),
            estimatedPages,
            categories: Array.from(categories).sort()
        };
    }
}
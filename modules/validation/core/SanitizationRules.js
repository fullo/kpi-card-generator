import { ValidationError } from '../ValidationError.js';

/**
 * SanitizationRules - Platform-agnostic HTML sanitization
 * 
 * Provides consistent HTML cleaning across CLI, API, and Web contexts
 * Handles both Node.js (DOMPurify + JSDOM) and browser environments
 */
export class SanitizationRules {
    
    /**
     * Initialize DOMPurify based on environment
     */
    static async initializeDOMPurify() {
        if (typeof window !== 'undefined') {
            // Browser environment
            if (window.DOMPurify) {
                return window.DOMPurify;
            }
            throw new Error('DOMPurify not available in browser environment');
        } else {
            // Node.js environment
            try {
                const { JSDOM } = await import('jsdom');
                const createDOMPurify = await import('isomorphic-dompurify');
                
                const window = new JSDOM('').window;
                return createDOMPurify.default(window);
            } catch (error) {
                throw new Error('DOMPurify dependencies not available in Node.js environment');
            }
        }
    }

    /**
     * Fallback sanitization for environments without DOMPurify
     * Basic but safe HTML stripping
     */
    static fallbackSanitization(input) {
        if (typeof input !== 'string') return '';
        if (!input.trim()) return '';

        // Remove all HTML tags except safe ones
        let sanitized = input
            // Remove dangerous content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:text\/html/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
            .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
            .replace(/<embed[^>]*>/gi, '')
            .replace(/<link[^>]*>/gi, '')
            .replace(/<meta[^>]*>/gi, '');

        // Keep only safe tags
        const allowedTags = ['strong', 'em', 'u', 'br', 'p'];
        const tagPattern = new RegExp(`<(?!\\/?(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
        sanitized = sanitized.replace(tagPattern, '');

        return sanitized;
    }

    /**
     * Sanitize HTML content using DOMPurify or fallback
     * @param {string} input - HTML content to sanitize
     * @param {Object} options - Sanitization options
     * @returns {Promise<string>} - Sanitized HTML
     */
    static async sanitizeHTML(input, options = {}) {
        if (typeof input !== 'string') return '';
        if (!input.trim()) return '';

        const config = {
            ALLOWED_TAGS: options.allowedTags || ['strong', 'em', 'u', 'br', 'p'],
            ALLOWED_ATTR: options.allowedAttributes || [],
            KEEP_CONTENT: true,
            RETURN_DOM: false,
            RETURN_DOM_FRAGMENT: false,
            RETURN_DOM_IMPORT: false,
            ...options.dompurifyConfig
        };

        try {
            const DOMPurify = await this.initializeDOMPurify();
            return DOMPurify.sanitize(input, config);
        } catch (error) {
            // Fall back to basic sanitization
            console.warn('DOMPurify not available, using fallback sanitization:', error.message);
            return this.fallbackSanitization(input);
        }
    }

    /**
     * Synchronous sanitization using fallback method only
     * Useful for performance-critical scenarios
     */
    static sanitizeHTMLSync(input, options = {}) {
        return this.fallbackSanitization(input);
    }

    /**
     * Sanitize attribute values (always synchronous)
     */
    static sanitizeAttribute(input) {
        if (typeof input !== 'string') return '';
        
        // Basic HTML entity escaping for attributes
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Validate and sanitize URLs
     */
    static sanitizeURL(input) {
        if (typeof input !== 'string') return '';
        
        // Block dangerous protocols
        if (/^(javascript|data|vbscript):/i.test(input)) {
            return '';
        }
        
        // Only allow http, https, and relative URLs
        if (input.startsWith('//') || input.startsWith('/')) {
            return this.sanitizeAttribute(input);
        }
        
        // Check if it's a valid HTTP/HTTPS URL (including localhost)
        try {
            const url = new URL(input);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return this.sanitizeAttribute(input);
            }
        } catch (e) {
            // Not a valid URL
        }
        
        // Fallback: simple validation
        if (/^https?:\/\/[^\s<>'"]+$/i.test(input)) {
            return this.sanitizeAttribute(input);
        }
        
        return '';
    }

    /**
     * Sanitize file names for safe storage
     */
    static sanitizeFileName(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[^\w.-]/g, '') // Only alphanumeric, dots, dashes, underscores
            .replace(/\.\./g, '') // Remove path traversal attempts
            .replace(/^\.+/, '') // Remove leading dots
            .substring(0, 255); // Limit length
    }

    /**
     * Validate emoji/icon input
     */
    static isValidEmoji(input) {
        if (typeof input !== 'string') return false;
        if (input.length === 0) return true; // Empty is OK
        if (input.length > 10) return false; // Too long
        
        // Allow common emoji, symbols, and simple characters
        const emojiRegex = /^[\p{Emoji}\p{Symbol}\p{Punctuation}0-9a-zA-Z]*$/u;
        return emojiRegex.test(input);
    }

    /**
     * Validate CSS class name
     */
    static isValidCSSClass(input) {
        if (typeof input !== 'string') return false;
        if (input.length === 0) return true; // Empty is OK
        if (input.length > 50) return false; // Too long
        
        // CSS class naming convention
        const cssClassRegex = /^[a-zA-Z_][\w-]*$/;
        return cssClassRegex.test(input);
    }

    /**
     * Sanitize a card object with all its fields
     * @param {Object} card - Card data to sanitize
     * @param {Object} options - Sanitization options
     * @returns {Promise<Object>} - Sanitized card data
     */
    static async sanitizeCard(card, options = {}) {
        if (!card || typeof card !== 'object') {
            throw ValidationError.sanitization('Invalid card data');
        }

        // Start with a copy of the original card to preserve all fields
        const sanitized = { ...card };

        // Sanitize text fields
        const textFields = {
            title: 'title',
            titolo: 'title', // Italian fallback
            description: 'description', 
            testo: 'description', // Italian fallback
            flavorText: 'flavorText',
            flavor: 'flavorText', // Italian fallback
            type: 'type',
            tipo: 'type' // Italian fallback
        };

        for (const [sourceField, targetField] of Object.entries(textFields)) {
            if (card[sourceField]) {
                sanitized[targetField] = await this.sanitizeHTML(
                    card[sourceField], 
                    options
                );
                // Limit field lengths
                if (targetField === 'title') {
                    sanitized[targetField] = sanitized[targetField].substring(0, 100);
                } else if (targetField === 'description') {
                    sanitized[targetField] = sanitized[targetField].substring(0, 500);
                } else if (targetField === 'flavorText') {
                    sanitized[targetField] = sanitized[targetField].substring(0, 200);
                } else if (targetField === 'type') {
                    sanitized[targetField] = sanitized[targetField].substring(0, 50);
                }
            }
        }

        // Sanitize attribute fields
        const attributeFields = {
            headerIcon: 'headerIcon',
            icona: 'headerIcon', // Italian fallback
            heroImage: 'heroImage', 
            emoji: 'heroImage', // Italian fallback
            styleClass: 'styleClass',
            classe: 'styleClass' // Italian fallback
        };

        for (const [sourceField, targetField] of Object.entries(attributeFields)) {
            if (card[sourceField]) {
                if (targetField === 'styleClass') {
                    if (this.isValidCSSClass(card[sourceField])) {
                        sanitized[targetField] = card[sourceField].substring(0, 50);
                    }
                } else {
                    // For icons and emojis
                    if (this.isValidEmoji(card[sourceField])) {
                        sanitized[targetField] = card[sourceField].substring(0, 10);
                    }
                }
            }
        }

        return sanitized;
    }

    /**
     * Sanitize a deck object with all its cards
     * @param {Object} deck - Deck data to sanitize
     * @param {Object} options - Sanitization options
     * @returns {Promise<Object>} - Sanitized deck data
     */
    static async sanitizeDeck(deck, options = {}) {
        if (!deck || typeof deck !== 'object') {
            throw ValidationError.sanitization('Invalid deck data');
        }

        // Start with a copy of the original deck to preserve all fields
        const sanitized = { ...deck };

        // Sanitize deck-level text fields
        if (deck.title || deck.titolo) {
            sanitized.title = await this.sanitizeHTML(
                deck.title || deck.titolo, 
                options
            );
            sanitized.title = sanitized.title.substring(0, 100);
        }

        if (deck.subtitle || deck.sottotitolo) {
            sanitized.subtitle = await this.sanitizeHTML(
                deck.subtitle || deck.sottotitolo, 
                options
            );
            sanitized.subtitle = sanitized.subtitle.substring(0, 200);
        }

        if (deck.copyright) {
            sanitized.copyright = await this.sanitizeHTML(
                deck.copyright, 
                options
            );
            sanitized.copyright = sanitized.copyright.substring(0, 200);
        }

        // Sanitize deck-level attributes
        if (deck.deckIcon || deck.icona_esercizio) {
            const icon = deck.deckIcon || deck.icona_esercizio;
            if (this.isValidEmoji(icon)) {
                sanitized.deckIcon = icon.substring(0, 10);
            }
        }

        if (deck.cardBackIcon || deck.icona_retro) {
            const icon = deck.cardBackIcon || deck.icona_retro;
            if (this.isValidEmoji(icon)) {
                sanitized.cardBackIcon = icon.substring(0, 10);
            }
        }

        // Sanitize cards array
        const cards = deck.cards || deck.carte || [];
        if (Array.isArray(cards)) {
            sanitized.cards = [];
            for (const card of cards.slice(0, 100)) { // Max 100 cards per deck
                try {
                    const sanitizedCard = await this.sanitizeCard(card, options);
                    sanitized.cards.push(sanitizedCard);
                } catch (error) {
                    // Skip invalid cards but don't fail entire deck
                    console.warn('Skipping invalid card during sanitization:', error.message);
                }
            }
        } else {
            sanitized.cards = [];
        }

        return sanitized;
    }
}
import { ValidationError } from '../ValidationError.js';

/**
 * SecurityRules - Platform-agnostic security validation
 * 
 * Extracted from api/middleware/securityValidation.js
 * Works across CLI, API, and Web contexts
 */
export class SecurityRules {
    
    /**
     * Advanced threat patterns that are universally dangerous
     * These patterns are carefully crafted to minimize false positives
     */
    static getAdvancedThreatPatterns() {
        return [
            // Only check for the most critical and unambiguous threats
            // Advanced XSS techniques  
            /javascript:\s*void/i,
            /fromcharcode/i,
            /\\[rn].*(<|&lt;)script/i,
            
            // Prototype pollution (very specific patterns)
            /__proto__/i,
            /\bthis\s*\[\s*['"]constructor['"]]/i,
            
            // Only very specific server-side injection patterns
            /\brequire\s*\(\s*['"][^'"]*['"]\s*\)/i, // require("module") pattern
            /\bimport\s*\(\s*['"][^'"]*['"]\s*\)/i,  // import("module") pattern
            /\beval\s*\(/i,  // Keep eval as it's almost never legitimate in card content
        ];
    }

    /**
     * Check content for advanced security threats
     * @param {string} content - Content to validate
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    static validateSecurity(content, options = {}) {
        const errors = [];
        const warnings = [];

        if (typeof content !== 'string') {
            errors.push(ValidationError.security('Content must be a string'));
            return { isValid: false, errors, warnings };
        }

        // Check for advanced threats
        const threatPatterns = this.getAdvancedThreatPatterns();
        for (const pattern of threatPatterns) {
            if (pattern.test(content)) {
                errors.push(ValidationError.security(
                    'Content contains patterns that cannot be processed safely',
                    { 
                        context: options.context,
                        details: { pattern: pattern.source }
                    }
                ));
                break; // Stop at first threat found
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate an entire deck for security issues
     * @param {Object} deckData - Deck to validate
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    static validateDeckSecurity(deckData, options = {}) {
        const errors = [];
        const warnings = [];

        if (!deckData || typeof deckData !== 'object') {
            errors.push(ValidationError.security('Invalid deck data structure'));
            return { isValid: false, errors, warnings };
        }

        // Convert entire deck to string for comprehensive security check
        const deckString = JSON.stringify(deckData);
        const securityResult = this.validateSecurity(deckString, {
            ...options,
            context: 'deck'
        });

        errors.push(...securityResult.errors);
        warnings.push(...securityResult.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate individual card for security issues
     * @param {Object} cardData - Card to validate
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    static validateCardSecurity(cardData, options = {}) {
        const errors = [];
        const warnings = [];

        if (!cardData || typeof cardData !== 'object') {
            errors.push(ValidationError.security('Invalid card data structure'));
            return { isValid: false, errors, warnings };
        }

        // Check individual card fields that are most likely to contain threats
        const dangerousFields = [
            'title', 'description', 'flavorText', 
            'titolo', 'testo', 'flavor' // Support both English and Italian
        ];

        for (const field of dangerousFields) {
            if (cardData[field]) {
                const fieldResult = this.validateSecurity(cardData[field], {
                    ...options,
                    context: `card.${field}`
                });
                
                if (!fieldResult.isValid) {
                    // Add field context to errors
                    fieldResult.errors.forEach(error => {
                        error.field = field;
                        errors.push(error);
                    });
                }
                warnings.push(...fieldResult.warnings);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate file upload content for security
     * @param {string} fileContent - Content of uploaded file
     * @param {string} mimeType - MIME type of file
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    static validateFileUploadSecurity(fileContent, mimeType, options = {}) {
        const errors = [];
        const warnings = [];

        // Only allow JSON and plain text
        const allowedMimeTypes = ['application/json', 'text/plain'];
        if (!allowedMimeTypes.includes(mimeType)) {
            errors.push(ValidationError.security(
                'File type not allowed for security reasons',
                { details: { mimeType, allowedTypes: allowedMimeTypes } }
            ));
        }

        // Check file size (max 1MB as string)
        if (fileContent.length > 1024 * 1024) {
            errors.push(ValidationError.security('File too large for security processing'));
        }

        // Run security validation on file content
        const contentResult = this.validateSecurity(fileContent, {
            ...options,
            context: 'file_upload'
        });

        errors.push(...contentResult.errors);
        warnings.push(...contentResult.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Quick security check for high-volume scenarios
     * Less comprehensive but faster for real-time validation
     */
    static quickSecurityCheck(content) {
        if (typeof content !== 'string') {
            return false;
        }

        // Only check the most critical patterns
        const criticalPatterns = [
            /<script/i,
            /javascript:/i,
            /\beval\s*\(/i
        ];

        return !criticalPatterns.some(pattern => pattern.test(content));
    }
}
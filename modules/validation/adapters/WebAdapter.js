import { ValidationEngine } from '../core/ValidationEngine.js';

/**
 * WebAdapter - Browser-compatible validation interface
 * 
 * Provides browser-friendly methods for client-side validation
 * Compatible with modern browsers and bundlers (Vite, Webpack, etc.)
 */
export class WebAdapter {
    
    /**
     * Validate deck data from web interface with appropriate options
     * @param {Object} deckData - Deck data to validate
     * @param {Object} options - Web-specific options
     * @returns {Promise<Object>} - Web-formatted validation result
     */
    static async validateDeck(deckData, options = {}) {
        const validationOptions = {
            // Web validation configuration
            security: {
                enabled: true,
                strict: false // Allow warnings in web context for better UX
            },
            sanitization: {
                enabled: true,
                allowedTags: ['strong', 'em', 'u', 'br', 'p'],
                allowedAttributes: [],
                stripDisallowed: true
            },
            schema: {
                enabled: true,
                requireTitle: true,
                requireCards: false, // Web can create empty decks
                maxCards: 50, // Reasonable limit for web UI performance
                maxTitleLength: 100,
                maxDescriptionLength: 500
            },
            business: {
                enabled: true,
                allowDuplicateTitles: true,
                requireUniqueIds: false
            },
            context: options.context || 'web',
            platform: 'web',
            ...options
        };

        const result = await ValidationEngine.validateDeck(deckData, validationOptions);
        
        return {
            ...result,
            // Web-specific formatting
            webFormat: this.formatWebResult(result),
            clientErrors: this.formatClientErrors(result.errors),
            clientWarnings: this.formatClientWarnings(result.warnings),
            uiState: this.calculateUIState(result)
        };
    }

    /**
     * Real-time validation for form inputs
     * @param {Object} fieldData - Form field data
     * @param {string} fieldName - Name of field being validated
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} - Field validation result
     */
    static async validateField(fieldData, fieldName, options = {}) {
        const fieldValidationOptions = {
            security: { enabled: true, strict: false },
            sanitization: { enabled: true },
            schema: { enabled: true },
            business: { enabled: false }, // Skip business rules for individual fields
            context: `web_field:${fieldName}`,
            platform: 'web',
            ...options
        };

        // Create minimal deck structure for field validation
        const mockDeck = {
            [fieldName]: fieldData
        };

        try {
            const result = await ValidationEngine.validateDeck(mockDeck, fieldValidationOptions);
            
            return {
                isValid: result.errors.length === 0,
                errors: result.errors.map(e => e.toWebFormat()),
                warnings: result.warnings.map(w => w.toWebFormat()),
                sanitizedValue: result.sanitizedData ? result.sanitizedData[fieldName] : fieldData,
                fieldState: result.errors.length === 0 ? 'valid' : 'invalid'
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [{
                    type: 'validation',
                    message: `Field validation failed: ${error.message}`,
                    code: 'FIELD_VALIDATION_ERROR',
                    severity: 'error'
                }],
                warnings: [],
                sanitizedValue: fieldData,
                fieldState: 'error'
            };
        }
    }

    /**
     * Validate file upload in browser
     * @param {File} file - Browser File object
     * @returns {Promise<Object>} - File validation result
     */
    static async validateFile(file) {
        try {
            // Check file type
            if (!file.type.includes('json') && !file.name.endsWith('.json')) {
                return {
                    isValid: false,
                    errors: [{
                        type: 'schema',
                        message: 'Only JSON files are supported',
                        code: 'INVALID_FILE_TYPE',
                        severity: 'error'
                    }],
                    warnings: []
                };
            }

            // Check file size (max 1MB)
            if (file.size > 1024 * 1024) {
                return {
                    isValid: false,
                    errors: [{
                        type: 'schema',
                        message: 'File size too large (max 1MB)',
                        code: 'FILE_TOO_LARGE',
                        severity: 'error'
                    }],
                    warnings: []
                };
            }

            // Read file content
            const fileContent = await this.readFileContent(file);
            
            // Parse JSON
            let deckData;
            try {
                deckData = JSON.parse(fileContent);
            } catch (error) {
                return {
                    isValid: false,
                    errors: [{
                        type: 'schema',
                        message: 'Invalid JSON format in file',
                        code: 'JSON_PARSE_ERROR',
                        severity: 'error'
                    }],
                    warnings: []
                };
            }

            // Validate deck data
            const result = await this.validateDeck(deckData, {
                context: `file_upload:${file.name}`
            });

            return {
                ...result.webFormat,
                fileName: file.name,
                fileSize: file.size
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [{
                    type: 'validation',
                    message: `File validation failed: ${error.message}`,
                    code: 'FILE_VALIDATION_ERROR',
                    severity: 'error'
                }],
                warnings: []
            };
        }
    }

    /**
     * Read file content from browser File object
     * @param {File} file - Browser File object
     * @returns {Promise<string>} - File content as string
     */
    static readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Format validation result for web interface
     * @param {Object} result - Validation result
     * @returns {Object} - Web-formatted result
     */
    static formatWebResult(result) {
        return {
            success: result.isValid,
            data: result.sanitizedData,
            stats: result.stats,
            errors: result.errors.map(e => e.toWebFormat()),
            warnings: result.warnings.map(w => w.toWebFormat()),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format errors for client-side display
     * @param {Array} errors - Validation errors
     * @returns {Array} - Client-formatted errors
     */
    static formatClientErrors(errors) {
        return errors.map(error => ({
            id: `error_${Date.now()}_${Math.random()}`,
            type: error.type,
            message: error.message,
            field: error.field,
            severity: error.severity || 'error',
            icon: this.getErrorIcon(error.type),
            color: 'red'
        }));
    }

    /**
     * Format warnings for client-side display
     * @param {Array} warnings - Validation warnings
     * @returns {Array} - Client-formatted warnings
     */
    static formatClientWarnings(warnings) {
        return warnings.map(warning => ({
            id: `warning_${Date.now()}_${Math.random()}`,
            type: warning.type,
            message: warning.message,
            field: warning.field,
            severity: 'warning',
            icon: this.getWarningIcon(warning.type),
            color: 'orange'
        }));
    }

    /**
     * Calculate UI state based on validation result
     * @param {Object} result - Validation result
     * @returns {Object} - UI state information
     */
    static calculateUIState(result) {
        return {
            canSave: result.isValid,
            canPreview: result.isValid || result.errors.length === 0,
            showErrors: result.errors.length > 0,
            showWarnings: result.warnings.length > 0,
            submitButtonState: result.isValid ? 'enabled' : 'disabled',
            formState: result.isValid ? 'valid' : 'invalid',
            validationSummary: this.createValidationSummary(result)
        };
    }

    /**
     * Create validation summary for UI display
     * @param {Object} result - Validation result
     * @returns {Object} - Validation summary
     */
    static createValidationSummary(result) {
        const errorCount = result.errors.length;
        const warningCount = result.warnings.length;
        
        let message = '';
        let status = '';
        
        if (result.isValid) {
            message = warningCount > 0 
                ? `✅ Valid with ${warningCount} warning(s)`
                : '✅ All validation checks passed';
            status = 'success';
        } else {
            message = `❌ ${errorCount} error(s)`;
            if (warningCount > 0) {
                message += ` and ${warningCount} warning(s)`;
            }
            status = 'error';
        }
        
        return {
            message,
            status,
            errorCount,
            warningCount,
            cardCount: result.stats ? result.stats.cardCount : 0
        };
    }

    /**
     * Get appropriate icon for error type
     * @param {string} errorType - Type of error
     * @returns {string} - Icon name or emoji
     */
    static getErrorIcon(errorType) {
        switch (errorType) {
            case 'security': return '🔒';
            case 'schema': return '📋';
            case 'business': return '⚠️';
            case 'sanitization': return '🧹';
            default: return '❌';
        }
    }

    /**
     * Get appropriate icon for warning type
     * @param {string} warningType - Type of warning
     * @returns {string} - Icon name or emoji
     */
    static getWarningIcon(warningType) {
        switch (warningType) {
            case 'security': return '🔓';
            case 'schema': return '📄';
            case 'business': return '💼';
            case 'sanitization': return '🧽';
            default: return '⚠️';
        }
    }

    /**
     * Quick validation for web performance scenarios
     * @param {Object} data - Data to validate
     * @param {Object} options - Validation options
     * @returns {boolean} - True if data passes quick validation
     */
    static quickValidate(data, options = {}) {
        return ValidationEngine.quickValidate(data, {
            context: 'web',
            platform: 'web',
            ...options
        });
    }

    /**
     * Batch validate multiple decks (for bulk operations)
     * @param {Array} deckDataArray - Array of deck data to validate
     * @param {Object} options - Validation options
     * @returns {Promise<Array>} - Array of validation results
     */
    static async validateBatch(deckDataArray, options = {}) {
        if (!Array.isArray(deckDataArray)) {
            return [{
                isValid: false,
                errors: [{ message: 'Input must be an array of deck data' }],
                warnings: []
            }];
        }

        const results = await Promise.all(
            deckDataArray.map((deckData, index) =>
                this.validateDeck(deckData, {
                    ...options,
                    context: `batch:${index}`
                })
            )
        );

        return results.map(r => r.webFormat);
    }
}
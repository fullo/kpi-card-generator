import { ValidationEngine } from '../core/ValidationEngine.js';

/**
 * APIAdapter - Express.js API-specific validation interface
 * 
 * Provides middleware and API-friendly methods for Express.js integration
 */
export class APIAdapter {
    
    /**
     * Validate deck data from API with appropriate options
     * @param {Object} deckData - Deck data to validate
     * @param {Object} options - API-specific options
     * @returns {Promise<Object>} - API-formatted validation result
     */
    static async validateDeck(deckData, options = {}) {
        const validationOptions = {
            // API validation configuration
            security: {
                enabled: true,
                strict: true // Strict security for API endpoints
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
                requireCards: false, // API can accept empty decks for creation
                maxCards: 100, // Reasonable limit for API responses
                maxTitleLength: 100,
                maxDescriptionLength: 500
            },
            business: {
                enabled: true,
                allowDuplicateTitles: true,
                requireUniqueIds: false
            },
            context: options.context || 'api',
            platform: 'api',
            ...options
        };

        const result = await ValidationEngine.validateDeck(deckData, validationOptions);
        
        return {
            ...result,
            // API-specific formatting
            apiResponse: this.formatAPIResponse(result),
            httpStatus: this.calculateHttpStatus(result.errors),
            responseHeaders: this.getResponseHeaders(result)
        };
    }

    /**
     * Create Express middleware for deck validation
     * @param {Object} options - Middleware options
     * @returns {Function} - Express middleware function
     */
    static createValidationMiddleware(options = {}) {
        return async (req, res, next) => {
            try {
                const deckData = req.body;
                
                if (!deckData) {
                    return res.status(400).json({
                        success: false,
                        error: 'schema',
                        message: 'Request body is required',
                        code: 'MISSING_BODY'
                    });
                }

                const result = await this.validateDeck(deckData, {
                    context: `${req.method} ${req.path}`,
                    userId: req.user?.id,
                    ...options
                });

                if (!result.isValid) {
                    return res
                        .status(result.httpStatus)
                        .set(result.responseHeaders)
                        .json(result.apiResponse);
                }

                // Add sanitized data to request for next middleware
                req.validatedDeck = result.sanitizedData;
                req.validationResult = result;
                
                next();
            } catch (error) {
                console.error('Validation middleware error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'internal',
                    message: 'Internal validation error',
                    code: 'VALIDATION_ERROR'
                });
            }
        };
    }

    /**
     * Create middleware for file upload validation
     * @param {Object} options - Middleware options
     * @returns {Function} - Express middleware function
     */
    static createFileValidationMiddleware(options = {}) {
        return async (req, res, next) => {
            try {
                if (!req.file && !req.body.jsonContent) {
                    return res.status(400).json({
                        success: false,
                        error: 'schema',
                        message: 'File upload or JSON content required',
                        code: 'MISSING_FILE'
                    });
                }

                const fileContent = req.file ? req.file.buffer.toString('utf8') : req.body.jsonContent;
                const mimeType = req.file ? req.file.mimetype : 'application/json';

                // Validate file security first
                const securityResult = await ValidationEngine.validateFileUploadSecurity(
                    fileContent, 
                    mimeType,
                    { context: `upload:${req.path}` }
                );

                if (!securityResult.isValid) {
                    return res.status(403).json({
                        success: false,
                        error: 'security',
                        message: 'File content failed security validation',
                        details: securityResult.errors.map(e => e.message)
                    });
                }

                // Parse and validate JSON content
                let deckData;
                try {
                    deckData = JSON.parse(fileContent);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        error: 'schema',
                        message: 'Invalid JSON format',
                        code: 'JSON_PARSE_ERROR'
                    });
                }

                const result = await this.validateDeck(deckData, {
                    context: `file_upload:${req.path}`,
                    ...options
                });

                if (!result.isValid) {
                    return res
                        .status(result.httpStatus)
                        .set(result.responseHeaders)
                        .json(result.apiResponse);
                }

                req.validatedDeck = result.sanitizedData;
                req.validationResult = result;
                
                next();
            } catch (error) {
                console.error('File validation middleware error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'internal',
                    message: 'Internal file validation error',
                    code: 'FILE_VALIDATION_ERROR'
                });
            }
        };
    }

    /**
     * Format validation result for API response
     * @param {Object} result - Validation result
     * @returns {Object} - API-formatted response
     */
    static formatAPIResponse(result) {
        if (result.isValid) {
            return {
                success: true,
                data: result.sanitizedData,
                stats: result.stats,
                warnings: result.warnings.map(w => w.toAPIResponse())
            };
        }

        return {
            success: false,
            errors: result.errors.map(e => e.toAPIResponse()),
            warnings: result.warnings.map(w => w.toAPIResponse()),
            stats: result.stats
        };
    }

    /**
     * Calculate appropriate HTTP status code
     * @param {Array} errors - Validation errors
     * @returns {number} - HTTP status code
     */
    static calculateHttpStatus(errors) {
        if (errors.length === 0) {
            return 200;
        }

        // Check error types to determine status
        const hasSecurityErrors = errors.some(e => e.type === 'security');
        const hasSchemaErrors = errors.some(e => e.type === 'schema');
        const hasBusinessErrors = errors.some(e => e.type === 'business');

        if (hasSecurityErrors) return 403;
        if (hasBusinessErrors) return 422;
        if (hasSchemaErrors) return 400;
        
        return 400; // Default for validation errors
    }

    /**
     * Get response headers for validation result
     * @param {Object} result - Validation result
     * @returns {Object} - Response headers
     */
    static getResponseHeaders(result) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Validation-Engine': 'kpi-cards-v1'
        };

        if (result.stats) {
            headers['X-Card-Count'] = result.stats.cardCount.toString();
            headers['X-Estimated-Pages'] = result.stats.estimatedPages.toString();
        }

        if (result.warnings.length > 0) {
            headers['X-Validation-Warnings'] = result.warnings.length.toString();
        }

        return headers;
    }

    /**
     * Quick validation for API performance scenarios
     * @param {Object} data - Data to validate
     * @param {Object} options - Validation options
     * @returns {boolean} - True if data passes quick validation
     */
    static quickValidate(data, options = {}) {
        return ValidationEngine.quickValidate(data, {
            context: 'api',
            platform: 'api',
            ...options
        });
    }

    /**
     * Create success response with validated data
     * @param {Object} data - Validated data
     * @param {Object} stats - Validation stats
     * @param {Array} warnings - Validation warnings
     * @returns {Object} - Success response
     */
    static createSuccessResponse(data, stats = null, warnings = []) {
        return {
            success: true,
            data,
            stats,
            warnings: warnings.map(w => w.toAPIResponse()),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Create error response from validation errors
     * @param {Array} errors - Validation errors
     * @param {Array} warnings - Validation warnings
     * @returns {Object} - Error response
     */
    static createErrorResponse(errors, warnings = []) {
        return {
            success: false,
            errors: errors.map(e => e.toAPIResponse()),
            warnings: warnings.map(w => w.toAPIResponse()),
            timestamp: new Date().toISOString()
        };
    }
}
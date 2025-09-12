import Joi from 'joi';
import { SanitizationService } from '../services/SanitizationService.js';
import { DeckValidator } from '../../modules/cards/validation/DeckValidator.js';

const sanitizer = new SanitizationService();

/**
 * Validation now centralized in DeckValidator.js
 * This middleware handles security sanitization and advanced threat detection
 */

// Export options validation schema
const exportOptionsSchema = Joi.object({
    printMode: Joi.string()
        .valid('landscape', 'portrait')
        .default('landscape'),
    
    cardsPerPage: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .default(8),
    
    cardsPerRow: Joi.number()
        .integer()
        .min(1)
        .max(8)
        .default(4),
    
    template: Joi.string()
        .max(50)
        .pattern(/^[a-zA-Z0-9_-]*$/, 'template-name')
        .default('default')
        .allow(''),
    
    margins: Joi.object({
        top: Joi.string().pattern(/^\d+(\.\d+)?(cm|mm|in|px)$/).default('0.5cm'),
        bottom: Joi.string().pattern(/^\d+(\.\d+)?(cm|mm|in|px)$/).default('0.5cm'),
        left: Joi.string().pattern(/^\d+(\.\d+)?(cm|mm|in|px)$/).default('0.5cm'),
        right: Joi.string().pattern(/^\d+(\.\d+)?(cm|mm|in|px)$/).default('0.5cm')
    }).default({
        top: '0.5cm',
        bottom: '0.5cm', 
        left: '0.5cm',
        right: '0.5cm'
    })
});

/**
 * Security validation middleware for deck creation/update
 */
export const validateAndSanitizeDeck = async (req, res, next) => {
    try {
        // 1. Basic request validation
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                message: 'Request must contain JSON object'
            });
        }

        // 2. Size validation
        const bodyString = JSON.stringify(req.body);
        if (bodyString.length > 1024 * 1024) { // 1MB limit
            return res.status(413).json({
                success: false,
                error: 'Payload too large',
                message: 'Request body exceeds maximum size limit'
            });
        }

        // 3. Schema validation using DeckValidator
        const validation = DeckValidator.validateDeckQuick(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed', 
                details: validation.errors
            });
        }
        
        // 4. Deep sanitization
        try {
            req.body = await sanitizer.sanitizeDeck(req.body);
        } catch (sanitizationError) {
            return res.status(400).json({
                success: false,
                error: 'Security validation failed',
                message: sanitizationError.message
            });
        }
        
        // 5. Additional security checks
        if (containsAdvancedThreats(req.body)) {
            // Log security incident
            console.warn('🚨 Advanced threat detected:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.url,
                method: req.method,
                threat: 'Advanced payload patterns detected'
            });
            
            return res.status(400).json({
                success: false,
                error: 'Security validation failed',
                message: 'Content contains patterns that cannot be processed safely'
            });
        }
            
        
        next();
    } catch (error) {
        console.error('Security validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Security validation error',
            message: 'An error occurred during security validation'
        });
    }
};

/**
 * Security validation middleware for individual card operations
 */
export const validateAndSanitizeCard = (req, res, next) => {
    try {
        // 1. Basic validation
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body'
            });
        }

        // 2. Schema validation using DeckValidator
        const validation = DeckValidator.validateCardQuick(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            });
        }
        
        // 3. Sanitization
        try {
            req.body = sanitizer.sanitizeCard(req.body);
        } catch (sanitizationError) {
            return res.status(400).json({
                success: false,
                error: 'Security validation failed',
                message: sanitizationError.message
            });
        }
        
        next();
    } catch (error) {
        console.error('Card security validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Security validation error'
        });
    }
};

/**
 * Security validation for export options
 */
export const validateExportOptions = (req, res, next) => {
    try {
        const { error, value } = exportOptionsSchema.validate(req.body.options || {}, {
            stripUnknown: true
        });
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid export options',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }
        
        req.body.options = value;
        next();
    } catch (error) {
        console.error('Export options validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Export options validation error'
        });
    }
};

/**
 * File upload security validation
 */
export const validateFileUpload = (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        
        // File type validation
        const allowedMimeTypes = ['application/json', 'text/plain'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file type',
                message: `Only ${allowedMimeTypes.join(', ')} files are allowed`
            });
        }
        
        // File size validation (10MB limit)
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(413).json({
                success: false,
                error: 'File too large',
                message: 'File must be smaller than 10MB'
            });
        }
        
        // Read and validate file content
        const fs = require('fs');
        try {
            const fileContent = fs.readFileSync(req.file.path, 'utf-8');
            
            // Validate and sanitize file content
            const validatedContent = sanitizer.validateFileUpload(fileContent, req.file.mimetype);
            req.uploadedData = validatedContent;
            
            // Clean up temporary file
            fs.unlinkSync(req.file.path);
            
            next();
        } catch (validationError) {
            // Clean up file on validation error
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            return res.status(400).json({
                success: false,
                error: 'File validation failed',
                message: validationError.message
            });
        }
    } catch (error) {
        console.error('File upload validation error:', error);
        
        // Clean up file on error
        if (req.file?.path && require('fs').existsSync(req.file.path)) {
            require('fs').unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            error: 'File upload validation error'
        });
    }
};

/**
 * Request rate limiting validation
 */
export const validateRateLimit = (req, res, next) => {
    // Basic rate limiting info (actual implementation would use redis/memory store)
    const clientId = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // 100 requests per minute per IP
    
    // In production, this would use Redis or similar
    if (!global.rateLimitStore) {
        global.rateLimitStore = new Map();
    }
    
    const key = `${clientId}_${Math.floor(now / windowMs)}`;
    const currentCount = global.rateLimitStore.get(key) || 0;
    
    if (currentCount >= maxRequests) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil(windowMs / 1000)
        });
    }
    
    global.rateLimitStore.set(key, currentCount + 1);
    
    // Cleanup old entries
    for (const [k] of global.rateLimitStore.entries()) {
        const timestamp = parseInt(k.split('_')[1]);
        if (timestamp < Math.floor((now - windowMs * 2) / windowMs)) {
            global.rateLimitStore.delete(k);
        }
    }
    
    next();
};

/**
 * Checks for advanced threat patterns that might bypass basic sanitization
 * @param {Object} data - Data to check
 * @returns {boolean} - True if advanced threats detected
 */
function containsAdvancedThreats(data) {
    const dataString = JSON.stringify(data).toLowerCase();
    
    const advancedThreats = [
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
        
        // SQL injection (only obvious patterns)
        /union\s+select/i,
        /drop\s+table/i,
        
        // Keep the most dangerous HTML entity encodings
        /&\#x?[0-9a-f]+;.*<script/i  // Encoded script tags
    ];
    
    
    return advancedThreats.some(pattern => pattern.test(dataString));
}

export { exportOptionsSchema };
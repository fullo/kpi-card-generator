/**
 * ValidationError - Standardized error handling for all validation scenarios
 * 
 * Provides consistent error formatting across CLI, API, and Web contexts
 */
export class ValidationError extends Error {
    constructor(message, options = {}) {
        super(message);
        
        this.name = 'ValidationError';
        this.type = options.type || 'validation';
        this.field = options.field || null;
        this.code = options.code || 'VALIDATION_FAILED';
        this.context = options.context || 'unknown';
        this.severity = options.severity || 'error';
        this.details = options.details || null;
        
        // Platform-specific error codes
        this.httpStatus = this.getHttpStatus();
        this.exitCode = this.getExitCode();
    }

    /**
     * Get appropriate HTTP status for API responses
     */
    getHttpStatus() {
        switch (this.type) {
            case 'security':
                return 403;
            case 'schema':
                return 400;
            case 'business':
                return 422;
            case 'sanitization':
                return 400;
            default:
                return 400;
        }
    }

    /**
     * Get appropriate exit code for CLI
     */
    getExitCode() {
        switch (this.severity) {
            case 'warning':
                return 0;
            case 'error':
                return 1;
            case 'fatal':
                return 2;
            default:
                return 1;
        }
    }

    /**
     * Convert to API-friendly format
     */
    toAPIResponse() {
        return {
            success: false,
            error: this.type,
            message: this.message,
            code: this.code,
            field: this.field,
            details: this.details,
            severity: this.severity
        };
    }

    /**
     * Convert to CLI-friendly format
     */
    toCLIMessage() {
        const prefix = this.severity === 'warning' ? '⚠️  Warning' : '❌ Error';
        const field = this.field ? ` (${this.field})` : '';
        return `${prefix}${field}: ${this.message}`;
    }

    /**
     * Convert to Web-friendly format (JSON serializable)
     */
    toWebFormat() {
        return {
            type: this.type,
            message: this.message,
            code: this.code,
            field: this.field,
            details: this.details,
            severity: this.severity
        };
    }

    /**
     * Create security validation error
     */
    static security(message, options = {}) {
        return new ValidationError(message, {
            ...options,
            type: 'security',
            code: 'SECURITY_VIOLATION'
        });
    }

    /**
     * Create schema validation error
     */
    static schema(message, field = null, options = {}) {
        return new ValidationError(message, {
            ...options,
            type: 'schema',
            field,
            code: 'SCHEMA_INVALID'
        });
    }

    /**
     * Create business rule validation error
     */
    static business(message, field = null, options = {}) {
        return new ValidationError(message, {
            ...options,
            type: 'business',
            field,
            code: 'BUSINESS_RULE_VIOLATED'
        });
    }

    /**
     * Create sanitization error
     */
    static sanitization(message, field = null, options = {}) {
        return new ValidationError(message, {
            ...options,
            type: 'sanitization',
            field,
            code: 'SANITIZATION_FAILED'
        });
    }
}
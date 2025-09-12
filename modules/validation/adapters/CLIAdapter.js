import { ValidationEngine } from '../core/ValidationEngine.js';

/**
 * CLIAdapter - CLI-specific validation interface
 * 
 * Provides CLI-friendly methods and error formatting for command-line usage
 */
export class CLIAdapter {
    
    /**
     * Validate deck data from CLI with appropriate options
     * @param {Object} deckData - Deck data to validate
     * @param {Object} options - CLI-specific options
     * @returns {Promise<Object>} - CLI-formatted validation result
     */
    static async validateDeck(deckData, options = {}) {
        const validationOptions = {
            // CLI validation configuration
            security: {
                enabled: true,
                strict: false // Allow warnings in CLI context
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
                requireCards: false, // CLI can work with empty decks
                maxCards: 1000, // Higher limit for CLI batch processing
                maxTitleLength: 200,
                maxDescriptionLength: 1000
            },
            business: {
                enabled: true,
                allowDuplicateTitles: true,
                requireUniqueIds: false
            },
            context: options.context || 'cli',
            platform: 'cli',
            ...options
        };

        const result = await ValidationEngine.validateDeck(deckData, validationOptions);
        
        return {
            ...result,
            // CLI-specific formatting
            cliMessages: this.formatCLIMessages(result.errors, result.warnings),
            exitCode: this.calculateExitCode(result.errors, result.warnings),
            summary: this.createSummary(result)
        };
    }

    /**
     * Format validation messages for CLI display
     * @param {Array} errors - Validation errors
     * @param {Array} warnings - Validation warnings
     * @returns {Array} - CLI-formatted messages
     */
    static formatCLIMessages(errors, warnings) {
        const messages = [];
        
        // Format errors
        errors.forEach(error => {
            messages.push(error.toCLIMessage());
        });
        
        // Format warnings
        warnings.forEach(warning => {
            messages.push(warning.toCLIMessage());
        });
        
        return messages;
    }

    /**
     * Calculate appropriate exit code for CLI
     * @param {Array} errors - Validation errors
     * @param {Array} warnings - Validation warnings
     * @returns {number} - Process exit code
     */
    static calculateExitCode(errors, warnings) {
        if (errors.length > 0) {
            // Check if any errors are fatal
            const hasFatalErrors = errors.some(error => error.severity === 'fatal');
            return hasFatalErrors ? 2 : 1;
        }
        
        // Warnings don't cause exit failure in CLI
        return 0;
    }

    /**
     * Create validation summary for CLI output
     * @param {Object} result - Validation result
     * @returns {Object} - Summary information
     */
    static createSummary(result) {
        return {
            isValid: result.isValid,
            errorCount: result.errors.length,
            warningCount: result.warnings.length,
            cardCount: result.stats ? result.stats.cardCount : 0,
            estimatedPages: result.stats ? result.stats.estimatedPages : 0,
            message: result.isValid 
                ? '✅ Deck validation passed successfully'
                : `❌ Deck validation failed with ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`
        };
    }

    /**
     * Quick validation for CLI performance scenarios
     * @param {Object} data - Data to validate
     * @param {Object} options - Validation options
     * @returns {boolean} - True if data passes quick validation
     */
    static quickValidate(data, options = {}) {
        return ValidationEngine.quickValidate(data, {
            context: 'cli',
            platform: 'cli',
            ...options
        });
    }

    /**
     * Validate file content before processing
     * @param {string} filePath - Path to file
     * @param {string} fileContent - File content
     * @returns {Promise<Object>} - Validation result
     */
    static async validateFile(filePath, fileContent) {
        try {
            const deckData = JSON.parse(fileContent);
            return await this.validateDeck(deckData, {
                context: `file:${filePath}`
            });
        } catch (error) {
            return {
                isValid: false,
                errors: [{
                    type: 'schema',
                    message: `Failed to parse JSON file: ${error.message}`,
                    toCLIMessage: () => `❌ Error: Failed to parse JSON file: ${error.message}`
                }],
                warnings: [],
                sanitizedData: null,
                exitCode: 1,
                cliMessages: [`❌ Error: Failed to parse JSON file: ${error.message}`]
            };
        }
    }

    /**
     * Display CLI validation results
     * @param {Object} result - Validation result from validateDeck
     */
    static displayResults(result) {
        // Display summary
        console.log('\n' + result.summary.message);
        
        if (result.stats) {
            console.log(`📊 Cards: ${result.stats.cardCount}, Pages: ${result.stats.estimatedPages}`);
        }
        
        // Display messages
        if (result.cliMessages.length > 0) {
            console.log('\nDetails:');
            result.cliMessages.forEach(message => {
                console.log(`  ${message}`);
            });
        }
        
        console.log(); // Empty line
    }
}
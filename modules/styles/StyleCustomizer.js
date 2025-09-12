/**
 * StyleCustomizer - Core logic for CSS style customization
 * 
 * Implements the approved style customization system for KPI Card Generator
 * Based on iteration 5 requirements with anti-XSS validation
 */

import fs from 'fs/promises';
import path from 'path';
import { StyleCollector } from './StyleCollector.js';
import { CSSGenerator } from './CSSGenerator.js';

export class StyleCustomizer {
    
    /**
     * Hex color regex for validation (6-digit hex colors only)
     */
    static HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
    
    /**
     * Valid text size options
     */
    static TEXT_SIZES = ['xs', 's', 'm', 'l'];
    
    /**
     * Default style configuration
     */
    static getDefaultConfig() {
        return {
            cardTitleColor: null,        // hex color or null
            cardTitleBgColor: null,      // hex color or null  
            showHeroImage: true,         // boolean, default true
            descriptionTextSize: 'm'     // 'xs'|'s'|'m'|'l', default 'm'
        };
    }
    
    /**
     * Validate a hex color value
     * @param {string|null} color - Color to validate
     * @returns {boolean} - True if valid
     */
    static validateHexColor(color) {
        return color === null || (typeof color === 'string' && this.HEX_COLOR_REGEX.test(color));
    }
    
    /**
     * Validate text size option
     * @param {string} size - Size to validate
     * @returns {boolean} - True if valid
     */
    static validateTextSize(size) {
        return this.TEXT_SIZES.includes(size);
    }
    
    /**
     * Validate a complete style configuration
     * @param {Object} config - Configuration to validate
     * @returns {Object} - {isValid: boolean, errors: string[]}
     */
    static validateStyleConfig(config) {
        const errors = [];
        
        // Validate required fields exist
        if (!config || typeof config !== 'object') {
            return { isValid: false, errors: ['Configuration must be an object'] };
        }
        
        // Validate cardTitleColor
        if (!this.validateHexColor(config.cardTitleColor)) {
            errors.push('cardTitleColor must be null or a valid 6-digit hex color (#RRGGBB)');
        }
        
        // Validate cardTitleBgColor
        if (!this.validateHexColor(config.cardTitleBgColor)) {
            errors.push('cardTitleBgColor must be null or a valid 6-digit hex color (#RRGGBB)');
        }
        
        // Validate showHeroImage
        if (typeof config.showHeroImage !== 'boolean') {
            errors.push('showHeroImage must be a boolean');
        }
        
        // Validate descriptionTextSize
        if (!this.validateTextSize(config.descriptionTextSize)) {
            errors.push(`descriptionTextSize must be one of: ${this.TEXT_SIZES.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate a style configuration for a single styleClass
     * @param {Object} classConfig - Configuration object with class and style properties
     * @returns {Object} - { isValid: boolean, errors: string[] }
     */
    static validateStyleClassConfig(classConfig) {
        const errors = [];
        
        // Must have class property
        if (!classConfig || typeof classConfig !== 'object') {
            errors.push('Style class configuration must be an object');
            return { isValid: false, errors };
        }
        
        if (!classConfig.class || typeof classConfig.class !== 'string') {
            errors.push('class property is required and must be a string');
        }
        
        // Validate the style configuration part
        const styleValidation = this.validateStyleConfig(classConfig);
        if (!styleValidation.isValid) {
            errors.push(...styleValidation.errors);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Sanitize and normalize a style configuration
     * @param {Object} config - Raw configuration input
     * @returns {Object} - Sanitized configuration
     */
    static sanitizeConfig(config) {
        const defaults = this.getDefaultConfig();
        const sanitized = { ...defaults };
        
        if (!config || typeof config !== 'object') {
            return sanitized;
        }
        
        // Sanitize cardTitleColor
        if (this.validateHexColor(config.cardTitleColor)) {
            sanitized.cardTitleColor = config.cardTitleColor;
        }
        
        // Sanitize cardTitleBgColor  
        if (this.validateHexColor(config.cardTitleBgColor)) {
            sanitized.cardTitleBgColor = config.cardTitleBgColor;
        }
        
        // Sanitize showHeroImage
        if (typeof config.showHeroImage === 'boolean') {
            sanitized.showHeroImage = config.showHeroImage;
        }
        
        // Sanitize descriptionTextSize
        if (this.validateTextSize(config.descriptionTextSize)) {
            sanitized.descriptionTextSize = config.descriptionTextSize;
        }
        
        return sanitized;
    }

    /**
     * Constructor
     * @param {Object} options - Configuration options
     * @param {string} options.workingDir - Working directory for files
     * @param {boolean} options.enableBackup - Whether to enable automatic backup
     */
    constructor(options = {}) {
        this.workingDir = options.workingDir || process.cwd();
        this.enableBackup = options.enableBackup !== false; // Default true
    }

    /**
     * Genera il percorso del file .styles.json per un deck
     * @param {string} deckPath - Percorso del file deck
     * @returns {string} Percorso del file .styles.json
     */
    getStylesFilePath(deckPath) {
        const deckDir = path.dirname(deckPath);
        const deckName = path.basename(deckPath, path.extname(deckPath));
        return path.join(deckDir, `${deckName}.styles.json`);
    }

    /**
     * Verifica se esiste già un file di configurazione stili
     * @param {string} deckPath - Percorso del file deck
     * @returns {Promise<boolean>} True se il file esiste
     */
    async hasExistingStylesConfig(deckPath) {
        const stylesPath = this.getStylesFilePath(deckPath);
        try {
            await fs.access(stylesPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Carica la configurazione stili esistente
     * @param {string} deckPath - Percorso del file deck
     * @returns {Promise<Object|null>} Configurazione caricata o null se non esiste
     */
    async loadExistingStylesConfig(deckPath) {
        const stylesPath = this.getStylesFilePath(deckPath);
        
        try {
            const content = await fs.readFile(stylesPath, 'utf-8');
            const config = JSON.parse(content);
            
            // Valida la struttura base
            if (!config.styleClass || !Array.isArray(config.styleClass)) {
                throw new Error('Struttura .styles.json non valida');
            }
            
            return config;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw new Error(`Errore caricando .styles.json: ${error.message}`);
        }
    }

    /**
     * Salva la configurazione stili con backup opzionale
     * @param {string} deckPath - Percorso del file deck
     * @param {Object} stylesConfig - Configurazione da salvare
     * @returns {Promise<void>}
     */
    async saveStylesConfig(deckPath, stylesConfig) {
        const stylesPath = this.getStylesFilePath(deckPath);
        
        // Backup della configurazione esistente se abilitato
        if (this.enableBackup && await this.hasExistingStylesConfig(deckPath)) {
            await this.createBackup(stylesPath);
        }
        
        // Valida la configurazione prima del salvataggio
        const { valid, invalid } = CSSGenerator.validateAndSanitizeConfigs(stylesConfig.styleClass);
        
        if (invalid.length > 0) {
            throw new Error(`Configurazione non valida: ${invalid.length} errori trovati`);
        }
        
        // Salva la configurazione pulita
        const cleanConfig = {
            styleClass: valid,
            metadata: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                totalStyles: valid.length
            }
        };
        
        await fs.writeFile(stylesPath, JSON.stringify(cleanConfig, null, 2), 'utf-8');
    }
    
    /**
     * Update configuration for a single styleClass
     * @param {string} deckPath - Path to the deck file
     * @param {string} styleClass - The styleClass to update
     * @param {Object} styleConfig - Configuration for this styleClass
     * @returns {Promise<Object>} - Complete updated configuration
     */
    async updateStyleClassConfig(deckPath, styleClass, styleConfig) {
        const stylesPath = this.getStylesFilePath(deckPath);
        
        // Load existing configuration or create new one
        let existingConfig;
        try {
            existingConfig = await this.loadExistingStylesConfig(deckPath);
        } catch (error) {
            if (error.message === 'File configurazione non trovato') {
                // Create new config structure
                existingConfig = { styleClass: [] };
            } else {
                throw error;
            }
        }
        
        // Ensure we have a valid config structure
        if (!existingConfig || !existingConfig.styleClass) {
            existingConfig = { styleClass: [] };
        }
        
        // Find and update or add the styleClass configuration
        const existingIndex = existingConfig.styleClass.findIndex(config => config.class === styleClass);
        const newClassConfig = {
            class: styleClass,
            ...StyleCustomizer.sanitizeConfig(styleConfig)
        };
        
        if (existingIndex >= 0) {
            // Update existing configuration
            existingConfig.styleClass[existingIndex] = newClassConfig;
        } else {
            // Add new configuration
            existingConfig.styleClass.push(newClassConfig);
        }
        
        // Save the updated configuration
        await this.saveStylesConfig(deckPath, existingConfig);
        
        return existingConfig;
    }

    /**
     * Crea un backup della configurazione esistente
     * @param {string} stylesPath - Percorso del file .styles.json
     * @returns {Promise<string>} Percorso del file di backup
     */
    async createBackup(stylesPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = stylesPath.replace('.styles.json', `.styles.backup-${timestamp}.json`);
        
        try {
            await fs.copyFile(stylesPath, backupPath);
            return backupPath;
        } catch (error) {
            console.warn(`Impossibile creare backup: ${error.message}`);
            return null;
        }
    }

    /**
     * Inizializza la configurazione stili per un deck
     * @param {Object} deck - Oggetto deck
     * @param {string} deckPath - Percorso del file deck
     * @returns {Promise<Object>} Configurazione stili inizializzata
     */
    async initializeStylesConfig(deck, deckPath) {
        const uniqueStyleClasses = StyleCollector.extractUniqueStyleClasses(deck);
        
        if (uniqueStyleClasses.length === 0) {
            throw new Error('Nessuna styleClass trovata nel deck. Impossibile inizializzare configurazione stili.');
        }

        const styleConfigs = uniqueStyleClasses.map(cssClass => 
            CSSGenerator.createDefaultStyleConfig(cssClass)
        );

        const initialConfig = {
            styleClass: styleConfigs
        };

        return initialConfig;
    }

    /**
     * Genera il CSS finale da un deck e le sue configurazioni stili
     * @param {Object} deck - Oggetto deck
     * @param {string} deckPath - Percorso del file deck
     * @returns {Promise<string>} CSS generato
     */
    async generateCSSForDeck(deck, deckPath) {
        const stylesConfig = await this.loadExistingStylesConfig(deckPath);
        
        if (!stylesConfig) {
            return '/* Nessuna configurazione stili trovata */\n';
        }

        return CSSGenerator.generateCSSFromJSON(stylesConfig);
    }

    /**
     * Aggiorna una configurazione esistente con nuove styleClass dal deck
     * @param {Object} deck - Oggetto deck
     * @param {string} deckPath - Percorso del file deck
     * @returns {Promise<Object>} Configurazione aggiornata
     */
    async updateStylesConfigForDeck(deck, deckPath) {
        const currentStyles = StyleCollector.extractUniqueStyleClasses(deck);
        const existingConfig = await this.loadExistingStylesConfig(deckPath);

        if (!existingConfig) {
            // Se non esiste configurazione, creala da zero
            return await this.initializeStylesConfig(deck, deckPath);
        }

        // Mappa delle configurazioni esistenti per classe
        const existingStylesMap = new Map();
        existingConfig.styleClass.forEach(config => {
            existingStylesMap.set(config.class, config);
        });

        // Aggiorna con nuove styleClass mantenendo quelle esistenti
        const updatedConfigs = currentStyles.map(cssClass => {
            return existingStylesMap.get(cssClass) || CSSGenerator.createDefaultStyleConfig(cssClass);
        });

        return {
            styleClass: updatedConfigs
        };
    }

    /**
     * Rimuove la configurazione stili per un deck
     * @param {string} deckPath - Percorso del file deck
     * @returns {Promise<boolean>} True se rimosso con successo
     */
    async removeStylesConfig(deckPath) {
        const stylesPath = this.getStylesFilePath(deckPath);
        
        try {
            if (this.enableBackup) {
                await this.createBackup(stylesPath);
            }
            await fs.unlink(stylesPath);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return true; // File già inesistente
            }
            throw new Error(`Errore rimuovendo configurazione stili: ${error.message}`);
        }
    }

    /**
     * Genera un report completo sullo stato degli stili per un deck
     * @param {Object} deck - Oggetto deck
     * @param {string} deckPath - Percorso del file deck
     * @returns {Promise<string>} Report dettagliato
     */
    async generateStylesReport(deck, deckPath) {
        let report = "📊 Report Stili Personalizzati\n";
        report += "=" .repeat(40) + "\n\n";

        // Analisi deck
        const styleDistribution = StyleCollector.analyzeStyleDistribution(deck);
        report += `📋 Analisi Deck:\n`;
        report += `   Carte totali: ${styleDistribution.totalCards}\n`;
        report += `   StyleClass uniche: ${styleDistribution.totalUniqueStyles}\n`;
        report += `   Carte senza stile: ${styleDistribution.cardsWithoutStyle}\n\n`;

        // Configurazione esistente
        const hasConfig = await this.hasExistingStylesConfig(deckPath);
        const stylesPath = this.getStylesFilePath(deckPath);
        
        report += `⚙️  Configurazione Stili:\n`;
        report += `   File: ${path.basename(stylesPath)}\n`;
        report += `   Stato: ${hasConfig ? '✅ Presente' : '❌ Non configurata'}\n`;

        if (hasConfig) {
            try {
                const config = await this.loadExistingStylesConfig(deckPath);
                report += `   Stili configurati: ${config.styleClass.length}\n`;
                
                if (config.metadata) {
                    report += `   Creata: ${new Date(config.metadata.createdAt).toLocaleString()}\n`;
                }
            } catch (error) {
                report += `   ⚠️  Errore lettura: ${error.message}\n`;
            }
        }

        report += "\n";

        // CSS Preview
        if (hasConfig) {
            try {
                const css = await this.generateCSSForDeck(deck, deckPath);
                const cssLines = css.split('\n').filter(line => line.trim().length > 0).length;
                report += `🎨 CSS Generato: ${cssLines} righe\n`;
            } catch (error) {
                report += `❌ Errore generazione CSS: ${error.message}\n`;
            }
        }

        return report;
    }
}
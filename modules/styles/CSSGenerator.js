/**
 * CSSGenerator - Genera CSS sicuro da configurazioni stili
 * 
 * Responsabilità:
 * - Generazione CSS dinamico da configurazioni styleClass
 * - Validazione anti-XSS rigorosa per tutti gli input
 * - Supporto per colori, dimensioni testo, visibilità elementi
 * - Output CSS W3C compliant
 */
export class CSSGenerator {
    
    /**
     * Regex per validazione hex colors (formato #RRGGBB)
     */
    static HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

    /**
     * Dimensioni testo supportate con valori pt e line-height
     */
    static TEXT_SIZES = {
        xs: { fontSize: '6pt', lineHeight: '1.2' },
        s: { fontSize: '7pt', lineHeight: '1.3' },
        m: { fontSize: '8pt', lineHeight: '1.4' },
        l: { fontSize: '9pt', lineHeight: '1.5' }
    };

    /**
     * Valida un colore hex
     * @param {string|null} color - Colore da validare
     * @returns {boolean} True se il colore è valido o null
     */
    static validateHexColor(color) {
        return color === null || (typeof color === 'string' && this.HEX_COLOR_REGEX.test(color));
    }

    /**
     * Valida una configurazione stile completa
     * @param {Object} styleConfig - Configurazione da validare
     * @returns {boolean} True se la configurazione è valida
     */
    static validateStyleConfig(styleConfig) {
        if (!styleConfig || typeof styleConfig !== 'object') {
            return false;
        }

        const {
            class: cssClass,
            cardTitleColor,
            cardTitleBgColor,
            showHeroImage,
            descriptionTextSize
        } = styleConfig;

        // Valida cssClass (obbligatorio)
        if (!cssClass || typeof cssClass !== 'string' || cssClass.trim().length === 0) {
            return false;
        }

        // Valida colori hex (opzionali)
        if (!this.validateHexColor(cardTitleColor) || !this.validateHexColor(cardTitleBgColor)) {
            return false;
        }

        // Valida boolean showHeroImage
        if (typeof showHeroImage !== 'boolean') {
            return false;
        }

        // Valida dimensione testo
        if (!this.TEXT_SIZES.hasOwnProperty(descriptionTextSize)) {
            return false;
        }

        return true;
    }

    /**
     * Genera CSS per una singola styleClass
     * @param {Object} styleConfig - Configurazione stile validata
     * @returns {string} CSS generato per la styleClass
     */
    static generateCSSForStyleClass(styleConfig) {
        if (!this.validateStyleConfig(styleConfig)) {
            throw new Error(`Configurazione stile non valida: ${JSON.stringify(styleConfig)}`);
        }

        const {
            class: cssClass,
            cardTitleColor,
            cardTitleBgColor,
            showHeroImage,
            descriptionTextSize
        } = styleConfig;

        let css = `\n/* Stili per ${cssClass} */\n`;

        // Genera CSS per colori titolo
        if (cardTitleColor) {
            css += `.${cssClass} .card-title {\n`;
            css += `    color: ${cardTitleColor};\n`;
            css += `}\n`;
        }

        // Genera CSS per banner titolo con background
        if (cardTitleBgColor) {
            css += `.${cssClass} .card-type-banner {\n`;
            css += `    background-color: ${cardTitleBgColor};\n`;
            if (cardTitleColor) {
                css += `    color: ${cardTitleColor};\n`;
            }
            css += `}\n`;
        }

        // Genera CSS per hero image visibility
        if (!showHeroImage) {
            css += `.${cssClass} .card-image-area {\n`;
            css += `    display: none !important;\n`;
            css += `}\n`;
        }

        // Genera CSS per dimensione testo descrizione
        const textSize = this.TEXT_SIZES[descriptionTextSize];
        css += `.${cssClass} .card-description-box .main-text {\n`;
        css += `    font-size: ${textSize.fontSize} !important;\n`;
        css += `    line-height: ${textSize.lineHeight} !important;\n`;
        css += `}\n`;

        return css;
    }

    /**
     * Genera CSS completo da un array di configurazioni
     * @param {Array<Object>} styleConfigs - Array di configurazioni stile
     * @returns {string} CSS completo per tutte le styleClass
     */
    static generateFullCSS(styleConfigs) {
        if (!Array.isArray(styleConfigs)) {
            throw new Error('styleConfigs deve essere un array');
        }

        if (styleConfigs.length === 0) {
            return '/* Nessuno stile personalizzato configurato */\n';
        }

        let fullCSS = '/* Stili personalizzati generati automaticamente */\n';
        
        styleConfigs.forEach(config => {
            try {
                fullCSS += this.generateCSSForStyleClass(config);
            } catch (error) {
                console.warn(`Errore generando CSS per ${config.class}: ${error.message}`);
            }
        });

        return fullCSS;
    }

    /**
     * Genera CSS da file .styles.json
     * @param {Object} stylesJSON - Contenuto del file .styles.json
     * @returns {string} CSS generato
     */
    static generateCSSFromJSON(stylesJSON) {
        if (!stylesJSON || !Array.isArray(stylesJSON.styleClass)) {
            throw new Error('File .styles.json non valido: manca array styleClass');
        }

        return this.generateFullCSS(stylesJSON.styleClass);
    }

    /**
     * Crea una configurazione stile default
     * @param {string} cssClass - Nome della classe CSS
     * @returns {Object} Configurazione stile con valori default
     */
    static createDefaultStyleConfig(cssClass) {
        return {
            class: cssClass,
            cardTitleColor: null,
            cardTitleBgColor: null,
            showHeroImage: true,
            descriptionTextSize: 'm'
        };
    }

    /**
     * Valida e pulisce un array di configurazioni stile
     * @param {Array<Object>} styleConfigs - Configurazioni da validare
     * @returns {Object} Risultato con configurazioni valide e invalide
     */
    static validateAndSanitizeConfigs(styleConfigs) {
        if (!Array.isArray(styleConfigs)) {
            return { valid: [], invalid: [{ error: 'Input non è un array', config: styleConfigs }] };
        }

        const valid = [];
        const invalid = [];

        styleConfigs.forEach((config, index) => {
            if (this.validateStyleConfig(config)) {
                // Sanitizza la configurazione
                valid.push({
                    class: config.class.trim(),
                    cardTitleColor: config.cardTitleColor,
                    cardTitleBgColor: config.cardTitleBgColor,
                    showHeroImage: config.showHeroImage,
                    descriptionTextSize: config.descriptionTextSize
                });
            } else {
                invalid.push({
                    error: 'Configurazione non valida',
                    config: config,
                    index: index
                });
            }
        });

        return { valid, invalid };
    }

    /**
     * Genera un report di validazione CSS
     * @param {Array<Object>} styleConfigs - Configurazioni da analizzare
     * @returns {string} Report leggibile per l'utente
     */
    static generateValidationReport(styleConfigs) {
        const { valid, invalid } = this.validateAndSanitizeConfigs(styleConfigs);
        
        let report = `📊 Report Validazione Stili:\n\n`;
        report += `✅ Configurazioni valide: ${valid.length}\n`;
        
        if (invalid.length > 0) {
            report += `❌ Configurazioni non valide: ${invalid.length}\n\n`;
            report += `Errori trovati:\n`;
            invalid.forEach((item, index) => {
                report += `  ${index + 1}. ${item.error} - Classe: ${item.config?.class || 'sconosciuta'}\n`;
            });
        }

        if (valid.length > 0) {
            report += `\nStili che saranno applicati:\n`;
            valid.forEach(config => {
                report += `  • ${config.class}\n`;
            });
        }

        return report;
    }
}
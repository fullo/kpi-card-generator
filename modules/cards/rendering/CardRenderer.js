import { promises as fs } from 'fs';
import path from 'path';

/**
 * CardRenderer - Gestisce il rendering HTML delle carte e dei template
 * 
 * Responsabilità:
 * - Caricamento e gestione template HTML
 * - Sostituzione placeholder nei template
 * - Generazione HTML completo per browser/PDF
 * - Gestione stili CSS e metadata
 * - Modalità debug per sviluppo
 */
export class CardRenderer {
    
    /**
     * Template cache per evitare riletture multiple
     */
    static templateCache = new Map();
    
    /**
     * Configurazione di default per il rendering
     */
    static DEFAULT_CONFIG = {
        enableCache: true,
        debugMode: false,
        preserveWhitespace: false,
        validateHtml: true,
        allowHtmlMarkup: true
    };

    /**
     * Tag HTML permessi per il markup nelle carte
     */
    static ALLOWED_HTML_TAGS = [
        'strong', 'b', 'em', 'i', 'italic', 'u', 'br', 'ul', 'ol', 'li'
    ];

    /**
     * Costruttore del renderer
     * @param {Object} config - Configurazione opzionale
     */
    constructor(config = {}) {
        this.config = { ...CardRenderer.DEFAULT_CONFIG, ...config };
        this.frontTemplate = null;
        this.backTemplate = null;
        this.mainTemplate = null;
    }

    /**
     * Carica un template da file con caching opzionale
     * @param {string} templatePath - Percorso del template
     * @returns {Promise<string>} Contenuto del template
     */
    async loadTemplate(templatePath) {
        const resolvedPath = path.resolve(templatePath);
        
        // Controlla cache se abilitata
        if (this.config.enableCache && CardRenderer.templateCache.has(resolvedPath)) {
            return CardRenderer.templateCache.get(resolvedPath);
        }

        try {
            const content = await fs.readFile(resolvedPath, 'utf-8');
            
            // Salva in cache se abilitata
            if (this.config.enableCache) {
                CardRenderer.templateCache.set(resolvedPath, content);
            }
            
            return content;
        } catch (error) {
            throw new Error(`Impossibile caricare il template da ${templatePath}: ${error.message}`);
        }
    }

    /**
     * Carica i template delle carte (fronte e retro) da un file template
     * @param {string} templatePath - Percorso del file template
     * @returns {Promise<void>}
     */
    async loadCardTemplates(templatePath) {
        const templateContent = await this.loadTemplate(templatePath);
        
        const frontMatch = templateContent.match(/<template id="card-front">([\s\S]*?)<\/template>/);
        const backMatch = templateContent.match(/<template id="card-back">([\s\S]*?)<\/template>/);
        
        if (!frontMatch || !backMatch) {
            throw new Error(`Template delle carte non validi nel file: ${templatePath}. Richiesti template con id 'card-front' e 'card-back'.`);
        }
        
        this.frontTemplate = frontMatch[1].trim();
        this.backTemplate = backMatch[1].trim();
    }

    /**
     * Carica il template principale per la pagina
     * @param {string} templatePath - Percorso del template principale
     * @returns {Promise<void>}
     */
    async loadMainTemplate(templatePath) {
        this.mainTemplate = await this.loadTemplate(templatePath);
    }

    /**
     * Sanitizza l'HTML permettendo solo i tag sicuri specificati
     * @param {string} html - HTML da sanitizzare
     * @returns {string} HTML sanitizzato
     */
    static sanitizeHtml(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Escapea tutti i caratteri pericolosi prima
        let sanitized = html.replace(/[<>&"']/g, (match) => {
            const escapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
            return escapeMap[match];
        });

        // Poi ripristina solo i tag permessi
        CardRenderer.ALLOWED_HTML_TAGS.forEach(tag => {
            // Tag di apertura
            const openTagRegex = new RegExp(`&lt;(${tag}(?:\\s[^&]*?)?)&gt;`, 'gi');
            sanitized = sanitized.replace(openTagRegex, '<$1>');
            
            // Tag di chiusura
            const closeTagRegex = new RegExp(`&lt;\\/${tag}&gt;`, 'gi');
            sanitized = sanitized.replace(closeTagRegex, `</${tag}>`);
        });

        return sanitized;
    }

    /**
     * Conta i caratteri in un testo escludendo i tag HTML
     * @param {string} text - Testo che può contenere HTML
     * @returns {number} Numero di caratteri senza markup
     */
    static countTextCharacters(text) {
        if (!text || typeof text !== 'string') {
            return 0;
        }

        // Rimuove tutti i tag HTML e conta solo il testo visibile
        const textOnly = text.replace(/<[^>]*>/g, '');
        
        // Decodifica le entità HTML comuni per il conteggio corretto
        const decoded = textOnly
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&nbsp;/g, ' ');

        return decoded.length;
    }

    /**
     * Sostituisce i placeholder in un template con i valori forniti
     * @param {string} template - Template con placeholder {{variabile}}
     * @param {Object} data - Oggetto con i valori per i placeholder
     * @param {boolean} strict - Se true, lancia errore per placeholder non trovati
     * @param {boolean} allowHtml - Se true, permette HTML sicuro nei valori
     * @returns {string} Template con placeholder sostituiti
     */
    static replacePlaceholders(template, data = {}, strict = false, allowHtml = true) {
        if (!template || typeof template !== 'string') {
            return '';
        }

        // Trova tutti i placeholder nel formato {{variabile}}
        const placeholders = template.match(/\{\{([^}]+)\}\}/g) || [];
        const unresolvedPlaceholders = [];
        
        let result = template;
        
        placeholders.forEach(placeholder => {
            const key = placeholder.slice(2, -2).trim(); // Rimuove {{ }}
            
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                let safeValue;
                
                if (typeof value === 'string') {
                    if (allowHtml) {
                        // Usa il sanitizzatore HTML per permettere tag sicuri
                        safeValue = CardRenderer.sanitizeHtml(value);
                    } else {
                        // Escape completo HTML se allowHtml è false
                        safeValue = value.replace(/[<>&"']/g, (match) => {
                            const escapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
                            return escapeMap[match];
                        });
                    }
                } else {
                    safeValue = String(value);
                }
                
                result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), safeValue);
            } else {
                unresolvedPlaceholders.push(key);
                if (strict) {
                    throw new Error(`Placeholder non trovato: ${key}`);
                }
                // In modalità non-strict, lascia il placeholder così com'è
            }
        });

        return result;
    }

    /**
     * Genera l'HTML per una singola carta
     * @param {Object} card - Oggetto carta
     * @param {boolean} isFront - True per fronte, false per retro
     * @param {Object} exerciseData - Dati dell'esercizio per il retro
     * @returns {string} HTML della carta
     */
    renderCard(card, isFront = true, exerciseData = {}) {
        if (!this.frontTemplate || !this.backTemplate) {
            throw new Error('Template delle carte non caricati. Usa loadCardTemplates() prima di renderizzare.');
        }

        // Gestisci placeholder
        if (card.isPlaceholder) {
            const placeholderClass = this.config.debugMode ? 'playing-card placeholder debug' : 'playing-card placeholder';
            const debugInfo = this.config.debugMode ? '<span class="debug-info">PLACEHOLDER</span>' : '';
            return `<div class="${placeholderClass}">${debugInfo}</div>`;
        }

        const template = isFront ? this.frontTemplate : this.backTemplate;
        const data = isFront ? card : { ...exerciseData, styleClass: card.styleClass || '' };
        
        try {
            return this.constructor.replacePlaceholders(template, data, false, this.config.allowHtmlMarkup);
        } catch (error) {
            if (this.config.debugMode) {
                return `<div class="playing-card error">
                    <div class="error-message">Errore rendering: ${error.message}</div>
                    <div class="error-data">${JSON.stringify(data, null, 2)}</div>
                </div>`;
            }
            throw error;
        }
    }

    /**
     * Genera l'HTML per una griglia di carte
     * @param {Array} cards - Array di carte
     * @param {boolean} isFront - True per fronte, false per retro
     * @param {Object} exerciseData - Dati dell'esercizio
     * @returns {string} HTML della griglia
     */
    renderCardGrid(cards, isFront = true, exerciseData = {}) {
        if (!Array.isArray(cards)) {
            throw new Error('Cards deve essere un array');
        }

        const cardsHtml = cards
            .map(card => this.renderCard(card, isFront, exerciseData))
            .join('');
        
        const debugClass = this.config.debugMode ? ' debug' : '';
        return `<div class="card-grid${debugClass}">${cardsHtml}</div>`;
    }

    /**
     * Genera l'HTML per una singola pagina (fronte + retro)
     * @param {Array} fronts - Carte del fronte
     * @param {Array} backs - Carte del retro
     * @param {Object} exerciseData - Dati dell'esercizio
     * @param {number} pageIndex - Indice della pagina (per titoli)
     * @param {number} totalPages - Numero totale di pagine
     * @returns {string} HTML della pagina
     */
    renderPage(fronts, backs, exerciseData, pageIndex = 0, totalPages = 1) {
        const frontTitle = totalPages > 1 ? 
            `Fronte Carte - Foglio ${pageIndex + 1}` : 
            'Fronte Carte';
        const backTitle = totalPages > 1 ? 
            `Retro Carte - Foglio ${pageIndex + 1}` : 
            'Retro Carte';

        const frontGridHtml = this.renderCardGrid(fronts, true, exerciseData);
        const backGridHtml = this.renderCardGrid(backs, false, exerciseData);
        
        const debugInfo = this.config.debugMode ? 
            `<!-- PAGINA ${pageIndex + 1} di ${totalPages} -->` : '';

        return `${debugInfo}
        <div class="fronts-container">
            <h2 class="section-title">${frontTitle}</h2>
            ${frontGridHtml}
        </div>
        <div class="backs-container">
            <h2 class="section-title">${backTitle}</h2>
            ${backGridHtml}
        </div>`;
    }

    /**
     * Genera l'HTML per tutte le pagine
     * @param {Array} pages - Array di pagine con {fronts, backs}
     * @param {Object} exerciseData - Dati dell'esercizio
     * @returns {string} HTML di tutte le pagine
     */
    renderAllPages(pages, exerciseData = {}) {
        if (!Array.isArray(pages) || pages.length === 0) {
            return '<div class="no-content">Nessuna pagina da renderizzare</div>';
        }

        const pagesHtml = pages.map((page, index) => {
            return this.renderPage(page.fronts, page.backs, exerciseData, index, pages.length);
        }).join(pages.length > 1 ? '<div class="sheet-separator"></div>' : '');

        return pagesHtml;
    }

    /**
     * Genera stili CSS dinamici per la modalità di stampa
     * @param {string} printMode - Modalità di stampa ('short' o 'long')
     * @param {boolean} isMultiPage - True se ci sono più pagine
     * @returns {string} CSS dinamico
     */
    generateDynamicStyles(printMode = 'short', isMultiPage = false) {
        const debugStyles = this.config.debugMode ? `
            .debug { border: 2px dashed #ff0000 !important; }
            .debug-info { 
                position: absolute; top: 0; right: 0; 
                background: #ff0000; color: white; 
                padding: 2px 4px; font-size: 10px; 
            }
            .error { background: #ffe6e6 !important; border: 2px solid #ff0000 !important; }
            .error-message { color: #cc0000; font-weight: bold; }
            .error-data { font-size: 10px; color: #666; white-space: pre; }
        ` : '';

        return `<style>
            /* Stili per l'indicatore della modalità a schermo */
            @media screen {
                .print-mode-info {
                    background-color: #fef3c7; border: 2px solid #f59e0b; padding: 1rem;
                    margin: 1rem auto; border-radius: 0.5rem; text-align: center; max-width: 600px;
                }
                .print-mode-info strong { color: #d97706; text-transform: uppercase; }
            }

            /* Stili specifici per la stampa */
            @media print {
                .print-mode-info { display: none !important; }
                
                /* Separatore di pagina per la stampa multi-foglio */
                ${isMultiPage ? '.sheet-separator { page-break-after: always; height: 0; display: block; }' : ''}
                
                /* La rotazione del retro dipende dalla modalità di flip */
                ${printMode === 'long' ? 
                '.backs-container .playing-card { transform: rotate(180deg); }' : 
                ''
                }
            }
            
            ${debugStyles}
        </style>`;
    }

    /**
     * Genera l'indicatore della modalità di stampa
     * @param {string} printMode - Modalità di stampa
     * @param {string} description - Descrizione della modalità
     * @returns {string} HTML dell'indicatore
     */
    generateModeIndicator(printMode, description) {
        return `<div class="print-mode-info no-print">
            <strong>Modalità stampa: ${printMode.toUpperCase()}</strong><br>
            ${description}
        </div>`;
    }

    /**
     * Renderizza il documento HTML completo
     * @param {Array} pages - Array di pagine
     * @param {Object} exerciseData - Dati dell'esercizio
     * @param {string} printMode - Modalità di stampa
     * @param {string} modeDescription - Descrizione della modalità
     * @param {string} customCSS - CSS personalizzato opzionale da iniettare
     * @returns {Promise<string>} HTML completo del documento
     */
    async renderComplete(pages, exerciseData = {}, printMode = 'short', modeDescription = '', customCSS = '') {
        if (!this.mainTemplate) {
            throw new Error('Template principale non caricato. Usa loadMainTemplate() prima di renderizzare.');
        }

        const allPagesHtml = this.renderAllPages(pages, exerciseData);
        const dynamicStyles = this.generateDynamicStyles(printMode, pages.length > 1);
        const modeIndicator = this.generateModeIndicator(printMode, modeDescription);
        
        // Sostituisci i placeholder nel template principale (non permettere HTML nel titolo per sicurezza)
        let fullHtml = this.constructor.replacePlaceholders(this.mainTemplate, {
            TITOLO_ESERCIZIO: exerciseData.title || '',
            SOTTOTITOLO_ESERCIZIO: exerciseData.subtitle || '',
            customCSS: customCSS || ''
        }, false, false);

        // Inserisci gli stili dinamici prima della chiusura dell'head
        fullHtml = fullHtml.replace('</head>', `${dynamicStyles}</head>`);

        // Sostituisci il contenuto del body
        const contentToReplace = modeIndicator + allPagesHtml;
        
        // Trova e sostituisci il layout esistente con quello nuovo
        const layoutBlockRegex = /<div class="fronts-container">[\s\S]*?<\/div>(\s*<div class="print-instructions no-print">[\s\S]*?<\/div>)?\s*<div class="backs-container">[\s\S]*?<\/div>/s;
        fullHtml = fullHtml.replace(layoutBlockRegex, contentToReplace);

        return fullHtml;
    }

    /**
     * Pulisce la cache dei template
     */
    static clearCache() {
        CardRenderer.templateCache.clear();
    }

    /**
     * Valida la struttura di un template HTML
     * @param {string} template - Template da validare
     * @returns {{isValid: boolean, errors: Array<string>}} Risultato della validazione
     */
    static validateTemplate(template) {
        const errors = [];
        
        if (!template || typeof template !== 'string') {
            errors.push('Template deve essere una stringa non vuota');
            return { isValid: false, errors };
        }

        // Controlla bilanciamento tag HTML base
        const openTags = (template.match(/<[^/][^>]*>/g) || []).filter(tag => !tag.endsWith('/>'));
        const closeTags = template.match(/<\/[^>]+>/g) || [];
        
        if (openTags.length !== closeTags.length) {
            errors.push('Tag HTML non bilanciati');
        }

        // Controlla placeholder malformati (non doppi)
        const malformedPlaceholders = template.match(/\{[^}]*\}(?!\})/g);
        if (malformedPlaceholders) {
            // Filtra solo quelli che non sono {{}}
            const actualMalformed = malformedPlaceholders.filter(p => !p.startsWith('{{') || !p.endsWith('}}'));
            if (actualMalformed.length > 0) {
                errors.push(`Placeholder malformati trovati: ${actualMalformed.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

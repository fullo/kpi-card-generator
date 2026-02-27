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
     * Soglia di caratteri nella description oltre la quale si attiva il layout compatto:
     * nasconde heroImage, flavorText e card-type-banner per recuperare spazio verticale.
     *
     * Sotto i 1000 caratteri il sistema di font scaling dinamico (calculateCardCssVars)
     * è sufficiente a contenere il testo senza nascondere elementi strutturali.
     * Oltre i 1000 caratteri servono misure aggiuntive: nascondere heroImage (~90px),
     * card-type-banner (~25px) e flavorText (~20px) per recuperare ~135px di spazio.
     */
    static LONG_CONTENT_THRESHOLD = 1000;

    /**
     * Calcola le CSS custom properties per font e padding in base alla lunghezza della description.
     * Scala linearmente tra i breakpoint definiti.
     *
     * Layout carta (schermo): 420px totali, ~200px disponibili per description con heroImage.
     * I breakpoint 0-1000 calibrano font e padding con heroImage visibile; oltre 1000
     * (long-content) heroImage/flavorText/card-type-banner vengono nascosti.
     *
     * Custom properties generate:
     * - --card-desc-font-size (rem)       Font size a schermo
     * - --card-desc-line-height            Line height a schermo
     * - --card-desc-font-size-print (pt)  Font size in stampa
     * - --card-desc-line-height-print      Line height in stampa
     * - --card-desc-padding (rem)          Padding card-description-box a schermo
     * - --card-desc-padding-print (mm)     Padding card-description-box in stampa
     *
     * @param {number} descLength - Lunghezza della description in caratteri
     * @returns {string} Stringa CSS inline con le custom properties
     */
    static calculateCardCssVars(descLength) {
        if (!descLength || descLength <= 0) {
            return '';
        }

        // Breakpoints: [chars, screenFontRem, screenLH, printFontPt, printLH, paddingRem, paddingMm]
        //
        // 0-1000:  con heroImage visibile, font/padding scaling dinamico sufficiente
        // 1000+:   long-content attivo, heroImage/flavorText/card-type-banner nascosti
        const breakpoints = [
            [0,    0.90, 1.40, 7.0, 1.30, 0.75, 2.0],  // default
            [150,  0.82, 1.30, 6.5, 1.25, 0.60, 1.8],  // riduzione precoce
            [250,  0.75, 1.25, 6.0, 1.20, 0.50, 1.5],  // testo medio
            [500,  0.70, 1.20, 5.5, 1.18, 0.35, 1.2],  // testo medio-lungo
            [700,  0.65, 1.15, 5.0, 1.12, 0.25, 1.0],  // testo lungo
            [1000, 0.60, 1.12, 4.5, 1.10, 0.20, 0.8],  // soglia long-content
            [1500, 0.55, 1.10, 4.0, 1.08, 0.15, 0.5],  // testo extra lungo
            [2000, 0.50, 1.08, 3.5, 1.05, 0.10, 0.3],  // massimo
        ];

        // Se sotto il primo breakpoint significativo, nessuna variabile necessaria
        if (descLength <= breakpoints[0][0]) {
            return '';
        }

        // Trova il segmento di interpolazione
        let lower = breakpoints[0];
        let upper = breakpoints[breakpoints.length - 1];

        for (let i = 0; i < breakpoints.length - 1; i++) {
            if (descLength >= breakpoints[i][0] && descLength < breakpoints[i + 1][0]) {
                lower = breakpoints[i];
                upper = breakpoints[i + 1];
                break;
            }
        }

        // Se oltre l'ultimo breakpoint, usa i valori minimi
        if (descLength >= breakpoints[breakpoints.length - 1][0]) {
            const last = breakpoints[breakpoints.length - 1];
            return `--card-desc-font-size: ${last[1]}rem; --card-desc-line-height: ${last[2]}; --card-desc-font-size-print: ${last[3]}pt; --card-desc-line-height-print: ${last[4]}; --card-desc-padding: ${last[5]}rem; --card-desc-padding-print: ${last[6]}mm`;
        }

        // Interpolazione lineare tra lower e upper
        const ratio = (descLength - lower[0]) / (upper[0] - lower[0]);
        const screenFont = +(lower[1] + (upper[1] - lower[1]) * ratio).toFixed(3);
        const screenLH = +(lower[2] + (upper[2] - lower[2]) * ratio).toFixed(3);
        const printFont = +(lower[3] + (upper[3] - lower[3]) * ratio).toFixed(2);
        const printLH = +(lower[4] + (upper[4] - lower[4]) * ratio).toFixed(3);
        const padding = +(lower[5] + (upper[5] - lower[5]) * ratio).toFixed(3);
        const paddingPrint = +(lower[6] + (upper[6] - lower[6]) * ratio).toFixed(2);

        return `--card-desc-font-size: ${screenFont}rem; --card-desc-line-height: ${screenLH}; --card-desc-font-size-print: ${printFont}pt; --card-desc-line-height-print: ${printLH}; --card-desc-padding: ${padding}rem; --card-desc-padding-print: ${paddingPrint}mm`;
    }

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
        let data = isFront ? card : { ...exerciseData, styleClass: card.styleClass || '' };

        if (isFront) {
            const descLength = card.description ? card.description.length : 0;

            // Calcola CSS custom properties dinamiche per il font
            const cssVars = CardRenderer.calculateCardCssVars(descLength);
            data = { ...data, cardCssVars: cssVars };

            // Rileva carte con contenuto lungo e aggiunge classe CSS per layout compatto
            if (descLength >= CardRenderer.LONG_CONTENT_THRESHOLD) {
                data.styleClass = `${data.styleClass || ''} long-content`.trim();
            }
        } else {
            data = { ...data, cardCssVars: '' };
        }

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

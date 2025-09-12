import { CardRenderer } from '../../modules/cards/rendering/CardRenderer.js';
import { LayoutCalculator } from '../../modules/cards/rendering/LayoutCalculator.js';
import { FileStore } from '../storage/FileStore.js';
import { StyleCustomizer } from '../../modules/styles/StyleCustomizer.js';
import path from 'path';

/**
 * RenderService - Service per rendering HTML delle carte
 * Integra CardRenderer e LayoutCalculator per generare HTML completo
 */
export class RenderService {
    constructor() {
        this.renderer = new CardRenderer();
        this.fileStore = new FileStore();
        this.styleCustomizer = new StyleCustomizer();
        this._initializeRenderer();
    }

    /**
     * Inizializza CardRenderer con i template
     */
    async _initializeRenderer() {
        try {
            // Use absolute paths - go up from api/services/ to project root
            const currentDir = path.dirname(import.meta.url.replace('file://', ''));
            const projectRoot = path.resolve(currentDir, '..', '..');  // up from services/ to api/ to project root
            const cardTemplatePath = path.join(projectRoot, 'assets', 'card-template.html');
            const mainTemplatePath = path.join(projectRoot, 'assets', 'main-template.html');
            
            console.log('Loading templates from:', { cardTemplatePath, mainTemplatePath });
            
            await this.renderer.loadCardTemplates(cardTemplatePath);
            await this.renderer.loadMainTemplate(mainTemplatePath);
        } catch (error) {
            console.error('Errore caricamento template CardRenderer:', error.message);
            throw new Error(`Template loading failed: ${error.message}`);
        }
    }

    /**
     * Carica CSS personalizzati per un deck (se esistono)
     * @param {string} deckId - ID del deck
     * @param {Object} deckData - Dati del deck
     * @returns {Promise<string>} CSS personalizzato o stringa vuota
     */
    async _loadCustomCSS(deckId, deckData) {
        if (!deckId) return '';
        
        try {
            // Build deck path similar to DeckService.getDeckPath
            const deckPath = path.join(this.fileStore.decksPath, `${deckId}.json`);
            const hasCustomStyles = await this.styleCustomizer.hasExistingStylesConfig(deckPath);
            
            if (!hasCustomStyles) {
                return '';
            }
            
            const stylesConfig = await this.styleCustomizer.loadExistingStylesConfig(deckPath);
            if (!stylesConfig || !stylesConfig.styleClass) {
                return '';
            }
            
            // Genera CSS dai file di configurazione
            const customCSS = await this.styleCustomizer.generateCSSForDeck(deckData, deckPath);
            return `\n<style>\n${customCSS}\n</style>\n`;
            
        } catch (error) {
            console.warn(`Errore caricando CSS personalizzati per deck ${deckId}: ${error.message}`);
            return '';
        }
    }

    /**
     * Renderizza un mazzo completo in HTML
     */
    async renderDeckHTML(deckData, options = {}) {
        const defaultOptions = {
            printMode: 'landscape',
            cardsPerPage: 8,
            cardsPerRow: 4,
            template: 'default',
            debugMode: false
        };

        const renderOptions = { ...defaultOptions, ...options };
        
        // Normalize print mode using LayoutCalculator (landscape -> long, portrait -> short)
        const normalizedPrintMode = LayoutCalculator.normalizeMode(renderOptions.printMode);
        renderOptions.printMode = normalizedPrintMode;

        // Verifica che il mazzo abbia carte (support both English and Italian schema)
        const cards = deckData.cards || deckData.carte || [];
        if (cards.length === 0) {
            throw new Error('Il mazzo non contiene carte da renderizzare');
        }

        try {
            // Paginazione delle carte
            const paginatedData = this._paginateCards(
                cards,
                renderOptions.cardsPerPage,
                renderOptions.cardsPerRow
            );

            // Calcola layout speculari per ogni pagina
            const layouts = paginatedData.map(page => ({
                fronts: page.cards,
                backs: LayoutCalculator.calculateMirrorLayout(
                    page.cards,
                    renderOptions.cardsPerRow,
                    renderOptions.printMode
                )
            }));

            // Carica CSS personalizzati
            const customCSS = options.deckId ? await this._loadCustomCSS(options.deckId, deckData) : '';

            // Renderizza HTML usando CardRenderer
            const htmlContent = await this.renderer.renderComplete(
                layouts,
                deckData,
                renderOptions.printMode,
                `${renderOptions.printMode} - ${renderOptions.cardsPerPage} carte per pagina`,
                customCSS
            );

            return {
                html: htmlContent,
                stats: {
                    totalCards: cards.length,
                    totalPages: layouts.length,
                    cardsPerPage: renderOptions.cardsPerPage,
                    cardsPerRow: renderOptions.cardsPerRow,
                    printMode: renderOptions.printMode,
                    renderedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            throw new Error(`Errore durante il rendering: ${error.message}`);
        }
    }

    /**
     * Renderizza anteprima singola carta
     */
    async renderSingleCard(cardData, options = {}) {
        const defaultOptions = {
            template: 'default',
            debugMode: true
        };

        const renderOptions = { ...defaultOptions, ...options };

        try {
            // Crea un layout con una sola carta
            const layouts = [{
                fronts: [cardData],
                backs: []
            }];

            // Crea un deck mock per il rendering
            const mockDeck = {
                title: 'Anteprima Carta',
                subtitle: 'Preview Mode',
                deckIcon: '🔍',
                cards: [cardData]
            };

            const htmlContent = await this.renderer.renderComplete(layouts, mockDeck, 'single', 'Anteprima singola carta');

            return {
                html: htmlContent,
                stats: {
                    cardTitle: cardData.titolo,
                    cardType: cardData.tipo,
                    renderedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            throw new Error(`Errore rendering carta singola: ${error.message}`);
        }
    }

    /**
     * Genera anteprima HTML con stili integrati per browser
     */
    async renderPreview(deckId, options = {}) {
        // Recupera il mazzo
        const deck = await this.fileStore.getDeck(deckId);
        
        const previewOptions = {
            ...options,
            debugMode: true, // Abilita sempre debug mode per preview
            inlineCss: true, // CSS inline per preview browser
            deckId: deckId   // Pass deckId for custom CSS loading
        };

        const result = await this.renderDeckHTML(deck, previewOptions);

        // Aggiungi meta informazioni per la preview
        const previewHtml = this._addPreviewWrapper(result.html, deck, result.stats);

        return {
            html: previewHtml,
            deck: {
                id: deckId,
                title: deck.title || deck.titolo,
                subtitle: deck.subtitle || deck.sottotitolo
            },
            stats: result.stats
        };
    }

    /**
     * Helper per paginare le carte (semplificato)
     */
    _paginateCards(cards, cardsPerPage, cardsPerRow) {
        const pages = [];
        
        for (let i = 0; i < cards.length; i += cardsPerPage) {
            const pageCards = cards.slice(i, i + cardsPerPage);
            
            // Aggiunge placeholder se necessario per completare la griglia
            while (pageCards.length % cardsPerRow !== 0 && pageCards.length < cardsPerPage) {
                pageCards.push(this._createPlaceholderCard());
            }
            
            pages.push({
                pageNumber: Math.floor(i / cardsPerPage) + 1,
                cards: pageCards,
                isComplete: pageCards.length === cardsPerPage
            });
        }

        return pages;
    }

    /**
     * Crea carta placeholder per completare la griglia
     */
    _createPlaceholderCard() {
        return {
            title: '',
            icon: '',
            emoji: '',
            type: '',
            text: '',
            flavor: '',
            cssClass: 'card-placeholder',
            isPlaceholder: true
        };
    }

    /**
     * Aggiunge wrapper HTML per preview browser
     */
    _addPreviewWrapper(html, deck, stats) {
        return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: ${deck.title || deck.titolo}</title>
    <style>
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .preview-header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .preview-title {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
            font-weight: 600;
        }
        .preview-subtitle {
            margin: 5px 0 0 0;
            color: #6b7280;
            font-size: 16px;
        }
        .preview-stats {
            margin: 10px 0 0 0;
            font-size: 14px;
            color: #9ca3af;
        }
        .preview-content {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <h1 class="preview-title">${deck.title || deck.titolo}</h1>
        <p class="preview-subtitle">${deck.subtitle || deck.sottotitolo || ''}</p>
        <div class="preview-stats">
            ${stats.totalCards} carte • ${stats.totalPages} pagine • ${stats.printMode} • ${stats.cardsPerPage} carte per pagina
        </div>
    </div>
    <div class="preview-content">
        ${html}
    </div>
</body>
</html>`;
    }

    /**
     * Valida opzioni di rendering
     */
    validateRenderOptions(options) {
        const validPrintModes = ['landscape', 'portrait'];
        const validCardsPerPage = [4, 6, 8, 9, 12, 16];
        const validCardsPerRow = [2, 3, 4];

        const errors = [];

        if (options.printMode && !validPrintModes.includes(options.printMode)) {
            errors.push(`Print mode non valido: ${options.printMode}. Validi: ${validPrintModes.join(', ')}`);
        }

        if (options.cardsPerPage && !validCardsPerPage.includes(options.cardsPerPage)) {
            errors.push(`Cards per page non valido: ${options.cardsPerPage}. Validi: ${validCardsPerPage.join(', ')}`);
        }

        if (options.cardsPerRow && !validCardsPerRow.includes(options.cardsPerRow)) {
            errors.push(`Cards per row non valido: ${options.cardsPerRow}. Validi: ${validCardsPerRow.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
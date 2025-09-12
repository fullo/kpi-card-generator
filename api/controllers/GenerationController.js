import { DeckService } from '../services/DeckService.js';
import { RenderService } from '../services/RenderService.js';
import { PDFService } from '../services/PDFService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GenerationController - Gestisce export e generazione PDF/HTML
 */
export class GenerationController {
    constructor() {
        this.deckService = new DeckService();
        this.renderService = new RenderService();
        this.pdfService = new PDFService();
    }

    /**
     * POST /decks/:id/export/pdf - Genera ed esporta PDF
     */
    exportPDF = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const { options = {} } = req.body;

        // Valida opzioni di rendering
        const renderValidation = this.renderService.validateRenderOptions(options);
        if (!renderValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Opzioni rendering non valide',
                details: renderValidation.errors
            });
        }

        // Valida opzioni PDF
        const pdfValidation = this.pdfService.validatePDFOptions(options);
        if (!pdfValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Opzioni PDF non valide',
                details: pdfValidation.errors
            });
        }

        try {
            // 1. Recupera e valida il mazzo
            const deck = await this.deckService.getDeck(deckId);
            const validation = await this.deckService.validateDeck(deck);

            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Mazzo non valido',
                    message: 'Il mazzo contiene errori che impediscono la generazione PDF',
                    details: validation.errors
                });
            }

            // 2. Rendering HTML
            const renderOptions = { ...options, deckId };
            const renderResult = await this.renderService.renderDeckHTML(deck, renderOptions);

            // 3. Generazione PDF
            const pdfResult = await this.pdfService.generatePDF(renderResult.html, options);

            // 4. Salva temporaneamente
            const downloadInfo = await this.pdfService.saveTemporaryPDF(
                pdfResult.buffer,
                { id: deckId, titolo: deck.titolo || deck.title || 'unknown' },
                options
            );

            // 5. Response con info download
            res.json({
                success: true,
                data: {
                    ...downloadInfo,
                    generation: {
                        duration: pdfResult.duration,
                        renderStats: renderResult.stats,
                        pdfSize: pdfResult.size,
                        pages: renderResult.stats.totalPages
                    }
                },
                message: 'PDF generato con successo'
            });

        } catch (error) {
            console.error('Errore generazione PDF:', error);
            
            res.status(500).json({
                success: false,
                error: 'Errore generazione PDF',
                message: error.message
            });
        }
    });

    /**
     * POST /decks/:id/export/json - Esporta mazzo in formato JSON
     */
    exportJSON = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const { options = {} } = req.body;

        try {
            // Recupera il mazzo
            const deck = await this.deckService.getDeck(deckId);
            
            // Carica stili personalizzati se esistono
            let customStyles = null;
            try {
                const path = await import('path');
                const deckPath = path.join(this.deckService.fileStore.decksPath, `${deckId}.json`);
                const hasCustomStyles = await this.renderService.styleCustomizer.hasExistingStylesConfig(deckPath);
                if (hasCustomStyles) {
                    customStyles = await this.renderService.styleCustomizer.loadExistingStylesConfig(deckPath);
                }
            } catch (styleError) {
                console.warn('Errore caricando stili personalizzati:', styleError.message);
            }

            // Preparazione dati JSON
            const exportData = {
                deck: {
                    ...deck,
                    id: deckId
                },
                metadata: {
                    exportDate: new Date().toISOString(),
                    exportedBy: 'KPI Card Generator API',
                    version: '1.0',
                    totalCards: deck.cards?.length || 0
                }
            };

            // Include stili personalizzati se presenti
            if (customStyles) {
                exportData.customStyles = customStyles;
            }

            // Include opzioni se specificate
            if (options.includeOptions) {
                exportData.exportOptions = options;
            }

            // Response con i dati JSON
            const filename = `${deck.title || deck.titolo || 'deck'}_${new Date().toISOString().split('T')[0]}.json`;
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            res.json({
                success: true,
                data: exportData,
                filename: filename,
                message: 'JSON esportato con successo'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Errore esportazione JSON',
                message: error.message
            });
        }
    });

    /**
     * GET /decks/:id/preview - Anteprima HTML per browser
     */
    previewHTML = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const { printMode, template, debugMode } = req.query;

        const previewOptions = {
            printMode: printMode || 'landscape',
            template: template || 'default',
            debugMode: debugMode === 'true'
        };

        try {
            // Genera anteprima HTML
            const previewResult = await this.renderService.renderPreview(deckId, previewOptions);

            // Restituisce HTML direttamente per visualizzazione browser
            res.set('Content-Type', 'text/html; charset=utf-8');
            res.send(previewResult.html);

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Errore generazione anteprima',
                message: error.message
            });
        }
    });

    /**
     * GET /decks/:id/preview/json - Anteprima info in JSON
     */
    previewInfo = asyncHandler(async (req, res) => {
        const { id: deckId } = req.params;
        const { printMode, template } = req.query;

        const previewOptions = {
            printMode: printMode || 'landscape',
            template: template || 'default'
        };

        try {
            const previewResult = await this.renderService.renderPreview(deckId, previewOptions);
            
            res.json({
                success: true,
                data: {
                    deck: previewResult.deck,
                    stats: previewResult.stats,
                    previewUrl: `/api/v1/decks/${deckId}/preview`,
                    options: previewOptions
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Errore info anteprima',
                message: error.message
            });
        }
    });

    /**
     * POST /decks/:id/cards/:cardId/preview - Anteprima singola carta
     */
    previewCard = asyncHandler(async (req, res) => {
        const { id: deckId, cardId } = req.params;
        const { template, debugMode } = req.query;

        try {
            // Recupera la carta specifica
            const cards = await this.deckService.getDeck(deckId);
            const card = cards.carte.find(c => 
                (c.id && c.id === cardId) || 
                `${deckId}_card_${cards.carte.indexOf(c)}` === cardId
            );

            if (!card) {
                return res.status(404).json({
                    success: false,
                    error: 'Carta non trovata',
                    message: `Carta con ID ${cardId} non trovata nel mazzo ${deckId}`
                });
            }

            // Rendering carta singola
            const previewOptions = {
                template: template || 'default',
                debugMode: debugMode === 'true'
            };

            const renderResult = await this.renderService.renderSingleCard(card, previewOptions);

            // Restituisce HTML direttamente
            res.set('Content-Type', 'text/html; charset=utf-8');
            res.send(renderResult.html);

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Errore anteprima carta',
                message: error.message
            });
        }
    });

    /**
     * GET /downloads/:filename - Download file temporanei
     */
    downloadFile = asyncHandler(async (req, res) => {
        const { filename } = req.params;

        try {
            const fileInfo = await this.pdfService.getTemporaryFileInfo(filename);

            if (!fileInfo.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'File non trovato',
                    message: 'Il file richiesto non esiste o è scaduto'
                });
            }

            // Imposta headers per download
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fileInfo.size,
                'Cache-Control': 'no-cache'
            });

            // Invia il file
            res.sendFile(fileInfo.filepath);

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Errore download file',
                message: error.message
            });
        }
    });

    /**
     * GET /exports/stats - Statistiche export
     */
    getExportStats = asyncHandler(async (req, res) => {
        try {
            const stats = await this.pdfService.getUsageStats();
            const fileList = await this.pdfService.listTemporaryFiles();

            res.json({
                success: true,
                data: {
                    usage: stats,
                    recentExports: fileList.files.slice(0, 10), // Ultimi 10 file
                    cleanup: {
                        suggestion: stats.totalStorageUsed > 100 * 1024 * 1024 ? 'Considera di eseguire cleanup' : null,
                        autoCleanupEndpoint: '/api/v1/exports/cleanup'
                    }
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Errore statistiche export',
                message: error.message
            });
        }
    });

    /**
     * POST /exports/cleanup - Pulisci file scaduti
     */
    cleanupExpiredFiles = asyncHandler(async (req, res) => {
        const { maxAgeHours = 12 } = req.body;

        try {
            const cleanupResult = await this.pdfService.cleanupExpiredFiles(maxAgeHours);

            res.json({
                success: true,
                data: cleanupResult,
                message: `Cleanup completato: ${cleanupResult.deletedFiles} file eliminati`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Errore cleanup',
                message: error.message
            });
        }
    });
}
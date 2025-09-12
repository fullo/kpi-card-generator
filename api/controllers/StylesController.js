import { StyleCustomizer } from '../../modules/styles/StyleCustomizer.js';
import { StyleCollector } from '../../modules/styles/StyleCollector.js';
import { CSSGenerator } from '../../modules/styles/CSSGenerator.js';
import { DeckService } from '../services/DeckService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * StylesController - Gestisce endpoint REST per la personalizzazione degli stili CSS
 */
export class StylesController {
    constructor() {
        this.deckService = new DeckService();
        this.styleCustomizer = new StyleCustomizer();
    }

    /**
     * GET /decks/:id/styles - Ottieni configurazione stili esistente
     */
    getStyles = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Verifica che il deck esista
        const deck = await this.deckService.getDeck(id);
        const deckPath = this.deckService.getDeckPath(id);
        
        // Ottieni il percorso del file stili
        const stylesPath = this.styleCustomizer.getStylesFilePath(deckPath);
        
        try {
            // Leggi la configurazione esistente
            const stylesContent = await fs.readFile(stylesPath, 'utf-8');
            const stylesConfig = JSON.parse(stylesContent);
            
            res.json({
                success: true,
                data: {
                    deckId: id,
                    stylesPath: path.basename(stylesPath),
                    configuration: stylesConfig,
                    hasStyles: true
                }
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File non esiste - ritorna configurazione vuota ma disponibile
                const availableClasses = StyleCollector.extractUniqueStyleClasses(deck);
                
                res.json({
                    success: true,
                    data: {
                        deckId: id,
                        stylesPath: null,
                        configuration: null,
                        hasStyles: false,
                        availableClasses
                    }
                });
            } else {
                throw error;
            }
        }
    });

    /**
     * GET /decks/:id/styles/available - Ottieni le classi di stile disponibili
     */
    getAvailableClasses = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const deck = await this.deckService.getDeck(id);
        
        const availableClasses = StyleCollector.extractUniqueStyleClasses(deck);
        
        res.json({
            success: true,
            data: {
                deckId: id,
                availableClasses: availableClasses,
                totalCards: deck.cards?.length || 0,
                classCount: availableClasses.length
            }
        });
    });

    /**
     * POST /decks/:id/styles - Crea o aggiorna configurazione stili
     */
    saveStyles = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const requestBody = req.body;
        
        console.log('DEBUG: Style save request body:', requestBody);
        
        // Validazione base - deve avere styleClass
        if (!requestBody.styleClass || typeof requestBody.styleClass !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'styleClass is required and must be a string'
            });
        }
        
        // Extract styleClass and create configuration object
        const { styleClass, ...styleConfig } = requestBody;
        
        console.log('DEBUG: styleClass:', styleClass);
        console.log('DEBUG: styleConfig:', styleConfig);
        
        if (Object.keys(styleConfig).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid configuration',
                message: 'Style configuration properties are required'
            });
        }
        
        // Verifica che il deck esista
        const deck = await this.deckService.getDeck(id);
        const deckPath = this.deckService.getDeckPath(id);
        
        // Crea la configurazione per la specifica styleClass
        const singleClassConfig = {
            class: styleClass,
            ...styleConfig
        };
        
        // Usa StyleCustomizer per validare la configurazione della singola classe
        const validation = StyleCustomizer.validateStyleClassConfig(singleClassConfig);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Configuration validation failed',
                message: 'Invalid style configuration',
                details: validation.errors
            });
        }
        
        try {
            // Salva/aggiorna la configurazione per questa styleClass
            const savedConfig = await this.styleCustomizer.updateStyleClassConfig(deckPath, styleClass, styleConfig);
            
            // Genera il CSS risultante per preview
            const generatedCSS = CSSGenerator.generateCSSFromJSON(savedConfig);
            
            res.status(201).json({
                success: true,
                data: savedConfig,
                generatedCSS,
                message: `Configurazione per styleClass "${styleClass}" salvata con successo`
            });
            
        } catch (error) {
            throw error;
        }
    });

    /**
     * DELETE /decks/:id/styles - Rimuovi configurazione stili
     */
    deleteStyles = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { createBackup = true } = req.query;
        
        // Verifica che il deck esista
        await this.deckService.getDeck(id);
        const deckPath = this.deckService.getDeckPath(id);
        
        const stylesPath = this.styleCustomizer.getStylesFilePath(deckPath);
        
        try {
            // Verifica che il file esista
            await fs.access(stylesPath);
            
            // Crea backup se richiesto
            if (createBackup === 'true' || createBackup === true) {
                await this.styleCustomizer.createBackup(stylesPath);
            }
            
            // Rimuovi il file
            await fs.unlink(stylesPath);
            
            res.json({
                success: true,
                data: {
                    deckId: id,
                    removed: true,
                    backupCreated: createBackup === 'true' || createBackup === true
                },
                message: 'Configurazione stili rimossa con successo'
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    error: 'Styles not found',
                    message: 'Nessuna configurazione stili trovata per questo deck'
                });
            } else {
                throw error;
            }
        }
    });

    /**
     * GET /decks/:id/styles/preview - Genera CSS per preview
     */
    previewCSS = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Verifica che il deck esista
        await this.deckService.getDeck(id);
        const deckPath = this.deckService.getDeckPath(id);
        
        const stylesPath = this.styleCustomizer.getStylesFilePath(deckPath);
        
        try {
            const stylesContent = await fs.readFile(stylesPath, 'utf-8');
            const stylesConfig = JSON.parse(stylesContent);
            
            const generatedCSS = CSSGenerator.generateCustomCSS(stylesConfig);
            
            res.json({
                success: true,
                data: {
                    deckId: id,
                    css: generatedCSS,
                    configuration: stylesConfig,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    error: 'No styles configuration',
                    message: 'Nessuna configurazione stili trovata per questo deck'
                });
            } else {
                throw error;
            }
        }
    });

    /**
     * POST /decks/:id/styles/preview - Preview CSS da configurazione temporanea
     */
    previewTempCSS = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const previewConfig = req.body; // Direct preview config per Iteration 5 spec
        
        if (!previewConfig || typeof previewConfig !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid configuration',
                message: 'Preview configuration object is required'
            });
        }
        
        // Verifica che il deck esista
        await this.deckService.getDeck(id);
        
        try {
            // Usa CSSGenerator per generare CSS temporaneo
            const generatedCSS = CSSGenerator.generateFullCSS(previewConfig);
            
            res.json({
                success: true,
                data: generatedCSS,
                configuration: previewConfig,
                isTemporary: true,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(400).json({
                success: false,
                error: 'CSS generation failed',
                message: error.message
            });
        }
    });
}
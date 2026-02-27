import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { LayoutCalculator } from '../../cards/rendering/LayoutCalculator.js';
import { CardPaginator } from '../../cards/pagination/CardPaginator.js';
import { CardRenderer } from '../../cards/rendering/CardRenderer.js';
import { DeckValidator } from '../../cards/validation/DeckValidator.js';
import { PDFGenerator } from '../../export/pdf/PDFGenerator.js';
import { StyleCustomizer } from '../../styles/StyleCustomizer.js';
import { StyleCollector } from '../../styles/StyleCollector.js';
import { CSSGenerator } from '../../styles/CSSGenerator.js';

/**
 * CLIInterface - Gestisce l'interfaccia a riga di comando
 * 
 * Responsabilità:
 * - Parsing degli argomenti da command line
 * - Orchestrazione di tutte le classi del sistema
 * - Progress reporting e feedback utente
 * - Error handling end-to-end
 * - Sistema di help e documentazione integrata
 */
export class CLIInterface {

    /**
     * Configurazione di default per il CLI
     */
    static DEFAULT_CONFIG = {
        verbose: false,
        enableProgress: true,
        validateInput: true,
        autoOptimize: false,
        defaultTemplate: 'assets/card-template.html',
        defaultMainTemplate: 'assets/main-template.html'
    };

    /**
     * Costruttore dell'interfaccia CLI
     * @param {Object} config - Configurazione opzionale
     */
    constructor(config = {}) {
        this.config = { ...CLIInterface.DEFAULT_CONFIG, ...config };
        this.program = new Command();
        this.validator = new DeckValidator();
        this.renderer = null;
        this.pdfGenerator = null;
        this.styleCustomizer = new StyleCustomizer();
        
        this.setupCommands();
    }

    /**
     * Configura i comandi disponibili
     */
    setupCommands() {
        this.program
            .name('kpi-card-generator')
            .version('3.0.0')
            .description('Generatore di carte da gioco per workshop KPI con architettura modulare');

        this.setupGenerateCommand();
        this.setupBatchCommand();
        this.setupStylesCommand();
        this.setupValidateCommand();
        this.setupOptimizeCommand();
        this.setupInfoCommand();
    }

    /**
     * Configura il comando principale 'generate'
     */
    setupGenerateCommand() {
        this.program
            .command('generate')
            .description('Genera carte da un file JSON')
            .requiredOption('-i, --input <file>', 'File di input JSON con i dati delle carte')
            .option('-o, --output <file>', 'Genera il PDF delle carte nel file specificato')
            .option('-b, --browser <file>', 'Genera il file HTML delle carte per la visualizzazione nel browser')
            .option('-t, --template <file>', `Percorso del file template per le singole carte (default: ${this.config.defaultTemplate})`)
            .option('-f, --flip <mode>', 'Modalità stampa fronte-retro: short/portrait (lato corto) o long/landscape (lato lungo)', 'short')
            .option('--cards-per-page <number>', 'Numero di carte per pagina', '8')
            .option('--cards-per-row <number>', 'Numero di carte per riga', '4')
            .option('--validate', 'Valida il JSON prima della generazione', true)
            .option('--no-validate', 'Salta la validazione del JSON')
            .option('--no-char-limits', 'Bypassa i controlli di lunghezza caratteri (500 caratteri per testo)')
            .option('--progress', 'Mostra barra di progresso', this.config.enableProgress)
            .option('--no-progress', 'Nasconde la barra di progresso')
            .option('--apply-styles', 'Applica stili personalizzati se presenti')
            .option('-v, --verbose', 'Output verboso per debugging')
            .action(async (options) => {
                await this.handleGenerateCommand(options);
            });
    }

    /**
     * Configura il comando 'batch' per generazione multipla da directory
     */
    setupBatchCommand() {
        this.program
            .command('batch')
            .description('Genera carte da tutti i file JSON in una directory')
            .requiredOption('-d, --directory <dir>', 'Directory contenente i file JSON di input')
            .option('-o, --output <dir>', 'Directory di output per i PDF (default: stessa directory dei JSON)')
            .option('-b, --browser [dir]', 'Genera anche file HTML (opzionalmente in una directory specifica)')
            .option('-t, --template <file>', `Percorso del file template per le singole carte (default: ${this.config.defaultTemplate})`)
            .option('-f, --flip <mode>', 'Modalità stampa fronte-retro: short/portrait o long/landscape', 'short')
            .option('--cards-per-page <number>', 'Numero di carte per pagina', '8')
            .option('--cards-per-row <number>', 'Numero di carte per riga', '4')
            .option('--validate', 'Valida il JSON prima della generazione', true)
            .option('--no-validate', 'Salta la validazione del JSON')
            .option('--no-char-limits', 'Bypassa i controlli di lunghezza caratteri')
            .option('--apply-styles', 'Applica stili personalizzati se presenti')
            .option('--progress', 'Mostra barra di progresso', this.config.enableProgress)
            .option('--no-progress', 'Nasconde la barra di progresso')
            .option('-v, --verbose', 'Output verboso per debugging')
            .action(async (options) => {
                await this.handleBatchCommand(options);
            });
    }

    /**
     * Configura il comando 'validate'
     */
    setupValidateCommand() {
        this.program
            .command('validate')
            .description('Valida un file JSON delle carte senza generare output')
            .requiredOption('-i, --input <file>', 'File di input JSON da validare')
            .option('--strict', 'Validazione strict con controlli aggiuntivi')
            .option('--no-char-limits', 'Bypassa i controlli di lunghezza caratteri (500 caratteri per testo)')
            .option('--report <file>', 'Salva il report di validazione in un file')
            .action(async (options) => {
                await this.handleValidateCommand(options);
            });
    }

    /**
     * Configura il comando 'optimize'
     */
    setupOptimizeCommand() {
        this.program
            .command('optimize')
            .description('Suggerisce configurazioni ottimali per un dato numero di carte')
            .requiredOption('--cards <number>', 'Numero di carte da ottimizzare')
            .option('--formats <formats>', 'Formati possibili separati da virgola (es: 6,8,9,12)', '4,6,8,9,10,12')
            .action(async (options) => {
                await this.handleOptimizeCommand(options);
            });
    }

    /**
     * Configura il comando 'info'
     */
    setupInfoCommand() {
        this.program
            .command('info')
            .description('Mostra informazioni di sistema e diagnostica')
            .option('--system', 'Mostra informazioni di sistema')
            .option('--templates', 'Verifica la disponibilità dei template')
            .action(async (options) => {
                await this.handleInfoCommand(options);
            });
    }

    /**
     * Configura il comando 'styles' per personalizzazione CSS
     */
    setupStylesCommand() {
        this.program
            .command('styles')
            .description('Modalità esperta: personalizza gli stili CSS per le styleClass del deck')
            .requiredOption('-i, --input <file>', 'File di input JSON con il deck da personalizzare')
            .option('--expert', 'Abilita la modalità esperta per personalizzazione interattiva')
            .option('--show-css', 'Mostra il CSS generato senza salvare')
            .option('--reset', 'Rimuove tutte le personalizzazioni stili esistenti')
            .option('--report', 'Mostra report dettagliato sugli stili configurati')
            .option('-v, --verbose', 'Output verboso per debugging')
            .action(async (options) => {
                await this.handleStylesCommand(options);
            });
    }

    /**
     * Gestisce il comando generate
     * @param {Object} options - Opzioni del comando
     */
    async handleGenerateCommand(options) {
        try {
            this.log('🚀 Avvio generazione carte...', 'info');

            // Validazione argomenti
            const validationResult = this.validateGenerateOptions(options);
            if (!validationResult.isValid) {
                this.logErrors(validationResult.errors);
                process.exit(1);
            }

            // Setup renderer
            await this.initializeRenderer(options.template || this.config.defaultTemplate);

            // Genera il deck singolo
            const result = await this._generateSingleDeck({
                inputPath: options.input,
                options,
                pdfOutputPath: options.output || null,
                htmlOutputPath: options.browser || null
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            // Log output generati
            if (options.browser) {
                this.log(`✅ File HTML generato: ${path.resolve(options.browser)}`, 'success');
            }
            if (options.output) {
                this.log(`✅ File PDF generato: ${path.resolve(options.output)}`, 'success');
            }

            // Statistiche finali
            this.logGenerationStats(result.pages, result.totalCards);

        } catch (error) {
            this.log(`❌ Errore durante la generazione: ${error.message}`, 'error');
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Genera output (HTML e/o PDF) da un singolo file JSON.
     * Metodo interno condiviso tra generate e batch.
     * Prerequisito: this.renderer deve essere già inizializzato.
     *
     * @param {Object} params - Parametri di generazione
     * @param {string} params.inputPath - Percorso del file JSON di input
     * @param {Object} params.options - Opzioni del comando (flip, cardsPerPage, cardsPerRow, etc.)
     * @param {string|null} params.pdfOutputPath - Percorso output PDF (null = skip PDF)
     * @param {string|null} params.htmlOutputPath - Percorso output HTML (null = skip HTML)
     * @returns {Promise<{success: boolean, totalCards: number, pagesCount: number, pages: Array, error?: string}>}
     */
    async _generateSingleDeck({ inputPath, options, pdfOutputPath, htmlOutputPath }) {
        try {
            const cardsPerPage = parseInt(options.cardsPerPage);
            const cardsPerRow = parseInt(options.cardsPerRow);

            // Caricamento e validazione JSON
            const validationOptions = {
                bypassCharacterLimits: options.charLimits === false
            };
            const jsonData = await this.loadAndValidateJSON(inputPath, options.validate, validationOptions);

            if (options.verbose) {
                this.log(`  📊 Cards loaded: ${jsonData.cards.length}`, 'info');
            }

            // Generazione layout
            if (options.verbose) {
                this.log('  🔄 Calcolo layout delle carte...', 'info');
            }

            const pages = CardPaginator.createPaginatedLayouts(
                jsonData.cards,
                cardsPerPage,
                cardsPerRow,
                options.flip,
                (fronts, cpr, printMode) => LayoutCalculator.calculateMirrorLayout(fronts, cpr, printMode)
            );

            // Informazioni modalità stampa
            const modeInfo = LayoutCalculator.getModeInfo(options.flip);
            if (options.verbose) {
                this.log(`  🖨️  Modalità stampa: ${modeInfo.mode.toUpperCase()} (capovolgi sul lato ${modeInfo.flipSide})`, 'info');
            }

            // Generazione CSS personalizzato se richiesto
            let customCSS = '';
            if (options.applyStyles) {
                try {
                    if (options.verbose) {
                        this.log('  🎨 Caricamento stili personalizzati...', 'info');
                    }
                    customCSS = await this.styleCustomizer.generateCSSForDeck(jsonData, inputPath);
                    if (customCSS && customCSS.trim() !== '' && !customCSS.includes('Nessuna configurazione')) {
                        if (options.verbose) {
                            this.log('  ✅ Stili personalizzati applicati', 'info');
                        }
                    } else {
                        customCSS = '';
                    }
                } catch (error) {
                    if (options.verbose) {
                        this.log(`  ⚠️  Errore caricamento stili: ${error.message}`, 'warn');
                    }
                    customCSS = '';
                }
            }

            // Generazione HTML
            if (options.verbose) {
                this.log('  🎨 Generazione HTML...', 'info');
            }

            const htmlContent = await this.renderer.renderComplete(
                pages,
                jsonData,
                modeInfo.mode,
                modeInfo.description,
                customCSS
            );

            // Output HTML se richiesto
            if (htmlOutputPath) {
                await this.saveHTMLOutput(htmlContent, htmlOutputPath);
            }

            // Output PDF se richiesto
            if (pdfOutputPath) {
                await this.generatePDFOutput(htmlContent, pdfOutputPath, options.progress);
            }

            return {
                success: true,
                totalCards: jsonData.cards.length,
                pagesCount: pages.length,
                pages
            };

        } catch (error) {
            return {
                success: false,
                totalCards: 0,
                pagesCount: 0,
                pages: [],
                error: error.message
            };
        }
    }

    /**
     * Gestisce il comando batch
     * @param {Object} options - Opzioni del comando
     */
    async handleBatchCommand(options) {
        try {
            this.log('📦 Avvio generazione batch...', 'info');

            // Validazione argomenti
            const validationResult = this.validateBatchOptions(options);
            if (!validationResult.isValid) {
                this.logErrors(validationResult.errors);
                process.exit(1);
            }

            // Risolvi directory
            const inputDir = path.resolve(options.directory);
            const outputDir = options.output ? path.resolve(options.output) : null;

            // Scansiona file JSON
            const jsonFiles = await this._scanJsonFiles(inputDir);
            if (jsonFiles.length === 0) {
                this.log(`⚠️  Nessun file JSON trovato nella directory: ${inputDir}`, 'warn');
                process.exit(0);
            }

            this.log(`📂 Trovati ${jsonFiles.length} file JSON da processare`, 'info');

            // Crea directory output se necessario
            if (outputDir) {
                await fs.mkdir(outputDir, { recursive: true });
            }
            if (options.browser && typeof options.browser === 'string') {
                await fs.mkdir(path.resolve(options.browser), { recursive: true });
            }

            // Inizializza renderer UNA SOLA VOLTA
            await this.initializeRenderer(options.template || this.config.defaultTemplate);

            // Processa ogni file
            const results = { succeeded: [], failed: [] };

            for (let i = 0; i < jsonFiles.length; i++) {
                const jsonFile = jsonFiles[i];
                const baseName = path.basename(jsonFile, '.json');
                const jsonDir = path.dirname(jsonFile);

                this.log(`\n📄 [${i + 1}/${jsonFiles.length}] Processando: ${baseName}.json`, 'info');

                // Determina percorsi output
                const pdfDir = outputDir || jsonDir;
                const pdfOutputPath = path.join(pdfDir, `${baseName}.pdf`);

                let htmlOutputPath = null;
                if (options.browser) {
                    const htmlDir = typeof options.browser === 'string'
                        ? path.resolve(options.browser)
                        : jsonDir;
                    htmlOutputPath = path.join(htmlDir, `${baseName}.html`);
                }

                try {
                    const result = await this._generateSingleDeck({
                        inputPath: jsonFile,
                        options,
                        pdfOutputPath,
                        htmlOutputPath
                    });

                    if (result.success) {
                        results.succeeded.push({
                            file: baseName,
                            totalCards: result.totalCards,
                            pagesCount: result.pagesCount
                        });
                        this.log(`  ✅ ${baseName}: ${result.totalCards} carte, ${result.pagesCount} fogli`, 'success');
                    } else {
                        results.failed.push({ file: baseName, error: result.error });
                        this.log(`  ❌ ${baseName}: ${result.error}`, 'error');
                    }
                } catch (error) {
                    results.failed.push({ file: baseName, error: error.message });
                    this.log(`  ❌ ${baseName}: ${error.message}`, 'error');
                    if (options.verbose) {
                        console.error(error.stack);
                    }
                }
            }

            // Riepilogo
            this._logBatchSummary(results, jsonFiles.length);

            // Exit code: 0 se tutto ok, 1 se qualcosa fallisce
            if (results.failed.length > 0) {
                process.exit(1);
            }

        } catch (error) {
            this.log(`❌ Errore durante la generazione batch: ${error.message}`, 'error');
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Valida le opzioni del comando batch
     * @param {Object} options - Opzioni da validare
     * @returns {{isValid: boolean, errors: Array<string>}} Risultato validazione
     */
    validateBatchOptions(options) {
        const errors = [];

        // Valida modalità di stampa
        if (!LayoutCalculator.isValidMode(options.flip)) {
            errors.push(`Modalità di stampa non valida: '${options.flip}'. Usa short/portrait o long/landscape`);
        }

        // Valida parametri numerici
        const cardsPerPage = parseInt(options.cardsPerPage);
        const cardsPerRow = parseInt(options.cardsPerRow);

        if (isNaN(cardsPerPage) || cardsPerPage <= 0) {
            errors.push(`cards-per-page deve essere un numero positivo, ricevuto: ${options.cardsPerPage}`);
        }

        if (isNaN(cardsPerRow) || cardsPerRow <= 0) {
            errors.push(`cards-per-row deve essere un numero positivo, ricevuto: ${options.cardsPerRow}`);
        }

        if (!isNaN(cardsPerPage) && !isNaN(cardsPerRow)) {
            if (!CardPaginator.validatePaginationParams(cardsPerPage, cardsPerRow)) {
                errors.push(`Configurazione paginazione non valida: ${cardsPerPage} carte per pagina, ${cardsPerRow} per riga`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Scansiona una directory per file JSON
     * @param {string} directory - Percorso della directory
     * @returns {Promise<Array<string>>} Lista di percorsi assoluti dei file JSON ordinati alfabeticamente
     */
    async _scanJsonFiles(directory) {
        try {
            await fs.access(directory);
        } catch {
            throw new Error(`Directory non trovata: ${directory}`);
        }

        const entries = await fs.readdir(directory, { withFileTypes: true });
        const jsonFiles = entries
            .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
            .map(entry => path.join(directory, entry.name))
            .sort();

        return jsonFiles;
    }

    /**
     * Logga il riepilogo della generazione batch
     * @param {Object} results - { succeeded: [...], failed: [...] }
     * @param {number} totalFiles - Numero totale di file processati
     */
    _logBatchSummary(results, totalFiles) {
        console.log('\n' + '═'.repeat(50));
        this.log('📊 RIEPILOGO GENERAZIONE BATCH:', 'info');
        console.log(`   • Totale file: ${totalFiles}`);
        console.log(`   • Completati: ${results.succeeded.length}`);
        console.log(`   • Falliti: ${results.failed.length}`);

        if (results.succeeded.length > 0) {
            const totalCards = results.succeeded.reduce((sum, r) => sum + r.totalCards, 0);
            console.log(`   • Carte totali generate: ${totalCards}`);
        }

        if (results.failed.length > 0) {
            console.log('\n   ❌ FILE CON ERRORI:');
            results.failed.forEach(f => {
                console.log(`      • ${f.file}: ${f.error}`);
            });
        }
        console.log('═'.repeat(50));
    }

    /**
     * Gestisce il comando validate
     * @param {Object} options - Opzioni del comando
     */
    async handleValidateCommand(options) {
        try {
            this.log('🔍 Validazione file JSON...', 'info');
            
            const jsonContent = await fs.readFile(path.resolve(options.input), 'utf-8');
            
            // Configura validator per strict mode e bypass caratteri
            // Commander.js mappa --no-char-limits come charLimits: false
            const bypassLimits = options.charLimits === false;
            
            if (bypassLimits) {
                this.log('🔓 Bypass dei limiti caratteri abilitato', 'info');
            }
            const validator = new DeckValidator({
                strictIconValidation: options.strict || false,
                bypassCharacterLimits: bypassLimits
            });

            const { result, report } = await validator.validateWithReport(jsonContent);
            
            console.log(report);
            
            // Salva report se richiesto
            if (options.report) {
                await fs.writeFile(path.resolve(options.report), report, 'utf-8');
                this.log(`📄 Report salvato in: ${path.resolve(options.report)}`, 'info');
            }

            // Exit code basato sulla validazione
            process.exit(result.isValid ? 0 : 1);
            
        } catch (error) {
            this.log(`❌ Errore durante la validazione: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    /**
     * Gestisce il comando optimize
     * @param {Object} options - Opzioni del comando
     */
    async handleOptimizeCommand(options) {
        try {
            const cardCount = parseInt(options.cards);
            const possibleFormats = options.formats.split(',').map(f => parseInt(f.trim()));
            
            this.log(`🎯 Ottimizzazione per ${cardCount} carte...`, 'info');
            
            const optimal = CardPaginator.optimizePagination(cardCount, possibleFormats);
            
            console.log('\n📊 CONFIGURAZIONE OTTIMALE:');
            console.log(`   • Carte per pagina: ${optimal.cardsPerPage}`);
            console.log(`   • Carte per riga: ${optimal.cardsPerRow}`);
            console.log(`   • Efficienza: ${optimal.efficiency}%`);
            console.log(`   • Fogli totali: ${optimal.totalPages}`);
            console.log(`   • Placeholder: ${optimal.totalPlaceholders}`);
            
            // Statistiche dettagliate
            const stats = CardPaginator.getPaginationStats(
                new Array(cardCount).fill({}),
                optimal.cardsPerPage,
                optimal.cardsPerRow
            );
            
            console.log('\n📈 DETTAGLI:');
            console.log(`   • Righe per pagina: ${stats.rowsPerPage}`);
            console.log(`   • Carte nell'ultimo foglio: ${stats.lastPageCards}`);
            console.log(`   • Spreco percentuale: ${stats.wastePercentage}%`);
            console.log(`   • Ultimo foglio completo: ${stats.isLastPageComplete ? 'Sì' : 'No'}`);
            
        } catch (error) {
            this.log(`❌ Errore nell'ottimizzazione: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    /**
     * Gestisce il comando info
     * @param {Object} options - Opzioni del comando
     */
    async handleInfoCommand(options) {
        try {
            console.log('ℹ️  KPI Card Generator - Informazioni Sistema\n');
            
            // Informazioni base
            console.log('📦 VERSIONE:');
            console.log('   • CLI: 3.0.0');
            console.log('   • Architettura: Modulare');
            console.log('   • Node.js:', process.version);
            
            if (options.system) {
                // Informazioni sistema avanzate
                const pdfGen = new PDFGenerator();
                const systemInfo = await pdfGen.getSystemInfo();
                await pdfGen.cleanup();
                
                console.log('\n🖥️  SISTEMA:');
                console.log(`   • Browser: ${systemInfo.browserVersion || 'Non disponibile'}`);
                console.log(`   • Memoria: ${Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(systemInfo.memoryUsage.heapTotal / 1024 / 1024)}MB`);
                console.log(`   • Uptime: ${Math.round(systemInfo.uptime)}s`);
            }
            
            if (options.templates) {
                // Verifica template
                console.log('\n📄 TEMPLATE:');
                
                const templates = [
                    this.config.defaultTemplate,
                    this.config.defaultMainTemplate
                ];
                
                for (const templatePath of templates) {
                    try {
                        await fs.access(path.resolve(templatePath));
                        console.log(`   ✅ ${templatePath} - Disponibile`);
                    } catch (error) {
                        console.log(`   ❌ ${templatePath} - Non trovato`);
                    }
                }
            }
            
            // Modalità supportate
            console.log('\n🔄 MODALITÀ SUPPORTATE:');
            console.log('   • short, shortside, short-side, portrait');
            console.log('   • long, longside, long-side, landscape');
            
        } catch (error) {
            this.log(`❌ Errore nell'ottenere informazioni: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    /**
     * Gestisce il comando styles per personalizzazione CSS
     * @param {Object} options - Opzioni del comando
     */
    async handleStylesCommand(options) {
        try {
            this.log('🎨 Avvio personalizzazione stili CSS...', 'info');
            
            // Caricamento e validazione deck
            const jsonData = await this.loadAndValidateJSON(options.input, true);
            
            // Controllo styleClass disponibili
            const hasStyleClasses = StyleCollector.hasConfigurableStyles(jsonData);
            if (!hasStyleClasses) {
                this.log('❌ Nessuna styleClass trovata nel deck. Aggiungi styleClass alle carte per abilitare la personalizzazione.', 'error');
                process.exit(1);
            }

            // Report mode
            if (options.report) {
                const report = await this.styleCustomizer.generateStylesReport(jsonData, options.input);
                console.log(report);
                return;
            }

            // Reset mode
            if (options.reset) {
                const removed = await this.styleCustomizer.removeStylesConfig(options.input);
                if (removed) {
                    this.log('✅ Configurazione stili rimossa con successo', 'success');
                } else {
                    this.log('ℹ️  Nessuna configurazione stili da rimuovere', 'info');
                }
                return;
            }

            // Show CSS mode
            if (options.showCss) {
                const css = await this.styleCustomizer.generateCSSForDeck(jsonData, options.input);
                console.log('\n🎨 CSS Generato:\n');
                console.log(css);
                return;
            }

            // Expert mode - Interactive configuration
            if (options.expert) {
                await this.runExpertStyleConfiguration(jsonData, options.input, options.verbose);
                return;
            }

            // Default: Show report and prompt for expert mode
            const styleReport = StyleCollector.generateStyleReport(jsonData);
            console.log(styleReport);
            
            console.log('\n💡 Per personalizzare gli stili, usa:');
            console.log(`   node kpi-card-generator.js styles -i ${options.input} --expert`);
            console.log('\n📋 Altri comandi utili:');
            console.log(`   --report  : Report dettagliato configurazione`);
            console.log(`   --show-css: Mostra CSS generato`);
            console.log(`   --reset   : Rimuove personalizzazioni`);
            
        } catch (error) {
            this.log(`❌ Errore nella personalizzazione stili: ${error.message}`, 'error');
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Valida le opzioni del comando generate
     * @param {Object} options - Opzioni da validare
     * @returns {{isValid: boolean, errors: Array<string>}} Risultato validazione
     */
    validateGenerateOptions(options) {
        const errors = [];

        // Deve avere almeno un output
        if (!options.output && !options.browser) {
            errors.push('Devi specificare almeno un formato di output (-o per PDF o -b per HTML)');
        }

        // Valida modalità di stampa
        if (!LayoutCalculator.isValidMode(options.flip)) {
            errors.push(`Modalità di stampa non valida: '${options.flip}'. Usa short/portrait o long/landscape`);
        }

        // Valida parametri numerici
        const cardsPerPage = parseInt(options.cardsPerPage);
        const cardsPerRow = parseInt(options.cardsPerRow);

        if (isNaN(cardsPerPage) || cardsPerPage <= 0) {
            errors.push(`cards-per-page deve essere un numero positivo, ricevuto: ${options.cardsPerPage}`);
        }

        if (isNaN(cardsPerRow) || cardsPerRow <= 0) {
            errors.push(`cards-per-row deve essere un numero positivo, ricevuto: ${options.cardsPerRow}`);
        }

        if (!isNaN(cardsPerPage) && !isNaN(cardsPerRow)) {
            if (!CardPaginator.validatePaginationParams(cardsPerPage, cardsPerRow)) {
                errors.push(`Configurazione paginazione non valida: ${cardsPerPage} carte per pagina, ${cardsPerRow} per riga`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Carica e valida il file JSON
     * @param {string} inputPath - Percorso del file JSON
     * @param {boolean} shouldValidate - Se eseguire la validazione
     * @param {Object} validationOptions - Opzioni per la validazione
     * @returns {Promise<Object>} Dati JSON validati
     */
    async loadAndValidateJSON(inputPath, shouldValidate = true, validationOptions = {}) {
        try {
            const jsonPath = path.resolve(inputPath);
            const jsonContent = await fs.readFile(jsonPath, 'utf-8');
            
            if (shouldValidate) {
                // Crea un validator con le opzioni specificate
                const validator = new DeckValidator({
                    ...validationOptions
                });
                const { result } = await validator.validateWithReport(jsonContent);
                
                if (!result.isValid) {
                    this.log('❌ Validazione JSON fallita:', 'error');
                    result.errors.forEach(error => {
                        this.log(`   • ${error}`, 'error');
                    });
                    process.exit(1);
                }
                
                if (result.warnings.length > 0) {
                    this.log('⚠️  Avvertimenti:', 'warn');
                    result.warnings.forEach(warning => {
                        this.log(`   • ${warning}`, 'warn');
                    });
                }
                
                return result.data;
            } else {
                return JSON.parse(jsonContent);
            }
            
        } catch (error) {
            throw new Error(`Impossibile caricare il file JSON ${inputPath}: ${error.message}`);
        }
    }

    /**
     * Inizializza il renderer con i template
     * @param {string} templatePath - Percorso del template delle carte
     */
    async initializeRenderer(templatePath) {
        this.renderer = new CardRenderer({
            enableCache: true,
            debugMode: false
        });

        await this.renderer.loadCardTemplates(templatePath);
        await this.renderer.loadMainTemplate(this.config.defaultMainTemplate);
    }

    /**
     * Salva l'output HTML
     * @param {string} htmlContent - Contenuto HTML
     * @param {string} outputPath - Percorso di output
     */
    async saveHTMLOutput(htmlContent, outputPath) {
        const htmlPath = path.resolve(outputPath);
        await fs.writeFile(htmlPath, htmlContent, 'utf-8');
    }

    /**
     * Genera l'output PDF
     * @param {string} htmlContent - Contenuto HTML
     * @param {string} outputPath - Percorso di output
     * @param {boolean} showProgress - Se mostrare il progresso
     */
    async generatePDFOutput(htmlContent, outputPath, showProgress = true) {
        this.pdfGenerator = new PDFGenerator({
            enableProgress: showProgress
        });

        let progressCallback = null;
        if (showProgress) {
            progressCallback = (progress) => {
                if (progress.stage === 'pdf_generation') {
                    this.log('📄 Generazione PDF in corso...', 'info');
                }
            };
        }

        const pdfBuffer = await this.pdfGenerator.generateFromHTML(
            htmlContent, 
            {}, 
            progressCallback
        );
        
        await this.pdfGenerator.savePDF(pdfBuffer, path.resolve(outputPath));
        await this.pdfGenerator.cleanup();
    }

    /**
     * Esegue la configurazione interattiva degli stili in modalità esperta
     * @param {Object} deck - Deck JSON da configurare
     * @param {string} deckPath - Percorso del file deck
     * @param {boolean} verbose - Output verboso
     */
    async runExpertStyleConfiguration(deck, deckPath, verbose = false) {
        // Import readline solo quando necessario
        const readline = await import('readline');
        
        console.log('\n🎨 MODALITÀ ESPERTA - Personalizzazione Stili CSS');
        console.log('═'.repeat(50));
        
        const uniqueStyles = StyleCollector.extractUniqueStyleClasses(deck);
        console.log(`\n✅ Trovate ${uniqueStyles.length} styleClass uniche: ${uniqueStyles.join(', ')}`);
        
        // Carica configurazione esistente se presente
        let stylesConfig = await this.styleCustomizer.loadExistingStylesConfig(deckPath);
        const isFirstTime = !stylesConfig;
        
        if (stylesConfig) {
            console.log(`\n📄 Configurazione esistente trovata (${stylesConfig.styleClass.length} stili configurati)`);
            console.log('⚠️  Backup automatico verrà creato prima delle modifiche');
        } else {
            console.log('\n🆕 Prima configurazione - creazione configurazione default');
            stylesConfig = await this.styleCustomizer.initializeStylesConfig(deck, deckPath);
        }
        
        // Aggiorna configurazione per nuove styleClass
        stylesConfig = await this.styleCustomizer.updateStylesConfigForDeck(deck, deckPath);
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = (question) => {
            return new Promise(resolve => {
                rl.question(question, resolve);
            });
        };

        try {
            console.log('\n🔧 Configurazione interattiva:');
            console.log('   • Premi ENTER per mantenere valore corrente');
            console.log('   • Usa formato hex per colori (es: #ff0000)');
            console.log('   • Dimensioni testo: xs, s, m, l');
            console.log('   • Hero image: true/false\n');

            // Configura ogni styleClass
            for (let i = 0; i < stylesConfig.styleClass.length; i++) {
                const config = stylesConfig.styleClass[i];
                console.log(`\n${'─'.repeat(30)}`);
                console.log(`🎯 Configurazione: ${config.class} (${i + 1}/${stylesConfig.styleClass.length})`);
                
                // Card Title Color
                const currentTitleColor = config.cardTitleColor || 'non impostato';
                const titleColor = await askQuestion(`   Colore testo titolo [${currentTitleColor}]: `);
                if (titleColor.trim() && CSSGenerator.validateHexColor(titleColor.trim())) {
                    config.cardTitleColor = titleColor.trim();
                } else if (titleColor.trim() && !CSSGenerator.validateHexColor(titleColor.trim())) {
                    console.log('   ⚠️  Colore non valido, mantengo il valore corrente');
                }
                
                // Card Title Background Color
                const currentBgColor = config.cardTitleBgColor || 'non impostato';
                const bgColor = await askQuestion(`   Colore background titolo [${currentBgColor}]: `);
                if (bgColor.trim() && CSSGenerator.validateHexColor(bgColor.trim())) {
                    config.cardTitleBgColor = bgColor.trim();
                } else if (bgColor.trim() && !CSSGenerator.validateHexColor(bgColor.trim())) {
                    console.log('   ⚠️  Colore non valido, mantengo il valore corrente');
                }
                
                // Show Hero Image
                const currentHeroImage = config.showHeroImage ? 'true' : 'false';
                const heroImage = await askQuestion(`   Mostra hero image [${currentHeroImage}]: `);
                if (heroImage.trim().toLowerCase() === 'true' || heroImage.trim().toLowerCase() === 'false') {
                    config.showHeroImage = heroImage.trim().toLowerCase() === 'true';
                }
                
                // Description Text Size
                const currentTextSize = config.descriptionTextSize;
                const textSize = await askQuestion(`   Dimensione testo descrizione (xs/s/m/l) [${currentTextSize}]: `);
                if (textSize.trim() && ['xs', 's', 'm', 'l'].includes(textSize.trim())) {
                    config.descriptionTextSize = textSize.trim();
                } else if (textSize.trim()) {
                    console.log('   ⚠️  Dimensione non valida, mantengo il valore corrente');
                }
                
                if (verbose) {
                    console.log(`   ✅ Configurato: ${JSON.stringify(config, null, 2)}`);
                }
            }

            // Conferma salvataggio
            console.log(`\n${'═'.repeat(50)}`);
            console.log('📋 RIEPILOGO CONFIGURAZIONE:');
            stylesConfig.styleClass.forEach((config, index) => {
                console.log(`\n   ${index + 1}. ${config.class}:`);
                console.log(`      • Colore titolo: ${config.cardTitleColor || 'default'}`);
                console.log(`      • Background titolo: ${config.cardTitleBgColor || 'default'}`);
                console.log(`      • Hero image: ${config.showHeroImage ? 'visibile' : 'nascosta'}`);
                console.log(`      • Testo descrizione: ${config.descriptionTextSize}`);
            });

            const confirm = await askQuestion('\n💾 Salvare la configurazione? (y/N): ');
            if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                await this.styleCustomizer.saveStylesConfig(deckPath, stylesConfig);
                
                const stylesFilePath = this.styleCustomizer.getStylesFilePath(deckPath);
                this.log(`✅ Configurazione salvata: ${stylesFilePath}`, 'success');
                
                // Mostra CSS generato se verbose
                if (verbose) {
                    console.log('\n🎨 CSS Generato:');
                    const css = CSSGenerator.generateCSSFromJSON(stylesConfig);
                    console.log(css);
                }
                
                console.log('\n🚀 Per applicare gli stili, usa:');
                console.log(`   node kpi-card-generator.js generate -i ${deckPath} --apply-styles -o output.pdf`);
            } else {
                console.log('❌ Configurazione non salvata');
            }

        } finally {
            rl.close();
        }
    }

    /**
     * Logga le statistiche di generazione
     * @param {Array} pages - Pagine generate
     * @param {number} totalCards - Numero totale di carte
     */
    logGenerationStats(pages, totalCards) {
        this.log('\n📊 STATISTICHE GENERAZIONE:', 'info');
        console.log(`   • Fogli generati: ${pages.length} (${pages.length * 2} pagine totali)`);
        console.log(`   • Carte totali: ${totalCards}`);
        
        const placeholderCount = pages.reduce((total, page) => {
            return total + page.fronts.filter(card => card.isPlaceholder).length;
        }, 0);
        
        if (placeholderCount > 0) {
            console.log(`   • Placeholder aggiunti: ${placeholderCount}`);
        }
    }

    /**
     * Metodo di logging con supporto per colori
     * @param {string} message - Messaggio da loggare
     * @param {string} level - Livello di log (info, warn, error, success)
     */
    log(message, level = 'info') {
        if (!this.config.verbose && level === 'debug') return;

        switch (level) {
            case 'error':
                console.error(message);
                break;
            case 'warn':
                console.warn(message);
                break;
            case 'success':
                console.log(message);
                break;
            default:
                console.log(message);
        }
    }

    /**
     * Logga una lista di errori
     * @param {Array<string>} errors - Lista di errori
     */
    logErrors(errors) {
        this.log('❌ Errori trovati:', 'error');
        errors.forEach(error => {
            this.log(`   • ${error}`, 'error');
        });
    }

    /**
     * Punto di ingresso principale
     * @param {Array<string>} argv - Argomenti da command line
     */
    async run(argv = process.argv) {
        try {
            // Cleanup automatico on exit
            process.on('SIGINT', async () => {
                await this.cleanup();
                process.exit(0);
            });

            process.on('SIGTERM', async () => {
                await this.cleanup();
                process.exit(0);
            });

            await this.program.parseAsync(argv);
        } catch (error) {
            this.log(`❌ Errore critico: ${error.message}`, 'error');
            await this.cleanup();
            process.exit(1);
        }
    }

    /**
     * Cleanup delle risorse
     */
    async cleanup() {
        if (this.pdfGenerator) {
            await this.pdfGenerator.cleanup();
        }
        
        if (this.renderer) {
            CardRenderer.clearCache();
        }
    }
}

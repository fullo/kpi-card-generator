import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { LayoutCalculator } from './LayoutCalculator.js';
import { CardPaginator } from './CardPaginator.js';
import { CardRenderer } from './CardRenderer.js';
import { DeckValidator } from './DeckValidator.js';
import { PDFGenerator } from './PDFGenerator.js';

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
            .option('--progress', 'Mostra barra di progresso', this.config.enableProgress)
            .option('--no-progress', 'Nasconde la barra di progresso')
            .option('-v, --verbose', 'Output verboso per debugging')
            .action(async (options) => {
                await this.handleGenerateCommand(options);
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

            // Parsing parametri numerici
            const cardsPerPage = parseInt(options.cardsPerPage);
            const cardsPerRow = parseInt(options.cardsPerRow);

            // Caricamento e validazione JSON
            const jsonData = await this.loadAndValidateJSON(options.input, options.validate);
            
            if (options.verbose) {
                this.log(`📊 Carte caricate: ${jsonData.carte.length}`, 'info');
            }

            // Setup renderer
            await this.initializeRenderer(options.template || this.config.defaultTemplate);

            // Generazione layout
            if (options.verbose) {
                this.log('🔄 Calcolo layout delle carte...', 'info');
            }

            const pages = CardPaginator.createPaginatedLayouts(
                jsonData.carte,
                cardsPerPage,
                cardsPerRow,
                options.flip,
                (fronts, cardsPerRow, printMode) => LayoutCalculator.calculateMirrorLayout(fronts, cardsPerRow, printMode)
            );

            // Informazioni modalità stampa
            const modeInfo = LayoutCalculator.getModeInfo(options.flip);
            this.log(`🖨️  Modalità stampa: ${modeInfo.mode.toUpperCase()} (capovolgi sul lato ${modeInfo.flipSide})`, 'info');

            // Generazione HTML
            if (options.verbose) {
                this.log('🎨 Generazione HTML...', 'info');
            }

            const htmlContent = await this.renderer.renderComplete(
                pages, 
                jsonData, 
                modeInfo.mode, 
                modeInfo.description
            );

            // Output HTML se richiesto
            if (options.browser) {
                await this.saveHTMLOutput(htmlContent, options.browser);
                this.log(`✅ File HTML generato: ${path.resolve(options.browser)}`, 'success');
            }

            // Output PDF se richiesto
            if (options.output) {
                await this.generatePDFOutput(htmlContent, options.output, options.progress);
                this.log(`✅ File PDF generato: ${path.resolve(options.output)}`, 'success');
            }

            // Statistiche finali
            this.logGenerationStats(pages, jsonData.carte.length);
            
        } catch (error) {
            this.log(`❌ Errore durante la generazione: ${error.message}`, 'error');
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Gestisce il comando validate
     * @param {Object} options - Opzioni del comando
     */
    async handleValidateCommand(options) {
        try {
            this.log('🔍 Validazione file JSON...', 'info');
            
            const jsonContent = await fs.readFile(path.resolve(options.input), 'utf-8');
            
            // Configura validator per strict mode
            const validator = new DeckValidator({
                strictIconValidation: options.strict || false
            });

            const { result, report } = validator.validateWithReport(jsonContent);
            
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
     * @returns {Promise<Object>} Dati JSON validati
     */
    async loadAndValidateJSON(inputPath, shouldValidate = true) {
        try {
            const jsonPath = path.resolve(inputPath);
            const jsonContent = await fs.readFile(jsonPath, 'utf-8');
            
            if (shouldValidate) {
                const { result } = this.validator.validateWithReport(jsonContent);
                
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
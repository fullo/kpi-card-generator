import puppeteer from 'puppeteer';

/**
 * PDFGenerator - Gestisce la generazione PDF con Puppeteer
 * 
 * Responsabilità:
 * - Wrapper per Puppeteer con configurazione ottimizzata
 * - Gestione opzioni PDF (margini, formato, qualità)
 * - Error handling e retry logic
 * - Progress tracking per operazioni lunghe
 * - Cleanup automatico delle risorse
 * - Batch processing per multiple PDF
 */
export class PDFGenerator {

    /**
     * Configurazione di default per Puppeteer
     */
    static DEFAULT_BROWSER_CONFIG = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
        ],
        timeout: 30000
    };

    /**
     * Configurazione di default per PDF
     */
    static DEFAULT_PDF_CONFIG = {
        format: 'A4',
        printBackground: true,
        landscape: true,
        margin: { 
            top: '0', 
            right: '0', 
            bottom: '0', 
            left: '0' 
        },
        displayHeaderFooter: false,
        preferCSSPageSize: false
    };

    /**
     * Configurazione di default per il generator
     */
    static DEFAULT_CONFIG = {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 60000,
        memoryLimit: 512 * 1024 * 1024, // 512MB
        enableProgress: false,
        autoCleanup: true
    };

    /**
     * Costruttore del PDF generator
     * @param {Object} config - Configurazione opzionale
     */
    constructor(config = {}) {
        this.config = { ...PDFGenerator.DEFAULT_CONFIG, ...config };
        this.browserConfig = { 
            ...PDFGenerator.DEFAULT_BROWSER_CONFIG, 
            ...(config.browserConfig || {}) 
        };
        this.pdfConfig = { 
            ...PDFGenerator.DEFAULT_PDF_CONFIG, 
            ...(config.pdfConfig || {}) 
        };
        
        this.browser = null;
        this.activePage = null;
        this.listenersAdded = false;
        this.stats = {
            generatedPDFs: 0,
            totalTime: 0,
            errors: 0,
            retries: 0
        };
    }

    /**
     * Inizializza il browser se non già attivo
     * @returns {Promise<Browser>} Istanza del browser
     */
    async initBrowser() {
        if (!this.browser) {
            try {
                this.browser = await puppeteer.launch(this.browserConfig);
                
                // Configura listener per cleanup automatico
                if (this.config.autoCleanup && !this.listenersAdded) {
                    process.setMaxListeners(15); // Increase limit for testing
                    process.on('exit', () => this.cleanup());
                    process.on('SIGINT', () => this.cleanup());
                    process.on('SIGTERM', () => this.cleanup());
                    this.listenersAdded = true;
                }
            } catch (error) {
                throw new Error(`Impossibile inizializzare il browser: ${error.message}`);
            }
        }
        return this.browser;
    }

    /**
     * Crea una nuova pagina del browser
     * @returns {Promise<Page>} Nuova pagina
     */
    async createPage() {
        const browser = await this.initBrowser();
        const page = await browser.newPage();
        
        // Configura timeout e limiti di memoria
        page.setDefaultTimeout(this.config.timeout);
        page.setDefaultNavigationTimeout(this.config.timeout);
        
        // Event listeners per debug e monitoring
        if (this.config.enableProgress) {
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.warn(`Browser console error: ${msg.text()}`);
                }
            });
            
            page.on('pageerror', error => {
                console.warn(`Page error: ${error.message}`);
            });
        }

        return page;
    }

    /**
     * Imposta il contenuto HTML nella pagina
     * @param {Page} page - Pagina del browser
     * @param {string} htmlContent - Contenuto HTML
     * @param {Object} options - Opzioni per setContent
     * @returns {Promise<void>}
     */
    async setPageContent(page, htmlContent, options = {}) {
        const defaultOptions = {
            waitUntil: 'networkidle0',
            timeout: this.config.timeout
        };
        
        const setContentOptions = { ...defaultOptions, ...options };
        
        try {
            await page.setContent(htmlContent, setContentOptions);
            
            // Attendi che tutti i font siano caricati
            await page.evaluate(() => document.fonts.ready);
            
            // Attendi un momento extra per il rendering completo
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            throw new Error(`Errore nel caricamento del contenuto HTML: ${error.message}`);
        }
    }

    /**
     * Genera PDF da contenuto HTML
     * @param {string} htmlContent - Contenuto HTML
     * @param {Object} customPdfOptions - Opzioni PDF personalizzate
     * @param {Function} progressCallback - Callback per progress updates
     * @returns {Promise<Buffer>} Buffer del PDF generato
     */
    async generateFromHTML(htmlContent, customPdfOptions = {}, progressCallback = null) {
        const startTime = Date.now();
        let attempt = 0;
        
        if (progressCallback) {
            progressCallback({ stage: 'initializing', progress: 0 });
        }

        while (attempt < this.config.maxRetries) {
            let page = null;
            
            try {
                attempt++;
                
                if (progressCallback) {
                    progressCallback({ 
                        stage: 'browser_init', 
                        progress: 10,
                        attempt 
                    });
                }

                // Crea pagina
                page = await this.createPage();
                this.activePage = page;
                
                if (progressCallback) {
                    progressCallback({ 
                        stage: 'content_loading', 
                        progress: 30 
                    });
                }

                // Carica contenuto
                await this.setPageContent(page, htmlContent);
                
                if (progressCallback) {
                    progressCallback({ 
                        stage: 'pdf_generation', 
                        progress: 70 
                    });
                }

                // Genera PDF
                const pdfOptions = { ...this.pdfConfig, ...customPdfOptions };
                const pdfResult = await page.pdf(pdfOptions);
                const pdfBuffer = Buffer.from(pdfResult);
                
                // Cleanup pagina
                await page.close();
                this.activePage = null;
                
                // Statistiche
                const elapsedTime = Date.now() - startTime;
                this.stats.generatedPDFs++;
                this.stats.totalTime += elapsedTime;
                this.stats.retries += (attempt - 1);
                
                if (progressCallback) {
                    progressCallback({ 
                        stage: 'completed', 
                        progress: 100,
                        elapsedTime 
                    });
                }

                return pdfBuffer;
                
            } catch (error) {
                this.stats.errors++;
                
                // Cleanup in caso di errore
                if (page) {
                    try {
                        await page.close();
                    } catch (closeError) {
                        console.warn(`Errore nella chiusura della pagina: ${closeError.message}`);
                    }
                }
                this.activePage = null;

                // Se è l'ultimo tentativo, rilancia l'errore
                if (attempt >= this.config.maxRetries) {
                    throw new Error(`Generazione PDF fallita dopo ${attempt} tentativi: ${error.message}`);
                }

                // Attendi prima di ritentare
                if (this.config.retryDelay > 0) {
                    await this.delay(this.config.retryDelay * attempt);
                }
                
                if (progressCallback) {
                    progressCallback({ 
                        stage: 'retrying', 
                        progress: 0,
                        attempt,
                        error: error.message 
                    });
                }
            }
        }
    }

    /**
     * Genera PDF da un file HTML
     * @param {string} htmlFilePath - Percorso del file HTML
     * @param {Object} customPdfOptions - Opzioni PDF personalizzate
     * @param {Function} progressCallback - Callback per progress updates
     * @returns {Promise<Buffer>} Buffer del PDF generato
     */
    async generateFromFile(htmlFilePath, customPdfOptions = {}, progressCallback = null) {
        const { promises: fs } = await import('fs');
        const path = await import('path');
        
        try {
            const absolutePath = path.resolve(htmlFilePath);
            const htmlContent = await fs.readFile(absolutePath, 'utf-8');
            
            return await this.generateFromHTML(htmlContent, customPdfOptions, progressCallback);
        } catch (error) {
            throw new Error(`Impossibile leggere il file HTML ${htmlFilePath}: ${error.message}`);
        }
    }

    /**
     * Genera PDF da URL
     * @param {string} url - URL da convertire
     * @param {Object} customPdfOptions - Opzioni PDF personalizzate
     * @param {Function} progressCallback - Callback per progress updates
     * @returns {Promise<Buffer>} Buffer del PDF generato
     */
    async generateFromURL(url, customPdfOptions = {}, progressCallback = null) {
        const startTime = Date.now();
        let page = null;
        
        try {
            if (progressCallback) {
                progressCallback({ stage: 'initializing', progress: 0 });
            }

            page = await this.createPage();
            this.activePage = page;
            
            if (progressCallback) {
                progressCallback({ stage: 'page_loading', progress: 20 });
            }

            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: this.config.timeout 
            });
            
            if (progressCallback) {
                progressCallback({ stage: 'pdf_generation', progress: 70 });
            }

            const pdfOptions = { ...this.pdfConfig, ...customPdfOptions };
            const pdfResult = await page.pdf(pdfOptions);
            const pdfBuffer = Buffer.from(pdfResult);
            
            await page.close();
            this.activePage = null;
            
            const elapsedTime = Date.now() - startTime;
            this.stats.generatedPDFs++;
            this.stats.totalTime += elapsedTime;
            
            if (progressCallback) {
                progressCallback({ stage: 'completed', progress: 100, elapsedTime });
            }

            return pdfBuffer;
            
        } catch (error) {
            if (page) {
                try {
                    await page.close();
                } catch (closeError) {
                    console.warn(`Errore nella chiusura della pagina: ${closeError.message}`);
                }
            }
            this.activePage = null;
            this.stats.errors++;
            
            throw new Error(`Generazione PDF da URL fallita: ${error.message}`);
        }
    }

    /**
     * Genera multipli PDF in batch
     * @param {Array<{htmlContent: string, filename: string, options?: Object}>} jobs - Array di job
     * @param {Function} progressCallback - Callback per progress updates
     * @returns {Promise<Array<{filename: string, buffer?: Buffer, error?: string}>>} Risultati
     */
    async generateBatch(jobs, progressCallback = null) {
        const results = [];
        const totalJobs = jobs.length;
        
        for (let i = 0; i < totalJobs; i++) {
            const job = jobs[i];
            
            try {
                if (progressCallback) {
                    progressCallback({
                        stage: 'batch_processing',
                        progress: (i / totalJobs) * 100,
                        currentJob: i + 1,
                        totalJobs,
                        filename: job.filename
                    });
                }

                const buffer = await this.generateFromHTML(
                    job.htmlContent, 
                    job.options || {}
                );
                
                results.push({
                    filename: job.filename,
                    buffer
                });
                
            } catch (error) {
                results.push({
                    filename: job.filename,
                    error: error.message
                });
            }
        }
        
        if (progressCallback) {
            progressCallback({
                stage: 'batch_completed',
                progress: 100,
                totalJobs,
                successful: results.filter(r => !r.error).length,
                failed: results.filter(r => r.error).length
            });
        }

        return results;
    }

    /**
     * Salva PDF su file
     * @param {Buffer} pdfBuffer - Buffer del PDF
     * @param {string} outputPath - Percorso di output
     * @returns {Promise<void>}
     */
    async savePDF(pdfBuffer, outputPath) {
        const { promises: fs } = await import('fs');
        const path = await import('path');
        
        try {
            const absolutePath = path.resolve(outputPath);
            await fs.writeFile(absolutePath, pdfBuffer);
        } catch (error) {
            throw new Error(`Impossibile salvare il PDF in ${outputPath}: ${error.message}`);
        }
    }

    /**
     * Ottiene statistiche sulla generazione
     * @returns {Object} Statistiche
     */
    getStats() {
        return {
            ...this.stats,
            averageTime: this.stats.generatedPDFs > 0 ? 
                Math.round(this.stats.totalTime / this.stats.generatedPDFs) : 0,
            successRate: this.stats.generatedPDFs + this.stats.errors > 0 ?
                ((this.stats.generatedPDFs / (this.stats.generatedPDFs + this.stats.errors)) * 100).toFixed(1) : 0
        };
    }

    /**
     * Resetta le statistiche
     */
    resetStats() {
        this.stats = {
            generatedPDFs: 0,
            totalTime: 0,
            errors: 0,
            retries: 0
        };
    }

    /**
     * Cleanup delle risorse
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            if (this.activePage) {
                await this.activePage.close();
                this.activePage = null;
            }
            
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        } catch (error) {
            console.warn(`Errore durante il cleanup: ${error.message}`);
        }
    }

    /**
     * Utility per delay
     * @param {number} ms - Millisecondi di attesa
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Verifica se il browser è attivo
     * @returns {boolean} True se il browser è attivo
     */
    isBrowserActive() {
        return this.browser !== null;
    }

    /**
     * Ottiene informazioni di sistema per diagnostica
     * @returns {Promise<Object>} Informazioni di sistema
     */
    async getSystemInfo() {
        try {
            const browser = await this.initBrowser();
            const version = await browser.version();
            
            return {
                browserVersion: version,
                isConnected: browser.isConnected(),
                activePages: (await browser.pages()).length,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime()
            };
        } catch (error) {
            return {
                error: error.message,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime()
            };
        }
    }
}
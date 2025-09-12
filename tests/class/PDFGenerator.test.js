import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PDFGenerator } from '../../modules/export/pdf/PDFGenerator.js';

describe('PDFGenerator - Configuration', () => {
    
    let pdfGenerator;

    beforeEach(() => {
        pdfGenerator = new PDFGenerator();
    });

    afterEach(async () => {
        if (pdfGenerator) {
            await pdfGenerator.cleanup();
        }
    });

    test('dovrebbe creare istanza con configurazione default', () => {
        expect(pdfGenerator.config.maxRetries).toBe(3);
        expect(pdfGenerator.config.timeout).toBe(60000);
        expect(pdfGenerator.config.autoCleanup).toBe(true);
    });

    test('dovrebbe permettere override configurazione', () => {
        const customGenerator = new PDFGenerator({
            maxRetries: 5,
            timeout: 30000,
            enableProgress: true
        });
        
        expect(customGenerator.config.maxRetries).toBe(5);
        expect(customGenerator.config.timeout).toBe(30000);
        expect(customGenerator.config.enableProgress).toBe(true);
    });

    test('dovrebbe configurare browser correttamente', () => {
        const generator = new PDFGenerator();
        
        expect(generator.browserConfig.headless).toBe(true);
        expect(generator.browserConfig.args).toContain('--no-sandbox');
        expect(generator.browserConfig.args).toContain('--disable-setuid-sandbox');
    });

    test('dovrebbe configurare PDF options correttamente', () => {
        const generator = new PDFGenerator();
        
        expect(generator.pdfConfig.format).toBe('A4');
        expect(generator.pdfConfig.printBackground).toBe(true);
        expect(generator.pdfConfig.landscape).toBe(true);
        expect(generator.pdfConfig.margin.top).toBe('0');
    });
});

describe('PDFGenerator - Browser Management', () => {
    
    let pdfGenerator;

    beforeEach(() => {
        pdfGenerator = new PDFGenerator();
    });

    afterEach(async () => {
        if (pdfGenerator) {
            await pdfGenerator.cleanup();
        }
    });

    test('dovrebbe inizializzare browser quando richiesto', async () => {
        expect(pdfGenerator.isBrowserActive()).toBe(false);
        
        const browser = await pdfGenerator.initBrowser();
        expect(browser).toBeDefined();
        expect(pdfGenerator.isBrowserActive()).toBe(true);
    });

    test('dovrebbe riutilizzare browser esistente', async () => {
        const browser1 = await pdfGenerator.initBrowser();
        const browser2 = await pdfGenerator.initBrowser();
        
        expect(browser1).toBe(browser2);
    });

    test('dovrebbe creare nuove pagine', async () => {
        const page = await pdfGenerator.createPage();
        expect(page).toBeDefined();
        
        // Verifica che la pagina sia configurata correttamente
        expect(typeof page.setContent).toBe('function');
        expect(typeof page.pdf).toBe('function');
        
        await page.close();
    });
});

describe('PDFGenerator - HTML Content Processing', () => {
    
    let pdfGenerator;

    beforeEach(() => {
        pdfGenerator = new PDFGenerator({
            timeout: 10000 // Timeout più breve per test
        });
    });

    afterEach(async () => {
        if (pdfGenerator) {
            await pdfGenerator.cleanup();
        }
    });

    test('dovrebbe processare HTML semplice', async () => {
        const page = await pdfGenerator.createPage();
        const simpleHtml = '<html><body><h1>Test HTML</h1></body></html>';
        
        // Non dovrebbe lanciare errori
        await expect(pdfGenerator.setPageContent(page, simpleHtml))
            .resolves.not.toThrow();
        
        await page.close();
    });

    test('dovrebbe gestire HTML con CSS', async () => {
        const page = await pdfGenerator.createPage();
        const htmlWithCss = `
            <html>
            <head>
                <style>
                    .card { background: red; padding: 10px; }
                </style>
            </head>
            <body>
                <div class="card">Test Card</div>
            </body>
            </html>
        `;
        
        await expect(pdfGenerator.setPageContent(page, htmlWithCss))
            .resolves.not.toThrow();
        
        await page.close();
    });

    test('dovrebbe gestire timeout per HTML complesso', async () => {
        const page = await pdfGenerator.createPage();
        const complexHtml = `
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                </style>
            </head>
            <body>
                <div style="font-family: 'Roboto', sans-serif;">Complex HTML</div>
            </body>
            </html>
        `;
        
        // Dovrebbe completare entro il timeout (anche se lento)
        await expect(pdfGenerator.setPageContent(page, complexHtml, { timeout: 15000 }))
            .resolves.not.toThrow();
        
        await page.close();
    }, 20000); // Test timeout più lungo
});

describe('PDFGenerator - PDF Generation', () => {
    
    let pdfGenerator;

    beforeEach(() => {
        pdfGenerator = new PDFGenerator({
            timeout: 15000,
            maxRetries: 2 // Ridotto per test più veloci
        });
    });

    afterEach(async () => {
        if (pdfGenerator) {
            await pdfGenerator.cleanup();
        }
    });

    test('dovrebbe generare PDF da HTML semplice', async () => {
        const simpleHtml = `
            <html>
            <body>
                <div style="width: 200px; height: 100px; background: #f0f0f0; padding: 20px;">
                    <h2>Test PDF Generation</h2>
                    <p>Questo è un test per la generazione PDF.</p>
                </div>
            </body>
            </html>
        `;
        
        const pdfBuffer = await pdfGenerator.generateFromHTML(simpleHtml);
        
        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(1000); // PDF dovrebbe avere dimensione ragionevole
        
        // Verifica header PDF
        const pdfHeader = pdfBuffer.slice(0, 4).toString();
        expect(pdfHeader).toBe('%PDF');
    }, 20000);

    test('dovrebbe gestire opzioni PDF personalizzate', async () => {
        const html = '<html><body><h1>Custom PDF Options Test</h1></body></html>';
        
        const customOptions = {
            format: 'A4',
            landscape: false,
            margin: { top: '20px', bottom: '20px' }
        };
        
        const pdfBuffer = await pdfGenerator.generateFromHTML(html, customOptions);
        
        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(500);
    }, 15000);

    test('dovrebbe gestire errori gracefully', async () => {
        const malformedHtml = '<html><body><h1>Test</h1>'; // HTML malformato
        
        // Dovrebbe comunque generare PDF (Puppeteer è tollerante)
        const pdfBuffer = await pdfGenerator.generateFromHTML(malformedHtml);
        expect(pdfBuffer).toBeInstanceOf(Buffer);
    }, 15000);
});

describe('PDFGenerator - Statistics and Monitoring', () => {
    
    let pdfGenerator;

    beforeEach(() => {
        pdfGenerator = new PDFGenerator();
    });

    afterEach(async () => {
        if (pdfGenerator) {
            await pdfGenerator.cleanup();
        }
    });

    test('dovrebbe tracciare statistiche base', () => {
        const stats = pdfGenerator.getStats();
        
        expect(stats.generatedPDFs).toBe(0);
        expect(stats.totalTime).toBe(0);
        expect(stats.errors).toBe(0);
        expect(stats.averageTime).toBe(0);
    });

    test('dovrebbe aggiornare statistiche dopo generazione', async () => {
        const html = '<html><body><h1>Stats Test</h1></body></html>';
        
        await pdfGenerator.generateFromHTML(html);
        
        const stats = pdfGenerator.getStats();
        expect(stats.generatedPDFs).toBe(1);
        expect(stats.totalTime).toBeGreaterThan(0);
        expect(parseFloat(stats.successRate)).toBe(100);
    }, 15000);

    test('dovrebbe permettere reset statistiche', async () => {
        const html = '<html><body><h1>Reset Test</h1></body></html>';
        
        await pdfGenerator.generateFromHTML(html);
        expect(pdfGenerator.getStats().generatedPDFs).toBe(1);
        
        pdfGenerator.resetStats();
        expect(pdfGenerator.getStats().generatedPDFs).toBe(0);
    }, 15000);
});

describe('PDFGenerator - Progress Tracking', () => {
    
    let pdfGenerator;

    beforeEach(() => {
        pdfGenerator = new PDFGenerator({
            enableProgress: true
        });
    });

    afterEach(async () => {
        if (pdfGenerator) {
            await pdfGenerator.cleanup();
        }
    });

    test('dovrebbe chiamare progress callback', async () => {
        const html = '<html><body><h1>Progress Test</h1></body></html>';
        
        const progressCalls = [];
        const progressCallback = (progress) => {
            progressCalls.push(progress);
        };
        
        await pdfGenerator.generateFromHTML(html, {}, progressCallback);
        
        expect(progressCalls.length).toBeGreaterThan(0);
        expect(progressCalls[0]).toHaveProperty('stage');
        expect(progressCalls[0]).toHaveProperty('progress');
        
        // L'ultimo callback dovrebbe essere 'completed'
        const lastCall = progressCalls[progressCalls.length - 1];
        expect(lastCall.stage).toBe('completed');
        expect(lastCall.progress).toBe(100);
    }, 15000);
});

describe('PDFGenerator - Cleanup and Resource Management', () => {
    
    test('dovrebbe pulire risorse correttamente', async () => {
        const pdfGenerator = new PDFGenerator();
        
        // Inizializza browser
        await pdfGenerator.initBrowser();
        expect(pdfGenerator.isBrowserActive()).toBe(true);
        
        // Cleanup
        await pdfGenerator.cleanup();
        expect(pdfGenerator.isBrowserActive()).toBe(false);
    });

    test('dovrebbe gestire cleanup multipli senza errori', async () => {
        const pdfGenerator = new PDFGenerator();
        
        await pdfGenerator.initBrowser();
        
        // Multipli cleanup non dovrebbero causare errori
        await expect(pdfGenerator.cleanup()).resolves.not.toThrow();
        await expect(pdfGenerator.cleanup()).resolves.not.toThrow();
    });
});

describe('PDFGenerator - Error Handling', () => {
    
    let pdfGenerator;

    beforeEach(() => {
        pdfGenerator = new PDFGenerator({
            maxRetries: 1, // Solo 1 tentativo per test più veloci
            timeout: 5000
        });
    });

    afterEach(async () => {
        if (pdfGenerator) {
            await pdfGenerator.cleanup();
        }
    });

    test('dovrebbe gestire HTML vuoto', async () => {
        await expect(pdfGenerator.generateFromHTML(''))
            .resolves.toBeInstanceOf(Buffer);
    });

    test('dovrebbe gestire timeout gracefully', async () => {
        // HTML che richiede molto tempo per caricare
        const slowHtml = `
            <html>
            <body>
                <script>
                    // Script che impiega tempo
                    for(let i = 0; i < 1000000; i++) {
                        Math.random();
                    }
                </script>
                <h1>Slow HTML</h1>
            </body>
            </html>
        `;
        
        // Con timeout molto breve, dovrebbe comunque generare qualcosa
        const shortTimeoutGenerator = new PDFGenerator({
            timeout: 1000,
            maxRetries: 1
        });
        
        // Potrebbe lanciare timeout, ma non dovrebbe crashare
        try {
            const result = await shortTimeoutGenerator.generateFromHTML(slowHtml);
            expect(result).toBeInstanceOf(Buffer);
        } catch (error) {
            expect(error.message).toContain('timeout');
        }
        
        await shortTimeoutGenerator.cleanup();
    }, 10000);
});
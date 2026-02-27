import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock process.exit per evitare che i test terminino
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

import { CLIInterface } from '../../modules/interfaces/cli/CLIInterface.js';

describe('CLIInterface - validateBatchOptions', () => {

    let cli;

    beforeEach(() => {
        cli = new CLIInterface({ verbose: false });
    });

    test('dovrebbe validare opzioni valide', () => {
        const options = {
            flip: 'short',
            cardsPerPage: '8',
            cardsPerRow: '4'
        };

        const result = cli.validateBatchOptions(options);

        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('NON dovrebbe richiedere -o o -b (a differenza di generate)', () => {
        const options = {
            flip: 'short',
            cardsPerPage: '8',
            cardsPerRow: '4'
            // Nessun output o browser specificato
        };

        const result = cli.validateBatchOptions(options);

        expect(result.isValid).toBe(true);
    });

    test('dovrebbe rifiutare modalità flip non valida', () => {
        const options = {
            flip: 'invalid-mode',
            cardsPerPage: '8',
            cardsPerRow: '4'
        };

        const result = cli.validateBatchOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
        expect(result.errors[0]).toContain('stampa non valida');
    });

    test('dovrebbe rifiutare cardsPerPage non numerico', () => {
        const options = {
            flip: 'short',
            cardsPerPage: 'abc',
            cardsPerRow: '4'
        };

        const result = cli.validateBatchOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('cards-per-page'))).toBe(true);
    });

    test('dovrebbe rifiutare cardsPerRow non numerico', () => {
        const options = {
            flip: 'short',
            cardsPerPage: '8',
            cardsPerRow: 'xyz'
        };

        const result = cli.validateBatchOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('cards-per-row'))).toBe(true);
    });

    test('dovrebbe accettare modalità landscape', () => {
        const options = {
            flip: 'landscape',
            cardsPerPage: '8',
            cardsPerRow: '4'
        };

        const result = cli.validateBatchOptions(options);

        expect(result.isValid).toBe(true);
    });
});

describe('CLIInterface - _scanJsonFiles', () => {

    let cli;
    let tmpDir;

    beforeEach(async () => {
        cli = new CLIInterface({ verbose: false });
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kpi-batch-test-'));
    });

    afterEach(async () => {
        // Cleanup temp directory
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    test('dovrebbe trovare file JSON nella directory', async () => {
        // Crea file di test
        await fs.writeFile(path.join(tmpDir, 'deck1.json'), '{}');
        await fs.writeFile(path.join(tmpDir, 'deck2.json'), '{}');

        const result = await cli._scanJsonFiles(tmpDir);

        expect(result.length).toBe(2);
        expect(result[0]).toContain('deck1.json');
        expect(result[1]).toContain('deck2.json');
    });

    test('dovrebbe restituire array vuoto per directory senza JSON', async () => {
        await fs.writeFile(path.join(tmpDir, 'readme.txt'), 'not json');
        await fs.writeFile(path.join(tmpDir, 'image.png'), 'not json');

        const result = await cli._scanJsonFiles(tmpDir);

        expect(result.length).toBe(0);
    });

    test('dovrebbe ignorare file non JSON', async () => {
        await fs.writeFile(path.join(tmpDir, 'deck1.json'), '{}');
        await fs.writeFile(path.join(tmpDir, 'readme.txt'), 'text');
        await fs.writeFile(path.join(tmpDir, 'style.css'), 'css');

        const result = await cli._scanJsonFiles(tmpDir);

        expect(result.length).toBe(1);
        expect(result[0]).toContain('deck1.json');
    });

    test('dovrebbe ignorare subdirectory', async () => {
        await fs.writeFile(path.join(tmpDir, 'deck1.json'), '{}');
        await fs.mkdir(path.join(tmpDir, 'subdir'));
        await fs.writeFile(path.join(tmpDir, 'subdir', 'deck2.json'), '{}');

        const result = await cli._scanJsonFiles(tmpDir);

        expect(result.length).toBe(1);
        expect(result[0]).toContain('deck1.json');
    });

    test('dovrebbe ordinare i file alfabeticamente', async () => {
        await fs.writeFile(path.join(tmpDir, 'charlie.json'), '{}');
        await fs.writeFile(path.join(tmpDir, 'alpha.json'), '{}');
        await fs.writeFile(path.join(tmpDir, 'bravo.json'), '{}');

        const result = await cli._scanJsonFiles(tmpDir);

        expect(result.length).toBe(3);
        expect(path.basename(result[0])).toBe('alpha.json');
        expect(path.basename(result[1])).toBe('bravo.json');
        expect(path.basename(result[2])).toBe('charlie.json');
    });

    test('dovrebbe restituire percorsi assoluti', async () => {
        await fs.writeFile(path.join(tmpDir, 'deck.json'), '{}');

        const result = await cli._scanJsonFiles(tmpDir);

        expect(path.isAbsolute(result[0])).toBe(true);
    });

    test('dovrebbe lanciare errore per directory inesistente', async () => {
        await expect(cli._scanJsonFiles('/path/inesistente/xyz'))
            .rejects.toThrow('Directory non trovata');
    });
});

describe('CLIInterface - _logBatchSummary', () => {

    let cli;
    let consoleSpy;

    beforeEach(() => {
        cli = new CLIInterface({ verbose: false });
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test('dovrebbe stampare riepilogo con tutti successi', () => {
        const results = {
            succeeded: [
                { file: 'deck1', totalCards: 10, pagesCount: 2 },
                { file: 'deck2', totalCards: 6, pagesCount: 1 }
            ],
            failed: []
        };

        cli._logBatchSummary(results, 2);

        const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
        expect(output).toContain('Totale file: 2');
        expect(output).toContain('Completati: 2');
        expect(output).toContain('Falliti: 0');
        expect(output).toContain('Carte totali generate: 16');
    });

    test('dovrebbe stampare riepilogo con errori', () => {
        const results = {
            succeeded: [
                { file: 'deck1', totalCards: 10, pagesCount: 2 }
            ],
            failed: [
                { file: 'deck2', error: 'JSON non valido' }
            ]
        };

        cli._logBatchSummary(results, 2);

        const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
        expect(output).toContain('Totale file: 2');
        expect(output).toContain('Completati: 1');
        expect(output).toContain('Falliti: 1');
        expect(output).toContain('deck2');
        expect(output).toContain('JSON non valido');
    });

    test('dovrebbe stampare riepilogo con tutti fallimenti', () => {
        const results = {
            succeeded: [],
            failed: [
                { file: 'deck1', error: 'Errore 1' },
                { file: 'deck2', error: 'Errore 2' }
            ]
        };

        cli._logBatchSummary(results, 2);

        const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
        expect(output).toContain('Completati: 0');
        expect(output).toContain('Falliti: 2');
        expect(output).not.toContain('Carte totali generate');
    });
});

describe('CLIInterface - _generateSingleDeck', () => {

    let cli;

    beforeEach(async () => {
        cli = new CLIInterface({ verbose: false });
        // Inizializza renderer con template reali
        await cli.initializeRenderer('assets/card-template.html');
    });

    test('dovrebbe generare con successo da un file JSON valido', async () => {
        const testFile = path.resolve('tests/data/test-6-carte.json');

        const result = await cli._generateSingleDeck({
            inputPath: testFile,
            options: {
                cardsPerPage: '8',
                cardsPerRow: '4',
                flip: 'short',
                validate: true
            },
            pdfOutputPath: null,
            htmlOutputPath: null
        });

        expect(result.success).toBe(true);
        expect(result.totalCards).toBe(6);
        expect(result.pagesCount).toBeGreaterThan(0);
        expect(result.pages).toBeDefined();
    });

    test('dovrebbe restituire errore per file inesistente', async () => {
        const result = await cli._generateSingleDeck({
            inputPath: '/path/inesistente/deck.json',
            options: {
                cardsPerPage: '8',
                cardsPerRow: '4',
                flip: 'short',
                validate: true
            },
            pdfOutputPath: null,
            htmlOutputPath: null
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.totalCards).toBe(0);
    });

    test('dovrebbe generare file HTML quando htmlOutputPath è specificato', async () => {
        const testFile = path.resolve('tests/data/test-6-carte.json');
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kpi-html-test-'));
        const htmlOutput = path.join(tmpDir, 'output.html');

        try {
            const result = await cli._generateSingleDeck({
                inputPath: testFile,
                options: {
                    cardsPerPage: '8',
                    cardsPerRow: '4',
                    flip: 'short',
                    validate: true
                },
                pdfOutputPath: null,
                htmlOutputPath: htmlOutput
            });

            expect(result.success).toBe(true);

            // Verifica che il file HTML sia stato creato
            const htmlContent = await fs.readFile(htmlOutput, 'utf-8');
            expect(htmlContent).toContain('<!DOCTYPE html>');
            expect(htmlContent).toContain('playing-card');
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    });

    test('dovrebbe gestire bypass dei limiti caratteri', async () => {
        const testFile = path.resolve('tests/data/test-6-carte.json');

        const result = await cli._generateSingleDeck({
            inputPath: testFile,
            options: {
                cardsPerPage: '8',
                cardsPerRow: '4',
                flip: 'short',
                validate: true,
                charLimits: false
            },
            pdfOutputPath: null,
            htmlOutputPath: null
        });

        expect(result.success).toBe(true);
    });
});

describe('CLIInterface - Batch Command Integration', () => {

    let cli;
    let tmpDir;
    let tmpOutputDir;

    beforeEach(async () => {
        mockExit.mockClear();
        cli = new CLIInterface({ verbose: false });
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kpi-batch-int-'));
        tmpOutputDir = path.join(tmpDir, 'output');
    });

    afterEach(async () => {
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    test('dovrebbe registrare il comando batch', () => {
        const commands = cli.program.commands.map(c => c.name());
        expect(commands).toContain('batch');
    });

    test('il comando batch dovrebbe avere opzione -d obbligatoria', () => {
        const batchCmd = cli.program.commands.find(c => c.name() === 'batch');
        const dirOption = batchCmd.options.find(o => o.long === '--directory');
        expect(dirOption).toBeDefined();
        expect(dirOption.required).toBe(true);
    });

    test('il comando batch dovrebbe avere opzione -o', () => {
        const batchCmd = cli.program.commands.find(c => c.name() === 'batch');
        const outOption = batchCmd.options.find(o => o.long === '--output');
        expect(outOption).toBeDefined();
        // -o è un'opzione (non requiredOption), quindi è facoltativa nel batch
        // Commander.js setta required=true per le opzioni con argomento (<dir>),
        // ma il batch funziona anche senza -o (usa la directory dei JSON)
    });

    test('dovrebbe generare HTML nella directory di output per file JSON validi', async () => {
        // Copia un file JSON di test nella directory temp
        const sourceJson = path.resolve('tests/data/test-6-carte.json');
        const content = await fs.readFile(sourceJson, 'utf-8');
        await fs.writeFile(path.join(tmpDir, 'test-deck.json'), content);

        // Crea directory output
        const htmlOutputDir = path.join(tmpDir, 'html-output');

        await cli.handleBatchCommand({
            directory: tmpDir,
            browser: htmlOutputDir,
            flip: 'short',
            cardsPerPage: '8',
            cardsPerRow: '4',
            validate: true
        });

        // Verifica che il file HTML sia stato generato
        const htmlFile = path.join(htmlOutputDir, 'test-deck.html');
        const htmlExists = await fs.access(htmlFile).then(() => true).catch(() => false);
        expect(htmlExists).toBe(true);

        const htmlContent = await fs.readFile(htmlFile, 'utf-8');
        expect(htmlContent).toContain('<!DOCTYPE html>');
    });

    test('dovrebbe continuare a processare dopo un errore su un file', async () => {
        // Crea un file JSON non valido e uno valido
        await fs.writeFile(path.join(tmpDir, 'bad.json'), '{ invalid json }');

        const sourceJson = path.resolve('tests/data/test-6-carte.json');
        const validContent = await fs.readFile(sourceJson, 'utf-8');
        await fs.writeFile(path.join(tmpDir, 'good.json'), validContent);

        const htmlOutputDir = path.join(tmpDir, 'html-output');

        // Cattura console.log per verificare il riepilogo
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
            await cli.handleBatchCommand({
                directory: tmpDir,
                browser: htmlOutputDir,
                flip: 'short',
                cardsPerPage: '8',
                cardsPerRow: '4',
                validate: true
            });

            // Dovrebbe chiamare process.exit(1) perché c'è un fallimento
            expect(mockExit).toHaveBeenCalledWith(1);

            // Ma il file good.html dovrebbe essere stato generato
            const goodHtml = path.join(htmlOutputDir, 'good.html');
            const goodExists = await fs.access(goodHtml).then(() => true).catch(() => false);
            expect(goodExists).toBe(true);
        } finally {
            consoleSpy.mockRestore();
            consoleWarnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        }
    });

    test('dovrebbe uscire con exit(0) per directory senza JSON', async () => {
        const emptyDir = path.join(tmpDir, 'empty');
        await fs.mkdir(emptyDir);

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
            await cli.handleBatchCommand({
                directory: emptyDir,
                flip: 'short',
                cardsPerPage: '8',
                cardsPerRow: '4',
                validate: true
            });

            expect(mockExit).toHaveBeenCalledWith(0);
        } finally {
            consoleSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        }
    });

    test('dovrebbe generare PDF nella stessa directory dei JSON quando -o non è specificato', async () => {
        // Copia un file JSON di test
        const sourceJson = path.resolve('tests/data/test-6-carte.json');
        const content = await fs.readFile(sourceJson, 'utf-8');
        await fs.writeFile(path.join(tmpDir, 'mazzo.json'), content);

        // Nota: questo test genera effettivamente un PDF con Puppeteer
        // Se Puppeteer non è disponibile, il test fallirà
        await cli.handleBatchCommand({
            directory: tmpDir,
            flip: 'short',
            cardsPerPage: '8',
            cardsPerRow: '4',
            validate: true
        });

        // Verifica che il PDF sia stato generato nella stessa directory
        const pdfFile = path.join(tmpDir, 'mazzo.pdf');
        const pdfExists = await fs.access(pdfFile).then(() => true).catch(() => false);
        expect(pdfExists).toBe(true);

        // Verifica che sia un PDF valido (header %PDF)
        const pdfContent = await fs.readFile(pdfFile);
        const pdfHeader = pdfContent.slice(0, 4).toString();
        expect(pdfHeader).toBe('%PDF');
    }, 30000); // Timeout lungo per Puppeteer

    test('dovrebbe generare PDF in directory -o specificata', async () => {
        // Copia un file JSON di test
        const sourceJson = path.resolve('tests/data/test-6-carte.json');
        const content = await fs.readFile(sourceJson, 'utf-8');
        await fs.writeFile(path.join(tmpDir, 'mazzo.json'), content);

        await cli.handleBatchCommand({
            directory: tmpDir,
            output: tmpOutputDir,
            flip: 'short',
            cardsPerPage: '8',
            cardsPerRow: '4',
            validate: true
        });

        // Verifica che il PDF sia stato generato nella directory output
        const pdfFile = path.join(tmpOutputDir, 'mazzo.pdf');
        const pdfExists = await fs.access(pdfFile).then(() => true).catch(() => false);
        expect(pdfExists).toBe(true);
    }, 30000);
});

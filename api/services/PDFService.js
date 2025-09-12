import { PDFGenerator } from '../../modules/export/pdf/PDFGenerator.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDFService - Service per generazione PDF
 * Integra PDFGenerator per creare PDF dalle carte renderizzate
 */
export class PDFService {
    constructor() {
        this.pdfGenerator = new PDFGenerator({
            timeout: 30000,
            memoryLimit: 512,
            headless: true
        });
        
        this.exportsPath = path.resolve(__dirname, '../data/exports');
        this._initializeExportsDir();
    }

    /**
     * Inizializza directory export se non esiste
     */
    async _initializeExportsDir() {
        try {
            await fs.mkdir(this.exportsPath, { recursive: true });
        } catch (error) {
            console.error('Errore creazione directory exports:', error);
        }
    }

    /**
     * Genera PDF da HTML content
     */
    async generatePDF(htmlContent, options = {}) {
        const defaultOptions = {
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            margins: {
                top: '0.5cm',
                bottom: '0.5cm',
                left: '0.5cm',
                right: '0.5cm'
            }
        };

        const pdfOptions = { ...defaultOptions, ...options };

        // Converte printMode in orientamento
        if (options.printMode) {
            pdfOptions.landscape = options.printMode === 'landscape';
        }

        try {
            const startTime = Date.now();
            
            // Genera PDF usando PDFGenerator esistente
            const result = await this.pdfGenerator.generateFromHTML(
                htmlContent,
                pdfOptions
            );

            const duration = Date.now() - startTime;

            return {
                buffer: result, // generateFromHTML returns buffer directly
                size: result.length,
                duration: duration,
                options: pdfOptions,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Errore generazione PDF: ${error.message}`);
        }
    }

    /**
     * Salva PDF temporaneamente e restituisce info download
     */
    async saveTemporaryPDF(pdfBuffer, deckInfo, options = {}) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = this._generateFilename(deckInfo.titolo, timestamp, options.printMode);
        const filepath = path.join(this.exportsPath, filename);

        try {
            // Salva il PDF
            await fs.writeFile(filepath, pdfBuffer);

            // Calcola scadenza (default 12 ore)
            const expirationHours = options.expirationHours || 12;
            const expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));

            return {
                downloadUrl: `/api/v1/downloads/${filename}`,
                filename: filename,
                filepath: filepath,
                size: pdfBuffer.length,
                expiresAt: expiresAt.toISOString(),
                generatedAt: new Date().toISOString(),
                deck: {
                    id: deckInfo.id,
                    titolo: deckInfo.titolo
                }
            };

        } catch (error) {
            throw new Error(`Errore salvataggio PDF temporaneo: ${error.message}`);
        }
    }

    /**
     * Genera nome file PDF
     */
    _generateFilename(deckTitle, timestamp, printMode = 'landscape') {
        const title = deckTitle || 'deck';
        const cleanTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
        
        return `${cleanTitle}_${printMode}_${timestamp}.pdf`;
    }

    /**
     * Ottiene informazioni su un file PDF temporaneo
     */
    async getTemporaryFileInfo(filename) {
        const filepath = path.join(this.exportsPath, filename);
        
        try {
            const stats = await fs.stat(filepath);
            
            return {
                filename,
                filepath,
                size: stats.size,
                exists: true,
                createdAt: stats.birthtime.toISOString(),
                modifiedAt: stats.mtime.toISOString()
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    filename,
                    exists: false,
                    error: 'File non trovato'
                };
            }
            throw error;
        }
    }

    /**
     * Pulisce file temporanei scaduti
     */
    async cleanupExpiredFiles(maxAgeHours = 12) {
        try {
            const files = await fs.readdir(this.exportsPath);
            const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            
            let deletedCount = 0;
            let totalSize = 0;

            for (const file of files) {
                if (!file.endsWith('.pdf')) continue;
                
                const filepath = path.join(this.exportsPath, file);
                
                try {
                    const stats = await fs.stat(filepath);
                    
                    if (stats.mtime.getTime() < cutoffTime) {
                        await fs.unlink(filepath);
                        deletedCount++;
                        totalSize += stats.size;
                        console.log(`Deleted expired PDF: ${file}`);
                    }
                } catch (error) {
                    console.error(`Error checking file ${file}:`, error);
                }
            }

            return {
                deletedFiles: deletedCount,
                freedSpace: totalSize,
                cleanupAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error during cleanup:', error);
            throw new Error(`Errore pulizia file temporanei: ${error.message}`);
        }
    }

    /**
     * Lista tutti i file PDF temporanei
     */
    async listTemporaryFiles() {
        try {
            const files = await fs.readdir(this.exportsPath);
            const pdfFiles = files.filter(file => file.endsWith('.pdf'));
            
            const fileInfos = await Promise.all(
                pdfFiles.map(async (file) => {
                    try {
                        const info = await this.getTemporaryFileInfo(file);
                        return info;
                    } catch (error) {
                        return {
                            filename: file,
                            exists: false,
                            error: error.message
                        };
                    }
                })
            );

            const totalSize = fileInfos
                .filter(info => info.exists)
                .reduce((sum, info) => sum + info.size, 0);

            return {
                files: fileInfos.filter(info => info.exists),
                totalFiles: fileInfos.filter(info => info.exists).length,
                totalSize: totalSize,
                listedAt: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Errore listing file temporanei: ${error.message}`);
        }
    }

    /**
     * Valida opzioni PDF
     */
    validatePDFOptions(options) {
        const validFormats = ['A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'];
        const errors = [];

        if (options.format && !validFormats.includes(options.format)) {
            errors.push(`Formato non valido: ${options.format}. Validi: ${validFormats.join(', ')}`);
        }

        if (options.margins) {
            const { top, bottom, left, right } = options.margins;
            const marginPattern = /^\d+(\.\d+)?(cm|mm|in|px)$/;
            
            ['top', 'bottom', 'left', 'right'].forEach(side => {
                const margin = options.margins[side];
                if (margin && !marginPattern.test(margin)) {
                    errors.push(`Margine ${side} non valido: ${margin}. Formato: "0.5cm", "10mm", "1in"`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Ottieni statistiche utilizzo PDF service
     */
    async getUsageStats() {
        try {
            const fileList = await this.listTemporaryFiles();
            
            return {
                temporaryFiles: fileList.totalFiles,
                totalStorageUsed: fileList.totalSize,
                storageUsedMB: Math.round(fileList.totalSize / (1024 * 1024) * 100) / 100,
                exportsPath: this.exportsPath,
                statsGeneratedAt: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Errore statistiche PDF service: ${error.message}`);
        }
    }
}
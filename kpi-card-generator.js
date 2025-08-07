#!/usr/bin/env node

import { Command } from 'commander';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Calcola la disposizione delle carte per la stampa fronte-retro con paginazione.
 * @param {Array<Object>} cards - L'array di oggetti carta.
 * @param {number} cardsPerPage - Il numero di carte per pagina (default 8).
 * @param {number} cardsPerRow - Il numero di carte per riga (default 4).
 * @param {string} flipMode - La modalità di stampa: 'short' o 'long'.
 * @returns {Array<{fronts: Array, backs: Array}>} Array di pagine con fronti e retri ordinati.
 */
export function calculatePaginatedLayouts(cards, cardsPerPage = 8, cardsPerRow = 4, flipMode = 'short') {
    const pages = [];
    const totalCards = cards.length;
    const totalPages = Math.ceil(totalCards / cardsPerPage);
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIdx = pageIndex * cardsPerPage;
        const endIdx = Math.min(startIdx + cardsPerPage, totalCards);
        const pageCards = cards.slice(startIdx, endIdx);
        
        const pageFronts = [...pageCards];
        while (pageFronts.length < cardsPerPage) {
            pageFronts.push({ isPlaceholder: true });
        }
        
        const pageBacks = createMirroredBacks(pageFronts, cardsPerRow, flipMode);
        
        pages.push({
            fronts: pageFronts,
            backs: pageBacks
        });
    }
    
    return pages;
}

/**
 * Crea l'ordinamento speculare del retro per una pagina in base alla modalità.
 * - 'short': Inverte solo l'ordine delle carte in ogni riga (per capovolgere sul lato lungo).
 * - 'long': Inverte solo l'ordine delle righe (per capovolgere sul lato corto).
 * @param {Array<Object>} fronts - Array delle carte del fronte.
 * @param {number} cardsPerRow - Numero di carte per riga.
 * @param {string} flipMode - La modalità di stampa ('short' o 'long').
 * @returns {Array<Object>} Array delle carte del retro ordinate.
 */
function createMirroredBacks(fronts, cardsPerRow, flipMode) {
    const allRows = [];
    const rows = Math.ceil(fronts.length / cardsPerRow);
    
    for (let i = 0; i < rows; i++) {
        const rowCards = fronts.slice(i * cardsPerRow, (i + 1) * cardsPerRow);
        allRows.push(rowCards);
    }
    
    let processedRows;

    if (flipMode === 'long') {
        // Modalità Long-Side: Inverte l'ordine delle righe.
        processedRows = allRows.reverse();
    } else {
        // Modalità Short-Side (default): Inverte le carte in ogni riga.
        processedRows = allRows.map(row => row.reverse());
    }
    
    return processedRows.flat();
}

/**
 * Genera l'HTML per una carta (fronte o retro).
 */
function generateCardHtml(card, template, data, isFront = true) {
    if (card.isPlaceholder) {
        return '<div class="playing-card placeholder"></div>';
    }
    
    let html = template;
    if (isFront) {
        html = html.replace(/{{titolo}}/g, card.titolo || '');
        html = html.replace(/{{icona}}/g, card.icona || '');
        html = html.replace(/{{emoji}}/g, card.emoji || '');
        html = html.replace(/{{tipo}}/g, card.tipo || '');
        html = html.replace(/{{testo}}/g, card.testo || '');
        html = html.replace(/{{flavor}}/g, card.flavor || '');
        html = html.replace(/{{classe}}/g, card.classe || '');
    } else {
        html = html.replace(/{{icona_esercizio}}/g, data.icona_esercizio || '❓');
        html = html.replace(/{{classe}}/g, card.classe || '');
    }
    
    return html;
}

// Funzione principale per eseguire lo script da riga di comando
async function run() {
    const program = new Command();
    program
        .version('2.1.0')
        .description('Generatore di carte da gioco per workshop KPI con paginazione corretta')
        .requiredOption('-i, --input <file>', 'File di input JSON con i dati delle carte')
        .option('-o, --output <file>', 'Genera il PDF delle carte nel file specificato')
        .option('-b, --browser <file>', 'Genera il file HTML delle carte per la visualizzazione nel browser')
        .option('-t, --template <file>', 'Percorso del file template per le singole carte', 'assets/card-template.html')
        .option('-f, --flip <mode>', 'Modalità stampa fronte-retro: short (lato corto) o long (lato lungo)', 'short'); 
    program.helpOption('-h, --help', 'Mostra questo messaggio di aiuto');
    program.parse(process.argv);
    const options = program.opts();

    const flipMode = options.flip.toLowerCase();
    if (flipMode !== 'short' && flipMode !== 'long') { 
        console.error(`❌ Errore: Modalità sheet non valida '${options.flip}'.`);
        console.error('   Usa "short" (capovolgi sul lato lungo) o "long" (capovolgi sul lato corto).'); 
        process.exit(1);
    }

    if (!options.output && !options.browser) {
        console.error('❌ Errore: Devi specificare almeno un formato di output (-o per PDF o -b per HTML).');
        console.error('   Usa -h per aiuto.');
        process.exit(1);
    }


    try {
        const jsonPath = path.resolve(options.input);
        const jsonData = await fs.readFile(jsonPath, 'utf-8');
        const data = JSON.parse(jsonData);

        const templatePath = path.resolve(options.template);
        const templateHtml = await fs.readFile(templatePath, 'utf-8');
        
        const frontTemplateMatch = templateHtml.match(/<template id="card-front">([\s\S]*?)<\/template>/);
        const backTemplateMatch = templateHtml.match(/<template id="card-back">([\s\S]*?)<\/template>/);

        if (!frontTemplateMatch || !backTemplateMatch) {
            throw new Error(`Template non validi nel file: ${templatePath}.`);
        }
        const frontTemplate = frontTemplateMatch[1];
        const backTemplate = backTemplateMatch[1];

        // Calcola il layout paginato con la modalità sheet specificata
        const pages = calculatePaginatedLayouts(data.carte, 8, 4, flipMode);

        // Log della modalità utilizzata
        console.log(`🖨️  Modalità stampa: ${flipMode.toUpperCase()} (capovolgi sul lato ${flipMode === 'short' ? 'corto' : 'lungo'})`);

        /** BEGIN - RIFATTORIZZARE PORTANDO SU FUNZIONE DEDICATA 
         *  generateCompleteHtml(pages, data, frontTemplate, backTemplate, flipMode)
        */

        // Se ci sono più pagine, dobbiamo creare container separati per ogni foglio
        let fullHtml = '';
        
        if (pages.length === 1) {
            // Caso semplice: solo un foglio, usa il template standard
            const page = pages[0];
            
            const frontsHtml = page.fronts
                .map(card => generateCardHtml(card, frontTemplate, data, true))
                .join('');
            
            const backsHtml = page.backs
                .map(card => generateCardHtml(card, backTemplate, data, false))
                .join('');

            
            // Carica il template principale dai file assets
            const mainTemplatePath = path.resolve('assets/main-template.html');
            fullHtml = await fs.readFile(mainTemplatePath, 'utf-8');
            
            // Aggiungi CSS per la modalità di stampa
            const modeInfoCSS = `
            <style>
                @media screen {
                    .print-mode-info {
                        background-color: #fef3c7;
                        border: 2px solid #f59e0b;
                        padding: 1rem;
                        margin: 1rem auto;
                        border-radius: 0.5rem;
                        text-align: center;
                        max-width: 600px;
                    }
                    
                    .print-mode-info strong {
                        color: #d97706;
                        text-transform: uppercase;
                    }
                }
                
                @media print {
                    .print-mode-info {
                        display: none !important;
                    }
                }


            </style>
            `;
            
            // Inserisci CSS prima di </head>
            fullHtml = fullHtml.replace('</head>', modeInfoCSS + '</head>');
            
            // Aggiungi l'indicatore della modalità dopo il titolo
            const modeInfoHTML = `
            <div class="print-mode-info no-print">
                <strong>Modalità stampa: ${flipMode.toUpperCase()}</strong><br>
                Stampa fronte-retro capovolgendo sul lato ${flipMode === 'short' ? 'corto' : 'lungo'}
            </div>`;
            
            // Inserisci dopo il sottotitolo
            fullHtml = fullHtml.replace('{{SOTTOTITOLO_ESERCIZIO}}</p>', 
                `{{SOTTOTITOLO_ESERCIZIO}}</p>${modeInfoHTML}`);
            
            // Sostituisci i placeholder nel template
            fullHtml = fullHtml.replace(/{{TITOLO_ESERCIZIO}}/g, data.titolo || '');
            fullHtml = fullHtml.replace(/{{SOTTOTITOLO_ESERCIZIO}}/g, data.sottotitolo || '');
            fullHtml = fullHtml.replace(/{{FRONTE_CARTE}}/g, frontsHtml);
            fullHtml = fullHtml.replace(/{{RETRO_CARTE}}/g, backsHtml);
            
        } else {
            // Caso complesso: più fogli, dobbiamo replicare la struttura per ogni foglio
            console.log(`📄 Generazione di ${pages.length} fogli per ${data.carte.length} carte...`);
            
            // Carica il template e estrai le parti necessarie
            const mainTemplatePath = path.resolve('assets/main-template.html');
            const mainTemplate = await fs.readFile(mainTemplatePath, 'utf-8');
            
            // Estrai head e stili dal template
            const headMatch = mainTemplate.match(/<head>([\s\S]*?)<\/head>/);
            const headContent = headMatch ? headMatch[1] : '';
            
            // Inizia a costruire l'HTML
            fullHtml = `<!DOCTYPE html>
<html lang="it">
<head>
${headContent}
<style>
    /* CSS aggiuntivo per gestione multi-pagina */
    @media print {
        .sheet-separator {
            page-break-after: always;
            height: 0;
            display: block;
        }
        
        .fronts-container,
        .backs-container {
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
        }
        
        /* Ogni container di fronte deve avere page break dopo */
        .fronts-container {
            page-break-after: always;
        }
        
        /* L'ultimo backs-container non deve avere page break */
        .backs-container:last-of-type {
            page-break-after: auto;
        }
        
        /* Nascondi info modalità in stampa */
        .print-mode-info {
            display: none !important;
        }
    }
    
    @media screen {
        .print-mode-info {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            text-align: center;
        }
        
        .print-mode-info strong {
            color: #d97706;
            text-transform: uppercase;
        }
    }            `;
if (flipMode === 'long') {
    fullHtml +=
    `
    /* Rotazione carte retro in caso di flip su lato lungo */
    .backs-container .playing-card {
        transform: rotate(180deg);
    }`;
}

fullHtml += `
</style>
</head>
<body>
    <div class="page-container">
        <div class="text-center mb-12 no-print">
            <h1 class="text-4xl font-bold text-gray-800">${data.titolo || ''}</h1>
            <p class="mt-4 text-lg text-gray-600">${data.sottotitolo || ''}</p>
        </div>
        <div class="print-mode-info">
            <strong>ℹ️ Modalità stampa: ${flipMode.toUpperCase()}</strong><br>
            Stampa fronte-retro capovolgendo sul lato ${flipMode === 'short' ? 'lungo' : 'corto'}
        </div>`;
            

      // Genera HTML per ogni foglio
        pages.forEach((page, pageIndex) => {
            const pageFrontsHtml = page.fronts
                .map(card => generateCardHtml(card, frontTemplate, data, true))
                .join('');
                
            const pageBacksHtml = page.backs
                .map(card => generateCardHtml(card, backTemplate, data, false))
                .join('');
        
                // Aggiungi commento per debug
                fullHtml += `
        <!-- FOGLIO ${pageIndex + 1} di ${pages.length} -->`;
                
                // Aggiungi fronti
                fullHtml += `
        <div class="fronts-container">
            <h2 class="section-title">Fronte Carte - Foglio ${pageIndex + 1}</h2>
            <div class="card-grid">${pageFrontsHtml}</div>
        </div>`;
                
                // Aggiungi retri
                fullHtml += `
        <div class="backs-container">
            <h2 class="section-title">Retro Carte - Foglio ${pageIndex + 1}</h2>
            <div class="card-grid">${pageBacksHtml}</div>
        </div>`;
                
                // Aggiungi separatore tra fogli (ma non dopo l'ultimo)
                if (pageIndex < pages.length - 1) {
                    fullHtml += `
        <div class="sheet-separator"></div>`;
                }
            });
            
            fullHtml += `
    </div>
</body>
</html>`;
        }
        
        const finalHtml = fullHtml;

        /** END - RIFATTORIZZARE PORTANDO SU FUNZIONE DEDICATA */

        if (options.browser) {
            const htmlPath = path.resolve(options.browser);
            await fs.writeFile(htmlPath, finalHtml);
            console.log(`✅ File HTML generato con successo: ${htmlPath}`);
        }

        if (options.output) {
            const pdfPath = path.resolve(options.output);
            const browser = await puppeteer.launch({ 
                headless: true, 
                args: ['--no-sandbox'] 
            });
            const page = await browser.newPage();
            await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
            
            // Configurazione stampa con margini zero
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                landscape: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }
            });
            
            await browser.close();
            console.log(`✅ File PDF generato con successo: ${pdfPath}`);
            console.log(`📄 Fogli generati: ${pages.length} (${pages.length * 2} pagine totali)`);
            console.log(`🎴 Carte totali: ${data.carte.length}`);
        }
    } catch (error) {
        console.error('❌ Si è verificato un errore:', error.message);
        process.exit(1);
    }
}

// Controlla se lo script è stato eseguito direttamente
if (process.argv[1] && (process.argv[1].endsWith('kpi-card-generator.js') || process.argv[1].endsWith('kpi-card-generator'))) {
    run();
}
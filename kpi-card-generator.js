#!/usr/bin/env node

import { Command } from 'commander';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Calcola la disposizione delle carte per la stampa fronte-retro con paginazione.
 * Gestisce la divisione in fogli da 8 carte (2x4) con ordinamento speculare corretto.
 * 
 * @param {Array<Object>} cards - L'array di oggetti carta.
 * @param {number} cardsPerPage - Il numero di carte per pagina (default 8).
 * @param {number} cardsPerRow - Il numero di carte per riga (default 4).
 * @returns {Array<{fronts: Array, backs: Array}>} Array di pagine con fronti e retri ordinati.
 */
export function calculatePaginatedLayouts(cards, cardsPerPage = 8, cardsPerRow = 4) {
    const pages = [];
    const totalCards = cards.length;
    const totalPages = Math.ceil(totalCards / cardsPerPage);
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIdx = pageIndex * cardsPerPage;
        const endIdx = Math.min(startIdx + cardsPerPage, totalCards);
        const pageCards = cards.slice(startIdx, endIdx);
        
        // Aggiungi placeholder se necessario per completare la pagina
        const pageFronts = [...pageCards];
        while (pageFronts.length < cardsPerPage) {
            pageFronts.push({ isPlaceholder: true });
        }
        
        // Crea il retro con ordinamento speculare per righe
        const pageBacks = createMirroredBacks(pageFronts, cardsPerRow);
        
        pages.push({
            fronts: pageFronts,
            backs: pageBacks
        });
    }
    
    return pages;
}

/**
 * Crea l'ordinamento speculare del retro per una pagina.
 * Inverte sia l'ordine delle carte in ogni riga che l'ordine delle righe stesse
 * per l'allineamento perfetto fronte-retro quando si capovolge sul lato lungo.
 * 
 * @param {Array<Object>} fronts - Array delle carte del fronte.
 * @param {number} cardsPerRow - Numero di carte per riga.
 * @returns {Array<Object>} Array delle carte del retro ordinate specularmente.
 */
function createMirroredBacks(fronts, cardsPerRow) {
    const backs = [];
    const rows = Math.ceil(fronts.length / cardsPerRow);
    const allRows = [];
    
    // Prima, dividi le carte in righe
    for (let row = 0; row < rows; row++) {
        const startIdx = row * cardsPerRow;
        const endIdx = Math.min(startIdx + cardsPerRow, fronts.length);
        const rowCards = fronts.slice(startIdx, endIdx);
        
        // Aggiungi placeholder se la riga non è completa
        while (rowCards.length < cardsPerRow) {
            rowCards.push({ isPlaceholder: true });
        }
        
        allRows.push(rowCards);
    }
    
    // Poi, inverti l'ordine delle righe E l'ordine delle carte in ogni riga
    for (let i = allRows.length - 1; i >= 0; i--) {
        const reversedRow = allRows[i].reverse();
        backs.push(...reversedRow);
    }
    
    return backs;
}

/**
 * Funzione di compatibilità per i test esistenti.
 * Mantiene la stessa interfaccia della vecchia funzione ma usa la nuova logica.
 */
export function calculateLayouts(cards, cardsPerRow = 4) {
    const pages = calculatePaginatedLayouts(cards, 8, cardsPerRow);
    
    // Combina tutte le pagine in un unico array (per compatibilità)
    let allFronts = [];
    let allBacks = [];
    
    pages.forEach(page => {
        // Aggiungi i fronti (rimuovi placeholder finali non necessari)
        let pageFronts = [...page.fronts];
        if (allFronts.length === 0) {
            // Prima pagina: rimuovi placeholder finali
            while (pageFronts.length > 0 && pageFronts[pageFronts.length - 1].isPlaceholder) {
                pageFronts.pop();
            }
        }
        allFronts.push(...pageFronts.filter(c => !c.isPlaceholder));
        
        // Aggiungi tutti i retri (inclusi placeholder per mantenere layout)
        allBacks.push(...page.backs);
    });
    
    return {
        fronts: allFronts,
        backs: allBacks
    };
}

/**
 * Genera l'HTML per una singola pagina di carte.
 */
function generatePageHtml(page, data, frontTemplate, backTemplate, pageNumber, isLastPage) {
    let pageHtml = '';
    
    // Genera il fronte
    pageHtml += `<div class="print-page fronts-container page-${pageNumber}-front">`;
    pageHtml += '<div class="card-grid">';
    
    page.fronts.forEach(card => {
        if (card.isPlaceholder) {
            pageHtml += '<div class="playing-card placeholder"></div>';
        } else {
            let front = frontTemplate;
            front = front.replace(/{{titolo}}/g, card.titolo || '');
            front = front.replace(/{{icona}}/g, card.icona || '');
            front = front.replace(/{{emoji}}/g, card.emoji || '');
            front = front.replace(/{{tipo}}/g, card.tipo || '');
            front = front.replace(/{{testo}}/g, card.testo || '');
            front = front.replace(/{{flavor}}/g, card.flavor || '');
            front = front.replace(/{{classe}}/g, card.classe || '');
            pageHtml += front;
        }
    });
    
    pageHtml += '</div></div>';
    
    // Genera il retro su una pagina separata
    pageHtml += `<div class="print-page backs-container page-${pageNumber}-back">`;
    pageHtml += '<div class="card-grid">';
    
    page.backs.forEach(card => {
        if (card.isPlaceholder) {
            pageHtml += '<div class="playing-card placeholder"></div>';
        } else {
            let back = backTemplate;
            back = back.replace(/{{icona_esercizio}}/g, data.icona_esercizio || '❓');
            back = back.replace(/{{classe}}/g, card.classe || '');
            pageHtml += back;
        }
    });
    
    pageHtml += '</div></div>';
    
    return pageHtml;
}

// Funzione principale per eseguire lo script da riga di comando
async function run() {
    const program = new Command();
    program
      .version('2.0.0')
      .description('Generatore di carte da gioco per workshop KPI con paginazione corretta')
      .requiredOption('-i, --input <file>', 'File di input JSON con i dati delle carte')
      .option('-o, --output <file>', 'Genera il PDF delle carte nel file specificato')
      .option('-b, --browser <file>', 'Genera il file HTML delle carte per la visualizzazione nel browser')
      .option('-t, --template <file>', 'Percorso del file template per le singole carte', 'assets/card-template.html');
    program.helpOption('-h, --help', 'Mostra questo messaggio di aiuto');
    program.parse(process.argv);
    const options = program.opts();

    if (!options.output && !options.browser) {
      console.error('Errore: Devi specificare almeno un formato di output (-o per PDF o -b per HTML). Usa -h per aiuto.');
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

        // Calcola il layout paginato
        const pages = calculatePaginatedLayouts(data.carte);

        // Se ci sono più pagine, dobbiamo creare container separati per ogni foglio
        let fullHtml = '';
        
        if (pages.length === 1) {
            // Caso semplice: solo un foglio, usa il template standard
            let allFrontsHtml = '';
            let allBacksHtml = '';
            
            const page = pages[0];
            
            // Genera HTML per i fronti
            page.fronts.forEach(card => {
                if (card.isPlaceholder) {
                    allFrontsHtml += '<div class="playing-card placeholder"></div>';
                } else {
                    let front = frontTemplate;
                    front = front.replace(/{{titolo}}/g, card.titolo || '');
                    front = front.replace(/{{icona}}/g, card.icona || '');
                    front = front.replace(/{{emoji}}/g, card.emoji || '');
                    front = front.replace(/{{tipo}}/g, card.tipo || '');
                    front = front.replace(/{{testo}}/g, card.testo || '');
                    front = front.replace(/{{flavor}}/g, card.flavor || '');
                    front = front.replace(/{{classe}}/g, card.classe || '');
                    allFrontsHtml += front;
                }
            });
            
            // Genera HTML per i retri
            page.backs.forEach(card => {
                if (card.isPlaceholder) {
                    allBacksHtml += '<div class="playing-card placeholder"></div>';
                } else {
                    let back = backTemplate;
                    back = back.replace(/{{icona_esercizio}}/g, data.icona_esercizio || '❓');
                    back = back.replace(/{{classe}}/g, card.classe || '');
                    allBacksHtml += back;
                }
            });
            
            // Carica il template principale dai file assets
            const mainTemplatePath = path.resolve('assets/main-template.html');
            fullHtml = await fs.readFile(mainTemplatePath, 'utf-8');
            
            // Sostituisci i placeholder nel template
            fullHtml = fullHtml.replace(/{{TITOLO_ESERCIZIO}}/g, data.titolo || '');
            fullHtml = fullHtml.replace(/{{SOTTOTITOLO_ESERCIZIO}}/g, data.sottotitolo || '');
            fullHtml = fullHtml.replace(/{{FRONTE_CARTE}}/g, allFrontsHtml);
            fullHtml = fullHtml.replace(/{{RETRO_CARTE}}/g, allBacksHtml);
            
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
    }
</style>
</head>
<body>
    <div class="page-container">
        <div class="text-center mb-12 no-print">
            <h1 class="text-4xl font-bold text-gray-800">${data.titolo || ''}</h1>
            <p class="mt-4 text-lg text-gray-600">${data.sottotitolo || ''}</p>
        </div>`;
            
            // Genera HTML per ogni foglio
            pages.forEach((page, pageIndex) => {
                let pageFrontsHtml = '';
                let pageBacksHtml = '';
                
                // Genera fronti per questa pagina
                page.fronts.forEach(card => {
                    if (card.isPlaceholder) {
                        pageFrontsHtml += '<div class="playing-card placeholder"></div>';
                    } else {
                        let front = frontTemplate;
                        front = front.replace(/{{titolo}}/g, card.titolo || '');
                        front = front.replace(/{{icona}}/g, card.icona || '');
                        front = front.replace(/{{emoji}}/g, card.emoji || '');
                        front = front.replace(/{{tipo}}/g, card.tipo || '');
                        front = front.replace(/{{testo}}/g, card.testo || '');
                        front = front.replace(/{{flavor}}/g, card.flavor || '');
                        front = front.replace(/{{classe}}/g, card.classe || '');
                        pageFrontsHtml += front;
                    }
                });
                
                // Genera retri per questa pagina
                page.backs.forEach(card => {
                    if (card.isPlaceholder) {
                        pageBacksHtml += '<div class="playing-card placeholder"></div>';
                    } else {
                        let back = backTemplate;
                        back = back.replace(/{{icona_esercizio}}/g, data.icona_esercizio || '❓');
                        back = back.replace(/{{classe}}/g, card.classe || '');
                        pageBacksHtml += back;
                    }
                });
                
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
        console.error('Si è verificato un errore:', error.message);
        process.exit(1);
    }
}

// Controlla se lo script è stato eseguito direttamente
if (process.argv[1] && (process.argv[1].endsWith('kpi-card-generator.js') || process.argv[1].endsWith('kpi-card-generator'))) {
    run();
}
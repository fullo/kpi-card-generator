#!/usr/bin/env node

import { Command } from 'commander';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { LayoutCalculator } from './modules/cards/rendering/LayoutCalculator.js';
import { CardPaginator } from './modules/cards/pagination/CardPaginator.js';
import { CardRenderer } from './modules/cards/rendering/CardRenderer.js';
import { DeckValidator } from './modules/cards/validation/DeckValidator.js';
import { PDFGenerator } from './modules/export/pdf/PDFGenerator.js';
import { CLIInterface } from './modules/interfaces/cli/CLIInterface.js';

/**
 * Calcola la disposizione delle carte per la stampa fronte-retro con paginazione.
 * @deprecated Usa direttamente CardPaginator.createPaginatedLayouts per maggiore flessibilità
 * @param {Array<Object>} cards - L'array di oggetti carta.
 * @param {number} cardsPerPage - Il numero di carte per pagina (default 8).
 * @param {number} cardsPerRow - Il numero di carte per riga (default 4).
 * @param {string} flipMode - La modalità di stampa: 'short' o 'long'.
 * @returns {Array<{fronts: Array, backs: Array}>} Array di pagine con fronti e retri ordinati.
 */
export function calculatePaginatedLayouts(cards, cardsPerPage = 8, cardsPerRow = 4, flipMode = 'short') {
    // Solo warn se non siamo in ambiente di test
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
        console.warn('calculatePaginatedLayouts è deprecata, usa CardPaginator.createPaginatedLayouts');
    }
    return CardPaginator.createPaginatedLayouts(
        cards, 
        cardsPerPage, 
        cardsPerRow, 
        flipMode, 
        (fronts, cardsPerRow, printMode) => LayoutCalculator.calculateMirrorLayout(fronts, cardsPerRow, printMode)
    );
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
        html = html.replace(/{{icona_retro}}/g, data.icona_retro || data.icona_esercizio || '❓');
        html = html.replace(/{{copyright}}/g, data.copyright || 'Daruma Consulting di Francesco Fullone - CC BY-SA-NC');
        html = html.replace(/{{classe}}/g, card.classe || '');
    }
    
    return html;
}

/**
 * Genera l'HTML per tutti i fogli (front/back containers).
 * @param {Array} pages - Array di pagine.
 * @param {string} frontTemplate - Template per il fronte.
 * @param {string} backTemplate - Template per il retro.
 * @param {Object} data - Dati generali dell'esercizio.
 * @returns {string} La stringa HTML contenente tutti i fogli.
 */
function generateSheetsHtml(pages, frontTemplate, backTemplate, data) {
    return pages.map((page, pageIndex) => {
        const pageFrontsHtml = page.fronts
            .map(card => generateCardHtml(card, frontTemplate, data, true))
            .join('');

        const pageBacksHtml = page.backs
            .map(card => generateCardHtml(card, backTemplate, data, false))
            .join('');

        // Per la visualizzazione a schermo, i titoli sono utili
        const frontTitle = pages.length > 1 ? `Fronte Carte - Foglio ${pageIndex + 1}` : 'Fronte Carte';
        const backTitle = pages.length > 1 ? `Retro Carte - Foglio ${pageIndex + 1}` : 'Retro Carte';

        return `
        <!-- FOGLIO ${pageIndex + 1} di ${pages.length} -->
        <div class="fronts-container">
            <h2 class="section-title">${frontTitle}</h2>
            <div class="card-grid">${pageFrontsHtml}</div>
        </div>
        <div class="backs-container">
            <h2 class="section-title">${backTitle}</h2>
            <div class="card-grid">${pageBacksHtml}</div>
        </div>`;
    }).join(pages.length > 1 ? '<div class="sheet-separator"></div>' : '');
}

/**
 * Genera l'HTML completo per tutte le pagine, gestendo sia il caso di foglio singolo che multiplo.
 * @param {Array} pages - Array di pagine con fronti e retri.
 * @param {Object} data - Dati dell'esercizio (titolo, sottotitolo, etc.).
 * @param {string} frontTemplate - Template HTML per il fronte di una carta.
 * @param {string} backTemplate - Template HTML per il retro di una carta.
 * @param {string} flipMode - Modalità di stampa ('short' o 'long').
 * @returns {Promise<string>} Una promise che si risolve con la stringa HTML completa.
 */
async function generateCompleteHtml(pages, data, frontTemplate, backTemplate, flipMode) {
    if (pages.length > 1) {
        console.log(`📄 Generazione di ${pages.length} fogli per ${data.carte.length} carte...`);
    }

    // Carica il template principale che farà da contenitore
    const mainTemplatePath = path.resolve('assets/main-template.html');
    let fullHtml = await fs.readFile(mainTemplatePath, 'utf-8');

    // Genera l'HTML per tutti i fogli (sia uno che molti)
    const allSheetsHtml = generateSheetsHtml(pages, frontTemplate, backTemplate, data);

    // Aggiungi gli stili specifici per la modalità di stampa e la paginazione
    const dynamicStyles = `
    <style>
        /* Stili per l'indicatore della modalità a schermo */
        @media screen {
            .print-mode-info {
                background-color: #fef3c7; border: 2px solid #f59e0b; padding: 1rem;
                margin: 1rem auto; border-radius: 0.5rem; text-align: center; max-width: 600px;
            }
            .print-mode-info strong { color: #d97706; text-transform: uppercase; }
        }

        /* Stili specifici per la stampa */
        @media print {
            .print-mode-info { display: none !important; }
            
            /* Separatore di pagina per la stampa multi-foglio */
            .sheet-separator { page-break-after: always; height: 0; display: block; }
            
            /* La rotazione del retro dipende dalla modalità di flip */
            ${flipMode === 'long' ? 
            `.backs-container .playing-card { transform: rotate(180deg); }` : 
            ''
            }
        }
    </style>
    `;

    // Aggiungi l'indicatore della modalità di stampa per la visualizzazione a schermo
    const modeInfoHTML = `
    <div class="print-mode-info no-print">
        <strong>Modalità stampa: ${flipMode.toUpperCase()}</strong><br>
        Stampa fronte-retro capovolgendo sul lato ${flipMode === 'short' ? 'corto' : 'lungo'}
    </div>`;

    // Sostituisci i placeholder nel template principale
    fullHtml = fullHtml.replace(/{{TITOLO_ESERCIZIO}}/g, data.titolo || '');
    fullHtml = fullHtml.replace(/{{SOTTOTITOLO_ESERCIZIO}}/g, data.sottotitolo || '');

    // Inserisci gli stili dinamici prima della chiusura dell'head
    fullHtml = fullHtml.replace('</head>', `${dynamicStyles}</head>`);

    // Inserisci il banner informativo e i fogli generati nel corpo del documento.
    // Sostituiamo il layout originale (fronti, istruzioni, retro) con quello nuovo e sequenziale.
    // Questa regex è più precisa e sicura, e rende opzionale il div di istruzioni.
    const layoutBlockRegex = /<div class="fronts-container">[\s\S]*?<\/div>(\s*<div class="print-instructions no-print">[\s\S]*?<\/div>)?\s*<div class="backs-container">[\s\S]*?<\/div>/s;
    const finalContent = modeInfoHTML + allSheetsHtml;
    fullHtml = fullHtml.replace(layoutBlockRegex, finalContent);

    return fullHtml;
}

// Funzione principale per eseguire lo script da riga di comando
export async function run() {
    console.warn('⚠️  La funzione run() è deprecata. Usa CLIInterface per le nuove implementazioni.');
    
    // Per compatibilità, creiamo un'istanza del CLI moderno
    const cli = new CLIInterface();
    
    // Converte gli argomenti nel nuovo formato
    const args = process.argv;
    
    // Se non ci sono comandi specifici, assume 'generate' per compatibilità
    if (args.length > 2 && !['generate', 'styles', 'validate', 'optimize', 'info'].includes(args[2])) {
        args.splice(2, 0, 'generate');
    }
    
    await cli.run(args);
}

// Controlla se lo script è stato eseguito direttamente
if (process.argv[1] && (process.argv[1].endsWith('kpi-card-generator.js') || process.argv[1].endsWith('kpi-card-generator'))) {
    run();
}
#!/usr/bin/env node

import { Command } from 'commander';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

const program = new Command();

program
  .version('1.0.0')
  .description('Generatore di carte da gioco per workshop KPI')
  .requiredOption('-i, --input <file>', 'File di input JSON con i dati delle carte')
  .option('-o, --output <file>', 'Genera il PDF delle carte nel file specificato')
  .option('-b, --browser <file>', 'Genera il file HTML delle carte per la visualizzazione nel browser')
  .option('-t, --template <file>', 'Percorso del file template HTML', 'assets/card-template.html');

program.helpOption('-h, --help', 'Mostra questo messaggio di aiuto');

program.parse(process.argv);

const options = program.opts();

if (!options.output && !options.browser) {
  console.error('Errore: Devi specificare almeno un formato di output (-o per PDF o -b per HTML). Usa -h per aiuto.');
  process.exit(1);
}

const mainHtmlTemplate = (titolo, sottotitolo, fronts, backs) => `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>${titolo}</title>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #e5e7eb; }
        .page-container { max-width: 7xl; margin: auto; padding: 2rem; }
        .playing-card { font-family: 'Inter', sans-serif; background: #f3f4f6; border: 1px solid #9ca3af; border-radius: 1rem; width: 300px; height: 420px; padding: 0.75rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); display: flex; flex-direction: column; page-break-inside: avoid; position: relative; }
        .playing-card .inner-frame { border: 3px solid #d1d5db; border-radius: 0.75rem; height: 100%; display: flex; flex-direction: column; padding: 0.75rem; background-color: #ffffff; }
        .card-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb; }
        .card-title { font-family: 'Roboto Slab', serif; font-size: 0.95rem; font-weight: 700; }
        .card-icon-container { width: 32px; height: 32px; border-radius: 9999px; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; }
        .card-image-area { height: 90px; background-color: #e5e7eb; margin-top: 0.75rem; border-radius: 0.5rem; display: flex; justify-content: center; align-items: center; font-size: 4rem; }
        .card-type-banner { margin-top: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: white; align-self: flex-start; }
        .card-description-box { margin-top: 0.5rem; padding: 0.75rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .card-description-box .main-text { font-size: 0.9rem; line-height: 1.4; }
        .card-flavor-text { font-size: 0.75rem; font-style: italic; color: #4b5563; margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px dashed #d1d5db; }
        .card-back { display: flex; flex-direction: column; justify-content: space-between; align-items: center; height: 100%; text-align: center; }
        .card-back .back-icon { font-size: 8rem; margin-top: 4rem; }
        .card-back .back-credit { font-size: 0.6rem; color: #6b7280; align-self: flex-end; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; justify-items: center; }
        .section-title { font-size: 2.25rem; font-weight: 700; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #d1d5db; text-align: center; }
        .section-subtitle { font-size: 1.125rem; color: #4b5563; margin-bottom: 2.5rem; text-align: center; }
        .print-instructions { background-color: #fefce8; border: 2px dashed #facc15; padding: 1.5rem; margin: 3rem 0; text-align: center; font-weight: 600; color: #ca8a04; page-break-after: always; }
        .card-evento-tecnico .card-title, .card-evento-tecnico .card-type-banner { background-color: #3b82f6; color: white; } .card-evento-tecnico .card-icon-container { background-color: #dbeafe; color: #3b82f6; }
        .card-evento-marketing .card-title, .card-evento-marketing .card-type-banner { background-color: #ec4899; color: white; } .card-evento-marketing .card-icon-container { background-color: #fce7f3; color: #ec4899; }
        .card-evento-sales .card-title, .card-evento-sales .card-type-banner { background-color: #14b8a6; color: white; } .card-evento-sales .card-icon-container { background-color: #ccfbf1; color: #14b8a6; }
        .card-evento-aziendale .card-title, .card-evento-aziendale .card-type-banner { background-color: #d97706; color: white; } .card-evento-aziendale .card-icon-container { background-color: #fef3c7; color: #d97706; }
        .card-obiettivo .card-title, .card-obiettivo .card-type-banner { background-color: #10b981; color: white; } .card-obiettivo .card-icon-container { background-color: #d1fae5; color: #10b981; }
        .card-kpi .card-title, .card-kpi .card-type-banner { background-color: #8b5cf6; color: white; } .card-kpi .card-icon-container { background-color: #ede9fe; color: #8b5cf6; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
            .no-print { display: none; }
            .page-container { padding: 0; }
            .playing-card { box-shadow: none; border: 2px dashed #9ca3af; }
            .card-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem; }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="text-center mb-12 no-print">
            <h1 class="text-4xl font-bold text-gray-800">${titolo}</h1>
            <p class="mt-4 text-lg text-gray-600">${sottotitolo}</p>
        </div>
        <h2 class="section-title">Fronte Carte</h2>
        <div class="card-grid">${fronts}</div>
        <div class="print-instructions">ATTENZIONE: Stampa fino a questa pagina, poi reinserisci i fogli per stampare il retro.</div>
        <h2 class="section-title">Retro Carte</h2>
        <div class="card-grid">${backs}</div>
    </div>
</body>
</html>
`;

async function generateCards() {
  try {
    // 1. Leggi i dati JSON
    const jsonPath = path.resolve(options.input);
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);

    // 2. Leggi i template
    const templatePath = path.resolve(options.template);
    const templateHtml = await fs.readFile(templatePath, 'utf-8');
    
    const frontTemplateMatch = templateHtml.match(/<template id="card-front">([\s\S]*?)<\/template>/);
    const backTemplateMatch = templateHtml.match(/<template id="card-back">([\s\S]*?)<\/template>/);

    if (!frontTemplateMatch || !backTemplateMatch) {
      throw new Error(`Template non validi nel file: ${templatePath}. Assicurati che esistano <template id="card-front"> e <template id="card-back">.`);
    }
    const frontTemplate = frontTemplateMatch[1];
    const backTemplate = backTemplateMatch[1];

    let frontsHtml = '';
    let backsHtml = '';

    // 3. Genera HTML per ogni carta
    data.carte.forEach(card => {
      let front = frontTemplate;
      front = front.replace(/{{titolo}}/g, card.titolo || '');
      front = front.replace(/{{icona}}/g, card.icona || '');
      front = front.replace(/{{emoji}}/g, card.emoji || '');
      front = front.replace(/{{tipo}}/g, card.tipo || '');
      front = front.replace(/{{testo}}/g, card.testo || '');
      front = front.replace(/{{flavor}}/g, card.flavor || '');
      front = front.replace(/{{classe}}/g, card.classe || '');
      frontsHtml += front;

      let back = backTemplate;
      back = back.replace(/{{icona_esercizio}}/g, data.icona_esercizio || '❓');
      back = back.replace(/{{classe}}/g, card.classe || '');
      backsHtml += back;
    });

    const finalHtml = mainHtmlTemplate(data.titolo, data.sottotitolo, frontsHtml, backsHtml);

    // 4. Salva il file HTML se richiesto
    if (options.browser) {
      const htmlPath = path.resolve(options.browser);
      await fs.writeFile(htmlPath, finalHtml);
      console.log(`✅ File HTML generato con successo: ${htmlPath}`);
    }

    // 5. Salva il file PDF se richiesto
    if (options.output) {
      const pdfPath = path.resolve(options.output);
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      await browser.close();
      console.log(`✅ File PDF generato con successo: ${pdfPath}`);
    }

  } catch (error) {
    console.error('Si è verificato un errore:', error.message);
    process.exit(1);
  }
}

generateCards();

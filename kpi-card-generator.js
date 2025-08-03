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
  .option('-t, --template <file>', 'Percorso del file template per le singole carte', 'assets/card-template.html');

program.helpOption('-h, --help', 'Mostra questo messaggio di aiuto');

program.parse(process.argv);

const options = program.opts();

if (!options.output && !options.browser) {
  console.error('Errore: Devi specificare almeno un formato di output (-o per PDF o -b per HTML). Usa -h per aiuto.');
  process.exit(1);
}

async function generateCards() {
  try {
    // 1. Leggi i dati JSON
    const jsonPath = path.resolve(options.input);
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);

    // 2. Leggi i template delle singole carte
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

    // 4. Leggi il template della pagina principale e popola i dati
    const mainTemplatePath = path.resolve('assets/main-template.html');
    let finalHtml = await fs.readFile(mainTemplatePath, 'utf-8');
    
    finalHtml = finalHtml.replace('{{TITOLO_ESERCIZIO}}', data.titolo);
    finalHtml = finalHtml.replace('{{SOTTOTITOLO_ESERCIZIO}}', data.sottotitolo);
    finalHtml = finalHtml.replace('{{FRONTE_CARTE}}', frontsHtml);
    finalHtml = finalHtml.replace('{{RETRO_CARTE}}', backsHtml);


    // 5. Salva il file HTML se richiesto
    if (options.browser) {
      const htmlPath = path.resolve(options.browser);
      await fs.writeFile(htmlPath, finalHtml);
      console.log(`✅ File HTML generato con successo: ${htmlPath}`);
    }

    // 6. Salva il file PDF se richiesto
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

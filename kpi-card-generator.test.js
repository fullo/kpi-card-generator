import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateCardHtml } from './kpi-card-generator.js';

// Mock 'fs' using the unstable_mockModule API, which is designed for ES Modules
jest.unstable_mockModule('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Dynamically import the mocked module *after* the mock has been defined
const { promises: fs } = await import('fs');


// Funzione helper per creare dati JSON di test con un numero specifico di carte
const createMockData = (cardCount) => {
  const mockData = {
    titolo: `Test con ${cardCount} carte`,
    sottotitolo: 'Test di layout',
    icona_esercizio: '🧪',
    carte: [],
  };
  for (let i = 1; i <= cardCount; i++) {
    mockData.carte.push({
      titolo: `Carta ${i}`,
      icona: 'C',
      emoji: `${i}`,
      tipo: 'Test',
      testo: `Testo della carta ${i}`,
      flavor: `Flavor ${i}`,
      classe: 'card-test',
    });
  }
  return mockData;
};

// Mock del contenuto dei template HTML
const mockCardTemplate = `
  <template id="card-front">
    <div class="playing-card {{classe}}">
        <div class="card-title">{{titolo}}</div>
    </div>
  </template>
  <template id="card-back">
    <div class="playing-card {{classe}}">
        <div class="back-icon">{{icona_esercizio}}</div>
    </div>
  </template>
`;

const mockMainTemplate = `
  <!DOCTYPE html><html><body>
    <div class="fronts-container"><div class="card-grid">{{FRONTE_CARTE}}</div></div>
    <div class="backs-container"><div class="card-grid">{{RETRO_CARTE}}</div></div>
  </body></html>
`;

describe('generateCardHtml - Layout Speculare per Stampa Fronte-Retro', () => {

  beforeEach(() => {
    // Prima di ogni test, impostiamo il mock per la lettura dei file
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('card-template.html')) {
        return Promise.resolve(mockCardTemplate);
      }
      if (filePath.includes('main-template.html')) {
        return Promise.resolve(mockMainTemplate);
      }
      return Promise.reject(new Error(`File non trovato: ${filePath}`));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getCardOrder = (html, containerClass) => {
    // FIX: La regex è stata resa più robusta per gestire correttamente le div annidate,
    // assicurando che catturi l'intero contenuto del .card-grid.
    const containerRegex = new RegExp(`<div class="${containerClass}">[\\s\\S]*?<div class="card-grid">([\\s\\S]*?)<\\/div>[\\s\\S]*?<\\/div>`);
    const containerMatch = html.match(containerRegex);
    if (!containerMatch) return [];
    
    // Questa regex cattura sia i titoli delle carte ("Carta X") sia i placeholder
    const cardRegex = /<div class="card-title">Carta (\d+)<\/div>|<div class="playing-card placeholder"><\/div>/g;
    let matches;
    const order = [];
    while ((matches = cardRegex.exec(containerMatch[1])) !== null) {
      // Se trova un numero, è una carta. Altrimenti è un placeholder.
      order.push(matches[1] ? `C${matches[1]}` : 'P'); // 'C' per Carta, 'P' per Placeholder
    }
    return order;
  };

  test('dovrebbe generare correttamente il fronte e il retro per 1 carta', async () => {
    const data = createMockData(1);
    const html = await generateCardHtml(data, mockCardTemplate);
    const frontOrder = getCardOrder(html, 'fronts-container');
    const backOrder = getCardOrder(html, 'backs-container');
    
    expect(frontOrder).toEqual(['C1']);
    expect(backOrder).toEqual(['P', 'P', 'P', 'C1']);
  });

  test('dovrebbe generare correttamente il fronte e il retro per 3 carte', async () => {
    const data = createMockData(3);
    const html = await generateCardHtml(data, mockCardTemplate);
    const frontOrder = getCardOrder(html, 'fronts-container');
    const backOrder = getCardOrder(html, 'backs-container');

    expect(frontOrder).toEqual(['C1', 'C2', 'C3']);
    expect(backOrder).toEqual(['P', 'C3', 'C2', 'C1']);
  });

  test('dovrebbe generare correttamente il fronte e il retro per 5 carte', async () => {
    const data = createMockData(5);
    const html = await generateCardHtml(data, mockCardTemplate);
    const frontOrder = getCardOrder(html, 'fronts-container');
    const backOrder = getCardOrder(html, 'backs-container');

    expect(frontOrder).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
    expect(backOrder).toEqual(['P', 'P', 'P', 'C5', 'C4', 'C3', 'C2', 'C1']);
  });

  test('dovrebbe generare correttamente il fronte e il retro per 7 carte', async () => {
    const data = createMockData(7);
    const html = await generateCardHtml(data, mockCardTemplate);
    const frontOrder = getCardOrder(html, 'fronts-container');
    const backOrder = getCardOrder(html, 'backs-container');

    expect(frontOrder).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']);
    expect(backOrder).toEqual(['P', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1']);
  });

  test('dovrebbe generare correttamente il fronte e il retro per 9 carte', async () => {
    const data = createMockData(9);
    const html = await generateCardHtml(data, mockCardTemplate);
    const frontOrder = getCardOrder(html, 'fronts-container');
    const backOrder = getCardOrder(html, 'backs-container');

    expect(frontOrder).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9']);
    expect(backOrder).toEqual(['P', 'P', 'P', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1']);
  });
});

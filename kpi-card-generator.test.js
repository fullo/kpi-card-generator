import { jest, describe, test, expect } from '@jest/globals';
import { calculateLayouts, calculatePaginatedLayouts } from './kpi-card-generator.js';

// Funzione helper per creare dati di test con un numero specifico di carte
const createMockCards = (cardCount) => {
  const cards = [];
  for (let i = 1; i <= cardCount; i++) {
    cards.push({ id: `C${i}` });
  }
  return cards;
};

// Funzione helper per estrarre solo gli ID o i placeholder per il confronto
const getLayoutIds = (layout) => {
    return layout.map(card => card.isPlaceholder ? 'P' : card.id);
}

describe('calculatePaginatedLayouts - Test Paginazione e Ordinamento Speculare', () => {
  
  test('dovrebbe generare correttamente il layout per 8 carte (1 foglio completo)', () => {
    const cards = createMockCards(8);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(1);
    
    const page1 = pages[0];
    
    // Fronte del foglio 1: C1-C8 in ordine normale
    expect(getLayoutIds(page1.fronts)).toEqual([
      'C1', 'C2', 'C3', 'C4',
      'C5', 'C6', 'C7', 'C8'
    ]);
    
    // Retro del foglio 1: ordinamento speculare per righe
    expect(getLayoutIds(page1.backs)).toEqual([
      'C4', 'C3', 'C2', 'C1',  // Prima riga invertita
      'C8', 'C7', 'C6', 'C5'   // Seconda riga invertita
    ]);
  });

  test('dovrebbe generare correttamente il layout per 9 carte (2 fogli)', () => {
    const cards = createMockCards(9);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(2);
    
    // FOGLIO 1
    const page1 = pages[0];
    expect(getLayoutIds(page1.fronts)).toEqual([
      'C1', 'C2', 'C3', 'C4',
      'C5', 'C6', 'C7', 'C8'
    ]);
    expect(getLayoutIds(page1.backs)).toEqual([
      'C4', 'C3', 'C2', 'C1',
      'C8', 'C7', 'C6', 'C5'
    ]);
    
    // FOGLIO 2
    const page2 = pages[1];
    expect(getLayoutIds(page2.fronts)).toEqual([
      'C9', 'P', 'P', 'P',
      'P', 'P', 'P', 'P'
    ]);
    expect(getLayoutIds(page2.backs)).toEqual([
      'P', 'P', 'P', 'C9',  // Prima riga con C9 speculare
      'P', 'P', 'P', 'P'    // Seconda riga vuota
    ]);
  });

  test('dovrebbe generare correttamente il layout per 5 carte', () => {
    const cards = createMockCards(5);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(1);
    
    const page1 = pages[0];
    expect(getLayoutIds(page1.fronts)).toEqual([
      'C1', 'C2', 'C3', 'C4',
      'C5', 'P', 'P', 'P'
    ]);
    expect(getLayoutIds(page1.backs)).toEqual([
      'C4', 'C3', 'C2', 'C1',
      'P', 'P', 'P', 'C5'  // C5 va a destra nella seconda riga
    ]);
  });

  test('dovrebbe generare correttamente il layout per 16 carte (2 fogli completi)', () => {
    const cards = createMockCards(16);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(2);
    
    // Entrambi i fogli dovrebbero essere completi
    pages.forEach((page, pageIdx) => {
      const offset = pageIdx * 8;
      
      // Verifica che non ci siano placeholder
      expect(page.fronts.every(card => !card.isPlaceholder)).toBe(true);
      expect(page.backs.every(card => !card.isPlaceholder)).toBe(true);
      
      // Verifica l'ordinamento speculare
      const expectedFronts = [];
      const expectedBacks = [];
      
      for (let i = 1; i <= 8; i++) {
        expectedFronts.push(`C${offset + i}`);
      }
      
      // Retro speculare per righe
      expectedBacks.push(
        `C${offset + 4}`, `C${offset + 3}`, `C${offset + 2}`, `C${offset + 1}`,
        `C${offset + 8}`, `C${offset + 7}`, `C${offset + 6}`, `C${offset + 5}`
      );
      
      expect(getLayoutIds(page.fronts)).toEqual(expectedFronts);
      expect(getLayoutIds(page.backs)).toEqual(expectedBacks);
    });
  });

  test('dovrebbe generare correttamente il layout per 17 carte (3 fogli)', () => {
    const cards = createMockCards(17);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(3);
    
    // Terzo foglio con solo 1 carta
    const page3 = pages[2];
    expect(getLayoutIds(page3.fronts)).toEqual([
      'C17', 'P', 'P', 'P',
      'P', 'P', 'P', 'P'
    ]);
    expect(getLayoutIds(page3.backs)).toEqual([
      'P', 'P', 'P', 'C17',
      'P', 'P', 'P', 'P'
    ]);
  });
});

describe('calculateLayouts - Test di Compatibilità', () => {
  
  test('dovrebbe mantenere la compatibilità con la vecchia interfaccia per 9 carte', () => {
    const cards = createMockCards(9);
    const { fronts, backs } = calculateLayouts(cards);
    
    // I fronti dovrebbero essere solo le carte effettive
    expect(getLayoutIds(fronts)).toEqual([
      'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'
    ]);
    
    // I retri dovrebbero includere tutti i placeholder e le carte ordinate
    expect(backs.length).toBe(16); // 2 fogli * 8 posizioni
  });
});

describe('Verifica Layout di Stampa', () => {
  
  test('layout di stampa per 9 carte dovrebbe corrispondere alle specifiche', () => {
    const cards = createMockCards(9);
    const pages = calculatePaginatedLayouts(cards);
    
    // Costruisci la rappresentazione visuale del layout
    const buildGrid = (cards) => {
      const grid = [];
      for (let i = 0; i < cards.length; i += 4) {
        const row = cards.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : c.id.replace('C', 'D'));
        grid.push(row);
      }
      return grid;
    };
    
    // FOGLIO 1
    const page1FrontGrid = [
      ['C1', 'C2', 'C3', 'C4'],
      ['C5', 'C6', 'C7', 'C8']
    ];
    
    const page1BackGrid = [
      ['D4', 'D3', 'D2', 'D1'],
      ['D8', 'D7', 'D6', 'D5']
    ];
    
    // FOGLIO 2
    const page2FrontGrid = [
      ['C9', 'P', 'P', 'P'],
      ['P', 'P', 'P', 'P']
    ];
    
    const page2BackGrid = [
      ['P', 'P', 'P', 'D9'],
      ['P', 'P', 'P', 'P']
    ];
    
    // Verifica foglio 1
    const actualPage1Front = [];
    for (let i = 0; i < pages[0].fronts.length; i += 4) {
      actualPage1Front.push(pages[0].fronts.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : c.id));
    }
    expect(actualPage1Front).toEqual(page1FrontGrid);
    
    const actualPage1Back = [];
    for (let i = 0; i < pages[0].backs.length; i += 4) {
      actualPage1Back.push(pages[0].backs.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : 'D' + c.id.substring(1)));
    }
    expect(actualPage1Back).toEqual(page1BackGrid);
    
    // Verifica foglio 2
    const actualPage2Front = [];
    for (let i = 0; i < pages[1].fronts.length; i += 4) {
      actualPage2Front.push(pages[1].fronts.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : c.id));
    }
    expect(actualPage2Front).toEqual(page2FrontGrid);
    
    const actualPage2Back = [];
    for (let i = 0; i < pages[1].backs.length; i += 4) {
      actualPage2Back.push(pages[1].backs.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : 'D' + c.id.substring(1)));
    }
    expect(actualPage2Back).toEqual(page2BackGrid);
    
    // Log per debug visuale
    console.log('\n=== LAYOUT DI STAMPA PER 9 CARTE ===');
    console.log('\nFOGLIO 1 FRONTE:');
    console.table(page1FrontGrid);
    console.log('\nFOGLIO 1 RETRO:');
    console.table(page1BackGrid);
    console.log('\nFOGLIO 2 FRONTE:');
    console.table(page2FrontGrid);
    console.log('\nFOGLIO 2 RETRO:');
    console.table(page2BackGrid);
  });
});

import { jest, describe, test, expect } from '@jest/globals';
import { calculateLayouts, calculatePaginatedLayouts } from '../kpi-card-generator.js';

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

describe('calculatePaginatedLayouts - Test Corretti per Landscape (default)', () => {
  
  test('dovrebbe gestire 0 carte', () => {
    const cards = createMockCards(0);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(0);
  });
  
  test('dovrebbe generare correttamente il layout per 1 carta', () => {
    const cards = createMockCards(1);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(1);
    const page = pages[0];
    
    // Fronte: C1 in prima posizione
    expect(getLayoutIds(page.fronts)).toEqual([
      'C1', 'P', 'P', 'P',
      'P', 'P', 'P', 'P'
    ]);
    
    // Retro landscape: solo colonne invertite per riga
    expect(getLayoutIds(page.backs)).toEqual([
      'P', 'P', 'P', 'C1',  // Prima riga con C1 all'ultimo posto
      'P', 'P', 'P', 'P'   // Seconda riga vuota
    ]);
  });
  
  test('dovrebbe generare correttamente il layout per 2 carte', () => {
    const cards = createMockCards(2);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(1);
    const page = pages[0];
    
    // Fronte
    expect(getLayoutIds(page.fronts)).toEqual([
      'C1', 'C2', 'P', 'P',
      'P', 'P', 'P', 'P'
    ]);
    
    // Retro landscape: mantieni ordine righe, inverti colonne
    expect(getLayoutIds(page.backs)).toEqual([
      'P', 'P', 'C2', 'C1',  // Prima riga invertita
      'P', 'P', 'P', 'P'     // Seconda riga vuota
    ]);
  });
  
  test('dovrebbe generare correttamente il layout per 8 carte (foglio completo)', () => {
    const cards = createMockCards(8);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(1);
    const page = pages[0];
    
    // Fronte
    expect(getLayoutIds(page.fronts)).toEqual([
      'C1', 'C2', 'C3', 'C4',
      'C5', 'C6', 'C7', 'C8'
    ]);
    
    // Retro landscape: CORRETTO - mantieni ordine righe, inverti solo colonne
    expect(getLayoutIds(page.backs)).toEqual([
      'C4', 'C3', 'C2', 'C1',  // Prima riga resta prima (colonne invertite)
      'C8', 'C7', 'C6', 'C5'   // Seconda riga resta seconda (colonne invertite)
    ]);
  });
  
  test('dovrebbe generare correttamente il layout per 10 carte (2 fogli)', () => {
    const cards = createMockCards(10);
    const pages = calculatePaginatedLayouts(cards);
    
    expect(pages.length).toBe(2);
    
    // FOGLIO 1 - 8 carte complete
    const page1 = pages[0];
    expect(getLayoutIds(page1.fronts)).toEqual([
      'C1', 'C2', 'C3', 'C4',
      'C5', 'C6', 'C7', 'C8'
    ]);
    expect(getLayoutIds(page1.backs)).toEqual([
      'C4', 'C3', 'C2', 'C1',  // Prima riga (colonne invertite)
      'C8', 'C7', 'C6', 'C5'   // Seconda riga (colonne invertite)
    ]);
    
    // FOGLIO 2 - Solo 2 carte
    const page2 = pages[1];
    expect(getLayoutIds(page2.fronts)).toEqual([
      'C9', 'C10', 'P', 'P',
      'P', 'P', 'P', 'P'
    ]);
    expect(getLayoutIds(page2.backs)).toEqual([
      'P', 'P', 'C10', 'C9',  // Prima riga (colonne invertite)
      'P', 'P', 'P', 'P'      // Seconda riga vuota
    ]);
  });
});

describe('calculatePaginatedLayouts - Test Modalità Portrait', () => {
  
  test('modalità PORTRAIT: dovrebbe invertire righe e colonne per 1 carta', () => {
    const cards = createMockCards(1);
    const pages = calculatePaginatedLayouts(cards, 8, 4, 'portrait');
    
    const page = pages[0];
    
    // Portrait: inverte ordine righe E colonne
    expect(getLayoutIds(page.backs)).toEqual([
      'P', 'P', 'P', 'P',    // Seconda riga (vuota) va prima
      'C1', 'P', 'P', 'P'    // Prima riga va dopo (con colonne invertite)
    ]);
  });
  
  test('modalità PORTRAIT: dovrebbe invertire righe e colonne per 2 carte', () => {
    const cards = createMockCards(2);
    const pages = calculatePaginatedLayouts(cards, 8, 4, 'portrait');
    
    const page = pages[0];
    
    // Portrait: inverte ordine righe E colonne
    expect(getLayoutIds(page.backs)).toEqual([
      'P', 'P', 'P', 'P',    // Seconda riga (vuota) va prima
      'C1', 'C2', 'P', 'P'   // Prima riga va dopo (con colonne invertite)
    ]);
  });
  
  test('modalità PORTRAIT: dovrebbe invertire righe e colonne per 8 carte', () => {
    const cards = createMockCards(8);
    const pages = calculatePaginatedLayouts(cards, 8, 4, 'portrait');
    
    const page = pages[0];
    
    // Portrait: inverte ordine righe E colonne
    expect(getLayoutIds(page.backs)).toEqual([
      'C5', 'C6', 'C7', 'C8',  // Seconda riga va prima (colonne invertite)
      'C1', 'C2', 'C3', 'C4'   // Prima riga va dopo (colonne invertite)
    ]);
  });
  
  test('modalità PORTRAIT: dovrebbe invertire righe e colonne per 10 carte', () => {
    const cards = createMockCards(10);
    const pages = calculatePaginatedLayouts(cards, 8, 4, 'portrait');
    
    // FOGLIO 2 con modalità portrait
    const page2 = pages[1];
    
    expect(getLayoutIds(page2.backs)).toEqual([
      'P', 'P', 'P', 'P',      // Seconda riga (vuota) va prima
      'C9', 'C10', 'P', 'P'    // Prima riga va dopo (colonne invertite)
    ]);
  });
});

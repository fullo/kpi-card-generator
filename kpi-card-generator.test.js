import { jest, describe, test, expect } from '@jest/globals';
import { calculateLayouts } from './kpi-card-generator.js';

// Funzione helper per creare dati di test con un numero specifico di carte
// Restituisce solo un array di identificatori semplici per il test
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

describe('calculateLayouts - Logica per Stampa Speculare', () => {

  test('dovrebbe generare correttamente il layout per 1 carta', () => {
    const cards = createMockCards(1);
    const { fronts, backs } = calculateLayouts(cards);
    
    expect(getLayoutIds(fronts)).toEqual(['C1']);
    expect(getLayoutIds(backs)).toEqual(['P', 'P', 'P', 'C1']);
  });

  test('dovrebbe generare correttamente il layout per 3 carte', () => {
    const cards = createMockCards(3);
    const { fronts, backs } = calculateLayouts(cards);

    expect(getLayoutIds(fronts)).toEqual(['C1', 'C2', 'C3']);
    expect(getLayoutIds(backs)).toEqual(['P', 'C3', 'C2', 'C1']);
  });

  test('dovrebbe generare correttamente il layout per 5 carte', () => {
    const cards = createMockCards(5);
    const { fronts, backs } = calculateLayouts(cards);

    expect(getLayoutIds(fronts)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
    expect(getLayoutIds(backs)).toEqual(['P', 'P', 'P', 'C5', 'C4', 'C3', 'C2', 'C1']);
  });

  test('dovrebbe generare correttamente il layout per 7 carte', () => {
    const cards = createMockCards(7);
    const { fronts, backs } = calculateLayouts(cards);

    expect(getLayoutIds(fronts)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']);
    expect(getLayoutIds(backs)).toEqual(['P', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1']);
  });

  test('dovrebbe generare correttamente il layout per 9 carte', async () => {
    const cards = createMockCards(9);
    const { fronts, backs } = calculateLayouts(cards);

    expect(getLayoutIds(fronts)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9']);
    expect(getLayoutIds(backs)).toEqual(['P', 'P', 'P', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1']);
  });

  test('dovrebbe gestire un mazzo completo di 8 carte senza placeholder nel retro', () => {
    const cards = createMockCards(8);
    const { fronts, backs } = calculateLayouts(cards);

    expect(getLayoutIds(fronts)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']);
    expect(getLayoutIds(backs)).toEqual(['C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1']);
  });

});

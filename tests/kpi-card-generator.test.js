import { jest, describe, test, expect } from '@jest/globals';
import { calculatePaginatedLayouts } from '../kpi-card-generator.js';

// Funzione helper per creare dati di test
const createMockCards = (cardCount) => {
    return Array.from({ length: cardCount }, (_, i) => ({ id: `C${i + 1}` }));
};

// Funzione helper per estrarre solo gli ID
const getLayoutIds = (layout) => {
    return layout.map(card => card.isPlaceholder ? 'P' : card.id);
}

describe('calculatePaginatedLayouts - Test per Short-Side (default)', () => {

    test('dovrebbe gestire 0 carte', () => {
        const pages = calculatePaginatedLayouts(createMockCards(0), 8, 4, 'short');
        expect(pages.length).toBe(0);
    });

    test('dovrebbe generare layout per 8 carte (foglio completo)', () => {
        const cards = createMockCards(8);
        const pages = calculatePaginatedLayouts(cards, 8, 4, 'short');
        
        expect(pages.length).toBe(1);
        const page = pages[0];
        
        expect(getLayoutIds(page.fronts)).toEqual([
            'C1', 'C2', 'C3', 'C4',
            'C5', 'C6', 'C7', 'C8'
        ]);
        
        // Short-Side: mantieni ordine righe, inverti colonne
        expect(getLayoutIds(page.backs)).toEqual([
            'C4', 'C3', 'C2', 'C1',  // Prima riga invertita
            'C8', 'C7', 'C6', 'C5'   // Seconda riga invertita
        ]);
    });

    test('dovrebbe generare layout per 10 carte (2 fogli)', () => {
        const cards = createMockCards(10);
        const pages = calculatePaginatedLayouts(cards, 8, 4, 'short');
        
        expect(pages.length).toBe(2);
        
        // Foglio 2
        const page2 = pages[1];
        expect(getLayoutIds(page2.fronts)).toEqual([
            'C9', 'C10', 'P', 'P',
            'P', 'P', 'P', 'P'
        ]);
        expect(getLayoutIds(page2.backs)).toEqual([
            'P', 'P', 'C10', 'C9',  // Prima riga invertita
            'P', 'P', 'P', 'P'      // Seconda riga vuota
        ]);
    });
});

describe('calculatePaginatedLayouts - Casi Limite e Comportamenti di Default', () => {

    test('dovrebbe usare la modalità "short" come default se non specificata', () => {
        const cards = createMockCards(8);
        // Non passiamo il parametro flipMode
        const pages = calculatePaginatedLayouts(cards, 8, 4);
        const expectedShortBacks = [
            'C4', 'C3', 'C2', 'C1',
            'C8', 'C7', 'C6', 'C5'
        ];
        expect(getLayoutIds(pages[0].backs)).toEqual(expectedShortBacks);
    });

    test('dovrebbe ricadere su "short" se la modalità non è valida', () => {
        const cards = createMockCards(8);
        const pages = calculatePaginatedLayouts(cards, 8, 4, 'invalid-mode');
        const expectedShortBacks = [
            'C4', 'C3', 'C2', 'C1',
            'C8', 'C7', 'C6', 'C5'
        ];
        expect(getLayoutIds(pages[0].backs)).toEqual(expectedShortBacks);
    });

    test('dovrebbe gestire 16 carte (2 fogli completi)', () => {
        const cards = createMockCards(16);
        const pages = calculatePaginatedLayouts(cards, 8, 4, 'long');
        
        expect(pages.length).toBe(2);
        
        // Verifica il retro del secondo foglio
        const page2 = pages[1];
        expect(getLayoutIds(page2.fronts)).toEqual([
            'C9', 'C10', 'C11', 'C12',
            'C13', 'C14', 'C15', 'C16'
        ]);
        expect(getLayoutIds(page2.backs)).toEqual([
            'C13', 'C14', 'C15', 'C16', // Seconda riga del fronte
            'C9', 'C10', 'C11', 'C12'  // Prima riga del fronte
        ]);
    });

    test('dovrebbe gestire 1 singola carta', () => {
        const cards = createMockCards(1);
        const pages = calculatePaginatedLayouts(cards, 8, 4, 'short');

        expect(pages.length).toBe(1);
        const page = pages[0];

        expect(getLayoutIds(page.fronts)).toEqual([
            'C1', 'P', 'P', 'P',
            'P', 'P', 'P', 'P'
        ]);

        // Short-Side: inverte la prima riga
        expect(getLayoutIds(page.backs)).toEqual([
            'P', 'P', 'P', 'C1',
            'P', 'P', 'P', 'P'
        ]);
    });
});

describe('calculatePaginatedLayouts - Test Modalità Long-Side', () => {

    test('modalità LONG-SIDE: dovrebbe invertire righe per 8 carte', () => {
        const cards = createMockCards(8);
        const pages = calculatePaginatedLayouts(cards, 8, 4, 'long');
        
        const page = pages[0];
        
        // Long-Side: inverte ordine righe, mantiene ordine colonne
        expect(getLayoutIds(page.backs)).toEqual([
            'C5', 'C6', 'C7', 'C8',  // Seconda riga va prima
            'C1', 'C2', 'C3', 'C4'   // Prima riga va dopo
        ]);
    });

    test('modalità LONG-SIDE: dovrebbe invertire righe per 10 carte (foglio 2)', () => {
        const cards = createMockCards(10);
        const pages = calculatePaginatedLayouts(cards, 8, 4, 'long');
        
        const page2 = pages[1];
        
        expect(getLayoutIds(page2.fronts)).toEqual([
            'C9', 'C10', 'P', 'P',
            'P', 'P', 'P', 'P'
        ]);
        
        // Long-Side: inverte ordine righe
        expect(getLayoutIds(page2.backs)).toEqual([
            'P', 'P', 'P', 'P',      // Seconda riga (vuota) va prima
            'C9', 'C10', 'P', 'P'   // Prima riga va dopo
        ]);
    });
});
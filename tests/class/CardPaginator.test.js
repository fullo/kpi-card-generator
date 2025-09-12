import { jest, describe, test, expect } from '@jest/globals';
import { CardPaginator } from '../../modules/cards/pagination/CardPaginator.js';

// Helper per creare carte mock
const createMockCards = (count) => {
    return Array.from({ length: count }, (_, i) => ({ 
        id: `C${i + 1}`,
        title: `Carta ${i + 1}`,
        type: 'test'
    }));
};

// Helper per contare placeholder
const countPlaceholders = (cards) => {
    return cards.filter(card => card.isPlaceholder).length;
};

// Helper per contare carte reali
const countRealCards = (cards) => {
    return cards.filter(card => !card.isPlaceholder).length;
};

describe('CardPaginator - Validazione Parametri', () => {
    
    test('dovrebbe validare parametri corretti', () => {
        expect(CardPaginator.validatePaginationParams(8, 4)).toBe(true);
        expect(CardPaginator.validatePaginationParams(6, 3)).toBe(true);
        expect(CardPaginator.validatePaginationParams(12, 4)).toBe(true);
        expect(CardPaginator.validatePaginationParams(4, 2)).toBe(true);
    });

    test('dovrebbe invalidare parametri scorretti', () => {
        // Parametri zero o negativi
        expect(CardPaginator.validatePaginationParams(0, 4)).toBe(false);
        expect(CardPaginator.validatePaginationParams(8, 0)).toBe(false);
        expect(CardPaginator.validatePaginationParams(-1, 4)).toBe(false);
        
        // Parametri non interi
        expect(CardPaginator.validatePaginationParams(8.5, 4)).toBe(false);
        expect(CardPaginator.validatePaginationParams(8, 3.2)).toBe(false);
        
        // cardsPerRow > cardsPerPage
        expect(CardPaginator.validatePaginationParams(4, 8)).toBe(false);
        
        // cardsPerPage non divisibile per cardsPerRow
        expect(CardPaginator.validatePaginationParams(8, 3)).toBe(false);
        expect(CardPaginator.validatePaginationParams(10, 3)).toBe(false);
        
        // Parametri null/undefined
        expect(CardPaginator.validatePaginationParams(null, 4)).toBe(false);
        expect(CardPaginator.validatePaginationParams(8, undefined)).toBe(false);
    });
});

describe('CardPaginator - Calcolo Placeholder', () => {
    
    test('dovrebbe calcolare placeholder per pagina incompleta', () => {
        expect(CardPaginator.calculatePlaceholdersNeeded(5, 8)).toBe(3);
        expect(CardPaginator.calculatePlaceholdersNeeded(7, 8)).toBe(1);
        expect(CardPaginator.calculatePlaceholdersNeeded(1, 8)).toBe(7);
    });

    test('dovrebbe non aggiungere placeholder per pagina completa', () => {
        expect(CardPaginator.calculatePlaceholdersNeeded(8, 8)).toBe(0);
        expect(CardPaginator.calculatePlaceholdersNeeded(6, 6)).toBe(0);
    });

    test('dovrebbe gestire casi limite', () => {
        expect(CardPaginator.calculatePlaceholdersNeeded(0, 8)).toBe(8);
        expect(CardPaginator.calculatePlaceholdersNeeded(10, 8)).toBe(0); // Più carte della capacità
    });
});

describe('CardPaginator - Creazione Pagine con Placeholder', () => {
    
    test('dovrebbe creare pagina con placeholder', () => {
        const cards = createMockCards(5);
        const pageWithPlaceholders = CardPaginator.createPageWithPlaceholders(cards, 8);
        
        expect(pageWithPlaceholders.length).toBe(8);
        expect(countRealCards(pageWithPlaceholders)).toBe(5);
        expect(countPlaceholders(pageWithPlaceholders)).toBe(3);
        
        // Verifica ordine: prima le carte reali, poi i placeholder
        expect(pageWithPlaceholders[0].id).toBe('C1');
        expect(pageWithPlaceholders[4].id).toBe('C5');
        expect(pageWithPlaceholders[5].isPlaceholder).toBe(true);
        expect(pageWithPlaceholders[7].isPlaceholder).toBe(true);
    });

    test('dovrebbe non aggiungere placeholder se la pagina è completa', () => {
        const cards = createMockCards(8);
        const pageWithPlaceholders = CardPaginator.createPageWithPlaceholders(cards, 8);
        
        expect(pageWithPlaceholders.length).toBe(8);
        expect(countRealCards(pageWithPlaceholders)).toBe(8);
        expect(countPlaceholders(pageWithPlaceholders)).toBe(0);
    });

    test('dovrebbe gestire array vuoto', () => {
        const pageWithPlaceholders = CardPaginator.createPageWithPlaceholders([], 8);
        
        expect(pageWithPlaceholders.length).toBe(8);
        expect(countRealCards(pageWithPlaceholders)).toBe(0);
        expect(countPlaceholders(pageWithPlaceholders)).toBe(8);
    });
});

describe('CardPaginator - Paginazione Base', () => {
    
    test('dovrebbe paginare 10 carte in 2 fogli da 8', () => {
        const cards = createMockCards(10);
        const { pages, metrics } = CardPaginator.paginateCards(cards, 8, 4);
        
        expect(pages.length).toBe(2);
        expect(metrics.totalCards).toBe(10);
        expect(metrics.totalPages).toBe(2);
        expect(metrics.totalPlaceholders).toBe(6); // 8-2 nella seconda pagina
        
        // Prima pagina completa
        expect(pages[0].length).toBe(8);
        expect(countRealCards(pages[0])).toBe(8);
        expect(countPlaceholders(pages[0])).toBe(0);
        
        // Seconda pagina con placeholder
        expect(pages[1].length).toBe(8);
        expect(countRealCards(pages[1])).toBe(2);
        expect(countPlaceholders(pages[1])).toBe(6);
    });

    test('dovrebbe gestire 8 carte esatte in 1 foglio', () => {
        const cards = createMockCards(8);
        const { pages, metrics } = CardPaginator.paginateCards(cards, 8, 4);
        
        expect(pages.length).toBe(1);
        expect(metrics.totalCards).toBe(8);
        expect(metrics.totalPages).toBe(1);
        expect(metrics.totalPlaceholders).toBe(0);
        expect(metrics.efficiency).toBe(100);
        
        expect(pages[0].length).toBe(8);
        expect(countRealCards(pages[0])).toBe(8);
        expect(countPlaceholders(pages[0])).toBe(0);
    });

    test('dovrebbe gestire 0 carte', () => {
        const { pages, metrics } = CardPaginator.paginateCards([], 8, 4);
        
        expect(pages.length).toBe(0);
        expect(metrics.totalCards).toBe(0);
        expect(metrics.totalPages).toBe(0);
        expect(metrics.totalPlaceholders).toBe(0);
    });

    test('dovrebbe gestire 1 singola carta', () => {
        const cards = createMockCards(1);
        const { pages, metrics } = CardPaginator.paginateCards(cards, 8, 4);
        
        expect(pages.length).toBe(1);
        expect(metrics.totalCards).toBe(1);
        expect(metrics.totalPages).toBe(1);
        expect(metrics.totalPlaceholders).toBe(7);
        expect(metrics.efficiency).toBe(12.5); // 1/8 * 100
        
        expect(pages[0][0].id).toBe('C1');
        expect(pages[0][1].isPlaceholder).toBe(true);
    });
});

describe('CardPaginator - Edge Cases e Validazione', () => {
    
    test('dovrebbe lanciare errore per input non array', () => {
        expect(() => {
            CardPaginator.paginateCards(null, 8, 4);
        }).toThrow('Cards deve essere un array');
        
        expect(() => {
            CardPaginator.paginateCards('not an array', 8, 4);
        }).toThrow('Cards deve essere un array');
    });

    test('dovrebbe lanciare errore per parametri non validi', () => {
        const cards = createMockCards(5);
        
        expect(() => {
            CardPaginator.paginateCards(cards, 0, 4);
        }).toThrow('Parametri di paginazione non validi');
        
        expect(() => {
            CardPaginator.paginateCards(cards, 8, 3); // 8 non divisibile per 3
        }).toThrow('Parametri di paginazione non validi');
    });

    test('dovrebbe gestire configurazioni diverse', () => {
        const cards = createMockCards(12);
        
        // Configurazione 6 carte per pagina, 3 per riga
        const { pages, metrics } = CardPaginator.paginateCards(cards, 6, 3);
        
        expect(pages.length).toBe(2);
        expect(metrics.totalPlaceholders).toBe(0); // 12 carte si dividono perfettamente
        expect(metrics.efficiency).toBe(100);
    });
});

describe('CardPaginator - Metriche Avanzate', () => {
    
    test('dovrebbe calcolare metriche corrette', () => {
        const cards = createMockCards(17);
        const { metrics } = CardPaginator.paginateCards(cards, 8, 4);
        
        expect(metrics.totalCards).toBe(17);
        expect(metrics.totalPages).toBe(3); // Math.ceil(17/8)
        expect(metrics.totalPlaceholders).toBe(7); // 24 - 17
        expect(metrics.cardsPerPage).toBe(8);
        expect(metrics.cardsPerRow).toBe(4);
        expect(metrics.averageCardsPerPage).toBeCloseTo(17/3);
        expect(metrics.efficiency).toBeCloseTo((17/24) * 100);
    });

    test('dovrebbe calcolare statistiche dettagliate', () => {
        const cards = createMockCards(17);
        const stats = CardPaginator.getPaginationStats(cards, 8, 4);
        
        expect(stats.rowsPerPage).toBe(2); // 8/4
        expect(stats.lastPageCards).toBe(1); // 17 % 8
        expect(stats.lastPageRows).toBe(1); // Math.ceil(1/4)
        expect(stats.emptyRowsInLastPage).toBe(1); // 2 - 1
        expect(stats.isLastPageComplete).toBe(false);
        expect(parseFloat(stats.wastePercentage)).toBeCloseTo(29.2); // (7/24)*100
    });
});

describe('CardPaginator - Layout Integrazione', () => {
    
    test('dovrebbe creare layout paginati con funzione mock', () => {
        const mockLayoutCalculator = jest.fn((fronts, cardsPerRow, printMode) => {
            return fronts.map(card => ({ ...card, back: true }));
        });
        
        const cards = createMockCards(10);
        const layouts = CardPaginator.createPaginatedLayouts(
            cards, 8, 4, 'short', mockLayoutCalculator
        );
        
        expect(layouts.length).toBe(2);
        expect(layouts[0].fronts.length).toBe(8);
        expect(layouts[0].backs.length).toBe(8);
        expect(layouts[1].fronts.length).toBe(8);
        expect(layouts[1].backs.length).toBe(8);
        
        // Verifica che il calculator sia stato chiamato per ogni pagina
        expect(mockLayoutCalculator).toHaveBeenCalledTimes(2);
        expect(mockLayoutCalculator).toHaveBeenCalledWith(
            expect.any(Array), 4, 'short'
        );
    });
});

describe('CardPaginator - Ottimizzazione', () => {
    
    test('dovrebbe trovare configurazione ottimale per 16 carte', () => {
        const optimal = CardPaginator.optimizePagination(16);
        
        // 16 carte si dividono perfettamente in molte configurazioni
        expect(optimal.efficiency).toBe(100);
        expect(optimal.totalPlaceholders).toBe(0);
        expect([4, 8, 16]).toContain(optimal.cardsPerPage);
    });

    test('dovrebbe gestire numero dispari di carte', () => {
        const optimal = CardPaginator.optimizePagination(15);
        
        expect(optimal.efficiency).toBeGreaterThan(0);
        expect(optimal.totalPlaceholders).toBeGreaterThan(0);
    });

    test('dovrebbe gestire 0 carte', () => {
        const optimal = CardPaginator.optimizePagination(0);
        
        expect(optimal.cardsPerPage).toBe(8);
        expect(optimal.cardsPerRow).toBe(4);
        expect(optimal.efficiency).toBe(100);
    });

    test('dovrebbe considerare diverse configurazioni', () => {
        const optimal = CardPaginator.optimizePagination(18, [6, 9, 12]);
        
        // 18 carte: 6*3=18 (100%), 9*2=18 (100%), 12*2=24 (75%)
        expect(optimal.efficiency).toBe(100);
        expect([6, 9]).toContain(optimal.cardsPerPage);
    });
});

describe('CardPaginator - Validazione Configurazione', () => {
    
    test('dovrebbe validare configurazione valida', () => {
        const result = CardPaginator.validateConfiguration(10, 8, 4);
        expect(result.isValid).toBe(true);
        expect(result.reason).toBeUndefined();
    });

    test('dovrebbe invalidare parametri scorretti', () => {
        const result = CardPaginator.validateConfiguration(10, 8, 3);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('Parametri non validi');
    });

    test('dovrebbe invalidare numero negativo di carte', () => {
        const result = CardPaginator.validateConfiguration(-5, 8, 4);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('non può essere negativo');
    });
});

describe('CardPaginator - Performance', () => {
    
    test('dovrebbe gestire molte carte velocemente', () => {
        const cards = createMockCards(1000);
        const start = Date.now();
        
        const { pages } = CardPaginator.paginateCards(cards, 8, 4);
        
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(100); // Dovrebbe essere veloce
        expect(pages.length).toBe(125); // Math.ceil(1000/8)
    });

    test('dovrebbe preservare proprietà delle carte', () => {
        const cards = [
            { id: 'C1', title: 'Prima', customProp: 'test1' },
            { id: 'C2', title: 'Seconda', customProp: 'test2' }
        ];
        
        const { pages } = CardPaginator.paginateCards(cards, 8, 4);
        
        expect(pages[0][0].customProp).toBe('test1');
        expect(pages[0][1].customProp).toBe('test2');
        expect(pages[0][0].title).toBe('Prima');
    });
});
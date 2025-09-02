import { jest, describe, test, expect } from '@jest/globals';
import { LayoutCalculator } from '../../class/LayoutCalculator.js';

// Helper per creare carte mock
const createMockCards = (count) => {
    return Array.from({ length: count }, (_, i) => ({ 
        id: `C${i + 1}`,
        titolo: `Carta ${i + 1}` 
    }));
};

// Helper per estrarre gli ID dalle carte (inclusi placeholder)
const getIds = (cards) => {
    return cards.map(card => card.isPlaceholder ? 'P' : card.id);
};

describe('LayoutCalculator - Normalizzazione Modalità', () => {
    
    test('dovrebbe normalizzare modalità short e varianti', () => {
        expect(LayoutCalculator.normalizeMode('short')).toBe('short');
        expect(LayoutCalculator.normalizeMode('SHORT')).toBe('short');
        expect(LayoutCalculator.normalizeMode('shortside')).toBe('short');
        expect(LayoutCalculator.normalizeMode('short-side')).toBe('short');
        expect(LayoutCalculator.normalizeMode('portrait')).toBe('short');
        expect(LayoutCalculator.normalizeMode('PORTRAIT')).toBe('short');
    });

    test('dovrebbe normalizzare modalità long e varianti', () => {
        expect(LayoutCalculator.normalizeMode('long')).toBe('long');
        expect(LayoutCalculator.normalizeMode('LONG')).toBe('long');
        expect(LayoutCalculator.normalizeMode('longside')).toBe('long');
        expect(LayoutCalculator.normalizeMode('long-side')).toBe('long');
        expect(LayoutCalculator.normalizeMode('landscape')).toBe('long');
        expect(LayoutCalculator.normalizeMode('LANDSCAPE')).toBe('long');
    });

    test('dovrebbe fallback a short per input non validi', () => {
        expect(LayoutCalculator.normalizeMode('')).toBe('short');
        expect(LayoutCalculator.normalizeMode(null)).toBe('short');
        expect(LayoutCalculator.normalizeMode(undefined)).toBe('short');
        expect(LayoutCalculator.normalizeMode('invalid')).toBe('short');
        expect(LayoutCalculator.normalizeMode(123)).toBe('short');
    });

    test('dovrebbe gestire spazi e caratteri extra', () => {
        expect(LayoutCalculator.normalizeMode('  short  ')).toBe('short');
        expect(LayoutCalculator.normalizeMode('\tlandscape\n')).toBe('long');
    });
});

describe('LayoutCalculator - Validazione Modalità', () => {
    
    test('dovrebbe validare modalità corrette', () => {
        expect(LayoutCalculator.isValidMode('short')).toBe(true);
        expect(LayoutCalculator.isValidMode('long')).toBe(true);
        expect(LayoutCalculator.isValidMode('portrait')).toBe(true);
        expect(LayoutCalculator.isValidMode('landscape')).toBe(true);
        expect(LayoutCalculator.isValidMode('LANDSCAPE')).toBe(true);
    });

    test('dovrebbe invalidare modalità scorrette', () => {
        expect(LayoutCalculator.isValidMode('')).toBe(false);
        expect(LayoutCalculator.isValidMode(null)).toBe(false);
        expect(LayoutCalculator.isValidMode(undefined)).toBe(false);
        expect(LayoutCalculator.isValidMode('invalid')).toBe(false);
        expect(LayoutCalculator.isValidMode(123)).toBe(false);
    });
});

describe('LayoutCalculator - Informazioni Modalità', () => {
    
    test('dovrebbe restituire info corrette per modalità short', () => {
        const info = LayoutCalculator.getModeInfo('portrait');
        expect(info.mode).toBe('short');
        expect(info.description).toBe('Capovolgi sul lato corto');
        expect(info.flipSide).toBe('corto');
    });

    test('dovrebbe restituire info corrette per modalità long', () => {
        const info = LayoutCalculator.getModeInfo('landscape');
        expect(info.mode).toBe('long');
        expect(info.description).toBe('Capovolgi sul lato lungo');
        expect(info.flipSide).toBe('lungo');
    });
});

describe('LayoutCalculator - Layout Speculare Short Mode', () => {
    
    test('dovrebbe calcolare layout speculare per 8 carte in modalità short', () => {
        const cards = createMockCards(8);
        const result = LayoutCalculator.calculateMirrorLayout(cards, 4, 'short');
        
        // Modalità short: inverte le carte in ogni riga
        expect(getIds(result)).toEqual([
            'C4', 'C3', 'C2', 'C1',  // Prima riga invertita
            'C8', 'C7', 'C6', 'C5'   // Seconda riga invertita
        ]);
    });

    test('dovrebbe gestire carte con placeholder in modalità short', () => {
        const cards = [...createMockCards(6), { isPlaceholder: true }, { isPlaceholder: true }];
        const result = LayoutCalculator.calculateMirrorLayout(cards, 4, 'short');
        
        expect(getIds(result)).toEqual([
            'C4', 'C3', 'C2', 'C1',  // Prima riga invertita
            'P', 'P', 'C6', 'C5'     // Seconda riga con placeholder invertiti
        ]);
    });

    test('dovrebbe gestire una singola carta in modalità short', () => {
        const cards = createMockCards(1);
        const result = LayoutCalculator.calculateMirrorLayout(cards, 4, 'short');
        
        expect(getIds(result)).toEqual(['C1']);
    });
});

describe('LayoutCalculator - Layout Speculare Long Mode', () => {
    
    test('dovrebbe calcolare layout speculare per 8 carte in modalità long', () => {
        const cards = createMockCards(8);
        const result = LayoutCalculator.calculateMirrorLayout(cards, 4, 'long');
        
        // Modalità long: inverte l'ordine delle righe
        expect(getIds(result)).toEqual([
            'C5', 'C6', 'C7', 'C8',  // Seconda riga va prima
            'C1', 'C2', 'C3', 'C4'   // Prima riga va dopo
        ]);
    });

    test('dovrebbe gestire carte con placeholder in modalità long', () => {
        const cards = [...createMockCards(6), { isPlaceholder: true }, { isPlaceholder: true }];
        const result = LayoutCalculator.calculateMirrorLayout(cards, 4, 'long');
        
        expect(getIds(result)).toEqual([
            'C5', 'C6', 'P', 'P',    // Seconda riga va prima
            'C1', 'C2', 'C3', 'C4'   // Prima riga va dopo
        ]);
    });

    test('dovrebbe gestire righe incomplete in modalità long', () => {
        const cards = createMockCards(10);
        const result = LayoutCalculator.calculateMirrorLayout(cards, 4, 'long');
        
        expect(getIds(result)).toEqual([
            'C9', 'C10',              // Terza riga incompleta va prima
            'C5', 'C6', 'C7', 'C8',   // Seconda riga
            'C1', 'C2', 'C3', 'C4'    // Prima riga va per ultima
        ]);
    });
});

describe('LayoutCalculator - Edge Cases e Validazione', () => {
    
    test('dovrebbe gestire array vuoto', () => {
        const result = LayoutCalculator.calculateMirrorLayout([], 4, 'short');
        expect(result).toEqual([]);
    });

    test('dovrebbe lanciare errore per cardsPerRow non valido', () => {
        const cards = createMockCards(4);
        
        expect(() => {
            LayoutCalculator.calculateMirrorLayout(cards, 0, 'short');
        }).toThrow('cardsPerRow deve essere un numero positivo');
        
        expect(() => {
            LayoutCalculator.calculateMirrorLayout(cards, -1, 'short');
        }).toThrow('cardsPerRow deve essere un numero positivo');
    });

    test('dovrebbe gestire input non array', () => {
        expect(() => {
            LayoutCalculator.calculateMirrorLayout(null, 4, 'short');
        }).not.toThrow();
        
        const result = LayoutCalculator.calculateMirrorLayout(null, 4, 'short');
        expect(result).toEqual([]);
    });

    test('dovrebbe usare modalità default se non specificata', () => {
        const cards = createMockCards(4);
        const result = LayoutCalculator.calculateMirrorLayout(cards, 4);
        
        // Default dovrebbe essere short
        expect(getIds(result)).toEqual(['C4', 'C3', 'C2', 'C1']);
    });
});

describe('LayoutCalculator - Configurazioni Diverse', () => {
    
    test('dovrebbe gestire 2 carte per riga in modalità short', () => {
        const cards = createMockCards(6);
        const result = LayoutCalculator.calculateMirrorLayout(cards, 2, 'short');
        
        expect(getIds(result)).toEqual([
            'C2', 'C1',    // Prima riga invertita
            'C4', 'C3',    // Seconda riga invertita
            'C6', 'C5'     // Terza riga invertita
        ]);
    });

    test('dovrebbe gestire 2 carte per riga in modalità long', () => {
        const cards = createMockCards(6);
        const result = LayoutCalculator.calculateMirrorLayout(cards, 2, 'long');
        
        expect(getIds(result)).toEqual([
            'C5', 'C6',    // Terza riga va prima
            'C3', 'C4',    // Seconda riga
            'C1', 'C2'     // Prima riga va per ultima
        ]);
    });

    test('dovrebbe gestire 1 carta per riga', () => {
        const cards = createMockCards(3);
        const resultShort = LayoutCalculator.calculateMirrorLayout(cards, 1, 'short');
        const resultLong = LayoutCalculator.calculateMirrorLayout(cards, 1, 'long');
        
        // Con 1 carta per riga, short e long dovrebbero essere diversi
        expect(getIds(resultShort)).toEqual(['C1', 'C2', 'C3']); // Ogni riga è già "invertita"
        expect(getIds(resultLong)).toEqual(['C3', 'C2', 'C1']);  // Righe invertite
    });
});

describe('LayoutCalculator - Compatibilità e Deprecazione', () => {
    
    test('funzione deprecata dovrebbe funzionare ma warning', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        const cards = createMockCards(4);
        const result = LayoutCalculator.calculateLayouts(cards, 4, 'short');
        
        expect(getIds(result)).toEqual(['C4', 'C3', 'C2', 'C1']);
        expect(consoleSpy).toHaveBeenCalledWith('calculateLayouts è deprecata, usa calculateMirrorLayout');
        
        consoleSpy.mockRestore();
    });
});

describe('LayoutCalculator - Performance e Stabilità', () => {
    
    test('dovrebbe gestire un grande numero di carte', () => {
        const cards = createMockCards(1000);
        const start = Date.now();
        
        const result = LayoutCalculator.calculateMirrorLayout(cards, 10, 'short');
        
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(100); // Dovrebbe essere veloce
        expect(result.length).toBe(1000);
    });

    test('dovrebbe preservare le proprietà degli oggetti carta', () => {
        const cards = [
            { id: 'C1', titolo: 'Prima carta', customProp: 'test1' },
            { id: 'C2', titolo: 'Seconda carta', customProp: 'test2' }
        ];
        
        const result = LayoutCalculator.calculateMirrorLayout(cards, 2, 'short');
        
        expect(result[0].customProp).toBe('test2');  // Seconda carta prima dopo inversione
        expect(result[1].customProp).toBe('test1');  // Prima carta seconda dopo inversione
        expect(result[0].titolo).toBe('Seconda carta');
        expect(result[1].titolo).toBe('Prima carta');
    });
});
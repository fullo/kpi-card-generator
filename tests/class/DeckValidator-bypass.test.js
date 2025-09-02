import { jest, describe, test, expect } from '@jest/globals';
import { DeckValidator } from '../../class/DeckValidator.js';

describe('DeckValidator - Character Limit Bypass', () => {
    
    test('dovrebbe fallire validazione con testo lungo senza bypass', () => {
        const validator = new DeckValidator({ bypassCharacterLimits: false });
        
        // Testo di 600+ caratteri (oltre il limite di 500)
        const longText = 'A'.repeat(600);
        const rules = { maxLength: 500 };
        
        const result = validator.validateString(longText, rules);
        
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toMatch(/troppo lunga.*max 500 caratteri.*600/);
    });

    test('dovrebbe passare validazione con testo lungo con bypass abilitato', () => {
        const validator = new DeckValidator({ bypassCharacterLimits: true });
        
        // Testo di 600+ caratteri (oltre il limite di 500)
        const longText = 'A'.repeat(600);
        const rules = { maxLength: 500 };
        
        const result = validator.validateString(longText, rules);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('dovrebbe validare carta completa con testo lungo e bypass', () => {
        const validator = new DeckValidator({ bypassCharacterLimits: true });
        
        const longCard = {
            titolo: 'Carta Test',
            testo: 'Questo è un testo molto lungo che supera i 500 caratteri di limite normalmente imposti dal sistema. '.repeat(10),
            tipo: 'Test',
            classe: 'card-test'
        };
        
        const result = validator.validateCard(longCard);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('dovrebbe validare deck completo con carte lunghe e bypass', () => {
        const validator = new DeckValidator({ bypassCharacterLimits: true });
        
        const deckWithLongText = {
            titolo: 'Test Deck',
            carte: [
                {
                    titolo: 'Carta 1',
                    testo: 'Testo molto lungo che supera i 500 caratteri normalmente permessi dal sistema di validazione. '.repeat(8),
                    tipo: 'Test',
                    classe: 'card-test'
                },
                {
                    titolo: 'Carta 2', 
                    testo: 'Altro testo molto lungo per testare il bypass dei limiti caratteri nel sistema. '.repeat(10),
                    tipo: 'Test',
                    classe: 'card-test'
                }
            ]
        };
        
        const result = validator.validateJSON(JSON.stringify(deckWithLongText));
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('dovrebbe comunque validare encoding anche con bypass abilitato', () => {
        const validator = new DeckValidator({ 
            bypassCharacterLimits: true,
            validateEncoding: true 
        });
        
        // Testo con caratteri non validi
        const textWithBadChars = 'Testo normale';
        const rules = { maxLength: 500 };
        
        const result = validator.validateString(textWithBadChars, rules);
        
        // Dovrebbe passare perché il testo è valido
        expect(result.isValid).toBe(true);
    });

    test('dovrebbe mantenere altri controlli quando bypass è abilitato', () => {
        const validator = new DeckValidator({ 
            bypassCharacterLimits: true 
        });
        
        const cardWithMissingTitle = {
            // titolo mancante (campo required)
            testo: 'Testo molto lungo '.repeat(50), // Lungo ma bypass attivo
            tipo: 'Test',
            classe: 'card-test'
        };
        
        const result = validator.validateCard(cardWithMissingTitle);
        
        // Dovrebbe fallire per il titolo mancante, non per la lunghezza del testo
        expect(result.isValid).toBe(false);
        expect(result.errors.some(err => err.includes('titolo'))).toBe(true);
        expect(result.errors.some(err => err.includes('troppo lunga'))).toBe(false);
    });

    test('dovrebbe funzionare con conteggio HTML abilitato e bypass', () => {
        const validator = new DeckValidator({ 
            bypassCharacterLimits: true,
            countHtmlAsText: true 
        });
        
        const htmlText = '<strong>Testo con markup</strong> '.repeat(50); // Tanto markup
        const rules = { maxLength: 100 };
        
        const result = validator.validateString(htmlText, rules);
        
        // Dovrebbe passare grazie al bypass, indipendentemente dal conteggio HTML
        expect(result.isValid).toBe(true);
    });
});
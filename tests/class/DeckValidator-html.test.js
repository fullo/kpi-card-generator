import { jest, describe, test, expect } from '@jest/globals';
import { DeckValidator } from '../../class/DeckValidator.js';

describe('DeckValidator - HTML Character Counting', () => {
    
    let validator;

    beforeEach(() => {
        validator = new DeckValidator({ countHtmlAsText: true });
    });

    test('dovrebbe validare testo con HTML escludendo markup dal conteggio', () => {
        const textWithHtml = '<strong>Testo</strong> con <em>markup</em> ma <u>pochi</u> caratteri';
        const rules = { maxLength: 50, minLength: 20 };
        
        const result = validator.validateString(textWithHtml, rules);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('dovrebbe fallire validazione quando testo HTML supera limite caratteri', () => {
        const shortText = '<strong>Test</strong>'; // Solo 4 caratteri di testo
        const rules = { minLength: 10 };
        
        const result = validator.validateString(shortText, rules);
        
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toMatch(/troppo corta.*min 10 caratteri di testo.*attuale 4/);
    });

    test('dovrebbe fallire quando markup è troppo lungo ma testo è ok', () => {
        // Tanto markup ma poco testo
        const longMarkupText = '<strong><em><u><b><i>Text</i></b></u></em></strong>'; // Solo 4 caratteri di testo
        const rules = { minLength: 10 };
        
        const result = validator.validateString(longMarkupText, rules);
        
        expect(result.isValid).toBe(false);
    });

    test('dovrebbe validare carte con HTML nel JSON', () => {
        const deckWithHtml = {
            titolo: 'Test HTML',
            sottotitolo: 'Test with HTML markup',
            carte: [
                {
                    titolo: 'Carta <strong>Important</strong>',
                    testo: '<strong>Questo</strong> è un <em>testo</em> con <ul><li>Lista 1</li><li>Lista 2</li></ul>',
                    flavor: '<em>Solo</em> <b>poche</b> parole',
                    tipo: 'Test',
                    classe: 'card-test'
                }
            ]
        };
        
        const result = validator.validateJSON(JSON.stringify(deckWithHtml));
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('dovrebbe contare solo caratteri visibili per validazione lunghezza', () => {
        const deckWithLongMarkup = {
            titolo: 'Test Lungo Markup',
            carte: [
                {
                    titolo: 'Test',
                    // Molto markup HTML ma testo effettivo breve
                    testo: '<strong><em><u><b><i>Short</i></b></u></em></strong>', // Solo 5 caratteri
                    tipo: 'Test',
                    classe: 'card-test'
                }
            ]
        };
        
        const result = validator.validateJSON(JSON.stringify(deckWithLongMarkup));
        
        // Dovrebbe essere valida perché il testo effettivo è breve
        expect(result.isValid).toBe(true);
    });

    test('dovrebbe rispettare configurazione countHtmlAsText false', () => {
        const validatorNoHtml = new DeckValidator({ countHtmlAsText: false });
        
        const textWithHtml = '<strong>Test</strong>'; // 19 caratteri totali, 4 di testo
        const rules = { maxLength: 10 };
        
        const result = validatorNoHtml.validateString(textWithHtml, rules);
        
        // Dovrebbe fallire perché conta tutti i caratteri incluso il markup
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toMatch(/troppo lunga.*max 10 caratteri.*21/);
    });

    test('dovrebbe mostrare info dettagliate nel messaggio errore', () => {
        const longHtmlText = '<strong>Questo è un testo che diventa troppo lungo con tutto il markup HTML aggiunto</strong>';
        const rules = { maxLength: 50 };
        
        const result = validator.validateString(longHtmlText, rules);
        
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toMatch(/caratteri di testo.*con markup/);
    });
});
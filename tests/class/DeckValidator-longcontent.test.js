import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { DeckValidator } from '../../modules/cards/validation/DeckValidator.js';
import { CardRenderer } from '../../modules/cards/rendering/CardRenderer.js';

describe('DeckValidator - Long Content Warnings', () => {

    let validator;
    const THRESHOLD = CardRenderer.LONG_CONTENT_THRESHOLD; // 350

    beforeEach(() => {
        validator = new DeckValidator();
    });

    describe('validateCardQuick', () => {

        test('dovrebbe restituire warning per description >= soglia', () => {
            const card = {
                title: 'Long Card',
                description: 'A'.repeat(THRESHOLD)
            };

            const result = DeckValidator.validateCardQuick(card);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toBeDefined();
            expect(result.warnings.length).toBe(1);
            expect(result.warnings[0].field).toBe('description');
            expect(result.warnings[0].message).toContain('heroImage');
            expect(result.warnings[0].message).toContain('flavorText');
            expect(result.warnings[0].message).toContain('20%');
        });

        test('NON dovrebbe restituire warning per description < soglia', () => {
            const card = {
                title: 'Normal Card',
                description: 'A'.repeat(THRESHOLD - 1)
            };

            const result = DeckValidator.validateCardQuick(card);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toBeDefined();
            expect(result.warnings.length).toBe(0);
        });

        test('dovrebbe restituire warnings array anche per carte senza description', () => {
            const card = {
                title: 'Simple Card'
            };

            const result = DeckValidator.validateCardQuick(card);

            expect(result.warnings).toBeDefined();
            expect(result.warnings.length).toBe(0);
        });

        test('dovrebbe usare la soglia definita in CardRenderer', () => {
            expect(CardRenderer.LONG_CONTENT_THRESHOLD).toBe(350);

            const cardAtThreshold = {
                title: 'At Threshold',
                description: 'A'.repeat(THRESHOLD)
            };

            const result = DeckValidator.validateCardQuick(cardAtThreshold);
            expect(result.warnings.length).toBe(1);
        });
    });

    describe('validateDeckQuick', () => {

        test('dovrebbe propagare warnings dalle carte al deck', () => {
            const deck = {
                title: 'Test Deck',
                cards: [
                    { title: 'Normal', description: 'Short text' },
                    { title: 'Long', description: 'B'.repeat(THRESHOLD + 100) }
                ]
            };

            const result = DeckValidator.validateDeckQuick(deck);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toBeDefined();
            expect(result.warnings.length).toBe(1);
            expect(result.warnings[0].field).toBe('cards.1.description');
        });

        test('dovrebbe avere warnings vuoti se nessuna carta ha description lunga', () => {
            const deck = {
                title: 'Normal Deck',
                cards: [
                    { title: 'Card 1', description: 'Short' },
                    { title: 'Card 2', description: 'Also short' }
                ]
            };

            const result = DeckValidator.validateDeckQuick(deck);

            expect(result.warnings).toBeDefined();
            expect(result.warnings.length).toBe(0);
        });

        test('dovrebbe gestire multiple carte con description lunga', () => {
            const deck = {
                title: 'Long Deck',
                cards: [
                    { title: 'Long 1', description: 'C'.repeat(THRESHOLD) },
                    { title: 'Normal', description: 'Short' },
                    { title: 'Long 2', description: 'D'.repeat(THRESHOLD + 200) }
                ]
            };

            const result = DeckValidator.validateDeckQuick(deck);

            expect(result.isValid).toBe(true);
            expect(result.warnings.length).toBe(2);
            expect(result.warnings[0].field).toBe('cards.0.description');
            expect(result.warnings[1].field).toBe('cards.2.description');
        });
    });

    describe('validateCard (full validation)', () => {

        test('dovrebbe restituire warning per description lunga', () => {
            const card = {
                title: 'Long Card',
                description: 'E'.repeat(THRESHOLD)
            };

            const result = validator.validateCard(card, 0);

            expect(result.isValid).toBe(true);
            expect(result.warnings.length).toBeGreaterThanOrEqual(1);
            expect(result.warnings.some(w => w.includes('heroImage') && w.includes('flavorText'))).toBe(true);
        });

        test('dovrebbe includere indice della carta nel warning', () => {
            const card = {
                title: 'Card 5',
                description: 'F'.repeat(THRESHOLD + 100)
            };

            const result = validator.validateCard(card, 4);

            const longWarning = result.warnings.find(w => w.includes('heroImage'));
            expect(longWarning).toContain('Carta 5');
        });

        test('NON dovrebbe generare warning per description corta', () => {
            const card = {
                title: 'Short Card',
                description: 'Short description'
            };

            const result = validator.validateCard(card, 0);

            const longWarnings = result.warnings.filter(w => w.includes('heroImage'));
            expect(longWarnings.length).toBe(0);
        });
    });
});

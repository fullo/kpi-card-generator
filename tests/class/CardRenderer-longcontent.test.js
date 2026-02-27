import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { CardRenderer } from '../../modules/cards/rendering/CardRenderer.js';

describe('CardRenderer - Long Content Detection', () => {

    let renderer;
    const THRESHOLD = CardRenderer.LONG_CONTENT_THRESHOLD; // 350

    beforeEach(() => {
        CardRenderer.clearCache();
        renderer = new CardRenderer();
        renderer.frontTemplate = '<div class="playing-card {{styleClass}}" style="{{cardCssVars}}"><div class="card-image-area">{{heroImage}}</div><p class="main-text">{{description}}</p><div class="card-flavor-text">{{flavorText}}</div></div>';
        renderer.backTemplate = '<div class="playing-card {{styleClass}}">{{cardBackIcon}}</div>';
    });

    test('dovrebbe avere la costante LONG_CONTENT_THRESHOLD definita', () => {
        expect(CardRenderer.LONG_CONTENT_THRESHOLD).toBe(350);
    });

    test('dovrebbe aggiungere classe long-content per description >= soglia', () => {
        const longDescription = 'A'.repeat(THRESHOLD);
        const card = {
            title: 'Test Card',
            styleClass: 'card-kpi',
            heroImage: '📊',
            description: longDescription,
            flavorText: 'Some flavor text'
        };

        const result = renderer.renderCard(card, true);

        expect(result).toContain('long-content');
        expect(result).toContain('card-kpi');
    });

    test('NON dovrebbe aggiungere classe long-content per description < soglia', () => {
        const shortDescription = 'A'.repeat(THRESHOLD - 1);
        const card = {
            title: 'Test Card',
            styleClass: 'card-kpi',
            heroImage: '📊',
            description: shortDescription,
            flavorText: 'Some flavor text'
        };

        const result = renderer.renderCard(card, true);

        expect(result).not.toContain('long-content');
        expect(result).toContain('card-kpi');
    });

    test('dovrebbe aggiungere long-content anche senza styleClass preesistente', () => {
        const longDescription = 'B'.repeat(THRESHOLD + 500);
        const card = {
            title: 'Test Card',
            description: longDescription
        };

        const result = renderer.renderCard(card, true);

        expect(result).toContain('long-content');
    });

    test('NON dovrebbe aggiungere long-content per il retro della carta', () => {
        const longDescription = 'C'.repeat(THRESHOLD + 100);
        const card = {
            title: 'Test Card',
            styleClass: 'card-kpi',
            description: longDescription
        };
        const exerciseData = { cardBackIcon: '⭐' };

        const result = renderer.renderCard(card, false, exerciseData);

        expect(result).not.toContain('long-content');
    });

    test('NON dovrebbe aggiungere long-content per description vuota', () => {
        const card = {
            title: 'Test Card',
            styleClass: 'card-kpi'
        };

        const result = renderer.renderCard(card, true);

        expect(result).not.toContain('long-content');
    });

    test('dovrebbe gestire description esattamente alla soglia', () => {
        const exactDescription = 'X'.repeat(THRESHOLD);
        const card = {
            title: 'Exact Limit',
            styleClass: 'card-obiettivo',
            description: exactDescription
        };

        const result = renderer.renderCard(card, true);

        expect(result).toContain('long-content');
        expect(result).toContain('card-obiettivo');
    });

    test('dovrebbe preservare la styleClass originale con long-content', () => {
        const longDescription = 'D'.repeat(THRESHOLD + 100);
        const card = {
            title: 'Multi Class',
            styleClass: 'card-evento',
            description: longDescription,
            heroImage: '🎯',
            flavorText: 'Test'
        };

        const result = renderer.renderCard(card, true);

        expect(result).toContain('card-evento long-content');
    });

    test('dovrebbe funzionare con description contenente HTML markup', () => {
        // HTML markup counts toward the raw char threshold
        const htmlDescription = '<strong>Important:</strong> ' + 'A'.repeat(THRESHOLD - 10);
        const card = {
            title: 'HTML Card',
            styleClass: 'card-kpi',
            description: htmlDescription
        };

        const result = renderer.renderCard(card, true);

        // 27 + (THRESHOLD - 10) > THRESHOLD chars raw
        expect(result).toContain('long-content');
    });
});

describe('CardRenderer - Dynamic CSS Custom Properties', () => {

    let renderer;

    beforeEach(() => {
        CardRenderer.clearCache();
        renderer = new CardRenderer();
        renderer.frontTemplate = '<div class="playing-card {{styleClass}}" style="{{cardCssVars}}"><p class="main-text">{{description}}</p></div>';
        renderer.backTemplate = '<div class="playing-card {{styleClass}}">{{cardBackIcon}}</div>';
    });

    test('calculateCardCssVars dovrebbe restituire stringa vuota per 0 caratteri', () => {
        const result = CardRenderer.calculateCardCssVars(0);
        expect(result).toBe('');
    });

    test('calculateCardCssVars dovrebbe restituire stringa vuota per null/undefined', () => {
        expect(CardRenderer.calculateCardCssVars(null)).toBe('');
        expect(CardRenderer.calculateCardCssVars(undefined)).toBe('');
    });

    test('calculateCardCssVars dovrebbe restituire variabili per testo medio (300 chars)', () => {
        const result = CardRenderer.calculateCardCssVars(300);

        expect(result).toContain('--card-desc-font-size:');
        expect(result).toContain('--card-desc-line-height:');
        expect(result).toContain('--card-desc-font-size-print:');
        expect(result).toContain('--card-desc-line-height-print:');
    });

    test('calculateCardCssVars dovrebbe scalare il font progressivamente', () => {
        const short = CardRenderer.calculateCardCssVars(100);
        const medium = CardRenderer.calculateCardCssVars(500);
        const long = CardRenderer.calculateCardCssVars(1000);
        const veryLong = CardRenderer.calculateCardCssVars(1800);

        // Estrarre i valori di font-size dalla stringa
        const extractFontSize = (str) => {
            const match = str.match(/--card-desc-font-size:\s*([\d.]+)rem/);
            return match ? parseFloat(match[1]) : null;
        };

        const shortFont = extractFontSize(short);
        const mediumFont = extractFontSize(medium);
        const longFont = extractFontSize(long);
        const veryLongFont = extractFontSize(veryLong);

        // Se short è vuoto (sotto la soglia minima), saltiamo il confronto
        if (shortFont !== null && mediumFont !== null) {
            expect(shortFont).toBeGreaterThan(mediumFont);
        }
        expect(mediumFont).toBeGreaterThan(longFont);
        expect(longFont).toBeGreaterThan(veryLongFont);
    });

    test('calculateCardCssVars dovrebbe avere un limite minimo al massimo breakpoint', () => {
        const atMax = CardRenderer.calculateCardCssVars(2000);
        const beyondMax = CardRenderer.calculateCardCssVars(5000);

        expect(atMax).toBe(beyondMax);
    });

    test('dovrebbe iniettare CSS custom properties nel fronte della carta', () => {
        const card = {
            title: 'Dynamic Card',
            description: 'A'.repeat(500),
            styleClass: 'card-kpi'
        };

        const result = renderer.renderCard(card, true);

        expect(result).toContain('--card-desc-font-size:');
        expect(result).toContain('style="');
    });

    test('dovrebbe iniettare font quasi default per carte con description corta', () => {
        const card = {
            title: 'Short Card',
            description: 'Short text',
            styleClass: 'card-kpi'
        };

        const result = renderer.renderCard(card, true);

        // Per testi corti (10 chars), il font è interpolato vicino al default (0.9rem)
        expect(result).toContain('style="');
        const match = result.match(/--card-desc-font-size:\s*([\d.]+)rem/);
        if (match) {
            const fontSize = parseFloat(match[1]);
            // 10 chars è molto vicino a 0 nel breakpoint [0, 0.90] -> [150, 0.82]
            expect(fontSize).toBeGreaterThanOrEqual(0.88);
            expect(fontSize).toBeLessThanOrEqual(0.90);
        }
    });

    test('NON dovrebbe iniettare CSS vars nel retro della carta', () => {
        const card = {
            title: 'Card',
            description: 'A'.repeat(800),
            styleClass: 'card-kpi'
        };
        const exerciseData = { cardBackIcon: '⭐' };

        const result = renderer.renderCard(card, false, exerciseData);

        expect(result).not.toContain('--card-desc-font-size');
    });

    test('dovrebbe produrre valori intermedi per interpolazione lineare', () => {
        // Test a metà tra il breakpoint 350 e 700
        const result = CardRenderer.calculateCardCssVars(525);

        const match = result.match(/--card-desc-font-size:\s*([\d.]+)rem/);
        expect(match).not.toBeNull();
        const fontSize = parseFloat(match[1]);

        // Dovrebbe essere tra 0.70 (a 350) e 0.65 (a 700) - interpolato
        expect(fontSize).toBeGreaterThanOrEqual(0.65);
        expect(fontSize).toBeLessThanOrEqual(0.70);
    });

    test('dovrebbe avere valori coerenti tra print e screen', () => {
        const result = CardRenderer.calculateCardCssVars(700);

        const screenMatch = result.match(/--card-desc-font-size:\s*([\d.]+)rem/);
        const printMatch = result.match(/--card-desc-font-size-print:\s*([\d.]+)pt/);

        expect(screenMatch).not.toBeNull();
        expect(printMatch).not.toBeNull();

        // Entrambi devono essere presenti con valori ragionevoli
        const screenFont = parseFloat(screenMatch[1]);
        const printFont = parseFloat(printMatch[1]);

        expect(screenFont).toBeGreaterThan(0.5);
        expect(screenFont).toBeLessThan(1.0);
        expect(printFont).toBeGreaterThan(4.0);
        expect(printFont).toBeLessThan(8.0);
    });
});

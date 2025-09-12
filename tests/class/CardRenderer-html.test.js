import { jest, describe, test, expect } from '@jest/globals';
import { CardRenderer } from '../../modules/cards/rendering/CardRenderer.js';

describe('CardRenderer - HTML Markup Support', () => {
    
    test('dovrebbe sanitizzare HTML permettendo tag sicuri', () => {
        const htmlWithSafeTags = 'Testo con <strong>grassetto</strong> e <em>corsivo</em>';
        const result = CardRenderer.sanitizeHtml(htmlWithSafeTags);
        
        expect(result).toBe('Testo con <strong>grassetto</strong> e <em>corsivo</em>');
    });

    test('dovrebbe bloccare tag HTML pericolosi', () => {
        const dangerousHtml = 'Testo con <script>alert("hack")</script> e <strong>grassetto</strong>';
        const result = CardRenderer.sanitizeHtml(dangerousHtml);
        
        expect(result).toBe('Testo con &lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt; e <strong>grassetto</strong>');
    });

    test('dovrebbe supportare tutti i tag permessi', () => {
        const htmlWithAllTags = '<strong>forte</strong> <b>bold</b> <em>enfasi</em> <i>italic</i> <u>sottolineato</u><br><ul><li>lista 1</li><li>lista 2</li></ul>';
        const result = CardRenderer.sanitizeHtml(htmlWithAllTags);
        
        expect(result).toBe('<strong>forte</strong> <b>bold</b> <em>enfasi</em> <i>italic</i> <u>sottolineato</u><br><ul><li>lista 1</li><li>lista 2</li></ul>');
    });

    test('dovrebbe gestire tag italic come i', () => {
        const htmlWithItalic = 'Testo <italic>corsivo</italic> normale';
        const result = CardRenderer.sanitizeHtml(htmlWithItalic);
        
        expect(result).toBe('Testo <italic>corsivo</italic> normale');
    });

    test('dovrebbe contare caratteri escludendo markup HTML', () => {
        const textWithHtml = 'Questo <strong>testo</strong> ha <em>markup</em> <br> ma <u>pochi</u> caratteri';
        const count = CardRenderer.countTextCharacters(textWithHtml);
        
        // "Questo testo ha markup  ma pochi caratteri" = 42 caratteri (con spazi extra)
        expect(count).toBe(42);
    });

    test('dovrebbe contare caratteri con liste HTML', () => {
        const textWithList = '<ul><li>Primo</li><li>Secondo elemento</li><li>Terzo</li></ul>';
        const count = CardRenderer.countTextCharacters(textWithList);
        
        // "PrimoSecondo elementoTerzo" = 26 caratteri (spazi inclusi)
        expect(count).toBe(26);
    });

    test('dovrebbe contare caratteri con entità HTML', () => {
        const textWithEntities = 'Test &amp; &lt;tag&gt; &quot;quote&quot;';
        const count = CardRenderer.countTextCharacters(textWithEntities);
        
        // 'Test & <tag> "quote"' = 20 caratteri
        expect(count).toBe(20);
    });

    test('dovrebbe gestire testo senza HTML', () => {
        const plainText = 'Solo testo normale senza markup';
        const count = CardRenderer.countTextCharacters(plainText);
        
        expect(count).toBe(plainText.length);
    });

    test('replacePlaceholders dovrebbe usare HTML sanitizzato quando allowHtml è true', () => {
        const template = 'Template con {{contenuto}}';
        const data = { contenuto: 'Testo <strong>importante</strong> e <script>hack</script>' };
        
        const result = CardRenderer.replacePlaceholders(template, data, false, true);
        
        expect(result).toBe('Template con Testo <strong>importante</strong> e &lt;script&gt;hack&lt;/script&gt;');
    });

    test('replacePlaceholders dovrebbe escapare tutto quando allowHtml è false', () => {
        const template = 'Template con {{contenuto}}';
        const data = { contenuto: 'Testo <strong>importante</strong>' };
        
        const result = CardRenderer.replacePlaceholders(template, data, false, false);
        
        expect(result).toBe('Template con Testo &lt;strong&gt;importante&lt;/strong&gt;');
    });

    test('dovrebbe gestire placeholder con HTML misto sicuro e pericoloso', () => {
        const template = '{{description}} e {{altro}}';
        const data = { 
            description: '<strong>Sicuro</strong> <script>pericoloso</script>',
            altro: '<em>Enfasi</em> ok'
        };
        
        const result = CardRenderer.replacePlaceholders(template, data, false, true);
        
        expect(result).toBe('<strong>Sicuro</strong> &lt;script&gt;pericoloso&lt;/script&gt; e <em>Enfasi</em> ok');
    });
});
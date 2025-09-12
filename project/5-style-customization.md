# 🎨 Iterazione 5: Sistema di Personalizzazione Stili CSS

## 🎯 Obiettivo FINALE
Implementare un sistema sicuro e user-friendly per permettere agli utenti di personalizzare gli stili CSS delle carte basato sui valori `styleClass`, con approccio CLI-first e modalità esperta opzionale.

## 📋 Requisiti Finali Approvati

### Input Utente per ogni `styleClass` unica:

1. **Card Title Color** (opzionale, con validazione anti-XSS)
   - **Input**: Colore testo + colore background separati (hex format)
   - **Genera**: `.STILE-CARTA .card-title { color: #textColor; }`
   - **Genera**: `.STILE-CARTA .card-type-banner { background-color: #bgColor; color: #textColor; }`
   - **Sicurezza**: Solo hex colors validati con regex `/^#[0-9A-Fa-f]{6}$/`

2. **Toggle Hero Image** (true/false, default: true)
   - Se false: `.STILE-CARTA .card-image-area { display: none !important; }`

3. **Card Description Text Size** (xs/s/m/l, default: m)
   - xs (6pt): `font-size: 6pt !important; line-height: 1.2 !important;`
   - s (7pt): `font-size: 7pt !important; line-height: 1.3 !important;`
   - m (8pt): `font-size: 8pt !important; line-height: 1.4 !important;` 
   - l (9pt): `font-size: 9pt !important; line-height: 1.5 !important;`

### UX Guidelines Approvate:
- **Modalità Esperta**: Personalizzazione stili solo su richiesta esplicita
- **Post-Save Only**: Personalizzazione disponibile SOLO dopo primo salvataggio deck
- **No Duplicazioni**: Configurazione per `styleClass` unica, non per singola carta
- **Smart Workflow**: CLI → Web con preview automatica

## 🏗️ Piano di Implementazione FINALE

### Phase 1: Architettura e Moduli Base (2-3 ore)

#### 1.1 Creazione Modulo StyleCustomization
```
modules/
└── styles/
    ├── StyleCustomizer.js     # Core logic per generazione CSS
    ├── StyleCollector.js      # Raccoglie styleClass uniche da un mazzo
    └── CSSGenerator.js        # Genera CSS finale da configurazioni
```

#### 1.2 Strutture Dati FINALI
```javascript
// File .styles.json formato APPROVATO:
{
    "styleClass": [
        { 
            "class": "STILE-CARTA", 
            "cardTitleColor": "#ff5733",     // hex color o null
            "cardTitleBgColor": "#ffffff",   // hex color o null (NUOVO)
            "showHeroImage": true,           // boolean, default true
            "descriptionTextSize": "m"       // 'xs'|'s'|'m'|'l', default 'm'
        },
        { 
            "class": "ALTRO-STILE", 
            "cardTitleColor": null, 
            "cardTitleBgColor": null,
            "showHeroImage": false, 
            "descriptionTextSize": "s" 
        }
    ]
}
```

#### 1.3 Validazione Anti-XSS RIGOROSA
```javascript
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function validateHexColor(color) {
    return color === null || HEX_COLOR_REGEX.test(color);
}

function validateStyleConfig(config) {
    return validateHexColor(config.cardTitleColor) &&
           validateHexColor(config.cardTitleBgColor) &&
           typeof config.showHeroImage === 'boolean' &&
           ['xs', 's', 'm', 'l'].includes(config.descriptionTextSize);
}
```

### Phase 2: Interfacce Utente (3-4 ore)

#### 2.1 CLI Interface Enhancement FINALE
Workflow APPROVATO:
```bash
# Step 1: Generazione normale
node kpi-card-generator.js generate -i deck.json -o output.pdf
# Output: "✓ PDF generato. Trovate 3 styleClass uniche: GUERRIERO, MAGO, LADRO"
# Output: "Vuoi personalizzare gli stili? [y/N]"

# Step 2: Modalità esperta (opzionale)
node kpi-card-generator.js styles -i deck.json --expert
# Flusso interattivo per configurare ogni styleClass
# Salvataggio automatico in deck.styles.json
# Backup automatico di configurazione precedente

# Step 3: Rigenerazione con stili
node kpi-card-generator.js generate -i deck.json -o output.pdf --apply-styles
# Legge deck.styles.json e applica CSS personalizzato
```

**Modalità Esperta CLI Features:**
- Prompt interattivo per ogni styleClass unica
- Validazione input real-time (hex colors, enum values)
- Backup automatico configurazione precedente
- Anteprima CSS generato (opzionale)
- Conferma applicazione stili
- NO preview HTML (solo in Web)

#### 2.2 API Endpoints FINALE
API Integration APPROVATA:
```javascript
// Endpoints da implementare
GET    /api/decks/{id}/styleclasses    // Lista styleClass uniche del deck
GET    /api/decks/{id}/styles          // Configurazioni stili attuali
POST   /api/decks/{id}/styles          // Salva/aggiorna configurazioni stili
DELETE /api/decks/{id}/styles          // Reset configurazioni a default
GET    /api/decks/{id}/preview         // Preview HTML con stili applicati (NUOVO)
```

**Comportamento API:**
- Stili sempre salvati nel JSON del deck principale (WEB-only)
- CLI può scegliere tra file separato o integrato nel deck
- Validazione rigorosa input con regex anti-XSS  
- Backup automatico prima di modifiche

#### 2.3 Web Interface FINALE
**Features Approvate:**
- **Post-Save Only**: Personalizzazione disponibile SOLO dopo salvataggio deck
- **Modalità Esperta**: Toggle "Personalizza Stili" nascosta di default
- **Color Picker**: Separato per text color + background color
- **Real-time Preview**: Anteprima HTML aggiornata automaticamente
- **Smart Defaults**: Colori suggeriti basati su nome styleClass
- **Single File**: Tutto salvato nel JSON del deck, no file esterni

### Phase 3: Integrazione con Rendering (2-3 ore)

#### 3.1 Template Enhancement
- Modificare `card-template.html` per supportare stili dinamici
- Aggiungere placeholder per CSS personalizzato: `{{customCSS}}`
- Assicurare compatibilità con stili esistenti

#### 3.2 CardRenderer Integration
- Estendere `CardRenderer` per accettare configurazioni stili
- Integrare `CSSGenerator` nel processo di rendering
- Aggiornare metodi di rendering HTML e PDF

#### 3.3 Storage & Persistence
- Estendere `FileStore` per gestire file `.styles.json`
- Implementare versioning delle configurazioni stili
- Cache delle configurazioni per performance

### Phase 4: Testing e Documentazione (1-2 ore)

#### 4.1 Test Suite
- Unit test per `StyleCustomizer`, `StyleCollector`, `CSSGenerator`
- Integration test per flusso completo CLI
- API test per nuovi endpoints
- Web interface test per personalizzazione

#### 4.2 Documentazione
- Aggiornare README con esempi di utilizzo stili
- Documentare API endpoints
- Creare guida utente per personalizzazione web

## 🔧 Dettagli Tecnici

### Generazione CSS Dinamico
```javascript
// Esempio output CSS generato
const generatedCSS = `
/* Stili per STILE-CARTA */
.STILE-CARTA .card-title {
    color: #ff5733;
}
.STILE-CARTA .card-type-banner {
    background-color: #ff5733;
    color: white;
}
.STILE-CARTA .card-description-box .main-text {
    font-size: 7pt !important;
    line-height: 1.3 !important;
}

/* Stili per ALTRO-STILE */
.ALTRO-STILE .card-image-area {
    display: none !important;
}
`;
```

### Flusso di Lavoro Proposto
1. **Generazione mazzo** → Identifica `styleClass` uniche
2. **Configurazione stili** → Interfaccia per personalizzare ogni classe
3. **Applicazione stili** → CSS dinamico iniettato nel template
4. **Output finale** → PDF/HTML con stili personalizzati applicati

## ✅ PRO dell'approccio

### 🎨 **User Experience**
- **Flessibilità**: Ogni `styleClass` può avere stili completamente diversi
- **Semplicità**: Solo 3 opzioni chiare e intuitive per utente
- **Anteprima**: Feedback visivo immediato delle modifiche
- **Non-invasivo**: Non richiede conoscenza CSS dall'utente

### 🏗️ **Architettura**
- **Modulare**: Nuovo modulo `styles/` separato dal resto
- **Estensibile**: Facile aggiungere nuove opzioni di personalizzazione
- **Cross-platform**: Funziona su CLI, API e Web
- **Backwards compatible**: Non rompe funzionalità esistenti

### 📈 **Valore Business**
- **Differenziazione**: Feature unica rispetto a soluzioni standard
- **Produttività**: Riduce tempo di personalizzazione manuale
- **Professionalità**: Output visivamente coerente e curato

## ⚠️ CONTRO e Sfide

### 🔧 **Complessità Tecnica**
- **CSS Injection Security**: Rischio XSS se non gestito correttamente
- **CSS Conflicts**: Potenziali conflitti tra stili personalizzati e default
- **Performance**: Generazione CSS dinamico può rallentare rendering
- **Testing Complexity**: Molte combinazioni di stili da testare

### 👥 **User Experience**
- **Learning Curve**: Utenti devono capire il concetto di `styleClass`
- **Configuration Overhead**: Processo potenzialmente lungo per mazzi con molte classi
- **Color Theory**: Utenti potrebbero scegliere combinazioni non ottimali

### 🏗️ **Manutenzione**
- **Template Coupling**: Stretto accoppiamento tra template HTML e generatore CSS
- **Version Management**: Gestione versioni configurazioni stili complessa
- **Migration**: Potrebbe richiedere migration di configurazioni esistenti

## 🎯 Raccomandazioni

### Implementazione Graduale
1. **MVP**: Iniziare solo con CLI e funzionalità base
2. **Validation**: Implementare validazione rigorosa input CSS
3. **Default Sensible**: Provide default di alta qualità
4. **Documentation**: Esempi chiari e best practices

### Mitigazione Rischi
- **CSS Sanitization**: Validare tutti gli input colore (hex pattern)
- **Performance Optimization**: Cache CSS generato
- **Fallback Strategy**: Default styles se configurazione fallisce
- **Error Handling**: Gestione graceful errori generazione CSS

## 📊 Metriche di Successo
- **Functionality**: 100% dei test passano
- **Performance**: < 100ms aggiuntivi per generazione CSS
- **Usability**: Flusso completo CLI < 5 minuti per 10 styleClass
- **Quality**: Output CSS valido W3C compliant

---

## 🤔 Domande per Discussione

1. **Scope**: Iniziare con MVP solo CLI o implementare subito anche Web/API?
2. **Storage**: Salvare configurazioni in file separati o integrato nel JSON mazzo?
3. **Color Input**: Solo hex colors o supportare anche RGB/named colors?
4. **Advanced Features**: Considerare altre personalizzazioni future (fonts, borders, etc.)?
5. **Migration Strategy**: Come gestire mazzi esistenti senza configurazioni stili?

**Tempo stimato totale: 8-12 ore**
**Complessità: Media-Alta**
**Impact: Alto (nuova feature differenziante)**

---

## ✅ STATO IMPLEMENTAZIONE ATTUALE (2025-09-10)

### ✅ Completato:
1. **Web Interface Fix**: Risolto il problema critico che impediva la creazione/modifica deck
   - **Problema**: Middleware `validateAndSanitizeDeck` non aspettava la sanitizzazione asincrona
   - **Soluzione**: Reso middleware async e corretto l'await
   - **Risultato**: Web interface ora funzionante ✅ (deck creation confermata)

2. **Modules Base Architecture**: Implementati tutti e 3 i moduli core
   - ✅ `modules/styles/StyleCustomizer.js` - Logica centrale validazione stili
   - ✅ `modules/styles/StyleCollector.js` - Raccolta styleClass uniche da deck
   - ✅ `modules/styles/CSSGenerator.js` - Generazione CSS sicura da configurazioni

3. **Validation Anti-XSS**: Sistema completo di validazione sicurezza
   - ✅ Regex hex colors: `/^#[0-9A-Fa-f]{6}$/`
   - ✅ Validazione text sizes: `['xs', 's', 'm', 'l']`
   - ✅ Validazione boolean `showHeroImage`
   - ✅ Sanitizzazione input con fallback sicuri

4. **API Foundation**: Server e proxy configurati correttamente
   - ✅ API server: http://localhost:3000 ✅
   - ✅ Web interface: http://localhost:5173 ✅ 
   - ✅ Proxy Vite corretto per /api -> localhost:3000
   - ✅ Endpoints stili funzionanti: `/api/v1/decks/{id}/styles*`

### 📊 Sistema Implementato:
**Struttura Dati FINALE** (come da specifiche):
```javascript
{
    "styleClass": [
        { 
            "class": "STILE-CARTA", 
            "cardTitleColor": "#ff5733",     // hex color o null
            "cardTitleBgColor": "#ffffff",   // hex color o null 
            "showHeroImage": true,           // boolean, default true
            "descriptionTextSize": "m"       // 'xs'|'s'|'m'|'l', default 'm'
        }
    ]
}
```

**CSS Generato** (esempio):
```css
/* Stili per STILE-CARTA */
.STILE-CARTA .card-title {
    color: #ff5733;
}
.STILE-CARTA .card-type-banner {
    background-color: #ffffff;
    color: #ff5733;
}
.STILE-CARTA .card-description-box .main-text {
    font-size: 8pt !important;
    line-height: 1.4 !important;
}
```

### 🔄 Prossimi Passi:
1. **CLI Enhancement**: Implementare workflow CLI interattivo
2. **Web UI**: Completare interfaccia personalizzazione stili web
3. **Template Integration**: Modificare `card-template.html` per supportare stili dinamici
4. **Testing**: Test suite per tutti i moduli stili
5. **Documentation**: Guide utente per personalizzazione

### 🚀 Sistema Attuale Funzionante:
- ✅ Web interface: creazione/modifica deck operativa
- ✅ API: tutti endpoint stili disponibili e testati
- ✅ Moduli stili: validazione e generazione CSS sicura
- ✅ Architettura: pronta per integrazione completa

**Stato: FOUNDATION COMPLETA - Pronto per implementazione UI**
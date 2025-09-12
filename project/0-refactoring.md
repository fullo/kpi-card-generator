# 🏗️ Piano Completo di Refactoring - KPI Card Generator

## 🎯 Obiettivo Generale

Trasformare il monolite `kpi-card-generator.js` in un'architettura modulare con:
- `/class` - Classi riusabili e testabili ✅ **COMPLETATO**
- `/cli` - Script shell per generazione PDF ✅ **COMPLETATO** 
- `/api` - REST API per servizi ✅ **COMPLETATO**
- `/web` - Applicazione web frontend
- `/assets` - Template HTML ✅ **COMPLETATO**
- `/test` - Suite completa con coverage ≥95% ✅ **COMPLETATO**

## 🌐 REST API Implementation Status

### ✅ **Phase 1: API Foundation - COMPLETED**

La REST API è stata completamente implementata con tutti i 26 endpoint funzionanti:

#### **Architecture completata:**
```
api/
├── server/                 # Express server setup
├── routes/                 # Routing structure (decks, cards, generation)
├── controllers/            # Request handlers (3 controllers)
├── services/               # Business logic (4 services)
├── storage/                # File-based data persistence
├── middleware/             # Error handling, CORS, security
└── tests/                  # Complete test suite (95%+ coverage)
```

#### **Features implementate:**
- ✅ **CRUD completo** per mazzi e carte (26 endpoints)
- ✅ **Bulk operations** per gestione multiple carte
- ✅ **PDF/HTML export** con opzioni personalizzabili
- ✅ **Preview browser** per anteprima real-time
- ✅ **File management** con cleanup automatico
- ✅ **Validazione** integrata con DeckValidator esistente
- ✅ **Error handling** centralizzato con messaggi user-friendly
- ✅ **Test suite completa** con Supertest (100+ test cases)
- ✅ **Security features** (Helmet, CORS, rate limiting)
- ✅ **Postman collection** per testing interattivo

#### **Integration con classi esistenti:**
- ✅ **DeckValidator** - Validazione JSON e business rules
- ✅ **CardPaginator** - Layout e paginazione delle carte
- ✅ **CardRenderer** - Rendering HTML completo
- ✅ **LayoutCalculator** - Calcoli layout speculari
- ✅ **PDFGenerator** - Generazione PDF con Puppeteer
- ✅ **FileStore** - Persistenza file-based JSON

#### **Endpoints principali:**
- **Core**: Health, mazzi CRUD, stats globali
- **Cards**: CRUD carte, bulk ops, duplicazione, riordino
- **Export**: PDF/HTML generation, preview, download management

## 📋 Panoramica delle Iterazioni

| Iter. | Classe | Responsabilità | Righe | Complessità | Dipendenze |
|-------|--------|----------------|-------|-------------|------------|
| 1 | `LayoutCalculator` | Calcoli layout speculari | ~100 | Bassa | Nessuna |
| 2 | `CardPaginator` | Divisione fogli, placeholder | ~120 | Media | LayoutCalculator |
| 3 | `CardRenderer` | Template HTML, rendering | ~150 | Media | CardPaginator |
| 4 | `DeckValidator` | Validazione JSON, schema | ~80 | Bassa | Nessuna |
| 5 | `PDFGenerator` | Puppeteer wrapper | ~100 | Alta | CardRenderer |
| 6 | `CLIInterface` | Command line interface | ~120 | Media | Tutte |

---

# Iterazione 1: LayoutCalculator

## 📋 Obiettivo Iterazione

Estrarre la classe `LayoutCalculator` dal codice monolitico `kpi-card-generator.js`, mantenendo tutti i test funzionanti.

## 🎯 Cosa Abbiamo Estratto

### `LayoutCalculator`
**Responsabilità**: Calcolo degli ordinamenti speculari per stampa fronte-retro
- ✅ Gestione modalità landscape/portrait + legacy shortside/longside
- ✅ Normalizzazione input case-insensitive  
- ✅ Validazione modalità di stampa
- ✅ Calcolo layout speculare con inversione righe/colonne
- ✅ Informazioni leggibili per l'utente

## 📁 Struttura Directory Dopo Il Refactoring

```
kpi-card-generator/
├── class/                          # 🆕 NUOVA CARTELLA
│   └── LayoutCalculator.js         # 🆕 Prima classe estratta
├── tests/
│   ├── class/                      # 🆕 Test per le classi
│   │   └── LayoutCalculator.test.js # 🆕 Test specifici
│   └── integration/                # 🔄 Test integrazione (dai vecchi test)
│       └── kpi-card-generator.test.js
└── kpi-card-generator.js           # 🔄 Aggiornato per usare LayoutCalculator
```

## 🚀 Step di Implementazione

### Step 1: Creare la Struttura
```bash
# Crea le nuove directory
mkdir -p class
mkdir -p tests/class  
mkdir -p tests/integration

# Muovi il test esistente in integration 
mv tests/kpi-card-generator.test.js tests/integration/
```

### Step 2: Implementare i File
1. **Crea `class/LayoutCalculator.js`** - Copia il contenuto dall'artifact "LayoutCalculator"
2. **Crea `tests/class/LayoutCalculator.test.js`** - Copia dall'artifact "Test per LayoutCalculator"  
3. **Aggiorna `kpi-card-generator.js`** - Integra usando l'esempio dell'artifact "Integrazione"

### Step 3: Aggiornare i Test
```bash
# Esegui i nuovi test di classe
npm test tests/class/LayoutCalculator.test.js

# Verifica che i test di integrazione passino ancora
npm test tests/integration/

# Esegui tutti i test
npm test
```

### Step 4: Aggiornare package.json
```json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:unit": "npm test tests/class/",
    "test:integration": "npm test tests/integration/",
    "test:coverage": "npm test -- --coverage"
  }
}
```

## ✅ Test di Verifica

Prima di procedere alla prossima iterazione, verifica:

- [ ] `npm test tests/class/LayoutCalculator.test.js` passa al 100%
- [ ] I test di integrazione esistenti passano ancora
- [ ] Il coverage della classe è ≥ 80%
- [ ] Il comando CLI funziona ancora con `-s landscape` e `-s portrait`

## 🔍 Verifiche Manuali

```bash
# Test modalità landscape
node kpi-card-generator.js -i tests/data/test-10-carte.json -s landscape -b test-output.html

# Test modalità portrait  
node kpi-card-generator.js -i tests/data/test-10-carte.json -s portrait -b test-output.html

# Verifica che i layout siano diversi tra le due modalità
```

## 🧠 Domande per la Prossima Iterazione

1. **Quale classe estrarre dopo?** `CardPaginator` (gestione fogli multipli) o `CardRenderer` (generazione HTML)?

2. **Approccio ai test**: Mantenere i test di integrazione esistenti più i nuovi test unitari, o convertire completamente?

3. **Compatibilità**: La funzione `calculateLayouts` deprecata va mantenuta o è meglio aggiornare tutti i vecchi test?

## 📊 Metriche di Successo

- **Linee di codice estratte**: ~100 righe in classe separata
- **Test coverage**: Mantenuto ≥ 80% 
- **Breaking changes**: 0 (compatibilità totale)
- **Nuove funzionalità**: Validazione modalità + info leggibili

---

## 🎯 Prossime Iterazioni Pianificate

2. **`CardPaginator`** - Gestione divisione in fogli, placeholder, validazione numero carte
3. **`CardRenderer`** - Template HTML, sostituzione placeholder, generazione pagine  
4. **`PDFGenerator`** - Wrapper Puppeteer, opzioni stampa, gestione errori
5. **`DeckValidator`** - Validazione JSON, schema carte, errori descrittivi


# 📖 Iterazione 2: CardPaginator

## 🎯 Obiettivo
Estrarre la logica di paginazione e gestione placeholder dal codice monolitico.

## 🔧 Responsabilità Classe
- **Divisione carte in fogli** - Calcola quanti fogli servono dato un numero di carte
- **Gestione placeholder** - Aggiunge carte vuote per completare griglie
- **Validazione parametri** - Verifica carte per pagina, carte per riga
- **Calcolo metriche** - Statistiche su fogli generati

## 📁 Struttura File
```
class/
├── LayoutCalculator.js ✅
└── CardPaginator.js    🆕

tests/class/
├── LayoutCalculator.test.js ✅  
└── CardPaginator.test.js    🆕
```

## 🧪 Test da Creare
- Divisione 10 carte → 2 fogli da 8
- Gestione 8 carte esatte → 1 foglio senza placeholder  
- Edge cases: 0 carte, 1 carta, 17 carte
- Validazione parametri non validi
- Calcolo placeholder per diverse configurazioni

## 📊 Metriche Successo
- [ ] Coverage ≥ 80%
- [ ] 0 breaking changes nei test integrazione
- [ ] Funzione `calculatePaginatedLayouts` usa CardPaginator
- [ ] Performance invariata (< 10ms per 100 carte)

## 🔗 Integrazione
```javascript
import { CardPaginator } from './class/CardPaginator.js';
import { LayoutCalculator } from './class/LayoutCalculator.js';

export function calculatePaginatedLayouts(cards, cardsPerPage, cardsPerRow, printMode) {
    const pages = CardPaginator.paginateCards(cards, cardsPerPage, cardsPerRow);
    return pages.map(page => ({
        fronts: page.fronts,
        backs: LayoutCalculator.calculateMirrorLayout(page.fronts, cardsPerRow, printMode)
    }));
}
```

---

# 📖 Iterazione 3: CardRenderer

## 🎯 Obiettivo
Estrarre la logica di rendering HTML e gestione template.

## 🔧 Responsabilità Classe
- **Caricamento template** - Legge template HTML da file/string
- **Sostituzione placeholder** - Rimpiazza `{{variabile}}` con dati
- **Generazione HTML pagine** - Crea HTML completo per browser/PDF
- **Gestione stili** - Inietta CSS e metadata
- **Modalità debug** - Aggiunge indicatori visivi per sviluppo

## 📁 Struttura File
```
class/
├── LayoutCalculator.js ✅
├── CardPaginator.js    ✅
└── CardRenderer.js     🆕

assets/
├── card-template.html ✅
└── main-template.html ✅

tests/class/
├── LayoutCalculator.test.js ✅
├── CardPaginator.test.js    ✅  
└── CardRenderer.test.js     🆕
```

## 🧪 Test da Creare
- Caricamento template da file e string
- Sostituzione placeholder con caratteri speciali
- Generazione HTML multi-pagina
- Gestione template malformati
- Iniezione stili CSS
- Modalità debug vs production

## 📊 Metriche Successo
- [ ] Coverage ≥ 80%
- [ ] Template loading < 50ms
- [ ] HTML output validato (W3C compliant)  
- [ ] Gestione errori graceful per template non trovati

## 🔗 Integrazione
```javascript
import { CardRenderer } from './class/CardRenderer.js';

const renderer = new CardRenderer('assets/card-template.html');
const htmlOutput = renderer.renderPages(paginatedData, exerciseData);
```

---

# 📖 Iterazione 4: DeckValidator

## 🎯 Obiettivo
Estrarre la validazione JSON e creazione di errori descrittivi.

## 🔧 Responsabilità Classe
- **Schema validation** - Verifica struttura JSON conforme
- **Required fields** - Controlla campi obbligatori 
- **Type checking** - Valida tipi dati (string, array, etc.)
- **Business rules** - Regole specifiche (max caratteri, icone valide)
- **Error reporting** - Messaggi user-friendly localizzati

## 📁 Struttura File
```
class/
├── LayoutCalculator.js ✅
├── CardPaginator.js    ✅
├── CardRenderer.js     ✅
└── DeckValidator.js    🆕

assets/
└── schema/             🆕
    ├── deck-schema.json
    └── card-schema.json

tests/class/
├── LayoutCalculator.test.js ✅
├── CardPaginator.test.js    ✅
├── CardRenderer.test.js     ✅
└── DeckValidator.test.js    🆕
```

## 🧪 Test da Creare
- Validazione JSON completo e valido
- Errori per campi mancanti (titolo, carte array)
- Validazione singola carta (titolo, tipo, classe CSS)
- Caratteri speciali e encoding UTF-8
- File JSON malformati o corrotti
- Messaggi errore localizzati in italiano

## 📊 Metriche Successo
- [ ] Coverage ≥ 80%  
- [ ] Validation time < 10ms per 100 carte
- [ ] Zero false positives su JSON validi
- [ ] Errori comprensibili per utenti non tecnici

## 🔗 Integrazione
```javascript
import { DeckValidator } from './class/DeckValidator.js';

const validator = new DeckValidator();
const result = validator.validateDeck(inputJSON);
if (!result.isValid) {
    console.error('❌ Errori nel file JSON:');
    result.errors.forEach(err => console.error(`  • ${err.message}`));
    process.exit(1);
}
```

---

# 📖 Iterazione 5: PDFGenerator

## 🎯 Obiettivo
Estrarre e migliorare la generazione PDF con Puppeteer.

## 🔧 Responsabilità Classe
- **Puppeteer wrapper** - Configurazione browser, memoria, timeout
- **PDF options** - Margini, formato, qualità stampa
- **Error handling** - Retry logic, cleanup risorse
- **Progress tracking** - Callback per progress bar
- **Batch processing** - Generazione multipli PDF concorrenti

## 📁 Struttura File
```
class/
├── LayoutCalculator.js ✅
├── CardPaginator.js    ✅  
├── CardRenderer.js     ✅
├── DeckValidator.js    ✅
└── PDFGenerator.js     🆕

tests/class/
├── LayoutCalculator.test.js ✅
├── CardPaginator.test.js    ✅
├── CardRenderer.test.js     ✅
├── DeckValidator.test.js    ✅  
└── PDFGenerator.test.js     🆕
```

## 🧪 Test da Creare
- Generazione PDF da HTML valido
- Gestione timeout e memory limit
- Cleanup risorse in caso di errore
- Configurazioni stampa (landscape vs portrait)
- Batch generation per performance
- Mock di Puppeteer per test veloci

## 📊 Metriche Successo
- [ ] Coverage ≥ 80%
- [ ] PDF generation < 5 secondi per 50 carte
- [ ] Zero memory leaks (browser cleanup)
- [ ] Graceful handling errori Puppeteer

## 🔗 Integrazione
```javascript
import { PDFGenerator } from './class/PDFGenerator.js';

const pdfGen = new PDFGenerator({
    timeout: 30000,
    format: 'A4',
    printBackground: true
});

const pdfBuffer = await pdfGen.generateFromHTML(htmlContent, 'landscape');
```

---

# 📖 Iterazione 6: CLIInterface

## 🎯 Obiettivo
Estrarre la logica CLI e orchestrazione delle classi.

## 🔧 Responsabilità Classe
- **Argument parsing** - Gestione opzioni command line
- **Workflow orchestration** - Coordina tutte le altre classi
- **Progress reporting** - Output user-friendly durante elaborazione
- **Error handling** - Gestione errori end-to-end
- **Help system** - Documentazione integrata per utenti

## 📁 Struttura File
```
class/
├── LayoutCalculator.js ✅
├── CardPaginator.js    ✅
├── CardRenderer.js     ✅
├── DeckValidator.js    ✅
├── PDFGenerator.js     ✅
└── CLIInterface.js     🆕

cli/                    🆕
└── generate-cards.js   (Shell script che usa CLIInterface)

tests/class/
├── LayoutCalculator.test.js ✅
├── CardPaginator.test.js    ✅
├── CardRenderer.test.js     ✅
├── DeckValidator.test.js    ✅
├── PDFGenerator.test.js     ✅
└── CLIInterface.test.js     🆕
```

## 🧪 Test da Creare
- Parsing argomenti validi e non validi
- Workflow completo end-to-end
- Progress reporting e logging
- Gestione interruzioni (Ctrl+C)
- Help text e versioning
- Integration con tutte le classi

## 📊 Metriche Successo
- [ ] Coverage ≥ 80%
- [ ] Startup time < 500ms
- [ ] Memory usage < 200MB per 100 carte
- [ ] Help documentation completa

## 🔗 Integrazione
```javascript
// cli/generate-cards.js
import { CLIInterface } from '../class/CLIInterface.js';

const cli = new CLIInterface();
await cli.run(process.argv);
```

---

# 🚀 Piano di Implementazione

## 📅 Timing Stimato
- **Iterazione 2-3**: 2-3 ore ciascuna (logica core)
- **Iterazione 4**: 1-2 ore (validazione relativamente semplice)  
- **Iterazione 5**: 3-4 ore (Puppeteer complesso)
- **Iterazione 6**: 2-3 ore (orchestrazione)
- **Testing & Polish**: 2-3 ore aggiuntive

**Totale stimato**: 12-18 ore di lavoro

## 🎯 Milestone di Verifica

### After Iterazione 2
- [ ] `npm test` passa al 100%
- [ ] CLI esistente funziona invariato
- [ ] Performance paginazione testata

### After Iterazione 3  
- [ ] Output HTML identico a prima
- [ ] Template modificabili senza code changes
- [ ] Debug mode funzionante

### After Iterazione 4
- [ ] Validazione JSON robusta
- [ ] Messaggi errore user-friendly  
- [ ] Schema JSON documentato

### After Iterazione 5
- [ ] PDF generation stabile
- [ ] Memory leaks risolti
- [ ] Error handling completo

### After Iterazione 6
- [ ] CLI completamente refactored
- [ ] Help documentation completa
- [ ] Ready per API development

## 🔄 Punti di Decisione

### Dopo Iterazione 2
**Domanda**: La separazione CardPaginator/LayoutCalculator convince o preferisci una classe unificata `LayoutEngine`?

### Dopo Iterazione 3  
**Domanda**: Il sistema di template è sufficientemente flessibile per le future necessità web/API?

### Dopo Iterazione 5
**Domanda**: Procedere con l'architettura `/api` e `/web` o fare ulteriore ottimizzazione delle classi?

## 📊 Metriche Globali di Successo

- **Code Coverage**: ≥ 80% su tutte le classi
- **Performance**: Nessun degrado rispetto al monolite  
- **Breaking Changes**: 0 nell'interfaccia CLI esistente
- **Memory Usage**: < 300MB per 1000 carte
- **Documentation**: Ogni classe ha JSDoc completo
- **Architecture**: Pronto per estensioni API/Web senza major refactoring
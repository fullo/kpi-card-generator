# **Generatore di Carte KPI per Workshop** 🎯

Generatore basato su Node.js per creare mazzi di carte da gioco personalizzate per workshop interattivi su Metriche e Key Performance Indicators (KPI).

**🆕 Versione 3.0** - Architettura modulare completamente rifattorizzata con nuovi comandi CLI!

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![ES Modules](https://img.shields.io/badge/ES-Modules-yellow.svg)](https://nodejs.org/api/esm.html)
[![Test Coverage](https://img.shields.io/badge/Coverage-90%25-brightgreen.svg)](#test-coverage)

## **✨ Nuove Funzionalità v3.0**

- 🏗️ **Architettura modulare** con 6 classi specializzate
- 🔧 **Nuovi comandi CLI**: `generate`, `validate`, `optimize`, `info`
- 🧪 **Test suite completa** (90+ test unitari + integrazione)
- 🌍 **Modalità estese**: `portrait`/`landscape` + legacy `short`/`long`
- 📊 **Validazione JSON avanzata** con report dettagliati
- ⚡ **Ottimizzazione automatica** delle configurazioni
- 🎨 **Template caching** e rendering ottimizzato

## **📦 Installazione**

```bash
git clone https://github.com/fullo/kpi-card-generator.git
cd kpi-card-generator
npm install
```

## **🚀 Guida Rapida**

### **Nuovo CLI Moderno (Raccomandato)**

```bash
# Genera carte (PDF + HTML)
node cli/generate-cards.js generate -i tests/data/test-10-carte.json -o carte.pdf -b carte.html -f landscape

# Valida file JSON
node cli/generate-cards.js validate -i carte.json --strict

# Ottimizza configurazione
node cli/generate-cards.js optimize --cards 25

# Info sistema
node cli/generate-cards.js info --system --templates
```

### **CLI Legacy (Compatibilità)**

```bash
# Funziona ancora, ma con warnings di deprecazione
node kpi-card-generator.js generate -i carte.json -o carte.pdf -f portrait
```

## **🎮 Comandi Disponibili**

### **`generate` - Generazione Carte**

Genera carte da un file JSON con tutte le opzioni avanzate.

```bash
node cli/generate-cards.js generate [opzioni]
```

| Opzione | Alias | Descrizione | Default |
|---------|-------|-------------|---------|
| `-i, --input <file>` | | **Obbligatorio** - File JSON con dati carte | |
| `-o, --output <file>` | | Genera PDF nel file specificato | |
| `-b, --browser <file>` | | Genera HTML per visualizzazione browser | |
| `-f, --flip <mode>` | | Modalità stampa: `short`/`portrait` o `long`/`landscape` | `short` |
| `--cards-per-page <n>` | | Numero carte per pagina | `8` |
| `--cards-per-row <n>` | | Numero carte per riga | `4` |
| `--validate` | | Valida JSON prima della generazione | `true` |
| `--no-char-limits` | | ⚠️ **Bypassa limite 500 caratteri per testi** | |
| `--progress` | | Mostra progresso durante generazione | `true` |
| `-v, --verbose` | | Output dettagliato per debugging | |

**Esempi:**
```bash
# Generazione completa con validazione
node cli/generate-cards.js generate -i esercizio.json -o carte.pdf -b anteprima.html -f landscape --verbose

# Solo PDF, configurazione personalizzata
node cli/generate-cards.js generate -i carte.json -o output.pdf --cards-per-page 6 --cards-per-row 2

# Generazione con testi lunghi (bypassa limite 500 caratteri)
node cli/generate-cards.js generate -i carte-dettagliate.json -o output.pdf --no-char-limits

# Generazione rapida senza validazione
node cli/generate-cards.js generate -i carte.json -b preview.html --no-validate
```

### **`validate` - Validazione JSON**

Valida un file JSON delle carte senza generare output.

```bash
node cli/generate-cards.js validate -i carte.json [opzioni]
```

| Opzione | Descrizione |
|---------|-------------|
| `-i, --input <file>` | **Obbligatorio** - File JSON da validare |
| `--strict` | Validazione rigorosa con controlli extra |
| `--no-char-limits` | ⚠️ **Bypassa il limite di 500 caratteri per campo testo** |
| `--report <file>` | Salva report validazione in file |

**Esempi:**
```bash
# Validazione base
node cli/generate-cards.js validate -i carte.json

# Validazione rigorosa con report
node cli/generate-cards.js validate -i carte.json --strict --report validation-report.txt

# Bypass limite caratteri per testi molto lunghi
node cli/generate-cards.js validate -i carte-lunghe.json --no-char-limits
```

**Output di esempio:**
```
✅ VALIDAZIONE COMPLETATA CON SUCCESSO

📊 STATISTICHE:
   • Carte totali: 25
   • Carte valide: 25
   • Titoli unici: 25
   • Tasso di validità: 100.0%

🟡 AVVERTIMENTI:
   • Carta 12: la carta ha solo il titolo, potrebbe essere troppo vuota
```

### **`optimize` - Ottimizzazione Configurazione**

Suggerisce la configurazione ottimale per un numero specifico di carte.

```bash
node cli/generate-cards.js optimize --cards <numero> [opzioni]
```

| Opzione | Descrizione |
|---------|-------------|
| `--cards <numero>` | **Obbligatorio** - Numero di carte da ottimizzare |
| `--formats <lista>` | Formati possibili separati da virgola | `4,6,8,9,10,12` |

**Esempi:**
```bash
# Ottimizzazione per 17 carte
node cli/generate-cards.js optimize --cards 17

# Con formati personalizzati
node cli/generate-cards.js optimize --cards 25 --formats "6,8,12,15"
```

**Output di esempio:**
```
🎯 Ottimizzazione per 17 carte...

📊 CONFIGURAZIONE OTTIMALE:
   • Carte per pagina: 6
   • Carte per riga: 2
   • Efficienza: 94.4%
   • Fogli totali: 3
   • Placeholder: 1

📈 DETTAGLI:
   • Righe per pagina: 3
   • Carte nell'ultimo foglio: 5
   • Spreco percentuale: 5.6%
   • Ultimo foglio completo: No
```

### **`info` - Informazioni Sistema**

Mostra informazioni di sistema e diagnostica.

```bash
node cli/generate-cards.js info [opzioni]
```

| Opzione | Descrizione |
|---------|-------------|
| `--system` | Mostra informazioni di sistema avanzate |
| `--templates` | Verifica disponibilità template |

**Esempi:**
```bash
# Informazioni base
node cli/generate-cards.js info

# Informazioni complete
node cli/generate-cards.js info --system --templates
```

## **🎨 Modalità di Stampa**

### **Modalità Supportate**

| Modalità | Alias | Comportamento | Uso Tipico |
|----------|-------|---------------|------------|
| `short` | `portrait`, `shortside` | Inverte colonne in ogni riga | Stampanti da ufficio (rilegatura lato lungo) |
| `long` | `landscape`, `longside` | Inverte ordine delle righe | Stampanti domestiche (rilegatura lato corto) |

### **Esempi Visivi**

**Modalità Short/Portrait:**
```
Fronte:              Retro:
C1  C2  C3  C4   →   C4  C3  C2  C1
C5  C6  C7  C8   →   C8  C7  C6  C5
```

**Modalità Long/Landscape:**
```
Fronte:              Retro:
C1  C2  C3  C4   →   C5  C6  C7  C8
C5  C6  C7  C8   →   C1  C2  C3  C4
```

### **Test della Modalità Corretta**

```bash
# Test rapido modalità portrait
node cli/generate-cards.js generate -i tests/data/test-6-carte.json -b test-portrait.html -f portrait

# Test rapido modalità landscape  
node cli/generate-cards.js generate -i tests/data/test-6-carte.json -b test-landscape.html -f landscape
```

## **📄 Layout Personalizzati**

### **Una Carta per Pagina**

Per generare PDF con **una carta per pagina** (ideale per presentazioni o studio individuale):

#### **Metodo 1: Ottimizzazione Automatica**
```bash
# Vedi configurazioni disponibili per le tue carte  
node cli/generate-cards.js optimize --cards 6

# Per forzare 1 carta per pagina usa la configurazione diretta
node cli/generate-cards.js generate \
  -i tue-carte.json \
  -o carte-singole.pdf \
  --cards-per-page 1 \
  --cards-per-row 1 \
  -f portrait
```

#### **Metodo 2: Configurazione Diretta**
```bash
# Generazione diretta con parametri personalizzati
node cli/generate-cards.js generate \
  -i tests/data/test-6-carte.json \
  -o esempio-singole.pdf \
  --cards-per-page 1 \
  --cards-per-row 1 \
  -f portrait
```

#### **Risultato**
- **6 carte** → **12 pagine PDF** (6 fronti + 6 retri)
- Ogni carta occupa un'intera pagina
- Layout ottimizzato per visualizzazione/stampa individuale

### **Altri Layout Personalizzati**

```bash
# 2 carte per pagina (formato brochure)
node cli/generate-cards.js generate -i carte.json -o output.pdf \
  --cards-per-page 2 --cards-per-row 1 -f portrait

# 6 carte per pagina (layout compatto)  
node cli/generate-cards.js generate -i carte.json -o output.pdf \
  --cards-per-page 6 --cards-per-row 3 -f landscape

# 12 carte per pagina (foglio riassuntivo)
node cli/generate-cards.js generate -i carte.json -o output.pdf \
  --cards-per-page 12 --cards-per-row 4 -f landscape
```

### **Parametri Layout**

| Parametro | Descrizione | Valori Tipici |
|-----------|-------------|---------------|
| `--cards-per-page` | Numero totale carte per foglio | `1`, `2`, `4`, `6`, `8`, `12` |
| `--cards-per-row` | Carte per riga | `1`, `2`, `3`, `4` |
| `-f, --format` | Orientamento pagina | `portrait`, `landscape` |

💡 **Suggerimento**: Usa sempre `node cli/generate-cards.js optimize --cards <N>` per trovare la configurazione ottimale per il tuo numero di carte.

## **📁 Struttura del Progetto**

```
kpi-card-generator/
├── class/                    # 🆕 Classi modulari
│   ├── LayoutCalculator.js   # Calcoli layout speculari
│   ├── CardPaginator.js      # Gestione paginazione  
│   ├── CardRenderer.js       # Rendering HTML/template
│   ├── DeckValidator.js      # Validazione JSON
│   ├── PDFGenerator.js       # Generazione PDF con Puppeteer
│   └── CLIInterface.js       # Interfaccia CLI moderna
├── cli/                      # 🆕 Script CLI
│   └── generate-cards.js     # Entry point moderno
├── tests/                    # 🆕 Test suite completa
│   ├── class/               # Test unitari per classi
│   ├── integration/         # Test di integrazione
│   └── data/               # Dati di test
├── assets/                   # Template HTML
│   ├── card-template.html   # Template carte
│   └── main-template.html   # Template pagina
└── kpi-card-generator.js     # Script legacy (compatibilità)
```

## **🧪 Testing**

### **Comandi Test**

```bash
# Tutti i test
npm test

# Solo test unitari
npm run test:unit

# Solo test integrazione  
npm run test:integration

# Con coverage
npm run test:coverage
```

### **Test Coverage**

- ✅ **LayoutCalculator**: 24 test - Layout speculari e modalità
- ✅ **CardPaginator**: 27 test - Paginazione e placeholder  
- ✅ **CardRenderer**: 39 test - Template e rendering HTML
- ✅ **Integrazione**: 9 test - Workflow completo end-to-end

## **⚙️ Configurazioni Avanzate**

### **Template Personalizzati**

```bash
# Usa template personalizzato
node cli/generate-cards.js generate -i carte.json -t custom-template.html -b output.html
```

### **Configurazione Debug**

```bash
# Abilita debug mode
DEBUG=1 node cli/generate-cards.js generate -i carte.json -b output.html --verbose
```

### **Batch Processing**

```bash
# Genera multiple varianti
for mode in portrait landscape; do
  node cli/generate-cards.js generate -i carte.json -o "carte-$mode.pdf" -f $mode
done
```

## **🔧 Sviluppo e Contribuzione**

### **Architettura Modulare**

Il progetto utilizza un'architettura moderna basata su ES6+ modules:

- **LayoutCalculator**: Algoritmi di layout speculare
- **CardPaginator**: Logica di paginazione e ottimizzazione  
- **CardRenderer**: Engine di template e rendering HTML
- **DeckValidator**: Schema validation con report dettagliati
- **PDFGenerator**: Wrapper Puppeteer ottimizzato
- **CLIInterface**: Orchestrazione e UX

### **Estensioni Future**

L'architettura è progettata per supportare:
- 🌐 **API REST**: Integrazione con `api-architect`
- ⚛️ **Frontend Web**: Con React/Vue components
- 📱 **App Mobile**: Export configurazioni
- 🔄 **CI/CD**: Pipeline automatizzate

## **⚠️ Bypass Limiti Caratteri**

Per impostazione predefinita, il sistema limita la lunghezza del testo delle carte a **500 caratteri** per garantire che si adattino bene al layout di stampa.

### **Quando Usare il Bypass**

Usa `--no-char-limits` quando:
- ✅ Hai **testi dettagliati** che superano i 500 caratteri
- ✅ Stai creando **materiale di studio** con descrizioni estese
- ✅ Hai **contenuti tecnici** che richiedono spiegazioni lunghe
- ✅ Stai prototipando e vuoi **testare layout** con testi reali

### **Esempi di Utilizzo**

```bash
# Validazione con bypass
node cli/generate-cards.js validate -i carte-dettagliate.json --no-char-limits

# Generazione PDF con testi lunghi
node cli/generate-cards.js generate \
  -i workshop-completo.json \
  -o materiale-dettagliato.pdf \
  --no-char-limits \
  --cards-per-page 1 \
  --cards-per-row 1 \
  -f portrait
```

### **⚠️ Considerazioni**

- **Layout**: Testi molto lunghi potrebbero non adattarsi bene al layout standard
- **Stampa**: Considera di usare layout personalizzati (1 carta per pagina) per testi lunghi
- **Leggibilità**: Testi oltre i 500 caratteri possono risultare difficili da leggere su carte stampate

### **Combinazione con HTML Markup**

Il bypass funziona perfettamente con il markup HTML sicuro:

```json
{
  "titolo": "Carta Dettagliata",
  "testo": "<strong>Obiettivo Principale:</strong><br><br><ul><li><em>Fase 1:</em> Analisi preliminare dei requisiti e mappatura degli stakeholder coinvolti nel processo decisionale</li><li><strong>Fase 2:</strong> Implementazione delle soluzioni tecnologiche identificate durante la fase di analisi</li><li><u>Fase 3:</u> Monitoraggio e ottimizzazione continua dei processi implementati</li></ul><br><strong>Note:</strong> Questo processo richiede coordinamento tra team tecnici e di business per garantire il successo dell'implementazione."
}
```

## **📋 Schema JSON**

### **Struttura Base**

```json
{
  "titolo": "Nome dell'Esercizio",
  "sottotitolo": "Descrizione opzionale", 
  "icona_esercizio": "⭐",
  "carte": [
    {
      "titolo": "Titolo Carta",
      "icona": "📊",
      "emoji": "🎯", 
      "tipo": "Metrica",
      "testo": "Descrizione della carta",
      "flavor": "Testo aggiuntivo",
      "classe": "css-class-name"
    }
  ]
}
```

### **✨ Supporto HTML Markup**

Il sistema supporta **markup HTML sicuro** nei campi di testo delle carte per formattazione avanzata:

#### **Tag HTML Supportati**
- **Formattazione testo**: `<strong>`, `<b>`, `<em>`, `<i>`, `<italic>`, `<u>`
- **Interruzioni**: `<br>`  
- **Liste**: `<ul>`, `<ol>`, `<li>`

#### **Esempio con Markup**

```json
{
  "titolo": "Workshop <strong>Metriche KPI</strong>",
  "carte": [
    {
      "titolo": "Metrica <em>Importante</em>",
      "testo": "<strong>Obiettivo:</strong> Aumentare conversioni<br><br><ul><li><em>Target</em>: +20%</li><li><b>Scadenza</b>: Q4 2024</li><li>Owner: <u>Team Marketing</u></li></ul>",
      "flavor": "<strong>Note:</strong> Priorità <em>alta</em> ⚡"
    }
  ]
}
```

#### **Sicurezza HTML**

- ✅ **Tag sicuri** vengono renderizzati correttamente
- 🚫 **Tag pericolosi** (script, iframe, etc.) vengono automaticamente escapati  
- 📏 **Conteggio caratteri** esclude il markup per limiti di lunghezza
- 🔒 **Sanitizzazione** automatica per prevenire XSS

#### **Conteggio Caratteri Intelligente**

```bash
# Esempio: Testo con markup
"<strong>Breve</strong> <em>testo</em>" 
# → Caratteri di testo: 11 (solo "Breve testo")
# → Caratteri totali: 32 (con markup)

# La validazione usa solo i caratteri di testo visibile
node cli/generate-cards.js validate -i carte-con-html.json
```

### **Validazione Schema**

```bash
# Verifica schema con report dettagliato
node cli/generate-cards.js validate -i carte.json --strict --report schema-check.txt
```

## **🐛 Risoluzione Problemi**

### **Test che Falliscono**

```bash
# Pulisci cache e reinstalla
npm run clean
npm install

# Verifica configurazione Node.js
node --version  # Deve essere >= 18.0.0
```

### **PDF Generation Issues**

```bash
# Test sistema PDF
node cli/generate-cards.js info --system

# Genera solo HTML per debug
node cli/generate-cards.js generate -i carte.json -b debug.html --verbose
```

### **Template Errors**

```bash
# Verifica template
node cli/generate-cards.js info --templates

# Test template con dati semplici
node cli/generate-cards.js generate -i tests/data/test-6-carte.json -b template-test.html
```

## **📊 Performance**

### **Benchmark**

- **Paginazione**: < 10ms per 1000 carte
- **Rendering HTML**: < 100ms per 100 carte  
- **PDF Generation**: < 5s per 50 carte
- **Memory Usage**: < 200MB per 100 carte

### **Ottimizzazioni**

- Template caching per performance
- Lazy loading dei moduli pesanti
- Batch processing per grandi dataset
- Memory cleanup automatico

## **📜 Licenza**

### **Codice Sorgente** 
MIT License - Libero per uso commerciale e non

### **Contenuto delle Carte**
Creative Commons BY-NC-SA 4.0 - **Daruma Consulting di Francesco Fullone**

## **👨‍💻 Credits**

Sviluppato da **Francesco Fullone** per workshop su Metriche, KPI e OKR.

- 🌐 [Daruma Consulting](https://daruma.consulting)
- 📧 francesco@daruma.consulting
- 🐙 [GitHub](https://github.com/fullo)

---

**🎯 Ready per i tuoi prossimi workshop KPI!** 🚀
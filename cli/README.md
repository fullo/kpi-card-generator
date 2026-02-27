# KPI Card Generator - CLI Documentation 🖥️

**Command Line Interface for Professional KPI Card Generation**

The CLI is the **source of truth** for all card generation. All other interfaces (API and Web) derive their functionality from the CLI.

## Installation & Setup

```bash
# Install dependencies
npm install

# Verify installation
node cli/generate-cards.js --version
node cli/generate-cards.js info --system
```

## Available Commands

### 📄 `generate` - Generate PDF/HTML cards

```bash
# Basic PDF generation
node cli/generate-cards.js generate -i cards.json -o output.pdf

# Advanced options
node cli/generate-cards.js generate \
  -i tests/data/test-10-carte.json \
  -o workshop-cards.pdf \
  -f landscape \
  --cards-per-page 8 \
  --cards-per-row 4 \
  --apply-styles \
  --verbose
```

**Key Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input` | Input JSON file | Required |
| `-o, --output` | Output PDF file | Required |
| `-b, --browser` | Generate HTML instead | - |
| `-f, --flip` | Print mode: `short`/`portrait` or `long`/`landscape` | `short` |
| `--cards-per-page` | Cards per page (4, 6, 8, 9, 12) | `8` |
| `--cards-per-row` | Cards per row (2, 3, 4) | `4` |
| `--no-char-limits` | Bypass 500-character limit | `false` |
| `--apply-styles` | Apply custom CSS styles | `false` |
| `--verbose` | Detailed output | `false` |

### 📦 `batch` - Batch generation from directory

```bash
# Generate PDFs in the same directory as JSON files
node cli/generate-cards.js batch -d /path/to/json-files

# Generate PDFs in a specific output directory
node cli/generate-cards.js batch -d /path/to/json-files -o /path/to/pdf-output

# Generate both PDF and HTML
node cli/generate-cards.js batch -d /path/to/json-files -o /path/to/pdf -b /path/to/html

# With all options
node cli/generate-cards.js batch \
  -d /path/to/json-files \
  -o /path/to/output \
  -f landscape \
  --cards-per-page 6 \
  --cards-per-row 3 \
  --apply-styles \
  --verbose
```

**Key Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-d, --directory` | Input directory with JSON files | Required |
| `-o, --output` | Output directory for PDFs | Same as input directory |
| `-b, --browser [dir]` | Also generate HTML files | - |
| `-f, --flip` | Print mode: `short`/`portrait` or `long`/`landscape` | `short` |
| `--cards-per-page` | Cards per page (4, 6, 8, 9, 12) | `8` |
| `--cards-per-row` | Cards per row (2, 3, 4) | `4` |
| `--no-char-limits` | Bypass 500-character limit | `false` |
| `--apply-styles` | Apply custom CSS styles | `false` |
| `--verbose` | Detailed output | `false` |

**Behavior:**
- Scans the input directory for all `.json` files
- Generates one PDF (and optionally HTML) per JSON file
- Output files use the same base name as input (e.g. `mazzo.json` → `mazzo.pdf`)
- If `-o` is not specified, PDFs are created in the same directory as the JSON files
- Continues processing remaining files if one fails
- Prints a summary at the end with success/failure counts

**Output Example:**
```
📦 Avvio generazione batch...
📂 Trovati 3 file JSON da processare

📄 [1/3] Processando: deck-a.json
  ✅ deck-a: 10 carte, 2 fogli
📄 [2/3] Processando: deck-b.json
  ✅ deck-b: 6 carte, 1 fogli
📄 [3/3] Processando: deck-c.json
  ❌ deck-c: JSON non valido

══════════════════════════════════════════════════
📊 RIEPILOGO GENERAZIONE BATCH:
   • Totale file: 3
   • Completati: 2
   • Falliti: 1
   • Carte totali generate: 16
══════════════════════════════════════════════════
```

### ✅ `validate` - Validate JSON without generation

```bash
# Basic validation
node cli/generate-cards.js validate -i cards.json

# Strict validation with report
node cli/generate-cards.js validate \
  -i cards.json \
  --strict \
  --report validation-report.txt
```

**Options:**
- `--strict`: Additional validation checks
- `--no-char-limits`: Skip character limit validation
- `--report <file>`: Save validation report

### 🎨 `styles` - CSS Style Customization

```bash
# Interactive style editor
node cli/generate-cards.js styles -i cards.json --expert

# Show generated CSS without saving
node cli/generate-cards.js styles -i cards.json --show-css

# Reset all custom styles
node cli/generate-cards.js styles -i cards.json --reset
```

**Style Features:**
- Interactive CSS editor for `styleClass` fields
- Live preview of style changes
- Export/import custom style configurations
- Reset to default styling

### ⚡ `optimize` - Layout Optimization

```bash
# Find optimal layout for card count
node cli/generate-cards.js optimize --cards 25

# Test specific formats
node cli/generate-cards.js optimize --cards 25 --formats "6,8,9"
```

**Output Example:**
```
📊 Layout Optimization for 25 cards:
✅ 6 cards/page → 5 pages (2 cards on last page)
✅ 8 cards/page → 4 pages (1 card on last page)  
✅ 9 cards/page → 3 pages (7 cards on last page)
```

### ℹ️ `info` - System Diagnostics

```bash
# Full system information
node cli/generate-cards.js info --system --templates

# Template verification only
node cli/generate-cards.js info --templates
```

**Diagnostic Output:**
- Node.js version and ES modules support
- Puppeteer installation status
- Template file availability
- Memory and performance metrics

## Common Usage Patterns

### Workshop Preparation
```bash
# 1. Validate deck
node cli/generate-cards.js validate -i workshop-deck.json --strict

# 2. Optimize layout
node cli/generate-cards.js optimize --cards 24

# 3. Generate with custom styling
node cli/generate-cards.js generate \
  -i workshop-deck.json \
  -o workshop-cards.pdf \
  -f landscape \
  --cards-per-page 8 \
  --apply-styles
```

### Batch Processing
```bash
# 1. Validate all decks in a folder
for f in /path/to/decks/*.json; do
  node cli/generate-cards.js validate -i "$f"
done

# 2. Generate all PDFs at once
node cli/generate-cards.js batch -d /path/to/decks -o /path/to/output

# 3. Generate with landscape mode and custom styles
node cli/generate-cards.js batch -d /path/to/decks -o /path/to/output -f landscape --apply-styles
```

### Development Workflow
```bash
# 1. Generate HTML for testing
node cli/generate-cards.js generate -i dev-cards.json -b debug.html

# 2. Validate with detailed report
node cli/generate-cards.js validate -i dev-cards.json --strict --report validation.txt

# 3. Generate final PDF
node cli/generate-cards.js generate -i dev-cards.json -o final.pdf --no-char-limits
```

### Style Customization
```bash
# 1. Create custom styles interactively
node cli/generate-cards.js styles -i cards.json --expert

# 2. Preview styles without saving
node cli/generate-cards.js styles -i cards.json --show-css

# 3. Generate with custom styles
node cli/generate-cards.js generate -i cards.json -o styled-cards.pdf --apply-styles
```

## Print Mode Reference

| Mode | Alias | Best For | Layout |
|------|-------|----------|--------|
| `portrait` | `short` | Office printers | Standard binding |
| `landscape` | `long` | Home printers | Landscape binding |

## Recommended Configurations

| Use Case | Cards/Page | Cards/Row | Mode |
|----------|------------|-----------|------|
| **Workshop Standard** | 8 | 4 | Landscape |
| **Individual Study** | 1 | 1 | Portrait |
| **Summary Sheets** | 6 | 3 | Landscape |
| **Pocket Cards** | 12 | 4 | Portrait |

## Error Handling & Troubleshooting

### Common Issues

**Template Not Found:**
```bash
# Check template availability
node cli/generate-cards.js info --templates

# Use custom template
node cli/generate-cards.js generate -i cards.json -o output.pdf -t custom-template.html
```

**Memory Issues with Large Decks:**
```bash
# Generate HTML first to debug
node cli/generate-cards.js generate -i large-deck.json -b debug.html

# Use verbose mode for memory tracking
node cli/generate-cards.js generate -i large-deck.json -o output.pdf --verbose
```

**PDF Generation Fails:**
```bash
# System diagnostics
node cli/generate-cards.js info --system

# Check Puppeteer installation
npm list puppeteer
```

### Performance Tips

- **Large Decks (50+ cards)**: Use `--verbose` to monitor memory usage
- **Complex Styling**: Test with `--show-css` before applying
- **Debugging**: Always generate HTML first with `-b debug.html`
- **Validation**: Use `--strict` mode for production decks

## Legacy CLI Support

**Backward compatibility maintained:**
```bash
# Old syntax still works (with warnings)
node kpi-card-generator.js generate -i cards.json -o output.pdf -f landscape
```

## Integration with Other Interfaces

The CLI serves as the foundation for:
- **API**: Uses CLI modules for card generation
- **Web**: Calls API which uses CLI internally
- **Testing**: All test suites validate CLI functionality

For API documentation: [📖 API README](../api/README.md)  
For Web documentation: [📖 Web README](../web/README.md)  
For JSON Schema: [📖 Main README](../README.md#json-schema)

---

**🎯 Ready for your next KPI workshop!** 🚀
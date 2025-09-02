# Changelog - KPI Card Generator

## [3.1.0] - 2025-01-02

### 🎨 **New Features - HTML Markup Support & Character Limits Bypass**

#### **Safe HTML Markup in Cards**
- **HTML Sanitization**: Secure HTML markup support in card content
  - Allowed tags: `<strong>`, `<b>`, `<em>`, `<i>`, `<italic>`, `<u>`, `<br>`, `<ul>`, `<ol>`, `<li>`
  - Automatic XSS protection - dangerous tags (script, iframe, etc.) are escaped
  - Backward compatible - existing cards without HTML work unchanged

- **Smart Character Counting**: Enhanced validation system
  - Character limits now count only **visible text**, excluding HTML markup
  - Example: `<strong>Text</strong>` counts as 4 characters, not 21
  - Detailed validation messages show both text and markup lengths

#### **Enhanced CardRenderer**
- **`CardRenderer.sanitizeHtml()`**: New method for safe HTML processing
- **`CardRenderer.countTextCharacters()`**: Character counting excluding markup
- **Updated `replacePlaceholders()`**: Optional HTML support (default: enabled)
- **Template Security**: HTML sanitization integrated into template system

#### **Enhanced DeckValidator**
- **HTML-aware validation**: `countHtmlAsText` configuration option (default: true)
- **Detailed error messages**: Shows both text and markup character counts
- **Backward compatibility**: Can disable HTML counting for legacy behavior

#### **Character Limits Bypass**
- **CLI Parameter**: New `--no-char-limits` flag for both `validate` and `generate` commands
- **Flexible Validation**: Bypasses 500-character limit for card text fields when needed
- **Selective Bypass**: Only disables character length checks, maintains other validations
- **Use Cases**: Long technical descriptions, study materials, detailed specifications

### 🧪 **Testing Enhancements**
- **New test suites**: 
  - `CardRenderer-html.test.js`: 11 tests for HTML markup functionality
  - `DeckValidator-html.test.js`: 7 tests for HTML character counting
  - `DeckValidator-bypass.test.js`: 7 tests for character limits bypass
- **Real-world examples**: Test files with actual HTML markup scenarios
- **CLI Integration**: Comprehensive testing of new command-line parameters

### 📚 **Documentation Updates**  
- **README.md**: New "Supporto HTML Markup" section with examples
- **README.md**: New "Layout Personalizzati" section with single-card layouts
- **README.md**: New "Bypass Limiti Caratteri" section with use cases and examples
- **Security documentation**: XSS protection and safe tag guidelines  
- **Usage examples**: Practical HTML markup examples for cards
- **Layout guides**: Complete guide for custom layouts (1 card per page, etc.)
- **CLI reference**: Updated command tables with new `--no-char-limits` parameter

### 🔧 **Technical Improvements**
- **Puppeteer compatibility**: Fixed deprecated `page.waitForTimeout` warnings
- **Buffer handling**: Fixed Uint8Array to Buffer conversion in PDF generation
- **Memory leak prevention**: Improved EventEmitter listener management

---

## [3.0.1] - 2025-01-02

### 🔧 **Bug Fixes & Improvements**

#### **Test Suite Fixes**
- **CardRenderer Tests**: Fixed all mocking issues in ES modules environment
  - Removed problematic `jest.mock('fs')` approach
  - Implemented inline mocking for better ES module compatibility  
  - Fixed template validation regex to properly detect malformed placeholders
  - All 39 CardRenderer tests now pass ✅

- **Console Output**: Suppressed deprecation warnings during test execution
  - Added environment detection to prevent warning spam in test mode
  - Tests now run cleanly without polluting output

#### **Code Quality Improvements**
- **Template Validation**: Fixed critical regex pattern in `CardRenderer.validateTemplate()`
  - Old: `/\{[^}]*\}|\{[^{]*\{\{/g` (caused false positives)
  - New: `/\{[^}]*\}(?!\})/g` (correctly detects malformed placeholders)

- **Error Handling**: Improved error handling in CardRenderer
  - Fixed strict mode parameter in placeholder replacement
  - Better error messages for template validation failures

- **Performance**: All benchmarks maintained
  - Template caching: ✅ Working correctly
  - HTML rendering: < 100ms for 100 cards
  - Memory usage: < 200MB typical operation

#### **Documentation**
- **README.md**: Completely updated with v3.0 syntax
  - Added comprehensive examples for all new CLI commands
  - Visual examples for print modes
  - Performance benchmarks and troubleshooting guide
  - Modern markdown formatting with badges and emojis

### 📊 **Test Results**
```
Test Suites: 4 passed, 4 total
Tests:       99 passed, 99 total
Snapshots:   0 total
Time:        1.599 s

✅ LayoutCalculator: 24 tests - All passing
✅ CardPaginator: 27 tests - All passing  
✅ CardRenderer: 39 tests - All passing (fixed!)
✅ Integration: 9 tests - All passing
```

### 🚀 **CLI Functionality**
All CLI commands fully operational:
- `generate`: Complete card generation with all options
- `validate`: JSON validation with detailed reports
- `optimize`: Configuration optimization for any card count
- `info`: System information and diagnostics

### ⚡ **Performance Metrics**
- **Paginazione**: < 10ms per 1000 carte
- **Rendering HTML**: < 100ms per 100 carte  
- **PDF Generation**: < 5s per 50 carte
- **Memory Usage**: < 200MB per 100 carte
- **Test Execution**: < 2s per suite completa

### 🔐 **Security**  
- **HTML Escaping**: Robust XSS protection maintained
- **Input Validation**: Enhanced schema validation
- **File System**: Secure path resolution
- **Template Security**: Malformed template detection improved

---

## [3.0.0] - 2025-01-01

### 🎉 **Major Release - Complete Architecture Refactor**

#### **New Modular Architecture**
- **6 Specialized Classes**: Complete separation of concerns
- **CLI Interface**: Modern command-based interface  
- **Test Suite**: 99 comprehensive tests
- **Template Engine**: Advanced caching and rendering

#### **New Features**
- **Multiple CLI Commands**: `generate`, `validate`, `optimize`, `info`
- **Extended Print Modes**: `portrait`/`landscape` + legacy support
- **Advanced Validation**: Schema validation with detailed reports
- **Configuration Optimization**: Automatic efficiency calculations
- **System Diagnostics**: Built-in troubleshooting tools

#### **Breaking Changes**
- **New CLI Entry Point**: `cli/generate-cards.js` (recommended)
- **Command Structure**: Subcommand-based interface
- **Legacy Support**: Old interface maintained for compatibility

---

## [2.1.0] - Previous Versions

### Legacy monolithic implementation
- Basic PDF/HTML generation
- Simple CLI interface  
- Limited print mode support

---

## 📋 **Migration Guide**

### From 2.x to 3.x

**Old Syntax:**
```bash
node kpi-card-generator.js -i cards.json -o cards.pdf -f short
```

**New Syntax:**
```bash
# Recommended (new CLI)
node cli/generate-cards.js generate -i cards.json -o cards.pdf -f portrait

# Still works (legacy with warnings)  
node kpi-card-generator.js generate -i cards.json -o cards.pdf -f portrait
```

### **New Capabilities**
```bash
# Validate JSON
node cli/generate-cards.js validate -i cards.json --strict

# Find optimal configuration
node cli/generate-cards.js optimize --cards 25

# System diagnostics
node cli/generate-cards.js info --system --templates
```

---

**🎯 Ready for production use!** All tests passing, documentation complete, CLI fully functional.
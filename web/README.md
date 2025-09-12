# KPI Cards Web Application 🌐

**Modern React interface for creating and managing KPI card decks with professional workflow support.**

[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-06B6D4.svg)](https://tailwindcss.com/)
[![API Integration](https://img.shields.io/badge/API-Full%20REST-green.svg)](#api-integration)

## Overview

A comprehensive web application built with React 18+ that provides an intuitive, browser-based interface for creating, managing, and exporting KPI card decks. Features drag-and-drop editing, real-time preview, and seamless integration with the KPI Cards REST API.

**Perfect for:** Workshop facilitators, trainers, educators, and teams who need a user-friendly interface for KPI card creation without command-line complexity.

## Key Features

### ✨ **Complete Deck Management**
- **Create new decks** with guided form interface and validation
- **Edit existing decks** with live updates and auto-save functionality
- **Delete decks** with confirmation dialogs and undo options
- **Duplicate decks** for template-based workflow
- **Import/Export** decks in JSON format

### 🃏 **Advanced Card Editor**
- **Drag-and-drop interface** for intuitive card reordering
- **Inline editing** with immediate validation feedback
- **Rich text support** with safe HTML markup
- **Card templates** for quick creation of common KPI types
- **Bulk operations** for multiple cards simultaneously
- **Card preview** with real-time styling

### 👁️ **Live Preview System**
- **Real-time HTML preview** with multiple layout options
- **Export configuration** with visual layout preview
- **Print mode selection** (landscape/portrait) with live preview
- **Custom layout settings** (cards per page, cards per row)
- **One-click PDF/HTML export** with progress indicators
- **Preview URL sharing** for collaboration

### 🎨 **Modern User Experience**
- **Responsive design** optimized for desktop, tablet, and mobile
- **Tailwind CSS** for beautiful, consistent styling
- **Lucide React icons** for crisp, professional iconography
- **Loading states** and optimistic updates for smooth interactions
- **Error boundaries** with graceful failure handling
- **Dark/light mode** support (planned for future releases)

### 🔄 **API Integration**
- **Full REST API coverage** with all 26 endpoints supported
- **Real-time status monitoring** with connection indicators
- **Optimistic updates** for better perceived performance
- **Automatic retry** for failed requests with exponential backoff
- **Offline detection** with queue synchronization when reconnected
- **Error handling** with user-friendly messages and retry options

## Quick Start

### Prerequisites
- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.0.0
- **KPI Cards API** running on localhost:3000 (see [API documentation](../api/README.md))

### Installation

```bash
# Clone the project (if not already done)
git clone https://github.com/fullo/kpi-card-generator.git
cd kpi-card-generator/web

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Complete Setup (Web + API)

```bash
# Terminal 1: Start API server
cd kpi-card-generator/api
npm install
npm start

# Terminal 2: Start web interface  
cd kpi-card-generator/web
npm install
npm run dev

# Access the application at http://localhost:5173
# API will be available at http://localhost:3000/api/v1
```

## Usage Guide

### Getting Started Workflow

1. **Launch Application**
   - Open browser to http://localhost:5173
   - Verify API connection status (green indicator in sidebar)
   - Navigate through the main sections: Home, Decks, Create

2. **Create Your First Deck**
   - Click "Create New Deck" from the Home dashboard
   - Fill in deck information (title, subtitle, icon)
   - Add your first card with title, type, and description
   - Use the live preview to see your cards rendered
   - Save and export to PDF or HTML

3. **Manage Existing Decks**
   - Browse your deck library in the "Decks" section
   - Use search and filters to find specific decks
   - Click any deck to open the editor
   - Make changes with instant preview updates

### Deck Creation Process

#### **1. Basic Information**
```
Title: Workshop Essentials
Subtitle: Core KPIs for Team Performance
Icon: 📊 (emoji picker included)
```

#### **2. Card Management**
- **Add cards** individually with the "Add Card" button
- **Edit inline** by clicking on card properties
- **Reorder** by dragging cards in the list
- **Duplicate** cards for template-based creation
- **Delete** with confirmation to prevent accidents

#### **3. Card Properties**
```
Title: Conversion Rate (required)
Header Icon: 🎯 (optional)
Hero Image: 📈 (optional)  
Type: KPI (free text)
Description: Percentage of visitors who complete desired action
Flavor Text: The holy grail of digital marketing
Style Class: premium-kpi (for custom CSS)
```

#### **4. Preview and Export**
- **Live preview** updates automatically as you edit
- **Layout configuration**:
  - Print mode: Landscape or Portrait
  - Cards per page: 1, 2, 4, 6, 8, 12
  - Cards per row: 1, 2, 3, 4
- **Export options**:
  - PDF: Ready for printing and distribution
  - HTML: For web sharing and custom styling

### Advanced Features

#### **Rich Text Editing**
Cards support safe HTML markup for formatting:

```html
<strong>Objective:</strong> Increase conversions<br><br>
<ul>
  <li><em>Target</em>: +20%</li>
  <li><b>Deadline</b>: Q4 2024</li>
  <li>Owner: <u>Marketing Team</u></u></li>
</ul>
```

**Supported tags:** `<strong>`, `<b>`, `<em>`, `<i>`, `<u>`, `<br>`, `<ul>`, `<ol>`, `<li>`

#### **Bulk Operations**
- **Select multiple cards** with checkboxes
- **Delete selection** with bulk confirmation
- **Export selection** as separate deck
- **Apply templates** to multiple cards at once

#### **Search and Filter**
- **Global search** across all deck titles and descriptions
- **Advanced filters** by date created, last modified, card count
- **Sort options** by name, date, or relevance
- **Tag-based organization** (planned feature)

## Technical Architecture

### Component Structure
```
src/
├── components/
│   ├── deck/
│   │   ├── DeckList.jsx          # Deck library with search/filter
│   │   ├── DeckEditor.jsx        # Create/edit deck interface
│   │   └── DeckCard.jsx          # Individual deck display component
│   ├── preview/
│   │   └── PreviewPane.jsx       # Live preview and export interface
│   ├── ui/
│   │   ├── Button.jsx            # Reusable button component
│   │   ├── Modal.jsx             # Modal dialogs
│   │   ├── LoadingSpinner.jsx    # Loading indicators
│   │   └── ErrorDisplay.jsx      # Error state components
│   └── layout/
│       └── Navigation.jsx        # Main app navigation
├── hooks/
│   ├── useDecks.js               # Deck management hook
│   ├── useCards.js               # Card management hook
│   └── useApi.js                 # API client hook
├── services/
│   └── api.js                    # Complete REST API integration
├── utils/
│   ├── validation.js             # Client-side validation
│   └── formatting.js             # Text and date formatting
└── styles/
    └── index.css                 # Global styles and Tailwind imports
```

### Custom Hooks

#### **`useDecks()` Hook**
```javascript
const {
  decks,              // Array of all decks
  loading,            // Loading state
  error,              // Error state
  createDeck,         // Function to create new deck
  updateDeck,         // Function to update existing deck
  deleteDeck,         // Function to delete deck
  refreshDecks        // Function to refresh deck list
} = useDecks();
```

#### **`useCards(deckId)` Hook**
```javascript
const {
  cards,              // Array of cards in deck
  addCard,            // Function to add new card
  updateCard,         // Function to update card
  deleteCard,         // Function to delete card
  reorderCards,       // Function to reorder cards
  duplicateCard       // Function to duplicate card
} = useCards(deckId);
```

### State Management
- **Local state** with React hooks for component-specific data
- **API state** managed through custom hooks with caching
- **Form state** with controlled components and validation
- **Global state** for user preferences and app settings

### API Integration

#### **Service Layer**
```javascript
// src/services/api.js
export const api = {
  decks: {
    getAll: () => GET('/decks'),
    getById: (id) => GET(`/decks/${id}`),
    create: (data) => POST('/decks', data),
    update: (id, data) => PATCH(`/decks/${id}`, data),
    delete: (id) => DELETE(`/decks/${id}`)
  },
  cards: {
    getAll: (deckId) => GET(`/decks/${deckId}/cards`),
    create: (deckId, data) => POST(`/decks/${deckId}/cards`, data),
    update: (deckId, cardId, data) => PATCH(`/decks/${deckId}/cards/${cardId}`, data),
    delete: (deckId, cardId) => DELETE(`/decks/${deckId}/cards/${cardId}`)
  },
  export: {
    pdf: (deckId, options) => POST(`/decks/${deckId}/export/pdf`, options),
    html: (deckId, options) => POST(`/decks/${deckId}/export/html`, options)
  }
};
```

#### **Error Handling**
- **Network errors** with automatic retry and user notification
- **Validation errors** displayed inline with field highlighting
- **Server errors** with graceful degradation and error boundaries
- **Offline handling** with queue synchronization when reconnected

### Performance Optimizations

#### **Code Splitting**
```javascript
// Lazy loading for better initial load time
const DeckEditor = lazy(() => import('./components/deck/DeckEditor'));
const PreviewPane = lazy(() => import('./components/preview/PreviewPane'));
```

#### **Optimistic Updates**
- **Immediate UI feedback** before API response
- **Rollback mechanism** for failed operations
- **Conflict resolution** for concurrent edits

#### **Caching Strategy**
- **API response caching** with smart invalidation
- **Image optimization** for card previews
- **Bundle optimization** with Vite's built-in features

## Configuration

### Environment Variables
```bash
# .env file
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=KPI Card Generator
VITE_APP_VERSION=4.2.0
VITE_ENABLE_DEBUG=false
VITE_MAX_CARDS_PER_DECK=100
```

### Build Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react']
        }
      }
    }
  }
});
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb'
        }
      }
    }
  },
  plugins: []
};
```

## Development

### Development Server
```bash
# Start development server with hot reload
npm run dev

# Start with specific port
npm run dev -- --port 3001

# Start with network access
npm run dev -- --host 0.0.0.0
```

### Build Process
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Build with analysis
npm run build:analyze

# Preview production build
npm run preview
```

### Testing

#### **Unit Testing**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- DeckEditor.test.jsx
```

#### **Integration Testing**
```bash
# Run integration tests (requires running API)
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

#### **Manual Testing Checklist**
- [ ] **Home page** loads with recent decks and statistics
- [ ] **Create new deck** with form validation and error handling
- [ ] **Edit existing deck** with auto-save and unsaved changes warning
- [ ] **Add/remove cards** with drag-and-drop and inline editing
- [ ] **Search and filter** decks with real-time results
- [ ] **Live preview** updates with layout changes
- [ ] **Export to PDF/HTML** with download progress and success notification
- [ ] **Delete deck** with confirmation and undo option
- [ ] **API status indicator** shows connection state accurately
- [ ] **Responsive design** works on mobile and tablet devices
- [ ] **Error handling** displays user-friendly messages
- [ ] **Performance** remains smooth with 50+ decks and 100+ cards

### Code Quality

#### **Linting and Formatting**
```bash
# ESLint
npm run lint
npm run lint:fix

# Prettier
npm run format
npm run format:check
```

#### **Code Standards**
- **React 18** best practices with hooks
- **ES6+** modern JavaScript features
- **Prop validation** with PropTypes or TypeScript
- **Component composition** over inheritance
- **Functional components** with hooks over class components

## Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Test production build locally
npm run preview

# Analyze bundle size
npm run build:analyze
```

Expected bundle sizes:
- **Main bundle**: ~150KB gzipped
- **Vendor bundle**: ~50KB gzipped  
- **CSS bundle**: ~25KB gzipped
- **Total**: ~225KB gzipped

### Hosting Options

#### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### **Netlify**
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: Set in Netlify dashboard
```

#### **GitHub Pages**
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add deploy script to package.json
"scripts": {
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run build && npm run deploy
```

#### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

### Environment-Specific Configuration

#### **Production Environment**
```bash
# .env.production
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
VITE_APP_NAME=KPI Card Generator
VITE_APP_VERSION=4.2.0
VITE_ENABLE_DEBUG=false
```

#### **Staging Environment**
```bash
# .env.staging
VITE_API_BASE_URL=https://staging-api.your-domain.com/api/v1
VITE_APP_NAME=KPI Card Generator (Staging)
VITE_ENABLE_DEBUG=true
```

## Troubleshooting

### Common Issues

#### **API Connection Failed**
```bash
# Check API server is running
curl http://localhost:3000/api/v1/health

# Verify environment variables
cat .env

# Check browser network tab for CORS issues
# Ensure API CORS is configured for http://localhost:5173
```

#### **Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Update Node.js version
node --version  # Should be >= 18.0.0
nvm use 18
```

#### **Styling Issues**
```bash
# Rebuild Tailwind CSS
npm run dev

# Check PostCSS configuration
npx tailwindcss --help

# Clear build cache
rm -rf .vite dist
```

#### **Performance Issues**
```bash
# Analyze bundle
npm run build:analyze

# Check network requests in browser DevTools
# Monitor memory usage and component re-renders
# Use React Developer Tools profiler
```

### Debug Mode

```bash
# Enable debug mode
VITE_ENABLE_DEBUG=true npm run dev

# This enables:
# - Verbose API logging
# - Component render timing
# - State change logging
# - Performance metrics
```

## Advanced Customization

### Custom Themes
```css
/* src/styles/themes.css */
[data-theme="dark"] {
  --primary-color: #3b82f6;
  --background-color: #1f2937;
  --text-color: #f3f4f6;
}

[data-theme="high-contrast"] {
  --primary-color: #000000;
  --background-color: #ffffff;
  --text-color: #000000;
}
```

### Feature Flags
```javascript
// src/config/features.js
export const features = {
  enableDarkMode: process.env.VITE_ENABLE_DARK_MODE === 'true',
  enableBulkOperations: true,
  enableExportHistory: false,
  enableCollaboration: false,
  maxCardsPerDeck: parseInt(process.env.VITE_MAX_CARDS_PER_DECK) || 100
};
```

### Custom Card Templates
```javascript
// src/config/cardTemplates.js
export const cardTemplates = {
  kpi: {
    title: 'KPI Template',
    type: 'KPI',
    headerIcon: '📊',
    description: 'Key Performance Indicator template',
    styleClass: 'kpi-card'
  },
  metric: {
    title: 'Metric Template',
    type: 'Metric',
    headerIcon: '🎯',
    description: 'Standard metric template',
    styleClass: 'metric-card'
  }
};
```

## Roadmap

### Planned Features
- 🎨 **Dark mode toggle** with system preference detection
- 📱 **Progressive Web App** with offline support
- 🔄 **Real-time collaboration** with WebSocket integration
- 📊 **Analytics dashboard** with deck usage statistics
- 🔍 **Advanced search** with full-text indexing
- 🏷️ **Tag system** for deck organization
- 📤 **Cloud storage** integration (Google Drive, Dropbox)
- 🔗 **Shareable links** with public/private deck settings

### Integration Opportunities
- **Single Sign-On (SSO)** for enterprise deployment
- **Version control** for deck revisions with git-like history
- **Team collaboration** with shared workspaces and permissions
- **API webhooks** for external integrations
- **Export plugins** for additional formats (PowerPoint, Figma)

## License & Credits

This web application is part of the KPI Card Generator project:
- **Code**: MIT License - Free for commercial and non-commercial use
- **Content**: Creative Commons BY-NC-SA 4.0

**Developed by Francesco Fullone** - [Daruma Consulting](https://darumahq.it)

---

**🎯 Professional KPI card management made simple!** 

Ready to create your first deck? [Get started now](#quick-start) or explore the [API documentation](../api/README.md).

🚀 **Web interface successfully implemented!**
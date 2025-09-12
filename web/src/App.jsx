import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Layers, 
  Plus, 
  Settings, 
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Book
} from 'lucide-react';
import { useDecks } from './hooks/useDecks';
import DeckList from './components/deck/DeckList';
import DeckEditor from './components/deck/DeckEditor';
import PreviewPane from './components/preview/PreviewPane';
import SchemaPage from './components/docs/SchemaPage';
import { LoadingSpinner, ErrorDisplay } from './components/ui';
import DeckCard from './components/ui/DeckCard';
import { utilityAPI } from './services/api';

// Navigation component
const Navigation = ({ currentPath }) => {
  const navItems = [
    { path: '/', icon: Home, label: 'Home', exact: true },
    { path: '/decks', icon: Layers, label: 'Decks' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/preview', icon: Eye, label: 'Preview' },
    { path: '/schema', icon: Book, label: 'JSON Schema' },
  ];

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">KPI Cards</h1>
            <p className="text-sm text-gray-500">Generator v4.0</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? currentPath === item.path
              : currentPath.startsWith(item.path) && item.path !== '/';
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-6 mt-auto pb-6">
        <div className="border-t border-gray-200 pt-6">
          <APIStatus />
        </div>
      </div>
    </nav>
  );
};

// API Status component
const APIStatus = () => {
  const [status, setStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);

  const checkAPIStatus = async () => {
    try {
      await utilityAPI.health();
      setStatus('connected');
      setLastCheck(new Date().toLocaleTimeString());
    } catch (error) {
      setStatus('disconnected');
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkAPIStatus();
    const interval = setInterval(checkAPIStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'API Connected',
        };
      case 'disconnected':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'API Disconnected',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'Checking API...',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="space-y-2">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${config.bgColor}`}>
        <StatusIcon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
      {lastCheck && (
        <p className="text-xs text-gray-500 px-3">
          Last check: {lastCheck}
        </p>
      )}
    </div>
  );
};

// Home page component
const HomePage = () => {
  const { decks, loading, error } = useDecks({ limit: 5 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to KPI Card Generator</h1>
        <p className="text-gray-600 mt-2">
          Create, manage, and export professional KPI card decks for your workshops and presentations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/create"
          className="card p-6 hover:shadow-md transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Plus className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Deck</h3>
              <p className="text-sm text-gray-500">Start building a new card deck</p>
            </div>
          </div>
        </Link>

        <Link
          to="/decks"
          className="card p-6 hover:shadow-md transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Manage Decks</h3>
              <p className="text-sm text-gray-500">View and edit existing decks</p>
            </div>
          </div>
        </Link>

        <Link
          to="/preview"
          className="card p-6 hover:shadow-md transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              <p className="text-sm text-gray-500">View deck previews and exports</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent decks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Decks</h2>
          <Link to="/decks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        
        {loading && <LoadingSpinner text="Loading decks..." />}

        {error && <ErrorDisplay error={`Failed to load decks: ${error}`} />}

        {!loading && !error && decks.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No decks found. Create your first deck to get started!</p>
            <Link to="/create" className="btn btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Create Deck
            </Link>
          </div>
        )}

        {!loading && !error && decks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                variant="simple"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <NavigationWrapper />
          <main className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/decks" element={<DeckList />} />
              <Route path="/decks/:id" element={<DeckEditor />} />
              <Route path="/create" element={<DeckEditor />} />
              <Route path="/preview" element={<PreviewPane />} />
              <Route path="/preview/:id" element={<PreviewPane />} />
              <Route path="/schema" element={<SchemaPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

// Wrapper component to access location inside Router
function NavigationWrapper() {
  const location = useLocation();
  return <Navigation currentPath={location.pathname} />;
}

export default App;
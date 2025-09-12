import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle,
  Layers,
  Trash2
} from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import DeckCard from '../ui/DeckCard';

const DeckList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);

  const { 
    decks, 
    loading, 
    error, 
    meta, 
    deleteDeck, 
    exportToPDF, 
    exportToHTML,
    exportToJSON,
    fetchDecks 
  } = useDecks();

  // Filter and sort decks
  const filteredDecks = decks
    .filter(deck => {
      // Get title from either Italian (titolo) or English (title) field
      const title = deck.titolo || deck.title || '';
      const subtitle = deck.sottotitolo || deck.subtitle || '';
      
      return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });

  const handleDeleteDeck = async (deckId) => {
    try {
      await deleteDeck(deckId);
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('Failed to delete deck:', error);
      alert('Failed to delete deck. Please try again.');
    }
  };

  const handleExportPDF = async (deck) => {
    try {
      await exportToPDF(deck.id);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportHTML = async (deck) => {
    try {
      await exportToHTML(deck.id);
    } catch (error) {
      console.error('Failed to export HTML:', error);
      alert('Failed to export HTML. Please try again.');
    }
  };

  const handleExportJSON = async (deck) => {
    try {
      await exportToJSON(deck.id);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert('Failed to export JSON. Please try again.');
    }
  };

  if (loading && decks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Deck Library</h1>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-500">Loading decks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deck Library</h1>
          <p className="text-gray-600">Manage your KPI card decks</p>
        </div>
        <Link to="/create" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Deck
        </Link>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search decks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="input w-auto"
          >
            <option value="updatedAt-desc">Latest Updated</option>
            <option value="updatedAt-asc">Oldest Updated</option>
            <option value="createdAt-desc">Recently Created</option>
            <option value="createdAt-asc">Oldest Created</option>
            <option value="titolo-asc">Name A-Z</option>
            <option value="titolo-desc">Name Z-A</option>
          </select>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        </div>
      )}

      {/* Deck list */}
      {filteredDecks.length === 0 && !loading ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No decks found' : 'No decks yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? `No decks match "${searchTerm}". Try a different search term.`
              : 'Create your first deck to get started with generating KPI cards.'
            }
          </p>
          <Link to="/create" className="btn btn-primary inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              variant="full"
              onDelete={() => setShowDeleteDialog(deck)}
              onExportPDF={() => handleExportPDF(deck)}
              onExportHTML={() => handleExportHTML(deck)}
              onExportJSON={() => handleExportJSON(deck)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {meta.offset + 1} to {Math.min(meta.offset + meta.limit, meta.total)} of {meta.total} decks
          </p>
          <div className="flex items-center space-x-2">
            <button
              disabled={!meta.hasPrevious}
              className="btn btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              disabled={!meta.hasNext}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <DeleteConfirmationDialog
          deck={showDeleteDialog}
          onConfirm={() => handleDeleteDeck(showDeleteDialog.id)}
          onCancel={() => setShowDeleteDialog(null)}
        />
      )}
    </div>
  );
};


// Delete confirmation dialog
const DeleteConfirmationDialog = ({ deck, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Deck</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete <strong>"{deck.titolo || deck.title || 'Untitled Deck'}"</strong>? 
            This will permanently remove the deck and all its cards.
          </p>
          
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              Delete Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckList;
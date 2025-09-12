import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  Download
} from 'lucide-react';

const DeckCard = ({ 
  deck, 
  variant = 'simple', // 'simple' for homepage, 'full' for deck list
  onDelete,
  onExportPDF,
  onExportHTML,
  onExportJSON,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const baseClasses = "card hover:shadow-md transition-shadow duration-200";
  const fullClasses = variant === 'full' ? "relative" : "";
  const finalClasses = `${baseClasses} ${fullClasses} ${className}`;

  if (variant === 'simple') {
    // Simple variant for homepage recent decks
    return (
      <Link
        to={`/decks/${deck.id}`}
        className={`${finalClasses} p-4 group`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
              {deck.title || deck.titolo || 'Untitled Deck'}
            </h3>
            {(deck.subtitle || deck.sottotitolo) && (
              <p className="text-sm text-gray-500 mt-1">{deck.subtitle || deck.sottotitolo}</p>
            )}
            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
              <span>{deck.cardCount || 0} cards</span>
              <span>
                Updated {new Date(deck.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-2xl ml-4">
            {deck.deckIcon || deck.icona_esercizio || '🃏'}
          </div>
        </div>
      </Link>
    );
  }

  // Full variant for deck list with actions
  return (
    <div className={finalClasses}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{deck.deckIcon || deck.icona_esercizio || '🃏'}</div>
            <div className="flex-1 min-w-0">
              <Link
                to={`/decks/${deck.id}`}
                className="block font-semibold text-gray-900 hover:text-primary-700 transition-colors truncate"
              >
                {deck.title || deck.titolo || 'Untitled Deck'}
              </Link>
              {(deck.subtitle || deck.sottotitolo) && (
                <p className="text-sm text-gray-500 truncate">{deck.subtitle || deck.sottotitolo}</p>
              )}
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <Link
                  to={`/decks/${deck.id}`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
                <Link
                  to={`/preview/${deck.id}`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Link>
                <button
                  onClick={() => { onExportPDF(); setShowMenu(false); }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => { onExportHTML(); setShowMenu(false); }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Download className="w-4 h-4" />
                  <span>Export HTML</span>
                </button>
                <button
                  onClick={() => { onExportJSON(); setShowMenu(false); }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>{deck.cardCount || 0} cards</span>
          <span>Updated {new Date(deck.updatedAt).toLocaleDateString()}</span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <Link
            to={`/decks/${deck.id}`}
            className="btn-sm btn-primary flex-1 inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Link>
          <button
            onClick={onExportPDF}
            className="btn-sm btn-secondary inline-flex items-center justify-center"
            title="Export to PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="btn-sm bg-red-100 text-red-700 hover:bg-red-200 inline-flex items-center justify-center"
            title="Delete Deck"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckCard;
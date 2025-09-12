import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Upload, Book, Settings, Palette } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { deckAPI, handleAPIResponse, handleAPIError } from '../../services/api';
import StylesEditor from './StylesEditor';

const DeckEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewDeck = !id;
  
  const [deck, setDeck] = useState({
    title: '',
    subtitle: '',
    deckIcon: '🃏',
    cardBackIcon: '🃏',
    copyright: 'Daruma Consulting di Francesco Fullone - CC BY-SA-NC',
    cards: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  const { createDeck, updateDeck } = useDecks();

  // Load deck if editing existing
  useEffect(() => {
    if (id) {
      loadDeck(id);
    }
  }, [id]);

  const loadDeck = async (deckId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deckAPI.getById(deckId);
      const data = handleAPIResponse(response);
      const apiDeck = data.data;
      
      // Normalize schema to handle both Italian and English field names
      const normalizedCards = (apiDeck.cards || apiDeck.carte || []).map(card => ({
        ...card,
        title: card.title || card.titolo || '',
        headerIcon: card.headerIcon || card.icona || '',
        heroImage: card.heroImage || card.emoji || '',
        type: card.type || card.tipo || '',
        description: card.description || card.testo || '',
        flavorText: card.flavorText || card.flavor || '',
        styleClass: card.styleClass || card.classe || ''
      }));
      
      const normalizedDeck = {
        ...apiDeck,
        title: apiDeck.title || apiDeck.titolo || '',
        subtitle: apiDeck.subtitle || apiDeck.sottotitolo || '',
        deckIcon: apiDeck.deckIcon || apiDeck.icona_esercizio || '🃏',
        cardBackIcon: apiDeck.cardBackIcon || apiDeck.icona_retro || '🃏',
        copyright: apiDeck.copyright || 'Daruma Consulting di Francesco Fullone - CC BY-SA-NC',
        cards: normalizedCards
      };
      
      setDeck(normalizedDeck);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Validation function for deck and card fields
  const validateDeckFields = () => {
    const errors = {};
    
    console.log('Validating deck:', deck);
    console.log('Deck title:', deck.title, 'Type:', typeof deck.title);
    
    // Deck title validation
    if (!deck.title?.trim()) {
      errors.title = 'Deck title is required';
    } else if (deck.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }
    
    // Deck subtitle validation
    if (deck.subtitle && deck.subtitle.length > 200) {
      errors.subtitle = 'Subtitle must be less than 200 characters';
    }
    
    // Icon validation
    if (deck.deckIcon && deck.deckIcon.length > 10) {
      errors.deckIcon = 'Deck icon must be less than 10 characters';
    }
    
    if (deck.cardBackIcon && deck.cardBackIcon.length > 10) {
      errors.cardBackIcon = 'Card back icon must be less than 10 characters';
    }
    
    // Copyright validation
    if (deck.copyright && deck.copyright.length > 200) {
      errors.copyright = 'Copyright must be less than 200 characters';
    }
    
    // Card validation
    if (deck.cards && deck.cards.length > 0) {
      deck.cards.forEach((card, index) => {
        // Card title validation
        if (!card.title?.trim()) {
          errors[`card_${index}_title`] = 'Card title is required';
        } else if (card.title.length > 100) {
          errors[`card_${index}_title`] = 'Card title must be less than 100 characters';
        }
        
        // Card description validation
        if (!card.description?.trim()) {
          errors[`card_${index}_description`] = 'Card description is required';
        } else if (card.description.length > 500) {
          errors[`card_${index}_description`] = 'Card description must be less than 500 characters';
        }
        
        // Card field length validations
        if (card.type && card.type.length > 50) {
          errors[`card_${index}_type`] = 'Card type must be less than 50 characters';
        }
        
        if (card.headerIcon && card.headerIcon.length > 10) {
          errors[`card_${index}_headerIcon`] = 'Header icon must be less than 10 characters';
        }
        
        if (card.heroImage && card.heroImage.length > 10) {
          errors[`card_${index}_heroImage`] = 'Hero image must be less than 10 characters';
        }
        
        if (card.flavorText && card.flavorText.length > 200) {
          errors[`card_${index}_flavorText`] = 'Flavor text must be less than 200 characters';
        }
        
        if (card.styleClass && card.styleClass.length > 50) {
          errors[`card_${index}_styleClass`] = 'Style class must be less than 50 characters';
        }
      });
    }
    
    return errors;
  };

  const handleSave = async () => {
    // Validate fields
    const errors = validateDeckFields();
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError('Please correct the errors below');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNewDeck) {
        console.log('Creating new deck with data:', deck);
        const newDeck = await createDeck(deck);
        navigate(`/decks/${newDeck.id}`);
      } else {
        await updateDeck(id, deck);
      }
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError);
      
      // Parse field-specific errors from API response
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const apiFieldErrors = {};
        err.response.data.details.forEach(detail => {
          if (detail.field) {
            apiFieldErrors[detail.field] = detail.message;
          }
        });
        setFieldErrors(apiFieldErrors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleJSONUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        
        // Validate required fields
        if (!jsonData.title) {
          alert('Invalid JSON: Missing "title" field');
          return;
        }
        if (!jsonData.cards || !Array.isArray(jsonData.cards)) {
          alert('Invalid JSON: Missing or invalid "cards" array');
          return;
        }

        // Apply defaults for new fields if not present
        const deckData = {
          cardBackIcon: '🃏',
          copyright: 'Daruma Consulting di Francesco Fullone - CC BY-SA-NC',
          ...jsonData
        };

        setDeck(deckData);
        setError(null);
      } catch (err) {
        setError('Invalid JSON file. Please check the format.');
        alert('Invalid JSON file. Please check the format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const addCard = () => {
    const newCard = {
      title: 'New Card',
      headerIcon: '📊',
      heroImage: '🎯',
      type: 'KPI',
      description: 'Enter card description here...',
      flavorText: 'Additional notes',
      styleClass: 'card-kpi'
    };
    
    setDeck(prev => ({
      ...prev,
      cards: [...prev.cards, newCard]
    }));
  };

  const updateCard = (index, field, value) => {
    setDeck(prev => ({
      ...prev,
      cards: prev.cards.map((card, i) => 
        i === index ? { ...card, [field]: value } : card
      )
    }));
  };

  const removeCard = (index) => {
    setDeck(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-500">Loading deck...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/decks')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewDeck ? 'Create New Deck' : 'Edit Deck'}
            </h1>
            <p className="text-gray-600">
              {isNewDeck ? 'Build a new KPI card deck' : 'Modify your existing deck'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isNewDeck && (
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleJSONUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="json-upload"
              />
              <label
                htmlFor="json-upload"
                className="btn btn-secondary inline-flex items-center cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload JSON
              </label>
            </div>
          )}
          <Link
            to="/schema"
            className="btn btn-outline text-sm inline-flex items-center"
          >
            <Book className="w-4 h-4 mr-2" />
            JSON Schema
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary inline-flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Deck'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`
              whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Settings className="w-4 h-4 mr-2 inline" />
            General & Cards
          </button>
          {!isNewDeck && (
            <button
              onClick={() => setActiveTab('styles')}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'styles'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Palette className="w-4 h-4 mr-2 inline" />
              Style Customization
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <>
      {/* Deck metadata */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deck Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deck Title *
            </label>
            <input
              type="text"
              name="title"
              value={deck.title}
              onChange={(e) => {
                setDeck(prev => ({ ...prev, title: e.target.value }));
                // Clear error when user starts typing
                if (fieldErrors.title) {
                  setFieldErrors(prev => ({ ...prev, title: null }));
                }
              }}
              className={`input ${fieldErrors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter deck title..."
              required
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deck Icon
            </label>
            <input
              type="text"
              value={deck.deckIcon}
              onChange={(e) => {
                setDeck(prev => ({ ...prev, deckIcon: e.target.value }));
                if (fieldErrors.deckIcon) {
                  setFieldErrors(prev => ({ ...prev, deckIcon: null }));
                }
              }}
              className={`input ${fieldErrors.deckIcon ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="🃏"
            />
            {fieldErrors.deckIcon && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.deckIcon}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Used in deck lists and navigation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Back Icon
            </label>
            <input
              type="text"
              value={deck.cardBackIcon}
              onChange={(e) => {
                setDeck(prev => ({ ...prev, cardBackIcon: e.target.value }));
                if (fieldErrors.cardBackIcon) {
                  setFieldErrors(prev => ({ ...prev, cardBackIcon: null }));
                }
              }}
              className={`input ${fieldErrors.cardBackIcon ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="🃏"
            />
            {fieldErrors.cardBackIcon && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.cardBackIcon}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Displayed on the back of each card
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              name="subtitle"
              value={deck.subtitle}
              onChange={(e) => {
                setDeck(prev => ({ ...prev, subtitle: e.target.value }));
                if (fieldErrors.subtitle) {
                  setFieldErrors(prev => ({ ...prev, subtitle: null }));
                }
              }}
              className={`input ${fieldErrors.subtitle ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter deck subtitle (optional)..."
            />
            {fieldErrors.subtitle && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.subtitle}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Copyright Notice
            </label>
            <input
              type="text"
              value={deck.copyright}
              onChange={(e) => {
                setDeck(prev => ({ ...prev, copyright: e.target.value }));
                if (fieldErrors.copyright) {
                  setFieldErrors(prev => ({ ...prev, copyright: null }));
                }
              }}
              className={`input ${fieldErrors.copyright ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Daruma Consulting di Francesco Fullone - CC BY-SA-NC"
            />
            {fieldErrors.copyright && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.copyright}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              This text will appear on the back of each card
            </p>
          </div>
        </div>
      </div>

      {/* Cards section */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cards</h2>
              <p className="text-sm text-gray-600">{(deck.cards || []).length} cards in this deck</p>
            </div>
            <button
              onClick={addCard}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </button>
          </div>
        </div>

        <div className="p-6">
          {(deck.cards || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No cards yet. Add your first card to get started.</p>
              <button onClick={addCard} className="btn btn-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add First Card
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(deck.cards || []).map((card, index) => (
                <CardEditor
                  key={index}
                  card={card}
                  index={index}
                  fieldErrors={fieldErrors}
                  setFieldErrors={setFieldErrors}
                  onUpdate={(field, value) => updateCard(index, field, value)}
                  onRemove={() => removeCard(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Styles Tab */}
      {activeTab === 'styles' && !isNewDeck && (
        <StylesEditor
          deckId={id}
          deckTitle={deck.title}
          onSave={(savedConfig) => {
            console.log('Styles saved:', savedConfig);
          }}
        />
      )}
    </div>
  );
};

// Simple card editor component
const CardEditor = ({ card, onUpdate, onRemove, index, fieldErrors, setFieldErrors }) => {
  const clearFieldError = (field) => {
    if (fieldErrors[`card_${index}_${field}`]) {
      setFieldErrors(prev => ({ ...prev, [`card_${index}_${field}`]: null }));
    }
  };
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={card.title}
            onChange={(e) => {
              onUpdate('title', e.target.value);
              clearFieldError('title');
            }}
            className={`input text-sm ${fieldErrors[`card_${index}_title`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          {fieldErrors[`card_${index}_title`] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors[`card_${index}_title`]}</p>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <input
            type="text"
            value={card.type}
            onChange={(e) => onUpdate('type', e.target.value)}
            className="input text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Card Header Icon</label>
          <input
            type="text"
            value={card.headerIcon}
            onChange={(e) => onUpdate('headerIcon', e.target.value)}
            className="input text-sm"
            placeholder="📊"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Card Hero Image</label>
          <input
            type="text"
            value={card.heroImage}
            onChange={(e) => onUpdate('heroImage', e.target.value)}
            className="input text-sm"
            placeholder="🎯"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={card.description}
            onChange={(e) => {
              onUpdate('description', e.target.value);
              clearFieldError('description');
            }}
            className={`input text-sm resize-none h-20 ${fieldErrors[`card_${index}_description`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            rows={3}
          />
          {fieldErrors[`card_${index}_description`] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors[`card_${index}_description`]}</p>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Flavor Text</label>
          <input
            type="text"
            value={card.flavorText || ''}
            onChange={(e) => {
              onUpdate('flavorText', e.target.value);
              clearFieldError('flavorText');
            }}
            className={`input text-sm ${fieldErrors[`card_${index}_flavorText`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Additional notes or flavor text"
          />
          {fieldErrors[`card_${index}_flavorText`] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors[`card_${index}_flavorText`]}</p>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Style Class</label>
          <input
            type="text"
            value={card.styleClass || ''}
            onChange={(e) => {
              onUpdate('styleClass', e.target.value);
              clearFieldError('styleClass');
            }}
            className={`input text-sm ${fieldErrors[`card_${index}_styleClass`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="card-kpi, warrior, mage, etc."
          />
          {fieldErrors[`card_${index}_styleClass`] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors[`card_${index}_styleClass`]}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Used for style customization (e.g., colors, fonts)
          </p>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={onRemove}
            className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm px-3 py-1"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckEditor;
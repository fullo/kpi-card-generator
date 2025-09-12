import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Download, Settings } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { deckAPI, handleAPIResponse, handleAPIError } from '../../services/api';

const PreviewPane = () => {
  const { id } = useParams();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewOptions, setPreviewOptions] = useState({
    printMode: 'landscape',
    cardsPerPage: 8,
    cardsPerRow: 4
  });

  const { decks } = useDecks();

  // Load deck and preview if ID provided
  useEffect(() => {
    if (id) {
      const deck = decks.find(d => d.id === id);
      if (deck) {
        setSelectedDeck(deck);
        loadPreview(id);
      }
    }
  }, [id, decks]);

  const loadPreview = async (deckId) => {
    if (!deckId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await deckAPI.getPreview(deckId, previewOptions);
      setPreviewHtml(response.data);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeckSelect = async (deckId) => {
    const deck = decks.find(d => d.id === deckId);
    setSelectedDeck(deck);
    await loadPreview(deckId);
  };

  const handlePreviewOptionsChange = async () => {
    if (selectedDeck) {
      await loadPreview(selectedDeck.id);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedDeck) return;
    
    try {
      setLoading(true);
      const response = await deckAPI.exportPDF(selectedDeck.id, { options: previewOptions });
      
      // The API returns JSON with downloadUrl, not a direct blob
      if (response.data.success && response.data.data.downloadUrl) {
        // Create a download link and trigger it - use relative path for proxy
        const downloadUrl = response.data.data.downloadUrl;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = response.data.data.filename || 'deck.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!selectedDeck) return;
    
    try {
      setLoading(true);
      const response = await deckAPI.exportJSON(selectedDeck.id, { options: previewOptions });
      
      if (response.data.success && response.data.data) {
        // Create a blob and download it
        const jsonBlob = new Blob([JSON.stringify(response.data.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(jsonBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.data.filename || 'deck.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('JSON export failed:', error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preview</h1>
          <p className="text-gray-600">Preview your deck layouts and export options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with deck selection and options */}
        <div className="space-y-6">
          {/* Deck Selection */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Deck</h2>
            <div className="space-y-2">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => handleDeckSelect(deck.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDeck?.id === deck.id
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{deck.deckIcon || deck.icona_esercizio || '🃏'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{deck.title || deck.titolo}</p>
                      <p className="text-xs text-gray-500">{deck.cardCount || 0} cards</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Options */}
          {selectedDeck && (
            <div className="card p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Options
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Print Flip Mode
                  </label>
                  <select
                    value={previewOptions.printMode}
                    onChange={(e) => setPreviewOptions(prev => ({ ...prev, printMode: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="portrait">Flip by short side</option>
                    <option value="landscape">Flip by long side</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cards Per Page
                  </label>
                  <select
                    value={previewOptions.cardsPerPage}
                    onChange={(e) => setPreviewOptions(prev => ({ ...prev, cardsPerPage: parseInt(e.target.value) }))}
                    className="input w-full text-sm"
                  >
                    <option value={4}>4 cards</option>
                    <option value={6}>6 cards</option>
                    <option value={8}>8 cards</option>
                    <option value={12}>12 cards</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cards Per Row
                  </label>
                  <select
                    value={previewOptions.cardsPerRow}
                    onChange={(e) => setPreviewOptions(prev => ({ ...prev, cardsPerRow: parseInt(e.target.value) }))}
                    className="input w-full text-sm"
                  >
                    <option value={2}>2 columns</option>
                    <option value={3}>3 columns</option>
                    <option value={4}>4 columns</option>
                  </select>
                </div>

                <button
                  onClick={handlePreviewOptionsChange}
                  className="btn btn-primary w-full text-sm"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Update Preview'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview area */}
        <div className="lg:col-span-3">
          <div className="card p-6 min-h-96">
            {!selectedDeck ? (
              <div className="text-center py-16 text-gray-500">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Deck Selected</h3>
                <p>Select a deck from the sidebar to see its preview</p>
              </div>
            ) : loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-500">Loading preview...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">Error loading preview: {error}</p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDeck.titolo} Preview
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleExportPDF}
                      className="btn btn-secondary text-sm"
                      disabled={loading}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </button>
                    <button 
                      onClick={handleExportJSON}
                      className="btn btn-secondary text-sm"
                      disabled={loading}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </button>
                  </div>
                </div>
                
                {/* Preview iframe */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ height: '800px' }}>
                  {previewHtml ? (
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full"
                      title="Deck Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>No preview available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPane;
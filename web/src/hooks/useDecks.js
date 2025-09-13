import { useState, useEffect, useCallback, useRef } from 'react';
import { deckAPI, handleAPIResponse, handleAPIError } from '../services/api';

export const useDecks = (initialParams = {}) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({});
  
  // Store initial params in a ref to avoid dependency issues
  const initialParamsRef = useRef(initialParams);

  // Fetch decks with optional parameters
  const fetchDecks = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deckAPI.getAll(params || initialParamsRef.current);
      const data = handleAPIResponse(response);
      
      setDecks(data.data || []);
      setMeta(data.meta || {});
    } catch (err) {
      setError(handleAPIError(err));
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new deck
  const createDeck = useCallback(async (deckData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('useDecks createDeck called with:', deckData);
      const response = await deckAPI.create(deckData);
      console.log('deckAPI.create response:', response);
      const data = handleAPIResponse(response);
      console.log('handleAPIResponse result:', data);
      
      // Add the new deck to the beginning of the list
      setDecks(prevDecks => [data.data, ...prevDecks]);
      return data.data;
    } catch (err) {
      console.error('createDeck error:', err);
      const errorMessage = handleAPIError(err);
      console.log('Error message:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing deck
  const updateDeck = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await deckAPI.update(id, updateData);
      const data = handleAPIResponse(response);
      
      // Update the deck in the list
      setDecks(prevDecks => 
        prevDecks.map(deck => 
          deck.id === id ? data.data : deck
        )
      );
      return data.data;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete deck
  const deleteDeck = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await deckAPI.delete(id);
      
      // Remove the deck from the list
      setDecks(prevDecks => prevDecks.filter(deck => deck.id !== id));
      return true;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Export deck to PDF
  const exportToPDF = useCallback(async (id, options = {}) => {
    setError(null);
    
    try {
      const response = await deckAPI.exportPDF(id, options);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deck-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Export deck to HTML
  const exportToHTML = useCallback(async (id, options = {}) => {
    setError(null);
    
    try {
      const response = await deckAPI.exportHTML(id, options);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deck-${id}.html`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Export deck to JSON
  const exportToJSON = useCallback(async (id) => {
    setError(null);
    
    try {
      const response = await deckAPI.getById(id);
      const data = handleAPIResponse(response);
      const deckData = data.data;
      
      // Create clean JSON export (remove metadata like id, timestamps, etc.)
      const exportData = {
        title: deckData.title || deckData.titolo || '',
        subtitle: deckData.subtitle || deckData.sottotitolo || '',
        deckIcon: deckData.deckIcon || deckData.icona_esercizio || '🃏',
        cardBackIcon: deckData.cardBackIcon || deckData.icona_retro || '🃏',
        copyright: deckData.copyright || 'Daruma Consulting di Francesco Fullone - CC BY-SA-NC',
        cards: (deckData.cards || deckData.carte || []).map(card => ({
          title: card.title || card.titolo || '',
          headerIcon: card.headerIcon || card.icona || '',
          heroImage: card.heroImage || card.emoji || '',
          type: card.type || card.tipo || '',
          description: card.description || card.testo || '',
          flavorText: card.flavorText || card.flavor || '',
          styleClass: card.styleClass || card.classe || ''
        }))
      };
      
      // Create download link
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportData.title || 'deck'}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get deck preview
  const getDeckPreview = useCallback(async (id, options = {}) => {
    setError(null);
    
    try {
      const response = await deckAPI.getPreview(id, options);
      return response.data; // Return HTML directly
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Refresh decks list
  const refresh = useCallback(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Load decks on mount
  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return {
    decks,
    loading,
    error,
    meta,
    fetchDecks,
    createDeck,
    updateDeck,
    deleteDeck,
    exportToPDF,
    exportToHTML,
    exportToJSON,
    getDeckPreview,
    refresh
  };
};
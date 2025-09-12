import { useState, useEffect, useCallback } from 'react';
import { cardAPI, handleAPIResponse, handleAPIError } from '../services/api';

export const useCards = (deckId) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({});

  // Fetch cards for a specific deck
  const fetchCards = useCallback(async (params = {}) => {
    if (!deckId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await cardAPI.getAll(deckId, params);
      const data = handleAPIResponse(response);
      
      setCards(data.data || []);
      setMeta(data.meta || {});
    } catch (err) {
      setError(handleAPIError(err));
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  // Create new card
  const createCard = useCallback(async (cardData) => {
    if (!deckId) throw new Error('Deck ID is required');
    
    setLoading(true);
    setError(null);

    try {
      const response = await cardAPI.create(deckId, cardData);
      const data = handleAPIResponse(response);
      
      // Add the new card to the list
      setCards(prevCards => [...prevCards, data.data]);
      return data.data;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  // Update existing card
  const updateCard = useCallback(async (cardId, updateData) => {
    if (!deckId) throw new Error('Deck ID is required');
    
    setLoading(true);
    setError(null);

    try {
      const response = await cardAPI.update(deckId, cardId, updateData);
      const data = handleAPIResponse(response);
      
      // Update the card in the list
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId ? data.data : card
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
  }, [deckId]);

  // Delete card
  const deleteCard = useCallback(async (cardId) => {
    if (!deckId) throw new Error('Deck ID is required');
    
    setLoading(true);
    setError(null);

    try {
      await cardAPI.delete(deckId, cardId);
      
      // Remove the card from the list
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      return true;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  // Duplicate card
  const duplicateCard = useCallback(async (cardId) => {
    if (!deckId) throw new Error('Deck ID is required');
    
    setLoading(true);
    setError(null);

    try {
      const response = await cardAPI.duplicate(deckId, cardId);
      const data = handleAPIResponse(response);
      
      // Add the duplicated card to the list
      setCards(prevCards => [...prevCards, data.data]);
      return data.data;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  // Bulk operations
  const bulkOperations = useCallback(async (operations) => {
    if (!deckId) throw new Error('Deck ID is required');
    
    setLoading(true);
    setError(null);

    try {
      const response = await cardAPI.bulkOperations(deckId, operations);
      const data = handleAPIResponse(response);
      
      // Refresh cards list to reflect changes
      await fetchCards();
      return data.data;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [deckId, fetchCards]);

  // Reorder cards
  const reorderCards = useCallback(async (newOrder) => {
    if (!deckId) throw new Error('Deck ID is required');
    
    // Optimistic update
    const originalCards = [...cards];
    setCards(newOrder);
    
    try {
      const cardOrder = newOrder.map(card => card.id);
      await cardAPI.reorder(deckId, cardOrder);
    } catch (err) {
      // Revert on error
      setCards(originalCards);
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [deckId, cards]);

  // Validate all cards
  const validateAllCards = useCallback(async () => {
    if (!deckId) throw new Error('Deck ID is required');
    
    setError(null);
    
    try {
      const response = await cardAPI.validateAll(deckId);
      const data = handleAPIResponse(response);
      return data.data;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [deckId]);

  // Get card preview
  const getCardPreview = useCallback(async (cardId) => {
    if (!deckId) throw new Error('Deck ID is required');
    
    setError(null);
    
    try {
      const response = await cardAPI.getPreview(deckId, cardId);
      return response.data; // Return HTML directly
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [deckId]);

  // Add multiple cards at once (helper function)
  const addMultipleCards = useCallback(async (cardsData) => {
    const operations = cardsData.map(cardData => ({
      type: 'add',
      data: cardData
    }));
    
    return bulkOperations(operations);
  }, [bulkOperations]);

  // Update multiple cards at once (helper function)
  const updateMultipleCards = useCallback(async (updates) => {
    const operations = updates.map(({ cardId, data }) => ({
      type: 'update',
      cardId,
      data
    }));
    
    return bulkOperations(operations);
  }, [bulkOperations]);

  // Delete multiple cards at once (helper function)
  const deleteMultipleCards = useCallback(async (cardIds) => {
    const operations = cardIds.map(cardId => ({
      type: 'delete',
      cardId
    }));
    
    return bulkOperations(operations);
  }, [bulkOperations]);

  // Refresh cards list
  const refresh = useCallback(() => {
    fetchCards();
  }, [fetchCards]);

  // Load cards when deckId changes
  useEffect(() => {
    if (deckId) {
      fetchCards();
    } else {
      setCards([]);
      setMeta({});
    }
  }, [fetchCards, deckId]);

  return {
    cards,
    loading,
    error,
    meta,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
    duplicateCard,
    bulkOperations,
    reorderCards,
    validateAllCards,
    getCardPreview,
    addMultipleCards,
    updateMultipleCards,
    deleteMultipleCards,
    refresh
  };
};
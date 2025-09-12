import { useState, useEffect, useCallback, useRef } from 'react';
import { stylesAPI, handleAPIResponse, handleAPIError } from '../services/api';

export const useStyles = (deckId) => {
  const [availableStyles, setAvailableStyles] = useState([]);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  
  // Store deck ID in a ref to avoid dependency issues
  const deckIdRef = useRef(deckId);
  deckIdRef.current = deckId;

  // Fetch available style classes for the deck
  const fetchAvailableStyles = useCallback(async () => {
    if (!deckIdRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await stylesAPI.getAvailable(deckIdRef.current);
      const data = handleAPIResponse(response);
      setAvailableStyles(data.data?.availableClasses || []);
    } catch (err) {
      setError(handleAPIError(err));
      setAvailableStyles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current style configuration
  const fetchCurrentConfig = useCallback(async () => {
    if (!deckIdRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await stylesAPI.get(deckIdRef.current);
      const data = handleAPIResponse(response);
      setCurrentConfig(data.data || null);
    } catch (err) {
      // If no configuration exists, that's OK - not an error
      if (err.response?.status === 404) {
        setCurrentConfig(null);
      } else {
        setError(handleAPIError(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Save style configuration
  const saveConfig = useCallback(async (styleConfig) => {
    if (!deckIdRef.current) return;
    
    setSaving(true);
    setError(null);

    try {
      const response = await stylesAPI.save(deckIdRef.current, styleConfig);
      const data = handleAPIResponse(response);
      setCurrentConfig(data.data);
      return data.data;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, []);

  // Generate preview with temporary changes
  const generatePreview = useCallback(async (previewConfig) => {
    if (!deckIdRef.current) return;
    
    setError(null);
    
    try {
      const response = await stylesAPI.preview(deckIdRef.current, previewConfig);
      setPreviewHtml(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Remove style configuration
  const removeConfig = useCallback(async () => {
    if (!deckIdRef.current) return;
    
    setSaving(true);
    setError(null);

    try {
      await stylesAPI.remove(deckIdRef.current);
      setCurrentConfig(null);
      setPreviewHtml(null);
      return true;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, []);

  // Clear preview
  const clearPreview = useCallback(() => {
    setPreviewHtml(null);
  }, []);

  // Refresh all style data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchAvailableStyles(),
      fetchCurrentConfig()
    ]);
  }, [fetchAvailableStyles, fetchCurrentConfig]);

  // Load data on mount or when deck ID changes
  useEffect(() => {
    if (deckId) {
      refresh();
    } else {
      setAvailableStyles([]);
      setCurrentConfig(null);
      setPreviewHtml(null);
    }
  }, [deckId, refresh]);

  // Helper function to get style class display name
  const getStyleDisplayName = useCallback((styleClass) => {
    return styleClass; // For now, just return the class name itself
  }, []);

  // Helper function to get style class description
  const getStyleDescription = useCallback((styleClass) => {
    return `CSS class: .${styleClass}`; // Simple description
  }, []);

  // Helper function to create default config (Iteration 5 format)
  const createDefaultConfig = useCallback(() => {
    return {
      cardTitleColor: null,
      cardTitleBgColor: null, 
      showHeroImage: true,
      descriptionTextSize: 'm'
    };
  }, []);

  return {
    // State
    availableStyles,
    currentConfig,
    loading,
    saving,
    error,
    previewHtml,
    
    // Actions
    fetchAvailableStyles,
    fetchCurrentConfig,
    saveConfig,
    generatePreview,
    removeConfig,
    clearPreview,
    refresh,
    
    // Helpers
    getStyleDisplayName,
    getStyleDescription,
    createDefaultConfig
  };
};
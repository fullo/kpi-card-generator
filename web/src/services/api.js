// Base API configuration
const BASE_URL = '/api/v1'; // Use proxy in development
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Enhanced fetch wrapper with timeout and interceptor-like functionality
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  
  // Log request (equivalent to axios request interceptor)
  console.log(`API Request: ${method.toUpperCase()} ${endpoint}`);
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add body for POST/PUT/PATCH requests
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  
  if (!options.signal) {
    config.signal = controller.signal;
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Handle non-ok responses (equivalent to axios response interceptor)
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('API Error:', errorData);
      } catch {
        errorData = { message: response.statusText };
      }
      
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.response = { 
        data: errorData, 
        status: response.status,
        statusText: response.statusText 
      };
      throw error;
    }

    // Handle blob responses
    if (options.responseType === 'blob') {
      return { data: await response.blob() };
    }

    // Handle text responses
    if (options.responseType === 'text') {
      return { data: await response.text() };
    }

    // Handle JSON responses
    const data = await response.json();
    console.log('API Request successful - Status:', response.status, 'Data:', data);
    return { data };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('Network Error: Request timeout');
      const timeoutError = new Error('Request timeout');
      timeoutError.request = true;
      throw timeoutError;
    }
    
    if (!error.response) {
      console.error('Network Error:', error.message);
      error.request = true;
    }
    
    throw error;
  }
};

// Helper function to build query string
const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });
  return `?${searchParams.toString()}`;
};

// Deck API endpoints
export const deckAPI = {
  // Get all decks with pagination and search
  getAll: (params = {}) => apiRequest(`/decks${buildQueryString(params)}`),
  
  // Get specific deck by ID
  getById: (id) => apiRequest(`/decks/${id}`),
  
  // Create new deck
  create: (deckData) => apiRequest('/decks', { method: 'POST', body: deckData }),
  
  // Update deck
  update: (id, updateData) => apiRequest(`/decks/${id}`, { method: 'PATCH', body: updateData }),
  
  // Delete deck
  delete: (id) => apiRequest(`/decks/${id}`, { method: 'DELETE' }),
  
  // Get deck statistics
  getStats: () => apiRequest('/decks/stats'),
  
  // Export deck to PDF
  exportPDF: (id, options = {}) => apiRequest(`/decks/${id}/export/pdf`, { 
    method: 'POST', 
    body: options
  }),
  
  // Export deck to JSON
  exportJSON: (id, options = {}) => apiRequest(`/decks/${id}/export/json`, { 
    method: 'POST', 
    body: options
  }),
  
  // Get HTML preview
  getPreview: (id, options = {}) => apiRequest(`/decks/${id}/preview${buildQueryString(options)}`, { responseType: 'text' }),
  
  // Get preview info as JSON
  getPreviewInfo: (id) => apiRequest(`/decks/${id}/preview/json`)
};

// Card API endpoints
export const cardAPI = {
  // Get all cards in a deck
  getAll: (deckId, params = {}) => apiRequest(`/decks/${deckId}/cards${buildQueryString(params)}`),
  
  // Get specific card
  getById: (deckId, cardId) => apiRequest(`/decks/${deckId}/cards/${cardId}`),
  
  // Create new card
  create: (deckId, cardData) => apiRequest(`/decks/${deckId}/cards`, { method: 'POST', body: cardData }),
  
  // Update card
  update: (deckId, cardId, updateData) => apiRequest(`/decks/${deckId}/cards/${cardId}`, { method: 'PATCH', body: updateData }),
  
  // Delete card
  delete: (deckId, cardId) => apiRequest(`/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' }),
  
  // Duplicate card
  duplicate: (deckId, cardId) => apiRequest(`/decks/${deckId}/cards/${cardId}/duplicate`, { method: 'POST' }),
  
  // Bulk operations
  bulkOperations: (deckId, operations) => apiRequest(`/decks/${deckId}/cards/bulk`, { method: 'POST', body: { operations } }),
  
  // Reorder cards
  reorder: (deckId, cardOrder) => apiRequest(`/decks/${deckId}/cards/reorder`, { method: 'PUT', body: { cardOrder } }),
  
  // Validate all cards
  validateAll: (deckId) => apiRequest(`/decks/${deckId}/cards/validate-all`, { method: 'POST' }),
  
  // Get card preview
  getPreview: (deckId, cardId) => apiRequest(`/decks/${deckId}/cards/${cardId}/preview`)
};

// Styles API endpoints
export const stylesAPI = {
  // Get available style classes for a deck
  getAvailable: (deckId) => apiRequest(`/decks/${deckId}/styles/available`),
  
  // Get current style configuration
  get: (deckId) => apiRequest(`/decks/${deckId}/styles`),
  
  // Save style configuration
  save: (deckId, styleConfig) => apiRequest(`/decks/${deckId}/styles`, { method: 'POST', body: styleConfig }),
  
  // Preview temporary CSS changes
  preview: (deckId, previewConfig) => apiRequest(`/decks/${deckId}/styles/preview`, { 
    method: 'POST', 
    body: previewConfig,
    responseType: 'text'
  }),
  
  // Remove style configuration
  remove: (deckId) => apiRequest(`/decks/${deckId}/styles`, { method: 'DELETE' })
};

// Utility API endpoints
export const utilityAPI = {
  // Health check
  health: () => apiRequest('/health'),
  
  // Download temporary files
  download: (filename) => apiRequest(`/downloads/${filename}`, { responseType: 'blob' }),
  
  // Export statistics
  getExportStats: () => apiRequest('/exports/stats'),
  
  // Cleanup expired files
  cleanup: () => apiRequest('/exports/cleanup', { method: 'POST' })
};

// Helper function to handle API responses consistently
export const handleAPIResponse = (response) => {
  console.log('handleAPIResponse called with:', response);
  if (response.data && response.data.success) {
    return response.data;
  }
  console.error('API response failed validation:', response);
  throw new Error(response.data?.message || 'API request failed');
};

// Helper function to handle API errors consistently
export const handleAPIError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default { apiRequest, BASE_URL };
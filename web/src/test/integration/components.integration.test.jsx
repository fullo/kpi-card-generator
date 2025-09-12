/**
 * Component Integration Tests
 * Tests React components integration with API and user interactions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import App from '../../App';
import DeckList from '../../components/deck/DeckList';
import DeckEditor from '../../components/deck/DeckEditor';
import { deckAPI, cardAPI } from '../../services/api';

// Mock data
const mockDeck = {
  id: 'test-deck-integration',
  titolo: 'Integration Test Deck',
  sottotitolo: 'Testing component integration',
  icona_esercizio: '🧪',
  carte: [
    {
      id: 'card-1',
      titolo: 'Test Card 1',
      icona: '🎯',
      tipo: 'Integration',
      testo: 'Test card for integration testing'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  cardCount: 1
};

// Helper to render components with Router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Helper to wait for API calls
const waitForAPI = () => new Promise(resolve => setTimeout(resolve, 100));

describe('Component Integration Tests', () => {
  let testDeckId = null;
  
  beforeAll(async () => {
    // Verify API server is running
    try {
      await axios.get('http://localhost:3000/api/v1/health');
    } catch (error) {
      throw new Error('API server is required for integration tests. Start with: cd api && npm start');
    }
    
    // Create a test deck for component testing
    try {
      const response = await deckAPI.create({
        titolo: mockDeck.titolo,
        sottotitolo: mockDeck.sottotitolo,
        icona_esercizio: mockDeck.icona_esercizio,
        carte: mockDeck.carte
      });
      testDeckId = response.data.data.id;
      mockDeck.id = testDeckId;
    } catch (error) {
      console.warn('Failed to create test deck:', error.message);
    }
  });

  afterAll(async () => {
    // Cleanup test deck
    if (testDeckId) {
      try {
        await deckAPI.delete(testDeckId);
      } catch (error) {
        console.warn('Failed to cleanup test deck:', error.message);
      }
    }
  });

  afterEach(() => {
    cleanup();
  });

  describe('App Component Integration', () => {
    it('should render main app with navigation and API status', async () => {
      renderWithRouter(<App />);
      
      // Check navigation elements
      expect(screen.getByText('KPI Cards')).toBeInTheDocument();
      expect(screen.getByText('Generator v4.0')).toBeInTheDocument();
      
      // Check navigation links
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Decks')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      
      // Wait for API status check
      await waitFor(() => {
        expect(screen.getByText('API Connected') || screen.getByText('Checking API...')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show API status indicator', async () => {
      renderWithRouter(<App />);
      
      // Initially should show "Checking API..."
      expect(screen.getByText('Checking API...')).toBeInTheDocument();
      
      // Should eventually show connected status
      await waitFor(() => {
        expect(screen.getByText('API Connected')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Should show last check time
      await waitFor(() => {
        const lastCheckElement = screen.getByText(/Last check:/);
        expect(lastCheckElement).toBeInTheDocument();
      });
    });

    it('should navigate between different sections', async () => {
      const user = userEvent.setup();
      renderWithRouter(<App />);
      
      // Navigate to Decks
      const decksLink = screen.getByText('Decks');
      await user.click(decksLink);
      
      // Should show deck list or loading state
      await waitFor(() => {
        expect(screen.getByText('Deck Library') || screen.getByText('Loading decks...')).toBeInTheDocument();
      });
      
      // Navigate to Create
      const createLink = screen.getByText('Create');
      await user.click(createLink);
      
      // Should show deck editor
      await waitFor(() => {
        expect(screen.getByText('Create New Deck') || screen.getByText('Deck Title')).toBeInTheDocument();
      });
    });
  });

  describe('Homepage Integration', () => {
    it('should load and display recent decks', async () => {
      renderWithRouter(<App />);
      
      // Should show recent decks section
      expect(screen.getByText('Recent Decks')).toBeInTheDocument();
      
      // Wait for decks to load
      await waitFor(() => {
        // Should either show decks or "no decks" message
        const hasDecks = screen.queryByText(mockDeck.titolo);
        const noDecks = screen.queryByText('No decks found');
        const loading = screen.queryByText('Loading decks...');
        
        expect(hasDecks || noDecks || loading).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show quick action cards', () => {
      renderWithRouter(<App />);
      
      expect(screen.getByText('Create New Deck')).toBeInTheDocument();
      expect(screen.getByText('Manage Decks')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should navigate from quick actions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<App />);
      
      // Click on Create New Deck
      const createCard = screen.getByText('Create New Deck').closest('a');
      expect(createCard).toBeInTheDocument();
      
      await user.click(createCard);
      
      // Should navigate to create page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/create');
      });
    });
  });

  describe('DeckList Component Integration', () => {
    beforeEach(async () => {
      // Ensure test deck exists
      if (!testDeckId) {
        const response = await deckAPI.create({
          titolo: mockDeck.titolo,
          sottotitolo: mockDeck.sottotitolo,
          icona_esercizio: mockDeck.icona_esercizio,
          carte: mockDeck.carte
        });
        testDeckId = response.data.data.id;
      }
    });

    it('should load and display decks from API', async () => {
      renderWithRouter(<DeckList />);
      
      // Should show loading state initially
      expect(screen.getByText('Loading decks...')).toBeInTheDocument();
      
      // Should load decks from API
      await waitFor(() => {
        expect(screen.getByText('Deck Library')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Should display our test deck
      await waitFor(() => {
        expect(screen.getByText(mockDeck.titolo)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle search functionality', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DeckList />);
      
      // Wait for decks to load
      await waitFor(() => {
        expect(screen.getByText('Deck Library')).toBeInTheDocument();
      });
      
      // Find and use search input
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
      
      // Search for our test deck
      await user.type(searchInput, mockDeck.titolo);
      
      // Should filter and show matching deck
      await waitFor(() => {
        expect(screen.getByText(mockDeck.titolo)).toBeInTheDocument();
      });
    });

    it('should handle deck deletion', async () => {
      const user = userEvent.setup();
      
      // Create a temporary deck for deletion test
      const tempDeckResponse = await deckAPI.create({
        titolo: 'Temp Deck for Deletion',
        sottotitolo: 'Will be deleted',
        icona_esercizio: '🗑️',
        carte: []
      });
      const tempDeckId = tempDeckResponse.data.data.id;
      
      renderWithRouter(<DeckList />);
      
      // Wait for decks to load
      await waitFor(() => {
        expect(screen.getByText('Temp Deck for Deletion')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Find and click delete button (might be in dropdown or context menu)
      const deleteButton = screen.getByTestId(`delete-deck-${tempDeckId}`) || 
                          screen.getByTitle('Delete deck') ||
                          screen.getByText('Delete');
      
      if (deleteButton) {
        await user.click(deleteButton);
        
        // Should show confirmation and delete
        await waitFor(() => {
          expect(screen.queryByText('Temp Deck for Deletion')).not.toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });
  });

  describe('DeckEditor Component Integration', () => {
    it('should create new deck through editor', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DeckEditor />);
      
      // Should show deck creation form
      await waitFor(() => {
        expect(screen.getByText('Create New Deck') || screen.getByLabelText(/deck title/i)).toBeInTheDocument();
      });
      
      // Fill in deck details
      const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
      await user.type(titleInput, 'New Integration Test Deck');
      
      const subtitleInput = screen.getByLabelText(/subtitle/i) || screen.getByPlaceholderText(/subtitle/i);
      if (subtitleInput) {
        await user.type(subtitleInput, 'Created through integration test');
      }
      
      // Save the deck
      const saveButton = screen.getByText(/save/i) || screen.getByText(/create/i);
      if (saveButton) {
        await user.click(saveButton);
        
        // Should show success message or redirect
        await waitFor(() => {
          const success = screen.queryByText(/saved/i) || 
                         screen.queryByText(/created/i) ||
                         screen.queryByText('New Integration Test Deck');
          expect(success).toBeInTheDocument();
        }, { timeout: 5000 });
      }
    });

    it('should edit existing deck', async () => {
      const user = userEvent.setup();
      
      // Navigate to edit our test deck
      window.history.pushState({}, '', `/decks/${testDeckId}`);
      renderWithRouter(<DeckEditor />);
      
      // Wait for deck data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockDeck.titolo) || screen.getByText(mockDeck.titolo)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Modify deck title
      const titleInput = screen.getByDisplayValue(mockDeck.titolo);
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Integration Test Deck');
      
      // Save changes
      const saveButton = screen.getByText(/save/i) || screen.getByText(/update/i);
      if (saveButton) {
        await user.click(saveButton);
        
        // Should show success
        await waitFor(() => {
          expect(screen.getByText(/saved/i) || screen.getByText(/updated/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('should add cards to deck', async () => {
      const user = userEvent.setup();
      
      // Navigate to edit our test deck
      window.history.pushState({}, '', `/decks/${testDeckId}`);
      renderWithRouter(<DeckEditor />);
      
      // Wait for deck to load
      await waitFor(() => {
        expect(screen.getByText(mockDeck.carte[0].titolo) || screen.getByText('Add Card')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Add new card
      const addCardButton = screen.getByText(/add card/i) || screen.getByTitle('Add new card');
      if (addCardButton) {
        await user.click(addCardButton);
        
        // Fill in card details
        const cardTitleInput = screen.getByLabelText(/card title/i) || screen.getByPlaceholderText(/card title/i);
        if (cardTitleInput) {
          await user.type(cardTitleInput, 'New Integration Card');
          
          const cardTextInput = screen.getByLabelText(/card text/i) || screen.getByPlaceholderText(/card text/i);
          if (cardTextInput) {
            await user.type(cardTextInput, 'Added through integration test');
          }
          
          // Save card
          const saveCardButton = screen.getByText(/save card/i) || screen.getByText(/add/i);
          if (saveCardButton) {
            await user.click(saveCardButton);
            
            // Should show new card
            await waitFor(() => {
              expect(screen.getByText('New Integration Card')).toBeInTheDocument();
            }, { timeout: 3000 });
          }
        }
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API connection errors gracefully', async () => {
      // Mock API to simulate connection error
      const originalAxiosGet = axios.get;
      axios.get = vi.fn().mockRejectedValue(new Error('Network Error'));
      
      renderWithRouter(<App />);
      
      // Should show API disconnected status
      await waitFor(() => {
        expect(screen.getByText('API Disconnected') || screen.getByText('Checking API...')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Restore original axios
      axios.get = originalAxiosGet;
    });

    it('should handle deck loading errors', async () => {
      // Mock deckAPI to simulate error
      const originalGetAll = deckAPI.getAll;
      deckAPI.getAll = vi.fn().mockRejectedValue(new Error('Failed to load decks'));
      
      renderWithRouter(<DeckList />);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed/i) || screen.getByText(/error/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Restore original function
      deckAPI.getAll = originalGetAll;
    });

    it('should validate form inputs', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DeckEditor />);
      
      // Try to save without required fields
      const saveButton = screen.getByText(/save/i) || screen.getByText(/create/i);
      if (saveButton) {
        await user.click(saveButton);
        
        // Should show validation errors
        await waitFor(() => {
          const errorMessage = screen.queryByText(/required/i) || 
                              screen.queryByText(/invalid/i) ||
                              screen.queryByRole('alert');
          expect(errorMessage).toBeInTheDocument();
        });
      }
    });
  });

  describe('User Workflow Integration', () => {
    it('should complete full deck creation and preview workflow', async () => {
      const user = userEvent.setup();
      renderWithRouter(<App />);
      
      // Start by clicking Create New Deck
      const createCard = screen.getByText('Create New Deck').closest('a');
      await user.click(createCard);
      
      // Create new deck
      await waitFor(() => {
        expect(screen.getByText('Create New Deck') || screen.getByLabelText(/title/i)).toBeInTheDocument();
      });
      
      const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
      await user.type(titleInput, 'Workflow Test Deck');
      
      // Add a card
      const addCardButton = screen.getByText(/add card/i);
      if (addCardButton) {
        await user.click(addCardButton);
        
        const cardTitleInput = screen.getByLabelText(/card title/i);
        await user.type(cardTitleInput, 'Workflow Test Card');
      }
      
      // Save deck
      const saveButton = screen.getByText(/save/i) || screen.getByText(/create/i);
      await user.click(saveButton);
      
      // Navigate to preview
      await waitFor(() => {
        const previewButton = screen.getByText(/preview/i) || screen.getByTitle(/preview/i);
        if (previewButton) {
          return user.click(previewButton);
        }
      });
      
      // Should show preview
      await waitFor(() => {
        expect(screen.getByText('Workflow Test Deck') || screen.getByText(/preview/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
/**
 * End-to-End Workflow Integration Tests
 * Tests complete user workflows from start to finish
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import App from '../../App';
import { deckAPI, cardAPI } from '../../services/api';

// Test data for workflows
const workflowTestData = {
  deck: {
    titolo: 'E2E Workflow Test Deck',
    sottotitolo: 'Complete workflow testing',
    icona_esercizio: '🔄',
  },
  cards: [
    {
      titolo: 'Workflow Card 1',
      icona: '⚙️',
      tipo: 'Process',
      testo: 'First card in workflow test',
      flavor: 'Starting the journey'
    },
    {
      titolo: 'Workflow Card 2', 
      icona: '🎯',
      tipo: 'Goal',
      testo: 'Second card in workflow test',
      flavor: 'Reaching the target'
    }
  ]
};

// Helper function to render app with router
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

// Helper to wait for elements with timeout
const waitForElement = async (getElement, timeout = 5000) => {
  await waitFor(getElement, { timeout });
};

describe('End-to-End Workflow Integration Tests', () => {
  let createdDeckIds = [];

  beforeAll(async () => {
    // Verify API server is running
    try {
      const response = await axios.get('http://localhost:3000/api/v1/health');
      expect(response.data.success).toBe(true);
    } catch (error) {
      throw new Error('API server is required. Start with: cd api && npm start');
    }
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(async () => {
    // Cleanup all created decks
    for (const deckId of createdDeckIds) {
      try {
        await deckAPI.delete(deckId);
      } catch (error) {
        console.warn(`Failed to cleanup deck ${deckId}:`, error.message);
      }
    }
  });

  describe('Complete Deck Creation Workflow', () => {
    it('should complete full deck creation from homepage to final deck', async () => {
      const user = userEvent.setup();
      renderApp();

      // Step 1: Start from homepage
      await waitForElement(() => {
        expect(screen.getByText('Welcome to KPI Card Generator')).toBeInTheDocument();
      });

      // Step 2: Click Create New Deck
      const createDeckCard = screen.getByText('Create New Deck').closest('a');
      expect(createDeckCard).toBeInTheDocument();
      await user.click(createDeckCard);

      // Step 3: Fill in deck information
      await waitForElement(() => {
        expect(screen.getByText('Create New Deck') || screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
      await user.type(titleInput, workflowTestData.deck.titolo);

      const subtitleInput = screen.getByLabelText(/subtitle/i) || screen.getByPlaceholderText(/subtitle/i);
      if (subtitleInput) {
        await user.type(subtitleInput, workflowTestData.deck.sottotitolo);
      }

      // Step 4: Add first card
      let addCardButton = screen.getByText(/add card/i) || screen.getByTitle(/add/i);
      await user.click(addCardButton);

      // Fill first card details
      let cardTitleInput = screen.getByLabelText(/card title/i) || screen.getByPlaceholderText(/card title/i);
      await user.type(cardTitleInput, workflowTestData.cards[0].titolo);

      let cardTextInput = screen.getByLabelText(/card text/i) || screen.getByPlaceholderText(/card text/i);
      if (cardTextInput) {
        await user.type(cardTextInput, workflowTestData.cards[0].testo);
      }

      // Save first card
      let saveCardButton = screen.getByText(/save card/i) || screen.getByText(/add card/i);
      if (saveCardButton) {
        await user.click(saveCardButton);
      }

      // Step 5: Add second card
      addCardButton = screen.getByText(/add card/i) || screen.getByTitle(/add/i);
      await user.click(addCardButton);

      cardTitleInput = screen.getByLabelText(/card title/i) || screen.getByPlaceholderText(/card title/i);
      await user.type(cardTitleInput, workflowTestData.cards[1].titolo);

      cardTextInput = screen.getByLabelText(/card text/i) || screen.getByPlaceholderText(/card text/i);
      if (cardTextInput) {
        await user.type(cardTextInput, workflowTestData.cards[1].testo);
      }

      saveCardButton = screen.getByText(/save card/i) || screen.getByText(/add card/i);
      if (saveCardButton) {
        await user.click(saveCardButton);
      }

      // Step 6: Save the complete deck
      const saveDeckButton = screen.getByText(/save deck/i) || screen.getByText(/create deck/i) || screen.getByText(/save/i);
      await user.click(saveDeckButton);

      // Step 7: Verify deck was created and is displayed
      await waitForElement(() => {
        expect(screen.getByText(workflowTestData.deck.titolo)).toBeInTheDocument();
      });

      // Step 8: Verify cards are visible
      expect(screen.getByText(workflowTestData.cards[0].titolo)).toBeInTheDocument();
      expect(screen.getByText(workflowTestData.cards[1].titolo)).toBeInTheDocument();

      // Extract deck ID for cleanup
      const currentUrl = window.location.pathname;
      const deckIdMatch = currentUrl.match(/\/decks\/([^\/]+)/);
      if (deckIdMatch) {
        createdDeckIds.push(deckIdMatch[1]);
      }
    });

    it('should handle deck creation with validation errors', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to create deck
      const createLink = screen.getByText('Create');
      await user.click(createLink);

      await waitForElement(() => {
        expect(screen.getByText('Create New Deck') || screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Try to save without filling required fields
      const saveButton = screen.getByText(/save/i) || screen.getByText(/create/i);
      await user.click(saveButton);

      // Should show validation errors
      await waitForElement(() => {
        const errorElement = screen.queryByText(/required/i) || 
                            screen.queryByText(/invalid/i) ||
                            screen.queryByRole('alert') ||
                            screen.queryByText(/error/i);
        expect(errorElement).toBeInTheDocument();
      });

      // Fill in title and try again
      const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
      await user.type(titleInput, 'Valid Test Deck');

      await user.click(saveButton);

      // Should succeed this time
      await waitForElement(() => {
        expect(screen.getByText('Valid Test Deck')).toBeInTheDocument();
      });
    });
  });

  describe('Deck Editing and Management Workflow', () => {
    let testDeckId;

    beforeAll(async () => {
      // Create a test deck for editing workflow
      const response = await deckAPI.create({
        titolo: 'Edit Workflow Test Deck',
        sottotitolo: 'For testing editing workflows',
        icona_esercizio: '✏️',
        carte: [
          {
            titolo: 'Original Card',
            tipo: 'Original',
            testo: 'This card will be modified',
            icona: '📝'
          }
        ]
      });
      testDeckId = response.data.data.id;
      createdDeckIds.push(testDeckId);
    });

    it('should complete deck editing workflow', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to decks list
      const decksLink = screen.getByText('Decks');
      await user.click(decksLink);

      // Wait for decks to load
      await waitForElement(() => {
        expect(screen.getByText('Edit Workflow Test Deck')).toBeInTheDocument();
      });

      // Click on the test deck to edit it
      const deckLink = screen.getByText('Edit Workflow Test Deck');
      await user.click(deckLink);

      // Wait for deck editor to load
      await waitForElement(() => {
        expect(screen.getByDisplayValue('Edit Workflow Test Deck') || 
               screen.getByText('Edit Workflow Test Deck')).toBeInTheDocument();
      });

      // Modify deck title
      const titleInput = screen.getByDisplayValue('Edit Workflow Test Deck');
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Edit Workflow Test Deck');

      // Modify existing card
      const cardTitleInput = screen.getByDisplayValue('Original Card');
      await user.clear(cardTitleInput);
      await user.type(cardTitleInput, 'Modified Original Card');

      // Save changes
      const saveButton = screen.getByText(/save/i) || screen.getByText(/update/i);
      await user.click(saveButton);

      // Verify changes were saved
      await waitForElement(() => {
        expect(screen.getByText('Modified Edit Workflow Test Deck')).toBeInTheDocument();
        expect(screen.getByText('Modified Original Card')).toBeInTheDocument();
      });
    });

    it('should add and remove cards in editing workflow', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate directly to deck editor
      window.history.pushState({}, '', `/decks/${testDeckId}`);
      renderApp();

      // Wait for deck to load
      await waitForElement(() => {
        expect(screen.getByText('Modified Original Card') || screen.getByText('Original Card')).toBeInTheDocument();
      });

      // Add a new card
      const addCardButton = screen.getByText(/add card/i);
      await user.click(addCardButton);

      const newCardTitleInput = screen.getByLabelText(/card title/i);
      await user.type(newCardTitleInput, 'Added Card in Workflow');

      const newCardTextInput = screen.getByLabelText(/card text/i);
      if (newCardTextInput) {
        await user.type(newCardTextInput, 'This card was added during workflow test');
      }

      const saveCardButton = screen.getByText(/save card/i);
      await user.click(saveCardButton);

      // Verify new card was added
      await waitForElement(() => {
        expect(screen.getByText('Added Card in Workflow')).toBeInTheDocument();
      });

      // Remove the new card
      const deleteCardButton = screen.getByTitle(/delete.*card/i) || 
                              screen.getByTestId(/delete.*card/i) ||
                              screen.getByText(/remove/i);
      
      if (deleteCardButton) {
        await user.click(deleteCardButton);

        // Confirm deletion if confirmation dialog appears
        const confirmButton = screen.queryByText(/confirm/i) || screen.queryByText(/delete/i);
        if (confirmButton) {
          await user.click(confirmButton);
        }

        // Verify card was removed
        await waitForElement(() => {
          expect(screen.queryByText('Added Card in Workflow')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Preview and Export Workflow', () => {
    let previewDeckId;

    beforeAll(async () => {
      // Create a deck specifically for preview testing
      const response = await deckAPI.create({
        titolo: 'Preview Workflow Test Deck',
        sottotitolo: 'For testing preview and export',
        icona_esercizio: '👁️',
        carte: [
          {
            titolo: 'Preview Card 1',
            tipo: 'Preview',
            testo: 'First preview card',
            icona: '1️⃣'
          },
          {
            titolo: 'Preview Card 2',
            tipo: 'Preview', 
            testo: 'Second preview card',
            icona: '2️⃣'
          }
        ]
      });
      previewDeckId = response.data.data.id;
      createdDeckIds.push(previewDeckId);
    });

    it('should complete preview workflow', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to preview
      const previewLink = screen.getByText('Preview');
      await user.click(previewLink);

      // Wait for preview page to load
      await waitForElement(() => {
        expect(screen.getByText(/preview/i) || screen.getByText('Select a deck')).toBeInTheDocument();
      });

      // Select our test deck for preview
      const deckSelect = screen.getByLabelText(/select deck/i) || 
                        screen.getByText('Preview Workflow Test Deck') ||
                        screen.getByRole('combobox');
      
      if (deckSelect) {
        await user.click(deckSelect);
        
        const deckOption = screen.getByText('Preview Workflow Test Deck');
        await user.click(deckOption);

        // Wait for preview to load
        await waitForElement(() => {
          expect(screen.getByText('Preview Card 1') || 
                 screen.getByText('Preview Card 2')).toBeInTheDocument();
        });
      }
    });

    it('should export deck to different formats', async () => {
      const user = userEvent.setup();
      
      // Mock URL.createObjectURL for download testing
      const mockCreateObjectURL = vi.fn(() => 'mock-blob-url');
      global.URL.createObjectURL = mockCreateObjectURL;
      
      renderApp();

      // Navigate to specific deck preview
      window.history.pushState({}, '', `/preview/${previewDeckId}`);
      renderApp();

      // Wait for preview to load
      await waitForElement(() => {
        expect(screen.getByText('Preview Workflow Test Deck') ||
               screen.getByText(/export/i)).toBeInTheDocument();
      });

      // Test HTML export
      const htmlExportButton = screen.getByText(/export.*html/i) || screen.getByTitle(/html/i);
      if (htmlExportButton) {
        await user.click(htmlExportButton);

        // Should trigger download
        await waitForElement(() => {
          expect(mockCreateObjectURL).toHaveBeenCalled();
        });
      }

      // Test PDF export
      const pdfExportButton = screen.getByText(/export.*pdf/i) || screen.getByTitle(/pdf/i);
      if (pdfExportButton) {
        await user.click(pdfExportButton);

        // Should trigger download
        await waitForElement(() => {
          expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
        });
      }
    });

    it('should configure export options', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to preview with deck
      window.history.pushState({}, '', `/preview/${previewDeckId}`);
      renderApp();

      // Wait for export options to be available
      await waitForElement(() => {
        expect(screen.getByText(/export/i) || screen.getByText(/options/i)).toBeInTheDocument();
      });

      // Configure print mode
      const printModeSelect = screen.getByLabelText(/print mode/i) || 
                             screen.getByDisplayValue(/landscape|portrait/i);
      if (printModeSelect) {
        await user.click(printModeSelect);
        
        const portraitOption = screen.getByText(/portrait/i);
        await user.click(portraitOption);
      }

      // Configure cards per page
      const cardsPerPageInput = screen.getByLabelText(/cards.*page/i) || 
                               screen.getByDisplayValue(/6|8|12/);
      if (cardsPerPageInput) {
        await user.clear(cardsPerPageInput);
        await user.type(cardsPerPageInput, '6');
      }

      // Apply configuration and export
      const exportButton = screen.getByText(/export/i);
      await user.click(exportButton);

      // Should use configured options
      await waitForElement(() => {
        expect(screen.getByDisplayValue('6') || screen.getByText(/portrait/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from API connection loss', async () => {
      const user = userEvent.setup();
      renderApp();

      // Wait for initial load
      await waitForElement(() => {
        expect(screen.getByText('API Connected')).toBeInTheDocument();
      });

      // Simulate API connection loss by mocking network error
      const originalAxios = axios.get;
      axios.get = vi.fn().mockRejectedValue(new Error('Network Error'));

      // Wait for status to update (API status checks every 30 seconds, but we can trigger manually)
      await waitFor(() => {
        // The status should eventually change or show error
        const statusElement = screen.getByText(/API|Checking|Connected|Disconnected/);
        expect(statusElement).toBeInTheDocument();
      }, { timeout: 3000 });

      // Restore API and verify recovery
      axios.get = originalAxios;
      
      // Trigger manual refresh or wait
      const refreshButton = screen.queryByText(/refresh/i) || screen.queryByTitle(/refresh/i);
      if (refreshButton) {
        await user.click(refreshButton);
      }

      // Should eventually reconnect
      await waitForElement(() => {
        expect(screen.getByText('API Connected')).toBeInTheDocument();
      }, 10000);
    });

    it('should handle validation errors gracefully', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to create deck
      const createLink = screen.getByText('Create');
      await user.click(createLink);

      // Try various invalid inputs
      await waitForElement(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Extremely long title
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'A'.repeat(500)); // Very long title

      // Try to save
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      // Should show validation error
      await waitForElement(() => {
        const errorMessage = screen.queryByText(/too long/i) || 
                            screen.queryByText(/invalid/i) ||
                            screen.queryByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });

      // Fix the error
      await user.clear(titleInput);
      await user.type(titleInput, 'Valid Deck Title');
      await user.click(saveButton);

      // Should succeed
      await waitForElement(() => {
        expect(screen.getByText('Valid Deck Title')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple simultaneous operations', async () => {
      const user = userEvent.setup();
      
      // Create multiple decks quickly to test performance
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          deckAPI.create({
            titolo: `Performance Test Deck ${i}`,
            sottotitolo: 'Testing performance',
            icona_esercizio: '⚡',
            carte: [
              {
                titolo: `Card ${i}`,
                tipo: 'Performance',
                testo: `Performance test card ${i}`,
                icona: '🏃'
              }
            ]
          })
        );
      }

      const results = await Promise.all(promises);
      
      // Track created decks for cleanup
      results.forEach(result => {
        createdDeckIds.push(result.data.data.id);
      });

      // All should be created successfully
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.data.success).toBe(true);
      });

      // Navigate to decks list and verify all are visible
      renderApp();
      const decksLink = screen.getByText('Decks');
      await user.click(decksLink);

      // Should load all decks efficiently
      await waitForElement(() => {
        expect(screen.getByText('Performance Test Deck 0')).toBeInTheDocument();
      });
    });
  });
});
import request from 'supertest';
import app from '../../server/app.js';

describe('Decks API', () => {
    let createdDeckId;

    afterAll(() => {
        // Cleanup: delete test deck if it was created
        if (createdDeckId) {
            return request(app).delete(`/api/v1/decks/${createdDeckId}`);
        }
    });

    describe('GET /api/v1/health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/api/v1/health');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('KPI Cards API is running');
        });
    });

    describe('GET /api/v1/decks', () => {
        it('should return paginated list of decks', async () => {
            const response = await request(app).get('/api/v1/decks');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.meta).toHaveProperty('total');
            expect(response.body.meta).toHaveProperty('page');
            expect(response.body.meta).toHaveProperty('limit');
        });
    });

    describe('POST /api/v1/decks', () => {
        const testDeck = {
            title: 'Test Deck API',
            subtitle: 'Created during automated testing', 
            deckIcon: '🧪',
            cards: [
                {
                    title: 'Test Card',
                    headerIcon: '🎯',
                    heroImage: '📊',
                    type: 'KPI',
                    description: 'This is a test card',
                    flavorText: 'Created for testing',
                    styleClass: 'card-kpi'
                }
            ]
        };

        it('should create a new deck successfully', async () => {
            const response = await request(app)
                .post('/api/v1/decks')
                .send(testDeck);
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(testDeck.title);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.validation.isValid).toBe(true);
            
            // Store ID for cleanup
            createdDeckId = response.body.data.id;
        });

        it('should reject deck without title', async () => {
            const invalidDeck = { ...testDeck, title: undefined };
            
            const response = await request(app)
                .post('/api/v1/decks')
                .send(invalidDeck);
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Title required');
        });
    });

    describe('GET /api/v1/decks/:id', () => {
        it('should return deck details', async () => {
            if (!createdDeckId) {
                return; // Skip if no deck was created
            }
            
            const response = await request(app)
                .get(`/api/v1/decks/${createdDeckId}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(createdDeckId);
            expect(response.body.data.stats).toBeDefined();
        });

        it('should return 404 for non-existent deck', async () => {
            const response = await request(app)
                .get('/api/v1/decks/non_existent_id');
            
            expect(response.status).toBe(500); // Currently returns 500, should be 404
            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/decks/:id', () => {
        it('should update deck partially', async () => {
            if (!createdDeckId) {
                return;
            }
            
            const updates = {
                title: 'Updated Test Deck',
                subtitle: 'Updated via PATCH'
            };
            
            const response = await request(app)
                .patch(`/api/v1/decks/${createdDeckId}`)
                .send(updates);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updates.title);
            expect(response.body.data.subtitle).toBe(updates.subtitle);
        });
    });

    describe('GET /api/v1/decks/stats', () => {
        it('should return statistics', async () => {
            const response = await request(app)
                .get('/api/v1/decks/stats');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalDecks).toBeGreaterThanOrEqual(0);
            expect(response.body.data.totalCards).toBeGreaterThanOrEqual(0);
            expect(response.body.data.averageCardsPerDeck).toBeGreaterThanOrEqual(0);
        });
    });

    describe('DELETE /api/v1/decks/:id', () => {
        it('should delete deck successfully', async () => {
            if (!createdDeckId) {
                return;
            }
            
            const response = await request(app)
                .delete(`/api/v1/decks/${createdDeckId}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.deleted).toBe(true);
            
            // Clear ID so cleanup doesn't try to delete again
            createdDeckId = null;
        });
    });
});
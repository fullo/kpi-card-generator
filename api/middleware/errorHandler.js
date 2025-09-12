/**
 * Error handler middleware centralizzato
 * Gestisce tutti gli errori dell'API con response strutturate
 */

export const errorHandler = (error, req, res, next) => {
    // Log error per debugging
    console.error('API Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        timestamp: new Date().toISOString()
    });

    // Errori di validazione Joi
    if (error.isJoi) {
        return res.status(400).json({
            success: false,
            error: 'Dati non validi',
            details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }))
        });
    }

    // Errori di validazione custom (DeckValidator)
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Dati non validi',
            details: error.details || [{ message: error.message }]
        });
    }

    // Errori delle classi esistenti
    if (error.name === 'PDFGenerationError') {
        return res.status(500).json({
            success: false,
            error: 'Errore nella generazione PDF',
            message: error.message
        });
    }

    // File non trovato
    if (error.code === 'ENOENT') {
        return res.status(404).json({
            success: false,
            error: 'Risorsa non trovata',
            message: 'Il file o la risorsa richiesta non esiste'
        });
    }

    // Errori di parsing JSON
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: 'JSON non valido',
            message: 'Il formato del JSON inviato non è valido'
        });
    }

    // Rate limiting
    if (error.status === 429) {
        return res.status(429).json({
            success: false,
            error: 'Troppi tentativi',
            message: 'Hai superato il limite di richieste. Riprova più tardi.'
        });
    }

    // Errore generico
    const statusCode = error.status || error.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Si è verificato un errore interno'
        : error.message;

    res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? 'Errore interno del server' : 'Errore',
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

/**
 * Middleware per gestire le route non trovate
 */
export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route non trovata: ${req.method} ${req.path}`);
    error.status = 404;
    next(error);
};

/**
 * Wrapper per funzioni async che automaticamente cattura gli errori
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
import app from './app.js';

/**
 * Server Entry Point
 * KPI Cards API Server
 */

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 KPI Cards API Server started`);
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🌐 Server running on: http://${HOST}:${PORT}`);
    console.log(`📖 API Documentation: http://${HOST}:${PORT}/api-docs`);
    console.log(`❤️  Health Check: http://${HOST}:${PORT}/api/v1/health`);
    console.log(`📊 API Endpoints: http://${HOST}:${PORT}/api/v1`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error('Please try a different port or stop the conflicting process');
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
        process.exit(1);
    }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} ricevuto, chiusura server...`);
    
    server.close(() => {
        console.log('✅ Server chiuso correttamente');
        process.exit(0);
    });

    // Force close after 10 secondi
    setTimeout(() => {
        console.error('❌ Forzatura chiusura server dopo timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
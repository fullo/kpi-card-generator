#!/usr/bin/env node

/**
 * Modern CLI for KPI Card Generator
 * 
 * This is the new, modular CLI interface that uses the refactored
 * class-based architecture for better maintainability and testing.
 */

import { CLIInterface } from '../class/CLIInterface.js';

async function main() {
    try {
        const cli = new CLIInterface({
            verbose: process.env.DEBUG === '1',
            enableProgress: true,
            validateInput: true
        });

        await cli.run(process.argv);
    } catch (error) {
        console.error('❌ Errore critico nell\'avvio del CLI:', error.message);
        
        if (process.env.DEBUG === '1') {
            console.error('\n🔍 Stack trace:');
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

// Gestisce segnali di interruzione per cleanup pulito
process.on('SIGINT', () => {
    console.log('\n⏹️  Interruzione ricevuta, pulizia in corso...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  Terminazione ricevuta, pulizia in corso...');
    process.exit(0);
});

// Avvia l'applicazione
main();
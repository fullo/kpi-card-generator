#!/usr/bin/env node

// Script per verificare che l'algoritmo sia ora corretto
import { calculatePaginatedLayouts } from '../kpi-card-generator.js';

console.log('🔍 VERIFICA CORREZIONE ALGORITMO\n');
console.log('=' .repeat(50));

// Funzione per visualizzare il layout in formato griglia
function showGrid(cards, cardsPerRow = 4) {
    const rows = [];
    for (let i = 0; i < cards.length; i += cardsPerRow) {
        const row = cards.slice(i, i + cardsPerRow).map(c => 
            c.isPlaceholder ? 'P' : c.id
        );
        rows.push(row.join('  '));
    }
    return rows;
}

// Test con 10 carte
const cards10 = [];
for (let i = 1; i <= 10; i++) {
    cards10.push({ id: `C${i}` });
}

console.log('\n📋 TEST CON 10 CARTE\n');

// LANDSCAPE (default)
console.log('=== MODALITÀ LANDSCAPE (capovolgi sul lato lungo) ===\n');
const landscapePages = calculatePaginatedLayouts(cards10, 8, 4, 'landscape');

console.log('FOGLIO 1:');
console.log('Fronte:');
const l1FrontRows = showGrid(landscapePages[0].fronts);
l1FrontRows.forEach(row => console.log('  ' + row));

console.log('Retro:');
const l1BackRows = showGrid(landscapePages[0].backs);
l1BackRows.forEach(row => console.log('  ' + row));

console.log('\nFOGLIO 2:');
console.log('Fronte:');
const l2FrontRows = showGrid(landscapePages[1].fronts);
l2FrontRows.forEach(row => console.log('  ' + row));

console.log('Retro:');
const l2BackRows = showGrid(landscapePages[1].backs);
l2BackRows.forEach(row => console.log('  ' + row));

// PORTRAIT
console.log('\n=== MODALITÀ PORTRAIT (capovolgi sul lato corto) ===\n');
const portraitPages = calculatePaginatedLayouts(cards10, 8, 4, 'portrait');

console.log('FOGLIO 1:');
console.log('Fronte:');
const p1FrontRows = showGrid(portraitPages[0].fronts);
p1FrontRows.forEach(row => console.log('  ' + row));

console.log('Retro:');
const p1BackRows = showGrid(portraitPages[0].backs);
p1BackRows.forEach(row => console.log('  ' + row));

console.log('\nFOGLIO 2:');
console.log('Fronte:');
const p2FrontRows = showGrid(portraitPages[1].fronts);
p2FrontRows.forEach(row => console.log('  ' + row));

console.log('Retro:');
const p2BackRows = showGrid(portraitPages[1].backs);
p2BackRows.forEach(row => console.log('  ' + row));

// VERIFICA CORRETTEZZA
console.log('\n' + '=' .repeat(50));
console.log('📊 VERIFICA CORRETTEZZA\n');

// Verifica LANDSCAPE Foglio 2
const expectedLandscapeF2Back = [
    ['P', 'P', 'C10', 'C9'],
    ['P', 'P', 'P', 'P']
];

const actualLandscapeF2Back = [];
for (let i = 0; i < landscapePages[1].backs.length; i += 4) {
    actualLandscapeF2Back.push(
        landscapePages[1].backs.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : c.id)
    );
}

const landscapeCorrect = JSON.stringify(expectedLandscapeF2Back) === JSON.stringify(actualLandscapeF2Back);

// Verifica PORTRAIT Foglio 2
const expectedPortraitF2Back = [
    ['P', 'P', 'P', 'P'],
    ['P', 'P', 'C10', 'C9']
];

const actualPortraitF2Back = [];
for (let i = 0; i < portraitPages[1].backs.length; i += 4) {
    actualPortraitF2Back.push(
        portraitPages[1].backs.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : c.id)
    );
}

const portraitCorrect = JSON.stringify(expectedPortraitF2Back) === JSON.stringify(actualPortraitF2Back);

console.log('LANDSCAPE - Foglio 2 Retro:');
console.log('  Atteso:  P P C10 C9 / P P P P');
console.log('  Risultato:', landscapeCorrect ? '✅ CORRETTO' : '❌ ERRATO');
if (!landscapeCorrect) {
    console.log('  Ricevuto:', actualLandscapeF2Back);
}

console.log('\nPORTRAIT - Foglio 2 Retro:');
console.log('  Atteso:  P P P P / P P C10 C9');
console.log('  Risultato:', portraitCorrect ? '✅ CORRETTO' : '❌ ERRATO');
if (!portraitCorrect) {
    console.log('  Ricevuto:', actualPortraitF2Back);
}

// Test con 8 carte per verificare foglio completo
console.log('\n' + '=' .repeat(50));
console.log('📋 TEST CON 8 CARTE (foglio completo)\n');

const cards8 = [];
for (let i = 1; i <= 8; i++) {
    cards8.push({ id: `C${i}` });
}

const landscape8 = calculatePaginatedLayouts(cards8, 8, 4, 'landscape');
const portrait8 = calculatePaginatedLayouts(cards8, 8, 4, 'portrait');

console.log('LANDSCAPE Retro:');
const l8BackRows = showGrid(landscape8[0].backs);
l8BackRows.forEach(row => console.log('  ' + row));

console.log('\nPORTRAIT Retro:');
const p8BackRows = showGrid(portrait8[0].backs);
p8BackRows.forEach(row => console.log('  ' + row));

// Verifica 8 carte
const expectedLandscape8 = [
    ['C4', 'C3', 'C2', 'C1'],
    ['C8', 'C7', 'C6', 'C5']
];

const actualLandscape8 = [];
for (let i = 0; i < landscape8[0].backs.length; i += 4) {
    actualLandscape8.push(
        landscape8[0].backs.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : c.id)
    );
}

const landscape8Correct = JSON.stringify(expectedLandscape8) === JSON.stringify(actualLandscape8);

console.log('\nRisultato LANDSCAPE 8 carte:', landscape8Correct ? '✅ CORRETTO' : '❌ ERRATO');
if (!landscape8Correct) {
    console.log('  Atteso:', expectedLandscape8);
    console.log('  Ricevuto:', actualLandscape8);
}

const expectedPortrait8 = [
    ['C8', 'C7', 'C6', 'C5'],
    ['C4', 'C3', 'C2', 'C1']
];

const actualPortrait8 = [];
for (let i = 0; i < portrait8[0].backs.length; i += 4) {
    actualPortrait8.push(
        portrait8[0].backs.slice(i, i + 4).map(c => c.isPlaceholder ? 'P' : c.id)
    );
}

const portrait8Correct = JSON.stringify(expectedPortrait8) === JSON.stringify(actualPortrait8);

console.log('Risultato PORTRAIT 8 carte:', portrait8Correct ? '✅ CORRETTO' : '❌ ERRATO');
if (!portrait8Correct) {
    console.log('  Atteso:', expectedPortrait8);
    console.log('  Ricevuto:', actualPortrait8);
}

// Risultato finale
console.log('\n' + '=' .repeat(50));
if (landscapeCorrect && portraitCorrect && landscape8Correct && portrait8Correct) {
    console.log('🎉 TUTTI I TEST PASSANO - ALGORITMO CORRETTO!');
} else {
    console.log('❌ ALCUNI TEST FALLISCONO - VERIFICARE IL CODICE');
}
console.log('=' .repeat(50));
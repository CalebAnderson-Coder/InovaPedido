/**
 * Clean Colombian price references from product descriptions AND names
 * Pass 2: also cleans product names with "1X13$ 2X20,5$" patterns
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_PATH = join(__dirname, 'public', 'data', 'productos.csv');

function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

function escapeCSV(value) {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function cleanText(text) {
    if (!text) return text;
    let cleaned = text;

    // === COLOMBIAN PRICE PATTERNS ===

    // Remove full promo clauses: "PROMOCIÓN: Por la compra de cada $XX,XXX ... / "
    cleaned = cleaned.replace(/PROMOCI[OÓ]N:\s*Por la compra de cada \$[\d.,]+[^/]*\/?\s*/gi, '');

    // Remove "Por la compra de cada $XX,XXX..." clauses
    cleaned = cleaned.replace(/Por la compra de cada \$[\d.,]+[^.]*\.\s*/gi, '');

    // Remove Colombian prices: $40,000 / $29.990 / $52,990 (3+ digits after separator = thousands)
    cleaned = cleaned.replace(/\$\s*\d{1,3}[.,]\d{3}([.,]\d{3})*/g, '');

    // Remove "XX,XXX pesos" patterns
    cleaned = cleaned.replace(/\d{1,3}[.,]\d{3}([.,]\d{3})*\s*pesos/gi, '');

    // === PRICING SHORTHAND PATTERNS ===

    // Remove "1X13$ 2X20,5$" or "2X49$" patterns (price-per-quantity in product names)
    cleaned = cleaned.replace(/\s*\d+X[\d,]+\$\s*/g, ' ');

    // === CLEANUP ===
    cleaned = cleaned.replace(/\s*\/\s*$/, '');     // trailing slash
    cleaned = cleaned.replace(/^\s*\/\s*/, '');      // leading slash
    cleaned = cleaned.replace(/\s{2,}/g, ' ');       // multiple spaces
    cleaned = cleaned.replace(/\.\s*\.\s*/g, '. ');  // double dots
    cleaned = cleaned.trim();

    return cleaned;
}

// === Main ===
const content = readFileSync(CSV_PATH, 'utf-8');
const lines = content.split('\n').map(l => l.replace(/\r$/, ''));
const header = lines[0];

let cleanedDescCount = 0;
let cleanedNameCount = 0;
const outputLines = [header];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 9) { outputLines.push(line); continue; }

    // Clean product name (column 2)
    const originalName = fields[2];
    const cleanedName = cleanText(originalName);
    if (cleanedName !== originalName) {
        cleanedNameCount++;
        console.log(`NAME  #${cleanedNameCount} (${fields[1]}/${fields[0]}): "${originalName}" → "${cleanedName}"`);
        fields[2] = cleanedName;
    }

    // Clean description (column 3)
    const originalDesc = fields[3];
    const cleanedDesc = cleanText(originalDesc);
    if (cleanedDesc !== originalDesc) {
        cleanedDescCount++;
        if (cleanedDescCount <= 5) {
            console.log(`DESC  #${cleanedDescCount} (${fields[1]}/${fields[0]}): "${originalDesc.substring(0, 100)}" → "${cleanedDesc.substring(0, 100)}"`);
        }
        fields[3] = cleanedDesc;
    }

    outputLines.push(fields.map(f => escapeCSV(f)).join(','));
}

writeFileSync(CSV_PATH, outputLines.join('\n') + '\n', 'utf-8');

console.log(`\n✅ Cleaned ${cleanedNameCount} product names`);
console.log(`✅ Cleaned ${cleanedDescCount} descriptions`);
console.log(`📄 Total products: ${outputLines.length - 1}`);

const distPath = join(__dirname, 'dist', 'data', 'productos.csv');
if (existsSync(join(__dirname, 'dist', 'data'))) {
    writeFileSync(distPath, readFileSync(CSV_PATH, 'utf-8'), 'utf-8');
    console.log('📋 Copied to dist/data/productos.csv');
}

/**
 * Belcorp 4 Product Database Merge Script
 * 
 * Strategy A: Merge/Update
 * - Uses PRECIO FINAL column (dollar amounts) instead of Precio (COP)
 * - Includes descriptions from CSVs
 * - Adds new products, removes ones not in Belcorp 4
 * - Preserves non-Belcorp catalog products untouched
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === Configuration ===
const EXISTING_CSV_PATH = join(__dirname, 'public', 'data', 'productos.csv');
const OUTPUT_CSV_PATH = join(__dirname, 'public', 'data', 'productos.csv');
const BACKUP_CSV_PATH = join(__dirname, 'public', 'data', 'productos_backup_belcorp3.csv');

const BELCORP_CATALOGS = ['Cyzone', 'Esika', 'Lbel', 'Yanbal'];

// Column indices for each CSV
// Cyzone:  0-Página, 1-Pagina, 2-Código, 3-Nombre, 4-descripción, 5-Precio, ..., 15-PRECIO AL CATALAGO FINAL
// Esika:   0-Página, 1-Pagina, 2-Código, 3-Nombre, 4-Precio, ..., 14-PRECIO CATALAGO FINAL
// LBel:    0-Página, 1-Pagina, 2-Código, 3-Nombre, 4-Precio PESOS, ..., 14-PRECIO FINAL
// Yanbal:  0-Página, 1-Pagina, 2-Código, 3-Nombre, 4-Precio, ..., 14-PRECIO FINAL
const CSV_FILES = [
    { file: 'PRECIOS BELCORP 4 - CYZONE 04.csv', catalogo: 'Cyzone', descripcionCol: 4, precioFinalCol: 15 },
    { file: 'PRECIOS BELCORP 4 - ESIKA 04.csv', catalogo: 'Esika', descripcionCol: -1, precioFinalCol: 14 },
    { file: 'PRECIOS BELCORP 4 - LBEL 04.csv', catalogo: 'Lbel', descripcionCol: -1, precioFinalCol: 14 },
    { file: 'PRECIOS BELCORP 4 - YANBAL02.csv', catalogo: 'Yanbal', descripcionCol: -1, precioFinalCol: 14 },
];

// === CSV Parsing Helpers ===

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

/**
 * Normalize PRECIO FINAL: "20,50" → "20.50", "8,00" → "8", "21,50" → "21.50"
 * These are dollar amounts with comma as decimal separator
 */
function normalizePrecioFinal(priceStr) {
    if (!priceStr) return '';
    // Remove quotes and whitespace
    let cleaned = priceStr.replace(/"/g, '').trim();
    // Replace comma decimal separator with dot
    cleaned = cleaned.replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    // Return as clean number string (e.g., "20.5" or "8")
    return String(num);
}

// === Main Logic ===

function loadExistingProducts() {
    const content = readFileSync(EXISTING_CSV_PATH, 'utf-8');
    const lines = content.split('\n').map(l => l.replace(/\r$/, ''));
    const header = lines[0];
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCSVLine(line);
        if (fields.length < 9) continue;

        products.push({
            codigo: fields[0],
            catalogo: fields[1],
            producto: fields[2],
            descripcion: fields[3],
            precio: fields[4],
            pagina: fields[5],
            descuento: fields[6],
            tipo_oferta: fields[7],
            imagen: fields[8],
        });
    }

    return { header, products };
}

function loadNewCatalog(csvConfig) {
    const filePath = join(__dirname, csvConfig.file);
    if (!existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${csvConfig.file} — skipping`);
        return [];
    }

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.replace(/\r$/, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCSVLine(line);
        if (fields.length < 4) continue;

        const pagina = fields[1] || fields[0];
        const codigo = fields[2];
        const nombre = fields[3];

        // Get description if available
        const descripcion = csvConfig.descripcionCol >= 0 ? (fields[csvConfig.descripcionCol] || '') : '';

        // Use PRECIO FINAL column
        const precioFinal = normalizePrecioFinal(fields[csvConfig.precioFinalCol] || '');

        if (!codigo) continue;

        products.push({
            codigo,
            catalogo: csvConfig.catalogo,
            producto: nombre,
            descripcion,
            precio: precioFinal,
            pagina: pagina.replace(/"/g, ''),
        });
    }

    return products;
}

function mergeProducts() {
    console.log('📦 Loading existing productos.csv...');
    const { header, products: existingProducts } = loadExistingProducts();
    console.log(`   Found ${existingProducts.length} existing products`);

    const nonBelcorpProducts = existingProducts.filter(
        p => !BELCORP_CATALOGS.includes(p.catalogo)
    );
    const existingBelcorpMap = new Map();
    existingProducts
        .filter(p => BELCORP_CATALOGS.includes(p.catalogo))
        .forEach(p => {
            const key = `${p.codigo}__${p.catalogo}`;
            existingBelcorpMap.set(key, p);
        });

    console.log(`   ${nonBelcorpProducts.length} non-Belcorp products (preserved as-is)`);
    console.log(`   ${existingBelcorpMap.size} existing Belcorp products`);

    const allNewProducts = [];
    for (const csvConfig of CSV_FILES) {
        console.log(`\n📂 Loading ${csvConfig.file}...`);
        const newProducts = loadNewCatalog(csvConfig);
        console.log(`   Found ${newProducts.length} products for ${csvConfig.catalogo}`);
        // Show sample price
        if (newProducts.length > 0) {
            console.log(`   Sample: ${newProducts[0].producto} → $${newProducts[0].precio}`);
        }
        allNewProducts.push(...newProducts);
    }

    let updated = 0;
    let added = 0;
    const mergedBelcorpProducts = [];

    for (const newProd of allNewProducts) {
        const key = `${newProd.codigo}__${newProd.catalogo}`;
        const existing = existingBelcorpMap.get(key);

        if (existing) {
            mergedBelcorpProducts.push({
                codigo: existing.codigo,
                catalogo: existing.catalogo,
                producto: newProd.producto || existing.producto,
                descripcion: newProd.descripcion || existing.descripcion,
                precio: newProd.precio || existing.precio,
                pagina: newProd.pagina || existing.pagina,
                descuento: existing.descuento,
                tipo_oferta: existing.tipo_oferta,
                imagen: existing.imagen,
            });
            updated++;
        } else {
            mergedBelcorpProducts.push({
                codigo: newProd.codigo,
                catalogo: newProd.catalogo,
                producto: newProd.producto,
                descripcion: newProd.descripcion,
                precio: newProd.precio,
                pagina: newProd.pagina,
                descuento: '',
                tipo_oferta: '',
                imagen: '',
            });
            added++;
        }
    }

    const removed = existingBelcorpMap.size - updated;

    console.log('\n📊 Merge Summary:');
    console.log(`   Updated: ${updated} products (PRECIO FINAL + descriptions)`);
    console.log(`   Added:   ${added} new products`);
    console.log(`   Removed: ${removed} products (not in Belcorp 4)`);
    console.log(`   Kept:    ${nonBelcorpProducts.length} non-Belcorp products`);

    const finalProducts = [...nonBelcorpProducts, ...mergedBelcorpProducts];

    const catalogOrder = ['Cyzone', 'Esika', 'Lbel', 'Yanbal'];
    finalProducts.sort((a, b) => {
        const catA = catalogOrder.indexOf(a.catalogo);
        const catB = catalogOrder.indexOf(b.catalogo);
        const orderA = catA >= 0 ? catA : 100;
        const orderB = catB >= 0 ? catB : 100;
        if (orderA !== orderB) return orderA - orderB;
        return (parseFloat(a.pagina) || 0) - (parseFloat(b.pagina) || 0);
    });

    return { header, finalProducts };
}

function writeFinalCSV(header, products) {
    // Don't re-backup if backup already exists
    if (!existsSync(BACKUP_CSV_PATH) && existsSync(EXISTING_CSV_PATH)) {
        const existingContent = readFileSync(EXISTING_CSV_PATH, 'utf-8');
        writeFileSync(BACKUP_CSV_PATH, existingContent, 'utf-8');
        console.log(`\n💾 Backup saved to: ${BACKUP_CSV_PATH}`);
    }

    const lines = [header];
    for (const p of products) {
        const row = [
            escapeCSV(p.codigo),
            escapeCSV(p.catalogo),
            escapeCSV(p.producto),
            escapeCSV(p.descripcion),
            escapeCSV(p.precio),
            escapeCSV(p.pagina),
            escapeCSV(p.descuento),
            escapeCSV(p.tipo_oferta),
            escapeCSV(p.imagen),
        ].join(',');
        lines.push(row);
    }

    writeFileSync(OUTPUT_CSV_PATH, lines.join('\n') + '\n', 'utf-8');
    console.log(`✅ Updated productos.csv written with ${products.length} products`);
}

// === Run ===
const { header, finalProducts } = mergeProducts();
writeFinalCSV(header, finalProducts);

const distPath = join(__dirname, 'dist', 'data', 'productos.csv');
if (existsSync(join(__dirname, 'dist', 'data'))) {
    writeFileSync(distPath, readFileSync(OUTPUT_CSV_PATH, 'utf-8'), 'utf-8');
    console.log(`📋 Also copied to: dist/data/productos.csv`);
}

console.log('\n🎉 Done!');

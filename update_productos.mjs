/**
 * Belcorp 4 Product Database Merge Script
 * 
 * Strategy A: Merge/Update
 * - Updates prices and pages for existing products (matched by codigo + catalogo)
 * - Adds new products from Belcorp 4 CSVs
 * - Removes products no longer in Belcorp 4 (for Belcorp catalogs only)
 * - Preserves non-Belcorp catalog products (Natura, Avon, etc.) untouched
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

// Map from file identifier to catalog name used in productos.csv
const CSV_FILES = [
    { file: 'PRECIOS BELCORP 4 - CYZONE 04.csv', catalogo: 'Cyzone', hasDescripcion: true },
    { file: 'PRECIOS BELCORP 4 - ESIKA 04.csv', catalogo: 'Esika', hasDescripcion: false },
    { file: 'PRECIOS BELCORP 4 - LBEL 04.csv', catalogo: 'Lbel', hasDescripcion: false },
    { file: 'PRECIOS BELCORP 4 - YANBAL02.csv', catalogo: 'Yanbal', hasDescripcion: false },
];

// === CSV Parsing Helpers ===

/**
 * Parse a CSV line respecting quoted fields with commas inside
 */
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++; // skip escaped quote
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

/**
 * Escape a CSV field (wrap in quotes if it contains commas, quotes, or newlines)
 */
function escapeCSV(value) {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Normalize price to integer format (e.g., "44.000" → 44000, "34990" → 34990)
 */
function normalizePrice(priceStr) {
    if (!priceStr) return '';
    // Remove dots used as thousands separators and any whitespace
    let cleaned = priceStr.replace(/\./g, '').replace(/\s/g, '');
    // Remove any trailing comma decimals (e.g., ",00")
    cleaned = cleaned.replace(/,\d+$/, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? '' : String(num);
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

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCSVLine(line);
        if (fields.length < 4) continue;

        // Common columns: Página(0), Pagina(1), Código(2), Nombre(3)
        const pagina = fields[1] || fields[0]; // Use "Pagina" (numeric), fallback to "Página"
        const codigo = fields[2];
        const nombre = fields[3];

        let descripcion = '';
        let precio = '';

        if (csvConfig.hasDescripcion) {
            // Cyzone: col 4 = descripción, col 5 = Precio
            descripcion = fields[4] || '';
            precio = normalizePrice(fields[5] || '');
        } else {
            // Esika, LBel, Yanbal: col 4 = Precio
            precio = normalizePrice(fields[4] || '');
        }

        if (!codigo) continue;

        products.push({
            codigo: codigo,
            catalogo: csvConfig.catalogo,
            producto: nombre,
            descripcion: descripcion,
            precio: precio,
            pagina: pagina.replace(/"/g, ''), // Clean quotes from page numbers like "6,7"
        });
    }

    return products;
}

function mergeProducts() {
    console.log('📦 Loading existing productos.csv...');
    const { header, products: existingProducts } = loadExistingProducts();
    console.log(`   Found ${existingProducts.length} existing products`);

    // Separate Belcorp and non-Belcorp products
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

    // Load all new Belcorp 4 data
    const allNewProducts = [];
    for (const csvConfig of CSV_FILES) {
        console.log(`\n📂 Loading ${csvConfig.file}...`);
        const newProducts = loadNewCatalog(csvConfig);
        console.log(`   Found ${newProducts.length} products for ${csvConfig.catalogo}`);
        allNewProducts.push(...newProducts);
    }

    // Merge: For each new product, check if it exists in old data
    let updated = 0;
    let added = 0;
    const mergedBelcorpProducts = [];

    for (const newProd of allNewProducts) {
        const key = `${newProd.codigo}__${newProd.catalogo}`;
        const existing = existingBelcorpMap.get(key);

        if (existing) {
            // Update price and page, keep existing description, image, etc.
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
            // New product — add it with available data
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
    console.log(`   Updated: ${updated} products (price/page refreshed)`);
    console.log(`   Added:   ${added} new products`);
    console.log(`   Removed: ${removed} products (not in Belcorp 4)`);
    console.log(`   Kept:    ${nonBelcorpProducts.length} non-Belcorp products`);

    // Combine: non-Belcorp + merged Belcorp
    const finalProducts = [...nonBelcorpProducts, ...mergedBelcorpProducts];

    // Sort by catalog then page number
    const catalogOrder = ['Cyzone', 'Esika', 'Lbel', 'Yanbal'];
    finalProducts.sort((a, b) => {
        const catA = catalogOrder.indexOf(a.catalogo);
        const catB = catalogOrder.indexOf(b.catalogo);
        // Non-belcorp catalogs go at the end
        const orderA = catA >= 0 ? catA : 100;
        const orderB = catB >= 0 ? catB : 100;
        if (orderA !== orderB) return orderA - orderB;
        return (parseInt(a.pagina) || 0) - (parseInt(b.pagina) || 0);
    });

    return { header, finalProducts };
}

function writeFinalCSV(header, products) {
    // Backup existing file
    if (existsSync(EXISTING_CSV_PATH)) {
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

// Also copy to dist if it exists
const distPath = join(__dirname, 'dist', 'data', 'productos.csv');
if (existsSync(join(__dirname, 'dist', 'data'))) {
    writeFileSync(distPath, readFileSync(OUTPUT_CSV_PATH, 'utf-8'), 'utf-8');
    console.log(`📋 Also copied to: dist/data/productos.csv`);
}

console.log('\n🎉 Done!');

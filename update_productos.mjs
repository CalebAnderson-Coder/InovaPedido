/**
 * Belcorp 4 Product Database Merge Script (v3 — with EXT enrichment)
 * 
 * 1. Loads PRECIO FINAL from price CSVs
 * 2. Enriches with Tono/Variante, Descripción, Promoción, Imágenes from EXT CSVs
 * 3. Merges with existing productos.csv
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXISTING_CSV_PATH = join(__dirname, 'public', 'data', 'productos.csv');
const OUTPUT_CSV_PATH = join(__dirname, 'public', 'data', 'productos.csv');
const BACKUP_CSV_PATH = join(__dirname, 'public', 'data', 'productos_backup_belcorp3.csv');

const BELCORP_CATALOGS = ['Cyzone', 'Esika', 'Lbel', 'Yanbal'];

// Price CSVs — column indices for PRECIO FINAL
const PRICE_CSV_FILES = [
    { file: 'PRECIOS BELCORP 4 - CYZONE 04.csv', catalogo: 'Cyzone', descripcionCol: 4, precioFinalCol: 15 },
    { file: 'PRECIOS BELCORP 4 - ESIKA 04.csv', catalogo: 'Esika', descripcionCol: -1, precioFinalCol: 14 },
    { file: 'PRECIOS BELCORP 4 - LBEL 04.csv', catalogo: 'Lbel', descripcionCol: -1, precioFinalCol: 14 },
    { file: 'PRECIOS BELCORP 4 - YANBAL02.csv', catalogo: 'Yanbal', descripcionCol: -1, precioFinalCol: 14 },
];

// EXT CSVs — enrichment data (Tono, Descripción, Promoción, Imágenes)
// Columns: 0-Página, 1-Código, 2-Nombre, 3-Tono/Variante, 4-Descripción, 5-Promoción, 6-Categoría, 7-Marca, 8-Imágenes
const EXT_CSV_FILES = [
    { file: 'BELCORP C04 EXT - CYZONE.csv', catalogo: 'Cyzone' },
    { file: 'BELCORP C04 EXT - ESIKA.csv', catalogo: 'Esika' },
    { file: 'BELCORP C04 EXT - LBEL.csv', catalogo: 'Lbel' },
];

// === CSV Helpers ===

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

function normalizePrecioFinal(priceStr) {
    if (!priceStr) return '';
    let cleaned = priceStr.replace(/"/g, '').trim();
    cleaned = cleaned.replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return String(num);
}

// === Load Functions ===

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
            codigo: fields[0], catalogo: fields[1], producto: fields[2],
            descripcion: fields[3], precio: fields[4], pagina: fields[5],
            descuento: fields[6], tipo_oferta: fields[7], imagen: fields[8],
        });
    }
    return { header, products };
}

function loadPriceCatalog(csvConfig) {
    const filePath = join(__dirname, csvConfig.file);
    if (!existsSync(filePath)) { console.warn(`⚠️  Not found: ${csvConfig.file}`); return []; }
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
        const descripcion = csvConfig.descripcionCol >= 0 ? (fields[csvConfig.descripcionCol] || '') : '';
        const precioFinal = normalizePrecioFinal(fields[csvConfig.precioFinalCol] || '');
        if (!codigo) continue;
        products.push({ codigo, catalogo: csvConfig.catalogo, producto: nombre, descripcion, precio: precioFinal, pagina: pagina.replace(/"/g, '') });
    }
    return products;
}

/**
 * Load EXT CSV and build a lookup map by codigo
 * Returns Map<codigo, { tono, descripcion, promocion, imagen }>
 */
function loadExtData(extConfig) {
    const filePath = join(__dirname, extConfig.file);
    if (!existsSync(filePath)) { console.warn(`⚠️  Not found: ${extConfig.file}`); return new Map(); }
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.replace(/\r$/, ''));
    const map = new Map();
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCSVLine(line);
        if (fields.length < 6) continue;
        // Columns: 0-Página, 1-Código, 2-Nombre, 3-Tono/Variante, 4-Descripción, 5-Promoción, 6-Categoría, 7-Marca, 8-Imágenes
        const codigo = fields[1];
        const tono = fields[3] || '';
        const descripcion = fields[4] || '';
        const promocion = fields[5] || '';
        const imagen = fields[8] || '';
        if (!codigo) continue;
        map.set(codigo, { tono, descripcion, promocion, imagen });
    }
    console.log(`   Loaded ${map.size} enrichment entries from ${extConfig.file}`);
    return map;
}

// === Main Merge ===

function mergeProducts() {
    console.log('📦 Loading existing productos.csv...');
    const { header, products: existingProducts } = loadExistingProducts();
    console.log(`   Found ${existingProducts.length} existing products`);

    const nonBelcorpProducts = existingProducts.filter(p => !BELCORP_CATALOGS.includes(p.catalogo));
    const existingBelcorpMap = new Map();
    existingProducts.filter(p => BELCORP_CATALOGS.includes(p.catalogo)).forEach(p => {
        existingBelcorpMap.set(`${p.codigo}__${p.catalogo}`, p);
    });

    console.log(`   ${nonBelcorpProducts.length} non-Belcorp (preserved)`);
    console.log(`   ${existingBelcorpMap.size} existing Belcorp products`);

    // Load EXT enrichment data
    console.log('\n📚 Loading EXT enrichment data...');
    const extMaps = new Map(); // catalogo → Map<codigo, enrichment>
    for (const extConfig of EXT_CSV_FILES) {
        extMaps.set(extConfig.catalogo, loadExtData(extConfig));
    }

    // Load price data
    const allNewProducts = [];
    for (const csvConfig of PRICE_CSV_FILES) {
        console.log(`\n💲 Loading ${csvConfig.file}...`);
        const newProducts = loadPriceCatalog(csvConfig);
        console.log(`   Found ${newProducts.length} products for ${csvConfig.catalogo}`);
        allNewProducts.push(...newProducts);
    }

    // Merge
    let updated = 0, added = 0, enriched = 0;
    const mergedBelcorpProducts = [];

    for (const newProd of allNewProducts) {
        const key = `${newProd.codigo}__${newProd.catalogo}`;
        const existing = existingBelcorpMap.get(key);

        // Get EXT enrichment if available
        const extMap = extMaps.get(newProd.catalogo);
        const ext = extMap ? extMap.get(newProd.codigo) : null;

        // Build description: combine base description with tone if available
        let descripcion = newProd.descripcion || (existing ? existing.descripcion : '');
        if (ext) {
            // Use EXT description as primary (it's more detailed)
            if (ext.descripcion) descripcion = ext.descripcion;
            // Prepend tone to description if available
            if (ext.tono) {
                descripcion = `Tono: ${ext.tono}. ${descripcion}`;
            }
            enriched++;
        }

        // Determine promotion/tipo_oferta
        let tipo_oferta = existing ? existing.tipo_oferta : '';
        if (ext && ext.promocion) {
            tipo_oferta = ext.promocion;
        }

        // Determine image
        let imagen = existing ? existing.imagen : '';
        if (ext && ext.imagen) {
            imagen = ext.imagen; // EXT images are from Campaign 04, fresher URLs
        }

        if (existing) {
            mergedBelcorpProducts.push({
                codigo: existing.codigo,
                catalogo: existing.catalogo,
                producto: newProd.producto || existing.producto,
                descripcion,
                precio: newProd.precio || existing.precio,
                pagina: newProd.pagina || existing.pagina,
                descuento: existing.descuento,
                tipo_oferta,
                imagen,
            });
            updated++;
        } else {
            mergedBelcorpProducts.push({
                codigo: newProd.codigo,
                catalogo: newProd.catalogo,
                producto: newProd.producto,
                descripcion,
                precio: newProd.precio,
                pagina: newProd.pagina,
                descuento: '',
                tipo_oferta,
                imagen: ext ? ext.imagen : '',
            });
            added++;
        }
    }

    const removed = existingBelcorpMap.size - updated;

    console.log('\n📊 Merge Summary:');
    console.log(`   Updated:  ${updated} products`);
    console.log(`   Added:    ${added} new products`);
    console.log(`   Enriched: ${enriched} with tones/descriptions/promos/images`);
    console.log(`   Removed:  ${removed} products (not in Belcorp 4)`);
    console.log(`   Kept:     ${nonBelcorpProducts.length} non-Belcorp products`);

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
    if (!existsSync(BACKUP_CSV_PATH) && existsSync(EXISTING_CSV_PATH)) {
        writeFileSync(BACKUP_CSV_PATH, readFileSync(EXISTING_CSV_PATH, 'utf-8'), 'utf-8');
        console.log(`\n💾 Backup saved`);
    }
    const lines = [header];
    for (const p of products) {
        lines.push([
            escapeCSV(p.codigo), escapeCSV(p.catalogo), escapeCSV(p.producto),
            escapeCSV(p.descripcion), escapeCSV(p.precio), escapeCSV(p.pagina),
            escapeCSV(p.descuento), escapeCSV(p.tipo_oferta), escapeCSV(p.imagen),
        ].join(','));
    }
    writeFileSync(OUTPUT_CSV_PATH, lines.join('\n') + '\n', 'utf-8');
    console.log(`✅ Written ${products.length} products`);
}

// === Run ===
const { header, finalProducts } = mergeProducts();
writeFinalCSV(header, finalProducts);

const distPath = join(__dirname, 'dist', 'data', 'productos.csv');
if (existsSync(join(__dirname, 'dist', 'data'))) {
    writeFileSync(distPath, readFileSync(OUTPUT_CSV_PATH, 'utf-8'), 'utf-8');
    console.log(`📋 Copied to dist/data/productos.csv`);
}
console.log('\n🎉 Done!');

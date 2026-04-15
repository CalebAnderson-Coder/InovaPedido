/**
 * Belcorp C07 — Merge catalog + formula de precios → productos.csv
 * Processes each brand when both files are available (CSV catalog + CSV formula)
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOWNLOADS = 'C:/Users/Agencia IA/Downloads';
const CSV_PATH = join(__dirname, 'public', 'data', 'productos.csv');
const DIST_PATH = join(__dirname, 'dist', 'data', 'productos.csv');

// ─── Brand configs ───
const BRANDS = [
  {
    name: 'Lbel',
    catalogFile: 'LBel C07.xlsx - Catálogo.csv',
    formulaFile: 'FORMULA DE PRECIOS BELCORP 07 - LBEL 07.csv',
  },
  {
    name: 'Cyzone',
    catalogFile: 'Cyzone C07.xlsx - Catálogo.csv',       // when available
    catalogXlsx: 'Cyzone C07.xlsx',
    formulaFile: 'FORMULA DE PRECIOS BELCORP 07 - CYZONE 07.csv',
  },
  {
    name: 'Esika',
    catalogFile: 'Ésika C07.xlsx - Catálogo.csv',        // when available
    catalogXlsx: 'Ésika C07.xlsx',
    formulaFile: 'FORMULA DE PRECIOS BELCORP 07 - ESIKA 07.csv',
  },
];

// ─── CSV Helpers ───
function escapeCSV(value) {
  if (value === undefined || value === null) return '';
  const str = String(value).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

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

function readCSVFile(path) {
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length >= 2) {
      const obj = {};
      header.forEach((h, idx) => { obj[h.trim()] = (fields[idx] || '').trim(); });
      rows.push(obj);
    }
  }
  return { header, rows };
}

function cleanProductName(name) {
  if (!name) return '';
  let cleaned = String(name).trim();
  cleaned = cleaned.replace(/\s*\d+X[\d,]+\$\s*/g, ' ');
  cleaned = cleaned.replace(/\$\s*\d{1,3}[.,]\d{3}([.,]\d{3})*/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

function cleanDescription(desc) {
  if (!desc) return '';
  let cleaned = String(desc).trim();
  // Remove Colombian price refs
  cleaned = cleaned.replace(/\$\s*\d{1,3}[.,]\d{3}([.,]\d{3})*/g, '');
  cleaned = cleaned.replace(/\s*\d+X[\d,]+\$\s*/g, ' ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

function cleanPrice(val) {
  if (val === undefined || val === null || val === '') return '';
  let s = String(val).replace(/"/g, '').trim();
  if (s.match(/[a-zA-Z]/)) return '';
  s = s.replace(',', '.');
  const num = parseFloat(s);
  if (isNaN(num) || num <= 0) return '';
  return String(num);
}

// ─── Process a single brand ───
function processBrand(brand) {
  const catalogPath = join(DOWNLOADS, brand.catalogFile);
  const formulaPath = join(DOWNLOADS, brand.formulaFile);

  // Check if both files exist
  if (!existsSync(formulaPath)) {
    console.log(`⏭️  ${brand.name}: Formula file not found, skipping.`);
    return [];
  }

  // Read formula (prices)
  console.log(`\n💰 ${brand.name}: Reading formula de precios...`);
  const formula = readCSVFile(formulaPath);
  console.log(`   Formula headers: ${formula.header.join(' | ')}`);
  console.log(`   Formula rows: ${formula.rows.length}`);

  // Build price map by Código
  const priceMap = new Map();
  const priceColName = formula.header.find(h =>
    h.toLowerCase().includes('precio') && h.toLowerCase().includes('catalago final')
  ) || formula.header.find(h =>
    h.toLowerCase().includes('precio al catalago')
  ) || 'PRECIO AL CATALAGO FINAL';

  console.log(`   Price column: "${priceColName}"`);

  for (const row of formula.rows) {
    const code = String(row['Código'] || '').trim();
    const price = cleanPrice(row[priceColName]);
    const name = cleanProductName(row['Nombre'] || row['Nombre '] || '');
    const page = row['Página'] || row['Pagina'] || '';
    if (code && price) {
      priceMap.set(code, { price, name, page });
    }
  }
  console.log(`   Price entries: ${priceMap.size}`);

  // Read catalog (descriptions, images, etc.) if available
  let catalogMap = new Map();
  if (existsSync(catalogPath)) {
    console.log(`📚 ${brand.name}: Reading catálogo...`);
    const catalog = readCSVFile(catalogPath);
    console.log(`   Catalog headers: ${catalog.header.join(' | ')}`);
    console.log(`   Catalog rows: ${catalog.rows.length}`);

    for (const row of catalog.rows) {
      const code = String(row['Código'] || '').trim();
      if (code) {
        catalogMap.set(code, {
          descripcion: cleanDescription(row['Descripción'] || ''),
          categoria: row['Categoría'] || '',
          tono: row['Tono/Variante'] || '',
          promocion: row['Promoción'] || '',
          imagen: row['Imágenes'] || '',
          nombre: row['Nombre'] || '',
          pagina: row['Página'] || '',
        });
      }
    }
    console.log(`   Catalog entries: ${catalogMap.size}`);
  } else {
    console.log(`📚 ${brand.name}: No catalog CSV found, using formula data only.`);
  }

  // Merge: formula is the base (has prices), catalog enriches
  const products = [];
  for (const [code, priceData] of priceMap) {
    const cat = catalogMap.get(code) || {};
    const nombre = cat.nombre || priceData.name;
    const descripcion = cat.descripcion || '';
    const tono = cat.tono || '';
    const fullDesc = tono ? `${tono}. ${descripcion}`.trim() : descripcion;
    const pagina = cat.pagina || priceData.page;

    products.push({
      codigo: code,
      catalogo: brand.name,
      producto: cleanProductName(nombre),
      descripcion: cleanDescription(fullDesc),
      precio: priceData.price,
      pagina: pagina,
      descuento: cat.promocion && cat.promocion.toLowerCase().includes('sí') ? 'Promo' : '',
      tipo_oferta: cat.categoria || '',
      imagen: cat.imagen || '',
    });
  }

  console.log(`   ✅ ${brand.name}: ${products.length} products merged`);
  return products;
}

// ─── Main ───
console.log('🚀 Belcorp C07 Data Loader\n');

// Process all available brands
const allNewProducts = [];
for (const brand of BRANDS) {
  const products = processBrand(brand);
  allNewProducts.push(...products);
}

if (allNewProducts.length === 0) {
  console.log('\n❌ No products found! Check that the files are in Downloads.');
  process.exit(1);
}

// Sort by catalog then page
const catalogOrder = ['Cyzone', 'Esika', 'Lbel', 'Yanbal'];
allNewProducts.sort((a, b) => {
  const catA = catalogOrder.indexOf(a.catalogo);
  const catB = catalogOrder.indexOf(b.catalogo);
  const orderA = catA >= 0 ? catA : 100;
  const orderB = catB >= 0 ? catB : 100;
  if (orderA !== orderB) return orderA - orderB;
  return (parseFloat(a.pagina) || 0) - (parseFloat(b.pagina) || 0);
});

// Load existing non-Belcorp products (if any)
const BELCORP_CATALOGS = ['Cyzone', 'Esika', 'Lbel', 'LBel', 'Yanbal'];
const processedBrands = [...new Set(allNewProducts.map(p => p.catalogo))];
let existingProducts = [];

if (existsSync(CSV_PATH)) {
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const csvLines = csvContent.split('\n').map(l => l.replace(/\r$/, ''));

  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 9) continue;
    const catalogo = fields[1];

    // Keep products from brands we're NOT replacing
    if (!processedBrands.includes(catalogo)) {
      existingProducts.push({
        codigo: fields[0], catalogo: fields[1], producto: fields[2],
        descripcion: fields[3], precio: fields[4], pagina: fields[5],
        descuento: fields[6], tipo_oferta: fields[7], imagen: fields[8],
      });
    }
  }
}

console.log(`\n📦 Existing products kept: ${existingProducts.length}`);

// Combine
const finalProducts = [...existingProducts, ...allNewProducts];
finalProducts.sort((a, b) => {
  const catA = catalogOrder.indexOf(a.catalogo);
  const catB = catalogOrder.indexOf(b.catalogo);
  const orderA = catA >= 0 ? catA : 100;
  const orderB = catB >= 0 ? catB : 100;
  if (orderA !== orderB) return orderA - orderB;
  return (parseFloat(a.pagina) || 0) - (parseFloat(b.pagina) || 0);
});

// Write CSV
const header = 'codigo,catalogo,producto,descripcion,precio,pagina,descuento,tipo_oferta,imagen';
const outputLines = [header];
for (const p of finalProducts) {
  outputLines.push([
    escapeCSV(p.codigo), escapeCSV(p.catalogo), escapeCSV(p.producto),
    escapeCSV(p.descripcion), escapeCSV(p.precio), escapeCSV(p.pagina),
    escapeCSV(p.descuento), escapeCSV(p.tipo_oferta), escapeCSV(p.imagen),
  ].join(','));
}

writeFileSync(CSV_PATH, outputLines.join('\n') + '\n', 'utf-8');
console.log(`\n✅ Written ${finalProducts.length} total products to productos.csv`);

// Summary per brand
const summary = {};
finalProducts.forEach(p => { summary[p.catalogo] = (summary[p.catalogo] || 0) + 1; });
Object.entries(summary).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

// Copy to dist
if (existsSync(join(__dirname, 'dist', 'data'))) {
  writeFileSync(DIST_PATH, readFileSync(CSV_PATH, 'utf-8'), 'utf-8');
  console.log('📋 Copied to dist/data/productos.csv');
}

console.log('\n🎉 Done! Run again after adding more brand files.');

/**
 * Belcorp 06 Campaign — Load from XLSX and replace products in productos.csv
 * Uses PRECIO CATALAGO FINAL column for prices
 */

import XLSX from 'xlsx';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const XLSX_PATH = 'C:/Users/Agencia IA/Downloads/FORMULA DE PRECIOS BELCORP 06.xlsx';
const CSV_PATH = join(__dirname, 'public', 'data', 'productos.csv');
const BACKUP_PATH = join(__dirname, 'public', 'data', 'productos_backup_belcorp4.csv');

// Sheet config: sheetName → catalogo name, precioFinalCol index
const SHEET_CONFIG = [
  { sheet: 'CYZONE 06', catalogo: 'Cyzone', precioFinalCol: 14 },
  { sheet: 'ESIKA 06',  catalogo: 'Esika',  precioFinalCol: 14 },
  { sheet: 'LBEL 06',   catalogo: 'Lbel',   precioFinalCol: 14 },
  // "Copia de NUEVO" has a different structure — check if it's Yanbal
  { sheet: 'Copia de NUEVO', catalogo: 'Yanbal', precioFinalCol: 18 },
];

const BELCORP_CATALOGS = ['Cyzone', 'Esika', 'Lbel', 'LBel', 'Yanbal'];

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

function cleanPrice(val) {
  if (val === undefined || val === null || val === '') return '';
  let s = String(val).replace(/"/g, '').trim();
  // If it's a text like "EN ESTA COLUMNA", skip
  if (s.match(/[a-zA-Z]/)) return '';
  // Normalize comma to dot
  s = s.replace(',', '.');
  const num = parseFloat(s);
  if (isNaN(num) || num <= 0) return '';
  return String(num);
}

function cleanProductName(name) {
  if (!name) return '';
  let cleaned = String(name).trim();
  // Remove price patterns like "1X13$ 2X20,5$"
  cleaned = cleaned.replace(/\s*\d+X[\d,]+\$\s*/g, ' ');
  // Remove COP prices like $40,000
  cleaned = cleaned.replace(/\$\s*\d{1,3}[.,]\d{3}([.,]\d{3})*/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

// === STEP 1: Analyze the XLSX ===
console.log('📖 Reading XLSX:', XLSX_PATH);
const wb = XLSX.readFile(XLSX_PATH);
console.log('📑 Sheets found:', wb.SheetNames.join(', '));

// === STEP 2: Extract products from each sheet ===
const allNewProducts = [];

for (const config of SHEET_CONFIG) {
  const ws = wb.Sheets[config.sheet];
  if (!ws) {
    console.warn(`⚠️ Sheet "${config.sheet}" not found, skipping.`);
    continue;
  }
  
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n📋 ${config.sheet} → ${config.catalogo} (${data.length - 1} rows)`);
  console.log(`   Headers: ${JSON.stringify(data[0])}`);
  
  let validCount = 0;
  let skippedNoPrice = 0;
  let skippedNoCode = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 4) continue;
    
    const pagina = String(row[0] || '').trim();
    const codigo = String(row[2] || '').trim();
    const nombre = String(row[3] || '').trim();
    const precioFinal = cleanPrice(row[config.precioFinalCol]);
    
    // Skip rows without valid code (must be digits)
    if (!codigo || !codigo.match(/^\d+$/)) {
      skippedNoCode++;
      continue;
    }
    
    // Skip rows without price
    if (!precioFinal) {
      skippedNoPrice++;
      continue;
    }
    
    // Clean product name
    const cleanedName = cleanProductName(nombre);
    
    allNewProducts.push({
      codigo,
      catalogo: config.catalogo,
      producto: cleanedName,
      descripcion: '',
      precio: precioFinal,
      pagina,
      descuento: '',
      tipo_oferta: '',
      imagen: '',
    });
    validCount++;
  }
  
  console.log(`   ✅ Valid products: ${validCount}`);
  console.log(`   ⏭️  Skipped (no code): ${skippedNoCode}, (no price): ${skippedNoPrice}`);
}

console.log(`\n📊 Total new Belcorp 06 products: ${allNewProducts.length}`);

// === STEP 3: Load existing products and keep non-Belcorp ===
console.log('\n📦 Loading existing productos.csv...');
const csvContent = readFileSync(CSV_PATH, 'utf-8');
const csvLines = csvContent.split('\n').map(l => l.replace(/\r$/, ''));
const header = csvLines[0];

const nonBelcorpProducts = [];
for (let i = 1; i < csvLines.length; i++) {
  const line = csvLines[i].trim();
  if (!line) continue;
  const fields = parseCSVLine(line);
  if (fields.length < 9) continue;
  const catalogo = fields[1];
  if (!BELCORP_CATALOGS.includes(catalogo)) {
    nonBelcorpProducts.push({
      codigo: fields[0], catalogo: fields[1], producto: fields[2],
      descripcion: fields[3], precio: fields[4], pagina: fields[5],
      descuento: fields[6], tipo_oferta: fields[7], imagen: fields[8],
    });
  }
}
console.log(`   Non-Belcorp products preserved: ${nonBelcorpProducts.length}`);

// === STEP 4: Combine and sort ===
const finalProducts = [...nonBelcorpProducts, ...allNewProducts];
const catalogOrder = ['Cyzone', 'Esika', 'Lbel', 'Yanbal'];
finalProducts.sort((a, b) => {
  const catA = catalogOrder.indexOf(a.catalogo);
  const catB = catalogOrder.indexOf(b.catalogo);
  const orderA = catA >= 0 ? catA : 100;
  const orderB = catB >= 0 ? catB : 100;
  if (orderA !== orderB) return orderA - orderB;
  return (parseFloat(a.pagina) || 0) - (parseFloat(b.pagina) || 0);
});

// === STEP 5: Backup and write ===
if (existsSync(CSV_PATH)) {
  copyFileSync(CSV_PATH, BACKUP_PATH);
  console.log(`💾 Backup saved as productos_backup_belcorp4.csv`);
}

const outputLines = [header];
for (const p of finalProducts) {
  outputLines.push([
    escapeCSV(p.codigo), escapeCSV(p.catalogo), escapeCSV(p.producto),
    escapeCSV(p.descripcion), escapeCSV(p.precio), escapeCSV(p.pagina),
    escapeCSV(p.descuento), escapeCSV(p.tipo_oferta), escapeCSV(p.imagen),
  ].join(','));
}

writeFileSync(CSV_PATH, outputLines.join('\n') + '\n', 'utf-8');
console.log(`\n✅ Written ${finalProducts.length} total products (${allNewProducts.length} Belcorp 06 + ${nonBelcorpProducts.length} non-Belcorp)`);

// Copy to dist
const distPath = join(__dirname, 'dist', 'data', 'productos.csv');
if (existsSync(join(__dirname, 'dist', 'data'))) {
  writeFileSync(distPath, readFileSync(CSV_PATH, 'utf-8'), 'utf-8');
  console.log('📋 Copied to dist/data/productos.csv');
}

console.log('\n🎉 Belcorp 06 loaded successfully!');

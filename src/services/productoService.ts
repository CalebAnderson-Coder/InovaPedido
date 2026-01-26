interface Producto {
  codigo: string;
  catalogo: string;
  producto: string;
  descripcion: string;
  precio: number;
  pagina: number;
  descuento: string;
  tipo_oferta: string;
  imagen?: string;
}

let productosCache: Producto[] | null = null;

export async function getProductos(): Promise<Producto[]> {
  if (productosCache) {
    return productosCache;
  }

  const response = await fetch('/data/productos.csv');
  const fileContent = await response.text();
  
  const lines = fileContent.split('\n').slice(1); // Saltar encabezado
  
  const parseCSVLine = (line: string): string[] => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    return fields;
  };

  productosCache = lines.map(line => {
    const [codigo, catalogo, producto, descripcion, precio, pagina, descuento, tipo_oferta, imagen] = parseCSVLine(line);
    
    return {
      codigo,
      catalogo,
      producto: producto ? producto.replace(/"/g, '') : '',
      descripcion: descripcion ? descripcion.replace(/"/g, '') : '',
      precio: parseFloat(precio) || 0,
      pagina: parseInt(pagina) || 0,
      descuento,
      tipo_oferta,
      imagen: imagen || ''
    };
  }).filter(p => p.codigo); // Filtrar líneas vacías

  return productosCache;
}

export async function buscarProductoPorCodigo(codigo: string): Promise<Producto | undefined> {
  const productos = await getProductos();
  return productos.find(p => p.codigo === codigo);
}

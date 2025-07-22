interface Producto {
  codigo: string;
  catalogo: string;
  producto: string;
  descripcion: string;
  precio: number;
  pagina: number;
  descuento: string;
  tipo_oferta: string;
}

let productosCache: Producto[] | null = null;

export async function getProductos(): Promise<Producto[]> {
  if (productosCache) {
    return productosCache;
  }

  const response = await fetch('/data/productos.csv');
  const fileContent = await response.text();
  
  const lines = fileContent.split('\n').slice(1); // Saltar encabezado
  productosCache = lines.map(line => {
    const [codigo, catalogo, producto, descripcion, precio, pagina, descuento, tipo_oferta] = 
      line.split(',').map(field => field.trim());
    
    return {
      codigo,
      catalogo,
      producto,
      descripcion,
      precio: parseFloat(precio),
      pagina: parseInt(pagina),
      descuento,
      tipo_oferta
    };
  }).filter(p => p.codigo); // Filtrar líneas vacías

  return productosCache;
}

export async function buscarProductoPorCodigo(codigo: string): Promise<Producto | undefined> {
  const productos = await getProductos();
  return productos.find(p => p.codigo === codigo);
}

export type Catalogo = 'Esika' | 'L\'Bel' | 'Cyzone';
export type TipoEmpaque = 'Unidad' | 'Set' | 'Pack';
export type Zona = 'Valencia' | 'Caracas' | 'Santa Rita' | 'Turmero' | 'La Victoria' | 'Mariara';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  catalogo: Catalogo;
  codigo: string;
  empaque: TipoEmpaque;
  descripcionIncluye?: string;
  imagen?: string;
}

export interface Vendedora {
  nombre: string;
  zona: Zona;
}

export interface Pedido {
  id: string;
  vendedora: string;
  zona: Zona;
  productos: Producto[];
  total: number;
  estado: 'pendiente' | 'completado' | 'cancelado';
  catalogo: string;
  codigo: string;
  empaque: string;
  fechaCreacion: Date;
  enviado?: boolean;
}
import React from 'react';
import type { Producto } from '../types/types';
import ProductoEnPedido from './ProductoEnPedido';

interface ListaProductosEnPedidoProps {
  productos: Producto[];
  onActualizarCantidad: (id: number, nuevaCantidad: number) => void;
  onEliminarProducto: (id: number) => void;
}

export default function ListaProductosEnPedido({
  productos,
  onActualizarCantidad,
  onEliminarProducto,
}: ListaProductosEnPedidoProps) {
  const total = productos.reduce(
    (sum, producto) => sum + producto.precio * producto.cantidad,
    0
  );

  if (productos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay productos en el pedido
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Productos en el pedido:</h3>
      <div className="space-y-3">
        {productos.map((producto) => (
          <ProductoEnPedido
            key={producto.id}
            producto={producto}
            onActualizarCantidad={onActualizarCantidad}
            onEliminarProducto={onEliminarProducto}
          />
        ))}
      </div>
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-900">Total del pedido:</span>
          <span className="text-xl font-bold text-gray-900">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

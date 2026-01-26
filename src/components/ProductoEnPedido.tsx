import React, { useState } from 'react';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import type { Producto } from '../types/types';

interface ProductoEnPedidoProps {
  producto: Producto;
  onActualizarCantidad: (id: number, nuevaCantidad: number) => void;
  onEliminarProducto: (id: number) => void;
}

export default function ProductoEnPedido({
  producto,
  onActualizarCantidad,
  onEliminarProducto,
}: ProductoEnPedidoProps) {
  const [editando, setEditando] = useState(false);
  const [nuevaCantidad, setNuevaCantidad] = useState(producto.cantidad);

  const handleGuardar = () => {
    if (nuevaCantidad > 0) {
      onActualizarCantidad(producto.id, nuevaCantidad);
      setEditando(false);
    }
  };

  const handleCancelar = () => {
    setNuevaCantidad(producto.cantidad);
    setEditando(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 flex-1">
          {producto.imagen && (
            <img 
              src={producto.imagen} 
              alt={producto.nombre}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {producto.catalogo}
              </span>
            </div>
          <div className="text-sm text-gray-500 space-x-2">
            <span>Código: {producto.codigo}</span>
            <span>•</span>
            <span>Empaque: {producto.empaque}</span>
            {producto.descripcionIncluye && (
              <>
                <span>•</span>
                <span>Incluye: {producto.descripcionIncluye}</span>
              </>
            )}
          </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-gray-900">
            ${(producto.precio * producto.cantidad).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            ${producto.precio.toFixed(2)} c/u
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {editando ? (
            <>
              <input
                type="number"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(parseInt(e.target.value) || 0)}
                min="1"
                className="w-20 px-2 py-1 border rounded-md"
              />
              <button
                onClick={handleGuardar}
                className="p-1 text-green-600 hover:text-green-700"
                title="Guardar"
              >
                <Save size={18} />
              </button>
              <button
                onClick={handleCancelar}
                className="p-1 text-gray-600 hover:text-gray-700"
                title="Cancelar"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">
                Cantidad: {producto.cantidad}
              </span>
              <button
                onClick={() => setEditando(true)}
                className="p-1 text-blue-600 hover:text-blue-700"
                title="Editar cantidad"
              >
                <Pencil size={18} />
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => onEliminarProducto(producto.id)}
          className="p-1 text-red-600 hover:text-red-700"
          title="Eliminar producto"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import ProductoForm from './ProductoForm';
import ListaProductosEnPedido from './ListaProductosEnPedido';
import ListaPedidos from './ListaPedidos';
import ConfirmacionPedido from './ConfirmacionPedido';
import type { Producto, Pedido, Vendedora } from '../types/types';

interface PedidosManagerProps {
  vendedora: Vendedora;
}

export default function PedidosManager({ vendedora }: PedidosManagerProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoEnEdicion, setPedidoEnEdicion] = useState<Pedido | null>(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null);

  const handleAgregarProducto = (producto: Producto) => {
    if (pedidoEnEdicion) {
      // Si estamos editando un pedido, agregamos el producto al pedido en edición
      const productosActualizados = [...pedidoEnEdicion.productos, producto];
      setPedidoEnEdicion({
        ...pedidoEnEdicion,
        productos: productosActualizados,
        total: productosActualizados.reduce((sum, p) => sum + p.precio * p.cantidad, 0)
      });
    } else {
      // Si no estamos editando, agregamos al nuevo pedido
      setProductos([...productos, producto]);
    }
  };

  const handleActualizarCantidad = (id: number, cantidad: number) => {
    if (pedidoEnEdicion) {
      // Si estamos editando un pedido, actualizamos la cantidad en el pedido en edición
      const productosActualizados = pedidoEnEdicion.productos.map(p =>
        p.id === id ? { ...p, cantidad } : p
      );
      setPedidoEnEdicion({
        ...pedidoEnEdicion,
        productos: productosActualizados,
        total: productosActualizados.reduce((sum, p) => sum + p.precio * p.cantidad, 0)
      });
    } else {
      // Si no estamos editando, actualizamos en el nuevo pedido
      setProductos(productos.map(p =>
        p.id === id ? { ...p, cantidad } : p
      ));
    }
  };

  const handleEliminarProducto = (id: number) => {
    if (pedidoEnEdicion) {
      // Si estamos editando un pedido, eliminamos el producto del pedido en edición
      const productosActualizados = pedidoEnEdicion.productos.filter(p => p.id !== id);
      setPedidoEnEdicion({
        ...pedidoEnEdicion,
        productos: productosActualizados,
        total: productosActualizados.reduce((sum, p) => sum + p.precio * p.cantidad, 0)
      });
    } else {
      // Si no estamos editando, eliminamos del nuevo pedido
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  const handleCrearPedido = () => {
    if (productos.length === 0) return;

    const nuevoPedido: Pedido = {
      id: Date.now().toString(),
      vendedora: vendedora.nombre,
      zona: vendedora.zona,
      productos: [...productos],
      total: productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0),
      estado: 'pendiente',
      catalogo: 'Catálogo General',
      codigo: 'PED-' + Date.now(),
      empaque: 'Estándar',
      fechaCreacion: new Date()
    };

    setPedidos([...pedidos, nuevoPedido]);
    setProductos([]); // Limpiar productos después de crear el pedido
  };

  const handleCambiarEstado = (id: string, estado: Pedido['estado']) => {
    if (estado === 'completado') {
      const fechaEntrega = new Date();
      setPedidos(pedidos.map(p =>
        p.id === id ? { ...p, estado, fechaEntrega } : p
      ));
    } else {
      setPedidos(pedidos.map(p =>
        p.id === id ? { ...p, estado } : p
      ));
    }
  };

  const handleEditarPedido = (pedido: Pedido) => {
    setPedidoEnEdicion(pedido);
  };

  const handleGuardarEdicion = () => {
    if (!pedidoEnEdicion) return;

    setPedidos(pedidos.map(p =>
      p.id === pedidoEnEdicion.id ? pedidoEnEdicion : p
    ));
    setPedidoEnEdicion(null);
  };

  const handleCancelarEdicion = () => {
    setPedidoEnEdicion(null);
  };

  const handleCerrarConfirmacion = () => {
    setPedidoConfirmado(null);
  };

  const handleMarcarEnviado = (id: string) => {
    setPedidos(pedidos.map(p =>
      p.id === id ? { ...p, enviado: true } : p
    ));
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {pedidoConfirmado && (
        <ConfirmacionPedido
          pedido={pedidoConfirmado}
          onClose={handleCerrarConfirmacion}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {pedidoEnEdicion ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Editando Pedido #{pedidoEnEdicion.id.toString().slice(-4)}
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={handleGuardarEdicion}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={handleCancelarEdicion}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <ProductoForm onAgregarProducto={handleAgregarProducto} />
              <div className="mt-6">
                <ListaProductosEnPedido
                  productos={pedidoEnEdicion.productos}
                  onActualizarCantidad={handleActualizarCantidad}
                  onEliminarProducto={handleEliminarProducto}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevo Pedido</h2>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="text-sm text-blue-800">
                    <strong>Vendedora:</strong> {vendedora.nombre}
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>Zona:</strong> {vendedora.zona}
                  </div>
                </div>

                <ProductoForm onAgregarProducto={handleAgregarProducto} />
              </div>

              {productos.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <ListaProductosEnPedido
                    productos={productos}
                    onActualizarCantidad={handleActualizarCantidad}
                    onEliminarProducto={handleEliminarProducto}
                  />
                  <button
                    onClick={handleCrearPedido}
                    className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Crear Pedido
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <ListaPedidos
            pedidos={pedidos}
            onCambiarEstado={handleCambiarEstado}
            onEditarPedido={handleEditarPedido}
            onMarcarEnviado={handleMarcarEnviado}
          />
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import type { Pedido } from '../types/types';
import ConfirmacionPedido from './ConfirmacionPedido';
import { Clock, Plus, ShoppingBag, Edit3, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { exportToWord } from '../utils/wordExport';

interface ListaPedidosProps {
  pedidos: Pedido[];
  onCambiarEstado: (id: number, estado: Pedido['estado']) => void;
  onEditarPedido: (pedido: Pedido) => void;
  onNuevoPedido: () => void;
}

export default function ListaPedidos({ pedidos, onCambiarEstado, onEditarPedido, onNuevoPedido }: ListaPedidosProps) {
  const [pedidoEnAdvertencia, setPedidoEnAdvertencia] = useState<Pedido | null>(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null);

  const handleConfirmarAdvertencia = () => {
    if (pedidoEnAdvertencia) {
      onCambiarEstado(pedidoEnAdvertencia.id, 'completado');
      setPedidoConfirmado(pedidoEnAdvertencia);
      setPedidoEnAdvertencia(null);
    }
  };

  const handleCancelarAdvertencia = () => {
    setPedidoEnAdvertencia(null);
  };

  const handleCerrarConfirmacion = () => {
    setPedidoConfirmado(null);
  };

  const handleCompletar = (pedido: Pedido) => {
    setPedidoEnAdvertencia(pedido);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mis Pedidos</h2>
        <button
          onClick={onNuevoPedido}
          className="flex items-center gap-2 bg-[#FF4B55] text-white px-4 py-2 rounded-lg hover:bg-[#E6434D] transition-colors"
        >
          <Plus size={20} />
          Nuevo Pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingBag className="mx-auto h-12 w-12 text-purple-300" />
          <p className="mt-4 text-gray-600">No hay pedidos registrados</p>
          <button
            onClick={onNuevoPedido}
            className="mt-4 text-[#FF4B55] hover:text-[#E6434D] font-medium"
          >
            Crear mi primer pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Pedidos</h2>
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white p-4 rounded-lg shadow">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-700">
                    Pedido #{pedido.id}
                    {pedido.estado === 'pendiente' && (
                      <span className="inline-flex items-center">
                        <Clock size={16} className="text-purple-500" />
                        <span className="text-sm text-purple-500 ml-1">Pendiente</span>
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportToWord(pedido)}
                      className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-purple-600 hover:text-purple-700"
                      title="Exportar a Word"
                    >
                      <FileText size={16} />
                      Exportar
                    </button>
                    <span className="text-purple-600">Total: ${pedido.total}</span>
                  </div>
                </div>
                <div className="text-sm text-purple-600">
                  {pedido.productos.map((producto) => (
                    <div key={producto.id}>
                      <p>
                        {producto.nombre} - ${producto.precio} x {producto.cantidad}
                        <br />
                        <span className="text-xs text-purple-500">
                          Catálogo: {producto.catalogo} • Código: {producto.codigo} • Empaque: {producto.empaque}
                          {producto.empaque === 'Incluye' && producto.descripcionIncluye && (
                            <> • Incluye: {producto.descripcionIncluye}</>
                          )}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-end gap-2">
                  {pedido.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleCompletar(pedido)}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded hover:bg-green-600 flex items-center gap-1"
                        title="Completar pedido"
                      >
                        <CheckCircle2 size={16} />
                        Completar
                      </button>
                      <button
                        onClick={() => onCambiarEstado(pedido.id, 'cancelado')}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 flex items-center gap-1"
                        title="Cancelar pedido"
                      >
                        <XCircle size={16} />
                        Cancelar
                      </button>
                      <button
                        onClick={() => onEditarPedido(pedido)}
                        className="px-3 py-1 text-sm font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600 flex items-center gap-1"
                        title="Editar pedido"
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {pedidoEnAdvertencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">¡Atención! ⚠️</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¡Hola Chica Inova! 👋 Recuerda verificar muy bien tu pedido ✨.
              Cualquier error en el código será tu responsabilidad no la de nosotros. 🔍
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelarAdvertencia}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Verificar
              </button>
              <button
                onClick={handleConfirmarAdvertencia}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {pedidoConfirmado && (
        <ConfirmacionPedido
          pedido={pedidoConfirmado}
          onClose={handleCerrarConfirmacion}
        />
      )}
    </div>
  );
}
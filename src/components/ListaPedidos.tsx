import React, { useState } from 'react';
import type { Pedido } from '../types/types';
import ConfirmacionPedido from './ConfirmacionPedido';
import { Clock, Plus, ShoppingBag, Edit3, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { exportToWord } from '../utils/wordExport';

interface ListaPedidosProps {
  pedidos: Pedido[];
  onCambiarEstado: (id: string, estado: Pedido['estado']) => void;
  onEditarPedido: (pedido: Pedido) => void;
  onNuevoPedido: () => void;
  onMarcarEnviado: (id: string) => void;
}

export default function ListaPedidos({ pedidos, onCambiarEstado, onEditarPedido, onNuevoPedido, onMarcarEnviado }: ListaPedidosProps) {
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
        <h2 className="text-xl font-bold text-gray-800">Mis Pedidos</h2>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Mis Pedidos</h2>
            {pedidos && (
              <button
                onClick={() => onEditarPedido(pedidos[0])}
                className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                <Edit3 size={14} />
                Editar
              </button>
            )}
          </div>

          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-purple-600 font-medium text-sm break-all">
                      Pedido #{pedido.id}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        Pendiente
                      </span>
                      {pedido.enviado && (
                        <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                          <CheckCircle2 size={14} />
                          Enviado
                        </span>
                      )}
                      <button
                        onClick={() => exportToWord(pedido)}
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                      >
                        <FileText size={14} />
                        Exportar
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 break-words">
                    {pedido.productos.map((producto, index) => (
                      <div key={index} className="text-xs">
                        {producto.nombre} - ${producto.precio} x {producto.cantidad}
                      </div>
                    ))}
                    <div className="text-xs mt-1">
                      Catalogo: {pedido.catalogo} • Código: {pedido.codigo} • Empaque: {pedido.empaque}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleCompletar(pedido)}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      Completar
                    </button>
                    <button
                      onClick={() => onCambiarEstado(pedido.id, 'cancelado')}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      <XCircle size={14} />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          onPedidoEnviado={onMarcarEnviado}
        />
      )}
    </div>
  );
}
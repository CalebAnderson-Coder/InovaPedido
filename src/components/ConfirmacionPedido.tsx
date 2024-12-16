import React from 'react';
import { Pedido } from '../types/types';
import { generarDocumentoPedido } from '../services/pedidoService';
import { enviarPedidoAMake } from '../services/webhookService';
import { Check, Download, Send } from 'lucide-react';
import { Document, Paragraph, TextRun, AlignmentType } from 'docx';

interface ConfirmacionPedidoProps {
  pedido: Pedido;
  onClose: () => void;
}

const ConfirmacionPedido: React.FC<ConfirmacionPedidoProps> = ({ pedido, onClose }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDescargarPedido = async () => {
    setLoading(true);
    setError(null);
    try {
      // Asegurarnos de que el pedido tenga todos los datos necesarios
      if (!pedido.vendedora || !pedido.zona) {
        throw new Error('Faltan datos de la vendedora');
      }
      await generarDocumentoPedido(pedido);
    } catch (err) {
      setError('Error al descargar el pedido. Por favor intente de nuevo.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarWhatsApp = () => {
    const message = encodeURIComponent('Hola Inovabot, ya tengo mi pedido listo!');
    window.open(`https://wa.me/447453799527?text=${message}`, '_blank');
    // El modal se mantiene abierto para que el usuario pueda dar click en "Listo" cuando termine
  };

  const generateWordDocument = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "INOVASHOP",
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${pedido.vendedora} - ${pedido.zona}`,
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Pedido #${pedido.id}`,
                bold: true,
                size: 18,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Productos:',
                bold: true,
                size: 14,
              }),
            ],
          }),
          ...pedido.productos.map((producto) => (
            new Paragraph({
              children: [
                new TextRun({
                  text: `${producto.nombre} (${producto.cantidad} unidades) - $${(producto.precio * producto.cantidad).toFixed(2)}`,
                  size: 12,
                }),
              ],
            })
          )),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total: $${pedido.total.toFixed(2)}`,
                bold: true,
                size: 14,
              }),
            ],
          }),
        ],
      }],
    });
    await generarDocumentoPedido(doc, pedido);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    setError(null);
    try {
      // Primero enviamos los datos a Make.com
      await enviarPedidoAMake(pedido);
      
      // Luego generamos el documento
      if (!pedido.vendedora || !pedido.zona) {
        throw new Error('Faltan datos de la vendedora');
      }
      await generarDocumentoPedido(pedido);
      
      // Ya no cerramos el modal aquí para que el usuario pueda continuar con el siguiente paso
    } catch (err) {
      setError('Error al procesar el pedido. Por favor intente de nuevo.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden">
        <div className="p-4">
          <div className="flex items-start space-x-2 mb-4">
            <div className="bg-yellow-100 p-2 rounded-full">
              <span className="text-yellow-600 text-xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">¡Genial! ✨ Ya tu pedido está Casi Confirmado 🎉</h3>
              <p className="text-sm text-gray-600">
                Sigue estos pasos: 👇
              </p>
              <p className="text-sm text-gray-600">
                1️⃣ Dale al botón verde "Confirmar y Descargar Pedido" 💚
              </p>
              <p className="text-sm text-gray-600">
                2️⃣ Dale al botón azul "Enviar por WhatsApp" para enviar el pedido a Inovabot 💬
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Resumen del Pedido #{pedido.id} 📋</h3>
            <div className="text-gray-600 mb-4">
              <p className="font-medium">Productos:</p>
              <div className="space-y-2">
                {pedido.productos.map((producto, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{producto.nombre} ({producto.cantidad})</span>
                    <span>${(producto.precio * producto.cantidad).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${pedido.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleDescargarPedido}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              Descargar Pedido
            </button>
            <button
              onClick={handleEnviarWhatsApp}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Send className="h-5 w-5" />
              Enviar por WhatsApp
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
              {loading ? 'Procesando... ⏳' : 'Confirmar'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full text-gray-600 hover:text-gray-800 transition-colors"
          >
            ¡Listo! ✅
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionPedido;

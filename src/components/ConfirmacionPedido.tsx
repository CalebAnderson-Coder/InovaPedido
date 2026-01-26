import React from 'react';
import { Pedido } from '../types/types';
import { generarDocumentoPedido } from '../services/pedidoService';
import { enviarPedidoAGoogleSheets } from '../services/webhookService';
import { Check, Download, Send } from 'lucide-react';
import { Document, Paragraph, TextRun, AlignmentType } from 'docx';

interface ConfirmacionPedidoProps {
  pedido: Pedido;
  onClose: () => void;
  onPedidoEnviado?: (id: string) => void;
}

const ConfirmacionPedido: React.FC<ConfirmacionPedidoProps> = ({ pedido, onClose, onPedidoEnviado }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pedidoProcesado, setPedidoProcesado] = React.useState(!!pedido.enviado);
  const [mostrarSelectorWhatsApp, setMostrarSelectorWhatsApp] = React.useState(false);
  const [numeroWhatsApp, setNumeroWhatsApp] = React.useState('');

  const handleDescargarPedido = async () => {
    setLoading(true);
    setError(null);
    try {
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
    setMostrarSelectorWhatsApp(true);
  };

  const handleEnviarWhatsAppConNumero = () => {
    if (!numeroWhatsApp.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }

    const numeroLimpio = numeroWhatsApp.replace(/\D/g, '');

    if (numeroLimpio.length < 10) {
      alert('Por favor ingrese un número de teléfono válido (al menos 10 dígitos)');
      return;
    }

    const itemsList = pedido.productos.map(p =>
      `• ${p.nombre} (${p.catalogo}) x${p.cantidad} - $${(p.precio * p.cantidad).toFixed(2)}`
    ).join('\n');

    const textoMensaje = `Hola Inovabot, ya tengo mi pedido listo!\n\n` +
      `*Pedido #${pedido.id}*\n` +
      `Vendedora: ${pedido.vendedora}\n` +
      `Zona: ${pedido.zona}\n\n` +
      `*Productos:*\n${itemsList}\n\n` +
      `*Total: $${pedido.total.toFixed(2)}*`;

    const message = encodeURIComponent(textoMensaje);
    window.open(`https://wa.me/${numeroLimpio}?text=${message}`, '_blank');

    setMostrarSelectorWhatsApp(false);
    setNumeroWhatsApp('');
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
    // Si el pedido ya fue procesado, solo generar documento
    if (pedidoProcesado) {
      const confirmarNuevamente = window.confirm(
        'El pedido ya fue enviado a Google Sheets anteriormente. ¿Solo deseas descargar el PDF nuevamente?'
      );
      if (!confirmarNuevamente) return;

      try {
        setLoading(true);
        if (!pedido.vendedora || !pedido.zona) throw new Error('Faltan datos de la vendedora');
        await generarDocumentoPedido(pedido);
        setLoading(false);
      } catch (err) {
        setError('Error al generar el documento');
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Primero enviamos los datos a Google Sheets
      await enviarPedidoAGoogleSheets(pedido);

      // Marcar como enviado si la función existe
      if (onPedidoEnviado) {
        onPedidoEnviado(pedido.id);
      }

      // Luego generamos el documento
      if (!pedido.vendedora || !pedido.zona) {
        throw new Error('Faltan datos de la vendedora');
      }
      await generarDocumentoPedido(pedido);

      // Marcamos el pedido como procesado
      setPedidoProcesado(true);
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
              {pedidoProcesado ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Pedido Ya Enviado ✅</h3>
                  <p className="text-sm text-gray-600">
                    Este pedido ya fue enviado a Google Sheets.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Puedes descargarlo nuevamente o enviarlo por WhatsApp.
                  </p>
                </>
              ) : (
                <>
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
                </>
              )}
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
          <div className="flex flex-col gap-4">
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${pedidoProcesado ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-500 hover:bg-green-600'
                }`}
            >
              <Download className="h-5 w-5" />
              {pedidoProcesado ? 'Descargar Documento (Copia)' : 'Confirmar y Descargar Pedido'}
            </button>

            <button
              onClick={handleEnviarWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send className="h-5 w-5" />
              Enviar por WhatsApp
            </button>

            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              ¡Listo! ✅
            </button>
          </div>
        </div>
      </div>

      {/* Modal para seleccionar número de WhatsApp */}
      {mostrarSelectorWhatsApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enviar por WhatsApp 💬
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa el número de teléfono al que quieres enviar el mensaje:
            </p>
            <input
              type="tel"
              value={numeroWhatsApp}
              onChange={(e) => setNumeroWhatsApp(e.target.value)}
              placeholder="Ej: 1234567890"
              className="w-full p-3 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEnviarWhatsAppConNumero}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Enviar Mensaje
              </button>
              <button
                onClick={() => {
                  setMostrarSelectorWhatsApp(false);
                  setNumeroWhatsApp('');
                }}
                className="w-full text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmacionPedido;

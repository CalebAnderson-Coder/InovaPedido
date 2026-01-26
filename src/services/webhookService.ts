import { Pedido } from '../types/types';

// Reemplazar esta URL con la URL de tu Google Apps Script desplegado
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec';

export const enviarPedidoAGoogleSheets = async (pedido: Pedido): Promise<void> => {
  try {
    // Transformar el pedido al formato esperado por el AppScript
    const payload = {
      location: pedido.zona,
      vendorName: pedido.vendedora.nombre,
      items: pedido.productos.map(producto => ({
        brand: producto.catalogo,
        quantity: producto.cantidad,
        code: producto.codigo,
        name: producto.nombre,
        price: producto.precio,
        total: producto.precio * producto.cantidad
      }))
    };

    console.log('Enviando pedido a Google Sheets...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      console.log('Respuesta de Google Sheets:', result);
      
      if (result.result !== 'success') {
        throw new Error(`Error en Google Sheets: ${result.error}`);
      }

      console.log('Pedido enviado correctamente a Google Sheets');
      console.log(`Filas insertadas: ${result.filasInsertadas}, Fila inicial: ${result.startRow}`);
    } catch (error) {
      console.error('Error en fetch a Google Sheets:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al enviar datos a Google Sheets:', error);
    throw error;
  }
};

// Mantener la función original por compatibilidad temporal
export const enviarPedidoAMake = enviarPedidoAGoogleSheets;

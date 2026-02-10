import { Pedido } from '../types/types';

// Reemplazar esta URL con la URL de tu Google Apps Script desplegado
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYXxFhX2eSlwhM2tZKN5qGZ4Nv2vZQ6xFdiZFzLcq69-y6jV2TtVaNmXn-ClCBtZEWrA/exec';

export const enviarPedidoAGoogleSheets = async (pedido: Pedido): Promise<void> => {
  if (GOOGLE_APPS_SCRIPT_URL.includes('TU_SCRIPT_ID_AQUI')) {
    console.error('URL de Google Apps Script no configurada');
    throw new Error('La URL del Webhook de Google Sheets no está configurada.');
  }

  // Transformar el pedido al formato esperado por el AppScript
  const payload = {
    location: pedido.zona,
    vendorName: pedido.vendedora,
    items: pedido.productos.map(producto => ({
      brand: producto.catalogo,
      quantity: producto.cantidad,
      code: producto.codigo,
      name: producto.nombre,
      price: producto.precio,
      total: producto.precio * producto.cantidad,
      empaque: producto.empaque || 'Individual'
    }))
  };

  console.log('Enviando pedido a Google Sheets...');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      redirect: 'follow',
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response type:', response.type);

    // Google Apps Script may return opaque responses on some browsers
    if (response.type === 'opaque') {
      console.log('Respuesta opaca de Google Apps Script — pedido probablemente enviado.');
      return;
    }

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${responseText}`);
    }

    // Try to parse as JSON, but don't fail if it's not valid JSON
    try {
      const result = JSON.parse(responseText);
      console.log('Respuesta de Google Sheets:', result);

      if (result.result !== 'success') {
        throw new Error(`Error en Google Sheets: ${result.error || 'Respuesta inesperada'}`);
      }

      console.log('Pedido enviado correctamente a Google Sheets');
      console.log(`Filas insertadas: ${result.filasInsertadas}, Fila inicial: ${result.startRow}`);
    } catch (parseError) {
      // If we got a 200 but can't parse JSON, it likely still worked
      // (Google Apps Script sometimes returns HTML on redirect)
      console.warn('No se pudo parsear la respuesta como JSON, pero el status fue OK:', responseText.substring(0, 200));
    }
  } catch (error) {
    console.error('Error en fetch a Google Sheets:', error);
    // Rethrow with a user-friendly message
    throw new Error(`No se pudo conectar con Google Sheets. Verifique su conexión a internet. (${error instanceof Error ? error.message : 'Error desconocido'})`);
  }
};

// Mantener la función original por compatibilidad temporal
export const enviarPedidoAMake = enviarPedidoAGoogleSheets;

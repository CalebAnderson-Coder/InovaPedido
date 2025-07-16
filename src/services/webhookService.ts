import { Pedido } from '../types/types';

const N8N_WEBHOOK_URL = 'https://cashfunnel-n8n.ofguzy.easypanel.host/webhook/PedidosInova';

export const enviarPedidoAMake = async (pedido: Pedido): Promise<void> => {
  try {
    // Transformar todos los productos en un array de filas
    const filasPedido = pedido.productos.map(producto => ({
      zona: pedido.zona,
      vendedora: pedido.vendedora,
      catalogo: producto.catalogo,
      cantidad: producto.cantidad,
      empaque: producto.empaque,
      codigo: producto.codigo,
      producto: producto.nombre,
      precio_unitario: producto.precio,
      monto_total: producto.precio * producto.cantidad,
      telefono: "" // Mantener campo vacío si es necesario
    }));

    // Enviar todos los productos en una sola solicitud
    console.log('Enviando pedido a:', N8N_WEBHOOK_URL);
    console.log('Payload:', JSON.stringify(filasPedido, null, 2));
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filasPedido),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error ${response.status}: ${errorBody}`);
      }

      console.log('Pedido completo enviado correctamente');
    } catch (error) {
      console.error('Error en fetch:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al enviar datos a n8n:', error);
    throw error;
  }
};

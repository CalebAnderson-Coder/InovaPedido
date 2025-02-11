import { Pedido } from '../types/types';

const N8N_WEBHOOK_URL = 'https://cashfunnel.app.n8n.cloud/webhook/5a9019ce-fd94-4bdd-94d5-c27537176768';

export const enviarPedidoAWebhook = async (pedido: Pedido): Promise<void> => {
  try {
    // Transformar los productos en filas individuales
    for (const producto of pedido.productos) {
      const filaPedido = {
        zona: pedido.zona,
        vendedora: pedido.vendedora,
        catalogo: producto.catalogo,
        cantidad: producto.cantidad,
        empaque: producto.empaque,
        codigo: producto.codigo,
        producto: producto.nombre,
        precio_unitario: producto.precio,
        monto_total: producto.precio * producto.cantidad,
        telefono: "" // Si aún lo necesitas
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filaPedido),
      });

      if (!response.ok) {
        throw new Error(`Error al enviar datos a n8n: ${response.statusText}`);
      }

      console.log(`Producto enviado: ${producto.nombre}`);
    }
  } catch (error) {
    console.error('Error al enviar datos a n8n:', error);
    throw error;
  }
};

import { Pedido } from '../types/types';

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/8qetulx1rrm4hnqe19ht67ewez0qy1kk';

export const enviarPedidoAMake = async (pedido: Pedido): Promise<void> => {
  try {
    // Transformar los productos en filas individuales con los nombres exactos que espera Make
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
      telefono: "" // Campo requerido por Make
    }));

    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filasPedido),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar datos a Make.com: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error al enviar datos a Make.com:', error);
    throw error;
  }
};

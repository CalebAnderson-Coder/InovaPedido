import { Pedido } from '../types/types';

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/uwm9b9ey35dl3grjvn4dywv5lm2etvel';

export const enviarPedidoAMake = async (pedido: Pedido): Promise<void> => {
  try {
    // Transformar los productos en filas individuales con los nombres exactos que espera Make
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
        telefono: "" // Campo requerido por Make
      };

      // Enviar cada producto individualmente
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filaPedido),
      });

      if (!response.ok) {
        throw new Error(`Error al enviar datos a Make.com: ${response.statusText}`);
      }

      console.log(`Producto enviado: ${producto.nombre}`);
    }
  } catch (error) {
    console.error('Error al enviar datos a Make.com:', error);
    throw error;
  }
};

import { enviarPedidoAMake } from './src/services/webhookService';
import { Pedido } from './src/types/types';

// Crear un pedido de prueba
const pedidoPrueba: Pedido = {
  id: 'test-123',
  zona: 'Zona Test',
  vendedora: {
    nombre: 'Vendedora Test',
    zona: 'Zona Test'
  },
  productos: [
    {
      id: 1,
      catalogo: 'Esika',
      cantidad: 2,
      empaque: 'Unidad',
      codigo: 'COD-001',
      nombre: 'Producto 1',
      precio: 10.0,
      descripcionIncluye: 'Descripción de prueba'
    },
    {
      id: 2,
      catalogo: 'Cyzone',
      cantidad: 3,
      empaque: 'Set',
      codigo: 'COD-002',
      nombre: 'Producto 2',
      precio: 15.0,
      descripcionIncluye: 'Descripción de prueba'
    }
  ],
  total: 65, // (2*10 + 3*15)
  estado: 'pendiente',
  catalogo: 'Esika',
  codigo: 'PED-TEST',
  empaque: 'Unidad',
  fechaCreacion: new Date()
};

// Ejecutar la prueba
(async () => {
  try {
    console.log('Iniciando prueba de webhook...');
    await enviarPedidoAMake(pedidoPrueba);
    console.log('Prueba exitosa: El pedido completo se envió correctamente');
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
})();

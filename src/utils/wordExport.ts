import { Document, Paragraph, Table, TableRow, TableCell, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { Pedido } from '../types/types';

interface PedidoTableRow {
  zona: string;
  vendedora: string;
  catalogo: string;
  cantidad: number;
  empaque: string;
  codigo: string;
  producto: string;
  precioUnitario: number;
  montoTotal: number;
}

export const exportToWord = async (pedido: Pedido) => {
  // Convertir los productos del pedido al formato de la tabla
  const rows: PedidoTableRow[] = pedido.productos.map(producto => ({
    zona: pedido.zona || '',
    vendedora: pedido.vendedora || '',
    catalogo: producto.catalogo,
    cantidad: producto.cantidad,
    empaque: producto.empaque,
    codigo: producto.codigo.toString(),
    producto: producto.nombre,
    precioUnitario: producto.precio,
    montoTotal: producto.precio * producto.cantidad
  }));

  // Crear la tabla
  const table = new Table({
    rows: [
      // Encabezado
      new TableRow({
        children: [
          'ZONA',
          'VENDEDORA',
          'CATALOGO',
          'CANTIDAD',
          'EMPAQUE',
          'CODIGO',
          'PRODUCTO',
          'PRECIO UNITARIO',
          'MONTO TOTAL'
        ].map(header => 
          new TableCell({
            children: [new Paragraph(header)],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          })
        ),
      }),
      // Datos
      ...rows.map(row => 
        new TableRow({
          children: [
            row.zona,
            row.vendedora,
            row.catalogo,
            row.cantidad.toString(),
            row.empaque,
            row.codigo,
            row.producto,
            row.precioUnitario.toFixed(2),
            row.montoTotal.toFixed(2)
          ].map(cell => 
            new TableCell({
              children: [new Paragraph(cell)],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          ),
        })
      ),
    ],
  });

  // Crear el documento
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `Pedido #${pedido.id}`, heading: 'Heading1' }),
        new Paragraph({ text: `Fecha: ${new Date().toLocaleDateString()}` }),
        new Paragraph({ text: '' }), // Espacio
        table,
      ],
    }],
  });

  // Generar y descargar el archivo
  const buffer = await doc.save();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `Pedido_${pedido.id}.docx`);
};

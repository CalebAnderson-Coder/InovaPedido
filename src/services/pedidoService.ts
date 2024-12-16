import { Pedido } from '../types/types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export const generarDocumentoPedido = async (pedido: Pedido) => {
  try {
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
                text: pedido.vendedora && pedido.zona ? 
                     `${pedido.vendedora} - ${pedido.zona}` : 
                     'Vendedora - Zona',
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
                text: `Fecha: ${new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`,
                size: 16,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 100, type: 'pct' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    width: { size: 10, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'ZONA', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 15, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'VENDEDORA', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 10, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'CATALOGO', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 10, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'CANTIDAD', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 10, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'EMPAQUE', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 10, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'CODIGO', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 15, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'PRODUCTO', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 10, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'PRECIO UNITARIO', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                  new TableCell({
                    width: { size: 10, type: 'pct' },
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'MONTO TOTAL', bold: true })],
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                ],
              }),
              ...pedido.productos.map(
                (producto) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ 
                          text: pedido.zona || '',
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: pedido.vendedora || '',
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: producto.catalogo,
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: producto.cantidad.toString(),
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: producto.empaque,
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: producto.codigo.toString(),
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: producto.nombre,
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: `$${producto.precio.toFixed(2)}`,
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: `$${(producto.precio * producto.cantidad).toFixed(2)}`,
                          alignment: AlignmentType.CENTER,
                        })],
                      }),
                    ],
                  }),
              ),
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'Total del Pedido:', bold: true })],
                      alignment: AlignmentType.RIGHT,
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: `$${pedido.total.toFixed(2)}`, bold: true })],
                      alignment: AlignmentType.RIGHT,
                    })],
                    shading: { fill: 'E5E7EB' },
                  }),
                ],
              }),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `Pedido_${pedido.vendedora || 'Vendedora'}_${new Date().toISOString().split('T')[0]}.docx`);
  } catch (error) {
    console.error('Error al generar el documento:', error);
    throw new Error('Error al generar el documento del pedido');
  }
};

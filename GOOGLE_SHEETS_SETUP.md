# Configuración de Google Apps Script

Para integrar el envío de pedidos directo a Google Sheets, sigue estos pasos:

## 1. Crear el Google Apps Script

1. Abre [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto
3. Reemplaza el código con el AppScript proporcionado
4. Guarda el proyecto

## 2. Desplegar el Script

1. En el editor, haz clic en "Deploy" > "New deployment"
2. Selecciona "Web app"
3. Configura:
   - Description: "API para pedidos InovaPedido"
   - Execute as: "Me"
   - Who has access: "Anyone" (para que la app pueda llamarlo)
4. Haz clic en "Deploy"
5. Copia la URL del Web app (termina en `/exec`)

## 3. Actualizar la URL en la aplicación

Edita el archivo `src/services/webhookService.ts` y reemplaza:

```typescript
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec';
```

Con tu URL real del Web app.

## 4. Configurar el Google Sheet

1. Crea un nuevo Google Sheets
2. En la primera hoja, establece los encabezados:
   - Columna A: ZONA
   - Columna B: VENDEDORA  
   - Columna C: CATALOGO
   - Columna D: CANTIDAD
   - Columna E: EMPAQUE
   - Columna F: CODIGO
   - Columna G: PRODUCTO
   - Columna H: PRECIO UNITARIO
   - Columna I: MONTO TOTAL

## 5. Probar la integración

1. Inicia la aplicación
2. Crea un pedido de prueba
3. Confirma el pedido
4. Verifica que los datos aparezcan en tu Google Sheet

## Notas importantes

- El script usa "smart fill" para encontrar la primera fila vacía
- Cada producto del pedido se inserta en una fila separada
- El script incluye bloqueo para evitar conflictos de escritura simultánea
- Los errores se registran en la consola para depuración
#!/bin/bash

# Crear directorio temporal para el paquete
DEPLOY_DIR="hostybee_package"
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

# Copiar archivos del frontend
echo "Preparando frontend..."
mkdir -p $DEPLOY_DIR/frontend
cp -r src $DEPLOY_DIR/frontend/
cp package.json $DEPLOY_DIR/frontend/
cp tsconfig.json $DEPLOY_DIR/frontend/
cp vite.config.ts $DEPLOY_DIR/frontend/
cp index.html $DEPLOY_DIR/frontend/

# Copiar archivos del backend
echo "Preparando backend..."
mkdir -p $DEPLOY_DIR/backend
cp -r src/* $DEPLOY_DIR/backend/
cp package.json $DEPLOY_DIR/backend/
cp tsconfig.json $DEPLOY_DIR/backend/

# Crear archivo de configuración para Hostybee
echo "Creando configuración de Hostybee..."
cat > $DEPLOY_DIR/hostybee.config.json << EOL
{
  "name": "project-bolt",
  "version": "1.0.0",
  "type": "fullstack",
  "frontend": {
    "framework": "react",
    "buildCommand": "npm run build",
    "outputDir": "dist",
    "env": {
      "NODE_ENV": "production"
    }
  },
  "backend": {
    "framework": "node",
    "main": "src/index.ts",
    "env": {
      "NODE_ENV": "production"
    }
  }
}
EOL

# Crear archivo README para el despliegue
cat > $DEPLOY_DIR/README.md << EOL
# Project Bolt - Deployment Package

## Estructura del Proyecto
- \`/frontend\`: Aplicación React/Vite
- \`/backend\`: API Node.js/Express

## Instrucciones de Despliegue
1. Descomprimir el archivo
2. Configurar las variables de entorno
3. Ejecutar \`npm install\` en ambos directorios
4. Seguir las instrucciones de Hostybee para el despliegue

## Variables de Entorno Requeridas
- API_V1_STR
- PROJECT_NAME
- SECRET_KEY
- BELCORP_USERNAME
- BELCORP_PASSWORD
- WHATSAPP_API_KEY
- WHATSAPP_PHONE_NUMBER
EOL

# Crear el archivo ZIP
echo "Creando archivo ZIP..."
cd $DEPLOY_DIR
zip -r ../hostybee-deploy.zip ./*
cd ..

# Limpiar
echo "Limpiando archivos temporales..."
rm -rf $DEPLOY_DIR

echo "¡Paquete de despliegue creado como hostybee-deploy.zip!"

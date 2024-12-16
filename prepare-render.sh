#!/bin/bash

# Crear directorio temporal para el paquete
DEPLOY_DIR="render_deploy"
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

# Copiar archivos necesarios
echo "Preparando archivos para Render..."
cp -r src $DEPLOY_DIR/
cp -r frontend $DEPLOY_DIR/
cp -r backend $DEPLOY_DIR/
cp render.yaml $DEPLOY_DIR/
cp .env.example $DEPLOY_DIR/.env

# Crear el archivo ZIP
echo "Creando archivo ZIP..."
cd $DEPLOY_DIR
zip -r ../render-deploy.zip ./*
cd ..

# Limpiar
echo "Limpiando archivos temporales..."
rm -rf $DEPLOY_DIR

echo "¡Paquete de despliegue creado como render-deploy.zip!"

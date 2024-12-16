import React, { useState } from 'react';
import { Plus, Package, Barcode, Book, ListChecks } from 'lucide-react';
import type { Producto } from '../types/types';
import { CATALOGOS, TIPOS_EMPAQUE } from '../constants/catalogos';

interface ProductoFormProps {
  onAgregarProducto: (producto: Producto) => void;
}

export default function ProductoForm({ onAgregarProducto }: ProductoFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    cantidad: '1',
    catalogo: '',
    codigo: '',
    empaque: '',
    descripcionIncluye: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese la descripción del producto');
      return;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      alert('Por favor ingrese un precio válido');
      return;
    }
    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      alert('Por favor ingrese una cantidad válida');
      return;
    }
    if (!formData.catalogo) {
      alert('Por favor seleccione un catálogo');
      return;
    }
    if (!formData.codigo.trim()) {
      alert('Por favor ingrese el código del producto');
      return;
    }
    if (!formData.empaque) {
      alert('Por favor seleccione un tipo de empaque');
      return;
    }

    const nuevoProducto: Producto = {
      id: Date.now(),
      nombre: formData.nombre.trim(),
      precio: parseFloat(formData.precio),
      cantidad: parseInt(formData.cantidad),
      catalogo: formData.catalogo as Producto['catalogo'],
      codigo: formData.codigo.trim(),
      empaque: formData.empaque as Producto['empaque'],
    };

    try {
      onAgregarProducto(nuevoProducto);
      
      // Limpiar el formulario solo después de agregar exitosamente
      setFormData({
        nombre: '',
        precio: '',
        cantidad: '1',
        catalogo: '',
        codigo: '',
        empaque: '',
        descripcionIncluye: '',
      });
    } catch (error) {
      alert('Hubo un error al agregar el producto. Por favor intente de nuevo.');
      console.error('Error al agregar producto:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Para el campo código, asegurarnos de que solo contenga números
    if (name === 'codigo' && value !== '') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catálogo
            </label>
            <select
              name="catalogo"
              value={formData.catalogo}
              onChange={handleChange}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">Elige el catálogo</option>
              {CATALOGOS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="Código del producto"
              className="w-full p-2 border rounded-md bg-white"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Producto
            </label>
            <textarea
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ejemplo: Perfume Vibranza + Labial Nude Art + Colonia Pink Blossom"
              className="w-full p-2 border rounded-md bg-white min-h-[100px]"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empaque
            </label>
            <select
              name="empaque"
              value={formData.empaque}
              onChange={handleChange}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">Tipo de empaque</option>
              {TIPOS_EMPAQUE.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                placeholder="Precio"
                className="w-full p-2 border rounded-md bg-white"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                min="1"
                className="w-full p-2 border rounded-md bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors mt-6"
          >
            <Plus className="h-5 w-5" />
            Agregar Producto
          </button>
        </div>
      </form>
    </div>
  );
}
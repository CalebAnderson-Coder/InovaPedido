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
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Plus size={24} className="text-gray-600" />
        Agregar Producto
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Catálogo
            </label>
            <div className="relative">
              <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                name="catalogo"
                value={formData.catalogo}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-500 [&:not(:placeholder-shown)]:text-gray-950"
              >
                <option value="" disabled selected className="text-gray-500">Elige el catálogo</option>
                {CATALOGOS.map(cat => (
                  <option key={cat} value={cat} className="text-gray-950 font-medium">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Código
            </label>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Código del producto"
                min="0"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Descripción del Producto
            </label>
            <textarea
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 min-h-[100px]"
              placeholder="Ejemplo: Perfume Vibranza + Labial Nude Art + Colonia Pink Bloosom"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Empaque
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                name="empaque"
                value={formData.empaque}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-500 [&:not(:placeholder-shown)]:text-gray-950"
              >
                <option value="">Tipo de empaque</option>
                {TIPOS_EMPAQUE.map(tipo => (
                  <option key={tipo} value={tipo} className="text-gray-950 font-medium">{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Precio
              </label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                step="0.50"
                min="0"
                className="w-full p-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500"
                placeholder="Precio"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cantidad
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad || 1}
                onChange={handleChange}
                className="w-full p-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500"
                placeholder="Cantidad"
                min="1"
                defaultValue="1"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#FF4B55] text-white py-2 px-4 rounded-lg hover:bg-[#E6434D] flex items-center justify-center gap-2 mt-6"
        >
          <Plus size={20} />
          Agregar Producto
        </button>
      </form>
    </div>
  );
}
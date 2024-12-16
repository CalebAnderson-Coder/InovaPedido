import React from 'react';
import { UserCircle, MapPin, Phone } from 'lucide-react';
import type { Vendedora, Zona } from '../types/types';

const ZONAS: Zona[] = ['Valencia', 'Caracas', 'Maracay', 'Turmero', 'La Victoria'];

interface RegistroVendedoraProps {
  onSubmit: (vendedora: Vendedora) => void;
}

export default function RegistroVendedora({ onSubmit }: RegistroVendedoraProps) {
  const [formData, setFormData] = React.useState<Vendedora>({
    nombre: '',
    zona: '',
    telefono: '',
  });
  const [errors, setErrors] = React.useState({
    nombre: '',
    zona: '',
    telefono: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      nombre: '',
      zona: '',
      telefono: '',
    };

    // Validar nombre y apellido
    const nombreCompleto = formData.nombre.trim().split(' ');
    if (!formData.nombre) {
      newErrors.nombre = 'El nombre es obligatorio';
      isValid = false;
    } else if (nombreCompleto.length < 2) {
      newErrors.nombre = 'Debes ingresar nombre y apellido';
      isValid = false;
    }

    // Validar zona
    if (!formData.zona) {
      newErrors.zona = 'La zona es obligatoria';
      isValid = false;
    }

    // Validar teléfono (formato venezolano: 04121234567)
    const phoneRegex = /^0(412|414|416|424|426)\d{7}$/;
    if (!formData.telefono) {
      newErrors.telefono = 'El teléfono es obligatorio';
      isValid = false;
    } else if (!phoneRegex.test(formData.telefono)) {
      newErrors.telefono = 'Formato inválido. Usa: 04121234567';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800">¡Hola Chica Inova! 💁‍♀️✨</h1>
          <h2 className="text-xl font-bold text-purple-700 mt-2">Es Hora de meter pedido 🛍️ 🎉</h2>
          <p className="text-gray-600 mt-2">Por favor ingresa tus datos para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-purple-700">
              Nombre y Apellido <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.nombre ? 'border-red-500' : 'border-purple-200'
                } bg-purple-50`}
                placeholder="Ej: María Pérez"
                required
              />
            </div>
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-purple-700">
              Zona de Trabajo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
              <select
                value={formData.zona}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none ${
                  errors.zona ? 'border-red-500' : 'border-purple-200'
                } bg-purple-50`}
                required
              >
                <option value="">Selecciona una zona</option>
                {ZONAS.map((zona) => (
                  <option key={zona} value={zona}>
                    {zona}
                  </option>
                ))}
              </select>
            </div>
            {errors.zona && <p className="text-red-500 text-sm mt-1">{errors.zona}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-purple-700">
              Número de Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.telefono ? 'border-red-500' : 'border-purple-200'
                } bg-purple-50`}
                placeholder="Ej: 04121234567"
                required
              />
            </div>
            {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF4B55] text-white py-3 rounded-lg hover:bg-[#E6434D] transition-colors font-medium"
          >
            Siguiente
          </button>
        </form>
      </div>
    </div>
  );
}
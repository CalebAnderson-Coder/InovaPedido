import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
  title?: string;
  message?: string;
}

export default function Modal({ isOpen, onClose, onConfirm, children, title, message }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-purple-500" size={24} />
            <h2 className="text-lg font-semibold text-purple-800">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-500 hover:text-purple-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {children}
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-purple-600 hover:text-purple-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#FF4B55] text-white rounded hover:bg-[#E6434D]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 to-purple-300">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">InovaShop</h1>
          <p className="text-gray-700 mt-2">Sistema de Gestión de Pedidos</p>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
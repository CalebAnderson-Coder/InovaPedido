import React from 'react';
import RegistroVendedora from './components/RegistroVendedora';
import PedidosManager from './components/PedidosManager';
import Layout from './components/Layout';
import type { Vendedora } from './types/types';

function App() {
  const [vendedora, setVendedora] = React.useState<Vendedora | null>(null);

  if (!vendedora) {
    return <RegistroVendedora onSubmit={setVendedora} />;
  }

  return (
    <Layout>
      <PedidosManager vendedora={vendedora} />
    </Layout>
  );
}

export default App;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { RolProvider, useRol } from './context/RolContext';
import { useCotizacionesStore } from './store/cotizacionesStore';
import { useCuentasStore } from './store/cuentasStore';
import { useStockStore } from './store/stockStore';
import { useUndoStack } from './hooks/useUndoable';
import CotizacionesPage from './pages/CotizacionesPage';
import AprobadasPage from './pages/AprobadasPage';
import CuentasCorrientesPage from './pages/CuentasCorrientesPage';
import StockPage from './pages/StockPage';
import LoginPage from './pages/LoginPage';
import toast from 'react-hot-toast';

function StoreInit() {
  const initCot = useCotizacionesStore(s => s.init);
  const initCuentas = useCuentasStore(s => s.init);
  const initStock = useStockStore(s => s.init);

  useEffect(() => {
    initCot();
    initCuentas();
    initStock();
  }, []);

  return null;
}

function UndoKeyHandler() {
  const { undo, canUndo } = useUndoStack();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const el = document.activeElement as HTMLElement;
        const tag = el?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        if (canUndo) {
          const label = undo();
          if (label) toast.success(`Acción deshecha: ${label}`);
        }
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [canUndo, undo]);

  return null;
}

function AppRoutes() {
  const { usuarioActual } = useRol();

  if (!usuarioActual) return <LoginPage />;

  return (
    <>
      <StoreInit />
      <UndoKeyHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/cotizaciones" replace />} />
          <Route path="cotizaciones" element={<CotizacionesPage />} />
          <Route path="aprobadas" element={<AprobadasPage />} />
          <Route path="cuentas" element={<CuentasCorrientesPage />} />
          <Route path="stock" element={<StockPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/cotizaciones" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <RolProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' },
              iconTheme: { primary: '#1D9E75', secondary: '#fff' },
            },
            error: {
              style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' },
            },
          }}
        />
      </BrowserRouter>
    </RolProvider>
  );
}

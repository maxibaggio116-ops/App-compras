import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Undo2, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { useRol } from '../../context/RolContext';
import { useUndoStack } from '../../hooks/useUndoable';
import toast from 'react-hot-toast';
import { useCotizacionesStore } from '../../store/cotizacionesStore';

const ROUTE_LABELS: Record<string, string> = {
  '/cotizaciones': 'Cotizaciones',
  '/aprobadas': 'Presupuestos Aprobados',
  '/cuentas': 'Cuentas Corrientes',
  '/stock': 'Stock de Insumos',
};

export function Topbar() {
  const { pathname } = useLocation();
  const { usuarioActual, logout, isAdmin } = useRol();
  const { canUndo, topLabel, undo } = useUndoStack();
  const pendientes = useCotizacionesStore(s => s.cotizaciones.filter(c => c.estado === 'pendiente').length);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const sectionLabel = ROUTE_LABELS[pathname] ?? 'Inicio';

  function handleUndo() {
    const label = undo();
    if (label) toast.success(`Acción deshecha: ${label}`);
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    toast.success('Sesión cerrada');
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!usuarioActual) return null;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm z-10">
      {/* Sección activa */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-800 truncate">{sectionLabel}</h1>
      </div>

      {/* Badge pendientes */}
      {pendientes > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-amber-700 font-medium">{pendientes} pend.</span>
        </div>
      )}

      {/* Deshacer */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        title={canUndo ? `Deshacer: ${topLabel} (Ctrl+Z)` : 'Sin acciones para deshacer'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600"
      >
        <Undo2 size={15} />
        <span className="hidden sm:inline">Deshacer</span>
      </button>

      {/* Badge Admin */}
      {isAdmin && (
        <div className="flex items-center gap-1 bg-[#E1F5EE] border border-[#1D9E75]/30 rounded-lg px-2.5 py-1">
          <ShieldCheck size={13} className="text-[#1D9E75]" />
          <span className="text-xs text-[#0F6E56] font-medium">Admin</span>
        </div>
      )}

      {/* Avatar + menú */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity"
        >
          <div className={`w-8 h-8 rounded-full ${usuarioActual.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {usuarioActual.iniciales}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-800 leading-tight">{usuarioActual.nombre}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{usuarioActual.cargo}</p>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">{usuarioActual.nombre}</p>
              <p className="text-xs text-gray-400">{usuarioActual.email}</p>
              <p className="text-xs text-gray-400">{usuarioActual.cargo} — {usuarioActual.sector}</p>
            </div>
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Undo2, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { useRol, USUARIOS } from '../../context/RolContext';
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
  const { usuarioActual, setUsuarioById, isAdmin } = useRol();
  const { canUndo, topLabel, undo } = useUndoStack();
  const pendientes = useCotizacionesStore(s => s.cotizaciones.filter(c => c.estado === 'pendiente').length);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const sectionLabel = ROUTE_LABELS[pathname] ?? 'Inicio';

  function handleUndo() {
    const label = undo();
    if (label) toast.success(`Acción deshecha: ${label}`);
  }

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelectUsuario(id: string) {
    const u = USUARIOS.find(u => u.id === id);
    setUsuarioById(id);
    setDropdownOpen(false);
    if (u) toast.success(`Sesión cambiada: ${u.nombre}`);
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm z-10">
      {/* Section */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-800 truncate">{sectionLabel}</h1>
      </div>

      {/* Pending badge */}
      {pendientes > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-amber-700 font-medium">{pendientes} pend.</span>
        </div>
      )}

      {/* Undo */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        title={canUndo ? `Deshacer: ${topLabel} (Ctrl+Z)` : 'Sin acciones para deshacer'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600"
      >
        <Undo2 size={15} />
        <span className="hidden sm:inline">Deshacer</span>
      </button>

      {/* Admin badge */}
      {isAdmin && (
        <div className="flex items-center gap-1 bg-[#E1F5EE] border border-[#1D9E75]/30 rounded-lg px-2.5 py-1">
          <ShieldCheck size={13} className="text-[#1D9E75]" />
          <span className="text-xs text-[#0F6E56] font-medium">Admin</span>
        </div>
      )}

      {/* Selector de usuario */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 pl-2 border-l border-gray-200 hover:opacity-80 transition-opacity"
        >
          <div className={`w-8 h-8 rounded-full ${usuarioActual.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {usuarioActual.iniciales}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-800 leading-tight">{usuarioActual.nombre}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{usuarioActual.cargo}</p>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cambiar usuario</p>
            </div>
            <div className="py-1">
              {USUARIOS.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUsuario(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-full ${u.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {u.iniciales}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.nombre}</p>
                    <p className="text-[10px] text-gray-400 truncate">{u.cargo} — {u.sector}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {u.rol === 'admin' && (
                      <span className="text-[9px] bg-[#E1F5EE] text-[#0F6E56] px-1.5 py-0.5 rounded font-semibold">ADMIN</span>
                    )}
                    {usuarioActual.id === u.id && (
                      <Check size={13} className="text-[#1D9E75]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

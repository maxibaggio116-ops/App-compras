import { useLocation } from 'react-router-dom';
import { Undo2, ChevronDown, User, ShieldCheck } from 'lucide-react';
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
  const { rol, usuario, setRol, isAdmin } = useRol();
  const { canUndo, topLabel, undo } = useUndoStack();
  const pendientes = useCotizacionesStore(s => s.cotizaciones.filter(c => c.estado === 'pendiente').length);

  const sectionLabel = ROUTE_LABELS[pathname] ?? 'Inicio';

  function handleUndo() {
    const label = undo();
    if (label) toast.success(`Acción deshecha: ${label}`);
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

      {/* Rol toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => setRol('operador')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            rol === 'operador'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          <User size={13} />
          Operador
        </button>
        <button
          onClick={() => setRol('admin')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            rol === 'admin'
              ? 'bg-[#1D9E75] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          <ShieldCheck size={13} />
          Admin
        </button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
        <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-bold">
          {usuario.charAt(0)}
        </div>
        <span className="text-sm text-gray-700 hidden md:block">{usuario}</span>
      </div>
    </header>
  );
}

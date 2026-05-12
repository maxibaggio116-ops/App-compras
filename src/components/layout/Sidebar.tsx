import { NavLink } from 'react-router-dom';
import {
  FileText, CheckSquare, CreditCard, Package, Droplets,
} from 'lucide-react';
import { useCotizacionesStore } from '../../store/cotizacionesStore';
import { useCuentasStore } from '../../store/cuentasStore';
import { useStockStore } from '../../store/stockStore';
import { diasRestantes } from '../../utils/formatters';

export function Sidebar() {
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones);
  const cuentas = useCuentasStore(s => s.cuentas);
  const items = useStockStore(s => s.items);

  const pendientesCot = cotizaciones.filter(c => c.estado === 'pendiente').length;
  const aprobadasCot = cotizaciones.filter(c => c.estado === 'aprobada').length;

  const cuentasCriticas = cuentas.filter(
    c => c.estado === 'pendiente' && diasRestantes(c.vencimiento) <= 5
  ).length;

  const stockBajo = items.filter(i => i.stockActual < i.stockMinimo).length;

  const navItems = [
    {
      to: '/cotizaciones',
      label: 'Cotizaciones',
      icon: <FileText size={18} />,
      badge: pendientesCot > 0 ? pendientesCot : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      to: '/aprobadas',
      label: 'Presupuestos Aprobados',
      icon: <CheckSquare size={18} />,
      badge: aprobadasCot > 0 ? aprobadasCot : undefined,
      badgeColor: 'bg-[#1D9E75]',
    },
    {
      to: '/cuentas',
      label: 'Cuentas Corrientes',
      icon: <CreditCard size={18} />,
      badge: cuentasCriticas > 0 ? cuentasCriticas : undefined,
      badgeColor: 'bg-red-500',
    },
    {
      to: '/stock',
      label: 'Stock de Insumos',
      icon: <Package size={18} />,
      badge: stockBajo > 0 ? stockBajo : undefined,
      badgeColor: 'bg-red-500',
    },
  ];

  return (
    <aside className="w-56 flex-shrink-0 bg-[#0F6E56] flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
          <Droplets size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white text-xs font-bold leading-tight">Jugos del Uruguay</p>
          <p className="text-white/50 text-[10px]">Sistema de Compras</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/10',
              ].join(' ')
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`${item.badgeColor} text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1`}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-white/30 text-[10px] text-center">v1.0 — Mayo 2026</p>
      </div>
    </aside>
  );
}

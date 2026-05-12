import { useState, useMemo } from 'react';
import { DollarSign, AlertTriangle, CheckCircle, Clock, Edit, Trash2, RotateCcw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCuentasStore } from '../store/cuentasStore';
import { useRol } from '../context/RolContext';
import { pushUndo } from '../hooks/useUndoable';
import type { CuentaCorriente } from '../types';
import { Button } from '../components/ui/Button';
import { estadoBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { AlertBanner } from '../components/ui/AlertBanner';
import { MetricCard } from '../components/ui/Card';
import { formatMonto, formatFecha, diasRestantes } from '../utils/formatters';

function getEstadoReal(c: CuentaCorriente): 'pendiente' | 'pagado' | 'vencido' {
  if (c.estado === 'pagado') return 'pagado';
  if (diasRestantes(c.vencimiento) < 0) return 'vencido';
  return 'pendiente';
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] bg-white';

export default function CuentasCorrientesPage() {
  const { isAdmin } = useRol();
  const { cuentas, update, remove, marcarPagado, revertirPago, _snapshot, _restore } = useCuentasStore();

  const [filtroEstado, setFiltroEstado] = useState<string>('pendiente');
  const [search, setSearch] = useState('');
  const [modalPago, setModalPago] = useState<CuentaCorriente | null>(null);
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [obsPago, setObsPago] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<CuentaCorriente | null>(null);
  const [editando, setEditando] = useState<CuentaCorriente | null>(null);
  const [editMonto, setEditMonto] = useState('');
  const [editVenc, setEditVenc] = useState('');
  const [editObs, setEditObs] = useState('');

  const pendientes = useMemo(() => cuentas.filter(c => getEstadoReal(c) !== 'pagado'), [cuentas]);
  const vencidas = useMemo(() => cuentas.filter(c => getEstadoReal(c) === 'vencido'), [cuentas]);
  const proximas = useMemo(() => cuentas.filter(c => getEstadoReal(c) === 'pendiente' && diasRestantes(c.vencimiento) <= 5), [cuentas]);
  const totalPendiente = useMemo(() => pendientes.reduce((s, c) => s + (c.moneda === 'USD' ? c.monto : 0), 0), [pendientes]);

  const alertItems = useMemo(() =>
    [...vencidas, ...proximas]
      .map(c => ({ label: `${c.proveedor} — ${c.concepto}`, dias: diasRestantes(c.vencimiento) }))
      .sort((a, b) => a.dias - b.dias),
    [vencidas, proximas]
  );

  const filtered = useMemo(() => {
    return cuentas.filter(c => {
      const estadoR = getEstadoReal(c);
      if (filtroEstado === 'pendiente' && estadoR === 'pagado') return false;
      if (filtroEstado === 'vencido' && estadoR !== 'vencido') return false;
      if (filtroEstado === 'pagado' && estadoR !== 'pagado') return false;
      if (search) {
        const s = search.toLowerCase();
        if (!c.proveedor.toLowerCase().includes(s) && !c.concepto.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [cuentas, filtroEstado, search]);

  function handlePago() {
    if (!modalPago) return;
    const snap = _snapshot();
    marcarPagado(modalPago.id, fechaPago, obsPago);
    pushUndo({ label: `Pago: ${modalPago.proveedor}`, restore: () => _restore(snap) });
    setModalPago(null);
    setObsPago('');
    toast.success('Pago registrado');
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const snap = _snapshot();
    remove(confirmDelete.id);
    pushUndo({ label: `Eliminar CC: ${confirmDelete.proveedor}`, restore: () => _restore(snap) });
    setConfirmDelete(null);
    toast.success('Cuenta corriente eliminada');
  }

  function handleRevertirPago(c: CuentaCorriente) {
    const snap = _snapshot();
    revertirPago(c.id);
    pushUndo({ label: `Revertir pago: ${c.proveedor}`, restore: () => _restore(snap) });
    toast.success('Pago revertido');
  }

  function abrirEditar(c: CuentaCorriente) {
    setEditando(c);
    setEditMonto(String(c.monto));
    setEditVenc(c.vencimiento);
    setEditObs(c.observaciones);
  }

  function handleGuardarEdicion() {
    if (!editando) return;
    const snap = _snapshot();
    update(editando.id, {
      monto: Number(editMonto),
      vencimiento: editVenc,
      observaciones: editObs,
    });
    pushUndo({ label: `Editar CC: ${editando.proveedor}`, restore: () => _restore(snap) });
    setEditando(null);
    toast.success('Cuenta corriente actualizada');
  }

  function rowClass(c: CuentaCorriente) {
    const estado = getEstadoReal(c);
    if (estado === 'vencido') return 'bg-red-50/50 border-l-2 border-red-400';
    if (estado === 'pendiente' && diasRestantes(c.vencimiento) <= 5) return 'bg-amber-50/50 border-l-2 border-amber-400';
    return '';
  }

  function diasBadge(c: CuentaCorriente) {
    if (getEstadoReal(c) === 'pagado') return null;
    const dias = diasRestantes(c.vencimiento);
    if (dias < 0) return <span className="text-xs text-red-600 font-semibold">Vencido ({Math.abs(dias)}d)</span>;
    if (dias === 0) return <span className="text-xs text-red-600 font-semibold">Hoy</span>;
    if (dias <= 5) return <span className="text-xs text-amber-600 font-semibold">{dias}d</span>;
    return <span className="text-xs text-gray-500">{dias}d</span>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Cuentas Corrientes</h2>
        <p className="text-sm text-gray-400">{cuentas.length} registros</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total a pagar (USD)"
          value={`USD ${totalPendiente.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`}
          color="text-[#0F6E56]"
          icon={<DollarSign size={20} />}
        />
        <MetricCard
          label="Vencidos"
          value={vencidas.length}
          color={vencidas.length > 0 ? 'text-[#A32D2D]' : 'text-gray-800'}
          icon={<AlertTriangle size={20} />}
        />
        <MetricCard
          label="Vencen en ≤ 5 días"
          value={proximas.length}
          color={proximas.length > 0 ? 'text-[#BA7517]' : 'text-gray-800'}
          icon={<Clock size={20} />}
        />
        <MetricCard
          label="Al día"
          value={pendientes.filter(c => diasRestantes(c.vencimiento) > 5).length}
          color="text-[#1D9E75]"
          icon={<CheckCircle size={20} />}
        />
      </div>

      {/* Alert Banner */}
      <AlertBanner items={alertItems} />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
        >
          <option value="all">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="vencido">Vencidas</option>
          <option value="pagado">Pagadas</option>
        </select>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <EmptyState title="Sin cuentas corrientes" description="No hay cuentas con el filtro seleccionado." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Proveedor', 'Concepto', 'Monto', 'Fecha Fact.', 'Vencimiento', 'Días', 'Condición', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${rowClass(c)}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.proveedor}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{c.concepto}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {formatMonto(c.monto, c.moneda)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatFecha(c.fechaFactura)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatFecha(c.vencimiento)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{diasBadge(c)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.condicion}</td>
                    <td className="px-4 py-3">{estadoBadge(getEstadoReal(c))}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {getEstadoReal(c) !== 'pagado' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setModalPago(c)}
                            icon={<CheckCircle size={12} />}
                          >
                            Pagar
                          </Button>
                        )}
                        {isAdmin && getEstadoReal(c) === 'pagado' && (
                          <button
                            onClick={() => handleRevertirPago(c)}
                            title="Revertir pago"
                            className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => abrirEditar(c)}
                              title="Editar"
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(c)}
                              title="Eliminar"
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      <Modal
        open={!!modalPago}
        onClose={() => setModalPago(null)}
        title="Registrar pago"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalPago(null)}>Cancelar</Button>
            <Button onClick={handlePago}>Registrar pago</Button>
          </>
        }
      >
        {modalPago && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              <strong>{modalPago.proveedor}</strong> — {formatMonto(modalPago.monto, modalPago.moneda)}
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de pago *</label>
              <input
                type="date"
                value={fechaPago}
                onChange={e => setFechaPago(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
              <input
                value={obsPago}
                onChange={e => setObsPago(e.target.value)}
                className={inputCls}
                placeholder="Opcional"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editar */}
      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title="Editar cuenta corriente"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={handleGuardarEdicion}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Monto *</label>
            <input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento *</label>
            <input type="date" value={editVenc} onChange={e => setEditVenc(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
            <textarea value={editObs} onChange={e => setEditObs(e.target.value)} rows={2} className={inputCls} />
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar cuenta corriente"
        message={`¿Eliminar la cuenta de ${confirmDelete?.proveedor}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}

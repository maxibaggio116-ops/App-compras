import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Package, AlertTriangle, DollarSign, Search, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStockStore } from '../store/stockStore';
import { useRol } from '../context/RolContext';
import { pushUndo } from '../hooks/useUndoable';
import type { StockItem, TipoInsumo } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { StockBar } from '../components/ui/StockBar';
import { MetricCard } from '../components/ui/Card';
import { formatMonto, formatFechaHora, tipoLabel } from '../utils/formatters';

const TIPOS: { label: string; value: TipoInsumo }[] = [
  { label: 'Insumo productivo', value: 'insumo' },
  { label: 'Material/Envase', value: 'material' },
  { label: 'Servicio', value: 'servicio' },
  { label: 'Maquinaria', value: 'maquinaria' },
];
const UNIDADES = ['Kg', 'Unidades', 'Litros', 'Cajas', 'Pallets', 'Rollos', 'Metros', 'Servicios'];
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] bg-white';

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function StockPage() {
  const { isAdmin, usuario } = useRol();
  const { items, add, update, remove, ajustarStock, _snapshot, _restore } = useStockStore();

  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [modalNew, setModalNew] = useState(false);
  const [editando, setEditando] = useState<StockItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StockItem | null>(null);
  const [modalAjuste, setModalAjuste] = useState<StockItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form new/edit
  const [form, setForm] = useState({
    tipo: 'insumo' as TipoInsumo,
    nombre: '',
    unidad: 'Kg',
    stockActual: 0,
    stockMinimo: 0,
    stockMaximo: 100,
    precioReferencia: 0,
    proveedor: '',
    ubicacion: '',
    observaciones: '',
  });

  // Form ajuste
  const [ajuste, setAjuste] = useState({ stockNuevo: 0, motivo: '', tipo: 'ajuste' as 'entrada' | 'salida' | 'ajuste' });

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (tipoFilter && i.tipo !== tipoFilter) return false;
      if (estadoFilter === 'bajo' && i.stockActual >= i.stockMinimo) return false;
      if (estadoFilter === 'ok' && i.stockActual < i.stockMinimo) return false;
      if (search && !i.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, tipoFilter, estadoFilter, search]);

  const bajosMinimo = useMemo(() => items.filter(i => i.stockActual < i.stockMinimo), [items]);
  const valorTotal = useMemo(() => items.reduce((s, i) => s + i.stockActual * i.precioReferencia, 0), [items]);

  function openNew() {
    setForm({ tipo: 'insumo', nombre: '', unidad: 'Kg', stockActual: 0, stockMinimo: 0, stockMaximo: 100, precioReferencia: 0, proveedor: '', ubicacion: '', observaciones: '' });
    setModalNew(true);
  }

  function openEdit(item: StockItem) {
    setEditando(item);
    setForm({
      tipo: item.tipo,
      nombre: item.nombre,
      unidad: item.unidad,
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      stockMaximo: item.stockMaximo,
      precioReferencia: item.precioReferencia,
      proveedor: item.proveedor ?? '',
      ubicacion: item.ubicacion ?? '',
      observaciones: item.observaciones ?? '',
    });
  }

  function handleSave() {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    const snap = _snapshot();
    if (editando) {
      update(editando.id, form);
      pushUndo({ label: `Editar stock: ${editando.nombre}`, restore: () => _restore(snap) });
      setEditando(null);
      toast.success('Insumo actualizado');
    } else {
      add(form);
      pushUndo({ label: `Crear insumo: ${form.nombre}`, restore: () => _restore(snap) });
      setModalNew(false);
      toast.success('Insumo agregado al catálogo');
    }
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const snap = _snapshot();
    remove(confirmDelete.id);
    pushUndo({ label: `Eliminar insumo: ${confirmDelete.nombre}`, restore: () => _restore(snap) });
    setConfirmDelete(null);
    toast.success('Insumo eliminado');
  }

  function openAjuste(item: StockItem) {
    setModalAjuste(item);
    setAjuste({ stockNuevo: item.stockActual, motivo: '', tipo: 'ajuste' });
  }

  function handleAjuste() {
    if (!modalAjuste) return;
    if (!ajuste.motivo.trim()) { toast.error('El motivo es requerido'); return; }
    const snap = _snapshot();
    ajustarStock(modalAjuste.id, ajuste.stockNuevo, ajuste.motivo, ajuste.tipo, usuario);
    pushUndo({ label: `Ajuste stock: ${modalAjuste.nombre}`, restore: () => _restore(snap) });
    setModalAjuste(null);
    toast.success('Stock ajustado');
  }

  const FormContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo" required>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoInsumo }))} className={inputCls}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Unidad" required>
          <select value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} className={inputCls}>
            {UNIDADES.map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Nombre del insumo" required>
        <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="Ej: Pectina cítrica E440" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Stock actual" required>
          <input type="number" value={form.stockActual} onChange={e => setForm(f => ({ ...f, stockActual: Number(e.target.value) }))} className={inputCls} />
        </Field>
        <Field label="Stock mínimo" required>
          <input type="number" value={form.stockMinimo} onChange={e => setForm(f => ({ ...f, stockMinimo: Number(e.target.value) }))} className={inputCls} disabled={!isAdmin && !!editando} />
        </Field>
        <Field label="Stock máximo" required>
          <input type="number" value={form.stockMaximo} onChange={e => setForm(f => ({ ...f, stockMaximo: Number(e.target.value) }))} className={inputCls} disabled={!isAdmin && !!editando} />
        </Field>
      </div>
      <Field label="Precio de referencia (USD/unidad)" required>
        <input type="number" step="any" value={form.precioReferencia} onChange={e => setForm(f => ({ ...f, precioReferencia: Number(e.target.value) }))} className={inputCls} disabled={!isAdmin && !!editando} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Proveedor habitual">
          <input value={form.proveedor} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} className={inputCls} />
        </Field>
        <Field label="Ubicación en depósito">
          <input value={form.ubicacion} onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))} className={inputCls} />
        </Field>
      </div>
      <Field label="Observaciones">
        <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} className={inputCls} />
      </Field>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Stock de Insumos</h2>
          <p className="text-sm text-gray-400">{items.length} items en catálogo</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>
          Nuevo insumo
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Items en catálogo" value={items.length} icon={<Package size={20} />} />
        <MetricCard
          label="Bajo mínimo"
          value={bajosMinimo.length}
          color={bajosMinimo.length > 0 ? 'text-[#A32D2D]' : 'text-gray-800'}
          icon={<AlertTriangle size={20} />}
        />
        <MetricCard
          label="Valor total estimado"
          value={`USD ${valorTotal.toLocaleString('es-UY', { minimumFractionDigits: 0 })}`}
          color="text-[#0F6E56]"
          icon={<DollarSign size={20} />}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30" />
        </div>
        <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">Todos los estados</option>
          <option value="bajo">Bajo mínimo</option>
          <option value="ok">Adecuado</option>
        </select>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState title="Sin insumos" description="No hay insumos en el catálogo." action={<Button onClick={openNew} size="sm" icon={<Plus size={14} />}>Nuevo insumo</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isBajo = item.stockActual < item.stockMinimo;
            const expanded = expandedId === item.id;
            return (
              <div key={item.id} className={`bg-white rounded-xl border ${isBajo ? 'border-red-200' : 'border-gray-200'} shadow-sm overflow-hidden`}>
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
                        {isBajo && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full uppercase tracking-wide">
                            Bajo mínimo
                          </span>
                        )}
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tipoLabel(item.tipo)}</span>
                      </div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className={`text-2xl font-bold ${isBajo ? 'text-[#A32D2D]' : 'text-gray-800'}`}>
                          {item.stockActual.toLocaleString('es-UY')}
                        </span>
                        <span className="text-sm text-gray-400">{item.unidad}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          | Ref: {formatMonto(item.precioReferencia, 'USD')}/{item.unidad}
                          | Valor: {formatMonto(item.stockActual * item.precioReferencia, 'USD')}
                        </span>
                      </div>
                      <StockBar actual={item.stockActual} minimo={item.stockMinimo} maximo={item.stockMaximo} />
                      {(item.proveedor || item.ubicacion) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {item.proveedor && <span>{item.proveedor}</span>}
                          {item.proveedor && item.ubicacion && <span> — </span>}
                          {item.ubicacion && <span>{item.ubicacion}</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openAjuste(item)}
                        title="Ajustar stock"
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-[#E1F5EE] text-[#0F6E56] hover:bg-[#c5eade] font-medium"
                      >
                        Ajustar
                      </button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit size={14} /></button>
                      {isAdmin && (
                        <button onClick={() => setConfirmDelete(item)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      )}
                      <button
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                      >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Historial expandido */}
                {expanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Historial de movimientos ({item.historialMovimientos.length})
                    </h4>
                    {item.historialMovimientos.length === 0 ? (
                      <p className="text-xs text-gray-400">Sin movimientos registrados.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {[...item.historialMovimientos].reverse().map(m => (
                          <div key={m.id} className="flex gap-3 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              m.tipo === 'compra' ? 'bg-blue-100 text-blue-700' :
                              m.tipo === 'entrada' ? 'bg-green-100 text-green-700' :
                              m.tipo === 'salida' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{m.tipo}</span>
                            <span className="text-gray-600">{m.motivo}</span>
                            <span className="text-gray-400 ml-auto">{m.stockAnterior.toLocaleString('es-UY')} → <strong>{m.stockNuevo.toLocaleString('es-UY')}</strong> {item.unidad}</span>
                            <span className="text-gray-400">{formatFechaHora(m.fecha)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo */}
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nuevo insumo en catálogo" size="xl" footer={
        <><Button variant="outline" onClick={() => setModalNew(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>
      }>{FormContent}</Modal>

      {/* Modal Editar */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title={`Editar: ${editando?.nombre}`} size="xl" footer={
        <><Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>
      }>{FormContent}</Modal>

      {/* Modal Ajuste */}
      <Modal open={!!modalAjuste} onClose={() => setModalAjuste(null)} title={`Ajustar stock: ${modalAjuste?.nombre}`} size="sm" footer={
        <><Button variant="outline" onClick={() => setModalAjuste(null)}>Cancelar</Button><Button onClick={handleAjuste}>Ajustar</Button></>
      }>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Stock actual: <strong>{modalAjuste?.stockActual.toLocaleString('es-UY')} {modalAjuste?.unidad}</strong>
          </p>
          <Field label="Tipo de movimiento" required>
            <select value={ajuste.tipo} onChange={e => setAjuste(a => ({ ...a, tipo: e.target.value as typeof ajuste.tipo }))} className={inputCls}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Corrección de inventario</option>
            </select>
          </Field>
          <Field label="Stock nuevo" required>
            <input type="number" value={ajuste.stockNuevo} onChange={e => setAjuste(a => ({ ...a, stockNuevo: Number(e.target.value) }))} className={inputCls} />
          </Field>
          <Field label="Motivo" required>
            <input value={ajuste.motivo} onChange={e => setAjuste(a => ({ ...a, motivo: e.target.value }))} className={inputCls} placeholder="Ej: Inventario mensual, Recepción de mercadería..." />
          </Field>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar insumo"
        message={`¿Eliminar "${confirmDelete?.nombre}" del catálogo? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}

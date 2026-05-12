import React, { useState, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, RotateCcw, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCotizacionesStore } from '../store/cotizacionesStore';
import { useRol } from '../context/RolContext';
import { pushUndo } from '../hooks/useUndoable';
import type { Cotizacion } from '../types';
import { Button } from '../components/ui/Button';
import { estadoBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { CotizacionForm } from '../components/cotizaciones/CotizacionForm';
import type { CotizacionFormData } from '../components/cotizaciones/CotizacionForm';
import { CotizacionDetalle } from '../components/cotizaciones/CotizacionDetalle';
import { formatMonto, formatFecha, tipoLabel, plazoLabel } from '../utils/formatters';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

const ESTADO_TABS = [
  { value: 'all', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'comprada', label: 'Compradas' },
] as const;

export default function CotizacionesPage() {
  const { usuario, isAdmin } = useRol();
  const { cotizaciones, add, update, remove, setEstado, _snapshot, _restore } = useCotizacionesStore();

  const [tab, setTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [modalNew, setModalNew] = useState(false);
  const [editing, setEditing] = useState<Cotizacion | null>(null);
  const [detalle, setDetalle] = useState<Cotizacion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Cotizacion | null>(null);
  const [confirmReject, setConfirmReject] = useState<Cotizacion | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [confirmDesaprobar, setConfirmDesaprobar] = useState<Cotizacion | null>(null);

  const filtered = useMemo(() => {
    return cotizaciones.filter(c => {
      if (tab !== 'all' && c.estado !== tab) return false;
      if (tipoFilter && c.tipo !== tipoFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !c.articulo.toLowerCase().includes(s) &&
          !c.proveedor.toLowerCase().includes(s) &&
          !c.descripcion.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [cotizaciones, tab, search, tipoFilter]);

  function handleAdd(data: CotizacionFormData) {
    const snap = _snapshot();
    add({ ...data, plazoPaymentDias: Number(data.plazoPaymentDias) });
    pushUndo({ label: `Crear cotización: ${data.articulo}`, restore: () => { _restore(snap); } });
    setModalNew(false);
    toast.success(`Cotización "${data.articulo}" creada`);
  }

  function handleEdit(data: CotizacionFormData) {
    if (!editing) return;
    const snap = _snapshot();
    update(editing.id, { ...data, plazoPaymentDias: Number(data.plazoPaymentDias) }, usuario);
    pushUndo({ label: `Editar cotización: ${editing.articulo}`, restore: () => { _restore(snap); } });
    setEditing(null);
    toast.success('Cotización actualizada');
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const snap = _snapshot();
    remove(confirmDelete.id);
    pushUndo({ label: `Eliminar cotización: ${confirmDelete.articulo}`, restore: () => { _restore(snap); } });
    setConfirmDelete(null);
    toast.success('Cotización eliminada');
  }

  function handleAprobar(c: Cotizacion) {
    const snap = _snapshot();
    setEstado(c.id, 'aprobada', usuario);
    pushUndo({ label: `Aprobación: ${c.articulo}`, restore: () => { _restore(snap); } });
    toast.success(`"${c.articulo}" aprobada`);
  }

  function handleRechazar() {
    if (!confirmReject || !rejectMotivo.trim()) return;
    const snap = _snapshot();
    setEstado(confirmReject.id, 'rechazada', usuario, rejectMotivo);
    pushUndo({ label: `Rechazo: ${confirmReject.articulo}`, restore: () => { _restore(snap); } });
    setConfirmReject(null);
    setRejectMotivo('');
    toast.success('Cotización rechazada');
  }

  function handleDesaprobar() {
    if (!confirmDesaprobar) return;
    const snap = _snapshot();
    setEstado(confirmDesaprobar.id, 'pendiente', usuario, 'Aprobación revertida');
    pushUndo({ label: `Desaprobar: ${confirmDesaprobar.articulo}`, restore: () => { _restore(snap); } });
    setConfirmDesaprobar(null);
    toast.success('Aprobación revertida');
  }

  function canEdit(c: Cotizacion) {
    if (c.estado !== 'pendiente') return false;
    return isAdmin || c.cargadoPor === usuario;
  }

  function canDelete(c: Cotizacion) {
    if (isAdmin) return true;
    return c.cargadoPor === usuario && c.estado === 'pendiente';
  }

  function exportarPDF() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Cotizaciones — Jugos del Uruguay S.A.', 14, 15);
    doc.setFontSize(9);
    doc.text(`Exportado: ${new Date().toLocaleDateString('es-UY')}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['Artículo', 'Tipo', 'Proveedor', 'Cantidad', 'Precio Unit.', 'Total', 'Estado']],
      body: filtered.map(c => [
        c.articulo,
        tipoLabel(c.tipo),
        c.proveedor,
        `${c.cantidad.toLocaleString('es-UY')} ${c.unidad}`,
        formatMonto(c.precioUnitario, c.moneda),
        formatMonto(c.cantidad * c.precioUnitario, c.moneda),
        c.estado,
      ]),
      styles: { fontSize: 7 },
    });
    doc.save('cotizaciones.pdf');
    toast.success('PDF exportado');
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Cotizaciones</h2>
          <p className="text-sm text-gray-400">{cotizaciones.length} en total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarPDF} icon={<FileDown size={14} />}>
            PDF
          </Button>
          <Button onClick={() => setModalNew(true)} icon={<Plus size={16} />}>
            Nueva cotización
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar artículo, proveedor..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
            />
          </div>
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
          >
            <option value="">Todos los tipos</option>
            <option value="insumo">Insumo productivo</option>
            <option value="material">Material/Envase</option>
            <option value="servicio">Servicio</option>
            <option value="maquinaria">Maquinaria</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100 pb-0">
          {ESTADO_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2',
                tab === t.value
                  ? 'border-[#1D9E75] text-[#1D9E75]'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {t.label}
              <span className="ml-1 text-gray-400">
                ({cotizaciones.filter(c => t.value === 'all' || c.estado === t.value).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No hay cotizaciones"
          description="No se encontraron cotizaciones con los filtros seleccionados."
          action={
            <Button onClick={() => setModalNew(true)} icon={<Plus size={14} />} size="sm">
              Nueva cotización
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Artículo', 'Tipo', 'Proveedor', 'Origen', 'Cantidad', 'Precio Unit.', 'Total', 'Plazo', 'Validez', 'Estado', 'Cargado por', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetalle(c)}
                        className="font-medium text-gray-800 hover:text-[#1D9E75] text-left"
                      >
                        {c.articulo}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-500">{tipoLabel(c.tipo)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{c.proveedor}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.origen}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {c.cantidad.toLocaleString('es-UY')} {c.unidad}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatMonto(c.precioUnitario, c.moneda)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                      {formatMonto(c.cantidad * c.precioUnitario, c.moneda)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{plazoLabel(c.plazoPaymentDias)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatFecha(c.validezHasta)}</td>
                    <td className="px-4 py-3">{estadoBadge(c.estado)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.cargadoPor}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => setDetalle(c)}
                          title="Ver detalle"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Eye size={14} />
                        </button>
                        {canEdit(c) && (
                          <button
                            onClick={() => setEditing(c)}
                            title="Editar"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {canDelete(c) && (
                          <button
                            onClick={() => setConfirmDelete(c)}
                            title="Eliminar"
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {isAdmin && c.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleAprobar(c)}
                              title="Aprobar"
                              className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmReject(c)}
                              title="Rechazar"
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {isAdmin && c.estado === 'aprobada' && !c.factura && (
                          <button
                            onClick={() => setConfirmDesaprobar(c)}
                            title="Desaprobar"
                            className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                          >
                            <RotateCcw size={14} />
                          </button>
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

      {/* Modal Nueva */}
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nueva cotización" size="2xl">
        <CotizacionForm
          defaultValues={{ cargadoPor: usuario }}
          onSubmit={handleAdd}
          onCancel={() => setModalNew(false)}
        />
      </Modal>

      {/* Modal Editar */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar cotización" size="2xl">
        {editing && (
          <CotizacionForm
            defaultValues={{
              tipo: editing.tipo,
              articulo: editing.articulo,
              proveedor: editing.proveedor,
              descripcion: editing.descripcion,
              paraQueSirve: editing.paraQueSirve,
              sector: editing.sector,
              cantidad: editing.cantidad,
              unidad: editing.unidad,
              precioUnitario: editing.precioUnitario,
              moneda: editing.moneda,
              plazoPaymentDias: editing.plazoPaymentDias,
              origen: editing.origen,
              validezHasta: editing.validezHasta,
              cargadoPor: editing.cargadoPor,
              observaciones: editing.observaciones,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar cotización"
        message={`¿Eliminar cotización de "${confirmDelete?.articulo}" de ${confirmDelete?.proveedor}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />

      {/* Modal Rechazar */}
      <Modal
        open={!!confirmReject}
        onClose={() => { setConfirmReject(null); setRejectMotivo(''); }}
        title="Rechazar cotización"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setConfirmReject(null); setRejectMotivo(''); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleRechazar} disabled={!rejectMotivo.trim()}>
              Rechazar
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-3">
          Rechazando: <strong>{confirmReject?.articulo}</strong>
        </p>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Motivo de rechazo <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={rejectMotivo}
          onChange={e => setRejectMotivo(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
          placeholder="Explique el motivo del rechazo..."
        />
      </Modal>

      {/* Confirm Desaprobar */}
      <ConfirmDialog
        open={!!confirmDesaprobar}
        onClose={() => setConfirmDesaprobar(null)}
        onConfirm={handleDesaprobar}
        title="Desaprobar cotización"
        message={`¿Revertir la aprobación de "${confirmDesaprobar?.articulo}"? Volverá a estado Pendiente.`}
        confirmLabel="Desaprobar"
        variant="warning"
      />

      {/* Drawer detalle */}
      {detalle && <CotizacionDetalle cotizacion={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
}

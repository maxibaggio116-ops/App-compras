import { useState, useMemo } from 'react';
import { Receipt, RotateCcw, Eye, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCotizacionesStore } from '../store/cotizacionesStore';
import { useCuentasStore } from '../store/cuentasStore';
import { useStockStore } from '../store/stockStore';
import { useRol } from '../context/RolContext';
import { pushUndo } from '../hooks/useUndoable';
import type { Cotizacion, Factura } from '../types';
import { Button } from '../components/ui/Button';
import { estadoBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { FacturaForm } from '../components/aprobadas/FacturaForm';
import { CotizacionDetalle } from '../components/cotizaciones/CotizacionDetalle';
import { formatMonto, tipoLabel, plazoLabel, addDias } from '../utils/formatters';

export default function AprobadasPage() {
  const { usuario, isAdmin } = useRol();
  const cotStore = useCotizacionesStore();
  const cuentasStore = useCuentasStore();
  const stockStore = useStockStore();

  const [search, setSearch] = useState('');
  const [facturando, setFacturando] = useState<Cotizacion | null>(null);
  const [confirmRevertir, setConfirmRevertir] = useState<Cotizacion | null>(null);
  const [detalle, setDetalle] = useState<Cotizacion | null>(null);

  const filtered = useMemo(() => {
    return cotStore.cotizaciones
      .filter(c => c.estado === 'aprobada' || c.estado === 'comprada')
      .filter(c => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.articulo.toLowerCase().includes(s) || c.proveedor.toLowerCase().includes(s);
      });
  }, [cotStore.cotizaciones, search]);

  function handleRegistrarFactura(factura: Factura) {
    if (!facturando) return;
    const snapCot = cotStore._snapshot();
    const snapCuentas = cuentasStore._snapshot();
    const snapStock = stockStore._snapshot();

    // Registrar factura
    cotStore.registrarFactura(facturando.id, factura, usuario);

    // Crear cuenta corriente
    const vencimiento = addDias(factura.fecha, facturando.plazoPaymentDias);
    cuentasStore.add({
      cotizacionId: facturando.id,
      proveedor: facturando.proveedor,
      concepto: `${facturando.articulo} - Fact. ${factura.numero}`,
      monto: factura.montoTotal,
      moneda: factura.moneda,
      fechaFactura: factura.fecha,
      vencimiento,
      condicion: plazoLabel(facturando.plazoPaymentDias),
      estado: facturando.plazoPaymentDias === 0 ? 'pagado' : 'pendiente',
      alertaEnviada: false,
      pagadoEn: facturando.plazoPaymentDias === 0 ? factura.fecha : undefined,
      observaciones: factura.observaciones,
    });

    // Actualizar stock si existe el artículo
    const stockItem = stockStore.findByNombre(facturando.articulo);
    if (stockItem) {
      stockStore.ajustarStock(
        stockItem.id,
        stockItem.stockActual + facturando.cantidad,
        `Compra - Factura ${factura.numero}`,
        'compra',
        usuario,
        facturando.id
      );
    }

    pushUndo({
      label: `Facturar: ${facturando.articulo}`,
      restore: () => {
        cotStore._restore(snapCot);
        cuentasStore._restore(snapCuentas);
        stockStore._restore(snapStock);
      },
    });

    setFacturando(null);
    toast.success(`Factura registrada. ${stockItem ? 'Stock actualizado.' : ''}`);
  }

  function handleRevertirFactura() {
    if (!confirmRevertir) return;
    const snapCot = cotStore._snapshot();
    const snapCuentas = cuentasStore._snapshot();

    cotStore.revertirFactura(confirmRevertir.id, usuario);
    cuentasStore.removeByCotizacion(confirmRevertir.id);

    pushUndo({
      label: `Revertir factura: ${confirmRevertir.articulo}`,
      restore: () => {
        cotStore._restore(snapCot);
        cuentasStore._restore(snapCuentas);
      },
    });

    setConfirmRevertir(null);
    toast.success('Facturación revertida');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Presupuestos Aprobados</h2>
          <p className="text-sm text-gray-400">
            {filtered.filter(c => c.estado === 'aprobada').length} aprobadas,{' '}
            {filtered.filter(c => c.estado === 'comprada').length} compradas
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar artículo o proveedor..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin presupuestos aprobados"
          description="Aprobá cotizaciones desde el módulo de Cotizaciones."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Artículo', 'Tipo', 'Proveedor', 'Cantidad', 'Total estimado', 'Plazo', 'Estado', 'Factura', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.estado === 'comprada' ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetalle(c)}
                        className="font-medium text-gray-800 hover:text-[#1D9E75] text-left"
                      >
                        {c.articulo}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{tipoLabel(c.tipo)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.proveedor}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.cantidad.toLocaleString('es-UY')} {c.unidad}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {formatMonto(c.cantidad * c.precioUnitario, c.moneda)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{plazoLabel(c.plazoPaymentDias)}</td>
                    <td className="px-4 py-3">{estadoBadge(c.estado)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.factura ? (
                        <span className="flex items-center gap-1">
                          <span>{c.factura.numero}</span>
                          {c.factura.adjuntoBase64 && (
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = c.factura!.adjuntoBase64!;
                                link.download = c.factura!.adjuntoNombre!;
                                link.click();
                              }}
                              className="text-[#1D9E75] hover:underline"
                            >
                              <Download size={12} />
                            </button>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => setDetalle(c)}
                          title="Ver detalle"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Eye size={14} />
                        </button>
                        {c.estado === 'aprobada' && (
                          <Button
                            size="sm"
                            onClick={() => setFacturando(c)}
                            icon={<Receipt size={12} />}
                          >
                            Facturar
                          </Button>
                        )}
                        {isAdmin && c.estado === 'comprada' && (
                          <button
                            onClick={() => setConfirmRevertir(c)}
                            title="Revertir facturación"
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

      {/* Modal Facturar */}
      <Modal
        open={!!facturando}
        onClose={() => setFacturando(null)}
        title={`Registrar factura — ${facturando?.articulo}`}
        size="xl"
      >
        {facturando && (
          <FacturaForm
            cotizacion={facturando}
            usuario={usuario}
            onSubmit={handleRegistrarFactura}
            onCancel={() => setFacturando(null)}
          />
        )}
      </Modal>

      {/* Confirm Revertir */}
      <ConfirmDialog
        open={!!confirmRevertir}
        onClose={() => setConfirmRevertir(null)}
        onConfirm={handleRevertirFactura}
        title="Revertir facturación"
        message={`¿Revertir la facturación de "${confirmRevertir?.articulo}"? Se eliminará la cuenta corriente asociada y el movimiento de stock.`}
        confirmLabel="Revertir"
        variant="warning"
      />

      {/* Drawer detalle */}
      {detalle && <CotizacionDetalle cotizacion={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
}

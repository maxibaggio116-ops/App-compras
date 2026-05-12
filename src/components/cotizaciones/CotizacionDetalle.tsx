import { X, Download } from 'lucide-react';
import type { Cotizacion } from '../../types';
import { estadoBadge } from '../ui/Badge';
import { formatMonto, formatFechaHora, formatFecha, tipoLabel, plazoLabel } from '../../utils/formatters';

interface Props {
  cotizacion: Cotizacion;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}

export function CotizacionDetalle({ cotizacion: c, onClose }: Props) {
  const total = c.cantidad * c.precioUnitario;

  function descargarAdjunto() {
    if (!c.factura?.adjuntoBase64 || !c.factura?.adjuntoNombre) return;
    const link = document.createElement('a');
    link.href = c.factura.adjuntoBase64;
    link.download = c.factura.adjuntoNombre;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{c.articulo}</h2>
            <p className="text-xs text-gray-400">{c.proveedor} — {tipoLabel(c.tipo)}</p>
          </div>
          <div className="flex items-center gap-2">
            {estadoBadge(c.estado)}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Datos principales */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalles</h3>
            <Row label="Tipo" value={tipoLabel(c.tipo)} />
            <Row label="Sector" value={c.sector} />
            <Row label="Descripción" value={c.descripcion} />
            <Row label="Para qué sirve" value={c.paraQueSirve} />
            <Row label="Cantidad" value={`${c.cantidad.toLocaleString('es-UY')} ${c.unidad}`} />
            <Row label="Precio unitario" value={formatMonto(c.precioUnitario, c.moneda)} />
            <Row label="Total estimado" value={<span className="font-semibold">{formatMonto(total, c.moneda)}</span>} />
            <Row label="Plazo de pago" value={plazoLabel(c.plazoPaymentDias)} />
            <Row label="Origen" value={c.origen} />
            <Row label="Validez hasta" value={formatFecha(c.validezHasta)} />
            <Row label="Cargado por" value={c.cargadoPor} />
            {c.observaciones && <Row label="Observaciones" value={c.observaciones} />}
            {c.motivoRechazo && (
              <Row label="Motivo rechazo" value={<span className="text-red-600">{c.motivoRechazo}</span>} />
            )}
          </section>

          {/* Factura */}
          {c.factura && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Factura</h3>
              <Row label="N° Factura" value={c.factura.numero} />
              <Row label="Fecha" value={formatFecha(c.factura.fecha)} />
              <Row label="Monto total" value={formatMonto(c.factura.montoTotal, c.factura.moneda)} />
              <Row label="Registrado por" value={c.factura.registradoPor} />
              {c.factura.observaciones && <Row label="Obs. factura" value={c.factura.observaciones} />}
              {c.factura.adjuntoNombre && (
                <Row
                  label="Adjunto"
                  value={
                    <button
                      onClick={descargarAdjunto}
                      className="flex items-center gap-1 text-[#1D9E75] hover:underline text-xs"
                    >
                      <Download size={12} /> {c.factura.adjuntoNombre}
                    </button>
                  }
                />
              )}
            </section>
          )}

          {/* Historial */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Historial
            </h3>
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-3">
                {c.historial.map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-[#1D9E75] border-2 border-white" />
                    <p className="text-xs font-medium text-gray-700">{h.accion}</p>
                    <p className="text-[10px] text-gray-400">
                      {formatFechaHora(h.fecha)} — {h.usuario}
                      {h.detalle && <span> — {h.detalle}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

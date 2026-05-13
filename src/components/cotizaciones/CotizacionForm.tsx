import React, { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TipoInsumo, Moneda, StockItem } from '../../types';
import { Button } from '../ui/Button';
import { formatMonto } from '../../utils/formatters';
import { ArrowLeftRight, PackageSearch, X } from 'lucide-react';

const schema = z.object({
  tipo: z.enum(['insumo', 'material', 'servicio', 'maquinaria']),
  articulo: z.string().min(2, 'Requerido'),
  proveedor: z.string().min(2, 'Requerido'),
  descripcion: z.string().min(5, 'Requerido'),
  paraQueSirve: z.string().min(5, 'Requerido'),
  sector: z.string().min(1, 'Requerido'),
  cantidad: z.number().positive('Debe ser mayor a 0'),
  unidad: z.string().min(1, 'Requerido'),
  precioUnitario: z.number().positive('Debe ser mayor a 0'),
  moneda: z.enum(['USD', 'UYU', 'ARS']),
  plazoPaymentDias: z.number().min(0),
  origen: z.string().min(2, 'Requerido'),
  validezHasta: z.string().min(1, 'Requerido'),
  cargadoPor: z.string().min(2, 'Requerido'),
  observaciones: z.string(),
});

export type CotizacionFormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<CotizacionFormData>;
  onSubmit: (data: CotizacionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  stockItems?: StockItem[];
}

const SECTORES = ['Producción', 'Mantenimiento', 'Administración', 'Logística', 'Calidad'];
const UNIDADES = ['Unidades', 'Kg', 'Litros', 'Cajas', 'Pallets', 'Rollos', 'Metros', 'Servicios'];
const PLAZOS = [
  { label: 'Contado', value: 0 },
  { label: '15 días', value: 15 },
  { label: '30 días', value: 30 },
  { label: '45 días', value: 45 },
  { label: '60 días', value: 60 },
  { label: '90 días', value: 90 },
  { label: '120 días', value: 120 },
];
const TIPOS: { label: string; value: TipoInsumo }[] = [
  { label: 'Insumo productivo', value: 'insumo' },
  { label: 'Material/Envase', value: 'material' },
  { label: 'Servicio', value: 'servicio' },
  { label: 'Maquinaria', value: 'maquinaria' },
];

// Tipo de cambio por defecto (configurable por el usuario en el formulario)
const TC_DEFAULT_USD_UYU = 42;

function Field({
  label, error, children, required,
}: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] bg-white';

export function CotizacionForm({ defaultValues, onSubmit, onCancel, loading, stockItems = [] }: Props) {
  const [tcUSDUYU, setTcUSDUYU] = useState(TC_DEFAULT_USD_UYU);
  const [showTC, setShowTC] = useState(false);
  const [stockVinculado, setStockVinculado] = useState<StockItem | null>(null);
  const [stockSearch, setStockSearch] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<CotizacionFormData>({
    resolver: zodResolver(schema) as Resolver<CotizacionFormData>,
    defaultValues: {
      tipo: 'insumo',
      moneda: 'USD',
      plazoPaymentDias: 30,
      unidad: 'Unidades',
      sector: 'Producción',
      observaciones: '',
      ...defaultValues,
    },
  });

  const cantidad = watch('cantidad') || 0;
  const precio = watch('precioUnitario') || 0;
  const moneda = watch('moneda') as Moneda;
  const total = cantidad * precio;

  // Conversión entre USD y UYU
  function convertir(monto: number, desde: Moneda): { monto: number; moneda: Moneda } | null {
    if (desde === 'USD') return { monto: monto * tcUSDUYU, moneda: 'UYU' };
    if (desde === 'UYU') return { monto: monto / tcUSDUYU, moneda: 'USD' };
    return null;
  }

  const precioConvertido = precio > 0 ? convertir(precio, moneda) : null;
  const totalConvertido = total > 0 ? convertir(total, moneda) : null;

  const filteredStock = stockItems.filter(s =>
    s.nombre.toLowerCase().includes(stockSearch.toLowerCase())
  );

  function seleccionarStock(item: StockItem) {
    setStockVinculado(item);
    setStockSearch('');
    setShowStockDropdown(false);
    setValue('articulo', item.nombre);
    setValue('unidad', item.unidad);
    setValue('tipo', item.tipo);
  }

  function limpiarStock() {
    setStockVinculado(null);
    setStockSearch('');
    setValue('articulo', '');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Selector de insumo de stock */}
      {stockItems.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <PackageSearch size={13} />
            Vincular a insumo de stock (opcional)
          </p>
          {stockVinculado ? (
            <div className="flex items-center justify-between bg-[#E1F5EE] border border-[#1D9E75]/30 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[#0F6E56]">{stockVinculado.nombre}</p>
                <p className="text-xs text-gray-500">Stock actual: <strong>{stockVinculado.stockActual} {stockVinculado.unidad}</strong></p>
              </div>
              <button type="button" onClick={limpiarStock} className="text-gray-400 hover:text-red-500 p-1">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={stockSearch}
                onChange={e => { setStockSearch(e.target.value); setShowStockDropdown(true); }}
                onFocus={() => setShowStockDropdown(true)}
                onBlur={() => setTimeout(() => setShowStockDropdown(false), 150)}
                placeholder="Buscar en stock existente..."
                className={inputCls}
              />
              {showStockDropdown && filteredStock.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredStock.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => seleccionarStock(item)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-800">{item.nombre}</span>
                      <span className="text-xs text-gray-400">{item.stockActual} {item.unidad}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de insumo" error={errors.tipo?.message} required>
          <select {...register('tipo')} className={inputCls}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Sector que solicita" error={errors.sector?.message} required>
          <select {...register('sector')} className={inputCls}>
            {SECTORES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Nombre del artículo" error={errors.articulo?.message} required>
        <input {...register('articulo')} className={inputCls} placeholder="Ej: Pectina cítrica E440" />
      </Field>

      <Field label="Proveedor" error={errors.proveedor?.message} required>
        <input {...register('proveedor')} className={inputCls} placeholder="Nombre de la empresa" />
      </Field>

      <Field label="Descripción / Especificaciones técnicas" error={errors.descripcion?.message} required>
        <textarea {...register('descripcion')} rows={2} className={inputCls} placeholder="Características técnicas del artículo" />
      </Field>

      <Field label="Para qué sirve / Justificación de la compra" error={errors.paraQueSirve?.message} required>
        <textarea {...register('paraQueSirve')} rows={2} className={inputCls} placeholder="Uso en producción y motivo de la compra" />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Cantidad" error={errors.cantidad?.message} required>
          <input type="number" step="any" {...register('cantidad', { valueAsNumber: true })} className={inputCls} />
        </Field>
        <Field label="Unidad" error={errors.unidad?.message} required>
          <select {...register('unidad')} className={inputCls}>
            {UNIDADES.map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <div />
      </div>

      {/* Precio + Moneda + Conversión */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Precio unitario" error={errors.precioUnitario?.message} required>
            <input type="number" step="any" {...register('precioUnitario', { valueAsNumber: true })} className={inputCls} />
          </Field>
          <Field label="Moneda" error={errors.moneda?.message} required>
            <select {...register('moneda')} className={inputCls}>
              <option value="USD">USD — Dólar</option>
              <option value="UYU">UYU — Peso uruguayo</option>
              <option value="ARS">ARS — Peso argentino</option>
            </select>
          </Field>
          {/* Tipo de cambio toggle */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowTC(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
            >
              <ArrowLeftRight size={13} />
              TC: {tcUSDUYU} $/U$S
            </button>
          </div>
        </div>

        {/* Tipo de cambio editable */}
        {showTC && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-xs text-blue-700 font-medium">Tipo de cambio USD → UYU:</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-blue-600">1 USD =</span>
              <input
                type="number"
                step="0.01"
                value={tcUSDUYU}
                onChange={e => setTcUSDUYU(Number(e.target.value))}
                className="w-20 border border-blue-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
              <span className="text-xs text-blue-600">UYU</span>
            </div>
          </div>
        )}

        {/* Conversión en tiempo real */}
        {precio > 0 && (moneda === 'USD' || moneda === 'UYU') && precioConvertido && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#E1F5EE] rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-500 mb-0.5">Precio unitario</p>
              <p className="text-sm font-bold text-[#0F6E56]">{formatMonto(precio, moneda)}</p>
              <p className="text-xs text-gray-400">≈ {formatMonto(precioConvertido.monto, precioConvertido.moneda)}</p>
            </div>
            {total > 0 && totalConvertido && (
              <div className="bg-[#E1F5EE] rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500 mb-0.5">Total estimado</p>
                <p className="text-sm font-bold text-[#0F6E56]">{formatMonto(total, moneda)}</p>
                <p className="text-xs text-gray-400">≈ {formatMonto(totalConvertido.monto, totalConvertido.moneda)}</p>
              </div>
            )}
          </div>
        )}

        {/* Solo total sin conversión (ARS u otro) */}
        {total > 0 && moneda === 'ARS' && (
          <div className="bg-[#E1F5EE] rounded-lg px-3 py-2 text-sm">
            <span className="text-gray-500 text-xs">Total: </span>
            <span className="font-bold text-[#0F6E56]">{formatMonto(total, moneda)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Plazo de pago" error={errors.plazoPaymentDias?.message} required>
          <select {...register('plazoPaymentDias', { valueAsNumber: true })} className={inputCls}>
            {PLAZOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Origen del proveedor" error={errors.origen?.message} required>
          <input {...register('origen')} className={inputCls} placeholder="País / Ciudad" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Válido hasta" error={errors.validezHasta?.message} required>
          <input type="date" {...register('validezHasta')} className={inputCls} />
        </Field>
        <Field label="Cargado por" error={errors.cargadoPor?.message} required>
          <input {...register('cargadoPor')} className={inputCls} />
        </Field>
      </div>

      <Field label="Observaciones" error={errors.observaciones?.message}>
        <textarea {...register('observaciones')} rows={2} className={inputCls} placeholder="Flete, garantía, condiciones especiales..." />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Guardar cotización</Button>
      </div>
    </form>
  );
}

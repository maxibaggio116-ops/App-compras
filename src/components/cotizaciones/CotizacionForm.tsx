import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TipoInsumo, Moneda } from '../../types';
import { Button } from '../ui/Button';
import { formatMonto } from '../../utils/formatters';

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

export function CotizacionForm({ defaultValues, onSubmit, onCancel, loading }: Props) {
  const {
    register, handleSubmit, watch, formState: { errors },
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <div className="grid grid-cols-3 gap-3">
        <Field label="Precio unitario" error={errors.precioUnitario?.message} required>
          <input type="number" step="any" {...register('precioUnitario', { valueAsNumber: true })} className={inputCls} />
        </Field>
        <Field label="Moneda" error={errors.moneda?.message} required>
          <select {...register('moneda')} className={inputCls}>
            <option>USD</option><option>UYU</option><option>ARS</option>
          </select>
        </Field>
        {total > 0 && (
          <div className="flex items-end">
            <div className="w-full bg-[#E1F5EE] rounded-lg px-3 py-2 text-sm">
              <span className="text-gray-500 text-xs">Total: </span>
              <span className="font-bold text-[#0F6E56]">{formatMonto(total, moneda)}</span>
            </div>
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

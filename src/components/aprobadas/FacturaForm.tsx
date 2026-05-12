import React, { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Cotizacion, Factura } from '../../types';
import { Button } from '../ui/Button';
import { formatMonto } from '../../utils/formatters';
import { Upload } from 'lucide-react';

const schema = z.object({
  numero: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  montoTotal: z.number().positive('Debe ser mayor a 0'),
  moneda: z.enum(['USD', 'UYU', 'ARS']),
  observaciones: z.string(),
  registradoPor: z.string().min(2, 'Requerido'),
});

type FacturaFormData = z.infer<typeof schema>;

interface Props {
  cotizacion: Cotizacion;
  usuario: string;
  onSubmit: (factura: Factura) => void;
  onCancel: () => void;
  loading?: boolean;
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] bg-white';

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
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

export function FacturaForm({ cotizacion: c, usuario, onSubmit, onCancel, loading }: Props) {
  const [adjuntoNombre, setAdjuntoNombre] = useState('');
  const [adjuntoBase64, setAdjuntoBase64] = useState('');
  const [tcUSDUYU, setTcUSDUYU] = useState(42);

  const totalEstimado = c.cantidad * c.precioUnitario;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FacturaFormData>({
    resolver: zodResolver(schema) as Resolver<FacturaFormData>,
    defaultValues: {
      montoTotal: totalEstimado,
      moneda: c.moneda,
      registradoPor: usuario,
      observaciones: '',
    },
  });

  const montoIngresado = watch('montoTotal') || 0;
  const monedaIngresada = watch('moneda') as 'USD' | 'UYU' | 'ARS';

  function convertir(monto: number, desde: string) {
    if (desde === 'USD') return { monto: monto * tcUSDUYU, moneda: 'UYU' };
    if (desde === 'UYU') return { monto: monto / tcUSDUYU, moneda: 'USD' };
    return null;
  }

  const montoConvertido = montoIngresado > 0 ? convertir(montoIngresado, monedaIngresada) : null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdjuntoNombre(file.name);
    const reader = new FileReader();
    reader.onload = () => setAdjuntoBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleFormSubmit(data: FacturaFormData) {
    onSubmit({
      ...data,
      adjuntoNombre: adjuntoNombre || undefined,
      adjuntoBase64: adjuntoBase64 || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Resumen cotización */}
      <div className="bg-[#E1F5EE] rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total estimado (cotización):</span>
          <span className="font-bold text-[#0F6E56]">{formatMonto(totalEstimado, c.moneda)}</span>
        </div>
        {(c.moneda === 'USD' || c.moneda === 'UYU') && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Equivalente aprox. (TC {tcUSDUYU} $/U$S):</span>
            <span>
              {c.moneda === 'USD'
                ? formatMonto(totalEstimado * tcUSDUYU, 'UYU')
                : formatMonto(totalEstimado / tcUSDUYU, 'USD')}
            </span>
          </div>
        )}
      </div>

      {/* Tipo de cambio */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
        <span className="text-xs text-blue-700 font-medium whitespace-nowrap">Tipo de cambio:</span>
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

      <div className="grid grid-cols-2 gap-4">
        <Field label="N° de factura" error={errors.numero?.message} required>
          <input {...register('numero')} className={inputCls} placeholder="Ej: A-0001-00001234" />
        </Field>
        <Field label="Fecha de factura" error={errors.fecha?.message} required>
          <input type="date" {...register('fecha')} className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Monto total" error={errors.montoTotal?.message} required>
          <input type="number" step="any" {...register('montoTotal', { valueAsNumber: true })} className={inputCls} />
          {montoConvertido && montoIngresado > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              ≈ {formatMonto(montoConvertido.monto, montoConvertido.moneda as 'USD' | 'UYU')}
            </p>
          )}
        </Field>
        <Field label="Moneda" error={errors.moneda?.message} required>
          <select {...register('moneda')} className={inputCls}>
            <option value="USD">USD — Dólar</option>
            <option value="UYU">UYU — Peso uruguayo</option>
            <option value="ARS">ARS — Peso argentino</option>
          </select>
        </Field>
      </div>

      <Field label="Registrado por" error={errors.registradoPor?.message} required>
        <input {...register('registradoPor')} className={inputCls} />
      </Field>

      <Field label="Adjuntar factura (PDF o imagen)">
        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1D9E75] hover:bg-[#E1F5EE]/30 transition-colors">
          <Upload size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            {adjuntoNombre ? adjuntoNombre : 'Seleccionar archivo...'}
          </span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
        </label>
      </Field>

      <Field label="Observaciones" error={errors.observaciones?.message}>
        <textarea {...register('observaciones')} rows={2} className={inputCls} placeholder="Retención, descuento, condición especial..." />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Registrar factura</Button>
      </div>
    </form>
  );
}

import type { Moneda } from '../types';

export function formatMonto(monto: number, moneda?: Moneda): string {
  const formatted = monto.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (moneda) return `${moneda} ${formatted}`;
  return formatted;
}

export function formatFecha(isoDate: string): string {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatFechaHora(isoDate: string): string {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-UY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function diasRestantes(vencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const v = new Date(vencimiento);
  v.setHours(0, 0, 0, 0);
  return Math.floor((v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDias(fecha: string, dias: number): string {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

export function plazoLabel(dias: number): string {
  if (dias === 0) return 'Contado';
  return `${dias} días`;
}

export function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    insumo: 'Insumo productivo',
    material: 'Material/Envase',
    servicio: 'Servicio',
    maquinaria: 'Maquinaria',
  };
  return map[tipo] ?? tipo;
}

export function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    comprada: 'Comprada',
    pagado: 'Pagado',
    vencido: 'Vencido',
  };
  return map[estado] ?? estado;
}

export type TipoInsumo = 'insumo' | 'material' | 'servicio' | 'maquinaria';
export type EstadoCotizacion = 'pendiente' | 'aprobada' | 'rechazada' | 'comprada';
export type Rol = 'operador' | 'admin';
export type Moneda = 'USD' | 'UYU' | 'ARS';

export interface HistorialEntry {
  fecha: string;
  accion: string;
  usuario: string;
  detalle?: string;
}

export interface Factura {
  numero: string;
  fecha: string;
  montoTotal: number;
  moneda: Moneda;
  adjuntoNombre?: string;
  adjuntoBase64?: string;
  registradoPor: string;
  observaciones: string;
}

export interface Cotizacion {
  id: string;
  tipo: TipoInsumo;
  articulo: string;
  proveedor: string;
  descripcion: string;
  paraQueSirve: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  moneda: Moneda;
  plazoPaymentDias: number;
  origen: string;
  validezHasta: string;
  cargadoPor: string;
  sector: string;
  observaciones: string;
  estado: EstadoCotizacion;
  motivoRechazo?: string;
  creadoEn: string;
  actualizadoEn: string;
  factura?: Factura;
  historial: HistorialEntry[];
}

export interface CuentaCorriente {
  id: string;
  cotizacionId: string;
  proveedor: string;
  concepto: string;
  monto: number;
  moneda: Moneda;
  fechaFactura: string;
  vencimiento: string;
  condicion: string;
  estado: 'pendiente' | 'pagado' | 'vencido';
  alertaEnviada: boolean;
  pagadoEn?: string;
  observaciones: string;
}

export interface MovimientoStock {
  id: string;
  fecha: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'compra';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  usuario: string;
  cotizacionId?: string;
}

export interface StockItem {
  id: string;
  tipo: TipoInsumo;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  precioReferencia: number;
  proveedor?: string;
  ubicacion?: string;
  observaciones?: string;
  actualizadoEn: string;
  historialMovimientos: MovimientoStock[];
}

export interface AppConfig {
  usuarioActual: string;
  rolActual: Rol;
}

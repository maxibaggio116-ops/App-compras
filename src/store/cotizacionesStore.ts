import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cotizacion, Factura, EstadoCotizacion } from '../types';
import { seedCotizaciones } from '../data/seedData';

interface CotizacionesState {
  cotizaciones: Cotizacion[];
  _initialized: boolean;
  init: () => void;
  add: (c: Omit<Cotizacion, 'id' | 'creadoEn' | 'actualizadoEn' | 'historial' | 'estado'>) => Cotizacion;
  update: (id: string, changes: Partial<Cotizacion>, usuario: string) => void;
  remove: (id: string) => void;
  setEstado: (id: string, estado: EstadoCotizacion, usuario: string, detalle?: string) => void;
  registrarFactura: (id: string, factura: Factura, usuario: string) => void;
  revertirFactura: (id: string, usuario: string) => void;
  _snapshot: () => Cotizacion[];
  _restore: (snap: Cotizacion[]) => void;
}

export const useCotizacionesStore = create<CotizacionesState>()(
  persist(
    (set, get) => ({
      cotizaciones: [],
      _initialized: false,

      init() {
        if (!get()._initialized) {
          set({ cotizaciones: seedCotizaciones, _initialized: true });
        }
      },

      add(data) {
        const now = new Date().toISOString();
        const c: Cotizacion = {
          ...data,
          id: `cot-${Date.now()}`,
          estado: 'pendiente',
          creadoEn: now,
          actualizadoEn: now,
          historial: [{ fecha: now, accion: 'Creada', usuario: data.cargadoPor }],
        };
        set(s => ({ cotizaciones: [c, ...s.cotizaciones] }));
        return c;
      },

      update(id, changes, usuario) {
        const now = new Date().toISOString();
        set(s => ({
          cotizaciones: s.cotizaciones.map(c =>
            c.id === id
              ? {
                  ...c,
                  ...changes,
                  actualizadoEn: now,
                  historial: [...c.historial, { fecha: now, accion: 'Modificada', usuario }],
                }
              : c
          ),
        }));
      },

      remove(id) {
        set(s => ({ cotizaciones: s.cotizaciones.filter(c => c.id !== id) }));
      },

      setEstado(id, estado, usuario, detalle) {
        const now = new Date().toISOString();
        const accionMap: Record<EstadoCotizacion, string> = {
          pendiente: 'Vuelta a pendiente',
          aprobada: 'Aprobada',
          rechazada: 'Rechazada',
          comprada: 'Marcada como comprada',
        };
        set(s => ({
          cotizaciones: s.cotizaciones.map(c =>
            c.id === id
              ? {
                  ...c,
                  estado,
                  motivoRechazo: estado === 'rechazada' ? detalle : c.motivoRechazo,
                  actualizadoEn: now,
                  historial: [
                    ...c.historial,
                    { fecha: now, accion: accionMap[estado], usuario, detalle },
                  ],
                }
              : c
          ),
        }));
      },

      registrarFactura(id, factura, usuario) {
        const now = new Date().toISOString();
        set(s => ({
          cotizaciones: s.cotizaciones.map(c =>
            c.id === id
              ? {
                  ...c,
                  estado: 'comprada' as EstadoCotizacion,
                  factura,
                  actualizadoEn: now,
                  historial: [
                    ...c.historial,
                    {
                      fecha: now,
                      accion: 'Facturada',
                      usuario,
                      detalle: `Factura ${factura.numero}`,
                    },
                  ],
                }
              : c
          ),
        }));
      },

      revertirFactura(id, usuario) {
        const now = new Date().toISOString();
        set(s => ({
          cotizaciones: s.cotizaciones.map(c =>
            c.id === id
              ? {
                  ...c,
                  estado: 'aprobada' as EstadoCotizacion,
                  factura: undefined,
                  actualizadoEn: now,
                  historial: [
                    ...c.historial,
                    { fecha: now, accion: 'Facturación revertida', usuario },
                  ],
                }
              : c
          ),
        }));
      },

      _snapshot: () => get().cotizaciones,
      _restore: (snap) => set({ cotizaciones: snap }),
    }),
    {
      name: 'jugos-cotizaciones',
      version: 2,
      migrate: () => ({ cotizaciones: [], _initialized: false }),
    }
  )
);

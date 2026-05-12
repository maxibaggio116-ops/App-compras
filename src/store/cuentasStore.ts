import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CuentaCorriente } from '../types';
import { seedCuentasCorrientes } from '../data/seedData';

interface CuentasState {
  cuentas: CuentaCorriente[];
  _initialized: boolean;
  init: () => void;
  add: (c: Omit<CuentaCorriente, 'id'>) => CuentaCorriente;
  update: (id: string, changes: Partial<CuentaCorriente>) => void;
  remove: (id: string) => void;
  removeByCotizacion: (cotizacionId: string) => void;
  marcarPagado: (id: string, fechaPago: string, obs: string) => void;
  revertirPago: (id: string) => void;
  _snapshot: () => CuentaCorriente[];
  _restore: (snap: CuentaCorriente[]) => void;
}

export const useCuentasStore = create<CuentasState>()(
  persist(
    (set, get) => ({
      cuentas: [],
      _initialized: false,

      init() {
        if (!get()._initialized) {
          set({ cuentas: seedCuentasCorrientes, _initialized: true });
        }
      },

      add(data) {
        const cc: CuentaCorriente = { ...data, id: `cc-${Date.now()}` };
        set(s => ({ cuentas: [cc, ...s.cuentas] }));
        return cc;
      },

      update(id, changes) {
        set(s => ({
          cuentas: s.cuentas.map(c => (c.id === id ? { ...c, ...changes } : c)),
        }));
      },

      remove(id) {
        set(s => ({ cuentas: s.cuentas.filter(c => c.id !== id) }));
      },

      removeByCotizacion(cotizacionId) {
        set(s => ({ cuentas: s.cuentas.filter(c => c.cotizacionId !== cotizacionId) }));
      },

      marcarPagado(id, fechaPago, obs) {
        set(s => ({
          cuentas: s.cuentas.map(c =>
            c.id === id
              ? { ...c, estado: 'pagado' as const, pagadoEn: fechaPago, observaciones: obs || c.observaciones }
              : c
          ),
        }));
      },

      revertirPago(id) {
        set(s => ({
          cuentas: s.cuentas.map(c =>
            c.id === id
              ? { ...c, estado: 'pendiente' as const, pagadoEn: undefined }
              : c
          ),
        }));
      },

      _snapshot: () => get().cuentas,
      _restore: (snap) => set({ cuentas: snap }),
    }),
    { name: 'jugos-cuentas' }
  )
);

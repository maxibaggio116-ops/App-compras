import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockItem, MovimientoStock } from '../types';
import { seedStock } from '../data/seedData';

interface StockState {
  items: StockItem[];
  _initialized: boolean;
  init: () => void;
  add: (item: Omit<StockItem, 'id' | 'actualizadoEn' | 'historialMovimientos'>) => StockItem;
  update: (id: string, changes: Partial<StockItem>) => void;
  remove: (id: string) => void;
  ajustarStock: (id: string, stockNuevo: number, motivo: string, tipo: MovimientoStock['tipo'], usuario: string, cotizacionId?: string) => void;
  findByNombre: (nombre: string) => StockItem | undefined;
  _snapshot: () => StockItem[];
  _restore: (snap: StockItem[]) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      items: [],
      _initialized: false,

      init() {
        if (!get()._initialized) {
          set({ items: seedStock, _initialized: true });
        }
      },

      add(data) {
        const now = new Date().toISOString();
        const item: StockItem = {
          ...data,
          id: `stock-${Date.now()}`,
          actualizadoEn: now,
          historialMovimientos: [],
        };
        set(s => ({ items: [item, ...s.items] }));
        return item;
      },

      update(id, changes) {
        const now = new Date().toISOString();
        set(s => ({
          items: s.items.map(i =>
            i.id === id ? { ...i, ...changes, actualizadoEn: now } : i
          ),
        }));
      },

      remove(id) {
        set(s => ({ items: s.items.filter(i => i.id !== id) }));
      },

      ajustarStock(id, stockNuevo, motivo, tipo, usuario, cotizacionId) {
        const now = new Date().toISOString();
        set(s => ({
          items: s.items.map(i => {
            if (i.id !== id) return i;
            const mov: MovimientoStock = {
              id: `mov-${Date.now()}-${Math.random()}`,
              fecha: now,
              tipo,
              cantidad: Math.abs(stockNuevo - i.stockActual),
              stockAnterior: i.stockActual,
              stockNuevo,
              motivo,
              usuario,
              cotizacionId,
            };
            return {
              ...i,
              stockActual: stockNuevo,
              actualizadoEn: now,
              historialMovimientos: [...i.historialMovimientos, mov],
            };
          }),
        }));
      },

      findByNombre(nombre) {
        const lower = nombre.toLowerCase();
        return get().items.find(i => i.nombre.toLowerCase() === lower);
      },

      _snapshot: () => get().items,
      _restore: (snap) => set({ items: snap }),
    }),
    { name: 'jugos-stock' }
  )
);

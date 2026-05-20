import { create } from 'zustand';
import { db } from '../firebase';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  writeBatch, getDocs,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { StockItem, MovimientoStock } from '../types';

const COL = 'stock';

function fbError(e: unknown) {
  console.error('Firebase error:', e);
  toast.error('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
}

function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

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

export const useStockStore = create<StockState>()((set, get) => ({
  items: [],
  _initialized: false,

  init() {
    if (get()._initialized) return;
    set({ _initialized: true });
    onSnapshot(collection(db, COL), (snap) => {
      const items = snap.docs
        .map(d => d.data() as StockItem)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      set({ items });
    });
  },

  add(data) {
    const now = new Date().toISOString();
    const item: StockItem = {
      ...data,
      id: `stock-${Date.now()}`,
      actualizadoEn: now,
      historialMovimientos: [],
    };
    setDoc(doc(db, COL, item.id), clean(item)).catch(fbError);
    return item;
  },

  update(id, changes) {
    const now = new Date().toISOString();
    const item = get().items.find(i => i.id === id);
    if (!item) return;
    setDoc(doc(db, COL, id), clean({ ...item, ...changes, actualizadoEn: now })).catch(fbError);
  },

  remove(id) {
    deleteDoc(doc(db, COL, id));
  },

  ajustarStock(id, stockNuevo, motivo, tipo, usuario, cotizacionId) {
    const now = new Date().toISOString();
    const item = get().items.find(i => i.id === id);
    if (!item) return;
    const mov: MovimientoStock = {
      id: `mov-${Date.now()}-${Math.random()}`,
      fecha: now,
      tipo,
      cantidad: Math.abs(stockNuevo - item.stockActual),
      stockAnterior: item.stockActual,
      stockNuevo,
      motivo,
      usuario,
      cotizacionId,
    };
    setDoc(doc(db, COL, id), clean({
      ...item,
      stockActual: stockNuevo,
      actualizadoEn: now,
      historialMovimientos: [...item.historialMovimientos, mov],
    })).catch(fbError);
  },

  findByNombre(nombre) {
    const lower = nombre.toLowerCase();
    return get().items.find(i => i.nombre.toLowerCase() === lower);
  },

  _snapshot: () => get().items,

  _restore(snap) {
    getDocs(collection(db, COL)).then(current => {
      const batch = writeBatch(db);
      current.docs.forEach(d => batch.delete(d.ref));
      snap.forEach(item => batch.set(doc(db, COL, item.id), item));
      batch.commit();
    });
  },
}));

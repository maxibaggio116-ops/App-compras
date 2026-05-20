import { create } from 'zustand';
import { db } from '../firebase';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  writeBatch, getDocs, query, where,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { CuentaCorriente } from '../types';

const COL = 'cuentas';

function fbError(e: unknown) {
  console.error('Firebase error:', e);
  toast.error('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
}

function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

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

export const useCuentasStore = create<CuentasState>()((set, get) => ({
  cuentas: [],
  _initialized: false,

  init() {
    if (get()._initialized) return;
    set({ _initialized: true });
    onSnapshot(collection(db, COL), (snap) => {
      const cuentas = snap.docs
        .map(d => d.data() as CuentaCorriente)
        .sort((a, b) => b.fechaFactura.localeCompare(a.fechaFactura));
      set({ cuentas });
    });
  },

  add(data) {
    const cc: CuentaCorriente = { ...data, id: `cc-${Date.now()}` };
    setDoc(doc(db, COL, cc.id), clean(cc)).catch(fbError);
    return cc;
  },

  update(id, changes) {
    const c = get().cuentas.find(c => c.id === id);
    if (!c) return;
    setDoc(doc(db, COL, id), clean({ ...c, ...changes })).catch(fbError);
  },

  remove(id) {
    deleteDoc(doc(db, COL, id));
  },

  removeByCotizacion(cotizacionId) {
    get().cuentas
      .filter(c => c.cotizacionId === cotizacionId)
      .forEach(c => deleteDoc(doc(db, COL, c.id)));
  },

  marcarPagado(id, fechaPago, obs) {
    const c = get().cuentas.find(c => c.id === id);
    if (!c) return;
    setDoc(doc(db, COL, id), clean({
      ...c,
      estado: 'pagado' as const,
      pagadoEn: fechaPago,
      observaciones: obs || c.observaciones,
    })).catch(fbError);
  },

  revertirPago(id) {
    const c = get().cuentas.find(c => c.id === id);
    if (!c) return;
    const { pagadoEn: _p, ...rest } = c;
    setDoc(doc(db, COL, id), clean({ ...rest, estado: 'pendiente' as const })).catch(fbError);
  },

  _snapshot: () => get().cuentas,

  _restore(snap) {
    getDocs(collection(db, COL)).then(current => {
      const batch = writeBatch(db);
      current.docs.forEach(d => batch.delete(d.ref));
      snap.forEach(c => batch.set(doc(db, COL, c.id), c));
      batch.commit();
    });
  },
}));

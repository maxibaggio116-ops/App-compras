import { create } from 'zustand';
import { db } from '../firebase';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  writeBatch, getDocs,
} from 'firebase/firestore';
import type { Cotizacion, Factura, EstadoCotizacion } from '../types';

const COL = 'cotizaciones';

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

export const useCotizacionesStore = create<CotizacionesState>()((set, get) => ({
  cotizaciones: [],
  _initialized: false,

  init() {
    if (get()._initialized) return;
    set({ _initialized: true });
    onSnapshot(collection(db, COL), (snap) => {
      const cotizaciones = snap.docs
        .map(d => d.data() as Cotizacion)
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
      set({ cotizaciones });
    });
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
    setDoc(doc(db, COL, c.id), c);
    return c;
  },

  update(id, changes, usuario) {
    const now = new Date().toISOString();
    const c = get().cotizaciones.find(c => c.id === id);
    if (!c) return;
    const updated = {
      ...c, ...changes,
      actualizadoEn: now,
      historial: [...c.historial, { fecha: now, accion: 'Modificada', usuario }],
    };
    setDoc(doc(db, COL, id), updated);
  },

  remove(id) {
    deleteDoc(doc(db, COL, id));
  },

  setEstado(id, estado, usuario, detalle) {
    const now = new Date().toISOString();
    const accionMap: Record<EstadoCotizacion, string> = {
      pendiente: 'Vuelta a pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      comprada: 'Marcada como comprada',
    };
    const c = get().cotizaciones.find(c => c.id === id);
    if (!c) return;
    const updated = {
      ...c,
      estado,
      motivoRechazo: estado === 'rechazada' ? detalle : c.motivoRechazo,
      actualizadoEn: now,
      historial: [...c.historial, { fecha: now, accion: accionMap[estado], usuario, detalle }],
    };
    setDoc(doc(db, COL, id), updated);
  },

  registrarFactura(id, factura, usuario) {
    const now = new Date().toISOString();
    const c = get().cotizaciones.find(c => c.id === id);
    if (!c) return;
    const updated = {
      ...c,
      estado: 'comprada' as EstadoCotizacion,
      factura,
      actualizadoEn: now,
      historial: [...c.historial, { fecha: now, accion: 'Facturada', usuario, detalle: `Factura ${factura.numero}` }],
    };
    setDoc(doc(db, COL, id), updated);
  },

  revertirFactura(id, usuario) {
    const now = new Date().toISOString();
    const c = get().cotizaciones.find(c => c.id === id);
    if (!c) return;
    const { factura: _f, ...rest } = c;
    const updated = {
      ...rest,
      estado: 'aprobada' as EstadoCotizacion,
      actualizadoEn: now,
      historial: [...c.historial, { fecha: now, accion: 'Facturación revertida', usuario }],
    };
    setDoc(doc(db, COL, id), updated);
  },

  _snapshot: () => get().cotizaciones,

  _restore(snap) {
    getDocs(collection(db, COL)).then(current => {
      const batch = writeBatch(db);
      current.docs.forEach(d => batch.delete(d.ref));
      snap.forEach(c => batch.set(doc(db, COL, c.id), c));
      batch.commit();
    });
  },
}));

import React, { createContext, useContext, useState } from 'react';
import type { Rol } from '../types';

export interface Usuario {
  id: string;
  nombre: string;
  cargo: string;
  sector: string;
  rol: Rol;
  iniciales: string;
  color: string;
}

export const USUARIOS: Usuario[] = [
  {
    id: 'saray',
    nombre: 'Saray de la Peña',
    cargo: 'Bromatóloga',
    sector: 'Calidad',
    rol: 'operador',
    iniciales: 'SP',
    color: 'bg-purple-500',
  },
  {
    id: 'alexander',
    nombre: 'Alexander Bellusci',
    cargo: 'Jefe de Planta',
    sector: 'Producción',
    rol: 'operador',
    iniciales: 'AB',
    color: 'bg-blue-500',
  },
  {
    id: 'patricio',
    nombre: 'Patricio Lasarte',
    cargo: 'Administrativo',
    sector: 'Administración',
    rol: 'operador',
    iniciales: 'PL',
    color: 'bg-orange-500',
  },
  {
    id: 'ignacio',
    nombre: 'Ignacio Pomi',
    cargo: 'Administrativo',
    sector: 'Administración',
    rol: 'operador',
    iniciales: 'IP',
    color: 'bg-teal-500',
  },
  {
    id: 'admin',
    nombre: 'Administrador',
    cargo: 'Administrador del Sistema',
    sector: 'Administración',
    rol: 'admin',
    iniciales: 'AD',
    color: 'bg-[#1D9E75]',
  },
];

interface RolContextType {
  usuarioActual: Usuario;
  setUsuarioById: (id: string) => void;
  rol: Rol;
  usuario: string;
  isAdmin: boolean;
}

const RolContext = createContext<RolContextType>({
  usuarioActual: USUARIOS[0],
  setUsuarioById: () => {},
  rol: 'operador',
  usuario: USUARIOS[0].nombre,
  isAdmin: false,
});

export function RolProvider({ children }: { children: React.ReactNode }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario>(USUARIOS[0]);

  function setUsuarioById(id: string) {
    const u = USUARIOS.find(u => u.id === id);
    if (u) setUsuarioActual(u);
  }

  return (
    <RolContext.Provider value={{
      usuarioActual,
      setUsuarioById,
      rol: usuarioActual.rol,
      usuario: usuarioActual.nombre,
      isAdmin: usuarioActual.rol === 'admin',
    }}>
      {children}
    </RolContext.Provider>
  );
}

export const useRol = () => useContext(RolContext);

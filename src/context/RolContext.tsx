import React, { createContext, useContext, useState } from 'react';
import type { Rol } from '../types';

interface RolContextType {
  rol: Rol;
  usuario: string;
  setRol: (r: Rol) => void;
  isAdmin: boolean;
}

const RolContext = createContext<RolContextType>({
  rol: 'operador',
  usuario: 'Ana Pereyra',
  setRol: () => {},
  isAdmin: false,
});

const USUARIOS: Record<Rol, string> = {
  operador: 'Ana Pereyra',
  admin: 'Admin',
};

export function RolProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRolState] = useState<Rol>('operador');

  const setRol = (r: Rol) => setRolState(r);
  const usuario = USUARIOS[rol];
  const isAdmin = rol === 'admin';

  return (
    <RolContext.Provider value={{ rol, usuario, setRol, isAdmin }}>
      {children}
    </RolContext.Provider>
  );
}

export const useRol = () => useContext(RolContext);

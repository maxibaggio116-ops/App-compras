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
  email: string;
  password: string;
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
    email: 'saray@jugos.com.uy',
    password: 'saray1234',
  },
  {
    id: 'alexander',
    nombre: 'Alexander Bellusci',
    cargo: 'Jefe de Planta',
    sector: 'Producción',
    rol: 'operador',
    iniciales: 'AB',
    color: 'bg-blue-500',
    email: 'alexander@jugos.com.uy',
    password: 'alexander1234',
  },
  {
    id: 'patricio',
    nombre: 'Patricio Lasarte',
    cargo: 'Administrativo',
    sector: 'Administración',
    rol: 'operador',
    iniciales: 'PL',
    color: 'bg-orange-500',
    email: 'patricio@jugos.com.uy',
    password: 'patricio1234',
  },
  {
    id: 'ignacio',
    nombre: 'Ignacio Pomi',
    cargo: 'Administrativo',
    sector: 'Administración',
    rol: 'operador',
    iniciales: 'IP',
    color: 'bg-teal-500',
    email: 'ignacio@jugos.com.uy',
    password: 'ignacio1234',
  },
  {
    id: 'admin',
    nombre: 'Administrador',
    cargo: 'Administrador del Sistema',
    sector: 'Administración',
    rol: 'admin',
    iniciales: 'AD',
    color: 'bg-[#1D9E75]',
    email: 'admin@jugos.com.uy',
    password: 'admin1234',
  },
];

interface AuthContextType {
  usuarioActual: Usuario | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  rol: Rol;
  usuario: string;
}

const AuthContext = createContext<AuthContextType>({
  usuarioActual: null,
  login: () => false,
  logout: () => {},
  isAdmin: false,
  rol: 'operador',
  usuario: '',
});

const SESSION_KEY = 'jugos-session';

export function RolProvider({ children }: { children: React.ReactNode }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const u = USUARIOS.find(u => u.id === saved);
    return u ?? null;
  });

  function login(email: string, password: string): boolean {
    const u = USUARIOS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!u) return false;
    setUsuarioActual(u);
    localStorage.setItem(SESSION_KEY, u.id);
    return true;
  }

  function logout() {
    setUsuarioActual(null);
    localStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{
      usuarioActual,
      login,
      logout,
      isAdmin: usuarioActual?.rol === 'admin',
      rol: usuarioActual?.rol ?? 'operador',
      usuario: usuarioActual?.nombre ?? '',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useRol = () => useContext(AuthContext);

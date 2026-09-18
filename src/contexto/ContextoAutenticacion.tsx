import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario, PeticionLogin, PeticionRegistroPaciente } from '../esquemas/tiposApi';
import { servicioAutenticacion } from '../servicios/servicioAutenticacion';

interface InterfazContextoAutenticacion {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (credenciales: PeticionLogin) => Promise<void>;
  registrarsePaciente: (datos: PeticionRegistroPaciente) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  actualizarFotoPerfil: (nuevaFotoUrl: string) => void;
}

const ContextoAutenticacion = createContext<InterfazContextoAutenticacion | undefined>(undefined);

export const ProveedorAutenticacion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => servicioAutenticacion.obtenerUsuarioActual());
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    const manejarDesautorizado = () => {
      setUsuario(null);
    };
    window.addEventListener('auth:unauthorized', manejarDesautorizado);
    return () => window.removeEventListener('auth:unauthorized', manejarDesautorizado);
  }, []);

  const iniciarSesion = async (credenciales: PeticionLogin) => {
    setCargando(true);
    try {
      const respuesta = await servicioAutenticacion.iniciarSesion(credenciales);
      setUsuario(respuesta.user);
    } finally {
      setCargando(false);
    }
  };

  const registrarsePaciente = async (datos: PeticionRegistroPaciente) => {
    setCargando(true);
    try {
      const respuesta = await servicioAutenticacion.registrarPaciente(datos);
      setUsuario(respuesta.user);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    setCargando(true);
    try {
      await servicioAutenticacion.cerrarSesion();
    } finally {
      setUsuario(null);
      setCargando(false);
    }
  };

  const actualizarFotoPerfil = (nuevaFotoUrl: string) => {
    if (usuario) {
      const usuarioActualizado = servicioAutenticacion.actualizarFotoPerfil(usuario, nuevaFotoUrl);
      setUsuario(usuarioActualizado);
    }
  };

  return (
    <ContextoAutenticacion.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        registrarsePaciente,
        cerrarSesion,
        actualizarFotoPerfil,
      }}
    >
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export function useAutenticacion(): InterfazContextoAutenticacion {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('useAutenticacion debe usarse dentro de un ProveedorAutenticacion');
  }
  return contexto;
}

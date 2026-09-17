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
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const usuarioActual = servicioAutenticacion.obtenerUsuarioActual();
    if (usuarioActual) {
      setUsuario(usuarioActual);
    }
    setCargando(false);
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
      setUsuario(null);
    } finally {
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

export const usoAutenticacion = (): InterfazContextoAutenticacion => {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('usoAutenticacion debe usarse dentro de un ProveedorAutenticacion');
  }
  return contexto;
};

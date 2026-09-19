import React from 'react';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import type { Usuario } from '../../esquemas/tiposApi';

interface PropiedadesEncabezadoSuperior {
  usuario: Usuario | null;
  alAlternarBarraLateral?: () => void;
  alAbrirNotificaciones?: () => void;
}

/** Calcula las iniciales reales del usuario (primera letra nombre + primera letra apellido) */
function obtenerIniciales(usuario: Usuario | null): string {
  if (usuario?.person?.firstName && usuario?.person?.lastName) {
    return `${usuario.person.firstName[0]}${usuario.person.lastName[0]}`.toUpperCase();
  }
  if (usuario?.person?.firstName) {
    return usuario.person.firstName.substring(0, 2).toUpperCase();
  }
  if (usuario?.email) {
    return usuario.email[0].toUpperCase();
  }
  return 'U';
}

export const EncabezadoSuperior: React.FC<PropiedadesEncabezadoSuperior> = ({
  usuario,
  alAlternarBarraLateral,
  alAbrirNotificaciones,
}) => {
  const nombreCompleto = usuario?.person?.firstName && usuario?.person?.lastName
    ? `${usuario.person.firstName} ${usuario.person.lastName}`
    : usuario?.person?.firstName
    ? usuario.person.firstName
    : usuario?.email || 'Usuario';

  const rolTexto = usuario?.role === 'ADMIN'
    ? 'Administrador'
    : usuario?.role === 'PATIENT'
    ? 'Paciente'
    : 'Staff / Profesional';

  const iniciales = obtenerIniciales(usuario);

  return (
    <header className="bg-[#f8f7f4] border-b border-[#e8e6df] h-16 px-6 flex items-center justify-between sticky top-0 z-20">
      
      {/* BOTON DE MENU HAMBURGUESA (IZQUIERDA) */}
      <button
        onClick={alAlternarBarraLateral}
        className="p-2 rounded-xl text-[#4a5568] hover:bg-[#eae7df] hover:text-[#1a202c] transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* ICONO DE NOTIFICACIONES + DATOS PERSONA + AVATAR (DERECHA) */}
      <div className="flex items-center gap-4">
        
        {/* NOTIFICACIONES CON BADGE VERDE */}
        <button
          onClick={alAbrirNotificaciones}
          className="relative p-2 rounded-xl text-[#4a5568] hover:bg-[#eae7df] transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5 text-[#4a5568]" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#598b76] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#f8f7f4]">
            2
          </span>
        </button>

        {/* SEPARADOR VERTICAL */}
        <div className="w-px h-8 bg-[#e8e6df]" />

        {/* DATOS DE LA PERSONA LOGUEADA + FOTO/INICIALES */}
        <div className="flex items-center gap-3 cursor-pointer group">
          
          {/* NOMBRE Y ROL */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#2d3748] leading-tight">{nombreCompleto}</p>
            <p className="text-[11px] text-[#718096] font-medium leading-tight">{rolTexto}</p>
          </div>

          {/* FOTO DE PERFIL O INICIALES DINÁMICAS */}
          <div className="relative">
            {usuario?.fotoPerfilUrl ? (
              <img
                src={usuario.fotoPerfilUrl}
                alt={nombreCompleto}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#598b76]/30 shadow-sm group-hover:border-[#598b76] transition-colors"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#598b76] text-white font-bold flex items-center justify-center border-2 border-[#598b76]/30 shadow-sm text-sm group-hover:bg-[#487361] transition-colors">
                {iniciales}
              </div>
            )}
            {/* INDICADOR ONLINE */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#f8f7f4] rounded-full" />
          </div>

          <ChevronDown className="w-4 h-4 text-[#718096] hidden sm:block" />
        </div>
      </div>
    </header>
  );
};

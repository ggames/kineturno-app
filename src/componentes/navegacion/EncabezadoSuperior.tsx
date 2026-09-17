import React from 'react';
import { Menu, Bell } from 'lucide-react';
import type { Usuario } from '../../esquemas/tiposApi';

interface PropiedadesEncabezadoSuperior {
  usuario: Usuario | null;
  alAlternarBarraLateral?: () => void;
  alAbrirNotificaciones?: () => void;
}

export const EncabezadoSuperior: React.FC<PropiedadesEncabezadoSuperior> = ({
  usuario,
  alAlternarBarraLateral,
  alAbrirNotificaciones,
}) => {
  const nombreUsuario = usuario?.person
    ? `${usuario.person.firstName} ${usuario.person.lastName}`
    : 'Dr. Martín López';

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

      {/* ICONO DE NOTIFICACIONES Y FOTO DE PERFIL (DERECHA) */}
      <div className="flex items-center gap-4">
        
        {/* NOTIFICACIONES CON BADGE VERDE (COMO EN LA IMAGEN) */}
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

        {/* FOTO DE PERFIL CIRCULAR DE LA IMAGEN DE REFERENCIA */}
        <div className="relative cursor-pointer">
          {usuario?.fotoPerfilUrl ? (
            <img
              src={usuario.fotoPerfilUrl}
              alt={nombreUsuario}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#598b76] text-white font-bold flex items-center justify-center border-2 border-white shadow-xs text-sm">
              ML
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

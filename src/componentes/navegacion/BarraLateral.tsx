import React from 'react';
import { 
  Home, 
  Calendar, 
  Clock, 
  Users, 
  UserCheck, 
  Stethoscope, 
  BarChart3, 
  Settings, 
  User, 
  HelpCircle,
  Sprout,
  LogOut
} from 'lucide-react';
import type { Usuario } from '../../esquemas/tiposApi';

import { Link, NavLink, useLocation } from 'react-router-dom';

interface PropiedadesBarraLateral {
  usuario: Usuario | null;
  alCerrarSesion: () => void;
}

/** Calcula las iniciales reales: primera letra del nombre + primera letra del apellido */
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

export const BarraLateral: React.FC<PropiedadesBarraLateral> = ({
  usuario,
  alCerrarSesion,
}) => {
  const location = useLocation();

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

  const itemsMenu = [
    { id: 'inicio', etiqueta: 'Inicio', icono: Home },
    { id: 'turnos', etiqueta: 'Turnos', icono: Calendar },
    { id: 'pacientes', etiqueta: 'Pacientes', icono: Users },
    { id: 'agenda', etiqueta: 'Agenda', icono: Clock },
    { id: 'configuracion-horarios', etiqueta: 'Horarios de Atención', icono: Clock },
    { id: 'profesionales', etiqueta: 'Profesionales', icono: UserCheck },
    { id: 'servicios', etiqueta: 'Servicios', icono: Stethoscope },
    { id: 'reportes', etiqueta: 'Reportes', icono: BarChart3 },
    { id: 'feriados', etiqueta: 'Feriados y Asuetos', icono: Calendar },
    { id: 'perfil', etiqueta: 'Perfil', icono: User },
    { id: 'configuracion', etiqueta: 'Configuración', icono: Settings },
    { id: 'ayuda', etiqueta: 'Ayuda', icono: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-[#f8f7f4] border-r border-[#e8e6df] flex flex-col justify-between h-screen sticky top-0 select-none z-30 shrink-0">
      
      {/* SECCION SUPERIOR: LOGO Y NAVEGACION */}
      <div className="p-5 space-y-6 overflow-y-auto">
        
        {/* LOGO KINETURNOS */}
        <Link 
          to="/"
          className="flex items-center gap-3 cursor-pointer group px-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#598b76] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#2d3748] tracking-tight leading-none flex items-center gap-1">
              Kine<span className="text-[#598b76]">Turnos</span>
            </h1>
            <p className="text-[11px] text-[#718096] font-medium mt-1 leading-none">
              Gestión de turnos
            </p>
          </div>
        </Link>

        {/* LISTA DE MENU VERTICAL */}
        <nav className="space-y-1.5 pt-2">
          {itemsMenu.map((item) => {
            const Icono = item.icono;
            const ruta = item.id === 'inicio' ? '/' : `/${item.id}`;
            const esActivo = location.pathname === ruta || (item.id === 'inicio' && location.pathname === '');

            return (
              <NavLink
                key={item.id}
                to={ruta}
                className={({ isActive }) => `w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive || esActivo
                    ? 'bg-[#598b76] text-white shadow-md shadow-[#598b76]/20'
                    : 'text-[#4a5568] hover:bg-[#eae7df] hover:text-[#1a202c]'
                }`}
              >
                <Icono className={`w-5 h-5 ${esActivo ? 'text-white' : 'text-[#718096]'}`} />
                <span>{item.etiqueta}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* SECCION INFERIOR: DATOS PERSONA LOGUEADA + BOTON CERRAR SESION */}
      <div className="p-4 border-t border-[#e8e6df] bg-[#f3f1ea]/60 space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/80 border border-[#e8e6df]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* FOTO DE PERFIL O INICIALES REALES */}
            <div className="relative shrink-0">
              {usuario?.fotoPerfilUrl ? (
                <img
                  src={usuario.fotoPerfilUrl}
                  alt={nombreCompleto}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#598b76]/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#598b76] text-white flex items-center justify-center font-bold text-sm">
                  {iniciales}
                </div>
              )}
              {/* INDICADOR ONLINE */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>

            {/* NOMBRE COMPLETO, EMAIL Y ROL */}
            <div className="text-left overflow-hidden min-w-0">
              <p className="text-xs font-bold text-[#2d3748] truncate">{nombreCompleto}</p>
              <p className="text-[10px] text-[#718096] font-medium truncate">{usuario?.email}</p>
              <p className="text-[9px] text-[#598b76] font-semibold uppercase tracking-wide">{rolTexto}</p>
            </div>
          </div>

          {/* BOTON CERRAR SESION CON TOOLTIP */}
          <button
            onClick={alCerrarSesion}
            title={`Cerrar sesión de ${nombreCompleto}`}
            className="p-2 rounded-xl text-[#e53e3e] hover:bg-rose-50 hover:text-[#c53030] transition-all shrink-0 ml-1"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

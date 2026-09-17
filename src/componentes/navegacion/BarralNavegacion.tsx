import React from 'react';
import { usoAutenticacion } from '../../contexto/ContextoAutenticacion';
import { Calendar, UserCheck, Users, LogOut, Activity } from 'lucide-react';

interface PropiedadesBarralNavegacion {
  pantallaActiva: string;
  alCambiarPantalla: (pantalla: string) => void;
}

export const BarralNavegacion: React.FC<PropiedadesBarralNavegacion> = ({
  pantallaActiva,
  alCambiarPantalla,
}) => {
  const { usuario, cerrarSesion } = usoAutenticacion();

  if (!usuario) return null;

  const esAdmin = usuario.role === 'ADMIN';
  const esStaff = usuario.role === 'STAFF' || usuario.role === 'PROFESSIONAL';
  const esPaciente = usuario.role === 'PATIENT';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-beige-borde shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <div 
          onClick={() => alCambiarPantalla(esPaciente ? 'kineturnos-paciente' : 'gestion-turnos')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-verde-principal to-emerald-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                Kine<span className="text-verde-principal">Turnos</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-madera-suave text-madera-700 border border-madera/30">
                {esAdmin ? 'Administrador' : esStaff ? 'Staff Profesional' : 'App Paciente'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">Centro Kinesiológico Integral</p>
          </div>
        </div>

        {/* NAVEGACION POR ROL */}
        <nav className="hidden md:flex items-center gap-1 bg-beige-100/70 p-1.5 rounded-2xl border border-beige-200">
          {esPaciente && (
            <button
              onClick={() => alCambiarPantalla('kineturnos-paciente')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                pantallaActiva === 'kineturnos-paciente'
                  ? 'bg-white text-verde-principal shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              KineTurnos
            </button>
          )}

          {(esStaff || esAdmin) && (
            <button
              onClick={() => alCambiarPantalla('gestion-turnos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                pantallaActiva === 'gestion-turnos'
                  ? 'bg-white text-verde-principal shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Control de Turnos
            </button>
          )}

          {(esStaff || esAdmin) && (
            <button
              onClick={() => alCambiarPantalla('registro-profesionales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                pantallaActiva === 'registro-profesionales'
                  ? 'bg-white text-verde-principal shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Alta de Kinesiólogos
            </button>
          )}

          {esAdmin && (
            <button
              onClick={() => alCambiarPantalla('administracion-usuarios')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                pantallaActiva === 'administracion-usuarios'
                  ? 'bg-white text-verde-principal shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios y Claves
            </button>
          )}
        </nav>

        {/* SECCION USUARIO & MI PERFIL */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => alCambiarPantalla('perfil-seguridad')}
            className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border transition-all ${
              pantallaActiva === 'perfil-seguridad'
                ? 'border-verde-principal bg-verde-suave'
                : 'border-beige-200 hover:border-madera-500 bg-white'
            }`}
          >
            {usuario.fotoPerfilUrl ? (
              <img
                src={usuario.fotoPerfilUrl}
                alt="Foto de perfil"
                className="w-9 h-9 rounded-xl object-cover border border-emerald-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-madera-suave text-madera-700 flex items-center justify-center font-bold text-sm">
                {usuario.person?.firstName ? usuario.person.firstName[0] : usuario.email[0].toUpperCase()}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {usuario.person ? `${usuario.person.firstName} ${usuario.person.lastName}` : usuario.email.split('@')[0]}
              </p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">
                {usuario.email}
              </p>
            </div>
          </button>

          <button
            onClick={cerrarSesion}
            title="Cerrar sesión"
            className="p-2.5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

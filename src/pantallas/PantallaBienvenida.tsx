import React from 'react';
import { Activity, Calendar, ShieldCheck, HeartPulse, Clock, Sparkles } from 'lucide-react';

interface PropiedadesPantallaBienvenida {
  alIngresar: () => void;
  alRegistrarse: () => void;
}

export const PantallaBienvenida: React.FC<PropiedadesPantallaBienvenida> = ({
  alIngresar,
  alRegistrarse,
}) => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between bg-gradient-to-b from-beige-fondo via-beige-100/50 to-beige-fondo px-4 sm:px-6 py-12">
      <div className="max-w-5xl mx-auto w-full text-center space-y-8 my-auto">
        
        {/* INSIGNIA SUPERIOR */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-verde-suave border border-emerald-200 text-verde-principal text-sm font-semibold shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Sistema Kinesiológico Integral en Argentina</span>
        </div>

        {/* TITULO PRINCIPAL CON VOSEO */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Gestioná tus sesiones y turnos de <span className="text-verde-principal underline decoration-madera-500/40">kinesiología</span> sin esperas
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Reservá tu turno kinesiológico con tu kinesiólogo de confianza, organizá tus tratamientos y consultá tu cobertura de obra social en segundos.
          </p>
        </div>

        {/* BOTONES DE ACCION */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={alIngresar}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-verde-principal hover:bg-emerald-700 text-white font-bold text-lg shadow-xl shadow-teal-700/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Calendar className="w-5 h-5" />
            Ingresá a tu cuenta
          </button>
          
          <button
            onClick={alRegistrarse}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-beige-100 text-madera-700 font-bold text-lg border-2 border-madera-500/30 shadow-md hover:border-madera-500 transition-all flex items-center justify-center gap-3"
          >
            <HeartPulse className="w-5 h-5 text-madera-700" />
            Registrate como Paciente
          </button>
        </div>

        {/* TARJETAS DE CARACTERISTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-verde-suave text-verde-principal flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Agendamiento Inmediato</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Elegí día y horario disponible con confirmación al instante para tus sesiones de rehabilitación.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-madera-suave text-madera-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Obras Sociales y Prepagas</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Integración total con las principales coberturas médicas para autorizar y registrar tu tratamiento.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Seguimiento de Tratamiento</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Llevá el control de tus sesiones indicadas por tu kinesiólogo e historia clínica actualizada.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-500 pt-8 border-t border-beige-200 max-w-5xl mx-auto w-full">
        © 2026 KineTurnos Argentina. Todos los derechos reservados.
      </footer>
    </div>
  );
};

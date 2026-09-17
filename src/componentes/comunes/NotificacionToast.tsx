import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type TipoNotificacion = 'exito' | 'error' | 'advertencia' | 'info';

export interface MensajeToast {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
}

interface PropiedadesNotificacionToast {
  notificaciones: MensajeToast[];
  alCerrar: (id: string) => void;
}

export const NotificacionToast: React.FC<PropiedadesNotificacionToast> = ({
  notificaciones,
  alCerrar,
}) => {
  if (notificaciones.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto">
      {notificaciones.map((n) => {
        let colorBorde = 'border-l-4 border-emerald-500';
        let bgIcono = 'bg-emerald-100 text-emerald-700';
        let Icono = CheckCircle2;

        if (n.tipo === 'error') {
          colorBorde = 'border-l-4 border-rose-500';
          bgIcono = 'bg-rose-100 text-rose-700';
          Icono = XCircle;
        } else if (n.tipo === 'advertencia') {
          colorBorde = 'border-l-4 border-amber-500';
          bgIcono = 'bg-amber-100 text-amber-700';
          Icono = AlertTriangle;
        } else if (n.tipo === 'info') {
          colorBorde = 'border-l-4 border-sky-500';
          bgIcono = 'bg-sky-100 text-sky-700';
          Icono = Info;
        }

        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-4 bg-white rounded-xl shadow-lg border border-gray-100 ${colorBorde} animacion-fade-in transition-all duration-200`}
          >
            <div className={`p-2 rounded-lg ${bgIcono}`}>
              <Icono className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 leading-tight">{n.titulo}</h4>
              <p className="text-xs text-gray-600 mt-1 leading-snug">{n.mensaje}</p>
            </div>
            <button
              onClick={() => alCerrar(n.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

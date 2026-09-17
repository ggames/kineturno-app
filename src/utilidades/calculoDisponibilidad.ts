export type EstadoBadgeColor = 'VERDE' | 'AMARILLO' | 'ROJO' | 'BLOQUEADO' | 'FINALIZADO';

export interface BloqueHoraSlot {
  slotBDId?: string;
  horaInicio: string; // "08:00"
  horaFin: string; // "09:00"
  rangoTexto: string; // "08:00 - 09:00 hs"
  maxCapacity: number;
  currentBookings: number;
  disponiblesCount: number;
  bloqueado: boolean;
  vencido?: boolean;
  motivoBloqueo?: string;
  pacientesNombres?: string[];
}

export interface ConfiguracionColorBadge {
  estadoColor: EstadoBadgeColor;
  claseContenedorBadge: string;
  claseTextoBadge: string;
  claseBordeBadge: string;
  claseIconoBadge: string;
  etiquetaBadge: string;
  claseBotonAccion: string;
}

/**
 * Determina el código de color dinámico y estilos para el badge del slot:
 * - Verde: Cuando hay más de 4 turnos disponibles (> 4).
 * - Amarillo: Cuando hay entre 2 y 4 turnos disponibles (2 a 4).
 * - Rojo: Cuando queda 1 o 0 turnos disponibles (o estado crítico).
 * - Bloqueado: Cuando el slot está bloqueado por feriado o fin de semana.
 * - Finalizado: Cuando el horario del slot ya transcurrió en el día de la fecha.
 */
export const obtenerConfiguracionColorBadge = (
  disponiblesCount: number,
  maxCapacity: number,
  bloqueado: boolean = false,
  vencido: boolean = false
): ConfiguracionColorBadge => {
  if (vencido) {
    return {
      estadoColor: 'FINALIZADO',
      claseContenedorBadge: 'bg-purple-950/60 text-purple-300 border-purple-800/80',
      claseTextoBadge: 'text-purple-300',
      claseBordeBadge: 'border-purple-800',
      claseIconoBadge: 'text-purple-400',
      etiquetaBadge: 'Turno Finalizado',
      claseBotonAccion: 'bg-purple-950/40 text-purple-400/60 border-purple-900/50 cursor-not-allowed opacity-60',
    };
  }

  if (bloqueado) {
    return {
      estadoColor: 'BLOQUEADO',
      claseContenedorBadge: 'bg-gray-800/80 text-gray-400 border-gray-700/80',
      claseTextoBadge: 'text-gray-400',
      claseBordeBadge: 'border-gray-700',
      claseIconoBadge: 'text-gray-500',
      etiquetaBadge: 'Sin Turnos disponibles',
      claseBotonAccion: 'bg-gray-800 text-gray-500 border-gray-700/60 cursor-not-allowed opacity-60',
    };
  }

  if (disponiblesCount <= 0) {
    return {
      estadoColor: 'ROJO',
      claseContenedorBadge: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
      claseTextoBadge: 'text-rose-300',
      claseBordeBadge: 'border-rose-800',
      claseIconoBadge: 'text-rose-400',
      etiquetaBadge: 'Sin Turnos disponibles',
      claseBotonAccion: 'bg-rose-950/40 text-rose-400/60 border-rose-900/50 cursor-not-allowed opacity-60',
    };
  }

  // Si toda la capacidad del slot está libre (ej: 1 de 1 o 5 de 5) -> VERDE
  if (disponiblesCount === maxCapacity) {
    return {
      estadoColor: 'VERDE',
      claseContenedorBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      claseTextoBadge: 'text-emerald-300',
      claseBordeBadge: 'border-emerald-500/40',
      claseIconoBadge: 'text-emerald-400',
      etiquetaBadge: `${disponiblesCount} de ${maxCapacity} disponible${maxCapacity > 1 ? 's' : ''}`,
      claseBotonAccion: 'bg-[#10b981] hover:bg-[#059669] text-white shadow-emerald-900/30',
    };
  }

  if (disponiblesCount === 1) {
    return {
      estadoColor: 'ROJO',
      claseContenedorBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      claseTextoBadge: 'text-rose-300',
      claseBordeBadge: 'border-rose-500/40',
      claseIconoBadge: 'text-rose-400',
      etiquetaBadge: `1 de ${maxCapacity} disponible`,
      claseBotonAccion: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30',
    };
  }

  if (disponiblesCount >= 2 && disponiblesCount <= 4) {
    return {
      estadoColor: 'AMARILLO',
      claseContenedorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      claseTextoBadge: 'text-amber-300',
      claseBordeBadge: 'border-amber-500/40',
      claseIconoBadge: 'text-amber-400',
      etiquetaBadge: `${disponiblesCount} de ${maxCapacity} disponibles`,
      claseBotonAccion: 'bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold shadow-amber-900/30',
    };
  }

  // > 4 disponibles -> VERDE
  return {
    estadoColor: 'VERDE',
    claseContenedorBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    claseTextoBadge: 'text-emerald-300',
    claseBordeBadge: 'border-emerald-500/40',
    claseIconoBadge: 'text-emerald-400',
    etiquetaBadge: `${disponiblesCount} de ${maxCapacity} disponibles`,
    claseBotonAccion: 'bg-[#10b981] hover:bg-[#059669] text-white shadow-emerald-900/30',
  };
};

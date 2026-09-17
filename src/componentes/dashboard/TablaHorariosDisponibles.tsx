import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Ban, 
  RefreshCw, 
  Plus, 
  UserCheck, 
  CalendarX,
  TimerOff
} from 'lucide-react';
import { 
  obtenerConfiguracionColorBadge 
} from '../../utilidades/calculoDisponibilidad';
import type { BloqueHoraSlot } from '../../utilidades/calculoDisponibilidad';
import { formatearFechaDisplay } from '../../pantallas/PantallaPanelControlDashboard';

interface PropiedadesTablaHorariosDisponibles {
  bloquesHorarios: BloqueHoraSlot[];
  cargandoHorarios: boolean;
  fechaSeleccionada: string;
  diaBloqueado: boolean;
  motivoDiaBloqueado: string;
  agendaExisteBD: boolean;
  alSeleccionarSlot: (slot: BloqueHoraSlot) => void;
  alGenerarAgenda: () => void;
}

export const TablaHorariosDisponibles: React.FC<PropiedadesTablaHorariosDisponibles> = ({
  bloquesHorarios,
  cargandoHorarios,
  fechaSeleccionada,
  diaBloqueado,
  motivoDiaBloqueado,
  agendaExisteBD,
  alSeleccionarSlot,
  alGenerarAgenda,
}) => {
  // Manejo de Estado de Carga (Loading State)
  if (cargandoHorarios) {
    return (
      <div className="p-12 text-center text-xs text-gray-400 space-y-3 bg-[#111827]/40 rounded-2xl border border-gray-800">
        <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin mx-auto" />
        <p className="font-semibold">Cargando disponibilidad de horarios para el día {formatearFechaDisplay(fechaSeleccionada)}...</p>
      </div>
    );
  }

  // Banner de Día Bloqueado (Feriado o Fin de Semana)
  if (diaBloqueado) {
    return (
      <div className="p-6 rounded-2xl bg-gray-800/80 border-2 border-gray-600/80 text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2.5 rounded-full bg-gray-700 border border-gray-600">
            <Ban className="w-6 h-6 text-gray-400" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-extrabold text-gray-300 uppercase tracking-wide">
              {motivoDiaBloqueado === 'Feriado' ? '🏖️ Día Feriado' : motivoDiaBloqueado === 'Sábado' ? '📅 Sábado' : '📅 Domingo'}
            </h4>
            <p className="text-xs text-gray-400 font-medium">
              Los turnos están bloqueados para el {formatearFechaDisplay(fechaSeleccionada)} ({motivoDiaBloqueado}). No hay interacciones disponibles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Manejo de Estado Vacío (Empty State) si no hay bloques de horarios
  if (bloquesHorarios.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 space-y-4 bg-gray-800/40 rounded-2xl border border-gray-700/60">
        <CalendarX className="w-10 h-10 text-gray-500 mx-auto" />
        <div>
          <h4 className="text-sm font-bold text-gray-200">No se encontraron slots de atención</h4>
          <p className="text-gray-400 mt-1">No hay horarios disponibles registrados en el sistema para esta fecha.</p>
        </div>
        {!agendaExisteBD && (
          <button
            onClick={alGenerarAgenda}
            className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Habilitar Agenda en BD
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerta cuando la agenda no está guardada explícitamente en BD */}
      {!agendaExisteBD && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>No hay una agenda guardada en la base de datos para el <strong>{formatearFechaDisplay(fechaSeleccionada)}</strong>. Mostrando plantilla de horarios por defecto.</span>
          </div>
          <button
            onClick={alGenerarAgenda}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs shrink-0 shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Habilitar Slots BD
          </button>
        </div>
      )}

      {/* TABLA ESTRUCTURADA DE HORARIOS DISPONIBLES */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#1f2937]/90 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 bg-gray-900/80 border-b border-gray-800">
              <th className="py-3.5 px-5">Slot / Horario</th>
              <th className="py-3.5 px-5">Capacidad & Disponibilidad</th>
              <th className="py-3.5 px-5">Estado / Badge</th>
              <th className="py-3.5 px-5">Pacientes Agendados</th>
              <th className="py-3.5 px-5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-xs">
            {bloquesHorarios.map((bloque) => {
              const estaBloqueado = bloque.bloqueado || bloque.disponiblesCount <= 0;
              const configBadge = obtenerConfiguracionColorBadge(
                bloque.disponiblesCount,
                bloque.maxCapacity,
                bloque.bloqueado,
                bloque.vencido
              );

              return (
                <tr
                  key={bloque.horaInicio}
                  className={`transition-colors ${
                    estaBloqueado
                      ? 'bg-gray-900/40 text-gray-500 select-none'
                      : 'hover:bg-gray-800/80 text-gray-200'
                  }`}
                >
                  {/* Columna 1: Horario / Rango de Hora */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${estaBloqueado ? 'bg-gray-800 text-gray-500' : 'bg-gray-800 text-[#10b981]'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-white">{bloque.rangoTexto}</span>
                    </div>
                  </td>

                  {/* Columna 2: Capacidad Actual en formato de Fracción ([Disponibles / Ocupados] de Capacidad Máxima N) */}
                  <td className="py-4 px-5">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-xs text-white">
                        {estaBloqueado ? (
                          <span className="text-gray-400">0 de {bloque.maxCapacity} disponibles</span>
                        ) : (
                          <span>{bloque.disponiblesCount} de {bloque.maxCapacity} disponibles</span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {bloque.currentBookings} {bloque.currentBookings === 1 ? 'turno ocupado' : 'turnos ocupados'} (Capacidad máx: {bloque.maxCapacity})
                      </span>
                    </div>
                  </td>

                  {/* Columna 3: Código de Colores Dinámico (Badges / Indicadores Condicionales) */}
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${configBadge.claseContenedorBadge}`}
                    >
                      {configBadge.estadoColor === 'VERDE' && <CheckCircle2 className={`w-3.5 h-3.5 ${configBadge.claseIconoBadge}`} />}
                      {configBadge.estadoColor === 'AMARILLO' && <AlertTriangle className={`w-3.5 h-3.5 ${configBadge.claseIconoBadge}`} />}
                      {configBadge.estadoColor === 'ROJO' && <XCircle className={`w-3.5 h-3.5 ${configBadge.claseIconoBadge}`} />}
                      {configBadge.estadoColor === 'BLOQUEADO' && <Ban className={`w-3.5 h-3.5 ${configBadge.claseIconoBadge}`} />}
                      {configBadge.estadoColor === 'FINALIZADO' && <TimerOff className={`w-3.5 h-3.5 ${configBadge.claseIconoBadge}`} />}
                      <span>{configBadge.etiquetaBadge}</span>
                    </span>
                  </td>

                  {/* Columna 4: Pacientes Agendados */}
                  <td className="py-4 px-5">
                    {bloque.bloqueado ? (
                      <span className="text-[11px] italic text-gray-400">
                        {bloque.motivoBloqueo || 'Día No Laboral'}
                      </span>
                    ) : bloque.pacientesNombres && bloque.pacientesNombres.length > 0 ? (
                      <div className="space-y-0.5">
                        {bloque.pacientesNombres.map((pac, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                            <UserCheck className="w-3 h-3 text-[#34d399] shrink-0" />
                            <span className="truncate max-w-[180px]">{pac}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">Sin reservas registradas</span>
                    )}
                  </td>

                  {/* Columna 5: Acción (Reservar slot o Deshabilitado) */}
                  <td className="py-4 px-5 text-right">
                    <button
                      disabled={estaBloqueado}
                      onClick={() => {
                        if (!estaBloqueado) alSeleccionarSlot(bloque);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
                        estaBloqueado
                          ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
                          : configBadge.claseBotonAccion
                      }`}
                    >
                      {bloque.vencido ? 'Turno Finalizado' : estaBloqueado ? 'Sin Turnos disponibles' : 'Agendar Turno'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

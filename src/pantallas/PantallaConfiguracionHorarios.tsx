import React, { useState, useEffect } from 'react';
import { servicioAgenda } from '../servicios/servicioAgenda';
import type { HorarioSemanal } from '../esquemas/tiposApi';
import { 
  Clock, 
  Save, 
  Copy, 
  CheckCircle2, 
  CalendarDays, 
  Users, 
  Timer,
  X
} from 'lucide-react';

interface PropiedadesPantallaConfiguracionHorarios {
  alMostrarNotificacion: (
    tipo: 'exito' | 'error' | 'advertencia' | 'info',
    titulo: string,
    mensaje: string
  ) => void;
}

const DIAS_SEMANA = [
  { dayOfWeek: 1, nombre: 'Lunes', corto: 'Lun' },
  { dayOfWeek: 2, nombre: 'Martes', corto: 'Mar' },
  { dayOfWeek: 3, nombre: 'Miércoles', corto: 'Mié' },
  { dayOfWeek: 4, nombre: 'Jueves', corto: 'Jue' },
  { dayOfWeek: 5, nombre: 'Viernes', corto: 'Vie' },
  { dayOfWeek: 6, nombre: 'Sábado', corto: 'Sáb' },
  { dayOfWeek: 7, nombre: 'Domingo', corto: 'Dom' },
];

const OPCIONES_HORAS = [
  '06:00', '07:00', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
];

export const PantallaConfiguracionHorarios: React.FC<PropiedadesPantallaConfiguracionHorarios> = ({
  alMostrarNotificacion,
}) => {
  const [horarios, setHorarios] = useState<HorarioSemanal[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Inicializar plantilla estándar de 7 días
  const crearHorarioPorDefecto = (dayOfWeek: number): HorarioSemanal => ({
    dayOfWeek,
    startTime: '08:00',
    endTime: '18:00',
    slotDurationMinutes: 60,
    maxCapacityPerSlot: 6,
    isActive: dayOfWeek <= 5, // Lunes a Viernes activos por defecto
  });

  const cargarHorariosBD = async () => {
    setCargando(true);
    try {
      const dataBD = await servicioAgenda.obtenerHorariosSemanales();
      
      const listaCompleta: HorarioSemanal[] = DIAS_SEMANA.map(({ dayOfWeek }) => {
        const coincidencia = dataBD.find((h) => h.dayOfWeek === dayOfWeek);
        if (coincidencia) {
          return {
            ...coincidencia,
            startTime: coincidencia.startTime ? coincidencia.startTime.substring(0, 5) : '08:00',
            endTime: coincidencia.endTime ? coincidencia.endTime.substring(0, 5) : '18:00',
            isActive: coincidencia.isActive !== undefined ? coincidencia.isActive : true,
            maxCapacityPerSlot: coincidencia.maxCapacityPerSlot || 6,
            slotDurationMinutes: coincidencia.slotDurationMinutes || 60,
          };
        }
        return crearHorarioPorDefecto(dayOfWeek);
      });

      setHorarios(listaCompleta);
    } catch {
      // Si aún no hay registros en BD, inicializar plantilla
      const plantillaInicial = DIAS_SEMANA.map(({ dayOfWeek }) => crearHorarioPorDefecto(dayOfWeek));
      setHorarios(plantillaInicial);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHorariosBD();
  }, []);

  const actualizarDia = (dayOfWeek: number, campo: keyof HorarioSemanal, valor: any) => {
    setHorarios((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [campo]: valor } : h))
    );
  };

  const copiarLunesAViernes = () => {
    const horarioLunes = horarios.find((h) => h.dayOfWeek === 1);
    if (!horarioLunes) return;

    setHorarios((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek >= 2 && h.dayOfWeek <= 5) {
          return {
            ...h,
            startTime: horarioLunes.startTime,
            endTime: horarioLunes.endTime,
            slotDurationMinutes: horarioLunes.slotDurationMinutes,
            maxCapacityPerSlot: horarioLunes.maxCapacityPerSlot,
            isActive: horarioLunes.isActive,
          };
        }
        return h;
      })
    );

    alMostrarNotificacion(
      'info',
      'Horarios replicados',
      'Se aplicó la configuración del Lunes a los días Martes, Miércoles, Jueves y Viernes.'
    );
  };

  const manejarGuardar = async () => {
    setGuardando(true);
    try {
      const payload: Partial<HorarioSemanal>[] = horarios.map((h) => ({
        id: h.id,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime.length === 5 ? `${h.startTime}:00` : h.startTime,
        endTime: h.endTime.length === 5 ? `${h.endTime}:00` : h.endTime,
        slotDurationMinutes: Number(h.slotDurationMinutes),
        maxCapacityPerSlot: Number(h.maxCapacityPerSlot),
        isActive: Boolean(h.isActive),
      }));

      await servicioAgenda.guardarHorariosSemanalesLote(payload);

      alMostrarNotificacion(
        'exito',
        'Configuración guardada',
        'Los horarios de atención semanal fueron actualizados en la base de datos backend.'
      );
      await cargarHorariosBD();
    } catch (err: any) {
      alMostrarNotificacion(
        'error',
        'Error al guardar',
        err.message || 'No se pudieron guardar los horarios semanales.'
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="p-8 text-center text-[#718096] font-medium space-y-3">
        <Clock className="w-8 h-8 text-[#598b76] animate-spin mx-auto" />
        <p>Cargando configuración de horarios semanales...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animacion-fade-in text-[#2d3748]">
      
      {/* HEADER DE PANTALLA */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e8e6df] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf3ee] text-[#598b76] flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1a202c]">
                Configuración de Horarios de Atención
              </h1>
              <p className="text-xs text-[#718096] font-medium mt-0.5">
                Definí los rangos horarios semanales por día para la generación de slots de turnos kinesiológicos.
              </p>
            </div>
          </div>
        </div>

        {/* ACCIONES DE BARRA SUPERIOR */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copiarLunesAViernes}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f4f2ec] hover:bg-[#e8e4da] text-[#4a5568] font-bold text-xs border border-[#e2e8f0] transition-all"
          >
            <Copy className="w-4 h-4 text-[#598b76]" />
            Copiar Lunes a Viernes
          </button>

          <button
            onClick={manejarGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-xs shadow-md shadow-[#598b76]/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar Horarios'}
          </button>
        </div>
      </div>

      {/* GRILLA DE DIAS (1..7: LUNES A DOMINGO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DIAS_SEMANA.map(({ dayOfWeek, nombre, corto }) => {
          const horario = horarios.find((h) => h.dayOfWeek === dayOfWeek) || crearHorarioPorDefecto(dayOfWeek);
          const esActivo = horario.isActive;

          return (
            <div
              key={dayOfWeek}
              className={`bg-white rounded-3xl border transition-all shadow-xs p-6 space-y-5 flex flex-col justify-between ${
                esActivo
                  ? 'border-[#e8e6df] hover:border-[#598b76]'
                  : 'border-[#edf2f7] bg-[#faf9f5]/50 opacity-75'
              }`}
            >
              {/* ENCABEZADO DEL DIA & TOGGLE SWITCH */}
              <div className="flex items-center justify-between border-b border-[#f0eee6] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    esActivo ? 'bg-[#598b76] text-white' : 'bg-[#e2e8f0] text-[#a0aec0]'
                  }`}>
                    {corto}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1a202c]">{nombre}</h3>
                    <p className="text-[11px] text-[#718096] font-medium">
                      {esActivo ? 'Atención activa' : 'Día inactivo / Cerrado'}
                    </p>
                  </div>
                </div>

                {/* BOTON SWITCH ACTIVO / INACTIVO */}
                <button
                  type="button"
                  onClick={() => actualizarDia(dayOfWeek, 'isActive', !esActivo)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    esActivo ? 'bg-[#598b76]' : 'bg-[#cbd5e0]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      esActivo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* CONTENIDO DEL DIA (ACTIVABLE) */}
              {esActivo ? (
                <div className="space-y-4 flex-1">
                  
                  {/* HORA INICIO Y HORA FIN */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4a5568] mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#598b76]" />
                        Apertura
                      </label>
                      <select
                        value={horario.startTime}
                        onChange={(e) => actualizarDia(dayOfWeek, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-[#598b76] bg-white"
                      >
                        {OPCIONES_HORAS.map((h) => (
                          <option key={h} value={h}>
                            {h} hs
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4a5568] mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#8b5e3c]" />
                        Cierre
                      </label>
                      <select
                        value={horario.endTime}
                        onChange={(e) => actualizarDia(dayOfWeek, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-[#598b76] bg-white"
                      >
                        {OPCIONES_HORAS.map((h) => (
                          <option key={h} value={h}>
                            {h} hs
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* DURACION DE SLOTS Y CAPACIDAD MAXIMA */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4a5568] mb-1 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-[#598b76]" />
                        Duración
                      </label>
                      <select
                        value={horario.slotDurationMinutes}
                        onChange={(e) => actualizarDia(dayOfWeek, 'slotDurationMinutes', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-[#598b76] bg-white"
                      >
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4a5568] mb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#598b76]" />
                        Capacidad
                      </label>
                      <select
                        value={horario.maxCapacityPerSlot}
                        onChange={(e) => actualizarDia(dayOfWeek, 'maxCapacityPerSlot', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold focus:outline-none focus:border-[#598b76] bg-white"
                      >
                        <option value={1}>1 paciente</option>
                        <option value={2}>2 pacientes</option>
                        <option value={3}>3 pacientes</option>
                        <option value={4}>4 pacientes</option>
                        <option value={5}>5 pacientes</option>
                        <option value={6}>6 pacientes (Máx)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-[#eaf3ee] border border-[#d2e5d9] text-[11px] text-[#2d5242] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#598b76] shrink-0" />
                    <span>
                      Atención continua de <strong>{horario.startTime}</strong> a <strong>{horario.endTime}</strong>.
                    </span>
                  </div>

                </div>
              ) : (
                <div className="py-8 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#edf2f7] text-[#a0aec0] flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-[#718096] font-medium">Sin franjas de turnos en este día.</p>
                  <button
                    type="button"
                    onClick={() => actualizarDia(dayOfWeek, 'isActive', true)}
                    className="text-xs font-bold text-[#598b76] hover:underline pt-1"
                  >
                    Activar {nombre}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER ACCIONES FINAL */}
      <div className="p-6 bg-white rounded-3xl border border-[#e8e6df] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-[#598b76]" />
          <p className="text-xs text-[#718096] font-medium">
            Los horarios guardados se aplicarán automáticamente a las futuras agendas diarias generadas.
          </p>
        </div>

        <button
          onClick={manejarGuardar}
          disabled={guardando}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-xs shadow-md shadow-[#598b76]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {guardando ? 'Guardando Configuración...' : 'Guardar Horarios Semanales'}
        </button>
      </div>

    </div>
  );
};

export default PantallaConfiguracionHorarios;

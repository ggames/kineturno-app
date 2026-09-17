import React, { useState, useEffect } from 'react';
import { 
  Calendar as IconoCalendario, 
  Clock, 
  MoreVertical, 
  User, 
  Bell, 
  Sprout,
  Info,
  ChevronRight,
  ChevronLeft,
  Activity,
  Stethoscope,
  X,
  Plus,
  RefreshCw,
  Ban
} from 'lucide-react';
import type { Usuario, Turno, AgendaDiaria, SlotHorario, Profesional, Paciente, Feriado } from '../esquemas/tiposApi';
import { servicioTurnos } from '../servicios/servicioTurnos';
import { servicioAgenda } from '../servicios/servicioAgenda';
import { servicioProfesionales } from '../servicios/servicioProfesionales';
import { servicioPacientes } from '../servicios/servicioPacientes';
import { servicioFeriados } from '../servicios/servicioFeriados';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import { TablaHorariosDisponibles } from '../componentes/dashboard/TablaHorariosDisponibles';
import type { BloqueHoraSlot } from '../utilidades/calculoDisponibilidad';
import { obtenerFechaLocalISO, crearFechaLocal, esFinDeSemana } from '../utilidades/fechas';

interface PropiedadesPantallaPanelControlDashboard {
  usuario: Usuario | null;
  alSeleccionarMenu: (menu: string) => void;
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

export const formatearFechaDisplay = (fecha?: string): string => {
  if (!fecha) return '-';
  const iso = fecha.substring(0, 10);
  const partes = iso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fecha;
};

export const PantallaPanelControlDashboard: React.FC<PropiedadesPantallaPanelControlDashboard> = ({
  usuario,
  alSeleccionarMenu,
  alMostrarNotificacion,
}) => {
  const [turnosReales, setTurnosReales] = useState<Turno[]>([]);
  const [agendasReales, setAgendasReales] = useState<AgendaDiaria[]>([]);
  const [slotsReales, setSlotsReales] = useState<SlotHorario[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);

  const [cargandoGeneral, setCargandoGeneral] = useState<boolean>(true);
  const [cargandoHorarios, setCargandoHorarios] = useState<boolean>(false);

  // Fecha seleccionada y desplazamiento de la tira de 7 días (offset)
  const hoyISO = obtenerFechaLocalISO();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoyISO);
  const [offsetDias, setOffsetDias] = useState<number>(0);

  // Slot seleccionado para el modal de reserva
  const [slotParaReservar, setSlotParaReservar] = useState<BloqueHoraSlot | null>(null);
  const [profesionalIdReserva, setProfesionalIdReserva] = useState<string>('');
  const [pacienteIdReserva, setPacienteIdReserva] = useState<string>('');
  const [procesandoReserva, setProcesandoReserva] = useState<boolean>(false);

  // Modal para generar agenda si no existe en la BD para esa fecha
  const [mostrarModalGenerarAgenda, setMostrarModalGenerarAgenda] = useState<boolean>(false);
  const [profesionalAgendaId, setProfesionalAgendaId] = useState<string>('');

  // 1. Carga inicial de datos de la aplicación
  useEffect(() => {
    const cargarDatosBase = async () => {
      setCargandoGeneral(true);
      try {
        const [listaPros, listaPacs, listaFeriados] = await Promise.all([
          servicioProfesionales.obtenerProfesionales().catch(() => []),
          servicioPacientes.obtenerPacientes().catch(() => []),
          servicioFeriados.obtenerFeriados().catch(() => []),
        ]);
        setProfesionales(listaPros);
        setPacientes(listaPacs);
        setFeriados(listaFeriados);

        if (listaPros.length > 0) setProfesionalIdReserva(listaPros[0].id);
        if (listaPacs.length > 0) setPacienteIdReserva(listaPacs[0].id);
      } catch (err: any) {
        alMostrarNotificacion('error', 'Error al cargar datos', err.message || 'No se pudieron recuperar datos de la BD.');
      } finally {
        setCargandoGeneral(false);
      }
    };
    cargarDatosBase();
  }, []);

  // 2. EFECTO REACTIVO: Al cambiar `fechaSeleccionada`, consultar a la API REST del backend
  const cargarTurnosYHorariosPorFecha = async (fechaConsultar: string) => {
    setCargandoHorarios(true);
    try {
      const [listaTurnos, listaAgendas, listaSlots] = await Promise.all([
        servicioTurnos.obtenerTurnos().catch(() => []),
        servicioAgenda.obtenerAgendasDiarias().catch(() => []),
        servicioAgenda.obtenerTimeSlots().catch(() => []),
      ]);

      setTurnosReales(listaTurnos);
      setAgendasReales(listaAgendas);
      setSlotsReales(listaSlots);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cargar fecha', err.message || `No se pudieron cargar los horarios para la fecha ${fechaConsultar}.`);
    } finally {
      setCargandoHorarios(false);
    }
  };

  useEffect(() => {
    cargarTurnosYHorariosPorFecha(fechaSeleccionada);
  }, [fechaSeleccionada]);

  const nombreUsuario = usuario?.person
    ? `${usuario.person.firstName} ${usuario.person.lastName}`
    : usuario?.email
    ? usuario.email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase())
    : 'Lic. Kinesiología';

  // Funciones auxiliares para detectar feriados y fines de semana
  const esFeriado = (fechaISO: string): Feriado | undefined => {
    return feriados.find((f) => f.date === fechaISO || f.date?.startsWith(fechaISO));
  };

  const esDiaBloqueado = (fechaISO: string): { bloqueado: boolean; motivo: string } => {
    const fds = esFinDeSemana(fechaISO);
    if (fds) return { bloqueado: true, motivo: fds };
    const feriado = esFeriado(fechaISO);
    if (feriado && feriado.type === 'TOTAL') return { bloqueado: true, motivo: 'Feriado' };
    return { bloqueado: false, motivo: '' };
  };

  const esFeriadoParcial = (fechaISO: string): Feriado | undefined => {
    const feriado = esFeriado(fechaISO);
    return feriado && feriado.type === 'PARTIAL' ? feriado : undefined;
  };

  // Generar la tira de 7 días continuos según el offset de semanas/días
  const generarDiasTira = () => {
    const dias: { iso: string; numeroDia: number; nombreDia: string; esHoy: boolean; esBloqueado: boolean; motivoBloqueo: string }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + offsetDias);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = obtenerFechaLocalISO(d);
      const numeroDia = d.getDate();
      const esHoy = iso === hoyISO;
      const nombreDia = esHoy ? 'HOY' : d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase().replace('.', '');
      const { bloqueado, motivo } = esDiaBloqueado(iso);
      dias.push({ iso, numeroDia, nombreDia, esHoy, esBloqueado: bloqueado, motivoBloqueo: motivo });
    }
    return dias;
  };

  const diasTira = generarDiasTira();

  // Texto del mes y año para la fecha seleccionada
  const fechaObjSeleccionada = crearFechaLocal(fechaSeleccionada);
  const mesAnoTexto = fechaObjSeleccionada.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  // Construir Bloques Horarios integrales (Slots completos sin división en sub-solapas)
  const construirBloquesHorariosBD = (): { bloques: BloqueHoraSlot[]; agendaExisteBD: boolean; diaBloqueado: boolean; motivoDiaBloqueado: string } => {
    const horasBase = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    
    const { bloqueado: diaBloqueado, motivo: motivoDiaBloqueado } = esDiaBloqueado(fechaSeleccionada);
    const feriadoParcial = esFeriadoParcial(fechaSeleccionada);
    
    const agendasDelDia = agendasReales.filter((a) => {
      const d = a.date ? (typeof a.date === 'string' ? a.date.substring(0, 10) : '') : '';
      return d === fechaSeleccionada;
    });
    const agendaExisteBD = agendasDelDia.length > 0;

    const turnosDelDia = turnosReales.filter((t) => {
      if (t.status === 'CANCELLED') return false;
      const rawF = t.appointmentDate || (t.timeSlot as any)?.agenda?.date || '';
      const fechaTurnoStr = typeof rawF === 'string' ? rawF.substring(0, 10) : '';
      return fechaTurnoStr === fechaSeleccionada;
    });

    const bloques: BloqueHoraSlot[] = horasBase.map((horaInicioStr) => {
      const horaNum = parseInt(horaInicioStr.split(':')[0], 10);
      const horaFinStr = `${(horaNum + 1).toString().padStart(2, '0')}:00`;
      const rangoTexto = `${horaInicioStr} - ${horaFinStr} hs`;

      // Feriado parcial
      let bloqueEnFeriadoParcial = false;
      if (feriadoParcial && feriadoParcial.partialStartTime && feriadoParcial.partialEndTime) {
        const horaBloqueo = parseInt(feriadoParcial.partialStartTime.split(':')[0], 10);
        const horaFinBloqueo = parseInt(feriadoParcial.partialEndTime.split(':')[0], 10);
        bloqueEnFeriadoParcial = horaNum >= horaBloqueo && horaNum < horaFinBloqueo;
      }

      // Check if slot is expired (past date/time)
      const now = new Date();
      const slotEndDateTime = crearFechaLocal(fechaSeleccionada);
      const [hFin, mFin] = horaFinStr.split(':').map(Number);
      slotEndDateTime.setHours(hFin, mFin, 0, 0);
      const slotVencido = slotEndDateTime.getTime() < now.getTime();

      const esBloqueado = diaBloqueado || bloqueEnFeriadoParcial || slotVencido;
      const motivoBloqueo = diaBloqueado ? motivoDiaBloqueado : bloqueEnFeriadoParcial ? 'Feriado Parcial' : slotVencido ? 'Turno Finalizado' : '';

      // Coincidencia con Slot de BD para la fecha seleccionada
      const slotBD = slotsReales.find((s) => {
        const slotStart = s.startTime?.substring(0, 5);
        const slotDate = s.agenda?.date ? (typeof s.agenda.date === 'string' ? s.agenda.date.substring(0, 10) : '') : '';
        return slotStart === horaInicioStr && (slotDate === '' || slotDate === fechaSeleccionada);
      });

      // Buscar turnos asociados a esta hora
      const turnosDeLaHora = turnosDelDia.filter((t) => {
        if (slotBD && (t.timeSlot?.id === slotBD.id || (t as any).timeSlotId === slotBD.id)) return true;
        const slotStart = t.timeSlot?.startTime;
        return slotStart ? slotStart.startsWith(horaInicioStr) : false;
      });

      const maxCapacity = (!slotBD?.maxCapacity || slotBD.maxCapacity === 1) ? 6 : slotBD.maxCapacity;
      const currentBookings = Math.max(slotBD?.currentBookings ?? 0, turnosDeLaHora.length);
      const disponiblesCount = esBloqueado ? 0 : Math.max(0, maxCapacity - currentBookings);

      const pacientesNombres = turnosDeLaHora
        .map((t) => (t.patient?.person ? `${t.patient.person.lastName}, ${t.patient.person.firstName}` : ''))
        .filter(Boolean);

      return {
        slotBDId: slotBD?.id,
        horaInicio: horaInicioStr,
        horaFin: horaFinStr,
        rangoTexto,
        maxCapacity,
        currentBookings,
        disponiblesCount,
        bloqueado: esBloqueado,
        vencido: slotVencido,
        motivoBloqueo,
        pacientesNombres,
      };
    });

    return { bloques, agendaExisteBD, diaBloqueado, motivoDiaBloqueado };
  };

  const { bloques: bloquesHorarios, agendaExisteBD, diaBloqueado, motivoDiaBloqueado } = construirBloquesHorariosBD();

  // Confirmar reserva en la API REST backend (POST /appointments)
  const realizarReservaBackend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotParaReservar) return;

    const proId = profesionalIdReserva || (profesionales.length > 0 ? profesionales[0].id : '');
    const pacId = pacienteIdReserva || (pacientes.length > 0 ? pacientes[0].id : '');

    if (!proId || !pacId) {
      alMostrarNotificacion('advertencia', 'Datos incompletos', 'Asegurate de seleccionar profesional y paciente.');
      return;
    }

    setProcesandoReserva(true);
    try {
      let slotId = slotParaReservar.slotBDId;

      if (!slotId) {
        await servicioAgenda.crearAgendaDiaria({
          professionalId: proId,
          date: fechaSeleccionada,
          startHour: 8,
          endHour: 18,
          maxCapacity: 6,
        }).catch(() => null);

        const slotsActualizados = await servicioAgenda.obtenerTimeSlots().catch(() => []);
        setSlotsReales(slotsActualizados);
        const slotCoincidente = slotsActualizados.find((s) => {
          const slotStart = s.startTime?.substring(0, 5);
          const slotDate = s.agenda?.date ? (typeof s.agenda.date === 'string' ? s.agenda.date.substring(0, 10) : '') : '';
          return slotStart === slotParaReservar.horaInicio && (slotDate === '' || slotDate === fechaSeleccionada);
        });
        slotId = slotCoincidente?.id;
      }

      if (!slotId) {
        throw new Error('No se encontró el identificador del horario en la base de datos.');
      }

      await servicioTurnos.crearTurno({
        patientId: pacId,
        professionalId: proId,
        timeSlotId: slotId,
        appointmentDate: fechaSeleccionada,
      });

      alMostrarNotificacion('exito', '¡Turno Confirmado!', `Turno registrado en la base de datos para el día ${formatearFechaDisplay(fechaSeleccionada)} en el horario ${slotParaReservar.rangoTexto}.`);
      setSlotParaReservar(null);
      await cargarTurnosYHorariosPorFecha(fechaSeleccionada);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al reservar', err.message || 'No se pudo crear la cita en la base de datos.');
    } finally {
      setProcesandoReserva(false);
    }
  };

  // Crear agenda diaria en la BD para la fecha seleccionada si no existe
  const generarAgendaParaFechaSeleccionada = async (e: React.FormEvent) => {
    e.preventDefault();
    const proId = profesionalAgendaId || (profesionales.length > 0 ? profesionales[0].id : '');
    if (!proId) {
      alMostrarNotificacion('advertencia', 'Seleccioná un profesional', 'Elegí un kinesiólogo para asociar la agenda.');
      return;
    }

    try {
      await servicioAgenda.crearAgendaDiaria({
        professionalId: proId,
        date: fechaSeleccionada,
        startHour: 8,
        endHour: 18,
        maxCapacity: 6,
      });

      alMostrarNotificacion('exito', 'Agenda Creada', `Se generaron los slots en la BD PostgreSQL para el ${fechaSeleccionada}.`);
      setMostrarModalGenerarAgenda(false);
      await cargarTurnosYHorariosPorFecha(fechaSeleccionada);
    } catch (err: any) {
      const msj = err.message || '';
      if (msj.includes('UNIQUE constraint') || msj.includes('409')) {
        alMostrarNotificacion('advertencia', 'Agenda ya existente', 'Ya existe una agenda creada para esta fecha en la base de datos.');
      } else {
        alMostrarNotificacion('error', 'Fallo al generar agenda', msj || 'No se pudo crear la agenda.');
      }
    }
  };

  // Métricas para tarjetas
  const turnosConfirmados = turnosReales.filter((t) => t.status === 'CONFIRMED' || t.status === 'SCHEDULED').length;
  const turnosPendientes = turnosReales.filter((t) => t.status === 'PENDING').length;
  const turnosCompletados = turnosReales.filter((t) => t.status === 'COMPLETED').length;
  const turnosCancelados = turnosReales.filter((t) => t.status === 'CANCELLED').length;
  const proximoTurnoReal = turnosReales.find((t) => t.status !== 'CANCELLED');

  const hoyTexto = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (cargandoGeneral) {
    return <EstadoCarga mensaje="Conectando con el servicio backend de KineTurnos..." pantallaCompleta />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto animacion-fade-in text-[#2d3748] font-sans selection:bg-[#eaf3ee] selection:text-[#234e3d]">
      
      {/* SALUDO DE BIENVENIDA SUPERIOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a202c] tracking-tight">
            ¡Bienvenido, {nombreUsuario}!
          </h1>
          <p className="text-xs sm:text-sm text-[#718096] font-medium mt-1">
            Panel de control kinesiológico &bull; Sincronizado en tiempo real con PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-[#eaf3ee] text-[#598b76] text-xs font-bold border border-[#c4e0d2] flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#598b76]" />
            PostgreSQL Conectado
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL NAVEGABLE "SELECCIONAR FECHA" Y "HORARIOS DISPONIBLES" */}
      {/* ========================================================================= */}
      <div className="bg-[#111827] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800 space-y-6">
        
        {/* ENCABEZADO "SELECCIONAR FECHA" CON CONTROLES DE FECHA Y MES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-300">
              SELECCIONAR FECHA
            </h2>
            {cargandoHorarios && (
              <RefreshCw className="w-4 h-4 text-[#10b981] animate-spin ml-2" />
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* SELECCIONADOR DE FECHA ESPECÍFICA DE CALENDARIO */}
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => {
                if (e.target.value) setFechaSeleccionada(e.target.value);
              }}
              className="bg-gray-800 text-[#10b981] font-extrabold text-xs px-3 py-1.5 rounded-xl border border-gray-700 focus:outline-none focus:border-[#10b981] cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-extrabold text-[#10b981] capitalize">
              {mesAnoTexto}
            </span>
          </div>
        </div>

        {/* TIRA HORIZONTAL DE SELECCIÓN DE DÍAS CON FLECHAS DE NAVEGACIÓN < > */}
        <div className="flex items-center gap-2">
          {/* FLECHA DE DESPLAZAMIENTO ATRÁS < */}
          <button
            onClick={() => setOffsetDias((prev) => prev - 7)}
            className="p-3 rounded-2xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700/80 transition-all shrink-0"
            title="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* DÍAS DE LA TIRA */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700">
            {diasTira.map((d) => {
              const estaSeleccionado = d.iso === fechaSeleccionada;
              return (
                <button
                  key={d.iso}
                  onClick={() => setFechaSeleccionada(d.iso)}
                  title={d.esBloqueado ? `${d.motivoBloqueo} — Turnos bloqueados` : ''}
                  className={`flex flex-col items-center justify-center min-w-[78px] sm:min-w-[85px] h-20 rounded-2xl transition-all duration-200 relative ${
                    estaSeleccionado
                      ? d.esBloqueado
                        ? 'bg-gray-600 text-gray-300 shadow-lg shadow-gray-600/40 font-extrabold scale-105 border-2 border-gray-500'
                        : 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/40 font-extrabold scale-105 border-2 border-[#34d399]'
                      : d.esBloqueado
                        ? 'bg-gray-800/60 hover:bg-gray-700/60 text-gray-500 border border-gray-700/50 font-semibold'
                        : 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 border border-gray-700/80 font-semibold'
                  }`}
                >
                  <span className="text-[10px] tracking-widest opacity-90 mb-0.5">{d.nombreDia}</span>
                  <span className="text-2xl font-black">{d.numeroDia}</span>
                  {d.esBloqueado && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-600 border border-gray-500 flex items-center justify-center">
                      <Ban className="w-3 h-3 text-gray-300" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* FLECHA DE DESPLAZAMIENTO ADELANTE > */}
          <button
            onClick={() => setOffsetDias((prev) => prev + 7)}
            className="p-3 rounded-2xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700/80 transition-all shrink-0"
            title="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* CARTEL INFORMATIVO DE HORARIOS Y SLOTS */}
        <div className="p-4 rounded-2xl bg-gray-800/70 border border-gray-700/70 flex items-start gap-3 text-xs leading-relaxed text-gray-300">
          <div className="p-1.5 rounded-full bg-[#10b981]/20 text-[#10b981] shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            Horarios de atención disponibles para la fecha <strong className="text-white">{formatearFechaDisplay(fechaSeleccionada)}</strong>. Seleccioná un horario disponible para agendar un turno.
          </div>
        </div>

        {/* PANEL "HORARIOS DISPONIBLES" REACTIVO A LA FECHA SELECCIONADA */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-300">
              HORARIOS DISPONIBLES PARA EL {formatearFechaDisplay(fechaSeleccionada)}
            </h3>

            {!agendaExisteBD && !diaBloqueado && (
              <button
                onClick={() => setMostrarModalGenerarAgenda(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#34d399] border border-[#10b981]/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Generar Agenda en BD
              </button>
            )}
          </div>

          <TablaHorariosDisponibles
            bloquesHorarios={bloquesHorarios}
            cargandoHorarios={cargandoHorarios}
            fechaSeleccionada={fechaSeleccionada}
            diaBloqueado={diaBloqueado}
            motivoDiaBloqueado={motivoDiaBloqueado}
            agendaExisteBD={agendaExisteBD}
            alSeleccionarSlot={(slot) => setSlotParaReservar(slot)}
            alGenerarAgenda={() => setMostrarModalGenerarAgenda(true)}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE RESERVA DE TURNO INTEGRADO CON POST /appointments */}
      {/* ========================================================================= */}
      {slotParaReservar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-white/80 animacion-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-[#f0eee6]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#eaf3ee] text-[#598b76]">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-[#1a202c]">Confirmar Turno en BD</h3>
              </div>
              <button
                onClick={() => setSlotParaReservar(null)}
                className="p-1 rounded-xl text-[#a0aec0] hover:text-[#1a202c] hover:bg-[#faf9f5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={realizarReservaBackend} className="space-y-4 text-xs text-[#2d3748]">
              <div className="p-4 rounded-2xl bg-[#eaf3ee] border border-[#c4e0d2] space-y-1">
                <span className="text-[10px] font-bold text-[#598b76] uppercase">Fecha y Hora Seleccionada</span>
                <p className="font-extrabold text-sm text-[#234e3d]">
                  📅 {formatearFechaDisplay(fechaSeleccionada)} &bull; ⏰ {slotParaReservar.rangoTexto}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1.5">
                  Kinesiólogo / Profesional *
                </label>
                <select
                  value={profesionalIdReserva}
                  onChange={(e) => setProfesionalIdReserva(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76]"
                  required
                >
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.person ? `Lic. ${p.person.firstName} ${p.person.lastName} (${p.specialty})` : `Kinesiólogo #${p.id.substring(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1.5">
                  Paciente *
                </label>
                <select
                  value={pacienteIdReserva}
                  onChange={(e) => setPacienteIdReserva(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76]"
                  required
                >
                  {pacientes.map((pac) => {
                    const nombrePac = pac.person
                      ? `${pac.person.lastName}, ${pac.person.firstName}`
                      : `Paciente #${pac.id.substring(0, 6)}`;
                    const dni = pac.person?.documentId ? ` - DNI: ${pac.person.documentId}` : '';
                    return (
                      <option key={pac.id} value={pac.id}>
                        {nombrePac}{dni}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSlotParaReservar(null)}
                  className="px-4 py-3 rounded-2xl bg-[#f0eee6] hover:bg-[#e8e6df] font-bold text-xs text-[#4a5568]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoReserva}
                  className="px-5 py-3 rounded-2xl bg-[#598b76] hover:bg-[#487361] font-bold text-xs text-white shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {procesandoReserva ? 'Guardando en BD...' : 'Confirmar Reserva en PostgreSQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GENERAR AGENDA DIARIA PARA LA FECHA SELECCIONADA */}
      {mostrarModalGenerarAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-white/80 animacion-fade-in text-xs text-[#2d3748]">
            <div className="flex justify-between items-center pb-2 border-b border-[#f0eee6]">
              <h3 className="text-base font-extrabold text-[#1a202c]">Habilitar Agenda en BD</h3>
              <button onClick={() => setMostrarModalGenerarAgenda(false)} className="text-[#a0aec0] hover:text-[#1a202c]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={generarAgendaParaFechaSeleccionada} className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#e8e6df]">
                <span className="text-[10px] font-bold text-[#718096] uppercase">Fecha de Atención</span>
                <p className="font-extrabold text-sm text-[#1a202c]">{fechaSeleccionada}</p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Kinesiólogo Asignado *</label>
                <select
                  value={profesionalAgendaId}
                  onChange={(e) => setProfesionalAgendaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] focus:outline-none"
                  required
                >
                  <option value="">Seleccioná profesional...</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.person ? `Lic. ${p.person.firstName} ${p.person.lastName}` : `Kinesiólogo #${p.id.substring(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalGenerarAgenda(false)}
                  className="px-4 py-2.5 rounded-2xl bg-[#f0eee6] font-bold text-[#4a5568]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] font-bold text-white shadow-md"
                >
                  Generar Slots en PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIONES INFERIORES: PRÓXIMO TURNO & ACTIVIDAD GENERAL */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* PRÓXIMO TURNO REAL */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-[#e8e6df] flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-[#1a202c] mb-4 flex items-center gap-2">
              <IconoCalendario className="w-5 h-5 text-[#598b76]" />
              Próximo turno registrado
            </h2>

            {proximoTurnoReal ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#faf9f5] border border-[#eee2d3]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#598b76] text-white font-bold flex items-center justify-center text-lg border-2 border-white shadow-xs">
                    {proximoTurnoReal.patient?.person?.firstName ? proximoTurnoReal.patient.person.firstName[0] : 'P'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1a202c]">
                      {proximoTurnoReal.patient?.person
                        ? `${proximoTurnoReal.patient.person.firstName} ${proximoTurnoReal.patient.person.lastName}`
                        : 'Paciente Asignado BD'}
                    </h3>
                    <p className="text-xs text-[#718096] font-medium">
                      {proximoTurnoReal.professional?.specialty || 'Kinesiología General'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#4a5568] font-semibold">
                      <span className="flex items-center gap-1">
                        <IconoCalendario className="w-3.5 h-3.5 text-[#598b76]" />
                        {proximoTurnoReal.appointmentDate || hoyISO}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#598b76]" />
                        {proximoTurnoReal.timeSlot ? `${proximoTurnoReal.timeSlot.startTime} hs` : '09:00 hs'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-28 p-4 rounded-2xl bg-[#eaf3ee] text-center border border-[#d2e6da] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[11px] text-[#598b76] font-semibold">Estado</span>
                  <span className="text-xs font-extrabold text-[#234e3d] uppercase mt-0.5">
                    {proximoTurnoReal.status || 'CONFIRMED'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#faf9f5] border border-[#eee2d3] text-center text-xs text-[#718096]">
                No hay turnos agendados en la base de datos para los próximos días.
              </div>
            )}
          </div>

          <button
            onClick={() => alSeleccionarMenu('turnos')}
            className="w-full py-3.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-sm shadow-md transition-all text-center flex items-center justify-center gap-2"
          >
            Ver gestión de turnos completa
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* RESUMEN DEL DÍA BD */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-[#e8e6df] flex flex-col justify-between space-y-6">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-[#1a202c]">
                Resumen del día
              </h2>
              <p className="text-xs text-[#718096] font-medium capitalize">{hoyTexto}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#f0eee6]">
                <span className="text-xs text-[#4a5568] font-medium">Turnos confirmados</span>
                <span className="text-xs font-extrabold text-[#1a202c]">{turnosConfirmados}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0eee6]">
                <span className="text-xs text-[#4a5568] font-medium">Turnos pendientes</span>
                <span className="text-xs font-extrabold text-[#1a202c]">{turnosPendientes}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0eee6]">
                <span className="text-xs text-[#4a5568] font-medium">Turnos completados</span>
                <span className="text-xs font-extrabold text-[#1a202c]">{turnosCompletados}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0eee6]">
                <span className="text-xs text-[#4a5568] font-medium">Turnos cancelados</span>
                <span className="text-xs font-extrabold text-[#1a202c]">{turnosCancelados}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0eee6]">
                <span className="text-xs text-[#4a5568] font-medium">Agendas Diarias activas</span>
                <span className="text-xs font-extrabold text-[#1a202c]">{agendasReales.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alSeleccionarMenu('agenda')}
            className="w-full py-3.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-sm shadow-md transition-all text-center flex items-center justify-center gap-2"
          >
            Ver calendario de agenda
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HISTORIAL DE TURNOS BD */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e8e6df] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1a202c]">
            Historial de turnos en PostgreSQL ({turnosReales.length})
          </h2>
          <button
            onClick={() => alSeleccionarMenu('turnos')}
            className="text-xs font-bold text-[#598b76] hover:underline flex items-center gap-1"
          >
            Ver listado completo
          </button>
        </div>

        {turnosReales.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#718096]">
            No hay turnos registrados en la base de datos actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-[#718096] uppercase border-b border-[#f0eee6]">
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Kinesiólogo</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Horario</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee6] text-xs">
                {turnosReales.map((row) => {
                  const esCancelado = row.status === 'CANCELLED';
                  const nombrePaciente = row.patient?.person
                    ? `${row.patient.person.firstName} ${row.patient.person.lastName}`
                    : 'Paciente BD';
                  const nombrePro = row.professional?.person
                    ? `${row.professional.person.firstName} ${row.professional.person.lastName}`
                    : 'Lic. Kinesiología';

                  return (
                    <tr key={row.id} className="hover:bg-[#faf9f5] transition-colors">
                      <td className="py-4 px-4 font-bold text-[#1a202c]">{nombrePaciente}</td>
                      <td className="py-4 px-4 text-[#4a5568]">Lic. {nombrePro}</td>
                      <td className="py-4 px-4 text-[#4a5568] font-medium">{row.appointmentDate || 'Hoy'}</td>
                      <td className="py-4 px-4 text-[#4a5568] font-medium">{row.timeSlot ? `${row.timeSlot.startTime} hs` : '09:00 hs'}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            esCancelado
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-[#eaf3ee] text-[#234e3d]'
                          }`}
                        >
                          {esCancelado ? 'Cancelado' : 'Confirmado'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => alMostrarNotificacion('info', nombrePaciente, `Detalles de turno ID #${row.id.substring(0, 8)}.`)}
                          className="text-[#a0aec0] hover:text-[#4a5568] p-1 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACCESO RÁPIDO */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-[#1a202c]">
          Acceso rápido
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => alSeleccionarMenu('perfil')}
            className="bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm hover:shadow-md hover:border-[#598b76] cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#f0eee6] text-[#598b76] flex items-center justify-center group-hover:bg-[#598b76] group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#2d3748]">Mi perfil</span>
          </div>

          <div
            onClick={() => alSeleccionarMenu('agenda')}
            className="bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm hover:shadow-md hover:border-[#598b76] cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#f0eee6] text-[#598b76] flex items-center justify-center group-hover:bg-[#598b76] group-hover:text-white transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#2d3748]">Horarios & Agenda</span>
          </div>

          <div
            onClick={() => alSeleccionarMenu('servicios')}
            className="bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm hover:shadow-md hover:border-[#598b76] cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#f0eee6] text-[#598b76] flex items-center justify-center group-hover:bg-[#598b76] group-hover:text-white transition-colors">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#2d3748]">Servicios</span>
          </div>

          <div
            onClick={() => alMostrarNotificacion('info', 'Notificaciones', `Conectado a PostgreSQL. ${turnosReales.length} turnos registrados.`)}
            className="bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm hover:shadow-md hover:border-[#598b76] cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#f0eee6] text-[#598b76] flex items-center justify-center group-hover:bg-[#598b76] group-hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#2d3748]">Notificaciones</span>
          </div>
        </div>
      </div>

    </div>
  );
};

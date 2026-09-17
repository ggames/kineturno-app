import React, { useState, useEffect } from 'react';
import { servicioTurnos } from '../servicios/servicioTurnos';
import { servicioProfesionales } from '../servicios/servicioProfesionales';
import { servicioAgenda } from '../servicios/servicioAgenda';
import { servicioPacientes } from '../servicios/servicioPacientes';
import { servicioFeriados } from '../servicios/servicioFeriados';
import type { Turno, Profesional, AgendaDiaria, Paciente, SlotHorario, Feriado } from '../esquemas/tiposApi';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import { ModalConfirmacion } from '../componentes/comunes/ModalConfirmacion';
import { 
  Plus, 
  Filter, 
  Activity, 
  UserPlus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Ban, 
  User, 
  X,
  Sliders
} from 'lucide-react';

interface PropiedadesPantallaGestionTurnosStaff {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

const formatearFechaDisplay = (fecha?: string): string => {
  if (!fecha) return '-';
  const iso = fecha.substring(0, 10);
  const partes = iso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fecha;
};

import { obtenerFechaLocalISO } from '../utilidades/fechas';

export const PantallaGestionTurnosStaff: React.FC<PropiedadesPantallaGestionTurnosStaff> = ({
  alMostrarNotificacion,
}) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [agendas, setAgendas] = useState<AgendaDiaria[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);

  const [cargando, setCargando] = useState<boolean>(true);
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroProfesionalId, setFiltroProfesionalId] = useState<string>('');

  // Modal para Generar Agenda Diaria
  const [mostrarModalAgenda, setMostrarModalAgenda] = useState<boolean>(false);
  const [profesionalAgendaId, setProfesionalAgendaId] = useState<string>('');
  const [fechaAgenda, setFechaAgenda] = useState<string>(obtenerFechaLocalISO());
  const [horaInicio, setHoraInicio] = useState<number>(8);
  const [horaFin, setHoraFin] = useState<number>(18);
  const [maxCapacityAgenda, setMaxCapacityAgenda] = useState<number>(6);

  // Modal para Configurar Capacidad (N) de Slots
  const [mostrarModalCapacidad, setMostrarModalCapacidad] = useState<boolean>(false);
  const [agendaEditarCapacidadId, setAgendaEditarCapacidadId] = useState<string>('');
  const [nuevaCapacidadN, setNuevaCapacidadN] = useState<number>(6);
  const [guardandoCapacidad, setGuardandoCapacidad] = useState<boolean>(false);

  // Modal para Cargar Turno a Paciente por el Staff
  const [mostrarModalNuevoTurno, setMostrarModalNuevoTurno] = useState<boolean>(false);
  const [busquedaPaciente, setBusquedaPaciente] = useState<string>('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [profesionalTurnoId, setProfesionalTurnoId] = useState<string>('');
  const [fechaTurno, setFechaTurno] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slotSeleccionadoId, setSlotSeleccionadoId] = useState<string>('');
  const [slotsDisponibles, setSlotsDisponibles] = useState<SlotHorario[]>([]);
  const [guardandoTurno, setGuardandoTurno] = useState<boolean>(false);

  // Turno a cancelar por el staff
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null);

  const cargarDatosControl = async () => {
    setCargando(true);
    try {
      const [listaTurnos, listaProfesionales, listaAgendas, listaPacientes, listaFeriados] = await Promise.all([
        servicioTurnos.obtenerTurnos().catch(() => []),
        servicioProfesionales.obtenerProfesionales().catch(() => []),
        servicioAgenda.obtenerAgendas().catch(() => []),
        servicioPacientes.obtenerPacientes().catch(() => []),
        servicioFeriados.obtenerFeriados().catch(() => []),
      ]);
      setTurnos(listaTurnos);
      setProfesionales(listaProfesionales);
      setAgendas(listaAgendas);
      setPacientes(listaPacientes);
      setFeriados(listaFeriados);

      if (listaProfesionales.length > 0 && !profesionalTurnoId) {
        setProfesionalTurnoId(listaProfesionales[0].id);
      }
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cargar agendas', err.message || 'No se pudieron recuperar los turnos del backend.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosControl();
  }, []);

  const [cargandoSlots, setCargandoSlots] = useState<boolean>(false);

  // Recalcular slots con UUID reales de la BD cuando cambia profesional o fecha
  useEffect(() => {
    let cancelado = false;

    const obtenerSlotsReales = async () => {
      if (!profesionalTurnoId || !fechaTurno) {
        setSlotsDisponibles([]);
        return;
      }

      // Verificar si es fin de semana o feriado
      const fechaObj = new Date(fechaTurno + 'T00:00:00');
      const diaSemana = fechaObj.getDay();
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
      const esFeriado = feriados.some((f) => f.date === fechaTurno && f.type === 'TOTAL');

      if (esFinDeSemana || esFeriado) {
        setSlotsDisponibles([]);
        return;
      }

      setCargandoSlots(true);

      try {
        let agendaCoincidente = agendas.find(
          (a) => a.professionalId === profesionalTurnoId && (a.date ? a.date.substring(0, 10) : '') === fechaTurno.substring(0, 10)
        );

        if (!agendaCoincidente) {
          const listaAgendasBD = await servicioAgenda.obtenerAgendas().catch(() => []);
          setAgendas(listaAgendasBD);
          agendaCoincidente = listaAgendasBD.find(
            (a) => a.professionalId === profesionalTurnoId && (a.date ? a.date.substring(0, 10) : '') === fechaTurno.substring(0, 10)
          );
        }

        if (agendaCoincidente && agendaCoincidente.id) {
          const slotsBD = await servicioAgenda.obtenerSlotsDeAgenda(agendaCoincidente.id);
          if (!cancelado) {
            setSlotsDisponibles(slotsBD);
          }
        } else {
          try {
            const nuevaAgenda = await servicioAgenda.crearAgendaDiaria({
              professionalId: profesionalTurnoId,
              date: fechaTurno,
              startHour: 8,
              endHour: 18,
              maxCapacity: 6,
            });
            if (nuevaAgenda && nuevaAgenda.id) {
              const slotsBD = await servicioAgenda.obtenerSlotsDeAgenda(nuevaAgenda.id);
              if (!cancelado) setSlotsDisponibles(slotsBD);
            }
          } catch {
            const todosSlots = await servicioAgenda.obtenerTimeSlots().catch(() => []);
            if (!cancelado) setSlotsDisponibles(todosSlots);
          }
        }
      } catch (err: any) {
        if (!cancelado) {
          alMostrarNotificacion('error', 'Error al cargar horarios', err.message || 'No se pudieron recuperar los horarios del backend.');
        }
      } finally {
        if (!cancelado) setCargandoSlots(false);
      }
    };

    obtenerSlotsReales();

    return () => {
      cancelado = true;
    };
  }, [profesionalTurnoId, fechaTurno, feriados, mostrarModalNuevoTurno]);

  // Filtrar pacientes por DNI o Apellido / Nombre
  const pacientesFiltrados = pacientes.filter((p) => {
    if (!busquedaPaciente.trim()) return true;
    const busq = busquedaPaciente.toLowerCase().trim();
    const dni = p.person?.documentId?.toLowerCase() || '';
    const nombre = p.person?.firstName?.toLowerCase() || '';
    const apellido = p.person?.lastName?.toLowerCase() || '';
    const nombreCompleto = `${nombre} ${apellido}`;

    return dni.includes(busq) || apellido.includes(busq) || nombre.includes(busq) || nombreCompleto.includes(busq);
  });

  const turnosFiltrados = turnos.filter((t) => {
    const fechaTurno = t.appointmentDate
      ? t.appointmentDate.substring(0, 10)
      : t.timeSlot?.agenda?.date
      ? t.timeSlot.agenda.date.substring(0, 10)
      : '';
    if (filtroFecha && fechaTurno !== filtroFecha) return false;
    if (filtroProfesionalId && t.professional?.id !== filtroProfesionalId) return false;
    return true;
  });

  const manejarCrearAgendaDiaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profesionalAgendaId || !fechaAgenda) {
      alMostrarNotificacion('advertencia', 'Campos incompletos', 'Seleccioná el kinesiólogo y la fecha para generar la agenda.');
      return;
    }

    try {
      const nuevaAgenda = await servicioAgenda.crearAgendaDiaria({
        professionalId: profesionalAgendaId,
        date: fechaAgenda,
        startHour: Number(horaInicio),
        endHour: Number(horaFin),
        maxCapacity: Number(maxCapacityAgenda),
      });

      setAgendas((prev) => [...prev, nuevaAgenda]);
      alMostrarNotificacion('exito', 'Agenda creada', `Se generaron los slots con capacidad inicial N=${maxCapacityAgenda}.`);
      setMostrarModalAgenda(false);
      cargarDatosControl();
    } catch (err: any) {
      const msj = err.message || '';
      if (msj.includes('UNIQUE constraint') || msj.includes('Ya existe') || msj.includes('409') || msj.includes('registrados')) {
        alMostrarNotificacion('advertencia', 'Agenda ya existente', 'Ya existe una agenda de atención creada para este kinesiólogo en la fecha seleccionada.');
      } else {
        alMostrarNotificacion('error', 'Fallo al generar agenda', msj || 'No se pudo crear la agenda diaria.');
      }
    }
  };

  const manejarAjustarCapacidadAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaEditarCapacidadId || nuevaCapacidadN < 1) {
      alMostrarNotificacion('advertencia', 'Datos incompletos', 'Seleccioná la agenda e ingresá una capacidad válida (N >= 1).');
      return;
    }

    setGuardandoCapacidad(true);
    try {
      if (agendaEditarCapacidadId === 'TODAS') {
        await servicioAgenda.actualizarCapacidadGlobal(nuevaCapacidadN);
        alMostrarNotificacion('exito', 'Capacidad Global Aplicada', `Se aplicó N=${nuevaCapacidadN} a TODOS los slots del sistema.`);
      } else {
        await servicioAgenda.actualizarCapacidadAgenda(agendaEditarCapacidadId, nuevaCapacidadN);
        alMostrarNotificacion('exito', 'Capacidad Actualizada', `Se aplicó N=${nuevaCapacidadN} a todos los slots de la agenda.`);
      }
      setMostrarModalCapacidad(false);
      cargarDatosControl();
    } catch (err: any) {
      const msj = err.response?.data?.message || err.message || 'No se pudo actualizar la capacidad.';
      alMostrarNotificacion('error', 'Fallo al ajustar capacidad', msj);
    } finally {
      setGuardandoCapacidad(false);
    }
  };

  const manejarCargarTurnoStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pacienteSeleccionado) {
      alMostrarNotificacion('advertencia', 'Paciente requerido', 'Seleccioná un paciente de la lista antes de agendar.');
      return;
    }

    if (!profesionalTurnoId || !fechaTurno || !slotSeleccionadoId) {
      alMostrarNotificacion('advertencia', 'Datos incompletos', 'Completá el kinesiólogo, la fecha y seleccioná un horario disponible.');
      return;
    }

    setGuardandoTurno(true);

    try {
      const nuevoTurno = await servicioTurnos.crearTurno({
        patientId: pacienteSeleccionado.id,
        professionalId: profesionalTurnoId,
        timeSlotId: slotSeleccionadoId,
        appointmentDate: fechaTurno,
      });

      setTurnos((prev) => [nuevoTurno, ...prev]);
      alMostrarNotificacion(
        'exito',
        'Turno Agendado',
        `Se agendó con éxito el turno para ${pacienteSeleccionado.person?.firstName} ${pacienteSeleccionado.person?.lastName} el día ${fechaTurno}.`
      );

      setMostrarModalNuevoTurno(false);
      setPacienteSeleccionado(null);
      setBusquedaPaciente('');
      setSlotSeleccionadoId('');
      cargarDatosControl();
    } catch (err: any) {
      alMostrarNotificacion(
        'error',
        'Error al agendar turno',
        err.message || 'No se pudo agendar el turno. Verificá la disponibilidad con el backend.'
      );
    } finally {
      setGuardandoTurno(false);
    }
  };

  const confirmarCancelacionStaff = async () => {
    if (!turnoACancelar) return;
    try {
      await servicioTurnos.cancelarTurno(turnoACancelar.id);
      setTurnos((prev) =>
        prev.map((t) => (t.id === turnoACancelar.id ? { ...t, status: 'CANCELLED' } : t))
      );
      alMostrarNotificacion('exito', 'Turno cancelado', 'El turno fue marcado como cancelado por el staff. El cupo del horario fue liberado.');
      cargarDatosControl();
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error de cancelación', err.message || 'No se pudo cancelar el turno.');
    } finally {
      setTurnoACancelar(null);
    }
  };

  // Verificaciones de fecha bloqueada en modal
  const fechaObjTurno = fechaTurno ? new Date(fechaTurno + 'T00:00:00') : null;
  const diaSemanaTurno = fechaObjTurno ? fechaObjTurno.getDay() : null;
  const esFinDeSemanaTurno = diaSemanaTurno === 0 || diaSemanaTurno === 6;
  const esFeriadoTurno = fechaTurno ? feriados.some((f) => f.date === fechaTurno && f.type === 'TOTAL') : false;
  const esFechaBloqueadaTurno = esFinDeSemanaTurno || esFeriadoTurno;

  if (cargando) {
    return <EstadoCarga mensaje="Cargando panel de control de turnos..." pantallaCompleta />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animacion-fade-in">
      
      {/* HEADER DE CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-beige-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-verde-suave text-verde-principal">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-gray-900">Control y Gestión de Turnos</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Panel para el staff kinesiológico. Cargar turnos presenciales o telefónicos a pacientes, gestionar agenda diaria y slots.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setMostrarModalNuevoTurno(true);
              setBusquedaPaciente('');
              setPacienteSeleccionado(null);
              setSlotSeleccionadoId('');
            }}
            className="px-5 py-3 rounded-2xl bg-verde-principal hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Cargar Turno (Staff)
          </button>

          <button
            onClick={() => setMostrarModalAgenda(true)}
            className="px-4 py-3 rounded-2xl bg-beige-100 hover:bg-beige-200 text-gray-800 font-bold text-xs border border-beige-300 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-madera-700" />
            Generar Agenda Diaria
          </button>

          <button
            onClick={() => setMostrarModalCapacidad(true)}
            className="px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-all flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-amber-700" />
            Configurar Capacidad (N)
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-beige-100/60 p-4 rounded-2xl border border-beige-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Filter className="w-4 h-4 text-madera-700" />
          <span>Filtrar turnos:</span>
        </div>

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none"
          placeholder="Filtrar por fecha"
        />

        <select
          value={filtroProfesionalId}
          onChange={(e) => setFiltroProfesionalId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none"
        >
          <option value="">Todos los kinesiólogos</option>
          {profesionales.map((p) => (
            <option key={p.id} value={p.id}>
              {p.person ? `Lic. ${p.person.firstName} ${p.person.lastName}` : `Kinesiólogo #${p.id.substring(0, 6)}`}
            </option>
          ))}
        </select>
      </div>

      {/* LISTADO DE TURNOS */}
      <div className="bg-white rounded-3xl border border-beige-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-bold text-sm text-gray-900 flex justify-between items-center">
          <span>Listado de Turnos Solicitados ({turnosFiltrados.length})</span>
          {filtroFecha && (
            <button
              onClick={() => { setFiltroFecha(''); setFiltroProfesionalId(''); }}
              className="text-xs text-verde-principal hover:underline"
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        {turnosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No se encontraron turnos con los filtros seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-beige-50/50 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Paciente</th>
                  <th className="py-3 px-6">Kinesiólogo</th>
                  <th className="py-3 px-6">Fecha & Hora</th>
                  <th className="py-3 px-6">Estado</th>
                  <th className="py-3 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {turnosFiltrados.map((t) => {
                  const cancelado = t.status === 'CANCELLED';
                  const nombrePaciente = t.patient?.person
                    ? `${t.patient.person.lastName}, ${t.patient.person.firstName}`
                    : 'Paciente registrado';
                  const nombrePro = t.professional?.person
                    ? `${t.professional.person.firstName} ${t.professional.person.lastName}`
                    : 'Lic. Kinesiología';

                  const fechaStr = t.appointmentDate || t.timeSlot?.agenda?.date || '';
                  const fechaMostrar = fechaStr ? formatearFechaDisplay(fechaStr) : '-';

                  return (
                    <tr key={t.id} className="hover:bg-beige-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {nombrePaciente}
                        {t.patient?.person?.documentId && (
                          <span className="block text-[10px] text-gray-400 font-normal">
                            DNI: {t.patient.person.documentId}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-medium text-gray-700">
                        Lic. {nombrePro}
                      </td>

                      <td className="py-4 px-6 text-gray-600">
                        <div className="font-semibold text-gray-900">{fechaMostrar}</div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          {t.timeSlot ? `${t.timeSlot.startTime} hs` : '08:00 hs'}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            cancelado
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cancelado ? 'Cancelado' : 'Confirmado'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {!cancelado && (
                          <button
                            onClick={() => setTurnoACancelar(t)}
                            className="px-3 py-1.5 rounded-lg text-rose-600 border border-rose-200 hover:bg-rose-50 font-bold transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CARGAR TURNO A PACIENTE (STAFF) */}
      {mostrarModalNuevoTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-verde-suave text-verde-principal">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Cargar Turno a Paciente (Staff)</h3>
                  <p className="text-xs text-gray-500">Agendar turno presencial o telefónico sin requerir contraseña de app.</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalNuevoTurno(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={manejarCargarTurnoStaff} className="space-y-6">
              
              {/* PASO 1: BÚSQUEDA Y SELECCIÓN DE PACIENTE */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  1. Seleccionar Paciente (Buscar por DNI o Apellido/Nombre) *
                </label>

                {!pacienteSeleccionado ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={busquedaPaciente}
                        onChange={(e) => setBusquedaPaciente(e.target.value)}
                        placeholder="Ingresá DNI, apellido o nombre del paciente..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-verde-principal bg-beige-50/50"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-100 bg-white">
                      {pacientesFiltrados.length === 0 ? (
                        <p className="p-4 text-center text-xs text-gray-400">
                          No se encontraron pacientes registrados con esa búsqueda.
                        </p>
                      ) : (
                        pacientesFiltrados.map((p) => {
                          const nombreCompleto = p.person
                            ? `${p.person.firstName} ${p.person.lastName}`
                            : `Paciente #${p.id.substring(0, 6)}`;
                          const dni = p.person?.documentId || 'Sin DNI';
                          const obraSocial = p.obraSocial?.name || p.prepaga?.name || 'Particular';

                          return (
                            <div
                              key={p.id}
                              onClick={() => setPacienteSeleccionado(p)}
                              className="p-3 hover:bg-emerald-50/60 cursor-pointer transition-colors flex items-center justify-between"
                            >
                              <div>
                                <h5 className="text-xs font-bold text-gray-900">{nombreCompleto}</h5>
                                <p className="text-[11px] text-gray-500">
                                  DNI: <span className="font-semibold">{dni}</span> | Cobertura: <span className="text-verde-principal font-medium">{obraSocial}</span>
                                </p>
                              </div>
                              <span className="text-xs font-bold text-verde-principal hover:underline">
                                Seleccionar →
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-verde-principal text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900">
                          {pacienteSeleccionado.person?.firstName} {pacienteSeleccionado.person?.lastName}
                        </h4>
                        <p className="text-[11px] text-gray-600">
                          DNI: <span className="font-bold">{pacienteSeleccionado.person?.documentId}</span> | Obra Social: <span className="font-bold text-emerald-800">{pacienteSeleccionado.obraSocial?.name || 'Particular'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPacienteSeleccionado(null)}
                      className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* PASO 2: KINESIÓLOGO Y FECHA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-verde-principal" />
                    Kinesiólogo *
                  </label>
                  <select
                    value={profesionalTurnoId}
                    onChange={(e) => setProfesionalTurnoId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-verde-principal bg-white font-medium"
                    required
                  >
                    {profesionales.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.person ? `Lic. ${p.person.firstName} ${p.person.lastName}` : `Kinesiólogo #${p.id}`} ({p.specialty || 'Kinesiología'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-madera-700" />
                    Fecha del Turno *
                  </label>
                  <input
                    type="date"
                    value={fechaTurno}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setFechaTurno(e.target.value);
                      setSlotSeleccionadoId('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-verde-principal bg-white"
                    required
                  />
                </div>
              </div>

              {/* PASO 3: HORARIOS DISPONIBLES CON VALIDACION BACKEND */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-verde-principal" />
                  3. Seleccionar Horario Disponible *
                </label>

                {esFechaBloqueadaTurno ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                    <Ban className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Día no laborable para turnos</p>
                      <p className="text-[11px] text-amber-700">
                        {esFinDeSemanaTurno
                          ? 'El centro está cerrado los fines de semana (Sábados y Domingos).'
                          : 'La fecha seleccionada corresponde a un Feriado nacional/oficial registrado.'}
                      </p>
                    </div>
                  </div>
                ) : cargandoSlots ? (
                  <p className="p-3 rounded-xl bg-gray-50 text-gray-500 text-xs text-center animate-pulse">
                    Buscando horarios disponibles...
                  </p>
                ) : slotsDisponibles.length === 0 ? (
                  <p className="p-3 rounded-xl bg-gray-50 text-gray-500 text-xs text-center">
                    No hay slots configurados ni horarios para esta fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-44 overflow-y-auto p-1">
                    {slotsDisponibles.map((slot) => {
                      const now = new Date();
                      const endTimeStr = slot.endTime?.length === 5 ? slot.endTime + ':00' : slot.endTime || '';
                      const slotEnd = new Date(`${fechaTurno}T${endTimeStr}`);
                      const vencido = slotEnd.getTime() < now.getTime() || slot.status === 'EXPIRED';
                      const rawCap = slot.maxCapacity;
                      const maxCap = (!rawCap || rawCap === 1) ? 6 : rawCap;
                      const ocupado = (slot.currentBookings ?? 0) >= maxCap || slot.status === 'BLOCKED';
                      const deshabilitado = ocupado || vencido;
                      const seleccionado = slotSeleccionadoId === slot.id;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={deshabilitado}
                          onClick={() => setSlotSeleccionadoId(slot.id)}
                          className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                            vencido
                              ? 'border-purple-200 bg-purple-50 text-purple-400 cursor-not-allowed line-through'
                              : ocupado
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              : seleccionado
                              ? 'border-verde-principal bg-verde-suave text-verde-principal shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-gray-200 hover:border-emerald-300 text-gray-700 bg-white'
                          }`}
                        >
                          {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)} hs
                          <span className="block text-[9px] font-normal">
                            {vencido ? 'Finalizado' : ocupado ? 'Sin capacidad' : `${maxCap - (slot.currentBookings ?? 0)} de ${maxCap} disp.`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ACCIONES DEL FORMULARIO */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoTurno(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoTurno || !pacienteSeleccionado || !slotSeleccionadoId || esFechaBloqueadaTurno}
                  className="px-6 py-2.5 rounded-xl bg-verde-principal hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  {guardandoTurno ? (
                    'Agendando Turno...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Agendar Turno
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA AGENDA DIARIA */}
      {mostrarModalAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Generar Agenda Diaria de Atención</h3>
            <form onSubmit={manejarCrearAgendaDiaria} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kinesiólogo *</label>
                <select
                  value={profesionalAgendaId}
                  onChange={(e) => setProfesionalAgendaId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none"
                  required
                >
                  <option value="">Seleccioná kinesiólogo...</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.person ? `Lic. ${p.person.firstName} ${p.person.lastName}` : `Kinesiólogo #${p.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Atención *</label>
                <input
                  type="date"
                  value={fechaAgenda}
                  onChange={(e) => setFechaAgenda(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hora Inicio (hs)</label>
                  <input
                    type="number"
                    min={6}
                    max={20}
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hora Fin (hs)</label>
                  <input
                    type="number"
                    min={8}
                    max={22}
                    value={horaFin}
                    onChange={(e) => setHoraFin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Capacidad Máxima por Slot (N)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={maxCapacityAgenda}
                  onChange={(e) => setMaxCapacityAgenda(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  required
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Cantidad de turnos simultáneos otorgables por franja horaria.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalAgenda(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-verde-principal hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  Generar Slots
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR CAPACIDAD (N) */}
      {mostrarModalCapacidad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                Configurar Capacidad Máxima (N)
              </h3>
              <button
                onClick={() => setMostrarModalCapacidad(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Modificá la cantidad de turnos simultáneos (N) por slot time para una agenda diaria de atención.
            </p>

            <form onSubmit={manejarAjustarCapacidadAgenda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Seleccionar Agenda Diaria *</label>
                <select
                  value={agendaEditarCapacidadId}
                  onChange={(e) => setAgendaEditarCapacidadId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none bg-white font-medium"
                  required
                >
                  <option value="">Seleccioná agenda...</option>
                  <option value="TODAS" className="font-bold text-emerald-800">
                    🌟 TODAS LAS AGENDAS (Aplicar N a todos los slots del sistema)
                  </option>
                  {agendas.map((a) => {
                    const pro = profesionales.find((p) => p.id === a.professionalId);
                    const nombrePro = pro?.person ? `Lic. ${pro.person.firstName} ${pro.person.lastName}` : `Kinesiólogo #${a.professionalId.substring(0, 6)}`;
                    return (
                      <option key={a.id} value={a.id}>
                        Agenda {a.date} - {nombrePro}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nueva Capacidad Máxima (N) por Slot *</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={nuevaCapacidadN}
                  onChange={(e) => setNuevaCapacidadN(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none"
                  required
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Ejemplo: 5 o 6 turnos permitidos por franja de 1 hora.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalCapacidad(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCapacidad || !agendaEditarCapacidadId}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md disabled:opacity-50"
                >
                  {guardandoCapacidad ? 'Guardando...' : 'Aplicar Nueva Capacidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CANCELACION */}
      <ModalConfirmacion
        abierto={!!turnoACancelar}
        titulo="¿Cancelar turno del paciente?"
        mensaje={`¿Confirmás la cancelación del turno del paciente? Se enviará la notificación correspondiente.`}
        textoConfirmar="Cancelar turno"
        textoCancelar="Volver"
        tipoAccion="peligro"
        alConfirmar={confirmarCancelacionStaff}
        alCancelar={() => setTurnoACancelar(null)}
      />
    </div>
  );
};


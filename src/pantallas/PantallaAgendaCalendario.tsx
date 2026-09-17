import React, { useState, useEffect } from 'react';
import { 
  Calendar as IconoCalendario, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  User, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import type { Turno, Profesional, AgendaDiaria } from '../esquemas/tiposApi';
import { servicioTurnos } from '../servicios/servicioTurnos';
import { servicioProfesionales } from '../servicios/servicioProfesionales';
import { servicioAgenda } from '../servicios/servicioAgenda';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import { obtenerFechaLocalISO, crearFechaLocal } from '../utilidades/fechas';

interface PropiedadesPantallaAgendaCalendario {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

export const PantallaAgendaCalendario: React.FC<PropiedadesPantallaAgendaCalendario> = ({
  alMostrarNotificacion,
}) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [agendas, setAgendas] = useState<AgendaDiaria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros de búsqueda
  const hoyISO = obtenerFechaLocalISO();
  const [filtroFecha, setFiltroFecha] = useState<string>(hoyISO);
  const [filtroProfesionalId, setFiltroProfesionalId] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // Modal Crear Agenda
  const [mostrarModalAgenda, setMostrarModalAgenda] = useState<boolean>(false);
  const [profesionalAgendaId, setProfesionalAgendaId] = useState<string>('');
  const [fechaAgenda, setFechaAgenda] = useState<string>(hoyISO);
  const [horaInicio, setHoraInicio] = useState<number>(8);
  const [horaFin, setHoraFin] = useState<number>(18);

  // Turno seleccionado para detalle/cancelación
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState<boolean>(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaTurnos, listaProfesionales, listaAgendas] = await Promise.all([
        servicioTurnos.obtenerTurnos().catch(() => []),
        servicioProfesionales.obtenerProfesionales().catch(() => []),
        servicioAgenda.obtenerAgendasDiarias().catch(() => []),
      ]);

      setTurnos(listaTurnos);
      setProfesionales(listaProfesionales);
      setAgendas(listaAgendas);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cargar agenda', err.message || 'No se pudieron recuperar los datos de la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cambiar día con botones < y >
  const navegarDia = (dias: number) => {
    const d = crearFechaLocal(filtroFecha);
    d.setDate(d.getDate() + dias);
    setFiltroFecha(obtenerFechaLocalISO(d));
  };

  // Filtrado de turnos asociados de la BD estrictamente por la fecha agendada
  const turnosFiltrados = turnos.filter((t) => {
    const fechaTurno = t.appointmentDate 
      ? t.appointmentDate.substring(0, 10) 
      : (t.timeSlot as any)?.agenda?.date 
      ? (t.timeSlot as any).agenda.date.substring(0, 10) 
      : '';

    if (filtroFecha && fechaTurno !== filtroFecha) return false;
    if (filtroProfesionalId && t.professional?.id !== filtroProfesionalId) return false;
    if (filtroEstado !== 'TODOS' && t.status !== filtroEstado) return false;
    if (busquedaTexto.trim()) {
      const q = busquedaTexto.toLowerCase();
      const nombrePac = t.patient?.person ? `${t.patient.person.lastName} ${t.patient.person.firstName}`.toLowerCase() : '';
      const dni = t.patient?.person?.documentId || '';
      const obra = t.patient?.obraSocial?.name?.toLowerCase() || '';
      if (!nombrePac.includes(q) && !dni.includes(q) && !obra.includes(q)) return false;
    }
    return true;
  });

  // Generar slots visuales para la fecha seleccionada
  const horasFijas = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

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
        maxCapacity: 6,
      });

      setAgendas((prev) => [...prev, nuevaAgenda]);
      alMostrarNotificacion('exito', 'Agenda Creada', 'Se generaron los slots de atención en la base de datos PostgreSQL.');
      setMostrarModalAgenda(false);
      cargarDatos();
    } catch (err: any) {
      const msj = err.message || '';
      if (msj.includes('UNIQUE constraint') || msj.includes('409') || msj.includes('registrados')) {
        alMostrarNotificacion('advertencia', 'Agenda Ya Existente', 'Ya existe una agenda creada para este kinesiólogo en la fecha seleccionada.');
      } else {
        alMostrarNotificacion('error', 'Fallo al generar agenda', msj || 'No se pudo crear la agenda diaria.');
      }
    }
  };

  const cancelarTurno = async () => {
    if (!turnoSeleccionado) return;
    try {
      await servicioTurnos.cancelarTurno(turnoSeleccionado.id);
      setTurnos((prev) =>
        prev.map((t) => (t.id === turnoSeleccionado.id ? { ...t, status: 'CANCELLED' } : t))
      );
      alMostrarNotificacion('exito', 'Turno Cancelado', 'El turno fue cancelado exitosamente. El cupo quedó disponible para ser reservado nuevamente.');
      cargarDatos();
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cancelar', err.message || 'No se pudo cancelar el turno.');
    } finally {
      setMostrarModalDetalle(false);
      setTurnoSeleccionado(null);
    }
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando calendario y disponibilidad desde PostgreSQL..." pantallaCompleta />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animacion-fade-in text-[#2d3748] font-sans selection:bg-[#eaf3ee] selection:text-[#234e3d]">
      
      {/* HEADER DE LA PANTALLA AGENDA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#eaf3ee] text-[#598b76]">
              <IconoCalendario className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1a202c]">Agenda Kinesiológica</h1>
          </div>
          <p className="text-xs text-[#718096] font-medium mt-1">
            Calendario de turnos asociados y disponibilidades en tiempo real desde la BD.
          </p>
        </div>

        <button
          onClick={() => setMostrarModalAgenda(true)}
          className="px-5 py-3 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generar Slots de Agenda
        </button>
      </div>

      {/* PANEL DE FILTROS DE BÚSQUEDA CORRESPONDIENTE */}
      <div className="bg-white p-5 rounded-3xl border border-[#e8e6df] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1a202c]">
          <Filter className="w-4 h-4 text-[#598b76]" />
          <span>Filtros de búsqueda de agenda:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* BÚSQUEDA LIBRE PACIENTE / DNI / OBRA SOCIAL */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#a0aec0] absolute left-3.5 top-3" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Buscar paciente, DNI o cobertura..."
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76]"
            />
          </div>

          {/* NAVEGADOR DE FECHA */}
          <div className="flex items-center gap-1 bg-[#faf9f5] p-1 rounded-2xl border border-[#e8e6df]">
            <button
              onClick={() => navegarDia(-1)}
              className="p-1.5 rounded-xl hover:bg-white text-[#4a5568] transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="flex-1 bg-transparent text-xs font-bold text-[#1a202c] text-center focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => navegarDia(1)}
              className="p-1.5 rounded-xl hover:bg-white text-[#4a5568] transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* FILTRO KINESIÓLOGO */}
          <select
            value={filtroProfesionalId}
            onChange={(e) => setFiltroProfesionalId(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] bg-white focus:outline-none focus:border-[#598b76]"
          >
            <option value="">Todos los kinesiólogos</option>
            {profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                {p.person ? `Lic. ${p.person.firstName} ${p.person.lastName}` : `Kinesiólogo #${p.id.substring(0, 6)}`}
              </option>
            ))}
          </select>

          {/* FILTRO ESTADO */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] bg-white focus:outline-none focus:border-[#598b76]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="CONFIRMED">Confirmados / Reservados</option>
            <option value="SCHEDULED">Programados</option>
            <option value="PENDING">Pendientes</option>
            <option value="COMPLETED">Completados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* VISTA PRINCIPAL: MATRIZ Y LISTADO DE TURNOS ASOCIADOS & DISPONIBLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA 1: DISPONIBILIDAD DE SLOTS HORARIOS (8 COLUMNAS) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6]">
            <h2 className="text-sm font-extrabold text-[#1a202c] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#598b76]" />
              Disponibilidad de Slots & Solapas &bull; {filtroFecha}
            </h2>
            <span className="text-xs font-bold text-[#598b76]">
              Agendas en BD: {agendas.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {horasFijas.map((hora) => {
              const turnosHora = turnosFiltrados.filter((t) => t.timeSlot?.startTime?.startsWith(hora));
              const hayOcupacion = turnosHora.length > 0;

              return (
                <div
                  key={hora}
                  className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e8e6df] space-y-3"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-[#1a202c]">
                    <span>{hora} - {parseInt(hora) + 1}:00 hs</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        hayOcupacion
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-[#eaf3ee] text-[#234e3d]'
                      }`}
                    >
                      {hayOcupacion ? `${turnosHora.length} Reservado` : 'Disponible'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[0, 10, 20, 30, 40, 50].map((min, idx) => {
                      const minStr = min.toString().padStart(2, '0');
                      const tiempoSlot = `${hora.split(':')[0]}:${minStr}`;
                      const turnoEncontrado = turnosHora.find((t) => t.timeSlot?.startTime?.includes(tiempoSlot));

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (turnoEncontrado) {
                              setTurnoSeleccionado(turnoEncontrado);
                              setMostrarModalDetalle(true);
                            } else {
                              alMostrarNotificacion('info', 'Slot Disponible', `Solapa libre ${tiempoSlot} hs para agendamiento.`);
                            }
                          }}
                          className={`p-2 rounded-xl text-center cursor-pointer transition-all ${
                            turnoEncontrado
                              ? 'bg-rose-100/80 hover:bg-rose-200 border border-rose-300 text-rose-800 font-bold'
                              : 'bg-white hover:bg-[#eaf3ee] border border-[#e8e6df] hover:border-[#598b76] text-[#2d3748] font-semibold'
                          }`}
                        >
                          <span className="block text-[8px] text-[#718096] uppercase">SUB-{idx + 1}</span>
                          <span className={`block text-[11px] ${turnoEncontrado ? 'line-through' : ''}`}>
                            {tiempoSlot}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA 2: TURNOS ASOCIADOS REGISTRADOS (4 COLUMNAS) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-[#1a202c] pb-3 border-b border-[#f0eee6] flex items-center gap-2">
            <User className="w-4 h-4 text-[#598b76]" />
            Turnos Asociados ({turnosFiltrados.length})
          </h2>

          {turnosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#718096] space-y-2">
              <AlertCircle className="w-6 h-6 text-[#a0aec0] mx-auto" />
              <p>No se encontraron turnos asociados con los filtros actuales.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {turnosFiltrados.map((t) => {
                const cancelado = t.status === 'CANCELLED';
                const nombrePac = t.patient?.person
                  ? `${t.patient.person.lastName}, ${t.patient.person.firstName}`
                  : 'Paciente Registrado';
                const proNombre = t.professional?.person
                  ? `${t.professional.person.firstName} ${t.professional.person.lastName}`
                  : 'Lic. Kinesiología';

                const fechaFormateada = t.appointmentDate
                  ? (t.appointmentDate.includes('-')
                      ? `${t.appointmentDate.split('-')[2]}/${t.appointmentDate.split('-')[1]}/${t.appointmentDate.split('-')[0]}`
                      : t.appointmentDate)
                  : filtroFecha;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setTurnoSeleccionado(t);
                      setMostrarModalDetalle(true);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      cancelado
                        ? 'bg-rose-50/50 border-rose-200 opacity-80'
                        : 'bg-[#faf9f5] hover:bg-white border-[#e8e6df] hover:border-[#598b76] shadow-2xs'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-xs text-[#1a202c]">{nombrePac}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          cancelado ? 'bg-rose-200 text-rose-800' : 'bg-[#eaf3ee] text-[#234e3d]'
                        }`}
                      >
                        {cancelado ? 'Cancelado' : 'Confirmado'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#718096] space-y-0.5">
                      <p>Lic. {proNombre}</p>
                      <p className="font-medium text-[#4a5568]">
                        📅 {fechaFormateada} &bull; ⏰ {t.timeSlot ? `${t.timeSlot.startTime} hs` : '08:00 hs'}
                      </p>
                      {t.patient?.obraSocial?.name && (
                        <p className="text-[10px] text-[#598b76] font-semibold">
                          Obra Social: {t.patient.obraSocial.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE DE TURNO SELECCIONADO */}
      {mostrarModalDetalle && turnoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animacion-fade-in">
            <div className="flex justify-between items-center border-b border-[#f0eee6] pb-3">
              <h3 className="text-base font-extrabold text-[#1a202c]">Detalle del Turno</h3>
              <button
                onClick={() => setMostrarModalDetalle(false)}
                className="text-[#a0aec0] hover:text-[#1a202c] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4a5568]">
              <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#e8e6df] space-y-1">
                <span className="text-[10px] font-bold text-[#718096] uppercase">Paciente</span>
                <p className="font-bold text-sm text-[#1a202c]">
                  {turnoSeleccionado.patient?.person
                    ? `${turnoSeleccionado.patient.person.lastName}, ${turnoSeleccionado.patient.person.firstName}`
                    : 'Paciente BD'}
                </p>
                {turnoSeleccionado.patient?.person?.documentId && (
                  <p className="text-[11px] text-[#718096]">DNI: {turnoSeleccionado.patient.person.documentId}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#e8e6df]">
                  <span className="text-[10px] font-bold text-[#718096] uppercase">Kinesiólogo</span>
                  <p className="font-bold text-[#1a202c] mt-0.5">
                    Lic. {turnoSeleccionado.professional?.person?.lastName || 'Kinesiología'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#e8e6df]">
                  <span className="text-[10px] font-bold text-[#718096] uppercase">Horario</span>
                  <p className="font-bold text-[#1a202c] mt-0.5">
                    {turnoSeleccionado.timeSlot ? `${turnoSeleccionado.timeSlot.startTime} hs` : '09:00 hs'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setMostrarModalDetalle(false)}
                className="px-4 py-2.5 rounded-2xl bg-[#f0eee6] hover:bg-[#e8e6df] font-bold text-xs text-[#4a5568]"
              >
                Cerrar
              </button>
              {turnoSeleccionado.status !== 'CANCELLED' && (
                <button
                  onClick={cancelarTurno}
                  className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md"
                >
                  Cancelar Turno
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERAR NUEVA AGENDA DIARIA */}
      {mostrarModalAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animacion-fade-in">
            <h3 className="text-base font-extrabold text-[#1a202c]">Generar Agenda Diaria de Atención</h3>
            <form onSubmit={manejarCrearAgendaDiaria} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Kinesiólogo *</label>
                <select
                  value={profesionalAgendaId}
                  onChange={(e) => setProfesionalAgendaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs focus:outline-none"
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
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Fecha de Atención *</label>
                <input
                  type="date"
                  value={fechaAgenda}
                  onChange={(e) => setFechaAgenda(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2d3748] mb-1">Hora Inicio (hs)</label>
                  <input
                    type="number"
                    min={6}
                    max={20}
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-[#e2e8f0] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2d3748] mb-1">Hora Fin (hs)</label>
                  <input
                    type="number"
                    min={8}
                    max={22}
                    value={horaFin}
                    onChange={(e) => setHoraFin(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-[#e2e8f0] text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalAgenda(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#4a5568] hover:bg-[#f0eee6] rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#598b76] hover:bg-[#487361] rounded-2xl shadow-md"
                >
                  Generar Slots en PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

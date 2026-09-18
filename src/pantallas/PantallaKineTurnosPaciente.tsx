import React, { useState, useEffect } from 'react';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { servicioTurnos } from '../servicios/servicioTurnos';
import { servicioProfesionales } from '../servicios/servicioProfesionales';
import { servicioObrasSociales } from '../servicios/servicioObrasSociales';
import { servicioAgenda } from '../servicios/servicioAgenda';
import { servicioTratamientos } from '../servicios/servicioTratamientos';
import type { 
  Turno, 
  Profesional, 
  ObraSocial, 
  SlotHorario, 
  Tratamiento, 
  AgendaDiaria 
} from '../esquemas/tiposApi';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import { ModalConfirmacion } from '../componentes/comunes/ModalConfirmacion';
import { 
  Calendar, 
  PlusCircle, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  CheckCircle, 
  XCircle
} from 'lucide-react';

interface PropiedadesPantallaKineTurnosPaciente {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

import { obtenerFechaLocalISO } from '../utilidades/fechas';

export const PantallaKineTurnosPaciente: React.FC<PropiedadesPantallaKineTurnosPaciente> = ({
  alMostrarNotificacion,
}) => {
  const { usuario } = useAutenticacion();

  // Estados de datos
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [agendas, setAgendas] = useState<AgendaDiaria[]>([]);

  // Estados UI
  const [pestaña, setPestaña] = useState<'mis-turnos' | 'solicitar-turno' | 'mis-tratamientos'>('mis-turnos');
  const [cargando, setCargando] = useState<boolean>(true);
  const [procesandoAccion, setProcesandoAccion] = useState<boolean>(false);

  // Modal Cancelación
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null);

  // Estado del Formulario de Reserva de Turno
  const [profesionalSeleccionadoId, setProfesionalSeleccionadoId] = useState<string>('');
  const [obraSocialSeleccionadaId, setObraSocialSeleccionadaId] = useState<string>('');
  const [fechaTurno, setFechaTurno] = useState<string>(obtenerFechaLocalISO());
  const [slotSeleccionadoId, setSlotSeleccionadoId] = useState<string>('');
  const [slotsDisponibles, setSlotsDisponibles] = useState<SlotHorario[]>([]);

  // Cargar datos iniciales del paciente
  const cargarDatosPaciente = async () => {
    setCargando(true);
    try {
      const [listaTurnos, listaProfesionales, listaObras, listaTratamientos, listaAgendas] = await Promise.all([
        servicioTurnos.obtenerMisTurnos().catch(() => []),
        servicioProfesionales.obtenerProfesionales().catch(() => []),
        servicioObrasSociales.obtenerObrasSociales().catch(() => []),
        servicioTratamientos.obtenerTratamientos().catch(() => []),
        servicioAgenda.obtenerAgendas().catch(() => []),
      ]);

      setTurnos(listaTurnos);
      setProfesionales(listaProfesionales);
      setObrasSociales(listaObras);
      setTratamientos(listaTratamientos);
      setAgendas(listaAgendas);
    } catch (err: any) {
      alMostrarNotificacion(
        'error',
        'Error de sincronización',
        err.message || 'No se pudieron cargar tus datos kinesiológicos. Verificá tu conexión a internet.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosPaciente();
  }, []);

  // Actualizar slots con UUID reales de la BD cuando cambia profesional o fecha
  useEffect(() => {
    let cancelado = false;

    const obtenerSlotsRealesPaciente = async () => {
      if (!profesionalSeleccionadoId || !fechaTurno) {
        setSlotsDisponibles([]);
        return;
      }

      try {
        let agendaCoincidente = agendas.find(
          (a) => a.professionalId === profesionalSeleccionadoId && (a.date ? a.date.substring(0, 10) : '') === fechaTurno.substring(0, 10)
        );

        if (!agendaCoincidente) {
          const listaAgendasBD = await servicioAgenda.obtenerAgendas().catch(() => []);
          setAgendas(listaAgendasBD);
          agendaCoincidente = listaAgendasBD.find(
            (a) => a.professionalId === profesionalSeleccionadoId && (a.date ? a.date.substring(0, 10) : '') === fechaTurno.substring(0, 10)
          );
        }

        if (cancelado) return;

        if (agendaCoincidente && agendaCoincidente.id) {
          const slotsBD = await servicioAgenda.obtenerSlotsDeAgenda(agendaCoincidente.id);
          if (!cancelado) {
            setSlotsDisponibles(slotsBD.filter((s) => s.currentBookings < s.maxCapacity && s.status !== 'BOOKED' && s.status !== 'BLOCKED' && s.status !== 'EXPIRED'));
          }
        } else {
          try {
            const nuevaAgenda = await servicioAgenda.crearAgendaDiaria({
              professionalId: profesionalSeleccionadoId,
              date: fechaTurno,
              startHour: 8,
              endHour: 18,
              maxCapacity: 6,
            });
            if (nuevaAgenda && nuevaAgenda.id) {
              const slotsBD = await servicioAgenda.obtenerSlotsDeAgenda(nuevaAgenda.id);
              if (!cancelado) {
                setSlotsDisponibles(slotsBD.filter((s) => s.currentBookings < s.maxCapacity && s.status !== 'BOOKED' && s.status !== 'BLOCKED' && s.status !== 'EXPIRED'));
              }
            }
          } catch {
            const todosSlots = await servicioAgenda.obtenerTimeSlots().catch(() => []);
            if (!cancelado) {
              setSlotsDisponibles(todosSlots.filter((s) => s.currentBookings < s.maxCapacity && s.status !== 'BOOKED' && s.status !== 'BLOCKED' && s.status !== 'EXPIRED'));
            }
          }
        }
      } catch {
        if (!cancelado) setSlotsDisponibles([]);
      }
    };

    obtenerSlotsRealesPaciente();

    return () => {
      cancelado = true;
    };
  }, [profesionalSeleccionadoId, fechaTurno]);

  // Manejar reserva de turno
  const manejarConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profesionalSeleccionadoId || !slotSeleccionadoId || !fechaTurno) {
      alMostrarNotificacion('advertencia', 'Datos incompletos', 'Por favor, seleccioná un kinesiólogo, fecha y horario disponible.');
      return;
    }

    setProcesandoAccion(true);
    try {
      const idPaciente = usuario?.person?.id || 'paciente-demo-id';
      const nuevoTurno = await servicioTurnos.crearTurno({
        patientId: idPaciente,
        professionalId: profesionalSeleccionadoId,
        timeSlotId: slotSeleccionadoId,
        appointmentDate: fechaTurno,
      });

      setTurnos((prev) => [nuevoTurno, ...prev]);
      alMostrarNotificacion('exito', '¡Turno reservado!', 'Tu turno kinesiológico fue agendado con éxito. Te esperamos en el centro.');
      setPestaña('mis-turnos');
      setSlotSeleccionadoId('');
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al reservar', err.message || 'No se pudo reservar el turno kinesiológico. Intentá nuevamente.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejar cancelación de turno
  const confirmarCancelacion = async () => {
    if (!turnoACancelar) return;

    setProcesandoAccion(true);
    try {
      await servicioTurnos.cancelarTurno(turnoACancelar.id);
      setTurnos((prev) =>
        prev.map((t) => (t.id === turnoACancelar.id ? { ...t, status: 'CANCELLED' } : t))
      );
      alMostrarNotificacion('exito', 'Turno cancelado', 'Tu turno fue cancelado con éxito. El horario ha quedado disponible para ser asignado nuevamente.');
      cargarDatosPaciente();
    } catch (err: any) {
      alMostrarNotificacion('error', 'No se pudo cancelar', err.message || 'Ocurrió un error al procesar la cancelación del turno.');
    } finally {
      setProcesandoAccion(false);
      setTurnoACancelar(null);
    }
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando tus turnos kinesiológicos..." pantallaCompleta />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animacion-fade-in">
      
      {/* BANNER BIENVENIDA PACIENTE */}
      <div className="bg-gradient-to-r from-verde-principal via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <span className="text-xs uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full text-emerald-100 backdrop-blur-xs">
            App KineTurnos Paciente
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Hola, {usuario?.person?.firstName || 'Paciente'} 👋
          </h1>
          <p className="text-sm text-emerald-100 max-w-xl">
            Consultá tus próximos turnos kinesiológicos, gestioná la cobertura de tu obra social y reservá nuevas sesiones de rehabilitación.
          </p>
        </div>

        <button
          onClick={() => setPestaña('solicitar-turno')}
          className="z-10 px-6 py-3.5 rounded-2xl bg-white text-verde-principal font-bold text-sm shadow-lg hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5 text-verde-principal" />
          Solicitar Nuevo Turno
        </button>
      </div>

      {/* NAVEGACION PESTAÑAS */}
      <div className="flex border-b border-beige-200 gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setPestaña('mis-turnos')}
          className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            pestaña === 'mis-turnos'
              ? 'border-verde-principal text-verde-principal'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Mis Turnos Kinesiológicos ({turnos.length})
        </button>

        <button
          onClick={() => setPestaña('solicitar-turno')}
          className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            pestaña === 'solicitar-turno'
              ? 'border-verde-principal text-verde-principal'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Solicitar Turno
        </button>

        <button
          onClick={() => setPestaña('mis-tratamientos')}
          className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            pestaña === 'mis-tratamientos'
              ? 'border-verde-principal text-verde-principal'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Tratamientos Prescriptos ({tratamientos.length})
        </button>
      </div>

      {/* CONTENIDO 1: MIS TURNOS */}
      {pestaña === 'mis-turnos' && (
        <div className="space-y-6">
          {turnos.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-beige-200 shadow-sm space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-verde-suave text-verde-principal mx-auto flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No tenés turnos programados</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Aún no solicitaste ningún turno de kinesiología. Podés agendar una sesión seleccionando tu profesional y horario preferido.
              </p>
              <button
                onClick={() => setPestaña('solicitar-turno')}
                className="px-6 py-2.5 rounded-xl bg-verde-principal text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all"
              >
                Solicitar Turno Ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {turnos.map((turno) => {
                const esCancelado = turno.status === 'CANCELLED';
                const esFinalizado = turno.status === 'COMPLETED';
                const nombrePro = turno.professional?.person
                  ? `${turno.professional.person.firstName} ${turno.professional.person.lastName}`
                  : 'Lic. Kinesiología';
                const especialidad = turno.professional?.specialty || 'Kinesiología General y Fisioterapia';

                return (
                  <div
                    key={turno.id}
                    className={`bg-white rounded-3xl p-6 border shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                      esCancelado ? 'border-gray-200 opacity-60 bg-gray-50' : esFinalizado ? 'border-purple-200 bg-purple-50/30' : 'border-beige-200 hover:shadow-md hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                            esCancelado
                              ? 'bg-rose-100 text-rose-700'
                              : esFinalizado
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {esCancelado ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {esCancelado ? 'Cancelado' : esFinalizado ? 'Finalizado' : 'Turno Confirmado'}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          ID: #{turno.id.substring(0, 8)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-gray-900">{nombrePro}</h4>
                        <p className="text-xs text-verde-principal font-semibold mt-0.5">{especialidad}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="w-4 h-4 text-madera-700 shrink-0" />
                          <span className="font-bold">
                            {(() => {
                              const f = turno.appointmentDate || (turno.timeSlot as any)?.agenda?.date;
                              if (!f) return 'Fecha a confirmar';
                              const partes = f.split('T')[0].split('-');
                              return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : f;
                            })()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-4 h-4 text-madera-700 shrink-0" />
                          <span>
                            {turno.timeSlot ? `${turno.timeSlot.startTime} hs` : '09:00 hs'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!esCancelado && !esFinalizado && (
                      <div className="pt-5 mt-4 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => setTurnoACancelar(turno)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                        >
                          Cancelar Turno
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO 2: SOLICITAR TURNO */}
      {pestaña === 'solicitar-turno' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-beige-200 shadow-md max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Solicitud de Turno Kinesiológico</h3>
            <p className="text-xs text-gray-500 mt-1">
              Completá los datos requeridos para agendar tu sesión con un profesional del equipo.
            </p>
          </div>

          <form onSubmit={manejarConfirmarReserva} className="space-y-5">
            {/* PASO 1: SELECCION DE OBRA SOCIAL */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-madera-700" />
                Obra Social / Prepaga
              </label>
              <select
                value={obraSocialSeleccionadaId}
                onChange={(e) => setObraSocialSeleccionadaId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-verde-principal bg-beige-50/50"
              >
                <option value="">Particular / Sin Obra Social</option>
                {obrasSociales.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.name} {os.coverageDetails ? `(${os.coverageDetails})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* PASO 2: SELECCION DE KINESIOLOGO */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-verde-principal" />
                Kinesiólogo / Profesional *
              </label>
              <select
                value={profesionalSeleccionadoId}
                onChange={(e) => setProfesionalSeleccionadoId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-verde-principal bg-white font-medium"
                required
              >
                <option value="">Seleccioná un kinesiólogo...</option>
                {profesionales.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.person ? `Lic. ${p.person.firstName} ${p.person.lastName}` : `Kinesiólogo #${p.id.substring(0, 6)}`} ({p.specialty || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* PASO 3: FECHA DEL TURNO */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-madera-700" />
                Fecha del Turno *
              </label>
              <input
                type="date"
                value={fechaTurno}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFechaTurno(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-verde-principal bg-white"
                required
              />
            </div>

            {/* PASO 4: HORARIO DISPONIBLE */}
            {profesionalSeleccionadoId && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-verde-principal" />
                  Horarios Disponibles para {fechaTurno} *
                </label>
                {slotsDisponibles.length === 0 ? (
                  <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl">
                    No hay horarios disponibles para esta fecha con el profesional seleccionado. Intentá con otra fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slotsDisponibles.map((slot) => {
                      const seleccionado = slotSeleccionadoId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSlotSeleccionadoId(slot.id)}
                          className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                            seleccionado
                              ? 'border-verde-principal bg-verde-suave text-verde-principal shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-gray-200 hover:border-emerald-300 text-gray-700 bg-white'
                          }`}
                        >
                          {slot.startTime} - {slot.endTime} hs
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* BOTON CONFIRMAR */}
            <button
              type="submit"
              disabled={procesandoAccion || !profesionalSeleccionadoId || !slotSeleccionadoId}
              className="w-full py-4 rounded-2xl bg-verde-principal hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-teal-700/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 mt-4"
            >
              {procesandoAccion ? 'Confirmando turno...' : 'Confirmar Reserva de Turno'}
            </button>
          </form>
        </div>
      )}

      {/* CONTENIDO 3: TRATAMIENTOS PRESCRIPTOS */}
      {pestaña === 'mis-tratamientos' && (
        <div className="space-y-6">
          {tratamientos.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-beige-200 shadow-sm space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-madera-suave text-madera-700 mx-auto flex items-center justify-center">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No tenés tratamientos activos</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Los tratamientos indicados por tu kinesiólogo aparecerán aquí con el detalle de sesiones prescritas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tratamientos.map((t) => (
                <div key={t.id} className="bg-white rounded-3xl p-6 border border-beige-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-madera-700 bg-madera-suave px-3 py-1 rounded-full">
                      Tratamiento Kinesiológico
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                      {t.totalSessions} Sesiones
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-gray-900">{t.description}</h4>
                  <p className="text-xs text-gray-500">
                    Prescripto por: {t.prescribingProfessional?.person ? `Lic. ${t.prescribingProfessional.person.firstName} ${t.prescribingProfessional.person.lastName}` : 'Kinesiólogo tratante'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACION DE CANCELACION */}
      <ModalConfirmacion
        abierto={!!turnoACancelar}
        titulo="¿Cancelar turno kinesiológico?"
        mensaje={`¿Estás seguro de que querés cancelar tu turno del ${turnoACancelar?.appointmentDate || 'día seleccionado'}? Esta acción libera el horario para otro paciente.`}
        textoConfirmar="Sí, cancelar turno"
        textoCancelar="No, mantener turno"
        tipoAccion="peligro"
        alConfirmar={confirmarCancelacion}
        alCancelar={() => setTurnoACancelar(null)}
      />
    </div>
  );
};

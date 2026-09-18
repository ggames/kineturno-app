import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Ban, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Info
} from 'lucide-react';
import type { Feriado, TipoFeriado, PeticionCrearFeriado } from '../esquemas/tiposApi';
import { servicioFeriados } from '../servicios/servicioFeriados';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';

interface PropiedadesPantallaGestionFeriados {
  alMostrarNotificacion: (
    tipo: 'exito' | 'error' | 'advertencia' | 'info',
    titulo: string,
    mensaje: string
  ) => void;
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

export const PantallaGestionFeriados: React.FC<PropiedadesPantallaGestionFeriados> = ({
  alMostrarNotificacion,
}) => {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [feriadoEliminarId, setFeriadoEliminarId] = useState<string | null>(null);

  // Formulario
  const hoyISO = new Date().toISOString().substring(0, 10);
  const [fecha, setFecha] = useState<string>(hoyISO);
  const [tipo, setTipo] = useState<TipoFeriado>('TOTAL');
  const [descripcion, setDescripcion] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('08:00');
  const [horaFin, setHoraFin] = useState<string>('12:00');

  const cargarFeriados = async () => {
    setCargando(true);
    try {
      const lista = await servicioFeriados.obtenerFeriados();
      lista.sort((a, b) => a.date.localeCompare(b.date));
      setFeriados(lista);
    } catch (err: any) {
      alMostrarNotificacion(
        'error',
        'Error al cargar feriados',
        err.message || 'No se pudieron recuperar los feriados cargados.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarFeriados();
  }, []);

  const manejarSubmitCrear = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fecha) {
      alMostrarNotificacion('advertencia', 'Fecha requerida', 'Por favor, seleccioná una fecha válida.');
      return;
    }

    if (!descripcion.trim()) {
      alMostrarNotificacion('advertencia', 'Motivo requerido', 'Por favor, escribí el motivo o descripción del feriado.');
      return;
    }

    if (tipo === 'PARTIAL' && horaInicio >= horaFin) {
      alMostrarNotificacion('advertencia', 'Horario inválido', 'La hora de inicio del asueto parcial debe ser menor a la de fin.');
      return;
    }

    setGuardando(true);
    try {
      const peticion: PeticionCrearFeriado = {
        date: fecha,
        type: tipo,
        description: descripcion.trim(),
        ...(tipo === 'PARTIAL' ? { partialStartTime: horaInicio, partialEndTime: horaFin } : {}),
      };

      await servicioFeriados.crearFeriado(peticion);
      alMostrarNotificacion('exito', 'Feriado registrado', `Se agregó "${descripcion.trim()}" al calendario.`);
      
      setDescripcion('');
      cargarFeriados();
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al guardar', err.message || 'No se pudo registrar el feriado.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!feriadoEliminarId) return;

    try {
      await servicioFeriados.eliminarFeriado(feriadoEliminarId);
      alMostrarNotificacion('info', 'Feriado eliminado', 'El feriado ha sido removido del sistema.');
      setFeriadoEliminarId(null);
      cargarFeriados();
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al eliminar', err.message || 'No se pudo eliminar el feriado.');
    }
  };

  const feriadosTotalesCount = feriados.filter((f) => f.type === 'TOTAL').length;
  const feriadosParcialesCount = feriados.filter((f) => f.type === 'PARTIAL').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animacion-fade-in text-[#2d3748]">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf3ee] text-[#598b76] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo Administrativo</span>
          </div>
          <h1 className="text-2xl font-black text-[#1a202c]">Gestión de Feriados y Asuetos</h1>
          <p className="text-xs text-[#718096] mt-1">
            Configurá días no laborables para bloquear la agenda y la selección de turnos automáticamente.
          </p>
        </div>
      </div>

      {/* METRICAS RAPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-[#e8e6df] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eaf3ee] text-[#598b76] flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#718096]">Total Feriados</p>
            <h3 className="text-2xl font-black text-[#1a202c]">{feriados.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#e8e6df] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#718096]">Días Completos (Total)</p>
            <h3 className="text-2xl font-black text-[#1a202c]">{feriadosTotalesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#e8e6df] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#718096]">Asuetos Parciales</p>
            <h3 className="text-2xl font-black text-[#1a202c]">{feriadosParcialesCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO DE ALTA */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm space-y-5 h-fit">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#eaf3ee] text-[#598b76] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-base text-[#1a202c]">Registrar Nuevo Feriado</h2>
          </div>

          <form onSubmit={manejarSubmitCrear} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2d3748] mb-1">
                Fecha del feriado / asueto *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76] focus:ring-2 focus:ring-[#eaf3ee]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2d3748] mb-1">
                Tipo de Inhabilitación *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoFeriado)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76] focus:ring-2 focus:ring-[#eaf3ee]"
              >
                <option value="TOTAL">Feriado Completo / Día Inhábil Total</option>
                <option value="PARTIAL">Asueto Parcial (Franja Horaria)</option>
              </select>
            </div>

            {tipo === 'PARTIAL' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#f8f7f4] border border-[#e8e6df]">
                <div>
                  <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#e2e8f0] text-xs bg-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#e2e8f0] text-xs bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#2d3748] mb-1">
                Motivo / Descripción *
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Día de la Independencia"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76] focus:ring-2 focus:ring-[#eaf3ee]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-xs shadow-md shadow-[#598b76]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {guardando ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Guardar Feriado</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* LISTADO DE FERIADOS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-[#1a202c]">Calendario de Feriados Registrados</h2>
            <span className="text-xs text-[#718096] font-medium">{feriados.length} registros</span>
          </div>

          {cargando ? (
            <EstadoCarga mensaje="Cargando feriados registrados..." />
          ) : feriados.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-[#f8f7f4] rounded-2xl border border-dashed border-[#e8e6df]">
              <Info className="w-10 h-10 text-[#a0aec0] mx-auto" />
              <p className="text-sm font-bold text-[#4a5568]">No hay feriados cargados</p>
              <p className="text-xs text-[#718096] max-w-sm mx-auto">
                Registrá fechas especiales o feriados nacionales usando el formulario lateral para bloquear turnos automáticos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e6df] text-[11px] font-bold text-[#718096] uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Motivo / Descripción</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e6df] text-xs">
                  {feriados.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8f7f4] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#1a202c]">
                        {formatearFechaDisplay(item.date)}
                      </td>
                      <td className="py-3.5 px-4 text-[#4a5568] font-medium">
                        {item.description || 'Feriado / Asueto'}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.type === 'TOTAL' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                            <Ban className="w-3 h-3 text-rose-500" />
                            Día Completo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {item.partialStartTime || '08:00'} a {item.partialEndTime || '12:00'} hs
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setFeriadoEliminarId(item.id)}
                          title="Eliminar feriado"
                          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL CONFIRMACION DE ELIMINACION */}
      {feriadoEliminarId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-white/80 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-[#1a202c]">¿Eliminar feriado?</h3>
              <p className="text-xs text-[#718096]">
                Esta acción removerá el bloqueo de horarios para la fecha correspondiente y permitirá reservar turnos nuevamente.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setFeriadoEliminarId(null)}
                className="flex-1 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs font-bold text-[#4a5568] hover:bg-[#f8f7f4] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PantallaGestionFeriados;

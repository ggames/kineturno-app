import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import type { ObraSocial } from '../esquemas/tiposApi';
import { servicioObrasSociales } from '../servicios/servicioObrasSociales';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';

interface PropiedadesPantallaGestionObrasSociales {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

export const PantallaGestionObrasSociales: React.FC<PropiedadesPantallaGestionObrasSociales> = ({
  alMostrarNotificacion,
}) => {
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // Modales
  const [mostrarModalCrear, setMostrarModalCrear] = useState<boolean>(false);
  const [obraSocialEditar, setObraSocialEditar] = useState<ObraSocial | null>(null);
  const [obraSocialEliminar, setObraSocialEliminar] = useState<ObraSocial | null>(null);

  // Formulario estados (Crear / Editar)
  const [nombre, setNombre] = useState<string>('');
  const [detallesCobertura, setDetallesCobertura] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  const cargarObrasSociales = async () => {
    setCargando(true);
    try {
      const lista = await servicioObrasSociales.obtenerObrasSociales();
      setObrasSociales(lista);
    } catch (err: any) {
      alMostrarNotificacion(
        'error',
        'Error de carga',
        err.message || 'No se pudieron recuperar las obras sociales.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarObrasSociales();
  }, []);

  const abrirModalCrear = () => {
    setNombre('');
    setDetallesCobertura('');
    setMostrarModalCrear(true);
  };

  const abrirModalEditar = (os: ObraSocial) => {
    setObraSocialEditar(os);
    setNombre(os.name);
    setDetallesCobertura(os.coverageDetails || '');
  };

  const manejarGuardarNueva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alMostrarNotificacion('advertencia', 'Nombre requerido', 'Ingresá el nombre de la obra social.');
      return;
    }

    setGuardando(true);
    try {
      const nueva = await servicioObrasSociales.crearObraSocial({
        name: nombre.trim(),
        coverageDetails: detallesCobertura.trim() || undefined,
      });

      setObrasSociales((prev) => [...prev, nueva]);
      alMostrarNotificacion('exito', 'Obra Social Creada', `Se registró "${nueva.name}" correctamente.`);
      setMostrarModalCrear(false);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al guardar', err.message || 'No se pudo registrar la obra social.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraSocialEditar || !nombre.trim()) return;

    setGuardando(true);
    try {
      const actualizada = await servicioObrasSociales.actualizarObraSocial(obraSocialEditar.id, {
        name: nombre.trim(),
        coverageDetails: detallesCobertura.trim() || undefined,
      });

      setObrasSociales((prev) =>
        prev.map((os) => (os.id === actualizada.id ? actualizada : os))
      );
      alMostrarNotificacion('exito', 'Obra Social Actualizada', `Se actualizaron los datos de "${actualizada.name}".`);
      setObraSocialEditar(null);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al actualizar', err.message || 'No se pudo actualizar la obra social.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarConfirmarEliminacion = async () => {
    if (!obraSocialEliminar) return;

    try {
      await servicioObrasSociales.eliminarObraSocial(obraSocialEliminar.id);
      setObrasSociales((prev) => prev.filter((os) => os.id !== obraSocialEliminar.id));
      alMostrarNotificacion('exito', 'Obra Social Eliminada', `Se eliminó "${obraSocialEliminar.name}".`);
      setObraSocialEliminar(null);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al eliminar', err.message || 'No se pudo eliminar la obra social.');
    }
  };

  const obrasSocialesFiltradas = obrasSociales.filter((os) => {
    if (!busquedaTexto.trim()) return true;
    const q = busquedaTexto.toLowerCase();
    const matchName = os.name.toLowerCase().includes(q);
    const matchDetails = os.coverageDetails?.toLowerCase().includes(q) || false;
    return matchName || matchDetails;
  });

  if (cargando) {
    return <EstadoCarga mensaje="Cargando obras sociales desde la base de datos..." pantallaCompleta />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animacion-fade-in text-[#2d3748] font-sans selection:bg-[#eaf3ee] selection:text-[#234e3d]">
      
      {/* HEADER DE LA PANTALLA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#eaf3ee] text-[#598b76]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1a202c]">Gestión de Obras Sociales</h1>
          </div>
          <p className="text-xs text-[#718096] font-medium mt-1">
            Administración de coberturas y prepagas para completar datos de pacientes (opcional).
          </p>
        </div>

        <button
          onClick={abrirModalCrear}
          className="px-5 py-3 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Obra Social
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y CONTADORES */}
      <div className="bg-white p-5 rounded-3xl border border-[#e8e6df] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#a0aec0] absolute left-3.5 top-3" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Buscar obra social o detalle de cobertura..."
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76]"
            />
          </div>

          <div className="text-xs font-bold text-[#598b76] bg-[#eaf3ee] px-3.5 py-2 rounded-2xl border border-[#d2e4d9] shrink-0">
            Total Obras Sociales: {obrasSociales.length}
          </div>
        </div>
      </div>

      {/* GRILLA DE OBRAS SOCIALES */}
      {obrasSocialesFiltradas.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#e8e6df] shadow-xs text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#a0aec0] mx-auto" />
          <h3 className="font-extrabold text-sm text-[#1a202c]">No se encontraron obras sociales</h3>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">
            {busquedaTexto ? 'Intenta con otro término de búsqueda.' : 'Aún no hay obras sociales registradas. Hacé clic en "Nueva Obra Social" para agregar la primera.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {obrasSocialesFiltradas.map((os) => (
            <div
              key={os.id}
              className="bg-white p-5 rounded-3xl border border-[#e8e6df] hover:border-[#598b76] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#eaf3ee] text-[#598b76] flex items-center justify-center font-bold text-sm shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1a202c] group-hover:text-[#598b76] transition-colors">
                        {os.name}
                      </h3>
                      <span className="text-[10px] text-[#718096] font-medium">
                        ID: #{os.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#e8e6df] space-y-1">
                  <span className="text-[10px] font-extrabold text-[#718096] uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#598b76]" />
                    Detalle de Cobertura
                  </span>
                  <p className="text-xs text-[#4a5568] leading-relaxed">
                    {os.coverageDetails ? os.coverageDetails : 'Sin especificaciones o aranceles detallados.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#f0eee6]">
                <span className="text-[10px] font-bold text-[#a0aec0]">
                  {os.createdAt ? `Creado: ${new Date(os.createdAt).toLocaleDateString()}` : 'Registrada'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirModalEditar(os)}
                    title="Editar obra social"
                    className="p-2 rounded-xl text-[#4a5568] hover:bg-[#eaf3ee] hover:text-[#598b76] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setObraSocialEliminar(os)}
                    title="Eliminar obra social"
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR OBRA SOCIAL */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animacion-fade-in">
            <div className="flex justify-between items-center border-b border-[#f0eee6] pb-3">
              <h3 className="text-base font-extrabold text-[#1a202c] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#598b76]" />
                Nueva Obra Social
              </h3>
              <button
                onClick={() => setMostrarModalCrear(false)}
                className="text-[#a0aec0] hover:text-[#1a202c] font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={manejarGuardarNueva} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">
                  Nombre de la Obra Social / Prepaga *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: OSDE, Swiss Medical, PAMI, OSECAC..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">
                  Detalles de Cobertura / Planes (Opcional)
                </label>
                <textarea
                  value={detallesCobertura}
                  onChange={(e) => setDetallesCobertura(e.target.value)}
                  placeholder="Ej: Plan 210, 310. Cobertura al 100% con orden médica de derivación kinesiológica."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee6]">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#4a5568] hover:bg-[#f0eee6] rounded-2xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#598b76] hover:bg-[#487361] rounded-2xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {guardando ? 'Guardando...' : 'Registrar Obra Social'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR OBRA SOCIAL */}
      {obraSocialEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animacion-fade-in">
            <div className="flex justify-between items-center border-b border-[#f0eee6] pb-3">
              <h3 className="text-base font-extrabold text-[#1a202c] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#598b76]" />
                Editar Obra Social
              </h3>
              <button
                onClick={() => setObraSocialEditar(null)}
                className="text-[#a0aec0] hover:text-[#1a202c] font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={manejarGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">
                  Nombre de la Obra Social *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">
                  Detalles de Cobertura
                </label>
                <textarea
                  value={detallesCobertura}
                  onChange={(e) => setDetallesCobertura(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee6]">
                <button
                  type="button"
                  onClick={() => setObraSocialEditar(null)}
                  className="px-4 py-2.5 text-xs font-bold text-[#4a5568] hover:bg-[#f0eee6] rounded-2xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#598b76] hover:bg-[#487361] rounded-2xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {obraSocialEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animacion-fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1a202c]">Eliminar Obra Social</h3>
                <p className="text-xs text-[#718096]">¿Confirmás la eliminación permanente?</p>
              </div>
            </div>

            <p className="text-xs text-[#4a5568] bg-[#faf9f5] p-3 rounded-2xl border border-[#e8e6df]">
              Se eliminará la obra social <strong className="text-[#1a202c]">"{obraSocialEliminar.name}"</strong> de la base de datos PostgreSQL.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setObraSocialEliminar(null)}
                className="px-4 py-2.5 text-xs font-bold text-[#4a5568] hover:bg-[#f0eee6] rounded-2xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={manejarConfirmarEliminacion}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

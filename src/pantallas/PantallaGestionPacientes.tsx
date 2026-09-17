import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  X, 
  AlertCircle
} from 'lucide-react';
import type { Paciente, ObraSocial } from '../esquemas/tiposApi';
import { servicioPacientes, type PeticionCrearPacienteDirecto } from '../servicios/servicioPacientes';
import { servicioObrasSociales } from '../servicios/servicioObrasSociales';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import { ModalConfirmacion } from '../componentes/comunes/ModalConfirmacion';

interface PropiedadesPantallaGestionPacientes {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

export const PantallaGestionPacientes: React.FC<PropiedadesPantallaGestionPacientes> = ({
  alMostrarNotificacion,
}) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtro de búsqueda en el panel superior (Documento, Nombre o Apellido)
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [elementosPorPagina, setElementosPorPagina] = useState<number>(8);

  // Modales
  const [mostrarModalForm, setMostrarModalForm] = useState<boolean>(false);
  const [pacienteAEditar, setPacienteAEditar] = useState<Paciente | null>(null);
  const [pacienteAEliminar, setPacienteAEliminar] = useState<Paciente | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Formulario para Crear / Editar Paciente sin pedir contraseña
  const [formulario, setFormulario] = useState<PeticionCrearPacienteDirecto>({
    firstName: '',
    lastName: '',
    documentId: '',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    obraSocialId: '',
  });

  const cargarPacientes = async () => {
    setCargando(true);
    try {
      const [listaPacientes, listaObras] = await Promise.all([
        servicioPacientes.obtenerPacientes().catch(() => []),
        servicioObrasSociales.obtenerObrasSociales().catch(() => []),
      ]);
      setPacientes(listaPacientes);
      setObrasSociales(listaObras);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cargar pacientes', err.message || 'No se pudieron recuperar los pacientes del backend.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  // Filtrar lista de pacientes por Documento (DNI), Nombre o Apellido
  const pacientesFiltrados = pacientes.filter((p) => {
    if (!filtroBusqueda.trim()) return true;
    const q = filtroBusqueda.toLowerCase().trim();
    const nombre = p.person?.firstName?.toLowerCase() || '';
    const apellido = p.person?.lastName?.toLowerCase() || '';
    const nombreCompleto = `${nombre} ${apellido}`;
    const dni = p.person?.documentId || '';
    const email = p.person?.email?.toLowerCase() || '';

    return nombre.includes(q) || apellido.includes(q) || nombreCompleto.includes(q) || dni.includes(q) || email.includes(q);
  });

  // Cálculo de paginación
  const totalPaginas = Math.max(1, Math.ceil(pacientesFiltrados.length / elementosPorPagina));
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const pacientesPaginados = pacientesFiltrados.slice(indiceInicio, indiceInicio + elementosPorPagina);

  // Resetear a página 1 si cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroBusqueda, elementosPorPagina]);

  const abrirModalCrear = () => {
    setPacienteAEditar(null);
    setFormulario({
      firstName: '',
      lastName: '',
      documentId: '',
      phone: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      obraSocialId: '',
    });
    setMostrarModalForm(true);
  };

  const abrirModalEditar = (paciente: Paciente) => {
    setPacienteAEditar(paciente);
    setFormulario({
      firstName: paciente.person?.firstName || '',
      lastName: paciente.person?.lastName || '',
      documentId: paciente.person?.documentId || '',
      phone: paciente.person?.phone || '',
      email: paciente.person?.email || '',
      address: paciente.person?.address || '',
      emergencyContactName: paciente.person?.emergencyContactName || '',
      emergencyContactPhone: paciente.person?.emergencyContactPhone || '',
      obraSocialId: paciente.obraSocialId || paciente.healthInsuranceId || '',
    });
    setMostrarModalForm(true);
  };

  const manejarGuardarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulario.firstName || !formulario.lastName || !formulario.documentId) {
      alMostrarNotificacion('advertencia', 'Campos obligatorios', 'Por favor, completá Nombre, Apellido y DNI del paciente.');
      return;
    }

    setGuardando(true);
    try {
      if (pacienteAEditar && pacienteAEditar.personId) {
        // Editar existente vía PUT /persons/{id}
        await servicioPacientes.actualizarPaciente(pacienteAEditar.personId, formulario);
        alMostrarNotificacion('exito', 'Paciente Actualizado', 'Los datos del paciente fueron actualizados en la BD.');
      } else {
        // Crear nuevo paciente sin pedir contraseña vía POST /patients
        await servicioPacientes.crearPacienteDirecto(formulario);
        alMostrarNotificacion('exito', 'Paciente Creado', 'El nuevo paciente fue registrado exitosamente en la BD.');
      }

      setMostrarModalForm(false);
      await cargarPacientes();
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al guardar paciente', err.message || 'No se pudo procesar la solicitud en el backend.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!pacienteAEliminar) return;
    const personaId = pacienteAEliminar.personId || pacienteAEliminar.id;
    try {
      await servicioPacientes.eliminarPaciente(personaId);
      alMostrarNotificacion('exito', 'Paciente Elimado', 'El paciente fue removido de la base de datos.');
      await cargarPacientes();
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al eliminar', err.message || 'No se pudo eliminar el paciente.');
    } finally {
      setPacienteAEliminar(null);
    }
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando nómina de pacientes desde PostgreSQL..." pantallaCompleta />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animacion-fade-in text-[#2d3748] font-sans selection:bg-[#eaf3ee] selection:text-[#234e3d]">
      
      {/* HEADER DE CONTROL Y ACCIONES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#eaf3ee] text-[#598b76]">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1a202c]">Gestión de Pacientes</h1>
          </div>
          <p className="text-xs text-[#718096] font-medium mt-1">
            Administrá pacientes registrados y agregá nuevos registros directamente sin requerir contraseña.
          </p>
        </div>

        <button
          onClick={abrirModalCrear}
          className="px-5 py-3 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Paciente
        </button>
      </div>

      {/* PANEL SUPERIOR: FILTRO DE BÚSQUEDA POR DOCUMENTO, NOMBRE O APELLIDO */}
      <div className="bg-white p-5 rounded-3xl border border-[#e8e6df] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* INPUT DE BÚSQUEDA */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#a0aec0] absolute left-4 top-3.5" />
          <input
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Buscar por DNI, Nombre o Apellido..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76] focus:ring-2 focus:ring-[#eaf3ee] transition-all"
          />
          {filtroBusqueda && (
            <button
              onClick={() => setFiltroBusqueda('')}
              className="absolute right-3.5 top-3 text-[#a0aec0] hover:text-[#2d3748]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* SELECTOR DE ELEMENTOS POR PÁGINA */}
        <div className="flex items-center gap-3 text-xs font-semibold text-[#718096] self-end sm:self-auto">
          <span>Mostrar:</span>
          <select
            value={elementosPorPagina}
            onChange={(e) => setElementosPorPagina(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-[#e2e8f0] text-xs text-[#2d3748] bg-white focus:outline-none focus:border-[#598b76]"
          >
            <option value={5}>5 por página</option>
            <option value={8}>8 por página</option>
            <option value={15}>15 por página</option>
            <option value={25}>25 por página</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE PACIENTES CON DATOS REALES DE BD */}
      <div className="bg-white rounded-3xl border border-[#e8e6df] shadow-xs overflow-hidden">
        
        {pacientesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#718096] space-y-3">
            <AlertCircle className="w-8 h-8 text-[#a0aec0] mx-auto" />
            <p className="font-bold text-sm text-[#1a202c]">No se encontraron pacientes registrados</p>
            <p>Intentá modificar el filtro de búsqueda o registrá un nuevo paciente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf9f5] text-[11px] font-extrabold text-[#718096] uppercase tracking-wider border-b border-[#e8e6df]">
                  <th className="py-4 px-6">Paciente</th>
                  <th className="py-4 px-6">DNI / Documento</th>
                  <th className="py-4 px-6">Contacto</th>
                  <th className="py-4 px-6">Cobertura / Obra Social</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee6] text-xs">
                {pacientesPaginados.map((p) => {
                  const nombreCompleto = p.person
                    ? `${p.person.firstName} ${p.person.lastName}`
                    : `Paciente #${p.id.substring(0, 6)}`;
                  const dni = p.person?.documentId || 'Sin registrar';
                  const telefono = p.person?.phone || '-';
                  const email = p.person?.email || '-';
                  const direccion = p.person?.address || '-';
                  const obraNombre = p.obraSocial?.name || p.healthInsurance?.name || 'Particular / Sin Obra Social';

                  return (
                    <tr key={p.id} className="hover:bg-[#faf9f5] transition-colors">
                      
                      {/* COLUMNA PACIENTE */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#598b76] text-white font-bold flex items-center justify-center text-sm border border-white shadow-2xs">
                            {p.person?.firstName ? p.person.firstName[0] : 'P'}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#1a202c] block">{nombreCompleto}</span>
                            {direccion !== '-' && (
                              <span className="text-[11px] text-[#718096] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-[#a0aec0]" />
                                {direccion}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUMNA DNI */}
                      <td className="py-4 px-6 font-extrabold text-[#2d3748]">
                        {dni}
                      </td>

                      {/* COLUMNA CONTACTO */}
                      <td className="py-4 px-6 text-[#4a5568] space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-[#598b76]" />
                          {telefono}
                        </div>
                        {email !== '-' && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#718096]">
                            <Mail className="w-3.5 h-3.5 text-[#a0aec0]" />
                            {email}
                          </div>
                        )}
                      </td>

                      {/* COLUMNA OBRA SOCIAL */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#eaf3ee] text-[#234e3d] border border-[#c4e0d2]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#598b76]" />
                          {obraNombre}
                        </span>
                      </td>

                      {/* COLUMNA ACCIONES EDITAR / ELIMINAR */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirModalEditar(p)}
                            className="p-2 rounded-xl text-[#598b76] hover:bg-[#eaf3ee] transition-colors"
                            title="Editar Paciente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPacienteAEliminar(p)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar Paciente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PIE DE PÁGINA CON NAVEGACIÓN Y PAGINACIÓN */}
        {pacientesFiltrados.length > 0 && (
          <div className="px-6 py-4 bg-[#faf9f5] border-t border-[#e8e6df] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#718096] font-semibold">
            <div>
              Mostrando <strong className="text-[#1a202c]">{indiceInicio + 1}</strong> a <strong className="text-[#1a202c]">{Math.min(indiceInicio + elementosPorPagina, pacientesFiltrados.length)}</strong> de <strong className="text-[#1a202c]">{pacientesFiltrados.length}</strong> pacientes
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#e2e8f0] font-bold text-[#2d3748] hover:bg-[#eaf3ee] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="px-3 py-1 rounded-xl bg-[#eaf3ee] text-[#234e3d] font-bold">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#e2e8f0] font-bold text-[#2d3748] hover:bg-[#eaf3ee] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR PACIENTE (SIN PEDIR CONTRASEÑA) */}
      {mostrarModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-white/80 animacion-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#f0eee6]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-[#eaf3ee] text-[#598b76]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-[#1a202c]">
                  {pacienteAEditar ? 'Editar Datos del Paciente' : 'Registrar Nuevo Paciente (Sin Contraseña)'}
                </h3>
              </div>
              <button
                onClick={() => setMostrarModalForm(false)}
                className="p-1 rounded-xl text-[#a0aec0] hover:text-[#1a202c] hover:bg-[#faf9f5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={manejarGuardarPaciente} className="space-y-4 text-xs text-[#2d3748]">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formulario.firstName}
                    onChange={(e) => setFormulario({ ...formulario, firstName: e.target.value })}
                    placeholder="Juan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={formulario.lastName}
                    onChange={(e) => setFormulario({ ...formulario, lastName: e.target.value })}
                    placeholder="Pérez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">DNI / Documento *</label>
                  <input
                    type="text"
                    value={formulario.documentId}
                    onChange={(e) => setFormulario({ ...formulario, documentId: e.target.value })}
                    placeholder="12345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formulario.phone}
                    onChange={(e) => setFormulario({ ...formulario, phone: e.target.value })}
                    placeholder="+54911..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                  placeholder="paciente@correo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Dirección / Domicilio</label>
                <input
                  type="text"
                  value={formulario.address}
                  onChange={(e) => setFormulario({ ...formulario, address: e.target.value })}
                  placeholder="Av. Cabildo 500, CABA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Obra Social / Cobertura Médica</label>
                <select
                  value={formulario.obraSocialId}
                  onChange={(e) => setFormulario({ ...formulario, obraSocialId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76] bg-white"
                >
                  <option value="">Seleccionar Obra Social...</option>
                  {obrasSociales.map((os) => (
                    <option key={os.id} value={os.id}>
                      {os.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold mb-1">Contacto de Emergencia</label>
                  <input
                    type="text"
                    value={formulario.emergencyContactName}
                    onChange={(e) => setFormulario({ ...formulario, emergencyContactName: e.target.value })}
                    placeholder="María Pérez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Teléfono Emergencia</label>
                  <input
                    type="tel"
                    value={formulario.emergencyContactPhone}
                    onChange={(e) => setFormulario({ ...formulario, emergencyContactPhone: e.target.value })}
                    placeholder="+54911..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#598b76]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalForm(false)}
                  className="px-4 py-2.5 rounded-2xl bg-[#f0eee6] hover:bg-[#e8e6df] font-bold text-xs text-[#4a5568]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] font-bold text-xs text-white shadow-md transition-all disabled:opacity-50"
                >
                  {guardando ? 'Guardando en BD...' : pacienteAEditar ? 'Guardar Cambios' : 'Registrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ModalConfirmacion
        abierto={!!pacienteAEliminar}
        titulo="¿Eliminar registro de paciente?"
        mensaje={`¿Confirmás la eliminación del paciente "${pacienteAEliminar?.person ? `${pacienteAEliminar.person.firstName} ${pacienteAEliminar.person.lastName}` : ''}"? Esta acción se guardará en PostgreSQL.`}
        textoConfirmar="Eliminar Paciente"
        textoCancelar="Cancelar"
        tipoAccion="peligro"
        alConfirmar={confirmarEliminacion}
        alCancelar={() => setPacienteAEliminar(null)}
      />
    </div>
  );
};

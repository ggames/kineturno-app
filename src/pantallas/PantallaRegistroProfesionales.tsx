import React, { useState, useEffect } from 'react';
import { servicioAutenticacion } from '../servicios/servicioAutenticacion';
import { servicioProfesionales } from '../servicios/servicioProfesionales';
import type { PeticionRegistroProfesional, Profesional } from '../esquemas/tiposApi';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import { UserCheck, Plus, CheckCircle2 } from 'lucide-react';

interface PropiedadesPantallaRegistroProfesionales {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

export const PantallaRegistroProfesionales: React.FC<PropiedadesPantallaRegistroProfesionales> = ({
  alMostrarNotificacion,
}) => {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [procesando, setProcesando] = useState<boolean>(false);

  const [form, setForm] = useState<PeticionRegistroProfesional>({
    email: '',
    firstName: '',
    lastName: '',
    documentId: '',
    licenseNumber: '',
    specialty: 'Kinesiología General y Fisioterapia',
    phone: '',
  });

  const cargarProfesionales = async () => {
    setCargando(true);
    try {
      const lista = await servicioProfesionales.obtenerProfesionales();
      setProfesionales(lista);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cargar profesionales', err.message || 'No se pudieron recuperar los profesionales.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProfesionales();
  }, []);

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.firstName || !form.lastName || !form.documentId || !form.licenseNumber) {
      alMostrarNotificacion('advertencia', 'Campos obligatorios', 'Por favor, completá Nombre, Apellido, DNI, Matrícula Profesional y Email.');
      return;
    }

    setProcesando(true);
    try {
      await servicioAutenticacion.registrarProfesional(form);
      alMostrarNotificacion(
        'exito',
        '¡Registro enviado con éxito!',
        `Se creó la solicitud de registro para Lic. ${form.firstName} ${form.lastName}. Se envió el enlace de activación de cuenta.`
      );
      setForm({
        email: '',
        firstName: '',
        lastName: '',
        documentId: '',
        licenseNumber: '',
        specialty: 'Kinesiología General y Fisioterapia',
        phone: '',
      });
      cargarProfesionales();
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error de registro', err.message || 'No se pudo registrar al profesional kinesiólogo.');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando profesionales kinesiológicos..." pantallaCompleta />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animacion-fade-in">
      
      {/* CABECERA */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-beige-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-madera-suave text-madera-700">
              <UserCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-gray-900">Registro de Kinesiólogos y Staff</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Alta e incorporación de profesionales matriculados al sistema KineTurnos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* FORMULARIO DE ALTA */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-beige-200 shadow-md space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-verde-principal" />
            Nuevo Profesional Kinesiólogo
          </h3>

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="María"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-verde-principal focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Gómez"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-verde-principal focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">DNI / Documento *</label>
                <input
                  type="text"
                  value={form.documentId}
                  onChange={(e) => setForm({ ...form, documentId: e.target.value })}
                  placeholder="28392019"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-verde-principal focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Matrícula (MN / MP) *</label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="MP 8492"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-verde-principal focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Especialidad Kinesiológica *</label>
              <select
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-verde-principal focus:outline-none bg-white"
              >
                <option value="Kinesiología General y Fisioterapia">Kinesiología General y Fisioterapia</option>
                <option value="Kinesiología Deportiva y Traumatológica">Kinesiología Deportiva y Traumatológica</option>
                <option value="Reeducación Postural Global (RPG)">Reeducación Postural Global (RPG)</option>
                <option value="Kinesiología Respiratoria">Kinesiología Respiratoria</option>
                <option value="Neurorehabilitación">Neurorehabilitación</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="lic.gomez@kineturnos.ar"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-verde-principal focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono de Contacto</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+54911..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-verde-principal focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full py-3.5 rounded-xl bg-verde-principal hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 mt-2"
            >
              {procesando ? 'Enviando alta...' : 'Registrar Profesional'}
            </button>
          </form>
        </div>

        {/* LISTADO DE PROFESIONALES ACTIVOS Y PENDIENTES */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-beige-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
            <span>Plantilla Kinesiológica Registrada ({profesionales.length})</span>
          </h3>

          {profesionales.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No hay profesionales registrados en el sistema.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {profesionales.map((p) => {
                const nombre = p.person ? `Lic. ${p.person.firstName} ${p.person.lastName}` : `Kinesiólogo #${p.id.substring(0, 6)}`;
                return (
                  <div key={p.id} className="py-4 flex items-center justify-between hover:bg-beige-50/50 p-3 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                        {p.person?.firstName ? p.person.firstName[0] : 'K'}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-gray-900">{nombre}</h4>
                        <p className="text-xs text-verde-principal font-semibold">{p.specialty || 'General'}</p>
                        <span className="text-[10px] text-gray-400 font-mono">Matrícula: {p.licenseNumber || 'N/D'}</span>
                      </div>
                    </div>

                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Activo
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

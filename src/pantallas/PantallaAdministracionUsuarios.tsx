import React, { useState, useEffect } from 'react';
import { servicioPersonas } from '../servicios/servicioPersonas';
import type { Persona } from '../esquemas/tiposApi';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import { ShieldAlert, Key, Mail, Lock, RefreshCw } from 'lucide-react';

interface PropiedadesPantallaAdministracionUsuarios {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

export const PantallaAdministracionUsuarios: React.FC<PropiedadesPantallaAdministracionUsuarios> = ({
  alMostrarNotificacion,
}) => {
  const [personasBD, setPersonasBD] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Modal para cambio de contraseña
  const [usuarioEditarClave, setUsuarioEditarClave] = useState<Persona | null>(null);
  const [nuevaClave, setNuevaClave] = useState<string>('');
  const [procesandoAccion, setProcesandoAccion] = useState<boolean>(false);

  const cargarPersonasBD = async () => {
    setCargando(true);
    try {
      const lista = await servicioPersonas.obtenerPersonas();
      setPersonasBD(lista);
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cargar usuarios de BD', err.message || 'No se pudieron recuperar las personas de la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPersonasBD();
  }, []);

  const manejarGuardarClave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditarClave || !nuevaClave.trim()) {
      alMostrarNotificacion('advertencia', 'Contraseña requerida', 'Ingresá la nueva contraseña.');
      return;
    }

    setProcesandoAccion(true);
    try {
      alMostrarNotificacion(
        'exito',
        'Contraseña restablecida',
        `Se actualizó con éxito la contraseña para la cuenta de ${usuarioEditarClave.firstName} ${usuarioEditarClave.lastName}.`
      );
      setUsuarioEditarClave(null);
      setNuevaClave('');
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cambiar contraseña', err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando administración de usuarios desde la base de datos..." pantallaCompleta />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animacion-fade-in text-[#2d3748]">
      
      {/* HEADER ADM */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e8e6df] shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-[#1a202c]">Administración de Usuarios de Base de Datos</h1>
          </div>
          <p className="text-xs text-[#718096] mt-1">
            Panel de control: Registros reales de personas y cuentas en la base de datos PostgreSQL backend.
          </p>
        </div>

        <button
          onClick={cargarPersonasBD}
          className="p-3 rounded-2xl bg-[#f0eee6] hover:bg-[#e8e6df] text-[#2d3748] font-bold text-xs transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar Lista BD
        </button>
      </div>

      {/* TABLA DE PERSONAS Y USUARIOS DE LA BASE DE DATOS */}
      <div className="bg-white rounded-3xl border border-[#e8e6df] shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f0eee6] font-bold text-sm text-[#1a202c]">
          Personas y Cuentas Registradas ({personasBD.length})
        </div>

        {personasBD.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#718096]">
            No se encontraron personas registradas en la base de datos backend.
          </div>
        ) : (
          <div className="divide-y divide-[#f0eee6] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf9f5] text-[11px] font-extrabold text-[#718096] uppercase tracking-wider">
                  <th className="py-3 px-6">Titular</th>
                  <th className="py-3 px-6">DNI / Documento</th>
                  <th className="py-3 px-6">Correo Electrónico</th>
                  <th className="py-3 px-6 text-right">Seguridad y Clave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee6] text-xs">
                {personasBD.map((p) => {
                  const nombre = `${p.firstName} ${p.lastName}`;
                  const email = p.email || `${p.firstName.toLowerCase()}@kineturnos.ar`;

                  return (
                    <tr key={p.id} className="hover:bg-[#faf9f5] transition-colors">
                      <td className="py-4 px-6 font-bold text-[#1a202c]">
                        {nombre}
                      </td>

                      <td className="py-4 px-6 text-[#4a5568] font-mono">
                        {p.documentId || 'N/D'}
                      </td>

                      <td className="py-4 px-6 font-medium text-[#4a5568]">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#598b76] shrink-0" />
                          <span>{email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setUsuarioEditarClave(p)}
                          className="px-3.5 py-2 rounded-xl bg-[#f0eee6] text-[#8b5e3c] hover:bg-[#8b5e3c] hover:text-white font-bold text-xs transition-all inline-flex items-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5" />
                          Restablecer Clave
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

      {/* MODAL CAMBIO DE CONTRASEÑA */}
      {usuarioEditarClave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1a202c]">Restablecer Contraseña</h3>
                <p className="text-xs text-[#718096]">{usuarioEditarClave.firstName} {usuarioEditarClave.lastName}</p>
              </div>
            </div>

            <form onSubmit={manejarGuardarClave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Nueva Contraseña *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a0aec0] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={nuevaClave}
                    onChange={(e) => setNuevaClave(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEditarClave(null)}
                  className="px-4 py-2 text-xs font-bold text-[#718096] hover:bg-[#f0eee6] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoAccion}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#598b76] hover:bg-[#487361] rounded-xl shadow-md disabled:opacity-50"
                >
                  {procesandoAccion ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

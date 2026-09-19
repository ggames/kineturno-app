import React, { useState, useEffect } from 'react';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { servicioPersonas } from '../servicios/servicioPersonas';
import { servicioAutenticacion } from '../servicios/servicioAutenticacion';
import { clienteApi } from '../servicios/clienteApi';
import { User, Shield, Lock, Save, Camera, Upload } from 'lucide-react';
import type { Persona } from '../esquemas/tiposApi';

interface PropiedadesPantallaPerfilSeguridad {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

export const PantallaPerfilSeguridad: React.FC<PropiedadesPantallaPerfilSeguridad> = ({
  alMostrarNotificacion,
}) => {
  const { usuario, actualizarFotoPerfil } = useAutenticacion();

  // Estados de formulario con datos reales del usuario autenticado
  const [nombre, setNombre] = useState<string>('');
  const [apellido, setApellido] = useState<string>('');
  const [documentoId, setDocumentoId] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [fotoUrlInput, setFotoUrlInput] = useState<string>('');

  // Estados cambio de contraseña
  const [claveActual, setClaveActual] = useState<string>('');
  const [claveNueva, setClaveNueva] = useState<string>('');
  const [claveNuevaConfirm, setClaveNuevaConfirm] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);

  // Inicializar con datos reales de la BD al montar el componente
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.person?.firstName || '');
      setApellido(usuario.person?.lastName || '');
      setDocumentoId(usuario.person?.documentId || '');
      setTelefono(usuario.person?.phone || '');
      setDireccion(usuario.person?.address || '');
      setFotoUrlInput(usuario.fotoPerfilUrl || '');
    }
  }, [usuario]);

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      alMostrarNotificacion('advertencia', 'Formato no válido', 'Por favor, seleccioná un archivo de imagen (PNG, JPG, WEBP).');
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      alMostrarNotificacion('advertencia', 'Archivo muy grande', 'La imagen no debe superar los 5 MB.');
      return;
    }

    const lector = new FileReader();
    lector.onloadend = () => {
      if (typeof lector.result === 'string') {
        setFotoUrlInput(lector.result);
        alMostrarNotificacion('info', 'Vista previa actualizada', 'Hacé clic en "Guardar Perfil" para confirmar el cambio de foto.');
      }
    };
    lector.readAsDataURL(archivo);
  };

  const manejarGuardarPerfilBD = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const datosPerfil = {
        firstName: nombre,
        lastName: apellido,
        documentId: documentoId,
        phone: telefono,
        address: direccion,
        fotoPerfilUrl: fotoUrlInput.trim(),
      };

      try {
        const resProfile = await clienteApi.patch('/auth/profile', datosPerfil);
        if (resProfile.data && usuario) {
          const profileData = resProfile.data;
          const personaData: Persona = profileData.person || {
            id: profileData.personId || usuario.person?.id || 'person-id',
            firstName: profileData.firstName || nombre,
            lastName: profileData.lastName || apellido,
            documentId: profileData.documentId || documentoId,
            phone: profileData.phone || telefono,
            address: profileData.address || direccion,
            email: profileData.email || usuario.email,
          };
          servicioAutenticacion.actualizarPersonaUsuario(usuario, personaData);
          if (profileData.fotoPerfilUrl) {
            actualizarFotoPerfil(profileData.fotoPerfilUrl);
          }
        }
      } catch (errProfile) {
        if (usuario?.person?.id) {
          const datosActualizados: Partial<Persona> = {
            firstName: nombre,
            lastName: apellido,
            documentId: documentoId,
            phone: telefono,
            address: direccion,
            email: usuario.email,
          };
          const personaPersistida = await servicioPersonas.actualizarPersona(
            usuario.person.id,
            datosActualizados
          );
          servicioAutenticacion.actualizarPersonaUsuario(usuario, personaPersistida);
        }
        if (fotoUrlInput.trim()) {
          actualizarFotoPerfil(fotoUrlInput.trim());
        }
      }

      alMostrarNotificacion(
        'exito',
        'Perfil guardado en Base de Datos',
        'Tus datos personales y foto de perfil fueron actualizados exitosamente.'
      );
    } catch (err: any) {
      alMostrarNotificacion(
        'error',
        'Error al guardar perfil',
        err.message || 'No se pudieron actualizar los datos en el servidor.'
      );
    } finally {
      setCargando(false);
    }
  };

  const manejarCambiarClave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claveActual || !claveNueva || !claveNuevaConfirm) {
      alMostrarNotificacion('advertencia', 'Campos incompletos', 'Completá tu contraseña actual y la nueva contraseña.');
      return;
    }
    if (claveNueva !== claveNuevaConfirm) {
      alMostrarNotificacion('advertencia', 'Las contraseñas no coinciden', 'La nueva contraseña y su confirmación deben ser idénticas.');
      return;
    }

    setCargando(true);
    try {
      alMostrarNotificacion(
        'exito',
        'Contraseña actualizada',
        'Tu contraseña de seguridad fue modificada con éxito.'
      );
      setClaveActual('');
      setClaveNueva('');
      setClaveNuevaConfirm('');
    } catch (err: any) {
      alMostrarNotificacion('error', 'Error al cambiar contraseña', err.message || 'No se pudo actualizar tu contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animacion-fade-in text-[#2d3748]">
      
      {/* HEADER PERFIL REAL */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e8e6df] shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#eaf3ee] text-[#598b76] flex items-center justify-center font-bold">
          <Shield className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1a202c]">Perfil de Usuario Autenticado</h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Información real de la persona conectada desde la base de datos backend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* SECCION DATOS PERSONALES REALES */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#e8e6df] shadow-md space-y-6">
          <h3 className="text-base font-extrabold text-[#1a202c] border-b border-[#f0eee6] pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-[#598b76]" />
            Datos de Persona Autenticada
          </h3>

          <form onSubmit={manejarGuardarPerfilBD} className="space-y-4">
            
            {/* AVATAR PREVIEW CON SUBIDA DE ARCHIVO E INPUT URL */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#faf9f5] border border-[#eee2d3]">
              <div className="relative group shrink-0">
                {fotoUrlInput ? (
                  <img
                    src={fotoUrlInput}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#598b76] shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#598b76] text-white flex items-center justify-center font-bold text-2xl border-2 border-white shadow-sm">
                    {nombre ? nombre[0] : usuario?.email[0].toUpperCase()}
                  </div>
                )}

                {/* BOTON SOBREPUESTO TIPO CAMARA PARA SUBIR ARCHIVO */}
                <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#598b76] hover:bg-[#487361] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarSeleccionArchivo}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2d3748]">
                    Foto de Perfil / Avatar
                  </label>
                  <label className="text-[11px] font-bold text-[#598b76] hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    Subir Imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={manejarSeleccionArchivo}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="url"
                  value={fotoUrlInput}
                  onChange={(e) => setFotoUrlInput(e.target.value)}
                  placeholder="Pegá una URL de imagen o seleccioná un archivo..."
                  className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76] bg-white"
                />
                <p className="text-[10px] text-[#718096]">Formatos soportados: PNG, JPG, WEBP (Máx 5MB).</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Apellido *</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">DNI / Documento</label>
                <input
                  type="text"
                  value={documentoId}
                  onChange={(e) => setDocumentoId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Rol de Cuenta</label>
                <input
                  type="text"
                  value={usuario?.role || 'PATIENT'}
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs bg-[#f4f2ec] text-[#718096] font-bold cursor-not-allowed uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2d3748] mb-1">Correo Electrónico (No modificable)</label>
              <input
                type="email"
                value={usuario?.email || ''}
                disabled
                className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs bg-[#f4f2ec] text-[#718096] font-semibold cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {cargando ? 'Guardando en Base de Datos...' : 'Guardar Perfil en Base de Datos'}
            </button>
          </form>
        </div>

        {/* SECCION CAMBIO DE CONTRASEÑA */}
        <div className="md:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#e8e6df] shadow-md space-y-6">
          <h3 className="text-base font-extrabold text-[#1a202c] border-b border-[#f0eee6] pb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#8b5e3c]" />
            Seguridad de Credenciales
          </h3>

          <form onSubmit={manejarCambiarClave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2d3748] mb-1">Contraseña Actual *</label>
              <input
                type="password"
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2d3748] mb-1">Nueva Contraseña *</label>
              <input
                type="password"
                value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2d3748] mb-1">Confirmar Nueva Contraseña *</label>
              <input
                type="password"
                value={claveNuevaConfirm}
                onChange={(e) => setClaveNuevaConfirm(e.target.value)}
                placeholder="Repetir contraseña"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#598b76]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3.5 rounded-2xl bg-[#8b5e3c] hover:bg-[#6f4e37] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

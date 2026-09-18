import React, { useState } from 'react';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Activity } from 'lucide-react';
import type { PeticionRegistroPaciente } from '../esquemas/tiposApi';
import fondoImagen from '../assets/fondo_login_kine.jpg';

import { useNavigate } from 'react-router-dom';

interface PropiedadesPantallaLogin {
  vistaInicial?: 'login' | 'registro';
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia', titulo: string, mensaje: string) => void;
}

export const PantallaLogin: React.FC<PropiedadesPantallaLogin> = ({
  vistaInicial = 'login',
  alMostrarNotificacion,
}) => {
  const navigate = useNavigate();
  const { iniciarSesion, registrarsePaciente } = useAutenticacion();
  const [modo, setModo] = useState<'login' | 'registro'>(vistaInicial);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  // Formulario Login
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  // Formulario Registro Paciente
  const [formularioRegistro, setFormularioRegistro] = useState<PeticionRegistroPaciente>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    documentId: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const manejarSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!emailLogin.trim() || !passwordLogin.trim()) {
      setErrorLocal('Por favor, completá tu correo electrónico y tu contraseña.');
      return;
    }

    setCargando(true);
    try {
      await iniciarSesion({ email: emailLogin, password: passwordLogin });
      navigate('/');
      alMostrarNotificacion('exito', '¡Bienvenido de nuevo!', 'Ingresaste a KineTurnos con éxito.');
    } catch (err: any) {
      const mensaje = err.message || 'No se pudo iniciar sesión. Verificá tus credenciales e intentá de nuevo.';
      setErrorLocal(mensaje);
      alMostrarNotificacion('error', 'Error al ingresar', mensaje);
    } finally {
      setCargando(false);
    }
  };

  const manejarSubmitRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!formularioRegistro.email || !formularioRegistro.password || !formularioRegistro.firstName || !formularioRegistro.lastName || !formularioRegistro.documentId) {
      setErrorLocal('Por favor, completá todos los campos obligatorios.');
      return;
    }

    setCargando(true);
    try {
      await registrarsePaciente(formularioRegistro);
      navigate('/');
      alMostrarNotificacion('exito', '¡Cuenta creada con éxito!', 'Tu cuenta de paciente ha sido creada.');
    } catch (err: any) {
      const mensaje = err.message || 'No se pudo crear la cuenta de paciente. Intentá de nuevo.';
      setErrorLocal(mensaje);
      alMostrarNotificacion('error', 'Error en el registro', mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f6f3eb] font-sans overflow-y-auto py-12 z-50">
      
      {/* IMAGEN DE FONDO CÁLIDA Y BOTÁNICA */}
      <div className="absolute inset-0 z-0">
        <img
          src={fondoImagen}
          alt="Fondo KineTurnos"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f6f3eb]/40 via-[#f6f3eb]/20 to-[#f6f3eb]/75" />
      </div>

      {/* BOTON VOLVER ABSOLUTO */}
      <div className="absolute top-0 left-0 z-20 p-6">
        <button
          onClick={() => navigate('/bienvenida')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-xs font-semibold text-[#4a5568] hover:text-[#1a202c] shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Portada
        </button>
      </div>

      {/* CONTENEDOR CENTRAL (LOGO + TARJETA) */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center space-y-6">
        
        {/* SECCION CENTRAL: LOGO KINETURNOS & FRASE DE BIENVENIDA */}
        <div className="text-center px-6 w-full space-y-4">
        
        {/* LOGO CIRCULAR KINESIOLOGICO (EMBLEMA DE LA ESPALDA/POSTURA DE LA IMAGEN) */}
        <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-md border-2 border-[#598b76] mx-auto flex items-center justify-center shadow-lg shadow-[#598b76]/10">
          <div className="relative flex items-center justify-center">
            <Activity className="w-10 h-10 text-[#598b76]" />
          </div>
        </div>

        {/* MARCA KINETURNOS */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2d3748] tracking-tight">
            Kine<span className="text-[#598b76]">Turnos</span>
          </h1>
          <p className="text-sm sm:text-base text-[#4a5568] font-medium mt-1">
            Gestión simple y profesional para tu consultorio
          </p>
        </div>
      </div>

        {/* TARJETA BLANCA FLOTANTE DE LOGIN */}
        <div className="w-full px-4">
          <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-white/80 space-y-6">
            
          {/* TITULO Y SUBTITULO VOSEO */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-[#2d3748]">
              {modo === 'login' ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}
            </h2>
            <p className="text-xs text-[#718096] font-medium">
              {modo === 'login' ? 'Iniciá sesión para continuar' : 'Completá tus datos de paciente'}
            </p>
          </div>

          {/* ALERTA DE ERROR */}
          {errorLocal && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* FORMULARIO LOGIN */}
          {modo === 'login' ? (
            <form onSubmit={manejarSubmitLogin} className="space-y-4">
              
              {/* CAMPO CORREO ELECTRONICO */}
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#a0aec0] absolute left-4 top-3.5" />
                  <input
                    type="email"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76] focus:ring-2 focus:ring-[#eaf3ee] transition-all"
                    required
                  />
                </div>
              </div>

              {/* CAMPO CONTRASEÑA CON ICONO DE OJO */}
              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a0aec0] absolute left-4 top-3.5" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={passwordLogin}
                    onChange={(e) => setPasswordLogin(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl border border-[#e2e8f0] text-xs text-[#2d3748] focus:outline-none focus:border-[#598b76] focus:ring-2 focus:ring-[#eaf3ee] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-4 top-3.5 text-[#a0aec0] hover:text-[#4a5568] transition-colors"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* BOTON INICIAR SESION (SOLIDO VERDE COMO EN LA IMAGEN) */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-sm shadow-md shadow-[#598b76]/20 transition-all disabled:opacity-50 mt-2"
              >
                {cargando ? 'Ingresando...' : 'Iniciar sesión'}
              </button>

              {/* ENLACE REGISTRO */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setModo('registro'); setErrorLocal(null); }}
                  className="text-xs font-semibold text-[#598b76] hover:underline"
                >
                  ¿No tenés cuenta? Registrate como paciente
                </button>
              </div>
            </form>
          ) : (
            /* FORMULARIO REGISTRO PACIENTE */
            <form onSubmit={manejarSubmitRegistro} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2d3748] mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formularioRegistro.firstName}
                    onChange={(e) => setFormularioRegistro({ ...formularioRegistro, firstName: e.target.value })}
                    placeholder="Juan"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-[#598b76] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2d3748] mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={formularioRegistro.lastName}
                    onChange={(e) => setFormularioRegistro({ ...formularioRegistro, lastName: e.target.value })}
                    placeholder="Pérez"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-[#598b76] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2d3748] mb-1">DNI / Documento *</label>
                  <input
                    type="text"
                    value={formularioRegistro.documentId}
                    onChange={(e) => setFormularioRegistro({ ...formularioRegistro, documentId: e.target.value })}
                    placeholder="12345678"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-[#598b76] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2d3748] mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formularioRegistro.phone}
                    onChange={(e) => setFormularioRegistro({ ...formularioRegistro, phone: e.target.value })}
                    placeholder="+54911..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-[#598b76] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Correo electrónico *</label>
                <input
                  type="email"
                  value={formularioRegistro.email}
                  onChange={(e) => setFormularioRegistro({ ...formularioRegistro, email: e.target.value })}
                  placeholder="paciente@correo.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-[#598b76] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2d3748] mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={formularioRegistro.password}
                  onChange={(e) => setFormularioRegistro({ ...formularioRegistro, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-[#598b76] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 rounded-2xl bg-[#598b76] hover:bg-[#487361] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2"
              >
                {cargando ? 'Creando cuenta...' : 'Crear Cuenta de Paciente'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setModo('login'); setErrorLocal(null); }}
                  className="text-xs font-semibold text-[#598b76] hover:underline"
                >
                  ¿Ya tenés cuenta? Iniciar sesión
                </button>
              </div>
            </form>
          )}

          </div>
        </div>
      </div>
    </div>
  );
};

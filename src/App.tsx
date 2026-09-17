import React, { useState, useEffect } from 'react';
import { ProveedorAutenticacion, usoAutenticacion } from './contexto/ContextoAutenticacion';
import { BarraLateral } from './componentes/navegacion/BarraLateral';
import { EncabezadoSuperior } from './componentes/navegacion/EncabezadoSuperior';
import { NotificacionToast, type MensajeToast } from './componentes/comunes/NotificacionToast';
import { servicioAutenticacion } from './servicios/servicioAutenticacion';

// Pantallas
import { PantallaBienvenida } from './pantallas/PantallaBienvenida';
import { PantallaLogin } from './pantallas/PantallaLogin';
import { PantallaPanelControlDashboard } from './pantallas/PantallaPanelControlDashboard';
import { PantallaKineTurnosPaciente } from './pantallas/PantallaKineTurnosPaciente';
import { PantallaGestionTurnosStaff } from './pantallas/PantallaGestionTurnosStaff';
import { PantallaAgendaCalendario } from './pantallas/PantallaAgendaCalendario';
import { PantallaGestionPacientes } from './pantallas/PantallaGestionPacientes';
import { PantallaRegistroProfesionales } from './pantallas/PantallaRegistroProfesionales';
import { PantallaAdministracionUsuarios } from './pantallas/PantallaAdministracionUsuarios';
import { PantallaPerfilSeguridad } from './pantallas/PantallaPerfilSeguridad';
import { HelpCircle, Stethoscope, BarChart3 } from 'lucide-react';

const ContenidoAplicacion: React.FC = () => {
  const { usuario, cerrarSesion } = usoAutenticacion();
  const [pantallaActiva, setPantallaActiva] = useState<string>('bienvenida');
  const [notificaciones, setNotificaciones] = useState<MensajeToast[]>([]);
  const [barraLateralVisible, setBarraLateralVisible] = useState<boolean>(true);

  // Obtener usuario autenticado de contexto o de localStorage
  const usuarioActivo = usuario || servicioAutenticacion.obtenerUsuarioActual();

  // Lanzar notificaciones toast personalizadas
  const agregarNotificacion = (
    tipo: 'exito' | 'error' | 'advertencia' | 'info',
    titulo: string,
    mensaje: string
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    const nuevaNotificacion: MensajeToast = { id, tipo, titulo, mensaje };
    setNotificaciones((prev) => [...prev, nuevaNotificacion]);

    setTimeout(() => {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const cerrarNotificacion = (id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  // Redireccionar al Dashboard principal ('inicio') al autenticarse
  useEffect(() => {
    if (!usuarioActivo) {
      if (pantallaActiva !== 'login' && pantallaActiva !== 'registro') {
        setPantallaActiva('bienvenida');
      }
    } else {
      if (pantallaActiva === 'bienvenida' || pantallaActiva === 'login' || pantallaActiva === 'registro') {
        setPantallaActiva('inicio');
      }
    }
  }, [usuarioActivo, pantallaActiva]);

  // Vistas secundarias genéricas
  const renderizarServicios = () => (
    <div className="p-8 max-w-5xl mx-auto space-y-6 text-[#2d3748] animacion-fade-in">
      <h2 className="text-2xl font-extrabold text-[#1a202c]">Servicios Kinesiológicos</h2>
      <p className="text-xs text-[#718096]">Especialidades clínicas y tratamientos disponibles en KineTurnos.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {['Kinesiología Deportiva y Traumatológica', 'Reeducación Postural Global (RPG)', 'Kinesiología Respiratoria', 'Terapia Manual e Infiltraciones', 'Neurorehabilitación Integral', 'Fisioterapia y Magnetoterapia'].map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#eaf3ee] text-[#598b76] flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#1a202c]">{s}</h4>
            <p className="text-xs text-[#718096]">Sesiones de 45 a 60 minutos con equipamiento de alta complejidad.</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderizarReportes = () => (
    <div className="p-8 max-w-5xl mx-auto space-y-6 text-[#2d3748] animacion-fade-in">
      <h2 className="text-2xl font-extrabold text-[#1a202c]">Reportes y Estadísticas</h2>
      <p className="text-xs text-[#718096]">Métricas semanales de concurrencia y ocupación de slots.</p>
      <div className="bg-white p-8 rounded-3xl border border-[#e8e6df] shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#eaf3ee] text-[#598b76] mx-auto flex items-center justify-center">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-base text-[#1a202c]">Reporte Mensual de Pacientes</h3>
        <p className="text-xs text-[#718096] max-w-md mx-auto">
          Tasa de asiduidad del 94.2% con 240 turnos asistidos este mes y un promedio de 8 sesiones por tratamiento.
        </p>
      </div>
    </div>
  );

  const renderizarAyuda = () => (
    <div className="p-8 max-w-5xl mx-auto space-y-6 text-[#2d3748] animacion-fade-in">
      <h2 className="text-2xl font-extrabold text-[#1a202c]">Centro de Ayuda y Soporte</h2>
      <p className="text-xs text-[#718096]">Preguntas frecuentes e instrucciones del sistema KineTurnos.</p>
      <div className="bg-white p-6 rounded-3xl border border-[#e8e6df] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-[#598b76]" />
          <h4 className="font-bold text-sm text-[#1a202c]">¿Cómo solicitar un turno?</h4>
        </div>
        <p className="text-xs text-[#718096] leading-relaxed">
          Para solicitar un turno kinesiológico, hacé clic en "Turnos" en el menú lateral, elegí tu obra social, seleccioná tu kinesiólogo y elegí un horario disponible. Se confirmará de inmediato.
        </p>
      </div>
    </div>
  );

  // Renderizar la pantalla correspondiente
  const renderizarContenidoPrincipal = () => {
    if (!usuarioActivo) {
      if (pantallaActiva === 'login') {
        return (
          <PantallaLogin
            vistaInicial="login"
            alVolverBienvenida={() => setPantallaActiva('bienvenida')}
            alIngresarExitoso={() => setPantallaActiva('inicio')}
            alMostrarNotificacion={agregarNotificacion}
          />
        );
      }
      if (pantallaActiva === 'registro') {
        return (
          <PantallaLogin
            vistaInicial="registro"
            alVolverBienvenida={() => setPantallaActiva('bienvenida')}
            alIngresarExitoso={() => setPantallaActiva('inicio')}
            alMostrarNotificacion={agregarNotificacion}
          />
        );
      }
      return (
        <PantallaBienvenida
          alIngresar={() => setPantallaActiva('login')}
          alRegistrarse={() => setPantallaActiva('registro')}
        />
      );
    }

    // Usuario Autenticado -> Renderizar panel principal
    switch (pantallaActiva) {
      case 'inicio':
        return (
          <PantallaPanelControlDashboard
            usuario={usuarioActivo}
            alSeleccionarMenu={(m) => setPantallaActiva(m)}
            alMostrarNotificacion={agregarNotificacion}
          />
        );

      case 'turnos':
        return usuarioActivo.role === 'PATIENT' ? (
          <PantallaKineTurnosPaciente alMostrarNotificacion={agregarNotificacion} />
        ) : (
          <PantallaGestionTurnosStaff alMostrarNotificacion={agregarNotificacion} />
        );

      case 'agenda':
        return <PantallaAgendaCalendario alMostrarNotificacion={agregarNotificacion} />;

      case 'pacientes':
        return <PantallaGestionPacientes alMostrarNotificacion={agregarNotificacion} />;

      case 'profesionales':
        return <PantallaRegistroProfesionales alMostrarNotificacion={agregarNotificacion} />;

      case 'servicios':
        return renderizarServicios();

      case 'reportes':
        return renderizarReportes();

      case 'configuracion':
        return usuarioActivo.role === 'ADMIN' ? (
          <PantallaAdministracionUsuarios alMostrarNotificacion={agregarNotificacion} />
        ) : (
          <PantallaPerfilSeguridad alMostrarNotificacion={agregarNotificacion} />
        );

      case 'perfil':
        return <PantallaPerfilSeguridad alMostrarNotificacion={agregarNotificacion} />;

      case 'ayuda':
        return renderizarAyuda();

      default:
        return (
          <PantallaPanelControlDashboard
            usuario={usuarioActivo}
            alSeleccionarMenu={(m) => setPantallaActiva(m)}
            alMostrarNotificacion={agregarNotificacion}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex font-sans selection:bg-[#eaf3ee] selection:text-[#234e3d]">
      
      {/* BARRA LATERAL DEL PANEL NUEVO (SI EL USUARIO ESTA AUTENTICADO) */}
      {usuarioActivo && barraLateralVisible && (
        <BarraLateral
          menuActivo={pantallaActiva}
          alSeleccionarMenu={(m) => setPantallaActiva(m)}
          usuario={usuarioActivo}
          alCerrarSesion={() => {
            cerrarSesion();
            setPantallaActiva('bienvenida');
          }}
        />
      )}

      {/* CONTENEDOR DERECHO */}
      <div className="flex-1 flex flex-col min-w-0">
        {usuarioActivo && (
          <EncabezadoSuperior
            usuario={usuarioActivo}
            alAlternarBarraLateral={() => setBarraLateralVisible(!barraLateralVisible)}
            alAbrirNotificaciones={() => agregarNotificacion('info', 'Notificaciones', 'Tenés turnos programados esta semana.')}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          {renderizarContenidoPrincipal()}
        </main>
      </div>

      {/* SISTEMA GLOBAL DE TOAST NOTIFICATION */}
      <NotificacionToast
        notificaciones={notificaciones}
        alCerrar={cerrarNotificacion}
      />
    </div>
  );
};

export function App() {
  return (
    <ProveedorAutenticacion>
      <ContenidoAplicacion />
    </ProveedorAutenticacion>
  );
}

export default App;

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAutenticacion } from './contexto/ContextoAutenticacion';
import { BarraLateral } from './componentes/navegacion/BarraLateral';
import { EncabezadoSuperior } from './componentes/navegacion/EncabezadoSuperior';
import { NotificacionToast, type MensajeToast } from './componentes/comunes/NotificacionToast';

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
import { PantallaGestionFeriados } from './pantallas/PantallaGestionFeriados';
import { HelpCircle, Stethoscope, BarChart3 } from 'lucide-react';

const RutasSistema: React.FC<{ agregarNotificacion: any }> = ({ agregarNotificacion }) => {
  const { usuario, cerrarSesion } = useAutenticacion();
  const [barraLateralVisible, setBarraLateralVisible] = useState<boolean>(true);

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

  if (!usuario) {
    return (
      <div className="w-full">
        <Routes>
          <Route path="/bienvenida" element={<PantallaBienvenida />} />
          <Route path="/login" element={<PantallaLogin vistaInicial="login" alMostrarNotificacion={agregarNotificacion} />} />
          <Route path="/registro" element={<PantallaLogin vistaInicial="registro" alMostrarNotificacion={agregarNotificacion} />} />
          <Route path="*" element={<Navigate to="/bienvenida" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <>
      {barraLateralVisible && (
        <BarraLateral
          usuario={usuario}
          alCerrarSesion={cerrarSesion}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <EncabezadoSuperior
          usuario={usuario}
          alAlternarBarraLateral={() => setBarraLateralVisible(!barraLateralVisible)}
          alAbrirNotificaciones={() => agregarNotificacion('info', 'Notificaciones', 'Tenés turnos programados esta semana.')}
        />
        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/" element={<PantallaPanelControlDashboard usuario={usuario} alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/turnos" element={usuario.role === 'PATIENT' ? <PantallaKineTurnosPaciente alMostrarNotificacion={agregarNotificacion} /> : <PantallaGestionTurnosStaff alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/agenda" element={<PantallaAgendaCalendario alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/pacientes" element={<PantallaGestionPacientes alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/profesionales" element={<PantallaRegistroProfesionales alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/feriados" element={<PantallaGestionFeriados alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/servicios" element={renderizarServicios()} />
            <Route path="/reportes" element={renderizarReportes()} />
            <Route path="/configuracion" element={usuario.role === 'ADMIN' ? <PantallaAdministracionUsuarios alMostrarNotificacion={agregarNotificacion} /> : <PantallaPerfilSeguridad alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/perfil" element={<PantallaPerfilSeguridad alMostrarNotificacion={agregarNotificacion} />} />
            <Route path="/ayuda" element={renderizarAyuda()} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export function App() {
  const [notificaciones, setNotificaciones] = useState<MensajeToast[]>([]);

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

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex font-sans selection:bg-[#eaf3ee] selection:text-[#234e3d]">
      <RutasSistema agregarNotificacion={agregarNotificacion} />
      <NotificacionToast
        notificaciones={notificaciones}
        alCerrar={cerrarNotificacion}
      />
    </div>
  );
}

export default App;

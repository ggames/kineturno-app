import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  UserX,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  ChevronDown,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { EstadoCarga } from '../componentes/comunes/EstadoCarga';
import {
  servicioReportes,
  type ReporteAusentismo,
  type ReporteOcupacion,
  type ReporteConsolidado,
  type FiltrosReporte,
} from '../servicios/servicioReportes';
import { servicioProfesionales } from '../servicios/servicioProfesionales';
import type { Profesional } from '../esquemas/tiposApi';

interface PropiedadesPantallaReportes {
  alMostrarNotificacion: (tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, mensaje: string) => void;
}

// ========================
// Componente Barra del gráfico
// ========================
const BarraGrafico: React.FC<{
  etiqueta: string;
  valor: number;
  maximo: number;
  color: string;
  secundario?: { valor: number; color: string };
}> = ({ etiqueta, valor, maximo, color, secundario }) => {
  const porcentaje = maximo > 0 ? Math.min((valor / maximo) * 100, 100) : 0;
  const porcentajeSecundario = secundario && maximo > 0 ? Math.min((secundario.valor / maximo) * 100, 100) : 0;

  return (
    <div className="flex items-end gap-1 group" title={`${etiqueta}: ${valor}`}>
      <div className="flex-1 flex flex-col items-center gap-1">
        {/* Valores sobre la barra */}
        <div className="text-[10px] font-bold text-[#4a5568] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {valor}
        </div>
        {/* Barras */}
        <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: '120px' }}>
          <div
            className="rounded-t-md transition-all duration-500 ease-out"
            style={{
              width: secundario ? '45%' : '70%',
              height: `${Math.max(porcentaje, 3)}%`,
              backgroundColor: color,
              minHeight: '4px',
            }}
          />
          {secundario && (
            <div
              className="rounded-t-md transition-all duration-500 ease-out"
              style={{
                width: '45%',
                height: `${Math.max(porcentajeSecundario, 3)}%`,
                backgroundColor: secundario.color,
                minHeight: '4px',
              }}
            />
          )}
        </div>
        {/* Etiqueta */}
        <span className="text-[10px] font-semibold text-[#718096] mt-1 truncate w-full text-center">
          {etiqueta}
        </span>
      </div>
    </div>
  );
};

// ========================
// Componente Tarjeta KPI
// ========================
const TarjetaKPI: React.FC<{
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icono: React.ReactNode;
  colorIcono: string;
  bgIcono: string;
  tendencia?: 'up' | 'down' | 'neutral';
  porcentaje?: number;
}> = ({ titulo, valor, subtitulo, icono, colorIcono, bgIcono, tendencia, porcentaje }) => (
  <div className="bg-white rounded-2xl border border-[#e8e6df] p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgIcono}`}>
        <span className={colorIcono}>{icono}</span>
      </div>
      {tendencia && porcentaje !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
          tendencia === 'up' ? 'bg-emerald-50 text-emerald-600' : 
          tendencia === 'down' ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-500'
        }`}>
          {tendencia === 'up' ? <ArrowUpRight className="w-3 h-3" /> : 
           tendencia === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
          {porcentaje}%
        </div>
      )}
    </div>
    <p className="text-2xl font-extrabold text-[#1a202c] tracking-tight">{valor}</p>
    <p className="text-xs font-medium text-[#718096] mt-1">{titulo}</p>
    {subtitulo && <p className="text-[10px] text-[#a0aec0] mt-0.5">{subtitulo}</p>}
  </div>
);

// ========================
// Indicador circular de porcentaje
// ========================
const IndicadorCircular: React.FC<{
  porcentaje: number;
  etiqueta: string;
  color: string;
  tamaño?: number;
}> = ({ porcentaje, etiqueta, color, tamaño = 90 }) => {
  const radio = (tamaño - 10) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (porcentaje / 100) * circunferencia;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Wrapper relativo para superponer el texto centrado sobre el SVG */}
      <div className="relative flex items-center justify-center" style={{ width: tamaño, height: tamaño }}>
        <svg width={tamaño} height={tamaño} className="transform -rotate-90">
          <circle
            cx={tamaño / 2}
            cy={tamaño / 2}
            r={radio}
            fill="none"
            stroke="#e8e6df"
            strokeWidth="6"
          />
          <circle
            cx={tamaño / 2}
            cy={tamaño / 2}
            r={radio}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Texto superpuesto, centrado dentro del SVG */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-extrabold text-[#1a202c]">{porcentaje}%</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-[#718096] text-center leading-tight">{etiqueta}</span>
    </div>
  );
};

// ========================
// Nombres de meses en español
// ========================
const NOMBRE_MES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function formatearMes(mesISO: string): string {
  const partes = mesISO.split('-');
  if (partes.length === 2) {
    return `${NOMBRE_MES[partes[1]] || partes[1]} ${partes[0]}`;
  }
  return mesISO;
}

function formatearMesCorto(mesISO: string): string {
  const partes = mesISO.split('-');
  if (partes.length === 2) {
    return NOMBRE_MES[partes[1]] || partes[1];
  }
  return mesISO;
}

// ========================
// Pantalla Principal de Reportes
// ========================
export const PantallaReportesEstadisticas: React.FC<PropiedadesPantallaReportes> = ({
  alMostrarNotificacion,
}) => {
  const [cargando, setCargando] = useState(true);
  const [reporteAusentismo, setReporteAusentismo] = useState<ReporteAusentismo | null>(null);
  const [reporteOcupacion, setReporteOcupacion] = useState<ReporteOcupacion | null>(null);
  const [reporteConsolidado, setReporteConsolidado] = useState<ReporteConsolidado | null>(null);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [tabActiva, setTabActiva] = useState<'ausentismo' | 'ocupacion' | 'consolidado'>('consolidado');
  const [filtrosMostrados, setFiltrosMostrados] = useState(false);

  // Filtros
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroProfesional, setFiltroProfesional] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const filtros: FiltrosReporte = {};
      if (filtroDesde) filtros.from = filtroDesde;
      if (filtroHasta) filtros.to = filtroHasta;
      if (filtroProfesional) filtros.professionalId = filtroProfesional;

      const [ausentismo, ocupacion, consolidado, profs] = await Promise.all([
        servicioReportes.obtenerReporteAusentismo(filtros).catch(() => null),
        servicioReportes.obtenerReporteOcupacion(filtros).catch(() => null),
        servicioReportes.obtenerReporteConsolidado(filtros).catch(() => null),
        servicioProfesionales.obtenerProfesionales().catch(() => []),
      ]);

      setReporteAusentismo(ausentismo);
      setReporteOcupacion(ocupacion);
      setReporteConsolidado(consolidado);
      setProfesionales(profs);
    } catch {
      alMostrarNotificacion('error', 'Error', 'No se pudieron cargar los reportes. Verificá que el backend esté activo.');
    } finally {
      setCargando(false);
    }
  }, [filtroDesde, filtroHasta, filtroProfesional, alMostrarNotificacion]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (cargando) {
    return <EstadoCarga mensaje="Cargando reportes y estadísticas..." />;
  }

  const tabs = [
    { id: 'consolidado' as const, etiqueta: 'Consolidado', icono: <PieChart className="w-4 h-4" /> },
    { id: 'ausentismo' as const, etiqueta: 'Ausentismo', icono: <UserX className="w-4 h-4" /> },
    { id: 'ocupacion' as const, etiqueta: 'Ocupación', icono: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animacion-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1a202c] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eaf3ee] text-[#598b76] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            Reportes y Estadísticas
          </h2>
          <p className="text-xs text-[#718096] mt-1 ml-[52px]">
            Métricas de ausentismo, ocupación de agenda y rendimiento general de la clínica.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltrosMostrados(!filtrosMostrados)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e8e6df] bg-white text-sm font-semibold text-[#4a5568] hover:bg-[#f3f1ea] transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtrosMostrados ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#598b76] text-white text-sm font-semibold hover:bg-[#4a7a65] transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros desplegables */}
      {filtrosMostrados && (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-5 shadow-sm animacion-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#4a5568] block mb-1.5">Desde</label>
              <input
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] text-sm text-[#2d3748] focus:outline-none focus:ring-2 focus:ring-[#598b76]/30 focus:border-[#598b76]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a5568] block mb-1.5">Hasta</label>
              <input
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] text-sm text-[#2d3748] focus:outline-none focus:ring-2 focus:ring-[#598b76]/30 focus:border-[#598b76]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a5568] block mb-1.5">Profesional</label>
              <select
                value={filtroProfesional}
                onChange={(e) => setFiltroProfesional(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] text-sm text-[#2d3748] focus:outline-none focus:ring-2 focus:ring-[#598b76]/30 focus:border-[#598b76] bg-white"
              >
                <option value="">Todos los profesionales</option>
                {profesionales.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.person ? `${p.person.firstName} ${p.person.lastName}` : p.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={() => { setFiltroDesde(''); setFiltroHasta(''); setFiltroProfesional(''); }}
              className="px-4 py-2 rounded-xl border border-[#e8e6df] text-xs font-semibold text-[#718096] hover:bg-[#f3f1ea] transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={cargarDatos}
              className="px-4 py-2 rounded-xl bg-[#598b76] text-white text-xs font-semibold hover:bg-[#4a7a65] transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f3f1ea] p-1 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tabActiva === tab.id
                ? 'bg-white text-[#1a202c] shadow-sm'
                : 'text-[#718096] hover:text-[#4a5568]'
            }`}
          >
            {tab.icono}
            {tab.etiqueta}
          </button>
        ))}
      </div>

      {/* Contenido según tab activa */}
      {tabActiva === 'consolidado' && renderConsolidado(reporteConsolidado, reporteAusentismo)}
      {tabActiva === 'ausentismo' && renderAusentismo(reporteAusentismo)}
      {tabActiva === 'ocupacion' && renderOcupacion(reporteOcupacion)}
    </div>
  );
};

// ========================
// Tab: Consolidado
// ========================
function renderConsolidado(
  consolidado: ReporteConsolidado | null,
  ausentismo: ReporteAusentismo | null,
) {
  if (!consolidado) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e6df] p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-[#d69e2e] mx-auto mb-4" />
        <p className="text-sm font-semibold text-[#4a5568]">No se pudieron cargar los datos consolidados.</p>
        <p className="text-xs text-[#718096] mt-1">Verificá que el backend esté activo y volvé a intentar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animacion-fade-in">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaKPI
          titulo="Total Turnos"
          valor={consolidado.totalAppointments}
          subtitulo={`Período: ${consolidado.period.from} al ${consolidado.period.to}`}
          icono={<Calendar className="w-5 h-5" />}
          colorIcono="text-[#598b76]"
          bgIcono="bg-[#eaf3ee]"
        />
        <TarjetaKPI
          titulo="Tasa de Asistencia"
          valor={`${consolidado.attendanceRate}%`}
          subtitulo="Turnos asistidos / total efectivo"
          icono={<CheckCircle2 className="w-5 h-5" />}
          colorIcono="text-emerald-600"
          bgIcono="bg-emerald-50"
          tendencia={consolidado.attendanceRate >= 80 ? 'up' : 'down'}
          porcentaje={consolidado.attendanceRate}
        />
        <TarjetaKPI
          titulo="Ocupación de Agenda"
          valor={`${consolidado.occupancyRate}%`}
          subtitulo="Slots asignados / slots totales"
          icono={<Clock className="w-5 h-5" />}
          colorIcono="text-blue-600"
          bgIcono="bg-blue-50"
          tendencia={consolidado.occupancyRate >= 60 ? 'up' : 'down'}
          porcentaje={consolidado.occupancyRate}
        />
        <TarjetaKPI
          titulo="Tasa de Ausentismo"
          valor={`${consolidado.absenteeismRate}%`}
          subtitulo="No presentados + Ausentes"
          icono={<UserX className="w-5 h-5" />}
          colorIcono="text-rose-500"
          bgIcono="bg-rose-50"
          tendencia={consolidado.absenteeismRate <= 15 ? 'up' : 'down'}
          porcentaje={consolidado.absenteeismRate}
        />
      </div>

      {/* Fila de indicadores circulares + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Indicadores circulares */}
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1a202c] mb-5">Indicadores Generales</h3>
          <div className="flex justify-around">
            <IndicadorCircular
              porcentaje={consolidado.attendanceRate}
              etiqueta="Asistencia"
              color="#598b76"
            />
            <IndicadorCircular
              porcentaje={consolidado.occupancyRate}
              etiqueta="Ocupación"
              color="#3b82f6"
            />
            <IndicadorCircular
              porcentaje={100 - consolidado.absenteeismRate}
              etiqueta="Compromiso"
              color="#f59e0b"
            />
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1a202c] mb-4">Resumen Clínico</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#f3f1ea]">
              <span className="flex items-center gap-2 text-xs text-[#718096]">
                <Users className="w-4 h-4 text-[#598b76]" /> Pacientes registrados
              </span>
              <span className="text-sm font-bold text-[#1a202c]">{consolidado.totalPatients}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#f3f1ea]">
              <span className="flex items-center gap-2 text-xs text-[#718096]">
                <Activity className="w-4 h-4 text-blue-500" /> Profesionales activos
              </span>
              <span className="text-sm font-bold text-[#1a202c]">{consolidado.totalProfessionals}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#f3f1ea]">
              <span className="flex items-center gap-2 text-xs text-[#718096]">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Sesiones/Paciente (prom.)
              </span>
              <span className="text-sm font-bold text-[#1a202c]">{consolidado.averageSessionsPerPatient}</span>
            </div>
          </div>
        </div>

        {/* Estado rápido de turnos */}
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1a202c] mb-4">Estado de Turnos</h3>
          {ausentismo ? (
            <div className="space-y-3">
              {[
                { etiqueta: 'Completados', valor: ausentismo.completedAppointments, color: 'bg-emerald-500', total: ausentismo.totalAppointments },
                { etiqueta: 'Cancelados', valor: ausentismo.cancelledAppointments, color: 'bg-amber-400', total: ausentismo.totalAppointments },
                { etiqueta: 'No presentados', valor: ausentismo.noShowAppointments, color: 'bg-rose-500', total: ausentismo.totalAppointments },
                { etiqueta: 'Ausentes', valor: ausentismo.absentAppointments, color: 'bg-purple-500', total: ausentismo.totalAppointments },
              ].map((item) => (
                <div key={item.etiqueta} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#718096]">{item.etiqueta}</span>
                    <span className="text-xs font-bold text-[#1a202c]">{item.valor}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f3f1ea] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.total > 0 ? (item.valor / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#718096]">Sin datos disponibles</p>
          )}
        </div>
      </div>

      {/* Gráfico de barras mensual consolidado */}
      {ausentismo && ausentismo.monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#1a202c]">Evolución Mensual de Turnos</h3>
              <p className="text-[10px] text-[#718096] mt-0.5">Comparativa de turnos completados vs. ausentes por mes</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#598b76]" />
                Completados
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                Ausentes
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2 border-b border-[#f3f1ea] pb-2" style={{ minHeight: '160px' }}>
            {ausentismo.monthlyBreakdown.map((mes) => {
              // Usar reduce en vez de spread para evitar stack overflow con arrays grandes
              const maxVal = ausentismo.monthlyBreakdown.reduce((acc, m) => Math.max(acc, m.total), 0);
              return (
                <BarraGrafico
                  key={mes.month}
                  etiqueta={formatearMesCorto(mes.month)}
                  valor={mes.completed}
                  maximo={maxVal}
                  color="#598b76"
                  secundario={{ valor: mes.noShow + mes.absent, color: '#f87171' }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// Tab: Ausentismo
// ========================
function renderAusentismo(ausentismo: ReporteAusentismo | null) {
  if (!ausentismo) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e6df] p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-[#d69e2e] mx-auto mb-4" />
        <p className="text-sm font-semibold text-[#4a5568]">No se pudo cargar el reporte de ausentismo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animacion-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <TarjetaKPI
          titulo="Total Turnos"
          valor={ausentismo.totalAppointments}
          icono={<Calendar className="w-5 h-5" />}
          colorIcono="text-[#598b76]"
          bgIcono="bg-[#eaf3ee]"
        />
        <TarjetaKPI
          titulo="Completados"
          valor={ausentismo.completedAppointments}
          icono={<CheckCircle2 className="w-5 h-5" />}
          colorIcono="text-emerald-600"
          bgIcono="bg-emerald-50"
        />
        <TarjetaKPI
          titulo="Cancelados"
          valor={ausentismo.cancelledAppointments}
          icono={<XCircle className="w-5 h-5" />}
          colorIcono="text-amber-600"
          bgIcono="bg-amber-50"
        />
        <TarjetaKPI
          titulo="No presentados"
          valor={ausentismo.noShowAppointments}
          icono={<UserX className="w-5 h-5" />}
          colorIcono="text-rose-500"
          bgIcono="bg-rose-50"
        />
        <TarjetaKPI
          titulo="Ausentes"
          valor={ausentismo.absentAppointments}
          icono={<AlertTriangle className="w-5 h-5" />}
          colorIcono="text-purple-600"
          bgIcono="bg-purple-50"
        />
      </div>

      {/* Gráfico de barras mensual */}
      {ausentismo.monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1a202c] mb-1">Desglose Mensual de Ausentismo</h3>
          <p className="text-[10px] text-[#718096] mb-5">Tasa de asistencia y ausencias mensuales</p>
          
          {/* Tabla / barras horizontales */}
          <div className="space-y-3">
            {ausentismo.monthlyBreakdown.map((mes) => (
              <div key={mes.month} className="flex items-center gap-4">
                <span className="text-xs font-semibold text-[#4a5568] w-20 shrink-0">{formatearMes(mes.month)}</span>
                <div className="flex-1 flex items-center gap-2">
                  {/* Barra de asistencia */}
                  <div className="flex-1 h-6 bg-[#f3f1ea] rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-[#598b76] rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${mes.attendanceRate}%` }}
                    >
                      {mes.attendanceRate > 15 && (
                        <span className="text-[9px] font-bold text-white">{mes.attendanceRate}%</span>
                      )}
                    </div>
                    {/* Parte de ausentes: guardar contra división por cero */}
                    {(mes.noShow + mes.absent) > 0 && (mes.total - mes.cancelled) > 0 && (
                      <div
                        className="absolute top-0 right-0 h-full bg-rose-400/80 rounded-r-lg"
                        style={{ width: `${Math.min(((mes.noShow + mes.absent) / (mes.total - mes.cancelled)) * 100, 100)}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-[#718096] w-12 text-right shrink-0">{mes.total} t.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de pacientes con mayor ausentismo */}
      {ausentismo.topAbsentPatients.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1a202c] mb-1">Pacientes con Mayor Ausentismo</h3>
          <p className="text-[10px] text-[#718096] mb-4">Top 10 pacientes que faltaron o abandonaron turnos</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e8e6df]">
                  <th className="text-left text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Paciente</th>
                  <th className="text-center text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Total Turnos</th>
                  <th className="text-center text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Ausencias</th>
                  <th className="text-center text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Tasa</th>
                </tr>
              </thead>
              <tbody>
                {ausentismo.topAbsentPatients.map((paciente, idx) => (
                  <tr key={paciente.patientId} className={`border-b border-[#f3f1ea] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fdfcfa]'}`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">
                          {paciente.patientName
                            ? paciente.patientName
                                .trim()
                                .split(/\s+/)
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()
                            : '?'}
                        </div>
                        <span className="text-xs font-semibold text-[#2d3748]">{paciente.patientName}</span>
                      </div>
                    </td>
                    <td className="text-center text-xs text-[#4a5568] py-3 px-3">{paciente.totalAppointments}</td>
                    <td className="text-center py-3 px-3">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">{paciente.missedAppointments}</span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        paciente.absenteeismRate > 50 ? 'bg-rose-50 text-rose-600' :
                        paciente.absenteeismRate > 25 ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {paciente.absenteeismRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// Tab: Ocupación de Agenda
// ========================
function renderOcupacion(ocupacion: ReporteOcupacion | null) {
  if (!ocupacion) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e6df] p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-[#d69e2e] mx-auto mb-4" />
        <p className="text-sm font-semibold text-[#4a5568]">No se pudo cargar el reporte de ocupación.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animacion-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaKPI
          titulo="Slots Totales"
          valor={ocupacion.totalSlots}
          icono={<Clock className="w-5 h-5" />}
          colorIcono="text-[#598b76]"
          bgIcono="bg-[#eaf3ee]"
        />
        <TarjetaKPI
          titulo="Slots Ocupados"
          valor={ocupacion.bookedSlots}
          subtitulo={`${ocupacion.occupancyRate}% de ocupación`}
          icono={<CheckCircle2 className="w-5 h-5" />}
          colorIcono="text-blue-600"
          bgIcono="bg-blue-50"
        />
        <TarjetaKPI
          titulo="Slots Disponibles"
          valor={ocupacion.availableSlots}
          icono={<Calendar className="w-5 h-5" />}
          colorIcono="text-emerald-600"
          bgIcono="bg-emerald-50"
        />
        <TarjetaKPI
          titulo="Slots Bloqueados"
          valor={ocupacion.blockedSlots}
          icono={<XCircle className="w-5 h-5" />}
          colorIcono="text-amber-600"
          bgIcono="bg-amber-50"
        />
      </div>

      {/* Gráfico de barras mensual de ocupación */}
      {ocupacion.monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#1a202c]">Ocupación Mensual de Agenda</h3>
              <p className="text-[10px] text-[#718096] mt-0.5">Slots ocupados vs disponibles por mes</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                Ocupados
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                Disponibles
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2 border-b border-[#f3f1ea] pb-2" style={{ minHeight: '160px' }}>
            {ocupacion.monthlyBreakdown.map((mes) => {
              // Usar reduce en vez de spread para evitar stack overflow con arrays grandes
              const maxVal = ocupacion.monthlyBreakdown.reduce((acc, m) => Math.max(acc, m.totalSlots), 0);
              return (
                <BarraGrafico
                  key={mes.month}
                  etiqueta={formatearMesCorto(mes.month)}
                  valor={mes.bookedSlots}
                  maximo={maxVal}
                  color="#3b82f6"
                  secundario={{ valor: mes.availableSlots, color: '#34d399' }}
                />
              );
            })}
          </div>

          {/* Tabla mensual */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e8e6df]">
                  <th className="text-left text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Mes</th>
                  <th className="text-center text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Total</th>
                  <th className="text-center text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Ocupados</th>
                  <th className="text-center text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">Disponibles</th>
                  <th className="text-center text-[10px] font-semibold text-[#718096] uppercase tracking-wider py-2 px-3">% Ocupación</th>
                </tr>
              </thead>
              <tbody>
                {ocupacion.monthlyBreakdown.map((mes, idx) => (
                  <tr key={mes.month} className={`border-b border-[#f3f1ea] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fdfcfa]'}`}>
                    <td className="py-2.5 px-3 text-xs font-semibold text-[#2d3748]">{formatearMes(mes.month)}</td>
                    <td className="text-center text-xs text-[#4a5568] py-2.5 px-3">{mes.totalSlots}</td>
                    <td className="text-center text-xs text-[#4a5568] py-2.5 px-3">{mes.bookedSlots}</td>
                    <td className="text-center text-xs text-[#4a5568] py-2.5 px-3">{mes.availableSlots}</td>
                    <td className="text-center py-2.5 px-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        mes.occupancyRate >= 80 ? 'bg-emerald-50 text-emerald-600' :
                        mes.occupancyRate >= 50 ? 'bg-blue-50 text-blue-600' :
                        mes.occupancyRate >= 25 ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {mes.occupancyRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ocupación diaria (últimos N días) */}
      {ocupacion.dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1a202c] mb-1">Heatmap Diario de Ocupación</h3>
          <p className="text-[10px] text-[#718096] mb-4">Porcentaje de ocupación por día</p>
          <div className="flex flex-wrap gap-1.5">
            {ocupacion.dailyBreakdown.slice(-60).map((dia) => {
              const intensity = dia.occupancyRate;
              let bgColor = 'bg-gray-100';
              if (intensity >= 80) bgColor = 'bg-emerald-500';
              else if (intensity >= 60) bgColor = 'bg-emerald-400';
              else if (intensity >= 40) bgColor = 'bg-emerald-300';
              else if (intensity >= 20) bgColor = 'bg-emerald-200';
              else if (intensity > 0) bgColor = 'bg-emerald-100';

              return (
                <div
                  key={dia.date}
                  className={`w-5 h-5 rounded-sm ${bgColor} transition-colors cursor-pointer hover:ring-2 hover:ring-[#598b76]/30`}
                  title={`${dia.date}: ${dia.occupancyRate}% (${dia.bookedSlots}/${dia.totalSlots})`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-[#718096]">
            <span>Baja</span>
            <div className="flex gap-0.5">
              <span className="w-3 h-3 rounded-sm bg-gray-100" />
              <span className="w-3 h-3 rounded-sm bg-emerald-100" />
              <span className="w-3 h-3 rounded-sm bg-emerald-200" />
              <span className="w-3 h-3 rounded-sm bg-emerald-300" />
              <span className="w-3 h-3 rounded-sm bg-emerald-400" />
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            </div>
            <span>Alta</span>
          </div>
        </div>
      )}
    </div>
  );
}

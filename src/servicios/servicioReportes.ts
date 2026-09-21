import { clienteApi } from './clienteApi';

// ========================
// Tipos de Respuesta del Backend
// ========================

export interface DesgloseMensualAusentismo {
  month: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  absent: number;
  attendanceRate: number;
}

export interface PacienteAusente {
  patientId: string;
  patientName: string;
  totalAppointments: number;
  missedAppointments: number;
  absenteeismRate: number;
}

export interface ReporteAusentismo {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  absentAppointments: number;
  attendanceRate: number;
  absenteeismRate: number;
  monthlyBreakdown: DesgloseMensualAusentismo[];
  topAbsentPatients: PacienteAusente[];
}

export interface DesgloseMensualOcupacion {
  month: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  occupancyRate: number;
}

export interface DesgloseDiarioOcupacion {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number;
}

export interface ReporteOcupacion {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  blockedSlots: number;
  occupancyRate: number;
  monthlyBreakdown: DesgloseMensualOcupacion[];
  dailyBreakdown: DesgloseDiarioOcupacion[];
}

export interface ReporteConsolidado {
  period: { from: string; to: string };
  totalPatients: number;
  totalProfessionals: number;
  totalAppointments: number;
  attendanceRate: number;
  occupancyRate: number;
  absenteeismRate: number;
  averageSessionsPerPatient: number;
}

export interface FiltrosReporte {
  from?: string;
  to?: string;
  professionalId?: string;
}

// ========================
// Servicio de Reportes
// ========================

export const servicioReportes = {
  async obtenerReporteAusentismo(filtros?: FiltrosReporte): Promise<ReporteAusentismo> {
    const params = new URLSearchParams();
    if (filtros?.from) params.append('from', filtros.from);
    if (filtros?.to) params.append('to', filtros.to);
    if (filtros?.professionalId) params.append('professionalId', filtros.professionalId);
    const query = params.toString();
    const respuesta = await clienteApi.get<ReporteAusentismo>(`/reports/absenteeism${query ? `?${query}` : ''}`);
    return respuesta.data;
  },

  async obtenerReporteOcupacion(filtros?: FiltrosReporte): Promise<ReporteOcupacion> {
    const params = new URLSearchParams();
    if (filtros?.from) params.append('from', filtros.from);
    if (filtros?.to) params.append('to', filtros.to);
    if (filtros?.professionalId) params.append('professionalId', filtros.professionalId);
    const query = params.toString();
    const respuesta = await clienteApi.get<ReporteOcupacion>(`/reports/schedule-occupancy${query ? `?${query}` : ''}`);
    return respuesta.data;
  },

  async obtenerReporteConsolidado(filtros?: FiltrosReporte): Promise<ReporteConsolidado> {
    const params = new URLSearchParams();
    if (filtros?.from) params.append('from', filtros.from);
    if (filtros?.to) params.append('to', filtros.to);
    if (filtros?.professionalId) params.append('professionalId', filtros.professionalId);
    const query = params.toString();
    const respuesta = await clienteApi.get<ReporteConsolidado>(`/reports/consolidated${query ? `?${query}` : ''}`);
    return respuesta.data;
  },
};

import { clienteApi } from './clienteApi';
import type { AgendaDiaria, SlotHorario, HorarioSemanal } from '../esquemas/tiposApi';

export interface PeticionCrearAgenda {
  professionalId: string;
  date: string;
  startHour?: number;
  endHour?: number;
  maxCapacity?: number;
}

export const servicioAgenda = {
  async obtenerAgendas(): Promise<AgendaDiaria[]> {
    const respuesta = await clienteApi.get<AgendaDiaria[]>('/agenda');
    return respuesta.data;
  },

  async obtenerAgendasDiarias(): Promise<AgendaDiaria[]> {
    try {
      const respuesta = await clienteApi.get<AgendaDiaria[]>('/daily-agenda');
      return respuesta.data;
    } catch {
      return this.obtenerAgendas();
    }
  },

  async obtenerTimeSlots(): Promise<SlotHorario[]> {
    const respuesta = await clienteApi.get<SlotHorario[]>('/time-slot');
    return respuesta.data;
  },

  async obtenerHorariosSemanales(): Promise<HorarioSemanal[]> {
    const respuesta = await clienteApi.get<HorarioSemanal[]>('/weekly-schedule');
    return respuesta.data;
  },

  async guardarHorariosSemanalesLote(horarios: Partial<HorarioSemanal>[]): Promise<HorarioSemanal[]> {
    try {
      const respuesta = await clienteApi.post<HorarioSemanal[]>('/weekly-schedule/bulk', horarios);
      return respuesta.data;
    } catch {
      const respuesta = await clienteApi.put<HorarioSemanal[]>('/weekly-schedule/bulk', horarios);
      return respuesta.data;
    }
  },

  async obtenerSlotsDeAgenda(agendaId: string): Promise<SlotHorario[]> {
    const respuesta = await clienteApi.get<SlotHorario[]>(`/agenda/${agendaId}/slots`);
    return respuesta.data;
  },

  async crearAgendaDiaria(datos: PeticionCrearAgenda): Promise<AgendaDiaria> {
    const respuesta = await clienteApi.post<AgendaDiaria>('/agenda', datos);
    return respuesta.data;
  },

  async actualizarCapacidadSlot(slotId: string, maxCapacity: number): Promise<SlotHorario> {
    try {
      const respuesta = await clienteApi.patch<SlotHorario>(`/time-slot/${slotId}/capacity`, { maxCapacity });
      return respuesta.data;
    } catch {
      try {
        const respuesta = await clienteApi.put<SlotHorario>(`/time-slot/${slotId}`, { maxCapacity });
        return respuesta.data;
      } catch {
        const respuesta = await clienteApi.patch<SlotHorario>(`/agenda/slots/${slotId}/capacity`, { maxCapacity });
        return respuesta.data;
      }
    }
  },

  async actualizarCapacidadAgenda(agendaId: string, maxCapacity: number): Promise<SlotHorario[]> {
    try {
      const respuesta = await clienteApi.patch<SlotHorario[]>(`/time-slot/agenda/${agendaId}/capacity`, { maxCapacity });
      return respuesta.data;
    } catch {
      const respuesta = await clienteApi.patch<SlotHorario[]>(`/agenda/${agendaId}/capacity`, { maxCapacity });
      return respuesta.data;
    }
  },

  async actualizarCapacidadGlobal(maxCapacity: number): Promise<SlotHorario[]> {
    try {
      const respuesta = await clienteApi.patch<SlotHorario[]>(`/time-slot/capacity/global`, { maxCapacity });
      return respuesta.data;
    } catch {
      const respuesta = await clienteApi.patch<SlotHorario[]>(`/agenda/capacity/global`, { maxCapacity });
      return respuesta.data;
    }
  }
};

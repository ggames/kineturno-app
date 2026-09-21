import { clienteApi } from './clienteApi';
import type { Turno, PeticionCrearTurno } from '../esquemas/tiposApi';

export const servicioTurnos = {
  async obtenerMisTurnos(): Promise<Turno[]> {
    const respuesta = await clienteApi.get<Turno[]>('/appointments/my-appointments');
    return respuesta.data;
  },

  async obtenerTurnos(): Promise<Turno[]> {
    const respuesta = await clienteApi.get<Turno[]>('/appointments');
    return respuesta.data;
  },

  async crearTurno(datos: PeticionCrearTurno): Promise<Turno> {
    const respuesta = await clienteApi.post<Turno>('/appointments', datos);
    return respuesta.data;
  },

  async cancelarTurno(idTurno: string): Promise<Turno> {
    const respuesta = await clienteApi.patch<Turno>(`/appointments/${idTurno}/cancel`);
    return respuesta.data;
  },

  async actualizarEstadoTurno(idTurno: string, status: string): Promise<Turno> {
    try {
      const respuesta = await clienteApi.patch<Turno>(`/appointments/${idTurno}/status`, { status });
      return respuesta.data;
    } catch {
      const respuesta = await clienteApi.patch<Turno>(`/appointments/${idTurno}`, { status });
      return respuesta.data;
    }
  }
};

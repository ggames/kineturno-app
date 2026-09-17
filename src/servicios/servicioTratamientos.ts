import { clienteApi } from './clienteApi';
import type { Tratamiento } from '../esquemas/tiposApi';

export interface PeticionCrearTratamiento {
  patientId: string;
  professionalId: string;
  description: string;
  totalSessions: number;
}

export const servicioTratamientos = {
  async obtenerTratamientos(): Promise<Tratamiento[]> {
    const respuesta = await clienteApi.get<Tratamiento[]>('/treatments');
    return respuesta.data;
  },

  async crearTratamiento(datos: PeticionCrearTratamiento): Promise<Tratamiento> {
    const respuesta = await clienteApi.post<Tratamiento>('/treatments', datos);
    return respuesta.data;
  }
};

import { clienteApi } from './clienteApi';
import type { Profesional } from '../esquemas/tiposApi';

export const servicioProfesionales = {
  async obtenerProfesionales(): Promise<Profesional[]> {
    const respuesta = await clienteApi.get<Profesional[]>('/professionals');
    return respuesta.data;
  },

  async crearProfesional(datos: Partial<Profesional>): Promise<Profesional> {
    const respuesta = await clienteApi.post<Profesional>('/professionals', datos);
    return respuesta.data;
  }
};

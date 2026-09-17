import { clienteApi } from './clienteApi';
import type { Persona } from '../esquemas/tiposApi';

export const servicioPersonas = {
  async obtenerPersonas(): Promise<Persona[]> {
    const respuesta = await clienteApi.get<Persona[]>('/persons');
    return respuesta.data;
  },

  async obtenerPersonaPorId(id: string): Promise<Persona> {
    const respuesta = await clienteApi.get<Persona>(`/persons/${id}`);
    return respuesta.data;
  },

  async actualizarPersona(id: string, datos: Partial<Persona>): Promise<Persona> {
    const respuesta = await clienteApi.put<Persona>(`/persons/${id}`, datos);
    return respuesta.data;
  },

  async crearPersona(datos: Partial<Persona>): Promise<Persona> {
    const respuesta = await clienteApi.post<Persona>('/persons', datos);
    return respuesta.data;
  }
};

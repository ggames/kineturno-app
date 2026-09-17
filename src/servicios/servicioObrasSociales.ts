import { clienteApi } from './clienteApi';
import type { ObraSocial } from '../esquemas/tiposApi';

export const servicioObrasSociales = {
  async obtenerObrasSociales(): Promise<ObraSocial[]> {
    const respuesta = await clienteApi.get<ObraSocial[]>('/health-insurances');
    return respuesta.data;
  },

  async obtenerObraSocialPorId(id: string): Promise<ObraSocial> {
    const respuesta = await clienteApi.get<ObraSocial>(`/health-insurances/${id}`);
    return respuesta.data;
  },

  async crearObraSocial(datos: { name: string; coverageDetails?: string }): Promise<ObraSocial> {
    const respuesta = await clienteApi.post<ObraSocial>('/health-insurances', datos);
    return respuesta.data;
  }
};

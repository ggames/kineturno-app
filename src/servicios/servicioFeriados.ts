import { clienteApi } from './clienteApi';
import type { Feriado } from '../esquemas/tiposApi';

export const servicioFeriados = {
  async obtenerFeriados(): Promise<Feriado[]> {
    try {
      const respuesta = await clienteApi.get<Feriado[]>('/holiday');
      return respuesta.data;
    } catch {
      return [];
    }
  }
};

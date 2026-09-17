import { clienteApi } from './clienteApi';
import type { Paciente } from '../esquemas/tiposApi';

export interface PeticionCrearPacienteDirecto {
  firstName: string;
  lastName: string;
  documentId: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  obraSocialId?: string;
  healthInsuranceId?: string;
  prepagaId?: string;
}

export const servicioPacientes = {
  async obtenerPacientes(): Promise<Paciente[]> {
    const respuesta = await clienteApi.get<Paciente[]>('/patients');
    return respuesta.data;
  },

  async crearPacienteDirecto(datos: PeticionCrearPacienteDirecto): Promise<Paciente> {
    const respuesta = await clienteApi.post<Paciente>('/patients', datos);
    return respuesta.data;
  },

  async actualizarPaciente(personaId: string, datosPersona: Partial<PeticionCrearPacienteDirecto>): Promise<any> {
    const respuesta = await clienteApi.put(`/persons/${personaId}`, datosPersona);
    return respuesta.data;
  },

  async eliminarPaciente(personaId: string): Promise<void> {
    try {
      await clienteApi.delete(`/persons/${personaId}`);
    } catch {
      await clienteApi.delete(`/patients/${personaId}`);
    }
  }
};

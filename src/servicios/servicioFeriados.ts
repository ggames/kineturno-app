import { clienteApi } from './clienteApi';
import type { Feriado, PeticionCrearFeriado } from '../esquemas/tiposApi';

const CLAVE_LOCAL = 'feriados_kineturnos';

// Feriados por defecto de Argentina para pruebas offline/demostración
const feriadosPorDefecto: Feriado[] = [
  {
    id: 'feriado-def-1',
    date: '2026-05-25',
    type: 'TOTAL',
    description: 'Día de la Revolución de Mayo',
  },
  {
    id: 'feriado-def-2',
    date: '2026-07-09',
    type: 'TOTAL',
    description: 'Día de la Independencia',
  },
  {
    id: 'feriado-def-3',
    date: '2026-10-12',
    type: 'TOTAL',
    description: 'Día del Respeto a la Diversidad Cultural',
  },
  {
    id: 'feriado-def-4',
    date: '2026-12-25',
    type: 'TOTAL',
    description: 'Navidad',
  },
];

function obtenerFeriadosLocales(): Feriado[] {
  try {
    const datos = localStorage.getItem(CLAVE_LOCAL);
    if (!datos) {
      localStorage.setItem(CLAVE_LOCAL, JSON.stringify(feriadosPorDefecto));
      return feriadosPorDefecto;
    }
    return JSON.parse(datos) as Feriado[];
  } catch {
    return feriadosPorDefecto;
  }
}

function guardarFeriadosLocales(lista: Feriado[]): void {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(lista));
  } catch {
    // Ignorar fallos de cuota local
  }
}

export const servicioFeriados = {
  async obtenerFeriados(): Promise<Feriado[]> {
    try {
      const respuesta = await clienteApi.get<Feriado[]>('/holiday');
      if (Array.isArray(respuesta.data) && respuesta.data.length > 0) {
        guardarFeriadosLocales(respuesta.data);
        return respuesta.data;
      }
      return obtenerFeriadosLocales();
    } catch {
      return obtenerFeriadosLocales();
    }
  },

  async crearFeriado(datos: PeticionCrearFeriado): Promise<Feriado> {
    try {
      const respuesta = await clienteApi.post<Feriado>('/holiday', datos);
      const nuevoFeriado = respuesta.data;
      const locales = obtenerFeriadosLocales();
      guardarFeriadosLocales([...locales, nuevoFeriado]);
      return nuevoFeriado;
    } catch {
      // Fallback local si backend API no está disponible
      const locales = obtenerFeriadosLocales();
      const nuevoFeriado: Feriado = {
        id: 'feriado-local-' + Date.now(),
        date: datos.date,
        type: datos.type,
        description: datos.description || 'Feriado / Asueto',
        partialStartTime: datos.partialStartTime,
        partialEndTime: datos.partialEndTime,
      };
      const actualizados = [...locales, nuevoFeriado];
      guardarFeriadosLocales(actualizados);
      return nuevoFeriado;
    }
  },

  async eliminarFeriado(id: string): Promise<void> {
    try {
      await clienteApi.delete(`/holiday/${id}`);
    } catch {
      // Ignorar fallo de red
    } finally {
      const locales = obtenerFeriadosLocales();
      const filtrados = locales.filter((f) => f.id !== id);
      guardarFeriadosLocales(filtrados);
    }
  }
};

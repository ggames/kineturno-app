/**
 * Helper de utilidades para manejo de fechas en zona horaria local.
 * Previene desfases de zona horaria por conversiones a UTC (ISOString).
 */

export const obtenerFechaLocalISO = (fecha: Date = new Date()): string => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const crearFechaLocal = (fechaISO: string): Date => {
  const [anio, mes, dia] = fechaISO.substring(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

export const esFinDeSemana = (fechaISO: string): 'Sábado' | 'Domingo' | null => {
  const fecha = crearFechaLocal(fechaISO);
  const diaSemana = fecha.getDay(); // 0=Domingo, 6=Sábado
  if (diaSemana === 0) return 'Domingo';
  if (diaSemana === 6) return 'Sábado';
  return null;
};

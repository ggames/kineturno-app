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

/**
 * Retorna true si la fecha ISO (YYYY-MM-DD) es anterior al día de hoy (local).
 */
export const esDiaPasado = (fechaISO: string): boolean => {
  const hoy = obtenerFechaLocalISO();
  return fechaISO.substring(0, 10) < hoy;
};

/**
 * Retorna true si un slot ya transcurrió:
 *  - Si la fecha es pasada → siempre true.
 *  - Si la fecha es hoy → true cuando la hora de inicio ya pasó la hora actual.
 * @param fechaISO   Fecha del slot en formato YYYY-MM-DD
 * @param horaInicio Hora de inicio en formato HH:MM (ej. "14:00")
 */
export const esSlotPasado = (fechaISO: string, horaInicio: string): boolean => {
  const hoy = obtenerFechaLocalISO();
  const fechaNorm = fechaISO.substring(0, 10);
  if (fechaNorm < hoy) return true;
  if (fechaNorm > hoy) return false;
  // Es hoy: comparar hora actual con hora del slot
  const ahora = new Date();
  const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();
  const [hh, mm] = horaInicio.split(':').map(Number);
  const slotMin = (hh || 0) * 60 + (mm || 0);
  return slotMin <= horaActualMin;
};

/**
 * Detecta si una fecha es no hábil: sábado, domingo o feriado TOTAL.
 * Retorna el motivo o null si el día es hábil.
 * @param fechaISO  Fecha en formato YYYY-MM-DD
 * @param feriados  Lista de feriados cargados desde el backend/localStorage
 */
export const esDiaNoHabil = (
  fechaISO: string,
  feriados: { date: string; type: string }[],
): 'sabado' | 'domingo' | 'feriado' | null => {
  const fecha = crearFechaLocal(fechaISO);
  const dia = fecha.getDay();
  if (dia === 6) return 'sabado';
  if (dia === 0) return 'domingo';
  const esFeriado = feriados.some(
    (f) => f.date.substring(0, 10) === fechaISO.substring(0, 10) && f.type === 'TOTAL',
  );
  return esFeriado ? 'feriado' : null;
};


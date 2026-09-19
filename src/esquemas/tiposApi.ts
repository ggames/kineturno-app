// Contratos de tipos de la API Backend NestJS en idioma Español Clínico
export type RolUsuario = 'ADMIN' | 'STAFF' | 'PROFESSIONAL' | 'PATIENT';
export type Genero = 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';
export type EstadoTurno = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'CONFIRMED' | 'PENDING';
export type TipoFeriado = 'TOTAL' | 'PARTIAL';

export interface Feriado {
  id: string;
  date: string;
  type: TipoFeriado;
  description?: string;
  partialStartTime?: string;
  partialEndTime?: string;
  clinic?: Clinica;
}

export interface Persona {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  birthDate?: string;
  gender?: Genero;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Usuario {
  id: string;
  email: string;
  role: RolUsuario;
  roles?: RolUsuario[];
  status?: string;
  person?: Persona;
  fotoPerfilUrl?: string;
  createdAt?: string;
}

export interface ObraSocial {
  id: string;
  name: string;
  coverageDetails?: string;
  createdAt?: string;
}

export interface Paciente {
  id: string;
  personId?: string;
  person?: Persona;
  obraSocialId?: string;
  obraSocial?: ObraSocial;
  prepagaId?: string;
  prepaga?: ObraSocial;
  healthInsuranceId?: string;
  healthInsurance?: ObraSocial;
  clinicId?: string;
}

export interface Profesional {
  id: string;
  personId?: string;
  person?: Persona;
  specialty: string;
  licenseNumber: string;
  createdAt?: string;
}

export interface SlotHorario {
  id: string;
  agendaId?: string;
  agenda?: AgendaDiaria;
  weeklyScheduleId?: string;
  doctorScheduleTemplateId?: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  status: string;
}

export interface AgendaDiaria {
  id: string;
  professionalId: string;
  professional?: Profesional;
  date: string;
  slots: SlotHorario[];
}

export interface HorarioSemanal {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxCapacityPerSlot: number;
  isActive?: boolean;
}

export interface Tratamiento {
  id: string;
  patientId?: string;
  patient?: Paciente;
  professionalId?: string;
  prescribingProfessional?: Profesional;
  description: string;
  totalSessions: number;
  createdAt?: string;
}

export interface HistoriaClinica {
  id: string;
  patientId: string;
  medicalRecordNumber?: string;
  diagnosis?: string;
  referringDoctor?: string;
  medicalReferralDocument?: string;
  medicalHistory?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Turno {
  id: string;
  patient?: Paciente;
  professional?: Profesional;
  timeSlot?: SlotHorario;
  treatment?: Tratamiento;
  appointmentDate?: string;
  status: EstadoTurno;
  createdAt?: string;
}

export interface Clinica {
  id: string;
  name: string;
}

export interface RespuestaAutenticacion {
  accessToken: string;
  access_token?: string;
  user: Usuario;
  refreshToken?: string;
}

export interface PeticionLogin {
  email: string;
  password: string;
}

export interface PeticionRegistroPaciente {
  email: string;
  password: string;
  role?: RolUsuario;
  firstName: string;
  lastName: string;
  documentId: string;
  birthDate?: string;
  gender?: Genero;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  clinicId?: string;
}

export interface PeticionRegistroProfesional {
  email: string;
  firstName: string;
  lastName: string;
  documentId: string;
  licenseNumber: string;
  specialty: string;
  roles?: RolUsuario[];
  phone?: string;
}

export interface PeticionCrearTurno {
  patientId: string;
  professionalId: string;
  timeSlotId: string;
  appointmentDate: string;
}

export interface PeticionCrearFeriado {
  date: string;
  type: TipoFeriado;
  description?: string;
  partialStartTime?: string;
  partialEndTime?: string;
  clinicId?: string;
}

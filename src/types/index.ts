export interface User {
  id: string
  email: string
  name: string
  crm: string
}

export interface Patient {
  id: string
  name: string
  cpf: string
  phone?: string
  email?: string
  address?: string
  birth_date?: string
  created_at: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  quantity: string
  instructions?: string
}

export interface Prescription {
  id: string
  type: 'simple' | 'special_control'
  instructions: string
  patient_id: string
  doctor_id: string
  pdf_url?: string
  created_at: string
  medications: Medication[]
}

export interface PrescriptionWithPatient extends Prescription {
  patient_name: string
  patient_cpf: string
}

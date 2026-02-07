import { apiClient } from './apiClient'

export interface Medication {
  id: string
  name: string
  defaultDosage?: string
  defaultInstructions?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateMedicationData {
  name: string
  defaultDosage?: string
  defaultInstructions?: string
}

export interface MedicationSearchResult {
  id: string
  name: string
  defaultDosage?: string
  defaultInstructions?: string
}

class MedicationService {
  async searchMedications(term: string): Promise<MedicationSearchResult[]> {
    try {
      // Tenta buscar no backend real
      return await apiClient.get(`/api/medications?search=${encodeURIComponent(term)}`)
    } catch (error) {
      // Se backend não responder, usa dados mock para teste
      console.log('Usando dados mock para medicamentos (backend não disponível)')
      
      const mockMedications: MedicationSearchResult[] = [
        {
          id: '1',
          name: 'Paracetamol',
          defaultDosage: '500mg',
          defaultInstructions: 'Tomar 8/8 horas por 7 dias'
        },
        {
          id: '2',
          name: 'Ibuprofeno',
          defaultDosage: '400mg',
          defaultInstructions: 'Tomar 6/6 horas com alimentos'
        },
        {
          id: '3',
          name: 'Amoxicilina',
          defaultDosage: '500mg',
          defaultInstructions: 'Tomar 8/8 horas por 10 dias'
        },
        {
          id: '4',
          name: 'Dipirona',
          defaultDosage: '500mg',
          defaultInstructions: 'Tomar 6/6 horas se necessário'
        },
        {
          id: '5',
          name: 'Omeprazol',
          defaultDosage: '20mg',
          defaultInstructions: 'Tomar 1 vez ao dia, antes do café da manhã'
        }
      ]
      
      // Filtra mock baseado no termo
      return mockMedications.filter(med => 
        med.name.toLowerCase().includes(term.toLowerCase())
      )
    }
  }

  async createMedication(data: CreateMedicationData): Promise<Medication> {
    try {
      // Tenta criar no backend real
      return await apiClient.post('/api/medications', data)
    } catch (error) {
      // Se backend não responder, cria mock
      console.log('Criando medicamento mock (backend não disponível)')
      
      const newMedication: Medication = {
        id: `mock-${Date.now()}`,
        name: data.name,
        defaultDosage: data.defaultDosage,
        defaultInstructions: data.defaultInstructions,
        userId: 'mock-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return newMedication
    }
  }

  async getUserMedications(): Promise<Medication[]> {
    return apiClient.get('/api/medications/list')
  }
}

export const medicationService = new MedicationService()

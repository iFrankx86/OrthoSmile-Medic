export type DocumentType = 'DNI' | 'PASSPORT' | 'OTHER'

export interface PatientResponse {
  id: number
  firstName: string
  lastName: string
  documentType: DocumentType
  documentNumber: string
  birthDate: string
  email?: string
  phone?: string
  address?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PatientRequest {
  firstName: string
  lastName: string
  documentType: DocumentType
  documentNumber: string
  birthDate: string
  email?: string
  phone?: string
  address?: string
}


export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'doctor' | 'patient';
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  specialization: string;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  date_of_birth?: string;
  medical_record_number?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  doctor_id: string;
  patient_id: string;
  date_issued: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  pdf_url?: string;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  doctor?: Doctor & { profiles: Profile };
  patient?: Patient & { profiles: Profile };
}

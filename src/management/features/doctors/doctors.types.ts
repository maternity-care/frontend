export type DoctorStatus = "active" | "inactive";

export interface BackendDoctor {
  id: string;
  staffId: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  staffId: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDoctorInput {
  staffId?: string;
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;
  status?: DoctorStatus;
}
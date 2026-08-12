export type DoctorStatus = "active" | "inactive" | string;

export interface DoctorRole {
  id: string;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DoctorStaff {
  id: string;
  name: string;
  personalEmail: string;
  employeeCode: string;
  facilityId: string;
  avatar: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles: DoctorRole[];
}

export interface Doctor {
  id: string;
  staffId: string;
  licenseNo: string;
  title: string;
  specialty: string;
  workingRoomTypeId: string | null;
  yearsOfExperience: number;
  bio: string;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
  staff: DoctorStaff;
}

/** Response thực tế của API list */
export interface DoctorListResponse {
  data: Doctor[];
  count: number;
}
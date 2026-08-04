export type UserStatus = "inactive" | "active" | "locked";

export interface PregnancyProfile {
  id: string;
  patientId: string;
  code: string;
  lastMenstrualPeriod?: string | null;
  expectedDueDate?: string | null;
  fetalCount?: number;
  gravida?: number;
  paraFullTerm?: number;
  paraPremature?: number;
  paraAbortion?: number;
  paraLivingChildren?: number;
  riskLevel?: "low" | "medium" | "high" | string;
  status?: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
}

export interface User {
  id: string;
  cccd?: string | null;
  name: string;
  phone: string;
  email: string;
  dateOfBirth?: string | null;
  address?: string | null;
  priorityLevel?: number;
  province?: string | null;
  ward?: string | null;
  status: UserStatus;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  pregnancyProfiles?: PregnancyProfile[];
}

export interface GetUsersParams {
  search?: string;
  name?: string;
  email?: string;
  cccd?: string;
  phone?: string;
  status?: UserStatus;
  roleId?: string;
  facilityId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  cccd: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  province?: string;
  ward?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdateUserDto {
  name?: string;
  dateOfBirth?: string;
  address?: string;
  province?: string;
  ward?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UsersListData {
  users: User[];
  total: number;
}
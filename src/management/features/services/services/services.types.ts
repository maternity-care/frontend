export type ServiceStatus = "active" | "inactive";

export type ServiceSaleMode =
  | "standalone"
  | "package_only"
  | "both";

export interface ServiceTypeSummary {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: ServiceStatus;
}

export interface ServiceFacilitySummary {
  id: string;
  code?: string;
  name: string;
  address?: string | null;
  status?: ServiceStatus;
}

export interface ServiceFacilityAssignment {
  id: string;
  serviceId: string;
  facilityId: string;
  price: string;
  durationMinutes: number;
  status: ServiceStatus;
  facility?: ServiceFacilitySummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceFacilityAssignmentInput {
  facilityId: string;
  price: string;
  durationMinutes: number;
  status: ServiceStatus;
}

export interface ManagementService {
  id: string;
  code: string;
  name: string;
  description?: string | null;

  serviceTypeId: string;
  serviceType?: ServiceTypeSummary;

  saleMode: ServiceSaleMode;
  defaultDurationMinutes: number;
  basePrice: string;
  requiresDoctorWarning: boolean;
  status: ServiceStatus;

  facilityAssignments?: ServiceFacilityAssignment[];

  createdAt: string;
  updatedAt: string;
}

export interface ManagementServiceQuery {
  search?: string;
  serviceTypeId?: string;
  saleMode?: ServiceSaleMode;
  status?: ServiceStatus;
  page?: number;
  limit?: number;
}

export interface ManagementServiceListResult {
  items: ManagementService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateManagementServiceInput {
  name: string;
  description?: string;
  serviceTypeId: string;
  saleMode: ServiceSaleMode;
  defaultDurationMinutes: number;
  basePrice: string;
  requiresDoctorWarning: boolean;
  status: ServiceStatus;
  facilityAssignments?: ServiceFacilityAssignmentInput[];
}

export type UpdateManagementServiceInput =
  Partial<CreateManagementServiceInput>;

export type DeleteManagementServiceResult =
  | ManagementService
  | null;

  
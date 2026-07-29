export type ServiceStatus = "active" | "inactive";
export type ServiceSaleMode = "standalone" | "package_only" | "both";

export interface FacilitySummary {
  id: string;
  code?: string;
  name: string;
  address?: string | null;
  province?: string | null;
  ward?: string | null;
  status?: ServiceStatus;
}

export interface FacilityServiceTypeSummary {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: ServiceStatus;
}

export interface FacilityServiceServiceSummary {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  serviceTypeId: string;
  serviceType?: FacilityServiceTypeSummary;
  saleMode: ServiceSaleMode;
  basePrice: string;
  defaultDurationMinutes: number;
  requiresDoctorWarning?: boolean;
  status: ServiceStatus;
}

export interface ManagementFacilityService {
  id: string;
  facilityId: string;
  serviceId: string;
  price: string;
  durationMinutes: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
  facility?: FacilitySummary;
  service?: FacilityServiceServiceSummary;
}

export interface ManagementFacilityServiceQuery {
  search?: string;
  facilityId?: string;
  serviceId?: string;
  serviceTypeId?: string;
  status?: ServiceStatus;
  page?: number;
  limit?: number;
}

export interface ManagementFacilityServiceListResult {
  items: ManagementFacilityService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateFacilityServiceInput {
  facilityId: string;
  serviceId: string;
  price: string;
  durationMinutes: number;
  status: ServiceStatus;
}

export type UpdateFacilityServiceInput = Partial<CreateFacilityServiceInput>;

export interface BulkFacilityServiceItemInput {
  serviceId: string;
  price: string;
  durationMinutes: number;
  status: ServiceStatus;
}

export interface BulkAssignFacilityServicesInput {
  facilityId: string;
  services: BulkFacilityServiceItemInput[];
}
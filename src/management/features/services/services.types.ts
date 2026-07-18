export type FacilityServiceStatus = "available" | "unavailable";

export interface BackendFacilitySummary {
  id: string;
  code?: string | null;
  name?: string | null;
}

export interface BackendServiceSummary {
  id: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  serviceType?: string | null;
  type?: string | null;
}

export interface BackendFacilityService {
  id: string;

  facilityId?: string;
  serviceId?: string;

  price?: string | number;
  durationMinutes?: number;
  status?: string;

  facilityName?: string | null;
  facilityCode?: string | null;

  serviceName?: string | null;
  serviceCode?: string | null;
  serviceDescription?: string | null;
  serviceType?: string | null;

  facility?: BackendFacilitySummary | null;
  service?: BackendServiceSummary | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface FacilityService {
  id: string;

  facilityId: string;
  facilityName: string;
  facilityCode?: string;

  serviceId: string;
  serviceName: string;
  serviceCode?: string;
  serviceDescription?: string;
  serviceType?: string;

  price: number;
  durationMinutes: number;
  status: FacilityServiceStatus;

  createdAt?: string;
  updatedAt?: string;
}

export interface GetFacilityServicesParams {
  search?: string;
  facilityId?: string;
  serviceId?: string;
  serviceType?: string;
  status?: FacilityServiceStatus;
  page?: number;
  limit?: number;
}

export interface FacilityServicesListResult {
  items: FacilityService[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateFacilityServiceInput {
  facilityId: string;
  serviceId: string;
  price: string;
  durationMinutes: number;
  status: FacilityServiceStatus;
}

export type UpdateFacilityServiceInput =
  Partial<CreateFacilityServiceInput>;

export interface FacilityServiceFormValues {
  facilityId: string;
  serviceId: string;
  price: number;
  durationMinutes: number;
  status: FacilityServiceStatus;
}

export interface DeleteFacilityServiceResult {
  deleted?: boolean;
  deactivated?: boolean;
  action?: string;
  message?: string;
}
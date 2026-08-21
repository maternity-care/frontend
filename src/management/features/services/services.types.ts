// ============================================================
// Common types
// ============================================================

export type ServiceType =
  | "consultation"
  | "ultrasound"
  | "lab_test"
  | "screening"
  | "procedure"
  | "other";

export type ServiceStatus = "active" | "inactive";

export type FacilityServiceStatus = "available" | "unavailable";

export type MaternityPackageStatus = "draft" | "active" | "inactive";

export type AllowedFacilityScope = "all" | "selected";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================
// Service
// Dịch vụ gốc của toàn hệ thống
// ============================================================

export interface Service {
  id: string;
  code: string;
  name: string;
  description: string | null;
  serviceType: ServiceType;
  defaultDurationMinutes: number;
  basePrice: string;
  requiresDoctorWarning: boolean;
  allowDoctorSelection: boolean;
  doctorSpecialty?: string | null;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface GetServicesParams extends PaginationParams {
  search?: string;
  serviceType?: ServiceType;
  status?: ServiceStatus;
}

export interface ServicesListData {
  services: Service[];
  total: number;
}

export interface CreateServiceInput {
  code: string;
  name: string;
  description?: string;
  serviceType: ServiceType;
  defaultDurationMinutes: number;
  basePrice: string;
  requiresDoctorWarning: boolean;
  allowDoctorSelection?: boolean;
  doctorSpecialty?: string | null;
  status: ServiceStatus;
}

export interface UpdateServiceInput {
  code?: string;
  name?: string;
  description?: string | null;
  serviceType?: ServiceType;
  defaultDurationMinutes?: number;
  basePrice?: string;
  requiresDoctorWarning?: boolean;
  allowDoctorSelection?: boolean;
  doctorSpecialty?: string | null;
  status?: ServiceStatus;
}

// ============================================================
// Facility Service
// Dịch vụ được gán vào từng cơ sở
// ============================================================

export interface FacilityService {
  id: string;
  facilityId: string;
  serviceId: string;
  price: string;
  durationMinutes: number;
  status: FacilityServiceStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Facility information
  facilityCode: string;
  facilityName: string;
  facilityAddress: string;
  facilityProvince: string;
  facilityDistrict: string;

  // Original service information
  serviceCode: string;
  serviceName: string;
  serviceDescription: string | null;
  serviceType: ServiceType;
  serviceBasePrice: string;
  serviceDefaultDurationMinutes: number;
  serviceRequiresDoctorWarning: boolean;
  serviceAllowDoctorSelection: boolean;
  serviceDoctorSpecialty?: string | null;
}

export interface GetFacilityServicesParams extends PaginationParams {
  search?: string;
  facilityId?: string;
  serviceId?: string;
  serviceType?: ServiceType;
  status?: FacilityServiceStatus;
}

export type GetPublicFacilityServicesParams = Omit<
  GetFacilityServicesParams,
  "facilityId" | "status"
> & {
  status?: ServiceStatus;
};

export interface FacilityServicesListData {
  facilityServices: FacilityService[];
  total: number;
}

export interface CreateFacilityServiceInput {
  facilityId: string;
  serviceId: string;
  price: string;
  durationMinutes: number;
  status: FacilityServiceStatus;
}

export interface UpdateFacilityServiceInput {
  facilityId?: string;
  serviceId?: string;
  price?: string;
  durationMinutes?: number;
  status?: FacilityServiceStatus;
}

// ============================================================
// Maternity Package
// Gói thai sản
// ============================================================

export interface MaternityPackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: string;
  durationDays: number | null;
  priorityLevel: number;
  status: MaternityPackageStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FacilityMaternityPackage extends MaternityPackage {
  facilityId: string;
  totalServiceCount: number;
  availableServiceCount: number;
}

export interface GetMaternityPackagesParams extends PaginationParams {
  search?: string;
  status?: MaternityPackageStatus;
}

export interface MaternityPackagesListData {
  maternityPackages: MaternityPackage[];
  total: number;
}

export interface FacilityMaternityPackagesListData {
  maternityPackages: FacilityMaternityPackage[];
  total: number;
}

export interface CreateMaternityPackageInput {
  code: string;
  name: string;
  description?: string;
  price: string;
  durationDays?: number | null;
  priorityLevel: number;
  status: MaternityPackageStatus;
}

export interface UpdateMaternityPackageInput {
  code?: string;
  name?: string;
  description?: string | null;
  price?: string;
  durationDays?: number | null;
  priorityLevel?: number;
  status?: MaternityPackageStatus;
}

// ============================================================
// Package Service
// Dịch vụ nằm trong gói thai sản
// ============================================================

export interface PackageService {
  id: string;
  packageId: string;
  serviceId: string;
  includedQuantity: number;
  isRequired: boolean;
  isOptional: boolean;
  allowedFacilityScope: AllowedFacilityScope;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Package information
  packageCode: string;
  packageName: string;
  packagePrice: string;
  packageStatus: MaternityPackageStatus;

  // Service information
  serviceCode: string;
  serviceName: string;
  serviceDescription: string | null;
  serviceType: ServiceType;
  serviceBasePrice: string;

  // Facilities that can provide this service
  facilityIds: string[];
}

export interface GetPackageServicesParams extends PaginationParams {
  packageId?: string;
  serviceId?: string;
  serviceType?: ServiceType;
  allowedFacilityScope?: AllowedFacilityScope;
  search?: string;
}

export type GetPublicPackageServicesParams = Omit<
  GetPackageServicesParams,
  "packageId"
>;

export interface PackageServicesListData {
  packageServices: PackageService[];
  total: number;
}

export interface CreatePackageServiceInput {
  packageId: string;
  serviceId: string;
  includedQuantity: number;
  isRequired: boolean;
  isOptional: boolean;
  allowedFacilityScope: AllowedFacilityScope;
  facilityIds: string[];
}

export interface UpdatePackageServiceInput {
  packageId?: string;
  serviceId?: string;
  includedQuantity?: number;
  isRequired?: boolean;
  isOptional?: boolean;
  allowedFacilityScope?: AllowedFacilityScope;
  facilityIds?: string[];
}

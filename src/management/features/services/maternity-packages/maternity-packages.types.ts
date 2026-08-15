import type {
  FacilitySummary,
  FacilityServiceServiceSummary,
  ServiceStatus,
} from "../facility-services/facility-services.types";

export type MaternityPackageStatus = "draft" | "active" | "inactive";
export type MaternityPackageType = "quantity" | "schedule";
export type MaternityPackageStageType =
  | "pregnancy_week"
  | "postpartum"
  | "custom";
export type PackageServiceFacilityScope = "all" | "selected";

export interface PackageServiceItemInput {
  serviceId?: string;
  facilityServiceId?: string;
  includedQuantity: number;
  isRequired?: boolean;
  isOptional?: boolean;
  sortOrder?: number;
  allowedFacilityScope?: PackageServiceFacilityScope;
  facilityIds?: string[];
}

export interface PackageStageInput {
  name: string;
  stageType: MaternityPackageStageType;
  weekFrom?: number | null;
  weekTo?: number | null;
  goal?: string | null;
  sortOrder?: number;
  services: PackageServiceItemInput[];
}

export interface CreateQuantityPackageInput {
  facilityId: string;
  name: string;
  description?: string | null;
  price: string;
  durationDays: number;
  priorityLevel?: number;
  status: MaternityPackageStatus;
  services: PackageServiceItemInput[];
}

export interface CreateSchedulePackageInput {
  facilityId: string;
  name: string;
  description?: string | null;
  price: string;
  durationDays: number;
  priorityLevel?: number;
  status: MaternityPackageStatus;
  stages: PackageStageInput[];
}

export type UpdateMaternityPackageInput = {
  facilityId?: string;
  name?: string;
  description?: string | null;
  packageType?: MaternityPackageType;
  price?: string;
  durationDays?: number;
  priorityLevel?: number;
  status?: MaternityPackageStatus;
  services?: PackageServiceItemInput[];
  stages?: PackageStageInput[];
};

export interface PackageFacilityServiceSummary {
  id: string;
  facilityId: string;
  serviceId: string;
  price: string;
  durationMinutes: number;
  status: ServiceStatus;
  service?: FacilityServiceServiceSummary;
  facility?: FacilitySummary;
}

export interface MaternityPackageItem {
  id: string;
  packageId: string;
  packageStageId?: string | null;
  facilityServiceId: string;
  serviceId: string;
  includedQuantity: number;
  isRequired: boolean;
  isOptional: boolean;
  allowedFacilityScope?: PackageServiceFacilityScope;
  sortOrder: number;
  facilityService?: PackageFacilityServiceSummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaternityPackageStage {
  id: string;
  packageId: string;
  name: string;
  stageType: MaternityPackageStageType;
  weekFrom?: number | null;
  weekTo?: number | null;
  goal?: string | null;
  sortOrder: number;
  services?: MaternityPackageItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaternityPackage {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  description?: string | null;
  packageType: MaternityPackageType;
  price: string;
  durationDays: number;
  priorityLevel: number;
  status: MaternityPackageStatus;
  facility?: FacilitySummary;
  services?: MaternityPackageItem[];
  stages?: MaternityPackageStage[];
  createdAt: string;
  updatedAt: string;
}

export interface MaternityPackageQuery {
  search?: string;
  status?: MaternityPackageStatus;
  packageType?: MaternityPackageType;
  facilityId?: string;
  page?: number;
  limit?: number;
}

export interface MaternityPackageListResult {
  items: MaternityPackage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DeleteMaternityPackageResult = MaternityPackage | null;

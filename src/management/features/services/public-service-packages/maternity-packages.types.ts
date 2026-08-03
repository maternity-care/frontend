export type MaternityPackageStatus = "draft" | "active" | "inactive";

export type MaternityPackageType = "quantity" | "schedule";

export type MaternityPackageServiceType = {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  status: string | null;
};

export type MaternityPackageService = {
  id: string;
  packageId: string;
  packageStageId: string | null;
  facilityServiceId: string;
  facilityId: string;
  serviceId: string;
  includedQuantity: number;
  isRequired: number;
  isOptional: number;
  allowedFacilityScope: string;
  facilityIds: string[];
  sortOrder: number;
  price: string;
  durationMinutes: number;
  facilityServiceStatus: string;
  serviceCode: string;
  serviceName: string;
  serviceDescription: string | null;
  serviceTypeId: string;
  serviceType: MaternityPackageServiceType;
  serviceSaleMode: string;
  serviceBasePrice: string;
  serviceDefaultDurationMinutes: number;
  serviceRequiresDoctorWarning: number;
  serviceStatus: string;
};

export type MaternityPackageStage = {
  id: string;
  packageId: string;
  name: string;
  stageType: string;
  weekFrom: number;
  weekTo: number;
  goal: string | null;
  sortOrder: number;
  services: MaternityPackageService[];
};

export type MaternityPackageFacility = {
  id: string;
  code: string;
  name: string;
  address: string;
  province: string;
  ward: string;
  status: string;
};

export type MaternityPackage = {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  description: string | null;
  packageType: MaternityPackageType;
  price: string;
  durationDays: number;
  priorityLevel: number;
  status: MaternityPackageStatus;
  createdAt: string;
  updatedAt: string;
  facility: MaternityPackageFacility;
  services: MaternityPackageService[];
  stages: MaternityPackageStage[];
};

export type GetMaternityPackagesParams = {
  search?: string;
  status?: MaternityPackageStatus;
  facilityId?: string;
  page?: number;
  limit?: number;
};
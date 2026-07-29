import type {
  MaternityPackageItem,
  PackageServiceFacilityScope,
} from "../maternity-packages/maternity-packages.types";

export type { PackageServiceFacilityScope };

/** Item dịch vụ trong gói (response API package-services) */
export type ManagementPackageService = MaternityPackageItem & {
  /** Có thể có khi API trả thêm thông tin gói */
  package?: {
    id: string;
    code?: string;
    name?: string;
    facilityId?: string;
  };
  /** Danh sách facility được phép khi scope = selected */
  facilityIds?: string[];
};

export interface ManagementPackageServiceQuery {
  packageId?: string;
  facilityServiceId?: string;
  /** Lọc theo cơ sở sở hữu gói */
  facilityId?: string;
  /** Lọc theo ID trong bảng service_types */
  serviceTypeId?: string;
  allowedFacilityScope?: PackageServiceFacilityScope;
  /** Tìm theo code/name/description của service hoặc gói */
  search?: string;
  page?: number;
  limit?: number;
}

export interface ManagementPackageServiceListResult {
  items: ManagementPackageService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdatePackageServiceInput {
  facilityServiceId?: string;
  includedQuantity?: number;
  isRequired?: boolean;
  isOptional?: boolean;
  allowedFacilityScope?: PackageServiceFacilityScope;
  sortOrder?: number;
  facilityIds?: string[];
  packageId?: string;
}

export type DeletePackageServiceResult = ManagementPackageService | null;
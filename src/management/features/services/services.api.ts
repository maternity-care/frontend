import {
  apiClient,
  unwrapApiData,
  unwrapApiResponse,
} from "@/lib/axios";

import type {
  CreateFacilityServiceInput,
  CreateMaternityPackageInput,
  CreatePackageServiceInput,
  CreateServiceInput,
  FacilityMaternityPackage,
  FacilityMaternityPackagesListData,
  FacilityService,
  FacilityServicesListData,
  GetFacilityServicesParams,
  GetMaternityPackagesParams,
  GetPackageServicesParams,
  GetPublicFacilityServicesParams,
  GetPublicPackageServicesParams,
  GetServicesParams,
  MaternityPackage,
  MaternityPackagesListData,
  PackageService,
  PackageServicesListData,
  Service,
  ServicesListData,
  UpdateFacilityServiceInput,
  UpdateMaternityPackageInput,
  UpdatePackageServiceInput,
  UpdateServiceInput,
} from "./services.types";

import {
  normalizeFacilityMaternityPackage,
  normalizeFacilityService,
  normalizeListPayload,
  normalizeMaternityPackage,
  normalizePackageService,
  normalizeService,
  toCreateFacilityServicePayload,
  toCreateMaternityPackagePayload,
  toCreatePackageServicePayload,
  toCreateServicePayload,
  toFacilityServicesQueryParams,
  toMaternityPackagesQueryParams,
  toPackageServicesQueryParams,
  toPublicFacilityServicesQueryParams,
  toPublicPackageServicesQueryParams,
  toServicesQueryParams,
  toUpdateFacilityServicePayload,
  toUpdateMaternityPackagePayload,
  toUpdatePackageServicePayload,
  toUpdateServicePayload,
  type BackendFacilityMaternityPackage,
  type BackendFacilityService,
  type BackendMaternityPackage,
  type BackendPackageService,
  type BackendService,
} from "./services.utils";

// ============================================================
// Management - Services
// ============================================================

export async function getServicesPage(
  params?: GetServicesParams,
): Promise<ServicesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get("/management/services", {
      params: toServicesQueryParams(params),
    }),
  );

  const normalizedData = normalizeListPayload<BackendService>(
    data,
    ["services"],
  );

  return {
    services: normalizedData.items.map(normalizeService),
    total: normalizedData.total,
  };
}

export async function getServices(
  params?: GetServicesParams,
): Promise<Service[]> {
  const data = await getServicesPage(params);

  return data.services;
}

export async function getService(id: string): Promise<Service> {
  const data = await unwrapApiData<BackendService>(
    apiClient.get(`/management/services/${id}`),
  );

  return normalizeService(data);
}

export async function createService(
  input: CreateServiceInput,
): Promise<Service> {
  const data = await unwrapApiData<BackendService>(
    apiClient.post(
      "/management/services",
      toCreateServicePayload(input),
    ),
  );

  return normalizeService(data);
}

export async function updateService(
  id: string,
  input: UpdateServiceInput,
): Promise<Service> {
  const data = await unwrapApiData<BackendService>(
    apiClient.patch(
      `/management/services/${id}`,
      toUpdateServicePayload(input),
    ),
  );

  return normalizeService(data);
}

export function deleteService(id: string) {
  return unwrapApiResponse<null>(
    apiClient.delete(`/management/services/${id}`),
  );
}

export async function deleteServices(ids: string[]) {
  await Promise.all(ids.map((id) => deleteService(id)));
}

// ============================================================
// Management - Facility Services
// ============================================================

export async function getFacilityServicesPage(
  params?: GetFacilityServicesParams,
): Promise<FacilityServicesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get("/management/facility-services", {
      params: toFacilityServicesQueryParams(params),
    }),
  );

  const normalizedData =
    normalizeListPayload<BackendFacilityService>(
      data,
      ["facilityServices"],
    );

  return {
    facilityServices: normalizedData.items.map(
      normalizeFacilityService,
    ),
    total: normalizedData.total,
  };
}

export async function getFacilityServices(
  params?: GetFacilityServicesParams,
): Promise<FacilityService[]> {
  const data = await getFacilityServicesPage(params);

  return data.facilityServices;
}

export async function getFacilityService(
  id: string,
): Promise<FacilityService> {
  const data = await unwrapApiData<BackendFacilityService>(
    apiClient.get(`/management/facility-services/${id}`),
  );

  return normalizeFacilityService(data);
}

export async function createFacilityService(
  input: CreateFacilityServiceInput,
): Promise<FacilityService> {
  const data = await unwrapApiData<BackendFacilityService>(
    apiClient.post(
      "/management/facility-services",
      toCreateFacilityServicePayload(input),
    ),
  );

  return normalizeFacilityService(data);
}

export async function updateFacilityService(
  id: string,
  input: UpdateFacilityServiceInput,
): Promise<FacilityService> {
  const data = await unwrapApiData<BackendFacilityService>(
    apiClient.patch(
      `/management/facility-services/${id}`,
      toUpdateFacilityServicePayload(input),
    ),
  );

  return normalizeFacilityService(data);
}

export function deleteFacilityService(id: string) {
  return unwrapApiResponse<null>(
    apiClient.delete(`/management/facility-services/${id}`),
  );
}

export async function deleteFacilityServices(ids: string[]) {
  await Promise.all(
    ids.map((id) => deleteFacilityService(id)),
  );
}

// ============================================================
// Public - Facility Services
// ============================================================

export async function getPublicFacilityServicesPage(
  facilityId: string,
  params?: GetPublicFacilityServicesParams,
): Promise<FacilityServicesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get(
      `/public/facilities/${facilityId}/services`,
      {
        params: toPublicFacilityServicesQueryParams(params),
      },
    ),
  );

  const normalizedData =
    normalizeListPayload<BackendFacilityService>(
      data,
      ["facilityServices", "services"],
    );

  return {
    facilityServices: normalizedData.items.map(
      normalizeFacilityService,
    ),
    total: normalizedData.total,
  };
}

export async function getPublicFacilityServices(
  facilityId: string,
  params?: GetPublicFacilityServicesParams,
): Promise<FacilityService[]> {
  const data = await getPublicFacilityServicesPage(
    facilityId,
    params,
  );

  return data.facilityServices;
}

// ============================================================
// Management - Maternity Packages
// ============================================================

export async function getMaternityPackagesPage(
  params?: GetMaternityPackagesParams,
): Promise<MaternityPackagesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get("/management/maternity-packages", {
      params: toMaternityPackagesQueryParams(params),
    }),
  );

  const normalizedData =
    normalizeListPayload<BackendMaternityPackage>(
      data,
      ["maternityPackages", "packages"],
    );

  return {
    maternityPackages: normalizedData.items.map(
      normalizeMaternityPackage,
    ),
    total: normalizedData.total,
  };
}

export async function getMaternityPackages(
  params?: GetMaternityPackagesParams,
): Promise<MaternityPackage[]> {
  const data = await getMaternityPackagesPage(params);

  return data.maternityPackages;
}

export async function getMaternityPackage(
  id: string,
): Promise<MaternityPackage> {
  const data = await unwrapApiData<BackendMaternityPackage>(
    apiClient.get(`/management/maternity-packages/${id}`),
  );

  return normalizeMaternityPackage(data);
}

export async function createMaternityPackage(
  input: CreateMaternityPackageInput,
): Promise<MaternityPackage> {
  const data = await unwrapApiData<BackendMaternityPackage>(
    apiClient.post(
      "/management/maternity-packages",
      toCreateMaternityPackagePayload(input),
    ),
  );

  return normalizeMaternityPackage(data);
}

export async function updateMaternityPackage(
  id: string,
  input: UpdateMaternityPackageInput,
): Promise<MaternityPackage> {
  const data = await unwrapApiData<BackendMaternityPackage>(
    apiClient.patch(
      `/management/maternity-packages/${id}`,
      toUpdateMaternityPackagePayload(input),
    ),
  );

  return normalizeMaternityPackage(data);
}

export function deleteMaternityPackage(id: string) {
  return unwrapApiResponse<null>(
    apiClient.delete(
      `/management/maternity-packages/${id}`,
    ),
  );
}

export async function deleteMaternityPackages(ids: string[]) {
  await Promise.all(
    ids.map((id) => deleteMaternityPackage(id)),
  );
}

// ============================================================
// Public - Maternity Packages
// ============================================================

export async function getPublicMaternityPackagesPage(
  params?: GetMaternityPackagesParams,
): Promise<MaternityPackagesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get("/public/maternity-packages", {
      params: toMaternityPackagesQueryParams(params),
    }),
  );

  const normalizedData =
    normalizeListPayload<BackendMaternityPackage>(
      data,
      ["maternityPackages", "packages"],
    );

  return {
    maternityPackages: normalizedData.items.map(
      normalizeMaternityPackage,
    ),
    total: normalizedData.total,
  };
}

export async function getPublicMaternityPackages(
  params?: GetMaternityPackagesParams,
): Promise<MaternityPackage[]> {
  const data = await getPublicMaternityPackagesPage(params);

  return data.maternityPackages;
}

export async function getPublicMaternityPackage(
  id: string,
): Promise<MaternityPackage> {
  const data = await unwrapApiData<BackendMaternityPackage>(
    apiClient.get(`/public/maternity-packages/${id}`),
  );

  return normalizeMaternityPackage(data);
}

// ============================================================
// Public - Facility Maternity Packages
// ============================================================

export async function getPublicFacilityMaternityPackagesPage(
  facilityId: string,
  params?: GetMaternityPackagesParams,
): Promise<FacilityMaternityPackagesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get(
      `/public/facilities/${facilityId}/maternity-packages`,
      {
        params: toMaternityPackagesQueryParams(params),
      },
    ),
  );

  const normalizedData =
    normalizeListPayload<BackendFacilityMaternityPackage>(
      data,
      ["maternityPackages", "packages"],
    );

  return {
    maternityPackages: normalizedData.items.map(
      normalizeFacilityMaternityPackage,
    ),
    total: normalizedData.total,
  };
}

export async function getPublicFacilityMaternityPackages(
  facilityId: string,
  params?: GetMaternityPackagesParams,
): Promise<FacilityMaternityPackage[]> {
  const data = await getPublicFacilityMaternityPackagesPage(
    facilityId,
    params,
  );

  return data.maternityPackages;
}

// ============================================================
// Management - Package Services
// ============================================================

export async function getPackageServicesPage(
  params?: GetPackageServicesParams,
): Promise<PackageServicesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get("/management/package-services", {
      params: toPackageServicesQueryParams(params),
    }),
  );

  const normalizedData =
    normalizeListPayload<BackendPackageService>(
      data,
      ["packageServices", "services"],
    );

  return {
    packageServices: normalizedData.items.map(
      normalizePackageService,
    ),
    total: normalizedData.total,
  };
}

export async function getPackageServices(
  params?: GetPackageServicesParams,
): Promise<PackageService[]> {
  const data = await getPackageServicesPage(params);

  return data.packageServices;
}

export async function getPackageService(
  id: string,
): Promise<PackageService> {
  const data = await unwrapApiData<BackendPackageService>(
    apiClient.get(`/management/package-services/${id}`),
  );

  return normalizePackageService(data);
}

export async function createPackageService(
  input: CreatePackageServiceInput,
): Promise<PackageService> {
  const data = await unwrapApiData<BackendPackageService>(
    apiClient.post(
      "/management/package-services",
      toCreatePackageServicePayload(input),
    ),
  );

  return normalizePackageService(data);
}

export async function updatePackageService(
  id: string,
  input: UpdatePackageServiceInput,
): Promise<PackageService> {
  const data = await unwrapApiData<BackendPackageService>(
    apiClient.patch(
      `/management/package-services/${id}`,
      toUpdatePackageServicePayload(input),
    ),
  );

  return normalizePackageService(data);
}

export function deletePackageService(id: string) {
  return unwrapApiResponse<null>(
    apiClient.delete(`/management/package-services/${id}`),
  );
}

export async function deletePackageServices(ids: string[]) {
  await Promise.all(
    ids.map((id) => deletePackageService(id)),
  );
}

// ============================================================
// Public - Package Services
// ============================================================

export async function getPublicPackageServicesPage(
  packageId: string,
  params?: GetPublicPackageServicesParams,
): Promise<PackageServicesListData> {
  const data = await unwrapApiData<unknown>(
    apiClient.get(
      `/public/maternity-packages/${packageId}/services`,
      {
        params: toPublicPackageServicesQueryParams(params),
      },
    ),
  );

  const normalizedData =
    normalizeListPayload<BackendPackageService>(
      data,
      ["packageServices", "services"],
    );

  return {
    packageServices: normalizedData.items.map(
      normalizePackageService,
    ),
    total: normalizedData.total,
  };
}

export async function getPublicPackageServices(
  packageId: string,
  params?: GetPublicPackageServicesParams,
): Promise<PackageService[]> {
  const data = await getPublicPackageServicesPage(
    packageId,
    params,
  );

  return data.packageServices;
}
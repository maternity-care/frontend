// src/management/features/staffs/staffs.api.ts

import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  CreateStaffInput,
  GetStaffsParams,
  UpdateStaffInput,
  CreateStaffProfileInput,
  StaffProfile,
  Staff,
  StaffsListData,
  Permission,
} from "./staffs.types";

type BackendStaffsPayload =
  | StaffsListData
  | Staff[]
  | {
      data?: StaffsListData | Staff[];
      users?: Staff[];
      total?: number;
    };

function toQueryParams(params?: GetStaffsParams) {
  const queryParams = {
    search: params?.search?.trim() || undefined,
    name: params?.name?.trim() || undefined,
    email: params?.email?.trim() || undefined,
    phone: params?.phone?.trim() || undefined,
    roleId: params?.roleId || undefined,
    facilityId: params?.facilityId || undefined,
    status: params?.status,
    page: params?.page,
    limit: params?.limit,
    sort: params?.sort?.trim() || undefined,
  };

  return Object.fromEntries(
    Object.entries(queryParams).filter(([, value]) => value !== undefined),
  );
}

function normalizeStaffsList(payload: BackendStaffsPayload): StaffsListData {
  const source =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload &&
    payload.data
      ? payload.data
      : payload;

  if (Array.isArray(source)) {
    return {
      users: source,
      total: source.length,
    };
  }

  const users = Array.isArray(source.users) ? source.users : [];

  return {
    users,
    total: typeof source.total === "number" ? source.total : users.length,
  };
}

function toCreatePayload(input: CreateStaffInput) {
  return {
    name: input.name.trim(),
    personalEmail: input.personalEmail.trim(),
    phone: input.phone.trim(),
    permissionOverrides: input.permissionOverrides ?? [],
    facilityAssignments: input.facilityAssignments,
    licenseNo: input.licenseNo?.trim() || undefined,
    title: input.title?.trim() || undefined,
    specialty: input.specialty?.trim() || undefined,
    yearsOfExperience: input.yearsOfExperience,
    bio: input.bio?.trim() || undefined,
  };
}

function toUpdatePayload(input: UpdateStaffInput) {
  const payload = {
    name: input.name?.trim(),
    email: input.email?.trim(),
    password: input.password?.trim() || undefined,
    status: input.status,
    roleIds: input.roleIds,
    permissionOverrides: input.permissionOverrides,
    facilityAssignments: input.facilityAssignments,
    licenseNo: input.licenseNo?.trim() || undefined,
    title: input.title?.trim() || undefined,
    specialty: input.specialty?.trim() || undefined,
    yearsOfExperience: input.yearsOfExperience,
    bio: input.bio?.trim() || undefined,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export async function getStaffsPage(params?: GetStaffsParams) {
  const data = await unwrapApiData<BackendStaffsPayload>(
    apiClient.get("/management/staffs", {
      params: toQueryParams(params),
    }),
  );

  return normalizeStaffsList(data);
}

export async function getStaffs(params?: GetStaffsParams) {
  const data = await getStaffsPage(params);

  return data.users;
}

export function getPermissions() {
  return unwrapApiData<Permission[]>(apiClient.get("/management/permissions"));
}

export function createStaff(input: CreateStaffInput) {
  return unwrapApiResponse<Staff>(
    apiClient.post("/management/staffs", toCreatePayload(input)),
  );
}

export function getStaff(id: string) {
  return unwrapApiData<Staff>(apiClient.get(`/management/staffs/${id}`));
}

export function updateStaff(id: string, input: UpdateStaffInput) {
  return unwrapApiResponse<Staff>(
    apiClient.patch(`/management/staffs/${id}`, toUpdatePayload(input)),
  );
}

export function deleteStaff(id: string) {
  return unwrapApiResponse<null>(apiClient.delete(`/management/staffs/${id}`));
}

export function createStaffProfile(
  staffId: string,
  input: CreateStaffProfileInput,
) {
  return unwrapApiResponse<StaffProfile>(
    apiClient.post(`/management/staffs/${staffId}/staff-profile`, input),
  );
}

export async function deleteStaffs(ids: string[]) {
  await Promise.all(ids.map((id) => deleteStaff(id)));
}

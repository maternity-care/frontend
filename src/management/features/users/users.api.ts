// src/management/features/users/users.api.ts

import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  CreateUserInput,
  GetUsersParams,
  UpdateUserInput,
  CreateStaffProfileInput,
  StaffProfile,
  User,
  UsersListData,
} from "./users.types";

type BackendUsersPayload =
  | UsersListData
  | User[]
  | {
      data?: UsersListData | User[];
      users?: User[];
      total?: number;
    };

function toQueryParams(params?: GetUsersParams) {
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

function normalizeUsersList(payload: BackendUsersPayload): UsersListData {
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

function toCreatePayload(input: CreateUserInput) {
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

function toUpdatePayload(input: UpdateUserInput) {
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

export async function getUsersPage(params?: GetUsersParams) {
  const data = await unwrapApiData<BackendUsersPayload>(
    apiClient.get("/management/staffs", {
      params: toQueryParams(params),
    }),
  );

  return normalizeUsersList(data);
}

export async function getUsers(params?: GetUsersParams) {
  const data = await getUsersPage(params);

  return data.users;
}

export function createUser(input: CreateUserInput) {
  return unwrapApiResponse<User>(
    apiClient.post("/management/staffs", toCreatePayload(input)),
  );
}

export function getUser(id: string) {
  return unwrapApiData<User>(apiClient.get(`/management/staffs/${id}`));
}

export function updateUser(id: string, input: UpdateUserInput) {
  return unwrapApiResponse<User>(
    apiClient.patch(`/management/staffs/${id}`, toUpdatePayload(input)),
  );
}

export function deleteUser(id: string) {
  return unwrapApiResponse<null>(apiClient.delete(`/management/staffs/${id}`));
}

export function createStaffProfile(
  userId: string,
  input: CreateStaffProfileInput,
) {
  return unwrapApiResponse<StaffProfile>(
    apiClient.post(`/management/staffs/${userId}/staff-profile`, input),
  );
}

export async function deleteUsers(ids: string[]) {
  await Promise.all(ids.map((id) => deleteUser(id)));
}

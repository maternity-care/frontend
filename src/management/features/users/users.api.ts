// src/management/features/users/users.api.ts

import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  CreateUserInput,
  GetUsersParams,
  UpdateUserInput,
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
    name: params?.name?.trim() || undefined,
    email: params?.email?.trim() || undefined,
    phone: params?.phone?.trim() || undefined,
    roleId: params?.roleId || undefined,
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
    phone: input.phone?.trim() || undefined,
    position: input.position?.trim() || undefined,
    roleIds: input.roleIds ?? [],
    permissionOverrides: input.permissionOverrides ?? [],
  };
}

function toUpdatePayload(input: UpdateUserInput) {
  const payload = {
    name: input.name?.trim(),
    email: input.email?.trim(),
    phone: input.phone?.trim(),
    password: input.password,
    status: input.status,
    roleIds: input.roleIds,
    permissionOverrides: input.permissionOverrides,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export async function getUsersPage(params?: GetUsersParams) {
  const data = await unwrapApiData<BackendUsersPayload>(
    apiClient.get("/management/users", {
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
    apiClient.post("/management/users", toCreatePayload(input)),
  );
}

export function getUser(id: string) {
  return unwrapApiData<User>(apiClient.get(`/management/users/${id}`));
}

export function updateUser(id: string, input: UpdateUserInput) {
  return unwrapApiResponse<User>(
    apiClient.patch(`/management/users/${id}`, toUpdatePayload(input)),
  );
}

export function deleteUser(id: string) {
  return unwrapApiResponse<null>(apiClient.delete(`/management/users/${id}`));
}

export async function deleteUsers(ids: string[]) {
  await Promise.all(ids.map((id) => deleteUser(id)));
}
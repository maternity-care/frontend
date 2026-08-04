import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  User,
  GetUsersParams,
  CreateUserDto,
  UpdateUserDto,
  UsersListData,
} from "./management-user.types";
export const getUsers = (params?: GetUsersParams) => {
  return unwrapApiData<UsersListData>(
    apiClient.get("/management/users", { params })
  );
};

/**
 * GET /management/users/{id}
 */
export const getUserById = (id: string) => {
  return unwrapApiData<User>(apiClient.get(`/management/users/${id}`));
};

/**
 * POST /management/users
 */
export const createUser = (payload: CreateUserDto) => {
  return unwrapApiData<User>(apiClient.post("/management/users", payload));
};

/**
 * PATCH /management/users/{id}
 */
export const updateUser = (id: string, payload: UpdateUserDto) => {
  return unwrapApiData<User>(
    apiClient.patch(`/management/users/${id}`, payload)
  );
};

/**
 * DELETE /management/users/{id}
 * → Backend chỉ khóa tài khoản (status = locked), không xóa cứng
 */
export const lockUser = (id: string) => {
  return unwrapApiData<null>(apiClient.delete(`/management/users/${id}`));
};
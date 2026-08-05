import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  User,
  GetUsersParams,
  CreateUserDto,
  UpdateUserDto,
  UsersListData,
  LockUserDto,
} from "./management-user.types";

/**
 * GET /management/users
 */
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
 * Hỗ trợ cập nhật status (active | inactive | locked)
 */
export const updateUser = (id: string, payload: UpdateUserDto) => {
  return unwrapApiData<User>(
    apiClient.patch(`/management/users/${id}`, payload)
  );
};

/**
 * DELETE /management/users/{id}
 * → Khóa tài khoản (cần lý do)
 */
export const lockUser = (id: string, payload: LockUserDto) => {
  return unwrapApiData<null>(
    apiClient.delete(`/management/users/${id}`, {
      data: payload,
    })
  );
};
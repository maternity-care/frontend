// src/management/features/users/users.types.ts

export type UserPermissionEffect = "allow" | "deny";

export interface Permission {
  id: string;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Role {
  id: string;
  name: string;
  guardName: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface UserPermissionOverride {
  permission: Permission;
  effect: UserPermissionEffect;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: number;
  roles: Role[];
  permissionOverrides?: UserPermissionOverride[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface GetUsersParams {
  name?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  status?: number;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface UsersListData {
  users: User[];
  total: number;
}

export interface UserPermissionOverrideInput {
  permissionId: string;
  effect: UserPermissionEffect;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  position?: string;
  roleIds?: string[];
  permissionOverrides?: UserPermissionOverrideInput[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  status?: number;
  roleIds?: string[];
  permissionOverrides?: UserPermissionOverrideInput[];
}
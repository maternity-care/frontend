import type { Permission } from "../permissions/permissions.types";
import type { Role } from "../roles/roles.types";

export type UserPermissionEffect = "allow" | "deny";

export interface UserPermissionOverride {
  permission: Permission;
  effect: UserPermissionEffect;
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: number;
  roles: Role[];
  permissionOverrides: UserPermissionOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
}

export interface UserPermissionOverrideInput {
  permissionId: string;
  effect: UserPermissionEffect;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  status?: number;
  roleIds?: string[];
  permissionOverrides?: UserPermissionOverrideInput[];
}

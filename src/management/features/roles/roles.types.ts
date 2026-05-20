import type { Permission } from "../permissions/permissions.types";

export interface Role {
  id: string;
  name: string;
  guardName: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

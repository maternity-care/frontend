import type { Role } from "../roles/roles.types";

export interface User {
  id: string;
  name: string;
  email: string;
  status: number;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
}

export interface Permission {
  id: string;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  guardName: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
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

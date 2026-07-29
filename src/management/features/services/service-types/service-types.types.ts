export type ServiceTypeStatus = "active" | "inactive";

export interface ManagementServiceType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: ServiceTypeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ManagementServiceTypeQuery {
  search?: string;
  status?: ServiceTypeStatus;
  page?: number;
  limit?: number;
}

export interface ManagementServiceTypeListResult {
  items: ManagementServiceType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateManagementServiceTypeInput {
  name: string;
  description?: string;
  status: ServiceTypeStatus;
}

export type UpdateManagementServiceTypeInput =
  Partial<CreateManagementServiceTypeInput>;

export type ManagementServiceTypeLookupItem = Pick<
  ManagementServiceType,
  "id" | "code" | "name" | "status"
>;

export type DeleteManagementServiceTypeResult =
  | ManagementServiceType
  | null;
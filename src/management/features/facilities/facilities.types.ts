export type FacilityStatus = "active" | "suspended";

export interface GetFacilitiesParams {
  search?: string;
  city?: string;
  status?: FacilityStatus;
}

export interface BackendFacility {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  latitude: string;
  longitude: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  hotline: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  workingHours: string;
  featuredServices: string;
  status: FacilityStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFacilityInput {
  name: string;
  code: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  hotline: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  workingDays?: string;
  openTime?: string;
  closeTime?: string;
  workingHours?: string;
  featuredServices?: string;
  description?: string;
  internalNote?: string;
  status: FacilityStatus;
}

export type UpdateFacilityInput = Partial<CreateFacilityInput>;
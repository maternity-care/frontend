import { apiClient, unwrapApiData } from "@/lib/axios";

import type {
  BackendPregnancyProfile,
  CreatePregnancyProfileInput,
  PregnancyProfile,
  UpdatePregnancyProfileInput,
} from "./pregnancy-profiles.types";

import { normalizePregnancyProfile } from "./pregnancy-profiles.types";
import { User } from "@/management/features/management-users/management-user.types";

const PREGNANCY_PROFILES_URL = "/pregnancy-profiles";

export async function getMyPregnancyProfiles(): Promise<
  PregnancyProfile[]
> {
  const response = await apiClient.get(PREGNANCY_PROFILES_URL);

  const data = await unwrapApiData<BackendPregnancyProfile[]>(
    response.data,
  );

  return data.map(normalizePregnancyProfile);
}

export async function getMyPregnancyProfileById(
  id: string,
): Promise<PregnancyProfile> {
  const response = await apiClient.get(
    `${PREGNANCY_PROFILES_URL}/${encodeURIComponent(id)}`,
  );

  const data = await unwrapApiData<BackendPregnancyProfile>(
    response.data,
  );

  return normalizePregnancyProfile(data);
}

export async function createPregnancyProfile(
  input: CreatePregnancyProfileInput,
): Promise<PregnancyProfile> {
  const response = await apiClient.post(
    PREGNANCY_PROFILES_URL,
    input,
  );

  const data = await unwrapApiData<BackendPregnancyProfile>(
    response.data,
  );

  return normalizePregnancyProfile(data);
}

export async function updateMyPregnancyProfile(
  id: string,
  input: UpdatePregnancyProfileInput,
): Promise<PregnancyProfile> {
  const response = await apiClient.patch(
    `${PREGNANCY_PROFILES_URL}/${encodeURIComponent(id)}`,
    input,
  );

  const data = await unwrapApiData<BackendPregnancyProfile>(
    response.data,
  );

  return normalizePregnancyProfile(data);
}

export async function requestSoftDeletePregnancyProfile(
  id: string,
): Promise<PregnancyProfile> {
  const response = await apiClient.post(
    `${PREGNANCY_PROFILES_URL}/soft-delete/${encodeURIComponent(id)}`,
  );

  const data = await unwrapApiData<BackendPregnancyProfile>(
    response.data,
  );

  return normalizePregnancyProfile(data);
}

export async function confirmOrRejectSoftDeletePregnancyProfile(
  id: string,
): Promise<PregnancyProfile> {
  const response = await apiClient.patch(
    `${PREGNANCY_PROFILES_URL}/soft-delete/${encodeURIComponent(id)}`,
  );

  const data = await unwrapApiData<BackendPregnancyProfile>(
    response.data,
  );

  return normalizePregnancyProfile(data);
}

export async function getUsersNoPregnant(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: User[] }> {
  const data = await unwrapApiData<User[] | { users: User[] }>(
    apiClient.get("/management/users/no-pregnant", { params }),
  );

  // Chuẩn hóa về dạng { users: User[] }
  if (Array.isArray(data)) {
    return { users: data };
  }

  return { users: data.users ?? [] };
}
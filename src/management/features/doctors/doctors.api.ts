import {
  apiClient,
  unwrapApiData,
  unwrapApiResponse,
} from "@/lib/axios";
import type {
  BackendDoctor,
  Doctor,
  DoctorStatus,
  UpdateDoctorInput,
} from "./doctors.types";

const ENDPOINT = "/management/doctors";

function normalizeStatus(status: string): DoctorStatus {
  return status.trim().toLowerCase() === "active"
    ? "active"
    : "inactive";
}

function normalizeDoctor(doctor: BackendDoctor): Doctor {
  const yearsOfExperience = Number(doctor.yearsOfExperience);

  return {
    id: String(doctor.id),
    staffId: String(doctor.staffId),
    licenseNo: doctor.licenseNo ?? "",
    title: doctor.title ?? "",
    specialty: doctor.specialty ?? "",
    yearsOfExperience:
      Number.isFinite(yearsOfExperience) && yearsOfExperience >= 0
        ? yearsOfExperience
        : 0,
    bio: doctor.bio ?? "",
    status: normalizeStatus(doctor.status),
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
}

function toUpdatePayload(input: UpdateDoctorInput) {
  const payload = {
    staffId: input.staffId?.trim(),
    licenseNo: input.licenseNo?.trim(),
    title: input.title?.trim(),
    specialty: input.specialty?.trim(),
    yearsOfExperience: input.yearsOfExperience,
    bio: input.bio?.trim(),
    status: input.status,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export async function getDoctors(): Promise<Doctor[]> {
  const data = await unwrapApiData<BackendDoctor[]>(
    apiClient.get(ENDPOINT),
  );

  return Array.isArray(data) ? data.map(normalizeDoctor) : [];
}

export async function getDoctor(id: string): Promise<Doctor> {
  const data = await unwrapApiData<BackendDoctor>(
    apiClient.get(`${ENDPOINT}/${id}`),
  );

  return normalizeDoctor(data);
}

export async function updateDoctor(
  id: string,
  input: UpdateDoctorInput,
) {
  const response = await unwrapApiResponse<BackendDoctor>(
    apiClient.patch(`${ENDPOINT}/${id}`, toUpdatePayload(input)),
  );

  return {
    ...response,
    data: normalizeDoctor(response.data),
  };
}

export const doctorsApi = {
  getDoctors,
  getDoctor,
  updateDoctor,
};
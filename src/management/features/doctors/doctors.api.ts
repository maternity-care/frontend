import {
  apiClient,
  unwrapApiData,
  unwrapApiResponse,
} from "@/lib/axios";
import type {
  BackendDoctor,
  CreateDoctorInput,
  Doctor,
  DoctorApiResponse,
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

function toCreatePayload(input: CreateDoctorInput) {
  return {
    name: input.name.trim(),
    personalEmail: input.personalEmail.trim(),
    phone: input.phone.trim(),
    roleIds: input.roleIds,
    facilityAssignments: input.facilityAssignments.map((assignment) => ({
      facilityId: assignment.facilityId.trim(),
      roles: assignment.roles,
    })),
    licenseNo: input.licenseNo.trim(),
    title: input.title.trim(),
    specialty: input.specialty.trim(),
    yearsOfExperience: input.yearsOfExperience,
    bio: input.bio?.trim() || undefined,
    permissionOverrides: input.permissionOverrides ?? [],
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

export async function createDoctor(
  input: CreateDoctorInput,
): Promise<DoctorApiResponse<Doctor>> {
  const response = await unwrapApiResponse<BackendDoctor>(
    apiClient.post(ENDPOINT, toCreatePayload(input)),
  );

  return {
    success: response.success ?? true,
    message: response.message ?? "Tạo bác sĩ thành công",
    data: normalizeDoctor(response.data),
  };
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
): Promise<DoctorApiResponse<Doctor>> {
  const response = await unwrapApiResponse<BackendDoctor>(
    apiClient.patch(`${ENDPOINT}/${id}`, toUpdatePayload(input)),
  );

  return {
    success: response.success ?? true,
    message: response.message ?? "Cập nhật bác sĩ thành công",
    data: normalizeDoctor(response.data),
  };
}

export async function deleteDoctor(
  id: string,
): Promise<DoctorApiResponse<null>> {
  const response = await unwrapApiResponse<null>(
    apiClient.delete(`${ENDPOINT}/${id}`),
  );

  return {
    success: response.success ?? true,
    message: response.message ?? "Xóa bác sĩ thành công",
    data: response.data ?? null,
  };
}

export const doctorsApi = {
  getDoctors,
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
};
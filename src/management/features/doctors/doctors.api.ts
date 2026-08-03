import {
  apiClient,
  unwrapApiData,
  unwrapApiResponse,
} from "@/lib/axios";
import type {
  BackendDoctor,
  BackendDoctorDataCountResponse,
  BackendDoctorListPayload,
  BackendDoctorPaginatedResponse,
  CreateDoctorInput,
  Doctor,
  DoctorApiResponse,
  DoctorListResult,
  DoctorStatus,
  GetDoctorsParams,
  UpdateDoctorInput,
} from "./doctors.types";

const ENDPOINT =
  "/management/doctors";

export const DOCTOR_MAX_PAGE = 100;
export const DOCTOR_MAX_LIMIT = 50;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function normalizeText(
  value: unknown,
) {
  return String(value ?? "").trim();
}

function normalizeStatus(
  status?: string | null,
): DoctorStatus {
  return normalizeText(status)
    .toLowerCase() === "active"
    ? "active"
    : "inactive";
}

function normalizePage(
  value?: number,
) {
  const page = Number(value);

  if (!Number.isFinite(page)) {
    return DEFAULT_PAGE;
  }

  return Math.min(
    DOCTOR_MAX_PAGE,
    Math.max(
      1,
      Math.trunc(page),
    ),
  );
}

function normalizeLimit(
  value?: number,
) {
  const limit = Number(value);

  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    DOCTOR_MAX_LIMIT,
    Math.max(
      1,
      Math.trunc(limit),
    ),
  );
}

function normalizeDoctor(
  doctor: BackendDoctor,
): Doctor {
  const staff =
    doctor.staff ?? null;

  const id = normalizeText(
    doctor.id,
  );

  const facilityId =
    normalizeText(
      staff?.facilityId ??
        doctor.facilityId,
    );

  const yearsOfExperience =
    Number(
      doctor.yearsOfExperience,
    );

  return {
    id,
    staffId: normalizeText(
      doctor.staffId ??
        staff?.id,
    ),

    name:
      normalizeText(
        staff?.name ??
          doctor.name,
      ) ||
      `Bác sĩ #${id}`,

    employeeCode:
      normalizeText(
        staff?.employeeCode ??
          doctor.employeeCode,
      ),

    personalEmail:
      normalizeText(
        staff?.personalEmail ??
          doctor.personalEmail,
      ),

    email:
      normalizeText(
        staff?.email ??
          doctor.email,
      ),

    phone:
      normalizeText(
        staff?.phone ??
          doctor.phone,
      ),

    address:
      normalizeText(
        staff?.address ??
          doctor.address,
      ),

    facilityId,
    facilityIds: facilityId
      ? [facilityId]
      : [],

    licenseNo: normalizeText(
      doctor.licenseNo,
    ),

    title: normalizeText(
      doctor.title,
    ),

    specialty: normalizeText(
      doctor.specialty,
    ),

    workingRoomTypeId:
      normalizeText(
        doctor.workingRoomTypeId,
      ),

    yearsOfExperience:
      Number.isFinite(
        yearsOfExperience,
      ) &&
      yearsOfExperience >= 0
        ? yearsOfExperience
        : 0,

    bio: normalizeText(
      doctor.bio,
    ),

    status: normalizeStatus(
      doctor.status,
    ),

    staffStatus:
      normalizeStatus(
        staff?.status ??
          doctor.status,
      ),

    createdAt: normalizeText(
      doctor.createdAt,
    ),

    updatedAt: normalizeText(
      doctor.updatedAt,
    ),
  };
}

function isPaginatedResponse(
  data: BackendDoctorListPayload,
): data is BackendDoctorPaginatedResponse {
  return (
    !Array.isArray(data) &&
    "items" in data &&
    Array.isArray(data.items)
  );
}

function isDataCountResponse(
  data: BackendDoctorListPayload,
): data is BackendDoctorDataCountResponse {
  return (
    !Array.isArray(data) &&
    "data" in data &&
    Array.isArray(data.data)
  );
}

function normalizeListResult(
  data: BackendDoctorListPayload,
  params?: GetDoctorsParams,
): DoctorListResult {
  const requestedPage =
    normalizePage(params?.page);

  const requestedLimit =
    normalizeLimit(params?.limit);

  if (
    isPaginatedResponse(data)
  ) {
    const total =
      Math.max(
        0,
        Number(data.total) || 0,
      );

    const page =
      normalizePage(data.page);

    const limit =
      normalizeLimit(data.limit);

    return {
      items: data.items.map(
        normalizeDoctor,
      ),
      total,
      page,
      limit,
      totalPages:
        Math.min(
          DOCTOR_MAX_PAGE,
          Math.max(
            total > 0 ? 1 : 0,
            Number(
              data.totalPages,
            ) ||
              Math.ceil(
                total / limit,
              ),
          ),
        ),
      hasPaginationMetadata: true,
    };
  }

  if (
    isDataCountResponse(data)
  ) {
    const total =
      Math.max(
        0,
        Number(data.count) || 0,
      );

    const page =
      normalizePage(
        data.page ??
          requestedPage,
      );

    const limit =
      normalizeLimit(
        data.limit ??
          requestedLimit,
      );

    return {
      items: data.data.map(
        normalizeDoctor,
      ),
      total,
      page,
      limit,
      totalPages:
        Math.min(
          DOCTOR_MAX_PAGE,
          Math.max(
            total > 0 ? 1 : 0,
            Number(
              data.totalPages,
            ) ||
              Math.ceil(
                total / limit,
              ),
          ),
        ),
      hasPaginationMetadata: true,
    };
  }

  const items =
    Array.isArray(data)
      ? data.map(
          normalizeDoctor,
        )
      : [];

  const offset =
    (requestedPage - 1) *
    requestedLimit;

  const mayHaveNextPage =
    items.length ===
    requestedLimit;

  return {
    items,
    total:
      offset +
      items.length +
      (mayHaveNextPage ? 1 : 0),
    page: requestedPage,
    limit: requestedLimit,
    totalPages:
      mayHaveNextPage
        ? Math.min(
            DOCTOR_MAX_PAGE,
            requestedPage + 1,
          )
        : requestedPage,
    hasPaginationMetadata: false,
  };
}

function compactParams(
  params?: GetDoctorsParams,
) {
  return Object.fromEntries(
    Object.entries({
      name:
        params?.name?.trim(),
      email:
        params?.email?.trim(),
      employeeCode:
        params?.employeeCode?.trim(),
      personalEmail:
        params?.personalEmail?.trim(),
      phone:
        params?.phone?.trim(),
      licenseNo:
        params?.licenseNo?.trim(),
      specialty:
        params?.specialty?.trim(),
      facilityId:
        params?.facilityId?.trim(),
      status: params?.status,
      filterYearsOfExperienceLevel:
        params?.filterYearsOfExperienceLevel,
      sortYearsOfExperience:
        params?.sortYearsOfExperience ??
        "desc",
      page:
        normalizePage(
          params?.page,
        ),
      limit:
        normalizeLimit(
          params?.limit,
        ),
    }).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );
}

function toCreatePayload(
  input: CreateDoctorInput,
) {
  return {
    name: input.name.trim(),
    personalEmail:
      input.personalEmail.trim(),
    phone: input.phone.trim(),
    roleIds: input.roleIds,
    facilityAssignments:
      input.facilityAssignments.map(
        (assignment) => ({
          facilityId:
            assignment.facilityId.trim(),
          roles:
            assignment.roles,
        }),
      ),
    licenseNo:
      input.licenseNo.trim(),
    title: input.title.trim(),
    specialty:
      input.specialty.trim(),
    yearsOfExperience:
      input.yearsOfExperience,
    workingRoomTypeId:
      input.workingRoomTypeId.trim(),
    bio:
      input.bio?.trim() ||
      undefined,
    permissionOverrides:
      input.permissionOverrides ??
      [],
  };
}

function toUpdatePayload(
  input: UpdateDoctorInput,
) {
  const payload = {
    staffId:
      input.staffId?.trim(),
    name:
      input.name?.trim(),
    personalEmail:
      input.personalEmail?.trim(),
    phone:
      input.phone?.trim(),
    address:
      input.address?.trim(),
    licenseNo:
      input.licenseNo?.trim(),
    title:
      input.title?.trim(),
    specialty:
      input.specialty?.trim(),
    yearsOfExperience:
      input.yearsOfExperience,
    workingRoomTypeId:
      input.workingRoomTypeId?.trim(),
    bio: input.bio?.trim(),
    status: input.status,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) =>
        value !== undefined,
    ),
  );
}

/**
 * GET /management/doctors
 */
export async function getDoctors(
  params: GetDoctorsParams = {},
): Promise<DoctorListResult> {
  const data =
    await unwrapApiData<BackendDoctorListPayload>(
      apiClient.get(
        ENDPOINT,
        {
          params:
            compactParams(
              params,
            ),
        },
      ),
    );

  return normalizeListResult(
    data,
    params,
  );
}

export async function getDoctorsByFacility(
  facilityId: string,
): Promise<Doctor[]> {
  const normalizedFacilityId =
    facilityId.trim();

  if (!normalizedFacilityId) {
    return [];
  }

  const data =
    await unwrapApiData<
      BackendDoctor[]
    >(
      apiClient.get(
        `${ENDPOINT}/facility/${encodeURIComponent(
          normalizedFacilityId,
        )}`,
      ),
    );

  return Array.isArray(data)
    ? data.map(normalizeDoctor)
    : [];
}

export async function createDoctor(
  input: CreateDoctorInput,
): Promise<
  DoctorApiResponse<Doctor>
> {
  const response =
    await unwrapApiResponse<BackendDoctor>(
      apiClient.post(
        ENDPOINT,
        toCreatePayload(input),
      ),
    );

  return {
    success:
      response.success ?? true,
    message:
      response.message ??
      "Tạo bác sĩ thành công",
    data: normalizeDoctor(
      response.data,
    ),
  };
}

export async function getDoctor(
  id: string,
): Promise<Doctor> {
  const data =
    await unwrapApiData<BackendDoctor>(
      apiClient.get(
        `${ENDPOINT}/${encodeURIComponent(
          id,
        )}`,
      ),
    );

  return normalizeDoctor(data);
}

export async function updateDoctor(
  id: string,
  input: UpdateDoctorInput,
): Promise<
  DoctorApiResponse<Doctor>
> {
  const response =
    await unwrapApiResponse<BackendDoctor>(
      apiClient.patch(
        `${ENDPOINT}/${encodeURIComponent(
          id,
        )}`,
        toUpdatePayload(input),
      ),
    );

  return {
    success:
      response.success ?? true,
    message:
      response.message ??
      "Cập nhật bác sĩ thành công",
    data: normalizeDoctor(
      response.data,
    ),
  };
}

export async function deleteDoctor(
  id: string,
): Promise<
  DoctorApiResponse<null>
> {
  const response =
    await unwrapApiResponse<null>(
      apiClient.delete(
        `${ENDPOINT}/${encodeURIComponent(
          id,
        )}`,
      ),
    );

  return {
    success:
      response.success ?? true,
    message:
      response.message ??
      "Xóa bác sĩ thành công",
    data:
      response.data ?? null,
  };
}

export const doctorsApi = {
  getDoctors,
  getDoctorsByFacility,
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
};
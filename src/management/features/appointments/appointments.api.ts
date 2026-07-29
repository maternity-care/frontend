import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  CheckInAppointmentInput,
  GetManagementAppointmentsParams,
  ManagementAppointment,
  RescheduleAppointmentInput,
} from "./appointments.types";

const ENDPOINT = "/management/appointments";

export async function getManagementAppointments(
  params: GetManagementAppointmentsParams = {},
): Promise<ManagementAppointment[]> {
  return unwrapApiData<ManagementAppointment[]>(
    apiClient.get(ENDPOINT, {
      params: Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
      ),
    }),
  );
}

export async function getManagementAppointment(id: string): Promise<ManagementAppointment> {
  return unwrapApiData<ManagementAppointment>(
    apiClient.get(`${ENDPOINT}/${encodeURIComponent(id)}`),
  );
}

export async function checkInAppointment(
  id: string,
  input: CheckInAppointmentInput,
): Promise<ManagementAppointment> {
  return unwrapApiData<ManagementAppointment>(
    apiClient.patch(`${ENDPOINT}/${encodeURIComponent(id)}/check-in`, input),
  );
}

export async function rescheduleAppointment(
  id: string,
  input: RescheduleAppointmentInput,
): Promise<ManagementAppointment> {
  return unwrapApiData<ManagementAppointment>(
    apiClient.patch(`${ENDPOINT}/${encodeURIComponent(id)}/reschedule`, input),
  );
}

export async function cancelAppointment(
  id: string,
  reason?: string,
): Promise<ManagementAppointment> {
  return unwrapApiData<ManagementAppointment>(
    apiClient.patch(`${ENDPOINT}/${encodeURIComponent(id)}/cancel`, { reason }),
  );
}

export async function markNoShowAppointment(
  id: string,
  reason?: string,
): Promise<ManagementAppointment> {
  return unwrapApiData<ManagementAppointment>(
    apiClient.patch(`${ENDPOINT}/${encodeURIComponent(id)}/no-show`, { reason }),
  );
}

export async function completeAppointment(id: string): Promise<ManagementAppointment> {
  return unwrapApiData<ManagementAppointment>(
    apiClient.patch(`${ENDPOINT}/${encodeURIComponent(id)}/complete`),
  );
}

import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  CheckInAppointmentInput,
  AddAppointmentServiceItemsInput,
  AppointmentServiceItem,
  CheckInAppointmentServiceItemInput,
  GetManagementAppointmentsParams,
  ManagementAppointment,
  RescheduleAppointmentInput,
  SetServiceResultExpectedAtInput,
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

export async function getAppointmentServiceItems(
  appointmentId: string,
): Promise<AppointmentServiceItem[]> {
  return unwrapApiData<AppointmentServiceItem[]>(
    apiClient.get(`${ENDPOINT}/${encodeURIComponent(appointmentId)}/service-items`),
  );
}

export async function getMySpecialistServiceItems(): Promise<AppointmentServiceItem[]> {
  return unwrapApiData<AppointmentServiceItem[]>(
    apiClient.get(`${ENDPOINT}/service-items/mine`),
  );
}

export async function addAppointmentServiceItems(
  appointmentId: string,
  input: AddAppointmentServiceItemsInput,
): Promise<AppointmentServiceItem[]> {
  return unwrapApiData<AppointmentServiceItem[]>(
    apiClient.post(`${ENDPOINT}/${encodeURIComponent(appointmentId)}/service-items`, input),
  );
}

export async function checkInAppointmentServiceItem(
  appointmentId: string,
  itemId: string,
  input: CheckInAppointmentServiceItemInput = {},
): Promise<AppointmentServiceItem> {
  return unwrapApiData<AppointmentServiceItem>(
    apiClient.patch(
      `${ENDPOINT}/${encodeURIComponent(appointmentId)}/service-items/${encodeURIComponent(itemId)}/check-in`,
      input,
    ),
  );
}

export async function callAppointmentServiceItem(
  appointmentId: string,
  itemId: string,
): Promise<AppointmentServiceItem> {
  return unwrapApiData<AppointmentServiceItem>(
    apiClient.patch(
      `${ENDPOINT}/${encodeURIComponent(appointmentId)}/service-items/${encodeURIComponent(itemId)}/call`,
    ),
  );
}

export async function startAppointmentServiceItem(
  appointmentId: string,
  itemId: string,
): Promise<AppointmentServiceItem> {
  return unwrapApiData<AppointmentServiceItem>(
    apiClient.patch(
      `${ENDPOINT}/${encodeURIComponent(appointmentId)}/service-items/${encodeURIComponent(itemId)}/start`,
    ),
  );
}

export async function setAppointmentServiceResultExpectedAt(
  appointmentId: string,
  itemId: string,
  input: SetServiceResultExpectedAtInput,
): Promise<AppointmentServiceItem> {
  return unwrapApiData<AppointmentServiceItem>(
    apiClient.patch(
      `${ENDPOINT}/${encodeURIComponent(appointmentId)}/service-items/${encodeURIComponent(itemId)}/expect-result`,
      input,
    ),
  );
}

export async function completeAppointmentServiceItem(
  appointmentId: string,
  itemId: string,
): Promise<AppointmentServiceItem> {
  return unwrapApiData<AppointmentServiceItem>(
    apiClient.patch(
      `${ENDPOINT}/${encodeURIComponent(appointmentId)}/service-items/${encodeURIComponent(itemId)}/complete`,
    ),
  );
}

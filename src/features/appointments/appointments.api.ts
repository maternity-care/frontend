import { apiClient, unwrapApiData } from "@/lib/axios";

export interface CreateAppointmentInput {
  facilityId: string;
  serviceId: string;
  doctorId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Appointment {
  id: string;
  facilityId: string;
  serviceId: string;
  doctorId: string;
  roomId: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  return unwrapApiData<Appointment>(
    apiClient.post("/appointments", input),
  );
}

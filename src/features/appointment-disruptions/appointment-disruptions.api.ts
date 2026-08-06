import { apiClient, unwrapApiData } from '@/lib/axios';

export interface AppointmentDisruption {
  id: string;
  appointmentId: string;
  disruptionId: string;
  resolutionStatus: 'pending' | 'rescheduled' | 'refund_pending' | 'resolved' | string;
  disruptionStatus: string;
  selectedOption?: string | null;
  resolutionNote?: string | null;
  reason?: string | null;
  oldScheduledStart: string;
  oldScheduledEnd: string;
  facilityId: string;
  facilityName: string;
  serviceName: string;
  patientName: string;
  patientEmail: string;
  doctorName?: string | null;
  roomName?: string | null;
  createdAt: string;
}

export interface DisruptionRescheduleOption {
  shiftId: string;
  doctorId: string;
  doctorName: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface RescheduleDisruptionInput {
  doctorId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export function getMyAppointmentDisruptions() {
  return unwrapApiData<AppointmentDisruption[]>(apiClient.get('/appointment-disruptions'));
}

export function getManagementAppointmentDisruptions(facilityId?: string) {
  return unwrapApiData<AppointmentDisruption[]>(
    apiClient.get('/management/appointment-disruptions', { params: { facilityId } }),
  );
}

export function getDisruptionOptions(id: string) {
  return unwrapApiData<DisruptionRescheduleOption[]>(
    apiClient.get(`/appointment-disruptions/${encodeURIComponent(id)}/options`),
  );
}

export function rescheduleMyDisruption(id: string, input: RescheduleDisruptionInput) {
  return unwrapApiData(
    apiClient.patch(`/appointment-disruptions/${encodeURIComponent(id)}/reschedule`, input),
  );
}

export function requestDisruptionRefund(id: string, reason?: string) {
  return unwrapApiData(
    apiClient.patch(`/appointment-disruptions/${encodeURIComponent(id)}/refund`, { reason }),
  );
}

export function completeDisruptionRefund(id: string, reason?: string) {
  return unwrapApiData(
    apiClient.patch(`/management/appointment-disruptions/${encodeURIComponent(id)}/refund-complete`, { reason }),
  );
}

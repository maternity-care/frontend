"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, DatePicker, Empty, Modal, Select, Tag, Typography, message } from "antd";
import { CalendarDays, CheckCircle2, Clock, Hospital, Search, Stethoscope } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";

import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { createAppointment } from "@/features/appointments/appointments.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { getPublicFacilities } from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import { getPublicFacilityServices } from "@/management/features/services/services.api";
import type { FacilityService } from "@/management/features/services/services.types";
import {
  getPublicDoctorAvailability,
  getPublicWeeklyDoctorShifts,
} from "@/features/doctor-shifts/public-doctor-shifts.api";
import type { PublicDoctorShiftItem } from "@/features/doctor-shifts/public-doctor-shifts.types";

const { Text, Title } = Typography;

type AvailabilityShift = {
  doctorId?: string;
  doctorLabel?: string;
  shiftId: string;
  startTime: string;
  endTime: string;
  status: string;
  bookedAppointments: number;
  maxAppointments?: number;
  availableSlots: Array<{ startTime: string; endTime: string } | string>;
};

type AvailabilityResponse = {
  shifts?: AvailabilityShift[];
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeSlot(slot: AvailabilityShift["availableSlots"][number]) {
  if (typeof slot === "string") return slot;

  return `${slot.startTime} - ${slot.endTime}`;
}

function getSlotTimes(slot: AvailabilityShift["availableSlots"][number]) {
  if (typeof slot !== "string") {
    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
  }

  const [startTime = "", endTime = ""] = slot.split(" - ");

  return {
    startTime,
    endTime,
  };
}

function isPastSlot(date: Dayjs, startTime: string) {
  return dayjs(`${date.format("YYYY-MM-DD")} ${startTime}`).isBefore(dayjs());
}

export function QuickAppointmentCard() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [modal, modalContextHolder] = Modal.useModal();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityServices, setFacilityServices] = useState<FacilityService[]>([]);
  const [doctorShifts, setDoctorShifts] = useState<PublicDoctorShiftItem[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);

  const [facilityId, setFacilityId] = useState<string>();
  const [serviceId, setServiceId] = useState<string>();
  const [doctorId, setDoctorId] = useState<string>();
  const [date, setDate] = useState<Dayjs | null>(dayjs());

  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [bookingSlotKey, setBookingSlotKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingFacilities(true);
    getPublicFacilities({ status: "active", limit: 50 })
      .then(setFacilities)
      .catch((loadError) =>
        setError(getErrorMessage(loadError, "Không tải được danh sách cơ sở.")),
      )
      .finally(() => setLoadingFacilities(false));
  }, []);

  useEffect(() => {
    setServiceId(undefined);
    setDoctorId(undefined);
    setFacilityServices([]);
    setDoctorShifts([]);
    setAvailability(null);

    if (!facilityId) return;

    setLoadingServices(true);
    getPublicFacilityServices(facilityId, { status: "active", limit: 100 })
      .then(setFacilityServices)
      .catch((loadError) =>
        setError(getErrorMessage(loadError, "Không tải được dịch vụ của cơ sở.")),
      )
      .finally(() => setLoadingServices(false));
  }, [facilityId]);

  useEffect(() => {
    setDoctorId(undefined);
    setDoctorShifts([]);
    setAvailability(null);

    if (!facilityId || !date) return;

    setLoadingDoctors(true);
    getPublicWeeklyDoctorShifts({
      facilityId,
      weekStart: date.startOf("week").format("YYYY-MM-DD"),
    })
      .then((shifts) => {
        const selectedDate = date.format("YYYY-MM-DD");
        setDoctorShifts(shifts.filter((shift) => shift.shiftDate === selectedDate));
      })
      .catch((loadError) =>
        setError(getErrorMessage(loadError, "Không tải được lịch bác sĩ.")),
      )
      .finally(() => setLoadingDoctors(false));
  }, [facilityId, date]);

  const doctorOptions = useMemo(() => {
    const doctors = new Map<string, PublicDoctorShiftItem>();

    doctorShifts.forEach((shift) => {
      if (shift.doctorId && !doctors.has(shift.doctorId)) {
        doctors.set(shift.doctorId, shift);
      }
    });

    return [...doctors.values()].map((shift) => ({
      value: shift.doctorId,
      label: `${shift.doctorTitle ? `${shift.doctorTitle} ` : ""}${shift.doctorName || "Bác sĩ"}${
        shift.doctorSpecialty ? ` - ${shift.doctorSpecialty}` : ""
      }`,
    }));
  }, [doctorShifts]);

  const selectedDoctorShifts = useMemo(() => {
    return doctorShifts.filter((shift) => !doctorId || shift.doctorId === doctorId);
  }, [doctorId, doctorShifts]);

  const canCheckAvailability = Boolean(facilityId && serviceId && date);

  const handleCheckAvailability = async () => {
    if (!facilityId || !date) return;
    if (date.isBefore(dayjs(), "day")) {
      setError("Không thể đặt lịch trong quá khứ.");
      return;
    }

    const targetDoctors = doctorId
      ? doctorOptions.filter((doctor) => doctor.value === doctorId)
      : doctorOptions;

    if (targetDoctors.length === 0) {
      setError("Ngày này chưa có bác sĩ trực để kiểm tra lịch trống.");
      return;
    }

    setCheckingAvailability(true);
    setError(null);
    setAvailability(null);

    try {
      const responses = await Promise.all(
        targetDoctors.map(async (doctor) => {
          const data = await getPublicDoctorAvailability(doctor.value, {
            facilityId,
            date: date.format("YYYY-MM-DD"),
            slotMinutes: 30,
          });

          return {
            doctorId: doctor.value,
            doctorLabel: doctor.label,
            shifts: data.shifts ?? [],
          };
        }),
      );

      setAvailability({
        shifts: responses.flatMap((response) =>
          response.shifts.map((shift) => ({
            ...shift,
            doctorId: response.doctorId,
            doctorLabel: response.doctorLabel,
          })),
        ),
      });
    } catch (checkError) {
      setError(getErrorMessage(checkError, "Không kiểm tra được lịch trống."));
    } finally {
      setCheckingAvailability(false);
    }
  };

  const availableSlots =
    availability?.shifts?.flatMap((shift) =>
      shift.availableSlots.map((slot) => ({
        doctorId: shift.doctorId,
        doctorLabel: shift.doctorLabel,
        shiftId: shift.shiftId,
        label: normalizeSlot(slot),
        ...getSlotTimes(slot),
      })).filter((slot) => !date || !isPastSlot(date, slot.startTime)),
    ) ?? [];

  const selectedFacility = facilities.find((facility) => facility.id === facilityId);
  const selectedService = facilityServices.find((service) => service.serviceId === serviceId);
  const selectedDoctor = doctorOptions.find((doctor) => doctor.value === doctorId);

  const bookSlot = async (slot: (typeof availableSlots)[number]) => {
    if (!accessToken) {
      setError("Bạn cần đăng nhập để đặt lịch.");
      return;
    }

    if (!facilityId || !serviceId || !slot.doctorId || !date) return;
    if (isPastSlot(date, slot.startTime)) {
      setError("Không thể đặt lịch trong quá khứ.");
      return;
    }

    const slotKey = `${slot.shiftId}-${slot.label}`;
    setBookingSlotKey(slotKey);
    setError(null);

    try {
      await createAppointment({
        facilityId,
        serviceId,
        doctorId: slot.doctorId,
        shiftId: slot.shiftId,
        date: date.format("YYYY-MM-DD"),
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      message.success("Đặt lịch thành công.");
      await handleCheckAvailability();
    } catch (bookError) {
      setError(getErrorMessage(bookError, "Không đặt được lịch. Bạn thử lại nhé."));
    } finally {
      setBookingSlotKey(null);
    }
  };

  const handleBookSlot = (slot: (typeof availableSlots)[number]) => {
    if (!accessToken) {
      setError("Bạn cần đăng nhập để đặt lịch.");
      return;
    }

    if (!facilityId || !serviceId || !slot.doctorId || !date) return;
    if (isPastSlot(date, slot.startTime)) {
      setError("Không thể đặt lịch trong quá khứ.");
      return;
    }

    modal.confirm({
      title: "Xác nhận đặt lịch khám",
      okText: "Xác nhận đặt lịch",
      cancelText: "Hủy",
      centered: true,
      okButtonProps: {
        className: "!bg-pink-500 hover:!bg-pink-600",
      },
      content: (
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-900">Cơ sở:</span>{" "}
            {selectedFacility?.name ?? "Cơ sở đã chọn"}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Dịch vụ:</span>{" "}
            {selectedService?.serviceName ?? "Dịch vụ đã chọn"}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Bác sĩ:</span>{" "}
            {selectedDoctor?.label ?? slot.doctorLabel ?? "Bác sĩ đã chọn"}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Thời gian:</span>{" "}
            {date.format("DD/MM/YYYY")} · {slot.label}
          </p>
        </div>
      ),
      onOk: () => bookSlot(slot),
    });
  };

  return (
    <Card
      className="relative z-10 w-full min-w-0 overflow-hidden !rounded-[28px] !border-pink-100 !shadow-xl !shadow-pink-100/70"
      styles={{ body: { padding: 28, minWidth: 0 } }}
    >
      {modalContextHolder}

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
          <CalendarDays className="h-6 w-6" />
        </div>

        <div>
          <Title level={4} className="!mb-0 !text-slate-950">
            {RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.TITLE}
          </Title>

          <Text className="!text-slate-500">
            {RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.SUBTITLE}
          </Text>
        </div>
      </div>

      <div className="grid gap-4">
        {error ? (
          <Alert type="warning" showIcon title={error} closable onClose={() => setError(null)} />
        ) : null}

        <Select
          size="large"
          showSearch
          className="w-full min-w-0"
          popupMatchSelectWidth={false}
          loading={loadingFacilities}
          placeholder={RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.FACILITY_PLACEHOLDER}
          optionFilterProp="label"
          value={facilityId}
          onChange={setFacilityId}
          options={facilities.map((facility) => ({
            value: facility.id,
            label: `${facility.name} - ${facility.city || facility.address}`,
          }))}
        />

        <Select
          size="large"
          showSearch
          className="w-full min-w-0"
          popupMatchSelectWidth={false}
          disabled={!facilityId}
          loading={loadingServices}
          placeholder={RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.SERVICE_PLACEHOLDER}
          optionFilterProp="label"
          value={serviceId}
          onChange={(value) => {
            setServiceId(value);
            setAvailability(null);
          }}
          options={facilityServices.map((service) => ({
            value: service.serviceId,
            label: `${service.serviceName} - ${Number(service.price).toLocaleString("vi-VN")}đ`,
          }))}
          notFoundContent={facilityId ? "Cơ sở chưa có dịch vụ khả dụng" : null}
        />

        <DatePicker
          size="large"
          className="w-full"
          value={date}
          format="DD/MM/YYYY"
          placeholder={RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.DATE_PLACEHOLDER}
          disabledDate={(current) => current.isBefore(dayjs(), "day")}
          onChange={(value) => {
            setDate(value);
            setAvailability(null);
          }}
        />

        <Select
          size="large"
          showSearch
          allowClear
          className="w-full min-w-0"
          popupMatchSelectWidth={false}
          disabled={!facilityId || !date}
          loading={loadingDoctors}
          placeholder={`${RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.DOCTOR_PLACEHOLDER} (không bắt buộc)`}
          optionFilterProp="label"
          value={doctorId}
          onChange={(value) => {
            setDoctorId(value);
            setAvailability(null);
          }}
          options={doctorOptions}
          notFoundContent={facilityId && date ? "Chưa có bác sĩ trực ngày này" : null}
        />

        {selectedDoctorShifts.length ? (
          <div className="rounded-xl border border-pink-100 bg-pink-50/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-pink-700">
              <Stethoscope className="h-4 w-4" />
              Ca trực trong ngày
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDoctorShifts.map((shift) => (
                <Tag key={shift.id} color={shift.status === "available" ? "green" : "default"}>
                  {shift.startTime} - {shift.endTime}
                </Tag>
              ))}
            </div>
          </div>
        ) : null}

        <Button
          type="primary"
          size="large"
          block
          loading={checkingAvailability}
          disabled={!canCheckAvailability}
          icon={<Search className="h-4 w-4" />}
          className="!h-12 !rounded-xl !bg-pink-500 !font-semibold"
          onClick={handleCheckAvailability}
        >
          {RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.CHECK_AVAILABLE}
        </Button>

        {availability ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-pink-500" />
              Lịch trống
            </div>

            {availableSlots.length ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={`${slot.doctorId}-${slot.shiftId}-${slot.label}`}
                    size="middle"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    loading={bookingSlotKey === `${slot.shiftId}-${slot.label}`}
                    disabled={Boolean(bookingSlotKey)}
                    className="!h-auto min-w-0 !whitespace-normal !rounded-xl !border-pink-200 !bg-pink-50 !px-3 !py-2 !font-medium !leading-5 !text-pink-700 hover:!border-pink-400 hover:!bg-pink-100"
                    onClick={() => handleBookSlot(slot)}
                  >
                    Đặt {slot.label}
                    {!doctorId && slot.doctorLabel ? ` · ${slot.doctorLabel}` : ""}
                  </Button>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ngày này chưa còn slot trống" />
            )}
          </div>
        ) : null}

        <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
          <Hospital className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <Text className="!text-xs !leading-5 !text-slate-500">
            {RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.LOGIN_REQUIRED_NOTE}{" "}
            <Link href="/login" className="font-semibold text-pink-600 hover:text-pink-700">
              Đăng nhập để đặt lịch.
            </Link>
          </Text>
        </div>
      </div>
    </Card>
  );
}

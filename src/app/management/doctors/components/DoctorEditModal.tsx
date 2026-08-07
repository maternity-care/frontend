"use client";

import type {
  Doctor,
} from "@/management/features/doctors/doctors.types";
import {
  DoctorFormModalBase,
} from "./doctor-form.shared";

type DoctorEditModalProps = {
  open: boolean;
  doctor: Doctor | null;
  allowedFacilityId: string;
  onClose: () => void;
  onUpdated?: (
    doctor: Doctor,
  ) => void;
};

export function DoctorEditModal({
  open,
  doctor,
  allowedFacilityId,
  onClose,
  onUpdated,
}: DoctorEditModalProps) {
  return (
    <DoctorFormModalBase
      open={open && Boolean(doctor)}
      editingDoctor={doctor}
      allowedFacilityId={
        allowedFacilityId
      }
      onClose={onClose}
      onSaved={(savedDoctor, mode) => {
        if (mode === "update") {
          onUpdated?.(
            savedDoctor,
          );
        }
      }}
    />
  );
}
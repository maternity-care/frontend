"use client";

import type {
  Doctor,
} from "@/management/features/doctors/doctors.types";
import {
  DoctorFormModalBase,
} from "./doctor-form.shared";

type DoctorCreateModalProps = {
  open: boolean;
  allowedFacilityId: string;
  onClose: () => void;
  onCreated?: (
    doctor: Doctor,
  ) => void;
};

export function DoctorCreateModal({
  open,
  allowedFacilityId,
  onClose,
  onCreated,
}: DoctorCreateModalProps) {
  return (
    <DoctorFormModalBase
      open={open}
      editingDoctor={null}
      allowedFacilityId={
        allowedFacilityId
      }
      onClose={onClose}
      onSaved={(doctor, mode) => {
        if (mode === "create") {
          onCreated?.(doctor);
        }
      }}
    />
  );
}
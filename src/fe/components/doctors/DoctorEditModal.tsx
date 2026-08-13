"use client";

import type { Doctor } from "@/management/features/doctors/doctors.types";
import { DoctorForm } from "./DoctorForm";

type Props = {
  open: boolean;
  doctor: Doctor | null;
  allowedFacilityId: string;
  onClose: () => void;
  onUpdated?: (doctor: Doctor) => void;
};

export function DoctorEditModal({
  open,
  doctor,
  allowedFacilityId,
  onClose,
  onUpdated,
}: Props) {
  return (
    <DoctorForm
      open={open && Boolean(doctor)}
      editingDoctor={doctor}
      allowedFacilityId={allowedFacilityId}
      onClose={onClose}
      onSaved={(savedDoctor, mode) => {
        if (mode === "update") onUpdated?.(savedDoctor);
      }}
    />
  );
}
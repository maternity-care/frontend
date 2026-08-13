"use client";

import type { Doctor } from "@/management/features/doctors/doctors.types";
import { DoctorForm } from "./DoctorForm";

type Props = {
  open: boolean;
  allowedFacilityId: string;
  onClose: () => void;
  onCreated?: (doctor: Doctor) => void;
};

export function DoctorCreateModal({
  open,
  allowedFacilityId,
  onClose,
  onCreated,
}: Props) {
  return (
    <DoctorForm
      open={open}
      editingDoctor={null}
      allowedFacilityId={allowedFacilityId}
      onClose={onClose}
      onSaved={(doctor, mode) => {
        if (mode === "create") onCreated?.(doctor);
      }}
    />
  );
}
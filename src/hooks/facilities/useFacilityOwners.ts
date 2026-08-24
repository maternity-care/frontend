"use client";

import { useEffect, useState } from "react";
import type { Facility } from "@/management/features/facilities/facilities.types";
import {
  getFacilityOwnerOptions,
  type FacilityOwnerOption,
} from "@/fe/components/facilities/facility-owner.shared";

function currentOwnerFallback(facility: Facility): FacilityOwnerOption {
  const ownerId = facility.ownerId ?? "";

  return {
    value: ownerId,
    label: facility.ownerEmail
      ? `${facility.ownerName} (${facility.ownerEmail})`
      : facility.ownerName,
    name: facility.ownerName || `Chủ cơ sở #${ownerId}`,
    email: facility.ownerEmail ?? "",
    phone: facility.ownerPhone ?? "",
    status: "active",
    disabled: false,
  };
}

export function useFacilityOwners(
  open: boolean,
  facility?: Facility | null,
) {
  const [options, setOptions] = useState<FacilityOwnerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      setLoading(true);
      setError(null);

      void getFacilityOwnerOptions()
        .then((ownerOptions) => {
          if (cancelled) return;

          if (
            facility?.ownerId &&
            !ownerOptions.some((owner) => owner.value === facility.ownerId)
          ) {
            setOptions([currentOwnerFallback(facility), ...ownerOptions]);
            return;
          }

          setOptions(ownerOptions);
        })
        .catch((loadError) => {
          if (cancelled) return;

          setOptions(facility?.ownerId ? [currentOwnerFallback(facility)] : []);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải danh sách chủ cơ sở.",
          );
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [facility, open]);

  return { options, loading, error };
}

"use client";

import { getFacilityServices } from "@/management/features/services/services.api";
import { FacilityService, GetFacilityServicesParams } from "@/management/features/services/services.types";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

export function useFacilityServices(
  params: GetFacilityServicesParams,
) {
  const [items, setItems] = useState<FacilityService[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchFacilityServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getFacilityServices(params);

      setItems(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setItems([]);
      setTotal(0);
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [
    params.search,
    params.facilityId,
    params.serviceId,
    params.serviceType,
    params.status,
    params.page,
    params.limit,
  ]);

  useEffect(() => {
    void fetchFacilityServices();
  }, [fetchFacilityServices]);

  return {
    items,
    total,
    loading,
    error,
    reload: fetchFacilityServices,
  };
}
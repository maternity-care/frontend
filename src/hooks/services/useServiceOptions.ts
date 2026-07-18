"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPublicFacilities,
} from "@/management/features/facilities/facilities.api";

import {
  getServices,
} from "@/management/features/services/services.api";

import type {
  Facility,
} from "@/management/features/facilities/facilities.types";

import type {
  Service,
} from "@/management/features/services/services.types";

export function useServiceOptions() {
  const [facilities, setFacilities] =
    useState<Facility[]>([]);

  const [services, setServices] =
    useState<Service[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<unknown>();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [
        facilitiesResult,
        servicesResult,
      ] = await Promise.all([
        getPublicFacilities({
          status: "active",
          page: 1,
          limit: 100,
        }),
        getServices({
          status: "active",
          page: 1,
          limit: 100,
        }),
      ]);

      setFacilities(facilitiesResult);
      setServices(servicesResult);
    } catch (requestError) {
      setFacilities([]);
      setServices([]);
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [reload]);

  return {
    facilities,
    services,
    loading,
    error,
    reload,
  };
}
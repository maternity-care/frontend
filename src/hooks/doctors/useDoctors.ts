"use client";

import { useCallback, useEffect, useState } from "react";
import type { TablePaginationConfig } from "antd/es/table";
import { getDoctors } from "@/management/features/doctors/doctors.api";
import { DOCTOR_DEFAULT_PAGE_SIZE } from "@/management/features/doctors/doctors.constants";
import type {
  Doctor,
  DoctorExperienceLevel,
  DoctorExperienceSort,
  DoctorStatus,
  GetDoctorsParams,
} from "@/management/features/doctors/doctors.types";
import {
  doctorBelongsToFacility,
  getDoctorErrorMessage,
} from "@/management/features/doctors/doctors.utils";

export type DoctorFilters = {
  keyword?: string;
  specialty?: string;
  status?: DoctorStatus;
  experienceLevel?: DoctorExperienceLevel;
  sortYearsOfExperience: DoctorExperienceSort;
};

type CombinedSearchField = "name" | "phone" | "employeeCode";

function inferSearchField(keyword: string): CombinedSearchField {
  const value = keyword.trim();
  if (/^(0|\+84)\d{9,10}$/.test(value)) return "phone";
  if (/^[a-z]{1,12}[-_]?\d+$/i.test(value)) return "employeeCode";
  return "name";
}

function toApiParams(
  filters: DoctorFilters,
  page: number,
  limit: number,
  facilityId?: string,
): GetDoctorsParams {
  const keyword = filters.keyword?.trim();
  const searchField = keyword ? inferSearchField(keyword) : undefined;

  return {
    ...(keyword && searchField ? { [searchField]: keyword } : {}),
    facilityId: facilityId?.trim() || undefined,
    specialty: filters.specialty?.trim() || undefined,
    status: filters.status,
    filterYearsOfExperienceLevel: filters.experienceLevel,
    sortYearsOfExperience: filters.sortYearsOfExperience,
    page,
    limit,
  };
}

export function useDoctors({
  canViewAllFacilities,
  scopedFacilityId,
}: {
  canViewAllFacilities: boolean;
  scopedFacilityId: string;
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DOCTOR_DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [searchValue, setSearchValue] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DoctorStatus>();
  const [experienceLevel, setExperienceLevel] = useState<DoctorExperienceLevel>();
  const [experienceSort, setExperienceSort] =
    useState<DoctorExperienceSort>("desc");
  const [appliedFilters, setAppliedFilters] = useState<DoctorFilters>({
    sortYearsOfExperience: "desc",
  });

  const loadDoctors = useCallback(
    async (filters: DoctorFilters, page: number, limit: number) => {
      if (!canViewAllFacilities && !scopedFacilityId) {
        setDoctors([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getDoctors(
          toApiParams(
            filters,
            page,
            limit,
            canViewAllFacilities ? undefined : scopedFacilityId,
          ),
        );

        const visibleDoctors = canViewAllFacilities
          ? result.items
          : result.items.filter((doctor) =>
              doctorBelongsToFacility(doctor, scopedFacilityId),
            );

        setDoctors(visibleDoctors);
        setTotal(
          canViewAllFacilities || visibleDoctors.length === result.items.length
            ? result.total
            : visibleDoctors.length,
        );
        setCurrentPage(result.page);
        setPageSize(result.limit);
      } catch (loadError) {
        setError(getDoctorErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    },
    [canViewAllFacilities, scopedFacilityId],
  );

  useEffect(() => {

    const timer = window.setTimeout(() => {
      void loadDoctors(
        { sortYearsOfExperience: "desc" },
        1,
        DOCTOR_DEFAULT_PAGE_SIZE,
      );
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadDoctors]);

  function buildFilters(overrides: Partial<DoctorFilters> = {}): DoctorFilters {
    return {
      keyword: searchValue.trim() || undefined,
      specialty: specialtyFilter.trim() || undefined,
      status: statusFilter,
      experienceLevel,
      sortYearsOfExperience: experienceSort,
      ...overrides,
    };
  }

  function applyFilters(overrides: Partial<DoctorFilters> = {}) {
    const nextFilters = buildFilters(overrides);
    setAppliedFilters(nextFilters);
    setCurrentPage(1);
    void loadDoctors(nextFilters, 1, pageSize);
  }

  function resetFilters() {
    setSearchValue("");
    setSpecialtyFilter("");
    setStatusFilter(undefined);
    setExperienceLevel(undefined);
    setExperienceSort("desc");

    const nextFilters: DoctorFilters = { sortYearsOfExperience: "desc" };
    setAppliedFilters(nextFilters);
    setCurrentPage(1);
    void loadDoctors(nextFilters, 1, pageSize);
  }

  function handleTableChange(pagination: TablePaginationConfig) {
    const nextPageSize = pagination.pageSize ?? pageSize;
    const nextPage =
      nextPageSize !== pageSize ? 1 : (pagination.current ?? currentPage);

    void loadDoctors(appliedFilters, nextPage, nextPageSize);
  }

  function reloadCurrentPage() {
    return loadDoctors(appliedFilters, currentPage, pageSize);
  }

  function reloadFirstPage() {
    setCurrentPage(1);
    return loadDoctors(appliedFilters, 1, pageSize);
  }

  return {
    doctors,
    loading,
    error,
    setError,
    currentPage,
    pageSize,
    total,
    appliedFilters,
    searchValue,
    setSearchValue,
    specialtyFilter,
    setSpecialtyFilter,
    statusFilter,
    setStatusFilter,
    experienceLevel,
    setExperienceLevel,
    experienceSort,
    setExperienceSort,
    applyFilters,
    resetFilters,
    handleTableChange,
    loadDoctors,
    reloadCurrentPage,
    reloadFirstPage,
  };
}
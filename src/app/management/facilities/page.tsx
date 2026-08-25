"use client";

import {
  useState,
} from "react";
import {
  Alert,
  Modal,
} from "antd";
import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import {
  createFacility,
  deleteFacility,
} from "@/management/features/facilities/facilities.api";
import type {
  Facility,
} from "@/management/features/facilities/facilities.types";
import {
  useFacilityAccess,
} from "@/hooks/facilities/useFacilityAccess";
import {
  useFacilities,
} from "@/hooks/facilities/useFacilities";
import {
  FacilityCreateModal,
  type FacilityFormValues,
} from "@/fe/components/facilities/FacilityCreateModal";
import {
  FacilityDeleteModal,
  type FacilityDeleteTarget,
} from "@/fe/components/facilities/FacilityDeleteModal";
import {
  FacilityDetailModal,
} from "@/fe/components/facilities/FacilityDetailModal";
import {
  FacilityFilters,
} from "@/fe/components/facilities/FacilityFilters";
import {
  FacilityTable,
} from "@/fe/components/facilities/FacilityTable";
import {
  FacilityUpdateModal,
} from "@/fe/components/facilities/FacilityUpdateModal";
import {
  getFacilityErrorMessage,
} from "@/fe/components/facilities/facility-form.shared";

export default function FacilityManagementPage() {
  const [
    modal,
    modalContextHolder,
  ] = Modal.useModal();

  const facilityAccess =
    useFacilityAccess();

  const {
    canViewAllFacilities,
    canManageOwnFacility,
    scopedFacilityId,
  } = facilityAccess;

  const facilityState =
    useFacilities({
      canViewAllFacilities,
      scopedFacilityId,
    });

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    detailFacility,
    setDetailFacility,
  ] = useState<
    Facility | null
  >(null);

  const [
    updateFacilityTarget,
    setUpdateFacilityTarget,
  ] = useState<
    Facility | null
  >(null);

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<FacilityDeleteTarget>(
      null,
    );

  const [
    deleteReason,
    setDeleteReason,
  ] = useState("");

  const [
    deleteTouched,
    setDeleteTouched,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  function canAccessFacility(
    facility: Facility,
  ) {
    if (
      canViewAllFacilities
    ) {
      return true;
    }

    return Boolean(
      canManageOwnFacility &&
      scopedFacilityId &&
      String(
        facility.id,
      ) ===
        String(
          scopedFacilityId,
        ),
    );
  }

  function openDetail(
    facility: Facility,
  ) {
    if (
      !canAccessFacility(
        facility,
      )
    ) {
      return;
    }

    setDetailFacility(
      facility,
    );
  }

  function openUpdate(
    facility: Facility,
  ) {
    if (
      !canAccessFacility(
        facility,
      )
    ) {
      return;
    }

    setUpdateFacilityTarget(
      facility,
    );
  }

  async function handleCreate(
    values: FacilityFormValues,
  ) {
    if (
      !canViewAllFacilities
    ) {
      return;
    }

    await createFacility({
      ...values,
    });

    facilityState.setCurrentPage(
      1,
    );

    await facilityState.reloadFacilities(
      1,
      facilityState.pageSize,
    );
  }

  function handleUpdated(
    updated: Facility,
  ) {
    facilityState.replaceFacility(
      updated,
    );

    setDetailFacility(
      (current) =>
        current?.id ===
        updated.id
          ? updated
          : current,
    );
  }

  function openDelete(
    facility: Facility,
  ) {
    if (
      !canViewAllFacilities
    ) {
      return;
    }

    setDeleteReason("");
    setDeleteTouched(false);

    setDeleteTarget({
      mode: "single",
      id: facility.id,
      name: facility.name,
    });
  }

  function closeDelete() {
    if (deleteLoading) {
      return;
    }

    setDeleteTarget(null);
    setDeleteReason("");
    setDeleteTouched(false);
  }

  async function confirmDelete() {
    if (
      !canViewAllFacilities ||
      !deleteTarget
    ) {
      return;
    }

    const reason =
      deleteReason.trim();

    if (!reason) {
      setDeleteTouched(true);

      return;
    }

    setDeleteLoading(true);
    facilityState.setTableLoading(
      true,
    );
    facilityState.setError(null);

    try {
      if (
        deleteTarget.mode !==
        "single"
      ) {
        return;
      }

      const deletedId =
        deleteTarget.id;

      await deleteFacility(
        deletedId,
        reason,
      );

      setDetailFacility(
        (current) =>
          current?.id ===
          deletedId
            ? null
            : current,
      );

      setUpdateFacilityTarget(
        (current) =>
          current?.id ===
          deletedId
            ? null
            : current,
      );

      const remaining =
        Math.max(
          0,
          facilityState.totalFacilities -
            1,
        );

      const lastPage =
        Math.max(
          1,
          Math.ceil(
            remaining /
              facilityState.pageSize,
          ),
        );

      const nextPage =
        Math.min(
          facilityState.currentPage,
          lastPage,
        );

      facilityState.setCurrentPage(
        nextPage,
      );

      setDeleteTarget(null);
      setDeleteReason("");
      setDeleteTouched(false);

      await facilityState.reloadFacilities(
        nextPage,
        facilityState.pageSize,
      );

      modal.success({
        title:
          "Xóa cơ sở thành công",
        content:
          "Cơ sở đã được xóa.",
        centered: true,
      });
    } catch (error) {
      const message =
        getFacilityErrorMessage(
          error,
        );

      facilityState.setError(
        message,
      );

      modal.error({
        title:
          "Không thể xóa cơ sở",
        content: message,
        centered: true,
      });
    } finally {
      setDeleteLoading(false);

      facilityState.setTableLoading(
        false,
      );
    }
  }

  return (
    <AdminLayout
      roles={[
        "super_admin",
        "admin",
      ]}
      permissions={[
        "user.view",
      ]}
    >
      {modalContextHolder}

      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý cơ sở
        </h1>

        <p className="mb-0 text-sm text-slate-500">
          {canViewAllFacilities
            ? "Quản lý thông tin, trạng thái và lịch hoạt động của các cơ sở khám."
            : "Xem thông tin và cập nhật trạng thái, lịch hoạt động của cơ sở được phân công."}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {facilityState.error ? (
          <Alert
            type="error"
            title={
              facilityState.error
            }
            showIcon
            closable
            onClose={() =>
              facilityState.setError(
                null,
              )
            }
          />
        ) : null}

        {canViewAllFacilities ? (
          <FacilityFilters
            query={
              facilityState.query
            }
            city={
              facilityState.cityFilter
            }
            status={
              facilityState.statusFilter
            }
            cityOptions={
              facilityState.cityOptions
            }
            onChange={
              facilityState.applyFilters
            }
          />
        ) : null}

        <FacilityTable
          facilities={
            facilityState.facilities
          }
          loading={
            facilityState.loading ||
            facilityState.tableLoading
          }
          currentPage={
            facilityState.currentPage
          }
          pageSize={
            facilityState.pageSize
          }
          total={
            facilityState.totalFacilities
          }
          isSuperAdmin={
            canViewAllFacilities
          }
          onView={
            openDetail
          }
          onEdit={
            openUpdate
          }
          onCreate={() =>
            setCreateOpen(true)
          }
          onPageChange={
            facilityState.changePage
          }
        />
      </div>

      {canViewAllFacilities ? (
        <FacilityCreateModal
          open={
            createOpen
          }
          onClose={() =>
            setCreateOpen(false)
          }
          onSubmit={
            handleCreate
          }
        />
      ) : null}

      <FacilityDetailModal
        open={
          Boolean(
            detailFacility,
          )
        }
        facility={
          detailFacility
        }
        onClose={() =>
          setDetailFacility(
            null,
          )
        }
      />

      <FacilityUpdateModal
        open={
          Boolean(
            updateFacilityTarget,
          )
        }
        facility={
          updateFacilityTarget
        }
        onClose={() =>
          setUpdateFacilityTarget(
            null,
          )
        }
        onUpdated={
          handleUpdated
        }
        /**
         * Admin chỉ được sửa:
         * - trạng thái hoạt động
         * - lịch hoạt động
         *
         * Super Admin vẫn full update.
         */
        limitedToStatusAndSchedule={
          !canViewAllFacilities
        }
      />

      {canViewAllFacilities ? (
        <FacilityDeleteModal
          target={
            deleteTarget
          }
          reason={
            deleteReason
          }
          reasonError={
            deleteTouched &&
            !deleteReason.trim()
          }
          loading={
            deleteLoading
          }
          onReasonChange={(
            value,
          ) => {
            setDeleteReason(
              value,
            );

            if (
              value.trim()
            ) {
              setDeleteTouched(
                false,
              );
            }
          }}
          onClose={
            closeDelete
          }
          onConfirm={
            confirmDelete
          }
        />
      ) : null}
    </AdminLayout>
  );
}

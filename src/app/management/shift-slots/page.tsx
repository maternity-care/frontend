"use client";

import {
  useState,
} from "react";
import {
  Alert,
  App,
} from "antd";
import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import {
  getShiftSlot,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlot,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  getShiftSlotErrorMessage,
} from "@/management/features/shift-slots/shift-slots.utils";
import {
  useShiftSlotAccess,
} from "@/hooks/shift-slots/useShiftSlotAccess";
import {
  useShiftSlotFacilities,
} from "@/hooks/shift-slots/useShiftSlotFacilities";
import {
  useShiftSlots,
} from "@/hooks/shift-slots/useShiftSlots";
import {
  ShiftSlotCreateModal,
} from "@/fe/components/shift-slots/ShiftSlotCreateModal";
import {
  ShiftSlotDeleteModal,
} from "@/fe/components/shift-slots/ShiftSlotDeleteModal";
import {
  ShiftSlotDetailModal,
} from "@/fe/components/shift-slots/ShiftSlotDetailModal";
import {
  ShiftSlotEditModal,
} from "@/fe/components/shift-slots/ShiftSlotEditModal";
import {
  ShiftSlotFilters,
} from "@/fe/components/shift-slots/ShiftSlotFilters";
import {
  ShiftSlotTable,
} from "@/fe/components/shift-slots/ShiftSlotTable";

export default function ShiftSlotsPage() {
  const {
    message: messageApi,
  } = App.useApp();

  const access =
    useShiftSlotAccess();

  const facilityState =
    useShiftSlotFacilities({
      canViewAllFacilities:
        access.canViewAllFacilities,
      canManageSlots:
        access.canManageSlots,
      scopedFacilityId:
        access.scopedFacilityId,
    });

  const slotState =
    useShiftSlots({
      canViewAllFacilities:
        access.canViewAllFacilities,
      scopedFacilityId:
        access.scopedFacilityId,
    });

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    editingSlot,
    setEditingSlot,
  ] = useState<
    ShiftSlot | null
  >(null);

  const [
    detailSlot,
    setDetailSlot,
  ] = useState<
    ShiftSlot | null
  >(null);

  const [
    deleteSlot,
    setDeleteSlot,
  ] = useState<
    ShiftSlot | null
  >(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const error =
    slotState.error ||
    facilityState.error;

  function clearError() {
    slotState.setError(
      null,
    );

    facilityState.setError(
      null,
    );
  }

  async function openDetail(
    slot: ShiftSlot,
  ) {
    if (
      !access.canViewAllFacilities &&
      String(
        slot.facilityId,
      ) !==
        access.scopedFacilityId
    ) {
      return;
    }

    setDetailSlot(
      slot,
    );

    setDetailLoading(
      true,
    );

    try {
      const detail =
        await getShiftSlot(
          slot.id,
        );

      if (
        !access.canViewAllFacilities &&
        String(
          detail.facilityId,
        ) !==
          access.scopedFacilityId
      ) {
        throw new Error(
          "Bạn không có quyền xem khung ca của cơ sở này.",
        );
      }

      setDetailSlot(
        detail,
      );
    } catch (
      detailError
    ) {
      const message =
        getShiftSlotErrorMessage(
          detailError,
        );

      slotState.setError(
        message,
      );

      messageApi.error(
        message,
      );
    } finally {
      setDetailLoading(
        false,
      );
    }
  }

  function handleCreated(
    _slot: ShiftSlot,
  ) {
    slotState.setCurrentPage(
      1,
    );

    slotState.refreshSlots();
  }

  function handleUpdated(
    slot: ShiftSlot,
  ) {
    setEditingSlot(
      null,
    );

    setDetailSlot(
      (current) =>
        current?.id ===
        slot.id
          ? slot
          : current,
    );

    slotState.replaceSlot(
      slot,
    );

    slotState.refreshSlots();
  }

  function openDelete(
    slot: ShiftSlot,
  ) {
    if (
      !access.canManageSlot(
        slot,
      )
    ) {
      return;
    }

    setDeleteSlot(
      slot,
    );
  }

  function handleDeleted(
    slotId: string,
  ) {
    setDeleteSlot(
      null,
    );

    setDetailSlot(
      (current) =>
        current?.id ===
        slotId
          ? null
          : current,
    );

    setEditingSlot(
      (current) =>
        current?.id ===
        slotId
          ? null
          : current,
    );

    slotState.handleDeleted();
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý khung ca
        </h1>

        <p className="mb-0 text-sm text-slate-500">
          Quản lý các khung
          thời gian làm việc
          theo từng cơ sở.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={
              clearError
            }
          />
        ) : null}

        <ShiftSlotFilters
          canViewAllFacilities={
            access.canViewAllFacilities
          }
          facilities={
            facilityState.facilities
          }
          searchInput={
            slotState.searchInput
          }
          facilityFilter={
            slotState.facilityFilter
          }
          statusFilter={
            slotState.statusFilter
          }
          onSearchChange={
            slotState.setSearchInput
          }
          onFacilityChange={(
            value,
          ) => {
            slotState.setFacilityFilter(
              value,
            );

            slotState.setCurrentPage(
              1,
            );
          }}
          onStatusChange={(
            value,
          ) => {
            slotState.setStatusFilter(
              value,
            );

            slotState.setCurrentPage(
              1,
            );
          }}
          onReset={
            slotState.resetFilters
          }
        />

        <ShiftSlotTable
          slots={
            slotState.slots
          }
          loading={
            slotState.loading
          }
          currentPage={
            slotState.currentPage
          }
          pageSize={
            slotState.pageSize
          }
          total={
            slotState.totalSlots
          }
          canManageSlots={
            access.canManageSlots
          }
          canManageSlot={
            access.canManageSlot
          }
          facilityById={
            facilityState.facilityById
          }
          onView={(slot) => {
            void openDetail(
              slot,
            );
          }}
          onEdit={
            setEditingSlot
          }
          onDelete={
            openDelete
          }
          onCreate={() =>
            setCreateOpen(
              true,
            )
          }
          onPageChange={
            slotState.changePage
          }
        />
      </div>

      {access.canManageSlots ? (
        <>
          <ShiftSlotCreateModal
            open={
              createOpen
            }
            facilities={
              facilityState.managedFacilities
            }
            onClose={() =>
              setCreateOpen(
                false,
              )
            }
            onCreated={
              handleCreated
            }
          />

          <ShiftSlotEditModal
            open={Boolean(
              editingSlot,
            )}
            slot={
              editingSlot
            }
            facilities={
              facilityState.managedFacilities
            }
            onClose={() =>
              setEditingSlot(
                null,
              )
            }
            onUpdated={
              handleUpdated
            }
          />

          <ShiftSlotDeleteModal
            open={Boolean(
              deleteSlot,
            )}
            slot={
              deleteSlot
            }
            facility={
              deleteSlot
                ? facilityState.facilityById.get(
                    deleteSlot.facilityId,
                  )
                : undefined
            }
            onClose={() =>
              setDeleteSlot(
                null,
              )
            }
            onDeleted={
              handleDeleted
            }
          />
        </>
      ) : null}

      <ShiftSlotDetailModal
        open={Boolean(
          detailSlot,
        )}
        slot={
          detailSlot
        }
        loading={
          detailLoading
        }
        canManage={
          detailSlot
            ? access.canManageSlot(
                detailSlot,
              )
            : false
        }
        onClose={() =>
          setDetailSlot(
            null,
          )
        }
        onEdit={(slot) => {
          if (
            !access.canManageSlot(
              slot,
            )
          ) {
            return;
          }

          setDetailSlot(
            null,
          );

          setEditingSlot(
            slot,
          );
        }}
        onDelete={(slot) => {
          if (
            !access.canManageSlot(
              slot,
            )
          ) {
            return;
          }

          setDetailSlot(
            null,
          );

          setDeleteSlot(
            slot,
          );
        }}
      />
    </AdminLayout>
  );
}

"use client";

import { useState } from "react";
import { Alert, Modal } from "antd";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import {
  createFacility,
  deleteFacilities,
  deleteFacility,
} from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import { useAuthStore } from "@/features/auth/auth.store";
import { useFacilities } from "@/hooks/facilities/useFacilities";
import {
  FacilityCreateModal,
  type FacilityFormValues,
} from "@/fe/components/facilities/FacilityCreateModal";
import {
  FacilityDeleteModal,
  type FacilityDeleteTarget,
} from "@/fe/components/facilities/FacilityDeleteModal";
import { FacilityDetailModal } from "@/fe/components/facilities/FacilityDetailModal";
import { FacilityFilters } from "@/fe/components/facilities/FacilityFilters";
import { FacilityTable } from "@/fe/components/facilities/FacilityTable";
import { FacilityUpdateModal } from "@/fe/components/facilities/FacilityUpdateModal";
import { getFacilityErrorMessage } from "@/fe/components/facilities/facility-form.shared";


export default function FacilityManagementPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const isSuperAdmin = useAuthStore((state) =>
    state.roles.includes("super_admin"),
  );
  const facilityState = useFacilities();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [updateFacilityTarget, setUpdateFacilityTarget] =
    useState<Facility | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<FacilityDeleteTarget>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteTouched, setDeleteTouched] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleCreate(values: FacilityFormValues) {
    await createFacility({ ...values });
    facilityState.setCurrentPage(1);
    await facilityState.reloadFacilities(1, facilityState.pageSize);
  }

  function handleUpdated(updated: Facility) {
    facilityState.replaceFacility(updated);
    setDetailFacility((current) =>
      current?.id === updated.id ? updated : current,
    );
  }

  function openDelete(facility: Facility) {
    setDeleteReason("");
    setDeleteTouched(false);
    setDeleteTarget({
      mode: "single",
      id: facility.id,
      name: facility.name,
    });
  }

  function openDeleteSelected() {
    if (!facilityState.selectedFacilityIds.length) return;

    setDeleteReason("");
    setDeleteTouched(false);
    setDeleteTarget({
      mode: "selected",
      ids: facilityState.selectedFacilityIds,
      count: facilityState.selectedFacilityIds.length,
    });
  }

  function closeDelete() {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteReason("");
    setDeleteTouched(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const reason = deleteReason.trim();
    if (!reason) {
      setDeleteTouched(true);
      return;
    }

    setDeleteLoading(true);
    facilityState.setTableLoading(true);
    facilityState.setError(null);

    try {
      const deletedIds =
        deleteTarget.mode === "single"
          ? [deleteTarget.id]
          : deleteTarget.ids;

      if (deleteTarget.mode === "single") {
        await deleteFacility(deleteTarget.id, reason);
      } else {
        await deleteFacilities(deleteTarget.ids, reason);
      }

      setDetailFacility((current) =>
        current && deletedIds.includes(current.id) ? null : current,
      );
      setUpdateFacilityTarget((current) =>
        current && deletedIds.includes(current.id) ? null : current,
      );

      facilityState.setSelectedFacilityIds([]);

      const remaining = Math.max(
        0,
        facilityState.totalFacilities - deletedIds.length,
      );
      const lastPage = Math.max(
        1,
        Math.ceil(remaining / facilityState.pageSize),
      );
      const nextPage = Math.min(facilityState.currentPage, lastPage);

      facilityState.setCurrentPage(nextPage);
      setDeleteTarget(null);
      setDeleteReason("");
      setDeleteTouched(false);

      await facilityState.reloadFacilities(nextPage, facilityState.pageSize);

      modal.success({
        title: "Xóa cơ sở thành công",
        content:
          deletedIds.length > 1
            ? "Các cơ sở đã chọn đã được xóa."
            : "Cơ sở đã được xóa.",
        centered: true,
      });
    } catch (error) {
      const message = getFacilityErrorMessage(error);
      facilityState.setError(message);
      modal.error({
        title: "Không thể xóa cơ sở",
        content: message,
        centered: true,
      });
    } finally {
      setDeleteLoading(false);
      facilityState.setTableLoading(false);
    }
  }

  return (
    <AdminLayout roles={["super_admin", "admin"]} permissions={["user.view"]}>
      {modalContextHolder}

      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý cơ sở
        </h1>
        <p className="mb-0 text-sm text-slate-500">
          Quản lý thông tin, trạng thái và lịch hoạt động của các cơ sở khám.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {facilityState.error ? (
          <Alert
            type="error"
            title={facilityState.error}
            showIcon
            closable
            onClose={() => facilityState.setError(null)}
          />
        ) : null}

        <FacilityFilters
          query={facilityState.query}
          city={facilityState.cityFilter}
          status={facilityState.statusFilter}
          cityOptions={facilityState.cityOptions}
          onChange={facilityState.applyFilters}
        />

        <FacilityTable
          facilities={facilityState.facilities}
          loading={facilityState.loading || facilityState.tableLoading}
          currentPage={facilityState.currentPage}
          pageSize={facilityState.pageSize}
          total={facilityState.totalFacilities}
          isSuperAdmin={isSuperAdmin}
          selectedIds={facilityState.selectedFacilityIds}
          onSelectedIdsChange={facilityState.setSelectedFacilityIds}
          onView={setDetailFacility}
          onEdit={setUpdateFacilityTarget}
          onDelete={openDelete}
          onDeleteSelected={openDeleteSelected}
          onCreate={() => setCreateOpen(true)}
          onPageChange={facilityState.changePage}
        />
      </div>

      <FacilityCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <FacilityDetailModal
        open={Boolean(detailFacility)}
        facility={detailFacility}
        onClose={() => setDetailFacility(null)}
      />

      <FacilityUpdateModal
        open={Boolean(updateFacilityTarget)}
        facility={updateFacilityTarget}
        onClose={() => setUpdateFacilityTarget(null)}
        onUpdated={handleUpdated}
      />

      <FacilityDeleteModal
        target={deleteTarget}
        reason={deleteReason}
        reasonError={deleteTouched && !deleteReason.trim()}
        loading={deleteLoading}
        onReasonChange={(value) => {
          setDeleteReason(value);
          if (value.trim()) setDeleteTouched(false);
        }}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}

"use client";

import { useState } from "react";
import { Alert, Modal } from "antd";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { deleteDoctor } from "@/management/features/doctors/doctors.api";
import type { Doctor } from "@/management/features/doctors/doctors.types";
import {
  doctorBelongsToFacility,
  getDoctorErrorMessage,
} from "@/management/features/doctors/doctors.utils";
import { DoctorCreateModal } from "@/fe/components/doctors/DoctorCreateModal";
import { DoctorDeleteModal } from "@/fe/components/doctors/DoctorDeleteModal";
import { DoctorDetailModal } from "@/fe/components/doctors/DoctorDetailModal";
import { DoctorEditModal } from "@/fe/components/doctors/DoctorEditModal";
import { DoctorFilters } from "@/fe/components/doctors/DoctorFilters";
import { DoctorTable } from "@/fe/components/doctors/DoctorTable";
import { useDoctorAccess } from "@/hooks/doctors/useDoctorAccess";
import { useDoctorDisplayLookups } from "@/hooks/doctors/useDoctorLookups";
import { useDoctors } from "@/hooks/doctors/useDoctors";

export default function DoctorManagementPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const { canViewAllFacilities, canManageDoctors, scopedFacilityId } =
    useDoctorAccess();

  const doctorState = useDoctors({
    canViewAllFacilities,
    scopedFacilityId,
  });

  const { facilityNameById, roomTypeNameById } = useDoctorDisplayLookups({
    canViewAllFacilities,
    scopedFacilityId,
  });

  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function canViewDoctor(doctor: Doctor) {
    return (
      canViewAllFacilities || doctorBelongsToFacility(doctor, scopedFacilityId)
    );
  }

  function canManageDoctor(doctor: Doctor) {
    return (
      canManageDoctors && doctorBelongsToFacility(doctor, scopedFacilityId)
    );
  }

  function openDetail(doctor: Doctor) {
    if (canViewDoctor(doctor)) setDetailDoctor(doctor);
  }

  function openCreate() {
    if (!canManageDoctors) return;
    setEditingDoctor(null);
    setCreateModalOpen(true);
  }

  function openEdit(doctor: Doctor) {
    if (!canManageDoctor(doctor)) return;
    setCreateModalOpen(false);
    setDetailDoctor(null);
    setEditingDoctor(doctor);
  }

  async function confirmDelete() {
    if (!deletingDoctor || !canManageDoctor(deletingDoctor)) return;

    const doctor = deletingDoctor;
    setDeleteLoading(true);
    doctorState.setError(null);

    try {
      await deleteDoctor(doctor.id);
      setDetailDoctor((current) => (current?.id === doctor.id ? null : current));
      setDeletingDoctor(null);

      const nextPage =
        doctorState.doctors.length === 1 && doctorState.currentPage > 1
          ? doctorState.currentPage - 1
          : doctorState.currentPage;

      await doctorState.loadDoctors(
        doctorState.appliedFilters,
        nextPage,
        doctorState.pageSize,
      );

      modal.success({
        centered: true,
        title: "Xóa bác sĩ thành công",
        content: "Hồ sơ bác sĩ đã được xóa khỏi danh sách.",
        okText: "Đóng",
      });
    } catch (error) {
      const message = getDoctorErrorMessage(error);
      doctorState.setError(message);
      modal.error({
        centered: true,
        title: "Không thể xóa bác sĩ",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <AdminLayout roles={["super_admin", "admin"]} permissions={["doctor.view"]}>
      {modalContextHolder}

      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý bác sĩ
        </h1>
        <p className="mb-0 text-sm text-slate-500">
          Quản lý hồ sơ chuyên môn, giấy phép hành nghề và trạng thái bác sĩ.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {doctorState.error ? (
          <Alert
            type="error"
            title={doctorState.error}
            showIcon
            closable
            onClose={() => doctorState.setError(null)}
          />
        ) : null}

        <DoctorFilters
          searchValue={doctorState.searchValue}
          specialty={doctorState.specialtyFilter}
          status={doctorState.statusFilter}
          experienceLevel={doctorState.experienceLevel}
          experienceSort={doctorState.experienceSort}
          onSearchValueChange={doctorState.setSearchValue}
          onSpecialtyChange={doctorState.setSpecialtyFilter}
          onStatusChange={doctorState.setStatusFilter}
          onExperienceLevelChange={doctorState.setExperienceLevel}
          onExperienceSortChange={doctorState.setExperienceSort}
          onApply={doctorState.applyFilters}
          onReset={doctorState.resetFilters}
        />

        <DoctorTable
          doctors={doctorState.doctors}
          loading={doctorState.loading}
          currentPage={doctorState.currentPage}
          pageSize={doctorState.pageSize}
          total={doctorState.total}
          canManageDoctors={canManageDoctors}
          canManageDoctor={canManageDoctor}
          onView={openDetail}
          onEdit={openEdit}
          onDelete={setDeletingDoctor}
          onCreate={openCreate}
          onChange={doctorState.handleTableChange}
        />
      </div>

      {canManageDoctors ? (
        <>
          <DoctorCreateModal
            open={createModalOpen}
            allowedFacilityId={scopedFacilityId}
            onClose={() => setCreateModalOpen(false)}
            onCreated={() => {
              setCreateModalOpen(false);
              void doctorState.reloadFirstPage();
            }}
          />

          <DoctorEditModal
            open={Boolean(editingDoctor)}
            doctor={editingDoctor}
            allowedFacilityId={scopedFacilityId}
            onClose={() => setEditingDoctor(null)}
            onUpdated={() => {
              setEditingDoctor(null);
              setDetailDoctor(null);
              void doctorState.reloadCurrentPage();
            }}
          />
        </>
      ) : null}

      <DoctorDetailModal
        open={Boolean(detailDoctor)}
        doctor={detailDoctor}
        canManage={detailDoctor ? canManageDoctor(detailDoctor) : false}
        allowedFacilityId={canViewAllFacilities ? undefined : scopedFacilityId}
        facilityNameById={facilityNameById}
        roomTypeNameById={roomTypeNameById}
        onClose={() => setDetailDoctor(null)}
        onEdit={openEdit}
        onError={doctorState.setError}
      />

      <DoctorDeleteModal
        doctor={deletingDoctor}
        open={canManageDoctors && Boolean(deletingDoctor)}
        loading={deleteLoading}
        onCancel={() => setDeletingDoctor(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AdminLayout>
  );
}
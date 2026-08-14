"use client";

import { useEffect, useState } from "react";
import { Alert, Modal } from "antd";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import {
  checkDoctorShiftConflicts,
  deleteDoctorShift,
  getDoctorShift,
  updateDoctorShift,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import {
  getDoctorShiftErrorMessage,
  readDoctorShiftConflictResponse,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";
import { useDoctorShiftAccess } from "@/hooks/doctor-shifts/useDoctorShiftAccess";
import { useDoctorShiftResources } from "@/hooks/doctor-shifts/useDoctorShiftResources";
import { useDoctorShiftView } from "@/hooks/doctor-shifts/useDoctorShiftView";
import { DoctorShiftToolbar } from "@/fe/components/doctor-shifts/DoctorShiftToolbar";
import { DoctorShiftMonthView } from "@/fe/components/doctor-shifts/DoctorShiftMonthView";
import { DoctorShiftWeekView } from "@/fe/components/doctor-shifts/DoctorShiftWeekView";
import { DoctorShiftDayView } from "@/fe/components/doctor-shifts/DoctorShiftDayView";
import { DoctorShiftDeleteModal } from "@/fe/components/doctor-shifts/DoctorShiftDeleteModal";
import { DoctorShiftCreateModal } from "@/fe/components/doctor-shifts/DoctorShiftCreateModal";
import { DoctorShiftEditModal } from "@/fe/components/doctor-shifts/DoctorShiftEditModal";
import { DoctorShiftDetailModal } from "@/fe/components/doctor-shifts/DoctorShiftDetailModal";
import { DoctorShiftBulkGenerateModal } from "@/fe/components/doctor-shifts/DoctorShiftBulkGenerateModal";
import { DoctorShiftWeeklyUpdateModal } from "@/fe/components/doctor-shifts/DoctorShiftWeeklyUpdateModal";

export default function DoctorShiftPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const access = useDoctorShiftAccess();
  const resources = useDoctorShiftResources(access);
  const view = useDoctorShiftView({
    shifts: resources.visibleShifts,
    facilityById: resources.facilityById,
    canViewAllFacilities: access.canViewAllFacilities,
  });

  const {
    setDoctorFilter,
    setFacilityFilter,
    setRoomFilter,
  } = view;

  const [detailShift, setDetailShift] = useState<DoctorShiftItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [weeklyUpdateOpen, setWeeklyUpdateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<DoctorShiftItem | null>(null);
  const [deletingShift, setDeletingShift] = useState<DoctorShiftItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCreateOpen(false);
      setBulkOpen(false);
      setWeeklyUpdateOpen(false);
      setEditingShift(null);
      setDeletingShift(null);
      setDetailShift(null);
      setDeleteReason("");
      setFacilityFilter(undefined);
      setRoomFilter(undefined);
      setDoctorFilter(undefined);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    access.canViewAllFacilities,
    access.doctorId,
    access.facilityId,
    access.isDoctorViewer,
    access.staffId,
    setDoctorFilter,
    setFacilityFilter,
    setRoomFilter,
  ]);

  const canOpenManagementForms =
    resources.managedFacilities.length > 0 &&
    resources.managedRooms.length > 0 &&
    resources.managedDoctors.length > 0;

  function openCreate() {
    if (access.canManage && access.managedFacilityId) setCreateOpen(true);
  }

  function openEdit(shift: DoctorShiftItem) {
    if (access.canManageShift(shift)) setEditingShift(shift);
  }

  function openDelete(shift: DoctorShiftItem) {
    if (!access.canManageShift(shift)) return;
    setDeletingShift(shift);
    setDeleteReason("");
  }

  function closeDelete() {
    if (deleteLoading) return;
    setDeletingShift(null);
    setDeleteReason("");
  }

  function handleCreated(createdShifts: DoctorShiftItem[]) {
    resources.setShifts((current) => [...current, ...createdShifts]);
    view.setSelectedDate(createdShifts[0]?.shiftDate ?? view.selectedDate);
  }

  function handleUpdated(updatedShift: DoctorShiftItem) {
    resources.setShifts((current) =>
      current.map((shift) =>
        shift.id === updatedShift.id ? updatedShift : shift,
      ),
    );
    setDetailShift((current) =>
      current?.id === updatedShift.id ? updatedShift : current,
    );
  }

  async function handleWeekChanged({ fromDate }: { fromDate: string; toDate: string }) {
    await resources.reloadManagedShifts();
    view.setSelectedDate(fromDate);
    view.setViewMode("week");
  }

  async function openDetail(shift: DoctorShiftItem) {
    if (access.isDoctorViewer && !access.isOwnShift(shift)) return;
    setDetailShift(shift);

    if (access.isDoctorViewer) return;

    setDetailLoading(true);
    try {
      setDetailShift(await getDoctorShift(shift.id));
    } catch (error) {
      resources.setError(getDoctorShiftErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }

  async function assignDoctor(doctorId: string) {
    if (!detailShift || !access.canManageShift(detailShift)) return;

    setDetailLoading(true);
    resources.setError(null);

    try {
      const doctor = resources.doctors.find((item) => item.id === doctorId);
      if (!doctor?.staffId || !doctor.roleId) {
        throw new Error("Bác sĩ chưa có staffId hợp lệ.");
      }
      if (
        !doctor.facilityIds.some(
          (facilityId) => String(facilityId) === access.managedFacilityId,
        )
      ) {
        throw new Error("Bác sĩ không thuộc cơ sở bạn đang quản lý.");
      }

      const conflictRaw = await checkDoctorShiftConflicts({
        doctorId,
        staffId: doctor.staffId,
        roleId: doctor.roleId,
        facilityId: detailShift.facilityId,
        roomId: detailShift.roomId,
        slotId: detailShift.slotId,
        shiftDate: detailShift.shiftDate,
        note: detailShift.note,
        excludeShiftId: detailShift.id,
      });
      const conflict = readDoctorShiftConflictResponse(conflictRaw);
      if (conflict.hasConflict) {
        throw new Error(conflict.message || "Bác sĩ bị trùng ca trực.");
      }

      const response = await updateDoctorShift(detailShift.id, {
        doctorId,
        staffId: doctor.staffId,
        roleId: doctor.roleId,
        facilityId: detailShift.facilityId,
        roomId: detailShift.roomId,
        slotId: detailShift.slotId,
        shiftDate: detailShift.shiftDate,
        maxAppointments: detailShift.maxAppointments,
        note: detailShift.note,
      });

      let updatedShift: DoctorShiftItem;
      try {
        const detail = await getDoctorShift(response.data.id || detailShift.id);
        updatedShift = {
          ...detailShift,
          ...response.data,
          ...detail,
          doctorId,
          staffId: doctor.staffId,
          roleId: doctor.roleId,
          staffName: detail.staffName || response.data.staffName || doctor.name,
          roleName: detail.roleName || response.data.roleName || "Bác sĩ",
          doctorName: detail.doctorName || response.data.doctorName || doctor.name,
          doctorTitle: detail.doctorTitle || response.data.doctorTitle || doctor.title,
          doctorSpecialty:
            detail.doctorSpecialty ||
            response.data.doctorSpecialty ||
            doctor.specialty,
          note: detail.note || response.data.note || detailShift.note,
        };
      } catch {
        updatedShift = {
          ...detailShift,
          ...response.data,
          id: response.data.id || detailShift.id,
          doctorId,
          staffId: doctor.staffId,
          roleId: doctor.roleId,
          staffName: response.data.staffName || doctor.name,
          roleName: response.data.roleName || "Bác sĩ",
          doctorName: response.data.doctorName || doctor.name,
          doctorTitle: response.data.doctorTitle || doctor.title,
          doctorSpecialty: response.data.doctorSpecialty || doctor.specialty,
          note: response.data.note || detailShift.note,
        };
      }

      handleUpdated(updatedShift);
      setDetailShift(updatedShift);
      modal.success({
        centered: true,
        title: "Cập nhật ca trực thành công",
        content: "Bác sĩ phụ trách đã được cập nhật.",
        okText: "Đóng",
      });
    } catch (error) {
      const message = getDoctorShiftErrorMessage(error);
      resources.setError(message);
      modal.error({
        centered: true,
        title: "Không thể cập nhật ca trực",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingShift || !access.canManageShift(deletingShift)) return;
    const reason = deleteReason.trim();
    if (!reason) {
      resources.setError("Vui lòng nhập lý do xóa ca trực.");
      return;
    }

    setDeleteLoading(true);
    resources.setError(null);
    const shift = deletingShift;

    try {
      await deleteDoctorShift(shift.id, reason);
      resources.setShifts((current) =>
        current.filter((item) => item.id !== shift.id),
      );
      setDetailShift((current) => (current?.id === shift.id ? null : current));
      setDeletingShift(null);
      setDeleteReason("");
      modal.success({
        centered: true,
        title: "Xóa ca trực thành công",
        content: "Ca trực đã được xóa khỏi hệ thống.",
        okText: "Đóng",
      });
    } catch (error) {
      const message = getDoctorShiftErrorMessage(error);
      resources.setError(message);
      modal.error({
        centered: true,
        title: "Không thể xóa ca trực",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <AdminLayout>
      {modalContextHolder}

      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý ca trực
        </h1>
        <p className="mb-0 text-sm text-slate-500">
          Quản lý ca trực theo ngày, tuần, tháng và phân công bác sĩ.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {resources.error ? (
          <Alert
            type="error"
            title={resources.error}
            showIcon
            closable
            onClose={() => resources.setError(null)}
          />
        ) : null}

        <DoctorShiftToolbar
          viewMode={view.viewMode}
          selectedDate={view.selectedDate}
          periodStartDate={view.periodStartDate}
          keyword={view.keyword}
          facilityFilter={view.facilityFilter}
          roomFilter={view.roomFilter}
          doctorFilter={view.doctorFilter}
          statusFilter={view.statusFilter}
          canManageShifts={access.canManage}
          canViewAllFacilities={access.canViewAllFacilities}
          isDoctorViewer={access.isDoctorViewer}
          facilities={resources.visibleFacilities}
          rooms={resources.visibleRooms}
          doctors={resources.visibleDoctors}
          canOpenManagementForms={canOpenManagementForms}
          onMovePeriod={view.movePeriod}
          onSelectedDateChange={view.setSelectedDate}
          onViewModeChange={view.setViewMode}
          onPeriodStartChange={view.handlePeriodStartChange}
          onKeywordChange={view.setKeyword}
          onFacilityFilterChange={(value) => {
            view.setFacilityFilter(value);
            setRoomFilter(undefined);
          }}
          onRoomFilterChange={view.setRoomFilter}
          onDoctorFilterChange={view.setDoctorFilter}
          onStatusFilterChange={view.setStatusFilter}
          onResetFilters={view.resetFilters}
          onOpenWeeklyUpdate={() => setWeeklyUpdateOpen(true)}
          onOpenBulkGenerate={() => setBulkOpen(true)}
          onOpenCreate={openCreate}
        />

        {view.viewMode === "month" ? (
          <DoctorShiftMonthView
            selectedDate={view.selectedDate}
            monthGrid={view.monthGrid}
            shifts={view.filteredShifts}
            onOpenDay={(dateKey) => {
              view.setSelectedDate(dateKey);
              view.setViewMode("day");
            }}
            onOpenDetail={(shift) => void openDetail(shift)}
          />
        ) : view.viewMode === "week" ? (
          <DoctorShiftWeekView
            weekDays={view.weekDays}
            rows={view.weeklyScheduleRows}
            total={view.sortedScopedShifts.length}
            facilityFilter={view.facilityFilter}
            canManage={access.canManage}
            doctorById={resources.doctorById}
            roomById={resources.roomById}
            onOpenDay={(dateKey) => {
              view.setSelectedDate(dateKey);
              view.setViewMode("day");
            }}
            onOpenDetail={(shift) => void openDetail(shift)}
            onCreate={openCreate}
          />
        ) : (
          <DoctorShiftDayView
            selectedDate={view.selectedDate}
            shifts={view.dayTableShifts}
            groupMeta={view.dayShiftGroupMeta}
            loading={resources.loading}
            total={view.sortedScopedShifts.length}
            canManage={access.canManage}
            doctorById={resources.doctorById}
            facilityById={resources.facilityById}
            roomById={resources.roomById}
            canManageShift={access.canManageShift}
            onOpenDetail={(shift) => void openDetail(shift)}
            onEdit={openEdit}
            onDelete={openDelete}
            onCreate={openCreate}
          />
        )}
      </div>

      {access.canManage ? (
        <>
          <DoctorShiftCreateModal
            open={createOpen}
            shifts={resources.shifts}
            facilities={resources.managedFacilities}
            rooms={resources.managedRooms}
            doctors={resources.managedDoctors}
            onClose={() => setCreateOpen(false)}
            onCreated={handleCreated}
          />

          <DoctorShiftBulkGenerateModal
            open={bulkOpen}
            facilities={resources.managedFacilities}
            rooms={resources.managedRooms}
            doctors={resources.managedDoctors}
            onClose={() => setBulkOpen(false)}
            onGenerated={handleWeekChanged}
          />

          <DoctorShiftWeeklyUpdateModal
            open={weeklyUpdateOpen}
            facilities={resources.managedFacilities}
            rooms={resources.managedRooms}
            doctors={resources.managedDoctors}
            onClose={() => setWeeklyUpdateOpen(false)}
            onApplied={handleWeekChanged}
          />

          <DoctorShiftEditModal
            open={Boolean(editingShift)}
            shift={editingShift}
            shifts={resources.shifts}
            facilities={resources.managedFacilities}
            rooms={resources.managedRooms}
            doctors={resources.managedDoctors}
            onClose={() => setEditingShift(null)}
            onUpdated={handleUpdated}
          />
        </>
      ) : null}

      <DoctorShiftDetailModal
        open={Boolean(detailShift)}
        shift={detailShift}
        loading={detailLoading}
        shifts={resources.shifts}
        facilities={resources.visibleFacilities}
        rooms={resources.visibleRooms}
        doctors={resources.visibleDoctors}
        canManage={detailShift ? access.canManageShift(detailShift) : false}
        onClose={() => setDetailShift(null)}
        onEdit={(shift) => {
          if (!access.canManageShift(shift)) return;
          setDetailShift(null);
          openEdit(shift);
        }}
        onDelete={openDelete}
        onAssignDoctor={assignDoctor}
      />

      {access.canManage ? (
        <DoctorShiftDeleteModal
          shift={deletingShift}
          reason={deleteReason}
          loading={deleteLoading}
          onReasonChange={setDeleteReason}
          onClose={closeDelete}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </AdminLayout>
  );
}
"use client";

import {
  Suspense,
  useState,
} from "react";
import {
  Alert,
} from "antd";
import {
  useSearchParams,
} from "next/navigation";
import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import type {
  ClinicRoom,
} from "@/management/features/rooms/rooms.types";
import {
  useRoomAccess,
} from "@/hooks/rooms/useRoomAccess";
import {
  useRoomLookups,
} from "@/hooks/rooms/useRoomLookups";
import {
  useRooms,
} from "@/hooks/rooms/useRooms";
import {
  RoomBulkCreateModal,
} from "@/fe/components/rooms/RoomBulkCreateModal";
import {
  RoomDetailModal,
} from "@/fe/components/rooms/RoomDetailModal";
import {
  RoomEditModal,
} from "@/fe/components/rooms/RoomEditModal";
import {
  RoomFilters,
} from "@/fe/components/rooms/RoomFilters";
import {
  RoomTable,
} from "@/fe/components/rooms/RoomTable";
import {
  RoomTypeManagementModal,
} from "@/fe/components/rooms/RoomTypeManagementModal";

function ClinicRoomManagementContent() {
  const searchParams =
    useSearchParams();

  const access =
    useRoomAccess();

  const requestedFacilityFilter =
    searchParams.get(
      "facilityId",
    ) || undefined;

  const lookups =
    useRoomLookups({
      canViewAllFacilities:
        access.canViewAllFacilities,
      canManageRooms:
        access.canManageRooms,
      scopedFacilityId:
        access.scopedFacilityId,
    });

  const roomState =
    useRooms({
      canViewAllFacilities:
        access.canViewAllFacilities,
      scopedFacilityId:
        access.scopedFacilityId,
      initialFacilityFilter:
        requestedFacilityFilter,
    });

  const [
    editingRoom,
    setEditingRoom,
  ] = useState<
    ClinicRoom | null
  >(null);
  const [
    detailRoomId,
    setDetailRoomId,
  ] = useState<
    string | null
  >(null);
  const [
    detailInitialRoom,
    setDetailInitialRoom,
  ] = useState<
    ClinicRoom | null
  >(null);
  const [
    bulkOpen,
    setBulkOpen,
  ] = useState(false);
  const [
    roomTypesOpen,
    setRoomTypesOpen,
  ] = useState(false);

  const error =
    roomState.error ||
    lookups.error;

  function clearError() {
    roomState.setError(null);
    lookups.setError(null);
  }

  function openDetail(
    room: ClinicRoom,
  ) {
    if (
      !access.canViewAllFacilities &&
      String(
        room.facilityId,
      ) !==
        access.scopedFacilityId
    ) {
      return;
    }

    setDetailInitialRoom(
      room,
    );
    setDetailRoomId(
      room.id,
    );
  }

  function handleUpdated(
    room: ClinicRoom,
  ) {
    setEditingRoom(null);
    setDetailInitialRoom(
      room,
    );
    roomState.replaceRoom(
      room,
    );
    roomState.refreshRooms();
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
      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý phòng
        </h1>
        <p className="mb-0 text-sm text-slate-500">
          Quản lý phòng, loại phòng
          và dữ liệu phòng theo từng
          cơ sở.
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

        <RoomFilters
          canViewAllFacilities={
            access.canViewAllFacilities
          }
          facilities={
            lookups.facilities
          }
          roomTypes={
            lookups.roomTypes
          }
          searchInput={
            roomState.searchInput
          }
          facilityFilter={
            roomState.facilityFilter
          }
          floorFilter={
            roomState.floorFilter
          }
          roomTypeIdFilter={
            roomState.roomTypeIdFilter
          }
          statusFilter={
            roomState.statusFilter
          }
          onSearchChange={
            roomState.setSearchInput
          }
          onFacilityChange={(
            value,
          ) => {
            roomState.setFacilityFilter(
              value,
            );
            roomState.setCurrentPage(
              1,
            );
          }}
          onFloorChange={(
            value,
          ) => {
            roomState.setFloorFilter(
              value,
            );
            roomState.setCurrentPage(
              1,
            );
          }}
          onRoomTypeChange={(
            value,
          ) => {
            roomState.setRoomTypeIdFilter(
              value,
            );
            roomState.setCurrentPage(
              1,
            );
          }}
          onStatusChange={(
            value,
          ) => {
            roomState.setStatusFilter(
              value,
            );
            roomState.setCurrentPage(
              1,
            );
          }}
          onReset={
            roomState.resetFilters
          }
        />

        <RoomTable
          rooms={
            roomState.tableRooms
          }
          loading={
            roomState.loading
          }
          currentPage={
            roomState.currentPage
          }
          pageSize={
            roomState.pageSize
          }
          total={
            roomState.totalRooms
          }
          canManageRooms={
            access.canManageRooms
          }
          canManageRoom={
            access.canManageRoom
          }
          onView={
            openDetail
          }
          onEdit={
            setEditingRoom
          }
          onOpenRoomTypes={() =>
            setRoomTypesOpen(
              true,
            )
          }
          onCreate={() =>
            setBulkOpen(true)
          }
          onPageChange={
            roomState.changePage
          }
        />
      </div>

      {access.canManageRooms ? (
        <RoomEditModal
          open={Boolean(
            editingRoom,
          )}
          room={
            editingRoom
          }
          facilities={
            lookups.managedFacilities
          }
          roomTypes={
            lookups.roomTypes
          }
          onClose={() =>
            setEditingRoom(
              null,
            )
          }
          onUpdated={
            handleUpdated
          }
        />
      ) : null}

      <RoomDetailModal
        open={Boolean(
          detailRoomId,
        )}
        roomId={
          detailRoomId
        }
        initialRoom={
          detailInitialRoom
        }
        canManage={
          detailInitialRoom
            ? access.canManageRoom(
                detailInitialRoom,
              )
            : false
        }
        allowedFacilityId={
          access.canViewAllFacilities
            ? undefined
            : access.scopedFacilityId
        }
        onClose={() => {
          setDetailRoomId(
            null,
          );
          setDetailInitialRoom(
            null,
          );
        }}
        onEdit={(room) => {
          if (
            !access.canManageRoom(
              room,
            )
          ) {
            return;
          }

          setDetailRoomId(
            null,
          );
          setDetailInitialRoom(
            null,
          );
          setEditingRoom(
            room,
          );
        }}
      />

      {access.canManageRooms ? (
        <RoomBulkCreateModal
          open={bulkOpen}
          facilities={
            lookups.managedFacilities
          }
          defaultFacilityId={
            access.scopedFacilityId
          }
          onClose={() =>
            setBulkOpen(false)
          }
          onCompleted={() => {
            setBulkOpen(false);
            roomState.setCurrentPage(
              1,
            );
            roomState.refreshRooms();
          }}
        />
      ) : null}

      {access.canManageRooms ? (
        <RoomTypeManagementModal
          open={
            roomTypesOpen
          }
          onClose={() =>
            setRoomTypesOpen(
              false,
            )
          }
          onChanged={() => {
            lookups.refreshRoomTypes();
            roomState.refreshRooms();
          }}
        />
      ) : null}
    </AdminLayout>
  );
}

export default function ClinicRoomManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Đang tải danh sách
          phòng...
        </div>
      }
    >
      <ClinicRoomManagementContent />
    </Suspense>
  );
}

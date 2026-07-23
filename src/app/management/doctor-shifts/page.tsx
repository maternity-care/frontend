// "use client";

// import { useEffect, useMemo, useState } from "react";
// import dayjs from "dayjs";
// import {
//   Alert,
//   Button,
//   Card,
//   Modal,
//   Space,
//   Statistic,
//   Table,
//   Tag,
//   Typography,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   CalendarDays,
//   Copy,
//   Eye,
//   Layers3,
//   Pencil,
//   Plus,
//   Stethoscope,
//   Trash2,
// } from "lucide-react";
// import { AdminLayout } from "@/management/components/layouts/AdminLayout";
// import { PageHeader } from "@/management/components/ui/PageHeader";
// import { TableFilter } from "@/management/components/ui/TableFilter";
// import { getFacilities } from "@/management/features/facilities/facilities.api";
// import type { Facility } from "@/management/features/facilities/facilities.types";
// import { getRoomsGroupedByFacilities } from "@/management/features/rooms/rooms.api";
// import type { ClinicRoom } from "@/management/features/rooms/rooms.types";
// import { managementCatalogApi } from "@/management/features/doctor-shifts/doctor-shifts.api";
// import type {
//   BulkCreateDoctorShiftsInput,
//   CopyDoctorShiftWeekInput,
//   CreateDoctorShiftInput,
//   DoctorShiftItem,
//   DoctorShiftStatus,
//   GetDoctorShiftsParams,
// } from "@/management/features/doctor-shifts/doctor-shifts.types";
// import { DoctorShiftBulkCreateModal } from "./components/DoctorShiftBulkCreateModal";
// import { DoctorShiftCopyWeekModal } from "./components/DoctorShiftCopyWeekModal";
// import { DoctorShiftDeleteModal } from "./components/DoctorShiftDeleteModal";
// import { DoctorShiftDetailModal } from "./components/DoctorShiftDetailModal";
// import { DoctorShiftFormModal } from "./components/DoctorShiftFormModal";

// const { Text } = Typography;

// const STATUS_OPTIONS = [
//   { value: "available", label: "Còn trống" },
//   { value: "full", label: "Đã đầy" },
//   { value: "cancelled", label: "Đã hủy" },
//   { value: "off", label: "Nghỉ" },
// ];

// const STATUS_TEXT: Record<DoctorShiftStatus, string> = {
//   available: "Còn trống",
//   full: "Đã đầy",
//   cancelled: "Đã hủy",
//   off: "Nghỉ",
// };

// function statusColor(status: DoctorShiftStatus) {
//   if (status === "available") return "green";
//   if (status === "full") return "orange";
//   if (status === "cancelled") return "red";
//   return "default";
// }

// function getErrorMessage(error: unknown) {
//   if (!(error instanceof Error)) {
//     return "Đã xảy ra lỗi. Vui lòng thử lại.";
//   }

//   const message = error.message;

//   if (/conflict|overlap|trùng/i.test(message)) {
//     return "Ca trực bị trùng lịch của bác sĩ hoặc phòng khám.";
//   }

//   if (/operating hours|working hours|giờ hoạt động/i.test(message)) {
//     return "Ca trực nằm ngoài giờ hoạt động của cơ sở.";
//   }

//   return message;
// }

// async function fetchDoctorShiftItems(params: GetDoctorShiftsParams) {
//   const result = await managementCatalogApi.getDoctorShifts({
//     ...params,
//     page: 1,
//     limit: 100,
//   });

//   return result.items;
// }

// export default function DoctorShiftsManagementPage() {
//   const [modal, modalContextHolder] = Modal.useModal();
//   const [items, setItems] = useState<DoctorShiftItem[]>([]);
//   const [facilities, setFacilities] = useState<Facility[]>([]);
//   const [rooms, setRooms] = useState<ClinicRoom[]>([]);
//   const [filters, setFilters] = useState<GetDoctorShiftsParams>({});
//   const [loading, setLoading] = useState(true);
//   const [tableLoading, setTableLoading] = useState(false);
//   const [catalogsLoading, setCatalogsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [catalogError, setCatalogError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const [formOpen, setFormOpen] = useState(false);
//   const [editingShift, setEditingShift] = useState<DoctorShiftItem | null>(
//     null,
//   );
//   const [detailShift, setDetailShift] = useState<DoctorShiftItem | null>(null);
//   const [deleteShift, setDeleteShift] = useState<DoctorShiftItem | null>(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);
//   const [bulkOpen, setBulkOpen] = useState(false);
//   const [copyWeekOpen, setCopyWeekOpen] = useState(false);

//   useEffect(() => {
//     let cancelled = false;

//     async function loadCatalogs() {
//       try {
//         const [facilityItems, groupedRoomItems] = await Promise.all([
//           getFacilities(),
//           getRoomsGroupedByFacilities(),
//         ]);

//         if (cancelled) return;

//         setFacilities(facilityItems);
//         setRooms(groupedRoomItems.flatMap((group) => group.rooms));
//         setCatalogError(null);
//       } catch (loadError) {
//         if (!cancelled) {
//           setCatalogError(
//             `Không tải được danh sách cơ sở và phòng: ${getErrorMessage(
//               loadError,
//             )}`,
//           );
//         }
//       } finally {
//         if (!cancelled) {
//           setCatalogsLoading(false);
//         }
//       }
//     }

//     void loadCatalogs();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   async function reload() {
//     setTableLoading(true);
//     setError(null);

//     try {
//       const nextItems = await fetchDoctorShiftItems(filters);
//       setItems(nextItems);
//     } catch (loadError) {
//       setError(getErrorMessage(loadError));
//     } finally {
//       setTableLoading(false);
//     }
//   }

//   useEffect(() => {
//     let cancelled = false;

//     async function loadDoctorShifts() {
//       try {
//         const nextItems = await fetchDoctorShiftItems(filters);

//         if (cancelled) return;

//         setItems(nextItems);
//         setError(null);
//       } catch (loadError) {
//         if (!cancelled) {
//           setError(getErrorMessage(loadError));
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//           setTableLoading(false);
//         }
//       }
//     }

//     void loadDoctorShifts();

//     return () => {
//       cancelled = true;
//     };
//   }, [filters]);

//   const facilityNameById = useMemo(
//     () => new Map(facilities.map((facility) => [facility.id, facility.name])),
//     [facilities],
//   );

//   const roomNameById = useMemo(
//     () => new Map(rooms.map((room) => [room.id, room.roomName])),
//     [rooms],
//   );

//   const facilityOptions = useMemo(
//     () =>
//       facilities.map((facility) => ({
//         value: facility.id,
//         label: facility.name,
//       })),
//     [facilities],
//   );

//   const roomOptions = useMemo(
//     () =>
//       rooms
//         .filter(
//           (room) => !filters.facilityId || room.facilityId === filters.facilityId,
//         )
//         .map((room) => ({
//           value: room.id,
//           label: room.roomName,
//         })),
//     [filters.facilityId, rooms],
//   );

//   const stats = useMemo(() => {
//     return {
//       total: items.length,
//       available: items.filter((item) => item.status === "available").length,
//       full: items.filter((item) => item.status === "full").length,
//       unavailable: items.filter(
//         (item) => item.status === "cancelled" || item.status === "off",
//       ).length,
//     };
//   }, [items]);

//   function openCreate() {
//     setEditingShift(null);
//     setFormOpen(true);
//   }

//   function openEdit(shift: DoctorShiftItem) {
//     setEditingShift(shift);
//     setFormOpen(true);
//   }

//   async function saveShift(values: CreateDoctorShiftInput) {
//     const conflict = await managementCatalogApi.checkDoctorShiftConflicts({
//       doctorId: values.doctorId,
//       facilityId: values.facilityId,
//       roomId: values.roomId,
//       shiftDate: values.shiftDate,
//       startTime: values.startTime,
//       endTime: values.endTime,
//       excludeShiftId: editingShift?.id,
//     });

//     if (conflict.hasConflict) {
//       if (conflict.message) throw new Error(conflict.message);
//       if (conflict.doctorConflict && conflict.roomConflict) {
//         throw new Error("Ca trực trùng lịch của bác sĩ và phòng khám.");
//       }
//       if (conflict.doctorConflict) {
//         throw new Error("Bác sĩ đã có ca trực trong khoảng thời gian này.");
//       }
//       if (conflict.roomConflict) {
//         throw new Error(
//           "Phòng khám đã được sử dụng trong khoảng thời gian này.",
//         );
//       }
//       throw new Error("Ca trực bị trùng với lịch hiện có.");
//     }

//     if (editingShift) {
//       await managementCatalogApi.updateDoctorShift(editingShift.id, values);
//       modal.success({
//         centered: true,
//         title: "Cập nhật thành công",
//         content: "Thông tin ca trực đã được cập nhật.",
//         okText: "Đóng",
//       });
//     } else {
//       await managementCatalogApi.createDoctorShift(values);
//       modal.success({
//         centered: true,
//         title: "Tạo ca trực thành công",
//         content: "Ca trực mới đã được thêm vào lịch làm việc.",
//         okText: "Đóng",
//       });
//     }

//     setEditingShift(null);
//     setCurrentPage(1);
//     await reload();
//   }

//   async function createBulk(values: BulkCreateDoctorShiftsInput) {
//     await managementCatalogApi.bulkCreateDoctorShifts(values);
//     setCurrentPage(1);
//     await reload();

//     modal.success({
//       centered: true,
//       title: "Tạo lịch hàng loạt thành công",
//       content: "Các ca trực hợp lệ đã được thêm vào lịch làm việc.",
//       okText: "Đóng",
//     });
//   }

//   async function copyWeek(values: CopyDoctorShiftWeekInput) {
//     await managementCatalogApi.copyDoctorShiftWeek(values);
//     setCurrentPage(1);
//     await reload();

//     modal.success({
//       centered: true,
//       title: "Sao chép lịch thành công",
//       content: "Lịch tuần nguồn đã được sao chép sang tuần đích.",
//       okText: "Đóng",
//     });
//   }

//   async function confirmDelete() {
//     if (!deleteShift) return;

//     const deletingShift = deleteShift;

//     setDeleteLoading(true);
//     setError(null);

//     try {
//       await managementCatalogApi.deleteDoctorShift(deletingShift.id);
//       setDetailShift((current) =>
//         current?.id === deletingShift.id ? null : current,
//       );
//       setDeleteShift(null);
//       setCurrentPage(1);
//       await reload();

//       modal.success({
//         centered: true,
//         title: "Xóa ca trực thành công",
//         content: "Ca trực đã được xóa khỏi lịch làm việc.",
//         okText: "Đóng",
//       });
//     } catch (deleteError) {
//       const message = getErrorMessage(deleteError);
//       setError(message);
//       modal.error({
//         centered: true,
//         title: "Không thể xóa ca trực",
//         content: message,
//         okText: "Đóng",
//       });
//     } finally {
//       setDeleteLoading(false);
//     }
//   }

//   const columns: ColumnsType<DoctorShiftItem> = [
//     {
//       title: "STT",
//       width: 64,
//       align: "center",
//       render: (_value, _record, index) =>
//         (currentPage - 1) * pageSize + index + 1,
//     },
//     {
//       title: "Bác sĩ",
//       dataIndex: "doctorId",
//       width: 150,
//       render: (doctorId: string) => (
//         <Space size={10}>
//           <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
//             <Stethoscope className="h-4 w-4" />
//           </span>
//           <div className="min-w-0">
//             <Text strong className="block">
//               Bác sĩ #{doctorId}
//             </Text>
//             <Text type="secondary" className="text-xs">
//               Doctor ID
//             </Text>
//           </div>
//         </Space>
//       ),
//     },
//     {
//       title: "Cơ sở / Phòng",
//       width: 220,
//       render: (_value, record) => (
//         <div>
//           <p className="mb-0 font-medium text-slate-800">
//             {facilityNameById.get(record.facilityId) ??
//               `Cơ sở #${record.facilityId}`}
//           </p>
//           <p className="mb-0 mt-0.5 text-xs text-slate-500">
//             {record.roomId
//               ? (roomNameById.get(record.roomId) ?? `Phòng #${record.roomId}`)
//               : "Chưa gán phòng"}
//           </p>
//         </div>
//       ),
//     },
//     {
//       title: "Ngày trực",
//       dataIndex: "shiftDate",
//       width: 135,
//       align: "center",
//       sorter: (a, b) => a.shiftDate.localeCompare(b.shiftDate),
//       render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
//     },
//     {
//       title: "Khung giờ",
//       width: 145,
//       align: "center",
//       render: (_value, record) => (
//         <div>
//           <p className="mb-0 font-semibold text-slate-800">
//             {record.startTime} - {record.endTime}
//           </p>
//           <p className="mb-0 mt-0.5 text-xs text-slate-500">
//             {dayjs(`2000-01-01T${record.endTime}`).diff(
//               dayjs(`2000-01-01T${record.startTime}`),
//               "minute",
//             )}{" "}
//             phút
//           </p>
//         </div>
//       ),
//     },
//     {
//       title: "Số lịch tối đa",
//       dataIndex: "maxAppointments",
//       width: 125,
//       align: "center",
//       render: (value: number) => (
//         <span className="font-semibold text-slate-800">{value}</span>
//       ),
//     },
//     {
//       title: "Trạng thái",
//       dataIndex: "status",
//       width: 125,
//       align: "center",
//       render: (status: DoctorShiftStatus) => (
//         <Tag color={statusColor(status)}>{STATUS_TEXT[status]}</Tag>
//       ),
//     },
//     {
//       title: "Thao tác",
//       key: "actions",
//       width: 150,
//       align: "center",
//       fixed: "right",
//       render: (_value, record) => (
//         <Space size={8}>
//           <Button
//             title="Xem chi tiết"
//             icon={<Eye className="h-4 w-4" />}
//             onClick={(event) => {
//               event.stopPropagation();
//               setDetailShift(record);
//             }}
//           />
//           <Button
//             title="Chỉnh sửa"
//             icon={<Pencil className="h-4 w-4" />}
//             onClick={(event) => {
//               event.stopPropagation();
//               openEdit(record);
//             }}
//           />
//           <Button
//             danger
//             title="Xóa ca trực"
//             icon={<Trash2 className="h-4 w-4" />}
//             onClick={(event) => {
//               event.stopPropagation();
//               setDeleteShift(record);
//             }}
//           />
//         </Space>
//       ),
//     },
//   ];

//   const displayedError = error ?? catalogError;

//   return (
//     <AdminLayout>
//       {modalContextHolder}

//       <PageHeader
//         title="Quản lý ca trực bác sĩ"
//         description="Quản lý lịch làm việc theo bác sĩ, cơ sở và phòng khám; kiểm tra xung đột trước khi lưu."
//       />

//       <div className="mt-6 flex flex-col gap-5">
//         {displayedError ? (
//           <Alert
//             type="error"
//             title={displayedError}
//             showIcon
//             closable
//             onClose={() => {
//               setError(null);
//               setCatalogError(null);
//             }}
//           />
//         ) : null}

//         <div className="order-2">
//           <TableFilter
//             columns={[
//               {
//                 field: "doctorId",
//                 label: "Doctor ID",
//                 type: "text",
//                 width: 150,
//               },
//               {
//                 field: "facilityId",
//                 label: "Cơ sở",
//                 type: "select",
//                 options: facilityOptions,
//                 width: 220,
//               },
//               {
//                 field: "roomId",
//                 label: "Phòng",
//                 type: "select",
//                 options: roomOptions,
//                 width: 190,
//               },
//               {
//                 field: "dateFrom",
//                 label: "Từ ngày (YYYY-MM-DD)",
//                 type: "text",
//                 width: 190,
//               },
//               {
//                 field: "dateTo",
//                 label: "Đến ngày (YYYY-MM-DD)",
//                 type: "text",
//                 width: 190,
//               },
//               {
//                 field: "status",
//                 label: "Trạng thái",
//                 type: "select",
//                 options: STATUS_OPTIONS,
//                 width: 150,
//               },
//             ]}
//             values={{
//               doctorId: filters.doctorId,
//               facilityId: filters.facilityId,
//               roomId: filters.roomId,
//               dateFrom: filters.dateFrom,
//               dateTo: filters.dateTo,
//               status: filters.status,
//             }}
//             clearLabel="Xóa bộ lọc"
//             onChange={(values) => {
//               const nextFacilityId = values.facilityId
//                 ? String(values.facilityId).trim()
//                 : undefined;
//               const requestedRoomId = values.roomId
//                 ? String(values.roomId).trim()
//                 : undefined;
//               const nextRoomId =
//                 requestedRoomId &&
//                 (!nextFacilityId ||
//                   rooms.some(
//                     (room) =>
//                       room.id === requestedRoomId &&
//                       room.facilityId === nextFacilityId,
//                   ))
//                   ? requestedRoomId
//                   : undefined;

//               setTableLoading(true);
//               setError(null);
//               setFilters({
//                 doctorId: values.doctorId
//                   ? String(values.doctorId).trim()
//                   : undefined,
//                 facilityId: nextFacilityId,
//                 roomId: nextRoomId,
//                 dateFrom: values.dateFrom
//                   ? String(values.dateFrom).trim()
//                   : undefined,
//                 dateTo: values.dateTo
//                   ? String(values.dateTo).trim()
//                   : undefined,
//                 status: values.status as DoctorShiftStatus | undefined,
//               });
//               setCurrentPage(1);
//             }}
//           />
//         </div>

//         <div className="order-1 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <Card className="border-slate-200 bg-white">
//             <Statistic
//               title={<span className="text-slate-500">Tổng ca trực</span>}
//               value={stats.total}
//               formatter={(value) => (
//                 <span className="text-slate-950">{value}</span>
//               )}
//             />
//           </Card>

//           <Card className="border-emerald-100 bg-emerald-50/60">
//             <Statistic
//               title={<span className="text-emerald-700">Còn trống</span>}
//               value={stats.available}
//               formatter={(value) => (
//                 <span className="text-emerald-950">{value}</span>
//               )}
//             />
//           </Card>

//           <Card className="border-amber-100 bg-amber-50/60">
//             <Statistic
//               title={<span className="text-amber-700">Đã đầy</span>}
//               value={stats.full}
//               formatter={(value) => (
//                 <span className="text-amber-950">{value}</span>
//               )}
//             />
//           </Card>

//           <Card className="border-red-100 bg-red-50/60">
//             <Statistic
//               title={<span className="text-red-700">Hủy / Nghỉ</span>}
//               value={stats.unavailable}
//               formatter={(value) => (
//                 <span className="text-red-950">{value}</span>
//               )}
//             />
//           </Card>
//         </div>

//         <Card
//           className="order-3 overflow-hidden border-slate-200 bg-white"
//           styles={{ body: { padding: 0 } }}
//           title={
//             <div>
//               <p className="mb-0 text-base font-semibold text-slate-950">
//                 Danh sách ca trực
//               </p>
//               <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
//                 Theo dõi ngày làm việc, phòng khám, sức chứa và trạng thái ca
//                 trực.
//               </p>
//             </div>
//           }
//           extra={
//             <Space wrap>
//               <Button
//                 icon={<Copy className="h-4 w-4" />}
//                 onClick={() => setCopyWeekOpen(true)}
//               >
//                 Sao chép tuần
//               </Button>
//               <Button
//                 icon={<Layers3 className="h-4 w-4" />}
//                 onClick={() => setBulkOpen(true)}
//               >
//                 Tạo hàng loạt
//               </Button>
//               <Button
//                 type="primary"
//                 icon={<Plus className="h-4 w-4" />}
//                 onClick={openCreate}
//               >
//                 Thêm ca trực
//               </Button>
//             </Space>
//           }
//         >
//           <Table
//             className="management-table"
//             rowKey="id"
//             size="middle"
//             tableLayout="fixed"
//             loading={loading || tableLoading}
//             columns={columns}
//             dataSource={items}
//             scroll={{ x: 1180 }}
//             locale={{
//               emptyText: (
//                 <div className="py-10 text-center">
//                   <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
//                   <p className="mb-0 mt-3 font-semibold text-slate-700">
//                     Chưa có ca trực
//                   </p>
//                   <p className="mb-0 mt-1 text-sm text-slate-500">
//                     Thêm ca trực mới hoặc điều chỉnh bộ lọc để xem dữ liệu.
//                   </p>
//                 </div>
//               ),
//             }}
//             onRow={(record) => ({
//               className: "cursor-pointer",
//               onClick: (event) => {
//                 const target = event.target as HTMLElement;

//                 if (
//                   target.closest("button") ||
//                   target.closest("a") ||
//                   target.closest(".ant-checkbox")
//                 ) {
//                   return;
//                 }

//                 setDetailShift(record);
//               },
//             })}
//             pagination={{
//               current: currentPage,
//               pageSize,
//               total: items.length,
//               showSizeChanger: true,
//               pageSizeOptions: [10, 20, 50, 100],
//               showQuickJumper: true,
//               showTotal: (total, range) =>
//                 `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} ca trực`,
//               onChange: (page, size) => {
//                 setCurrentPage(size !== pageSize ? 1 : page);
//                 setPageSize(size);
//               },
//             }}
//           />
//         </Card>
//       </div>

//       <DoctorShiftFormModal
//         open={formOpen}
//         shift={editingShift}
//         facilities={facilities}
//         rooms={rooms}
//         catalogsLoading={catalogsLoading}
//         onClose={() => {
//           setFormOpen(false);
//           setEditingShift(null);
//         }}
//         onSubmit={saveShift}
//       />

//       <DoctorShiftDetailModal
//         open={Boolean(detailShift)}
//         shift={detailShift}
//         facilityName={
//           detailShift
//             ? facilityNameById.get(detailShift.facilityId)
//             : undefined
//         }
//         roomName={
//           detailShift?.roomId
//             ? roomNameById.get(detailShift.roomId)
//             : undefined
//         }
//         onClose={() => setDetailShift(null)}
//         onEdit={openEdit}
//       />

//       <DoctorShiftBulkCreateModal
//         open={bulkOpen}
//         facilities={facilities}
//         rooms={rooms}
//         catalogsLoading={catalogsLoading}
//         onClose={() => setBulkOpen(false)}
//         onSubmit={createBulk}
//       />

//       <DoctorShiftCopyWeekModal
//         open={copyWeekOpen}
//         facilities={facilities}
//         catalogsLoading={catalogsLoading}
//         onClose={() => setCopyWeekOpen(false)}
//         onSubmit={copyWeek}
//       />

//       <DoctorShiftDeleteModal
//         open={Boolean(deleteShift)}
//         shift={deleteShift}
//         loading={deleteLoading}
//         onClose={() => {
//           if (!deleteLoading) {
//             setDeleteShift(null);
//           }
//         }}
//         onConfirm={confirmDelete}
//       />
//     </AdminLayout>
//   );
// }


"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";

const { Text, Title } = Typography;
const MOCK_TODAY = "2026-07-21";

type ViewMode = "day" | "week" | "month";
type ShiftType = "morning" | "afternoon" | "evening";

type Facility = {
  id: string;
  name: string;
  code: string;
  address: string;
};

type Room = {
  id: string;
  facilityId: string;
  name: string;
  floor: string;
};

type Doctor = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  phone: string;
  status: "active" | "inactive";
  facilityIds: string[];
};

type DoctorShift = {
  id: string;
  code: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  doctorId: string | null;
  facilityId: string;
  roomId: string;
  maxAppointments: number;
  bookedAppointments: number;
  notes: string;
};

type ShiftAssignmentFormValue = {
  doctorId?: string;
  roomId: string;
  maxAppointments: number;
  shiftType: ShiftType;
};

type ShiftFormValues = {
  shiftDate: string;
  facilityId: string;
  assignments: ShiftAssignmentFormValue[];
  notes?: string;
};

const FACILITIES: Facility[] = [
  {
    id: "facility-1",
    name: "Phòng khám Sản An Tâm",
    code: "AT-HN",
    address: "25 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    id: "facility-2",
    name: "Trung tâm Mẹ & Bé Bình An",
    code: "BA-CG",
    address: "118 Trần Thái Tông, Cầu Giấy, Hà Nội",
  },
];

const ROOMS: Room[] = [
  {
    id: "room-1",
    facilityId: "facility-1",
    name: "Phòng khám 101",
    floor: "Tầng 1",
  },
  {
    id: "room-2",
    facilityId: "facility-1",
    name: "Phòng siêu âm 102",
    floor: "Tầng 1",
  },
  {
    id: "room-3",
    facilityId: "facility-1",
    name: "Phòng khám 201",
    floor: "Tầng 2",
  },
  {
    id: "room-4",
    facilityId: "facility-2",
    name: "Phòng khám A01",
    floor: "Tầng 1",
  },
  {
    id: "room-5",
    facilityId: "facility-2",
    name: "Phòng siêu âm A02",
    floor: "Tầng 1",
  },
];

const DOCTORS: Doctor[] = [
  {
    id: "doctor-1",
    name: "Nguyễn Minh Anh",
    title: "BS.CKII",
    specialty: "Sản phụ khoa",
    phone: "0901 234 567",
    status: "active",
    facilityIds: ["facility-1", "facility-2"],
  },
  {
    id: "doctor-2",
    name: "Trần Thu Hà",
    title: "ThS.BS",
    specialty: "Sản phụ khoa",
    phone: "0902 345 678",
    status: "active",
    facilityIds: ["facility-1"],
  },
  {
    id: "doctor-3",
    name: "Lê Hoàng Nam",
    title: "BS.CKI",
    specialty: "Chẩn đoán hình ảnh",
    phone: "0903 456 789",
    status: "active",
    facilityIds: ["facility-1", "facility-2"],
  },
  {
    id: "doctor-4",
    name: "Phạm Ngọc Mai",
    title: "BS.CKII",
    specialty: "Thai kỳ nguy cơ cao",
    phone: "0904 567 890",
    status: "active",
    facilityIds: ["facility-1"],
  },
  {
    id: "doctor-5",
    name: "Đỗ Quang Huy",
    title: "ThS.BS",
    specialty: "Sản phụ khoa",
    phone: "0905 678 901",
    status: "active",
    facilityIds: ["facility-2"],
  },
  {
    id: "doctor-6",
    name: "Vũ Thanh Hương",
    title: "BS.CKI",
    specialty: "Siêu âm sản",
    phone: "0906 789 012",
    status: "active",
    facilityIds: ["facility-1", "facility-2"],
  },
  {
    id: "doctor-7",
    name: "Bùi Đức Long",
    title: "BS",
    specialty: "Sản phụ khoa",
    phone: "0907 890 123",
    status: "active",
    facilityIds: ["facility-2"],
  },
  {
    id: "doctor-8",
    name: "Hoàng Lan Chi",
    title: "BS.CKI",
    specialty: "Sản phụ khoa",
    phone: "0908 901 234",
    status: "inactive",
    facilityIds: ["facility-1"],
  },
];

const INITIAL_SHIFTS: DoctorShift[] = [
  {
    id: "shift-01",
    code: "CT-2007-01",
    shiftDate: "2026-07-20",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-1",
    facilityId: "facility-1",
    roomId: "room-1",
    maxAppointments: 8,
    bookedAppointments: 6,
    notes: "Khám thai định kỳ và tư vấn kết quả xét nghiệm.",
  },
  {
    id: "shift-02",
    code: "CT-2007-02",
    shiftDate: "2026-07-20",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-3",
    facilityId: "facility-1",
    roomId: "room-2",
    maxAppointments: 7,
    bookedAppointments: 7,
    notes: "Siêu âm thai và đo độ mờ da gáy.",
  },
  {
    id: "shift-03",
    code: "CT-2007-03",
    shiftDate: "2026-07-20",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: null,
    facilityId: "facility-1",
    roomId: "room-3",
    maxAppointments: 8,
    bookedAppointments: 0,
    notes: "Ca đang chờ phân công bác sĩ.",
  },
  {
    id: "shift-04",
    code: "CT-2107-01",
    shiftDate: "2026-07-21",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-2",
    facilityId: "facility-1",
    roomId: "room-1",
    maxAppointments: 8,
    bookedAppointments: 5,
    notes: "Khám thai lần đầu.",
  },
  {
    id: "shift-05",
    code: "CT-2107-02",
    shiftDate: "2026-07-21",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-6",
    facilityId: "facility-1",
    roomId: "room-2",
    maxAppointments: 6,
    bookedAppointments: 4,
    notes: "Siêu âm hình thái thai.",
  },
  {
    id: "shift-06",
    code: "CT-2107-03",
    shiftDate: "2026-07-21",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: "doctor-4",
    facilityId: "facility-1",
    roomId: "room-3",
    maxAppointments: 6,
    bookedAppointments: 6,
    notes: "Ưu tiên hồ sơ thai kỳ nguy cơ cao.",
  },
  {
    id: "shift-07",
    code: "CT-2107-04",
    shiftDate: "2026-07-21",
    startTime: "18:00",
    endTime: "21:00",
    shiftType: "evening",
    doctorId: null,
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 6,
    bookedAppointments: 0,
    notes: "Cần phân công bác sĩ trực tối.",
  },
  {
    id: "shift-08",
    code: "CT-2207-01",
    shiftDate: "2026-07-22",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-1",
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 8,
    bookedAppointments: 3,
    notes: "Khám thai định kỳ.",
  },
  {
    id: "shift-09",
    code: "CT-2207-02",
    shiftDate: "2026-07-22",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-3",
    facilityId: "facility-2",
    roomId: "room-5",
    maxAppointments: 7,
    bookedAppointments: 5,
    notes: "Siêu âm thai.",
  },
  {
    id: "shift-10",
    code: "CT-2207-03",
    shiftDate: "2026-07-22",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: "doctor-5",
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 8,
    bookedAppointments: 2,
    notes: "Khám và tư vấn kế hoạch theo dõi thai kỳ.",
  },
  {
    id: "shift-11",
    code: "CT-2307-01",
    shiftDate: "2026-07-23",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: null,
    facilityId: "facility-1",
    roomId: "room-1",
    maxAppointments: 8,
    bookedAppointments: 0,
    notes: "Ca trống chưa có bác sĩ phụ trách.",
  },
  {
    id: "shift-12",
    code: "CT-2307-02",
    shiftDate: "2026-07-23",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-6",
    facilityId: "facility-1",
    roomId: "room-2",
    maxAppointments: 6,
    bookedAppointments: 6,
    notes: "Danh sách lịch hẹn đã đầy.",
  },
  {
    id: "shift-13",
    code: "CT-2307-03",
    shiftDate: "2026-07-23",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: "doctor-2",
    facilityId: "facility-1",
    roomId: "room-3",
    maxAppointments: 8,
    bookedAppointments: 4,
    notes: "Khám thai định kỳ.",
  },
  {
    id: "shift-14",
    code: "CT-2407-01",
    shiftDate: "2026-07-24",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-4",
    facilityId: "facility-1",
    roomId: "room-1",
    maxAppointments: 6,
    bookedAppointments: 3,
    notes: "Theo dõi thai kỳ nguy cơ cao.",
  },
  {
    id: "shift-15",
    code: "CT-2407-02",
    shiftDate: "2026-07-24",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: null,
    facilityId: "facility-1",
    roomId: "room-2",
    maxAppointments: 7,
    bookedAppointments: 0,
    notes: "Chờ phân công bác sĩ siêu âm.",
  },
  {
    id: "shift-16",
    code: "CT-2407-03",
    shiftDate: "2026-07-24",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: "doctor-1",
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 8,
    bookedAppointments: 7,
    notes: "Khám thai và đọc kết quả xét nghiệm.",
  },
  {
    id: "shift-17",
    code: "CT-2507-01",
    shiftDate: "2026-07-25",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-5",
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 8,
    bookedAppointments: 8,
    notes: "Lịch khám cuối tuần đã đầy.",
  },
  {
    id: "shift-18",
    code: "CT-2507-02",
    shiftDate: "2026-07-25",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-3",
    facilityId: "facility-2",
    roomId: "room-5",
    maxAppointments: 7,
    bookedAppointments: 6,
    notes: "Siêu âm thai cuối tuần.",
  },
  {
    id: "shift-19",
    code: "CT-2507-03",
    shiftDate: "2026-07-25",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: null,
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 6,
    bookedAppointments: 0,
    notes: "Ca tạm hủy do bảo trì phòng khám.",
  },
  {
    id: "shift-20",
    code: "CT-2607-01",
    shiftDate: "2026-07-26",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-7",
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 6,
    bookedAppointments: 2,
    notes: "Ca trực Chủ nhật.",
  },
  {
    id: "shift-21",
    code: "CT-2607-02",
    shiftDate: "2026-07-26",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-6",
    facilityId: "facility-2",
    roomId: "room-5",
    maxAppointments: 6,
    bookedAppointments: 1,
    notes: "Siêu âm theo lịch cuối tuần.",
  },
  {
    id: "shift-22",
    code: "CT-2607-03",
    shiftDate: "2026-07-26",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: null,
    facilityId: "facility-1",
    roomId: "room-3",
    maxAppointments: 6,
    bookedAppointments: 0,
    notes: "Không tổ chức ca chiều Chủ nhật.",
  },
  {
    id: "shift-23",
    code: "CT-2807-01",
    shiftDate: "2026-07-28",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "morning",
    doctorId: "doctor-2",
    facilityId: "facility-1",
    roomId: "room-1",
    maxAppointments: 8,
    bookedAppointments: 2,
    notes: "Dữ liệu bổ sung để xem lịch tháng.",
  },
  {
    id: "shift-24",
    code: "CT-3007-01",
    shiftDate: "2026-07-30",
    startTime: "13:30",
    endTime: "17:30",
    shiftType: "afternoon",
    doctorId: null,
    facilityId: "facility-2",
    roomId: "room-4",
    maxAppointments: 8,
    bookedAppointments: 0,
    notes: "Dữ liệu bổ sung để xem lịch tháng.",
  },
];

const SHIFT_TYPE_OPTIONS: Array<{
  value: ShiftType;
  label: string;
  shortLabel: string;
  startTime: string;
  endTime: string;
}> = [
  {
    value: "morning",
    label: "Ca sáng (08:00 - 12:00)",
    shortLabel: "Ca sáng",
    startTime: "08:00",
    endTime: "12:00",
  },
  {
    value: "afternoon",
    label: "Ca chiều (13:30 - 17:30)",
    shortLabel: "Ca chiều",
    startTime: "13:30",
    endTime: "17:30",
  },
  {
    value: "evening",
    label: "Ca tối (18:00 - 21:00)",
    shortLabel: "Ca tối",
    startTime: "18:00",
    endTime: "21:00",
  },
];

const WEEKDAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(value: string | Date, amount: number) {
  const date = typeof value === "string" ? parseDateKey(value) : new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function startOfWeek(value: string | Date) {
  const date = typeof value === "string" ? parseDateKey(value) : new Date(value);
  const day = date.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - distanceFromMonday);
  return date;
}

function getMonthGrid(value: string) {
  const selected = parseDateKey(value);
  const firstDay = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const gridStart = startOfWeek(firstDay);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDateKey(value));
}

function formatLongDate(value: string) {
  const formatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDateKey(value));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getPeriodTitle(viewMode: ViewMode, selectedDate: string) {
  if (viewMode === "day") {
    return formatLongDate(selectedDate);
  }

  if (viewMode === "week") {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = addDays(weekStart, 6);

    return `Tuần ${new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }).format(weekStart)} - ${new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(weekEnd)}`;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(parseDateKey(selectedDate));
}

function getShiftDefinition(value: ShiftType) {
  return SHIFT_TYPE_OPTIONS.find((option) => option.value === value) ?? SHIFT_TYPE_OPTIONS[0];
}

function getShiftTypeLabel(value: ShiftType) {
  return getShiftDefinition(value).label;
}

function getShiftTypeShortLabel(value: ShiftType) {
  return getShiftDefinition(value).shortLabel;
}

function getDoctor(doctorId: string | null) {
  return DOCTORS.find((doctor) => doctor.id === doctorId) ?? null;
}

function getFacility(facilityId: string) {
  return FACILITIES.find((facility) => facility.id === facilityId) ?? null;
}

function getRoom(roomId: string) {
  return ROOMS.find((room) => room.id === roomId) ?? null;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function shiftsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  return (
    timeToMinutes(firstStart) < timeToMinutes(secondEnd) &&
    timeToMinutes(secondStart) < timeToMinutes(firstEnd)
  );
}

function isDoctorBusy({
  shifts,
  doctorId,
  shiftDate,
  startTime,
  endTime,
  excludeShiftId,
}: {
  shifts: DoctorShift[];
  doctorId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  excludeShiftId?: string;
}) {
  return shifts.some(
    (shift) =>
      shift.id !== excludeShiftId &&
      shift.doctorId === doctorId &&
      shift.shiftDate === shiftDate &&
      shiftsOverlap(shift.startTime, shift.endTime, startTime, endTime),
  );
}

function isRoomBusy({
  shifts,
  roomId,
  shiftDate,
  startTime,
  endTime,
  excludeShiftId,
}: {
  shifts: DoctorShift[];
  roomId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  excludeShiftId?: string;
}) {
  return shifts.some(
    (shift) =>
      shift.id !== excludeShiftId &&
      shift.roomId === roomId &&
      shift.shiftDate === shiftDate &&
      shiftsOverlap(shift.startTime, shift.endTime, startTime, endTime),
  );
}

function getShiftAccent(shiftType: ShiftType) {
  const accents: Record<ShiftType, string> = {
    morning: "border-blue-200 bg-blue-50 text-blue-900",
    afternoon: "border-amber-200 bg-amber-50 text-amber-900",
    evening: "border-violet-200 bg-violet-50 text-violet-900",
  };

  return accents[shiftType];
}

function ShiftFormModal({
  open,
  editingShift,
  selectedDate,
  shifts,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingShift: DoctorShift | null;
  selectedDate: string;
  shifts: DoctorShift[];
  onClose: () => void;
  onSaved: (savedShifts: DoctorShift[], mode: "create" | "update") => void;
}) {
  const [form] = Form.useForm<ShiftFormValues>();

  const watchedDate = Form.useWatch("shiftDate", form) ?? selectedDate;
  const watchedFacilityId =
    Form.useWatch("facilityId", form) ?? FACILITIES[0].id;
  const watchedAssignments =
    Form.useWatch("assignments", form) ?? [];

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      if (editingShift) {
        form.setFieldsValue({
          shiftDate: editingShift.shiftDate,
          facilityId: editingShift.facilityId,
          assignments: [
            {
              doctorId: editingShift.doctorId ?? undefined,
              roomId: editingShift.roomId,
              maxAppointments: editingShift.maxAppointments,
              shiftType: editingShift.shiftType,
            },
          ],
          notes: editingShift.notes,
        });
        return;
      }

      form.resetFields();
      form.setFieldsValue({
        shiftDate: selectedDate,
        facilityId: FACILITIES[0].id,
        assignments: [
          {
            doctorId: undefined,
            roomId:
              ROOMS.find((room) => room.facilityId === FACILITIES[0].id)?.id ?? "",
            maxAppointments: 8,
            shiftType: "morning",
          },
        ],
        notes: "",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [editingShift, form, open, selectedDate]);

  const roomOptions = useMemo(
    () =>
      ROOMS.filter((room) => room.facilityId === watchedFacilityId).map(
        (room) => ({
          value: room.id,
          label: `${room.name} · ${room.floor}`,
        }),
      ),
    [watchedFacilityId],
  );

  function getDoctorOptions(rowIndex: number) {
    const row = watchedAssignments[rowIndex];
    const shiftDefinition = getShiftDefinition(row?.shiftType ?? "morning");

    return DOCTORS.filter((doctor) => doctor.status === "active")
      .filter((doctor) => doctor.facilityIds.includes(watchedFacilityId))
      .map((doctor) => {
        const busyInSavedSchedule = isDoctorBusy({
          shifts,
          doctorId: doctor.id,
          shiftDate: watchedDate,
          startTime: shiftDefinition.startTime,
          endTime: shiftDefinition.endTime,
          excludeShiftId: editingShift?.id,
        });

        const duplicatedInCurrentForm = watchedAssignments.some(
          (assignment, assignmentIndex) =>
            assignmentIndex !== rowIndex &&
            assignment?.doctorId === doctor.id &&
            assignment?.shiftType === row?.shiftType,
        );

        const unavailable = busyInSavedSchedule || duplicatedInCurrentForm;

        return {
          value: doctor.id,
          disabled: unavailable && row?.doctorId !== doctor.id,
          label: `${doctor.title} ${doctor.name} · ${doctor.specialty}${
            unavailable && row?.doctorId !== doctor.id ? " · Trùng ca" : ""
          }`,
        };
      });
  }

  function handleFinish(values: ShiftFormValues) {
    const duplicateDoctorKeys = new Set<string>();
    const duplicateRoomKeys = new Set<string>();

    for (let index = 0; index < values.assignments.length; index += 1) {
      const assignment = values.assignments[index];
      const shiftDefinition = getShiftDefinition(assignment.shiftType);

      if (assignment.doctorId) {
        const duplicateDoctorKey = `${assignment.doctorId}-${assignment.shiftType}`;

        if (duplicateDoctorKeys.has(duplicateDoctorKey)) {
          form.setFields([
            {
              name: ["assignments", index, "doctorId"],
              errors: ["Bác sĩ này đã được chọn cho cùng một ca trực."],
            },
          ]);
          return;
        }

        duplicateDoctorKeys.add(duplicateDoctorKey);

        const doctorBusy = isDoctorBusy({
          shifts,
          doctorId: assignment.doctorId,
          shiftDate: values.shiftDate,
          startTime: shiftDefinition.startTime,
          endTime: shiftDefinition.endTime,
          excludeShiftId: editingShift?.id,
        });

        if (doctorBusy) {
          form.setFields([
            {
              name: ["assignments", index, "doctorId"],
              errors: ["Bác sĩ đã có lịch trong ca trực này."],
            },
          ]);
          return;
        }
      }

      const duplicateRoomKey = `${assignment.roomId}-${assignment.shiftType}`;

      if (duplicateRoomKeys.has(duplicateRoomKey)) {
        form.setFields([
          {
            name: ["assignments", index, "roomId"],
            errors: ["Phòng khám này đã được chọn cho cùng một ca trực."],
          },
        ]);
        return;
      }

      duplicateRoomKeys.add(duplicateRoomKey);

      const roomBusy = isRoomBusy({
        shifts,
        roomId: assignment.roomId,
        shiftDate: values.shiftDate,
        startTime: shiftDefinition.startTime,
        endTime: shiftDefinition.endTime,
        excludeShiftId: editingShift?.id,
      });

      if (roomBusy) {
        form.setFields([
          {
            name: ["assignments", index, "roomId"],
            errors: ["Phòng khám đã được sử dụng trong ca trực này."],
          },
        ]);
        return;
      }
    }

    const now = Date.now();
    const savedShifts = values.assignments.map((assignment, index) => {
      const shiftDefinition = getShiftDefinition(assignment.shiftType);
      const baseShift = editingShift && index === 0 ? editingShift : null;

      return {
        ...(baseShift ?? {}),
        id: baseShift?.id ?? `shift-${now}-${index}`,
        code:
          baseShift?.code ??
          `CT-${values.shiftDate.replaceAll("-", "").slice(4)}-${String(
            now + index,
          ).slice(-4)}`,
        shiftDate: values.shiftDate,
        startTime: shiftDefinition.startTime,
        endTime: shiftDefinition.endTime,
        shiftType: assignment.shiftType,
        doctorId: assignment.doctorId ?? null,
        facilityId: values.facilityId,
        roomId: assignment.roomId,
        maxAppointments: assignment.maxAppointments,
        bookedAppointments: baseShift
          ? Math.min(baseShift.bookedAppointments, assignment.maxAppointments)
          : 0,
        notes: values.notes?.trim() ?? "",
      } satisfies DoctorShift;
    });

    onSaved(savedShifts, editingShift ? "update" : "create");
    form.resetFields();
    onClose();
  }

  return (
    <Modal
      open={open}
      centered
      width={980}
      title={null}
      okText={editingShift ? "Lưu thay đổi" : "Tạo lịch trực"}
      cancelText="Hủy"
      onOk={() => form.submit()}
      onCancel={onClose}
      mask={{ closable: false }}
      styles={{
        body: {
          height: "min(620px, 70vh)",
          overflowY: "auto",
          paddingRight: 8,
        },
      }}
    >
      <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Calendar className="h-5 w-5" />
          </span>

          <div>
            <Title level={4} className="!mb-1 !text-slate-950">
              {editingShift ? "Cập nhật ca trực" : "Thêm lịch trực mới"}
            </Title>
            <Text type="secondary">
              Chọn ngày, cơ sở và thêm một hoặc nhiều dòng phân công bác sĩ theo ca trực.
            </Text>
          </div>
        </div>
      </div>

      <Form<ShiftFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={handleFinish}
        onValuesChange={(changedValues) => {
          if ("facilityId" in changedValues) {
            const facilityId = changedValues.facilityId as string;
            const assignments = form.getFieldValue("assignments") ?? [];

            const defaultRoomId =
              ROOMS.find((room) => room.facilityId === facilityId)?.id ?? "";

            form.setFieldsValue({
              assignments: assignments.map(
                (assignment: ShiftAssignmentFormValue) => ({
                  ...assignment,
                  doctorId: undefined,
                  roomId: defaultRoomId,
                }),
              ),
            });
          }
        }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="shiftDate"
              label="Ngày trực"
              rules={[{ required: true, message: "Vui lòng chọn ngày trực." }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="facilityId"
              label="Cơ sở"
              rules={[{ required: true, message: "Chọn cơ sở." }]}
            >
              <Select
                options={FACILITIES.map((facility) => ({
                  value: facility.id,
                  label: `${facility.name} (${facility.code})`,
                }))}
              />
            </Form.Item>
          </Col>

        </Row>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="mb-0 font-semibold text-slate-950">Phân công ca trực</p>
            <p className="mb-0 mt-1 text-sm text-slate-500">
              Mỗi dòng gồm bác sĩ phụ trách, phòng khám, số lịch tối đa và ca trực đã có sẵn thời gian.
            </p>
          </div>
        </div>

        <Form.List
          name="assignments"
          rules={[
            {
              validator: async (_, assignments: ShiftAssignmentFormValue[]) => {
                if (!assignments || assignments.length === 0) {
                  throw new Error("Cần ít nhất một ca trực.");
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <Text strong>Thông tin phân công</Text>
                    </div>

                    {!editingShift && fields.length > 1 ? (
                      <Button
                        danger
                        type="text"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => remove(field.name)}
                      >
                        Xóa dòng
                      </Button>
                    ) : null}
                  </div>

                  <Row gutter={[16, 0]} align="top">
                    <Col xs={24} md={12} xl={8}>
                      <Form.Item
                        name={[field.name, "doctorId"]}
                        label="Bác sĩ phụ trách"
                        rules={[
                          { required: true, message: "Chọn bác sĩ phụ trách." },
                        ]}
                      >
                        <Select
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          placeholder="Chọn bác sĩ"
                          options={getDoctorOptions(index)}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} xl={6}>
                      <Form.Item
                        name={[field.name, "roomId"]}
                        label="Phòng khám"
                        rules={[{ required: true, message: "Chọn phòng khám." }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Chọn phòng khám"
                          options={roomOptions}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={10} xl={4}>
                      <Form.Item
                        name={[field.name, "maxAppointments"]}
                        label="Số lịch tối đa"
                        rules={[
                          { required: true, message: "Nhập số lịch tối đa." },
                        ]}
                      >
                        <InputNumber min={1} max={30} className="w-full" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={14} xl={6}>
                      <Form.Item
                        name={[field.name, "shiftType"]}
                        label="Ca trực"
                        rules={[{ required: true, message: "Chọn ca trực." }]}
                      >
                        <Select options={SHIFT_TYPE_OPTIONS} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}

              {!editingShift ? (
                <Button
                  type="dashed"
                  block
                  size="large"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() =>
                    add({
                      doctorId: undefined,
                      roomId:
                        ROOMS.find((room) => room.facilityId === watchedFacilityId)
                          ?.id ?? "",
                      maxAppointments: 8,
                      shiftType: "morning",
                    })
                  }
                >
                  Thêm bác sĩ và ca trực
                </Button>
              ) : null}

              <Form.ErrorList errors={errors} />
            </div>
          )}
        </Form.List>

        <Form.Item name="notes" label="Ghi chú" className="!mt-4">
          <Input.TextArea
            rows={3}
            maxLength={300}
            showCount
            placeholder="Ví dụ: ưu tiên thai phụ tái khám, yêu cầu phòng siêu âm..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function DoctorShiftPage() {
  const [shifts, setShifts] = useState<DoctorShift[]>(INITIAL_SHIFTS);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState(MOCK_TODAY);

  const [keyword, setKeyword] = useState("");
  const [facilityFilter, setFacilityFilter] = useState<string>();
  const [roomFilter, setRoomFilter] = useState<string>();
  const [doctorFilter, setDoctorFilter] = useState<string>();
  const [shiftTypeFilter, setShiftTypeFilter] = useState<ShiftType>();

  const [detailShift, setDetailShift] = useState<DoctorShift | null>(null);
  const [editingShift, setEditingShift] = useState<DoctorShift | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deletingShift, setDeletingShift] = useState<DoctorShift | null>(null);


  const filteredShifts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return shifts.filter((shift) => {
      const doctor = getDoctor(shift.doctorId);
      const facility = getFacility(shift.facilityId);
      const room = getRoom(shift.roomId);

      const matchesKeyword =
        !normalizedKeyword ||
        [
          shift.code,
          doctor?.name,
          doctor?.title,
          doctor?.specialty,
          facility?.name,
          facility?.code,
          room?.name,
          shift.notes,
        ].some((value) => value?.toLowerCase().includes(normalizedKeyword));

      return (
        matchesKeyword &&
        (!facilityFilter || shift.facilityId === facilityFilter) &&
        (!roomFilter || shift.roomId === roomFilter) &&
        (!doctorFilter || shift.doctorId === doctorFilter) &&
        (!shiftTypeFilter || shift.shiftType === shiftTypeFilter)
      );
    });
  }, [
    doctorFilter,
    facilityFilter,
    keyword,
    roomFilter,
    shiftTypeFilter,
    shifts,
  ]);

  const scopedShifts = useMemo(() => {
    if (viewMode === "day") {
      return filteredShifts.filter((shift) => shift.shiftDate === selectedDate);
    }

    if (viewMode === "week") {
      const weekStartKey = toDateKey(startOfWeek(selectedDate));
      const weekEndKey = toDateKey(addDays(startOfWeek(selectedDate), 6));

      return filteredShifts.filter(
        (shift) => shift.shiftDate >= weekStartKey && shift.shiftDate <= weekEndKey,
      );
    }

    const selected = parseDateKey(selectedDate);

    return filteredShifts.filter((shift) => {
      const shiftDate = parseDateKey(shift.shiftDate);
      return (
        shiftDate.getFullYear() === selected.getFullYear() &&
        shiftDate.getMonth() === selected.getMonth()
      );
    });
  }, [filteredShifts, selectedDate, viewMode]);

  const sortedScopedShifts = useMemo(
    () =>
      [...scopedShifts].sort((first, second) =>
        `${first.shiftDate}-${first.startTime}`.localeCompare(
          `${second.shiftDate}-${second.startTime}`,
        ),
      ),
    [scopedShifts],
  );

  const stats = useMemo(() => {
    const bookedAppointments = scopedShifts.reduce(
      (total, shift) => total + shift.bookedAppointments,
      0,
    );
    const maxAppointments = scopedShifts.reduce(
      (total, shift) => total + shift.maxAppointments,
      0,
    );

    return {
      total: scopedShifts.length,
      assigned: scopedShifts.filter((shift) => Boolean(shift.doctorId)).length,
      vacant: scopedShifts.filter((shift) => !shift.doctorId).length,
      utilization:
        maxAppointments === 0
          ? 0
          : Math.round((bookedAppointments / maxAppointments) * 100),
    };
  }, [scopedShifts]);

  const monthGrid = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);

  function openCreate(date = selectedDate) {
    setSelectedDate(date);
    setEditingShift(null);
    setFormModalOpen(true);
  }

  function openEdit(shift: DoctorShift) {
    setEditingShift(shift);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setEditingShift(null);
    setFormModalOpen(false);
  }

  function handleShiftSaved(
    savedShifts: DoctorShift[],
    mode: "create" | "update",
  ) {
    if (mode === "create") {
      setShifts((current) => [...current, ...savedShifts]);
      setSelectedDate(savedShifts[0]?.shiftDate ?? selectedDate);
      return;
    }

    const updatedShift = savedShifts[0];
    if (!updatedShift) return;

    setShifts((current) =>
      current.map((item) =>
        item.id === updatedShift.id ? updatedShift : item,
      ),
    );
    setDetailShift((current) =>
      current?.id === updatedShift.id ? updatedShift : current,
    );
  }

  function confirmDelete() {
    if (!deletingShift) return;

    const shiftId = deletingShift.id;
    setShifts((current) => current.filter((shift) => shift.id !== shiftId));
    setDetailShift((current) => (current?.id === shiftId ? null : current));
    setDeletingShift(null);
  }

  function assignDoctor(doctorId?: string) {
    if (!detailShift) return;

    const updatedShift: DoctorShift = {
      ...detailShift,
      doctorId: doctorId ?? null,
    };

    setShifts((current) =>
      current.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
    );
    setDetailShift(updatedShift);
  }

  function movePeriod(direction: -1 | 1) {
    if (viewMode === "day") {
      setSelectedDate(toDateKey(addDays(selectedDate, direction)));
      return;
    }

    if (viewMode === "week") {
      setSelectedDate(toDateKey(addDays(selectedDate, direction * 7)));
      return;
    }

    const current = parseDateKey(selectedDate);
    setSelectedDate(
      toDateKey(new Date(current.getFullYear(), current.getMonth() + direction, 1)),
    );
  }

  function resetFilters() {
    setKeyword("");
    setFacilityFilter(undefined);
    setRoomFilter(undefined);
    setDoctorFilter(undefined);
    setShiftTypeFilter(undefined);
  }

  const tableColumns: ColumnsType<DoctorShift> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (_value, _record, index) => index + 1,
    },
    {
      title: "Ca trực",
      width: 235,
      render: (_value, shift) => (
        <div>
          <Text strong className="block text-slate-950">
            {getShiftTypeShortLabel(shift.shiftType)}
          </Text>
          <Text type="secondary" className="block text-xs">
            {shift.startTime} - {shift.endTime} · {shift.code}
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày trực",
      dataIndex: "shiftDate",
      width: 150,
      sorter: (first, second) => first.shiftDate.localeCompare(second.shiftDate),
      render: (value: string) => (
        <div>
          <Text strong>{formatShortDate(value)}</Text>
          <Text type="secondary" className="block text-xs">
            {new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(
              parseDateKey(value),
            )}
          </Text>
        </div>
      ),
    },
    {
      title: "Bác sĩ phụ trách",
      width: 230,
      render: (_value, shift) => {
        const doctor = getDoctor(shift.doctorId);

        return doctor ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Stethoscope className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <Text strong className="block truncate">
                {doctor.title} {doctor.name}
              </Text>
              <Text type="secondary" className="block truncate text-xs">
                {doctor.specialty}
              </Text>
            </div>
          </div>
        ) : (
          <Button
            type="link"
            className="!px-0"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              setDetailShift(shift);
            }}
          >
            Gán bác sĩ
          </Button>
        );
      },
    },
    {
      title: "Cơ sở / Phòng",
      width: 230,
      render: (_value, shift) => {
        const facility = getFacility(shift.facilityId);
        const room = getRoom(shift.roomId);

        return (
          <div>
            <Text strong className="block truncate">
              {facility?.name ?? "Chưa cập nhật"}
            </Text>
            <Text type="secondary" className="block truncate text-xs">
              {room?.name} · {room?.floor}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Lịch hẹn",
      width: 150,
      align: "center",
      sorter: (first, second) =>
        first.bookedAppointments / first.maxAppointments -
        second.bookedAppointments / second.maxAppointments,
      render: (_value, shift) => {
        const percent = Math.round(
          (shift.bookedAppointments / shift.maxAppointments) * 100,
        );

        return (
          <div className="min-w-[110px]">
            <div className="mb-1 flex justify-between text-xs">
              <span>
                {shift.bookedAppointments}/{shift.maxAppointments}
              </span>
              <span>{percent}%</span>
            </div>
            <Progress percent={percent} size="small" showInfo={false} />
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_value, shift) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<Eye className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                setDetailShift(shift);
              }}
            />
          </Tooltip>
          <Tooltip title="Cập nhật">
            <Button
              icon={<Pencil className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                openEdit(shift);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa ca trực">
            <Button
              danger
              icon={<Trash2 className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                setDeletingShift(shift);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Doctor Shift Management"
        description="Quản lý ca trực theo ngày, tuần, tháng và phân công một hoặc nhiều bác sĩ."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Alert
          type="info"
          showIcon
          title="Màn hình đang dùng dữ liệu mô phỏng"
          description="Các thao tác thêm, sửa, xóa và gán bác sĩ chỉ cập nhật state trên giao diện, chưa gọi API."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <Statistic title="Tổng ca trong kỳ" value={stats.total} />
          </Card>
          <Card className="border-blue-100 bg-blue-50/60">
            <Statistic title="Đã phân công" value={stats.assigned} />
          </Card>
          <Card className="border-amber-100 bg-amber-50/60">
            <Statistic title="Ca chưa có bác sĩ" value={stats.vacant} />
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic title="Tỷ lệ lấp đầy lịch" value={stats.utilization} suffix="%" />
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  icon={<ChevronLeft className="h-4 w-4" />}
                  onClick={() => movePeriod(-1)}
                />
                <Button onClick={() => setSelectedDate(MOCK_TODAY)}>Hôm nay</Button>
                <Button
                  icon={<ChevronRight className="h-4 w-4" />}
                  onClick={() => movePeriod(1)}
                />
                <Title level={4} className="!mb-0 !ml-1 !text-slate-950">
                  {getPeriodTitle(viewMode, selectedDate)}
                </Title>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type={viewMode === "day" ? "primary" : "default"}
                  onClick={() => setViewMode("day")}
                >
                  Ngày
                </Button>
                <Button
                  type={viewMode === "week" ? "primary" : "default"}
                  onClick={() => setViewMode("week")}
                >
                  Tuần
                </Button>
                <Button
                  type={viewMode === "month" ? "primary" : "default"}
                  onClick={() => setViewMode("month")}
                >
                  Tháng
                </Button>
                <Button
                  type="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => openCreate()}
                >
                  Thêm ca trực
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <Input
                allowClear
                value={keyword}
                prefix={<Search className="h-4 w-4 text-slate-400" />}
                placeholder="Tìm mã ca, bác sĩ, chuyên khoa, phòng..."
                className="xl:col-span-2"
                onChange={(event) => setKeyword(event.target.value)}
              />

              <Select
                allowClear
                value={facilityFilter}
                placeholder="Tất cả cơ sở"
                options={FACILITIES.map((facility) => ({
                  value: facility.id,
                  label: facility.name,
                }))}
                onChange={(value) => {
                  setFacilityFilter(value);
                  setRoomFilter(undefined);
                }}
              />

              <Select
                allowClear
                value={roomFilter}
                placeholder="Tất cả phòng"
                options={ROOMS.filter(
                  (room) => !facilityFilter || room.facilityId === facilityFilter,
                ).map((room) => ({ value: room.id, label: room.name }))}
                onChange={setRoomFilter}
              />

              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={doctorFilter}
                placeholder="Tất cả bác sĩ"
                options={DOCTORS.map((doctor) => ({
                  value: doctor.id,
                  label: `${doctor.title} ${doctor.name}`,
                }))}
                onChange={setDoctorFilter}
              />

              <Select
                allowClear
                value={shiftTypeFilter}
                placeholder="Loại ca"
                options={SHIFT_TYPE_OPTIONS}
                onChange={setShiftTypeFilter}
              />

              <Tooltip title="Xóa bộ lọc">
                <Button
                  block
                  icon={<X className="h-4 w-4" />}
                  onClick={resetFilters}
                >
                  Xóa bộ lọc
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>

        {viewMode === "month" ? (
          <Card
            className="overflow-hidden border-slate-200 bg-white"
            styles={{ body: { padding: 0 } }}
            title={
              <div>
                <p className="mb-0 text-base font-semibold text-slate-950">
                  Lịch ca trực theo tháng
                </p>
                <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                  Bấm vào một ngày để chuyển sang danh sách ca trực của ngày đó.
                </p>
              </div>
            }
          >
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-r border-slate-200 px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 last:border-r-0"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthGrid.map((date) => {
                const dateKey = toDateKey(date);
                const dayShifts = filteredShifts
                  .filter((shift) => shift.shiftDate === dateKey)
                  .sort((first, second) =>
                    first.startTime.localeCompare(second.startTime),
                  );
                const selected = dateKey === selectedDate;
                const today = dateKey === MOCK_TODAY;
                const sameMonth =
                  date.getMonth() === parseDateKey(selectedDate).getMonth();

                return (
                  <div
                    key={dateKey}
                    role="button"
                    tabIndex={0}
                    className={`min-h-[145px] cursor-pointer border-b border-r border-slate-200 p-2 transition hover:bg-slate-50 ${
                      !sameMonth ? "bg-slate-50/70 text-slate-400" : "bg-white"
                    } ${selected ? "ring-2 ring-inset ring-blue-500" : ""}`}
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setViewMode("day");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedDate(dateKey);
                        setViewMode("day");
                      }
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          today ? "bg-blue-600 text-white" : "text-slate-700"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayShifts.length > 0 ? (
                        <Badge count={dayShifts.length} size="small" />
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {dayShifts.slice(0, 3).map((shift) => {
                        const doctor = getDoctor(shift.doctorId);

                        return (
                          <button
                            key={shift.id}
                            type="button"
                            className={`w-full truncate rounded-md border px-2 py-1.5 text-left text-[11px] font-medium ${getShiftAccent(
                              shift.shiftType,
                            )}`}
                            title={`${shift.startTime} - ${shift.endTime} · ${
                              doctor?.name ?? "Chưa phân công"
                            }`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setDetailShift(shift);
                            }}
                          >
                            {shift.startTime} · {doctor?.name ?? "Chưa phân công"}
                          </button>
                        );
                      })}

                      {dayShifts.length > 3 ? (
                        <span className="px-1 text-xs font-semibold text-slate-500">
                          +{dayShifts.length - 3} ca khác
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card
            className="overflow-hidden border-slate-200 bg-white"
            styles={{ body: { padding: 0 } }}
            title={
              <div>
                <p className="mb-0 text-base font-semibold text-slate-950">
                  {viewMode === "day"
                    ? `Danh sách ca trực ngày ${formatShortDate(selectedDate)}`
                    : "Danh sách ca trực theo tuần"}
                </p>
                <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                  Bấm vào một dòng để xem chi tiết và phân công bác sĩ.
                </p>
              </div>
            }
            extra={
              <Text type="secondary">
                {sortedScopedShifts.length} ca trực phù hợp
              </Text>
            }
          >
            <Table
              rowKey="id"
              size="middle"
              tableLayout="fixed"
              columns={tableColumns}
              dataSource={sortedScopedShifts}
              pagination={false}
              scroll={{ x: 1500 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có ca trực phù hợp trong khoảng thời gian này."
                  >
                    <Button type="primary" onClick={() => openCreate()}>
                      Thêm ca trực
                    </Button>
                  </Empty>
                ),
              }}
              onRow={(shift) => ({
                className: "cursor-pointer",
                onClick: (event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("button") || target.closest("a")) return;
                  setDetailShift(shift);
                },
              })}
              className="management-table [&_.ant-table-cell]:px-3"
            />
          </Card>
        )}
      </div>

      <ShiftFormModal
        open={formModalOpen}
        editingShift={editingShift}
        selectedDate={selectedDate}
        shifts={shifts}
        onClose={closeFormModal}
        onSaved={handleShiftSaved}
      />

      <Modal
        open={Boolean(detailShift)}
        centered
        width={900}
        title={null}
        footer={null}
        onCancel={() => setDetailShift(null)}
      >
        {detailShift ? (
          <div>
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Calendar className="h-6 w-6" />
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Title level={3} className="!mb-0 !text-slate-950">
                      {detailShift.code}
                    </Title>
                    <Tag color="blue">{getShiftTypeLabel(detailShift.shiftType)}</Tag>
                  </div>
                  <Text type="secondary" className="mt-1 block">
                    {formatLongDate(detailShift.shiftDate)} · {detailShift.startTime} -{" "}
                    {detailShift.endTime}
                  </Text>
                </div>
              </div>

              <Space size={8} wrap>
                <Button
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => {
                    const shift = detailShift;
                    setDetailShift(null);
                    openEdit(shift);
                  }}
                >
                  Cập nhật
                </Button>
                <Button
                  danger
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeletingShift(detailShift)}
                >
                  Xóa
                </Button>
              </Space>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Loại ca
                </p>
                <p className="mb-0 font-semibold text-slate-950">
                  {getShiftTypeLabel(detailShift.shiftType)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Lịch hẹn
                </p>
                <p className="mb-0 font-semibold text-slate-950">
                  {detailShift.bookedAppointments}/{detailShift.maxAppointments} lịch
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Cơ sở và phòng
                </p>
                <p className="mb-0 font-semibold text-slate-950">
                  {getFacility(detailShift.facilityId)?.name}
                </p>
                <p className="mb-0 mt-1 text-sm text-slate-500">
                  {getRoom(detailShift.roomId)?.name} · {getRoom(detailShift.roomId)?.floor}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-slate-500" />
                  <p className="mb-0 font-semibold text-slate-950">Bác sĩ phụ trách</p>
                </div>

                {getDoctor(detailShift.doctorId) ? (
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Stethoscope className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <Text strong className="block truncate text-blue-950">
                        {getDoctor(detailShift.doctorId)?.title}{" "}
                        {getDoctor(detailShift.doctorId)?.name}
                      </Text>
                      <Text className="block truncate text-sm text-blue-700">
                        {getDoctor(detailShift.doctorId)?.specialty}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    className="mb-4"
                    title="Ca trực chưa được phân công bác sĩ"
                  />
                )}

                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  className="w-full"
                  value={detailShift.doctorId ?? undefined}
                  placeholder="Chọn bác sĩ phụ trách"
                  options={DOCTORS.filter((doctor) => doctor.status === "active")
                    .filter((doctor) => doctor.facilityIds.includes(detailShift.facilityId))
                    .map((doctor) => {
                      const busy = isDoctorBusy({
                        shifts,
                        doctorId: doctor.id,
                        shiftDate: detailShift.shiftDate,
                        startTime: detailShift.startTime,
                        endTime: detailShift.endTime,
                        excludeShiftId: detailShift.id,
                      });

                      return {
                        value: doctor.id,
                        disabled: busy,
                        label: `${doctor.title} ${doctor.name} · ${doctor.specialty}${
                          busy ? " · Trùng ca" : ""
                        }`,
                      };
                    })}
                  onChange={assignDoctor}
                />

              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 font-semibold text-slate-950">Thông tin bổ sung</p>

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="mb-0 font-medium text-slate-800">
                        {getFacility(detailShift.facilityId)?.name}
                      </p>
                      <p className="mb-0 text-slate-500">
                        {getFacility(detailShift.facilityId)?.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <p className="mb-0 text-slate-600">
                      {getFacility(detailShift.facilityId)?.address}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <p className="mb-0 text-slate-600">
                      {detailShift.startTime} - {detailShift.endTime} ·{" "}
                      {getShiftTypeLabel(detailShift.shiftType)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                    Ghi chú
                  </p>
                  <p className="mb-0 text-sm text-slate-700">
                    {detailShift.notes || "Không có ghi chú."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="primary"
                icon={<X className="h-4 w-4" />}
                onClick={() => setDetailShift(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deletingShift)}
        centered
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={() => setDeletingShift(null)}
        className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
        styles={{ body: { padding: 0 } }}
      >
        <div className="relative px-6 pb-6 pt-7 text-center">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setDeletingShift(null)}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">Xóa ca trực?</h3>
          <p className="mt-2 text-sm text-slate-500">
            Ca trực sẽ bị xóa khỏi danh sách dữ liệu mô phỏng. Thao tác này không thể hoàn tác.
          </p>

          {deletingShift ? (
            <div className="mx-auto mt-4 max-w-[350px] rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="mb-0 font-semibold">{deletingShift.code}</p>
              <p className="mb-0 mt-1">
                {formatShortDate(deletingShift.shiftDate)} · {deletingShift.startTime} -{" "}
                {deletingShift.endTime}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button size="large" onClick={() => setDeletingShift(null)}>
              Hủy
            </Button>
            <Button danger type="primary" size="large" onClick={confirmDelete}>
              Xóa ca trực
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
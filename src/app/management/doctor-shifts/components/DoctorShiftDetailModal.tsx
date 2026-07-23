// "use client";

// import dayjs from "dayjs";
// import { Button, Card, Col, Modal, Row, Space, Tag, Typography } from "antd";
// import {
//   Building2,
//   CalendarClock,
//   CalendarDays,
//   Clock3,
//   DoorOpen,
//   Hash,
//   Stethoscope,
//   Users,
//   X,
// } from "lucide-react";
// import type {
//   DoctorShiftItem,
//   DoctorShiftStatus,
// } from "@/management/features/doctor-shifts/doctor-shifts.types";

// const { Title } = Typography;

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

// function formatDateTime(value?: string) {
//   if (!value) return "Chưa cập nhật";
//   const date = dayjs(value);
//   return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : value;
// }

// function InfoItem({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value?: React.ReactNode;
// }) {
//   return (
//     <div className="h-full rounded-lg border border-slate-200 bg-white p-3">
//       <div className="flex items-start gap-3">
//         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
//           {icon}
//         </div>
//         <div className="min-w-0">
//           <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
//             {label}
//           </p>
//           <div className="break-words text-sm font-medium text-slate-900">
//             {value || "Chưa cập nhật"}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// type DoctorShiftDetailModalProps = {
//   open: boolean;
//   shift: DoctorShiftItem | null;
//   facilityName?: string;
//   roomName?: string;
//   onClose: () => void;
//   onEdit?: (shift: DoctorShiftItem) => void;
// };

// export function DoctorShiftDetailModal({
//   open,
//   shift,
//   facilityName,
//   roomName,
//   onClose,
//   onEdit,
// }: DoctorShiftDetailModalProps) {
//   return (
//     <Modal
//       open={open}
//       width={860}
//       centered
//       title={null}
//       closable={false}
//       onCancel={onClose}
//       footer={
//         <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
//           {shift && onEdit ? (
//             <Button
//               onClick={() => {
//                 onClose();
//                 onEdit(shift);
//               }}
//             >
//               Chỉnh sửa
//             </Button>
//           ) : null}
//           <Button
//             type="primary"
//             icon={<X className="h-4 w-4" />}
//             onClick={onClose}
//           >
//             Đóng
//           </Button>
//         </div>
//       }
//     >
//       {shift ? (
//         <div className="space-y-4">
//           <div className="border-b border-slate-200 pb-4">
//             <div className="flex min-w-0 items-start gap-4">
//               <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
//                 <Clock3 className="h-6 w-6" />
//               </div>
//               <div className="min-w-0">
//                 <Title level={3} className="!mb-1 !text-slate-950">
//                   Ca trực bác sĩ #{shift.doctorId}
//                 </Title>
//                 <Space size={8} wrap>
//                   <Tag color="blue">#{shift.id}</Tag>
//                   <Tag color={statusColor(shift.status)}>
//                     {STATUS_TEXT[shift.status]}
//                   </Tag>
//                 </Space>
//               </div>
//             </div>
//           </div>

//           <Card
//             size="small"
//             className="border-slate-200"
//             title="Thông tin ca trực"
//           >
//             <Row gutter={[12, 12]}>
//               <Col xs={24} md={8}>
//                 <InfoItem
//                   icon={<Stethoscope className="h-4 w-4" />}
//                   label="Doctor ID"
//                   value={shift.doctorId}
//                 />
//               </Col>
//               <Col xs={24} md={8}>
//                 <InfoItem
//                   icon={<Building2 className="h-4 w-4" />}
//                   label="Cơ sở"
//                   value={facilityName ?? `Cơ sở #${shift.facilityId}`}
//                 />
//               </Col>
//               <Col xs={24} md={8}>
//                 <InfoItem
//                   icon={<DoorOpen className="h-4 w-4" />}
//                   label="Phòng"
//                   value={
//                     roomName ??
//                     (shift.roomId ? `Phòng #${shift.roomId}` : undefined)
//                   }
//                 />
//               </Col>
//               <Col xs={24} md={8}>
//                 <InfoItem
//                   icon={<CalendarDays className="h-4 w-4" />}
//                   label="Ngày trực"
//                   value={dayjs(shift.shiftDate).format("DD/MM/YYYY")}
//                 />
//               </Col>
//               <Col xs={24} md={8}>
//                 <InfoItem
//                   icon={<Clock3 className="h-4 w-4" />}
//                   label="Thời gian"
//                   value={`${shift.startTime} - ${shift.endTime}`}
//                 />
//               </Col>
//               <Col xs={24} md={8}>
//                 <InfoItem
//                   icon={<Users className="h-4 w-4" />}
//                   label="Số lịch tối đa"
//                   value={shift.maxAppointments}
//                 />
//               </Col>
//               <Col xs={24} md={12}>
//                 <InfoItem
//                   icon={<CalendarClock className="h-4 w-4" />}
//                   label="Ngày tạo"
//                   value={formatDateTime(shift.createdAt)}
//                 />
//               </Col>
//               <Col xs={24} md={12}>
//                 <InfoItem
//                   icon={<CalendarClock className="h-4 w-4" />}
//                   label="Cập nhật lần cuối"
//                   value={formatDateTime(shift.updatedAt)}
//                 />
//               </Col>
//               <Col xs={24}>
//                 <InfoItem
//                   icon={<Hash className="h-4 w-4" />}
//                   label="Mã ca trực"
//                   value={shift.id}
//                 />
//               </Col>
//             </Row>
//           </Card>
//         </div>
//       ) : null}
//     </Modal>
//   );
// }
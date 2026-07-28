// "use client";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import {
//   Alert,
//   Badge,
//   Button,
//   Collapse,
//   Empty,
//   Modal,
//   Tag,
//   Typography,
// } from "antd";
// import {
//   Building2,
//   DoorOpen,
// } from "lucide-react";
// import {
//   getRoomsGroupedByFacilities,
// } from "@/management/features/rooms/rooms.api";
// import type {
//   RoomsByFacility,
// } from "@/management/features/rooms/rooms.types";

// const { Text } = Typography;

// type RoomFacilityOverviewModalProps = {
//   open: boolean;
//   onClose: () => void;
//   onSelectRoom: (
//     roomId: string,
//   ) => void;
// };

// export function RoomFacilityOverviewModal({
//   open,
//   onClose,
//   onSelectRoom,
// }: RoomFacilityOverviewModalProps) {
//   const [groups, setGroups] = useState<
//     RoomsByFacility[]
//   >([]);
//   const [loading, setLoading] =
//     useState(false);
//   const [error, setError] = useState<
//     string | null
//   >(null);

//   useEffect(() => {
//     if (!open) return;

//     let cancelled = false;

//     const timer = window.setTimeout(() => {
//       setLoading(true);
//       setError(null);

//       void getRoomsGroupedByFacilities()
//         .then((data) => {
//           if (!cancelled) {
//             setGroups(data);
//           }
//         })
//         .catch((loadError) => {
//           if (!cancelled) {
//             setError(
//               loadError instanceof Error
//                 ? loadError.message
//                 : "Không tải được tổng quan phòng theo cơ sở.",
//             );
//           }
//         })
//         .finally(() => {
//           if (!cancelled) {
//             setLoading(false);
//           }
//         });
//     }, 0);

//     return () => {
//       cancelled = true;
//       window.clearTimeout(timer);
//     };
//   }, [open]);

//   const totals = useMemo(
//     () => ({
//       facilities: groups.length,
//       rooms: groups.reduce(
//         (sum, group) =>
//           sum + group.rooms.length,
//         0,
//       ),
//     }),
//     [groups],
//   );

//   return (
//     <Modal
//       open={open}
//       centered
//       width={860}
//       title="Tổng quan phòng theo cơ sở"
//       footer={
//         <Button onClick={onClose}>
//           Đóng
//         </Button>
//       }
//       onCancel={onClose}
//       mask={{
//         closable: !loading,
//       }}
//       className="room-facility-overview-modal [&_.ant-modal-content]:overflow-hidden"
//       style={{
//         maxWidth: "calc(100vw - 32px)",
//       }}
//       styles={{
//         body: {
//           width: "100%",
//           minWidth: 0,
//           overflowX: "hidden",
//         },
//       }}
//     >
//       <div className="w-full min-w-0">
//         <div className="mb-4 flex flex-wrap gap-3">
//           <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm">
//           <span className="text-slate-500">
//             Cơ sở:
//           </span>{" "}
//           <strong>
//             {totals.facilities}
//           </strong>
//         </div>

//         <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm">
//           <span className="text-slate-500">
//             Phòng:
//           </span>{" "}
//           <strong>{totals.rooms}</strong>
//           </div>
//         </div>

//         {error ? (
//         <Alert
//           type="error"
//           title={error}
//           showIcon
//           className="mb-4"
//         />
//       ) : null}

//       {groups.length === 0 &&
//       !loading ? (
//         <Empty
//           image={
//             Empty.PRESENTED_IMAGE_SIMPLE
//           }
//           description="Chưa có dữ liệu phòng theo cơ sở."
//         />
//         ) : (
//           <div
//             className="max-h-[520px] w-full min-w-0 overflow-y-auto overflow-x-hidden pr-1"
//           style={{
//             scrollbarGutter: "stable",
//           }}
//         >
//             <Collapse
//               className="w-full min-w-0"
//               items={groups.map((group) => ({
//                 key: group.facility.id,
//             label: (
//               <div className="flex items-center justify-between gap-3 pr-3">
//                 <div className="flex min-w-0 items-center gap-2">
//                   <Building2 className="h-4 w-4 shrink-0 text-slate-500" />

//                   <span className="truncate font-medium">
//                     {group.facility.name}
//                   </span>

//                   <Text
//                     type="secondary"
//                     className="truncate text-xs"
//                   >
//                     {group.facility.code}
//                   </Text>
//                 </div>

//                 <Badge
//                   count={
//                     group.rooms.length
//                   }
//                   showZero
//                 />
//               </div>
//             ),
//             children: (
//               <div className="grid min-w-0 gap-2 overflow-hidden">
//                 {group.rooms.map((room) => (
//                   <button
//                     key={room.id}
//                     type="button"
//                     className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
//                     onClick={() =>
//                       onSelectRoom(room.id)
//                     }
//                   >
//                     <div className="flex min-w-0 items-center gap-3">
//                       <DoorOpen className="h-4 w-4 shrink-0 text-slate-500" />

//                       <div className="min-w-0">
//                         <p className="mb-0 truncate font-medium text-slate-900">
//                           {room.roomName}
//                         </p>

//                         <p className="mb-0 truncate text-xs text-slate-500">
//                           {room.roomTypeName} ·{" "}
//                           {room.floor}
//                         </p>
//                       </div>
//                     </div>

//                     {room.status ===
//                     "active" ? (
//                       <Tag color="green">
//                         Hoạt động
//                       </Tag>
//                     ) : (
//                       <Tag>
//                         Ngừng hoạt động
//                       </Tag>
//                     )}
//                   </button>
//                 ))}
//               </div>
//             ),
//               }))}
//             />
//           </div>
//         )}
//       </div>
//     </Modal>
//   );
// }
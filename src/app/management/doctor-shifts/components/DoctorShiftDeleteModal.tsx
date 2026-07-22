// "use client";

// import { Button, Modal } from "antd";
// import { Trash2, X } from "lucide-react";
// import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";

// type Props = {
//   open: boolean;
//   shift: DoctorShiftItem | null;
//   loading: boolean;
//   onClose: () => void;
//   onConfirm: () => void | Promise<void>;
// };

// export function DoctorShiftDeleteModal({
//   open,
//   shift,
//   loading,
//   onClose,
//   onConfirm,
// }: Props) {
//   return (
//     <Modal
//       open={open}
//       centered
//       width={456}
//       title={null}
//       footer={null}
//       closable={false}
//       onCancel={onClose}
//       mask={{ closable: !loading }}
//       className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
//       styles={{ body: { padding: 0 } }}
//     >
//       <div className="relative px-6 pb-6 pt-7 text-center">
//         <button
//           type="button"
//           aria-label="Đóng"
//           onClick={onClose}
//           disabled={loading}
//           className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
//         >
//           <X className="h-5 w-5" />
//         </button>

//         <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
//           <Trash2 className="h-7 w-7 text-red-600" />
//         </div>

//         <h3 className="mt-5 text-lg font-bold text-slate-950">Xóa ca trực?</h3>
//         <p className="mt-2 text-sm text-slate-500">
//           Ca trực sẽ bị xóa khỏi lịch làm việc. Thao tác này không thể hoàn tác.
//         </p>

//         {shift ? (
//           <div className="mx-auto mt-4 max-w-[350px] rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
//             <p className="mb-0 font-semibold">Bác sĩ #{shift.doctorId}</p>
//             <p className="mb-0 mt-1">
//               {shift.shiftDate} · {shift.startTime} - {shift.endTime}
//             </p>
//           </div>
//         ) : null}

//         <div className="mt-6 grid grid-cols-2 gap-3">
//           <Button size="large" onClick={onClose} disabled={loading}>
//             Hủy
//           </Button>
//           <Button
//             danger
//             type="primary"
//             size="large"
//             loading={loading}
//             onClick={() => void onConfirm()}
//           >
//             Xóa ca trực
//           </Button>
//         </div>
//       </div>
//     </Modal>
//   );
// }

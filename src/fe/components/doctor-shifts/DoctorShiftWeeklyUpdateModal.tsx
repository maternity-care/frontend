"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  App,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Tag,
  Typography,
} from "antd";
import {
  Calendar,
  Clock,
  Copy,
  Save,
  X,
} from "lucide-react";
import {
  getAllDoctorShifts,
  getGroupedDoctorShifts,
  updateWeeklyDoctorShifts,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  DoctorShiftItem,
  WeeklyUpdateDoctorShiftsResponse,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import {
  getShiftSlotLookup,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlotLookupItem,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  addDaysToDateKey,
  formatIssueDate,
  getCurrentWeekDateRange,
} from "@/management/features/doctor-shifts/doctor-shifts.weekly-utils";
import {
  isRecord,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";
import {
  DoctorShiftWeeklyAssignments,
} from "./DoctorShiftWeeklyAssignments";
import {
  buildImportedWeekSlotGroups,
} from "@/management/features/doctor-shifts/doctor-shifts.import-week";
import {
  buildGroupsFromShifts,
  buildWeeklyUpdateInput,
  clearWeeklyUpdateDraft,
  mergeWeeklyUpdateDraftGroups,
  readWeeklyUpdateDraft,
  saveWeeklyUpdateDraft,
} from "@/management/features/doctor-shifts/doctor-shifts.weekly-update";
import type {
  WeeklyUpdateFormValues,
} from "@/management/features/doctor-shifts/doctor-shifts.weekly-update";
import {
  getErrorMessage,
} from "./doctor-shift-modal.shared";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "./doctor-shift-modal.shared";

const { Text, Title } = Typography;

type DoctorShiftWeeklyUpdateModalProps = {
  open: boolean;
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  onClose: () => void;
  onApplied: (range: { fromDate: string; toDate: string }) => Promise<void> | void;
};

export function DoctorShiftWeeklyUpdateModal({
  open,
  facilities,
  rooms,
  doctors,
  onClose,
  onApplied,
}: DoctorShiftWeeklyUpdateModalProps) {
  const {
    message: messageApi,
  } = App.useApp();
  const [form] =
    Form.useForm<WeeklyUpdateFormValues>();
  const [shiftSlots, setShiftSlots] =
    useState<ShiftSlotLookupItem[]>([]);
  const [slotsLoading, setSlotsLoading] =
    useState(false);
  const [importWeekLoading, setImportWeekLoading] =
    useState(false);
  const [savingDraft, setSavingDraft] =
    useState(false);
  const [applying, setApplying] =
    useState(false);
  const [targetShifts, setTargetShifts] =
    useState<DoctorShiftItem[]>([]);
  const [applyResult, setApplyResult] =
    useState<WeeklyUpdateDoctorShiftsResponse | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const pendingDraftRef =
    useRef<
      WeeklyUpdateFormValues | null
    >(null);

  const watchedFacilityId =
    Form.useWatch(
      "facilityId",
      form,
    ) ?? "";
  const watchedFromDate =
    Form.useWatch(
      "fromDate",
      form,
    ) ?? "";
  const watchedSlotGroups =
    Form.useWatch(
      "slotGroups",
      form,
    ) ?? [];

  const slotById = useMemo(
    () =>
      new Map(
        shiftSlots.map(
          (slot) => [
            slot.id,
            slot,
          ],
        ),
      ),
    [shiftSlots],
  );

  const roomOptions = useMemo(
    () =>
      rooms
        .filter(
          (room) =>
            String(
              room.facilityId,
            ) ===
            String(
              watchedFacilityId,
            ),
        )
        .map((room) => ({
          value: room.id,
          label: `${room.name}${
            room.floor
              ? ` · ${room.floor}`
              : ""
          }`,
        })),
    [rooms, watchedFacilityId],
  );

  const doctorOptions = useMemo(
    () =>
      doctors
        .filter(
          (doctor) =>
            doctor.status ===
              "active" &&
            doctor.staffId &&
            doctor.roleId &&
            doctor.facilityIds.includes(
              watchedFacilityId,
            ),
        )
        .map((doctor) => ({
          value:
            doctor.staffId,
          label: `${doctor.title} ${doctor.name} · ${doctor.specialty}`,
        })),
    [doctors, watchedFacilityId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const { dateFrom } =
      getCurrentWeekDateRange();
    const nextWeekStart = addDaysToDateKey(dateFrom, 7);
    const defaultFacilityId =
      facilities.length === 1
        ? facilities[0]?.id
        : undefined;
    const restoredDraft =
      defaultFacilityId
        ? readWeeklyUpdateDraft(
            defaultFacilityId,
            nextWeekStart,
          )
        : null;

    const timer =
      window.setTimeout(() => {
        pendingDraftRef.current =
          restoredDraft;
        form.resetFields();
        form.setFieldsValue({
          facilityId:
            defaultFacilityId,
          fromDate: nextWeekStart,
          slotGroups: [],
        });
        setShiftSlots([]);
        setTargetShifts([]);
        setApplyResult(null);
        setError(null);
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    facilities,
    form,
    open,
  ]);

  useEffect(() => {
    if (
      !open ||
      !watchedFacilityId ||
      !watchedFromDate
    ) {
      return;
    }

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setSlotsLoading(true);
        }

        const dateTo = addDaysToDateKey(watchedFromDate, 6);
        return Promise.all([
          getShiftSlotLookup({
            facilityId: watchedFacilityId,
            status: "active",
          }),
          getAllDoctorShifts({
            facilityId: watchedFacilityId,
            dateFrom: watchedFromDate,
            dateTo,
          }),
        ]);
      })
      .then(([slots, loadedTargetShifts]) => {
        if (cancelled) {
          return;
        }

        const dateTo =
          addDaysToDateKey(
            watchedFromDate,
            6,
          );
        const currentGroups =
          buildGroupsFromShifts(
            slots,
            loadedTargetShifts,
            doctors,
            watchedFacilityId,
            watchedFromDate,
            dateTo,
          );
        const slotGroups =
          mergeWeeklyUpdateDraftGroups(
            slots,
            currentGroups,
            pendingDraftRef.current,
          );

        setShiftSlots(slots);
        setTargetShifts(loadedTargetShifts);
        form.setFieldsValue({
          slotGroups,
        });
        pendingDraftRef.current =
          null;
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setShiftSlots([]);
        setTargetShifts([]);
        pendingDraftRef.current =
          null;
        form.setFieldsValue({
          slotGroups: [],
        });
        setError(
          getErrorMessage(
            loadError,
          ),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    doctors,
    form,
    open,
    watchedFacilityId,
    watchedFromDate,
  ]);

  async function handleImportCurrentWeek() {
    setError(null);

    if (!watchedFacilityId) {
      const warning = "Không xác định được cơ sở hiện tại.";
      setError(warning);
      messageApi.warning(warning);
      return;
    }

    const { dateFrom, dateTo } = getCurrentWeekDateRange();
    setImportWeekLoading(true);

    try {
      const schedule = await getGroupedDoctorShifts({
        facilityId: watchedFacilityId,
        dateFrom,
        dateTo,
        forTemplate: true,
      });

      const {
        slotGroups,
        importedAssignments,
        skippedGroups,
      } = buildImportedWeekSlotGroups({
        schedule,
        shiftSlots,
        rooms,
        doctors,
        facilityId: watchedFacilityId,
      });

      if (importedAssignments === 0) {
        const warning =
          `Không có lịch phù hợp trong tuần ${formatIssueDate(dateFrom)} - ${formatIssueDate(dateTo)}.`;
        setError(warning);
        messageApi.warning(warning);
        return;
      }

      const nextValues: WeeklyUpdateFormValues = {
        facilityId: watchedFacilityId,
        fromDate: watchedFromDate,
        slotGroups,
      };

      form.setFieldsValue(nextValues);
      saveWeeklyUpdateDraft(nextValues);

      const skippedMessage =
        skippedGroups > 0
          ? ` Bỏ qua ${skippedGroups} nhóm không còn hợp lệ.`
          : "";

      messageApi.success(
        `Đã lấy ${importedAssignments} phân công của tuần hiện tại.${skippedMessage}`,
      );
    } catch (importError) {
      const importMessage = getErrorMessage(importError);
      setError(importMessage);
      messageApi.error(importMessage);
    } finally {
      setImportWeekLoading(false);
    }
  }

  function handleCancel() {
    if (
      slotsLoading ||
      importWeekLoading ||
      savingDraft ||
      applying
    ) {
      return;
    }

    const currentValues =
      form.getFieldsValue(true);
    saveWeeklyUpdateDraft(currentValues);
    setError(null);
    onClose();
  }

  async function handleSaveDraft() {
    setError(null);
    setSavingDraft(true);

    try {
      const values =
        await form.validateFields();

      saveWeeklyUpdateDraft(values);
      messageApi.success(
        "Đã lưu bản nháp cập nhật lịch tuần. Chưa gọi API cập nhật.",
      );
      onClose();
    } catch (saveError) {
      if (
        !(
          isRecord(saveError) &&
          "errorFields" in saveError
        )
      ) {
        const saveMessage =
          getErrorMessage(
            saveError,
          );
        setError(saveMessage);
        messageApi.error(
          saveMessage,
        );
      }
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleApplyWeeklyUpdate() {
    setError(null);
    setApplyResult(null);
    setApplying(true);

    try {
      const values = await form.validateFields();
      const input = buildWeeklyUpdateInput(values, targetShifts, doctors);
      const result = await updateWeeklyDoctorShifts(input);

      setApplyResult(result);
      await onApplied({
        fromDate: values.fromDate,
        toDate: addDaysToDateKey(values.fromDate, 6),
      });

      if (result.blocked.length > 0) {
        saveWeeklyUpdateDraft(values);
        messageApi.warning(
          `Đã lưu các ca hợp lệ, còn ${result.blocked.length} ca cần xử lý riêng.`,
        );
        return;
      }

      clearWeeklyUpdateDraft(values.facilityId, values.fromDate);
      messageApi.success(
        `Đã cập nhật tuần: tạo ${result.summary.created}, sửa ${result.summary.updated}, xóa ${result.summary.removed}.`,
      );
      onClose();
    } catch (applyError) {
      if (!(isRecord(applyError) && "errorFields" in applyError)) {
        const applyMessage = getErrorMessage(applyError);
        setError(applyMessage);
        messageApi.error(applyMessage);
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <Modal
      open={open}
      centered
      width={1120}
      title={null}
      footer={null}
      closable={false}
      onCancel={handleCancel}
      mask={{
        closable:
          !slotsLoading &&
          !importWeekLoading &&
          !savingDraft &&
          !applying,
      }}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "82vh",
          overflow: "hidden",
        },
      }}
    >
      <div className="relative mb-5 border-b border-slate-200 pb-4 pr-12">
        <button
          type="button"
          aria-label="Đóng"
          disabled={
            slotsLoading ||
            importWeekLoading ||
            savingDraft ||
            applying
          }
          onClick={handleCancel}
          className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Calendar className="h-5 w-5" />
          </span>

          <div>
            <Title
              level={4}
              className="!mb-1 !text-slate-950"
            >
              Cập nhật lịch trực 1 tuần
            </Title>

            <Text type="secondary">
              Điều chỉnh bác sĩ theo từng khung ca, phòng và ngày làm việc của tuần hiện tại, từ Thứ 2 đến Chủ nhật.
            </Text>

            <Text
              type="secondary"
              className="mt-1 block text-xs"
            >
              Bản nháp được tự động lưu và sẽ được khôi phục khi mở lại.
            </Text>
          </div>
        </div>
      </div>

      <div
        className="pr-3"
        style={{
          maxHeight:
            "calc(82vh - 180px)",
          overflowY: "auto",
          scrollbarGutter:
            "stable",
        }}
      >
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            className="mb-4"
            onClose={() =>
              setError(null)
            }
          />
        ) : null}

        {applyResult?.blocked.length ? (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            title={`${applyResult.blocked.length} ca chưa được cập nhật`}
            description={applyResult.blocked.slice(0, 8).map((item) => (
              <div key={`${item.action}-${item.shiftId ?? item.index}`}>
                {item.shiftDate ? `${formatIssueDate(item.shiftDate)}: ` : ""}
                {item.reason}
              </div>
            ))}
          />
        ) : null}

        <Form<WeeklyUpdateFormValues>
          form={form}
          layout="vertical"
          requiredMark="optional"
          onValuesChange={(
            changedValues,
            allValues,
          ) => {
            setError(null);
            setApplyResult(null);

            if (
              "facilityId" in
              changedValues
            ) {
              const facilityId =
                changedValues.facilityId as string;

              setShiftSlots([]);
              setSlotsLoading(
                Boolean(facilityId),
              );
              form.setFieldsValue({
                slotGroups: [],
              });
            }

            saveWeeklyUpdateDraft(allValues);
          }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="facilityId"
                label="Cơ sở"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng chọn cơ sở.",
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  disabled={
                    facilities.length === 1
                  }
                  placeholder="Chọn cơ sở khám"
                  options={facilities.map(
                    (facility) => ({
                      value:
                        facility.id,
                      label: `${facility.name} (${facility.code})`,
                    }),
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                name="fromDate"
                label="Tuần được cập nhật"
                extra={
                  watchedFromDate
                    ? `Từ Thứ 2 ${formatIssueDate(
                        watchedFromDate,
                      )} đến Chủ nhật ${formatIssueDate(
                        addDaysToDateKey(
                          watchedFromDate,
                          6,
                        ),
                      )}.`
                    : "Hệ thống tự xác định tuần hiện tại."
                }
                rules={[
                  {
                    required: true,
                    message:
                      "Không xác định được tuần hiện tại.",
                  },
                ]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <Text
                strong
                className="block text-slate-950"
              >
                Phân công theo khung ca
              </Text>

              <Text
                type="secondary"
                className="text-sm"
              >
                Mỗi bác sĩ chọn phòng, các ngày làm việc trong tuần và số lịch tối đa.
              </Text>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={
                  <Copy className="h-4 w-4" />
                }
                loading={
                  importWeekLoading
                }
                disabled={
                  !watchedFacilityId ||
                  slotsLoading ||
                  savingDraft
                }
                onClick={() =>
                  void handleImportCurrentWeek()
                }
              >
                Lấy lịch tuần này
              </Button>

              {watchedFacilityId &&
              !slotsLoading ? (
                <Tag color="blue">
                  {shiftSlots.length} khung ca
                </Tag>
              ) : null}
            </div>
          </div>

          {!watchedFacilityId ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <Clock className="mx-auto h-7 w-7 text-slate-400" />

              <Text className="mt-3 block font-medium text-slate-700">
                Vui lòng chọn cơ sở
              </Text>

              <Text
                type="secondary"
                className="mt-1 block text-sm"
              >
                Các khung ca hoạt động của cơ sở sẽ hiển thị tại đây.
              </Text>
            </div>
          ) : slotsLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <Text type="secondary">
                Đang tải danh sách khung ca...
              </Text>
            </div>
          ) : shiftSlots.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              title="Cơ sở chưa có khung ca hoạt động"
            />
          ) : (
            <DoctorShiftWeeklyAssignments
            form={form}
            shiftSlots={shiftSlots}
            watchedSlotGroups={watchedSlotGroups}
            slotById={slotById}
            doctorOptions={doctorOptions}
            roomOptions={roomOptions}
            allowOffWithoutRoom
          />
          )}
        </Form>
      </div>

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
        <Button
          disabled={
            slotsLoading ||
            importWeekLoading ||
            savingDraft ||
            applying
          }
          onClick={handleCancel}
        >
          Hủy
        </Button>

        <Button
          type="primary"
          loading={savingDraft}
          disabled={
            slotsLoading ||
            importWeekLoading ||
            applying
          }
          icon={
            <Save className="h-4 w-4" />
          }
          onClick={() =>
            void handleSaveDraft()
          }
        >
          Lưu bản nháp
        </Button>
        <Button
          type="primary"
          loading={applying}
          disabled={slotsLoading || importWeekLoading || savingDraft}
          onClick={() => void handleApplyWeeklyUpdate()}
        >
          Áp dụng cập nhật
        </Button>
      </div>
    </Modal>
  );
}
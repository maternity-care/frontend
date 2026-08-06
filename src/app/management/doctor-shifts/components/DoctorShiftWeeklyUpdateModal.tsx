"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  App,
  Button,
  Checkbox,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Tag,
  Typography,
} from "antd";
import {
  CalendarClock,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type {
  DoctorShiftItem,
  DoctorShiftStatus,
  DoctorShiftWorkingDay,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "./doctor-shift-modal.shared";

const { Text, Title } = Typography;

const CURRENT_WEEK_UPDATE_DRAFT_PREFIX =
  "management-doctor-shifts-current-week-update-draft:v1";

const WORKING_DAY_OPTIONS: Array<{
  label: string;
  value: DoctorShiftWorkingDay;
}> = [
  {
    label: "Thứ 2",
    value: "MON",
  },
  {
    label: "Thứ 3",
    value: "TUE",
  },
  {
    label: "Thứ 4",
    value: "WED",
  },
  {
    label: "Thứ 5",
    value: "THU",
  },
  {
    label: "Thứ 6",
    value: "FRI",
  },
  {
    label: "Thứ 7",
    value: "SAT",
  },
  {
    label: "Chủ nhật",
    value: "SUN",
  },
];

const STATUS_OPTIONS: Array<{
  label: string;
  value: DoctorShiftStatus;
}> = [
  {
    label: "Còn trống",
    value: "available",
  },
  {
    label: "Đã đầy",
    value: "full",
  },
  {
    label: "Đã hủy",
    value: "cancelled",
  },
  {
    label: "Nghỉ",
    value: "off",
  },
];

type WeeklyUpdateAssignment = {
  doctorId: string;
  roomId: string;
  workingDays: DoctorShiftWorkingDay[];
  maxAppointments: number;
  status: DoctorShiftStatus;
};

type WeeklyUpdateSlotGroup = {
  slotId: string;
  slotName: string;
  slotCode: string;
  startTime: string;
  endTime: string;
  assignments: WeeklyUpdateAssignment[];
};

type WeeklyUpdateFormValues = {
  facilityId: string;
  fromDate: string;
  slotGroups: WeeklyUpdateSlotGroup[];
};

type WeeklyUpdateDraft = {
  version: 1;
  savedAt: string;
  values: WeeklyUpdateFormValues;
};

type DoctorShiftWeeklyUpdateModalProps = {
  open: boolean;
  shifts: DoctorShiftItem[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  onClose: () => void;
};

type LockedValueInputProps = {
  value?: string;
};

function LockedValueInput({
  value,
}: LockedValueInputProps) {
  return (
    <Input
      value={value ?? ""}
      readOnly
      disabled
    />
  );
}

function parseDateKey(value: string) {
  return new Date(
    `${value}T00:00:00`,
  );
}

function toDateKey(date: Date) {
  const year =
    date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(
  value: string,
  amount: number,
) {
  const date =
    parseDateKey(value);

  date.setDate(
    date.getDate() + amount,
  );

  return toDateKey(date);
}

function getCurrentWeekMondayDateKey() {
  const date = new Date();
  const currentDay =
    date.getDay();
  const distanceFromMonday =
    currentDay === 0
      ? 6
      : currentDay - 1;

  date.setDate(
    date.getDate() -
      distanceFromMonday,
  );

  return toDateKey(date);
}

function formatDateKey(
  value?: string,
) {
  if (!value) {
    return "";
  }

  const [year, month, day] =
    value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

function getWorkingDay(
  value: string,
): DoctorShiftWorkingDay {
  const day =
    parseDateKey(value).getDay();

  const map: Record<
    number,
    DoctorShiftWorkingDay
  > = {
    0: "SUN",
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: "SAT",
  };

  return map[day] ?? "MON";
}

function getStatusLabel(
  status: DoctorShiftStatus,
) {
  return (
    STATUS_OPTIONS.find(
      (item) =>
        item.value === status,
    )?.label ?? status
  );
}

function getStatusColor(
  status: DoctorShiftStatus,
) {
  if (
    status === "available"
  ) {
    return "green";
  }

  if (status === "full") {
    return "blue";
  }

  if (
    status === "cancelled"
  ) {
    return "red";
  }

  return "default";
}

function getDraftStorageKey(
  facilityId: string,
  fromDate: string,
) {
  return `${CURRENT_WEEK_UPDATE_DRAFT_PREFIX}:${facilityId}:${fromDate}`;
}

function readDraft(
  facilityId: string,
  fromDate: string,
): WeeklyUpdateFormValues | null {
  if (
    typeof window ===
      "undefined" ||
    !facilityId ||
    !fromDate
  ) {
    return null;
  }

  try {
    const rawValue =
      window.localStorage.getItem(
        getDraftStorageKey(
          facilityId,
          fromDate,
        ),
      );

    if (!rawValue) {
      return null;
    }

    const parsed =
      JSON.parse(
        rawValue,
      ) as WeeklyUpdateDraft;

    if (
      parsed.version !== 1 ||
      parsed.values
        .facilityId !==
        facilityId ||
      parsed.values.fromDate !==
        fromDate ||
      !Array.isArray(
        parsed.values
          .slotGroups,
      )
    ) {
      return null;
    }

    return parsed.values;
  } catch {
    return null;
  }
}

function saveDraft(
  values: WeeklyUpdateFormValues,
) {
  if (
    typeof window ===
      "undefined" ||
    !values.facilityId ||
    !values.fromDate
  ) {
    return;
  }

  const draft: WeeklyUpdateDraft = {
    version: 1,
    savedAt:
      new Date().toISOString(),
    values,
  };

  window.localStorage.setItem(
    getDraftStorageKey(
      values.facilityId,
      values.fromDate,
    ),
    JSON.stringify(draft),
  );
}

function buildCurrentWeekGroups(
  shifts: DoctorShiftItem[],
  facilityId: string,
  fromDate: string,
): WeeklyUpdateSlotGroup[] {
  const toDate =
    addDaysToDateKey(
      fromDate,
      6,
    );

  const facilityShifts =
    shifts.filter(
      (shift) =>
        String(
          shift.facilityId,
        ) ===
        facilityId,
    );

  const slotDefinitions =
    new Map<
      string,
      Omit<
        WeeklyUpdateSlotGroup,
        "assignments"
      >
    >();

  for (
    const shift of facilityShifts
  ) {
    if (!shift.slotId) {
      continue;
    }

    if (
      !slotDefinitions.has(
        shift.slotId,
      )
    ) {
      slotDefinitions.set(
        shift.slotId,
        {
          slotId:
            shift.slotId,
          slotName:
            shift.slotName ||
            shift.slotCode ||
            "Khung ca",
          slotCode:
            shift.slotCode ||
            "",
          startTime:
            shift.startTime,
          endTime:
            shift.endTime,
        },
      );
    }
  }

  const currentWeekShifts =
    facilityShifts.filter(
      (shift) =>
        shift.shiftDate >=
          fromDate &&
        shift.shiftDate <=
          toDate,
    );

  const assignmentsBySlot =
    new Map<
      string,
      Map<
        string,
        WeeklyUpdateAssignment
      >
    >();

  for (
    const shift of
      currentWeekShifts
  ) {
    if (!shift.slotId) {
      continue;
    }

    const assignmentKey = [
      shift.doctorId,
      shift.roomId,
      shift.maxAppointments,
      shift.status,
    ].join("|");

    const slotAssignments =
      assignmentsBySlot.get(
        shift.slotId,
      ) ??
      new Map<
        string,
        WeeklyUpdateAssignment
      >();

    const currentAssignment =
      slotAssignments.get(
        assignmentKey,
      );

    const workingDay =
      getWorkingDay(
        shift.shiftDate,
      );

    if (
      currentAssignment
    ) {
      if (
        !currentAssignment
          .workingDays.includes(
            workingDay,
          )
      ) {
        currentAssignment
          .workingDays.push(
            workingDay,
          );
      }
    } else {
      slotAssignments.set(
        assignmentKey,
        {
          doctorId:
            shift.doctorId,
          roomId:
            shift.roomId,
          workingDays: [
            workingDay,
          ],
          maxAppointments:
            shift.maxAppointments,
          status:
            shift.status,
        },
      );
    }

    assignmentsBySlot.set(
      shift.slotId,
      slotAssignments,
    );
  }

  return Array.from(
    slotDefinitions.values(),
  )
    .sort((left, right) =>
      left.startTime.localeCompare(
        right.startTime,
      ),
    )
    .map((slot) => ({
      ...slot,
      assignments:
        Array.from(
          assignmentsBySlot
            .get(
              slot.slotId,
            )
            ?.values() ?? [],
        ),
    }));
}

export function DoctorShiftWeeklyUpdateModal({
  open,
  shifts,
  facilities,
  rooms,
  doctors,
  onClose,
}: DoctorShiftWeeklyUpdateModalProps) {
  const {
    message: messageApi,
  } = App.useApp();
  const [form] =
    Form.useForm<WeeklyUpdateFormValues>();
  const [
    savingDraft,
    setSavingDraft,
  ] = useState(false);

  const facilityId =
    facilities[0]?.id ?? "";
  const fromDate =
    getCurrentWeekMondayDateKey();
  const toDate =
    addDaysToDateKey(
      fromDate,
      6,
    );

  const watchedFacilityId =
    Form.useWatch(
      "facilityId",
      form,
    ) ?? facilityId;

  const roomOptions =
    useMemo(
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
      [
        rooms,
        watchedFacilityId,
      ],
    );

  const doctorOptions =
    useMemo(
      () =>
        doctors
          .filter(
            (doctor) =>
              doctor.status ===
                "active" &&
              doctor.facilityIds.some(
                (
                  doctorFacilityId,
                ) =>
                  String(
                    doctorFacilityId,
                  ) ===
                  String(
                    watchedFacilityId,
                  ),
              ),
          )
          .map((doctor) => ({
            value:
              doctor.id,
            label: `${doctor.title} ${doctor.name} · ${doctor.specialty}`,
          })),
      [
        doctors,
        watchedFacilityId,
      ],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    const restoredDraft =
      readDraft(
        facilityId,
        fromDate,
      );

    const slotGroups =
      restoredDraft
        ?.slotGroups ??
      buildCurrentWeekGroups(
        shifts,
        facilityId,
        fromDate,
      );

    const timer =
      window.setTimeout(
        () => {
          form.resetFields();
          form.setFieldsValue({
            facilityId,
            fromDate,
            slotGroups,
          });
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    facilityId,
    form,
    fromDate,
    open,
    shifts,
  ]);

  function handleClose() {
    const values =
      form.getFieldsValue(
        true,
      );

    saveDraft(values);
    onClose();
  }

  async function handleSaveDraft() {
    setSavingDraft(true);

    try {
      const values =
        await form.validateFields();

      saveDraft(values);

      messageApi.success(
        "Đã lưu bản nháp cập nhật lịch tuần. Chưa gọi API.",
      );
      onClose();
    } finally {
      setSavingDraft(false);
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
      onCancel={
        handleClose
      }
      destroyOnHidden
      styles={{
        body: {
          maxHeight:
            "82vh",
          overflow:
            "hidden",
        },
      }}
    >
      <div className="relative mb-5 border-b border-slate-200 pb-4 pr-12">
        <button
          type="button"
          aria-label="Đóng"
          onClick={
            handleClose
          }
          className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <CalendarClock className="h-5 w-5" />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Title
                level={4}
                className="!mb-1 !text-slate-950"
              >
                Cập nhật lịch tuần hiện tại
              </Title>

              <Tag color="orange">
                Chưa kết nối API
              </Tag>
            </div>

            <Text type="secondary">
              Điều chỉnh phân công từ Thứ 2{" "}
              {formatDateKey(
                fromDate,
              )}{" "}
              đến Chủ nhật{" "}
              {formatDateKey(
                toDate,
              )}.
            </Text>

            <Text
              type="secondary"
              className="mt-1 block text-xs"
            >
              Dữ liệu thay đổi được tự động lưu nháp trên trình duyệt.
            </Text>
          </div>
        </div>
      </div>

      <div
        className="pr-3"
        style={{
          maxHeight:
            "calc(82vh - 180px)",
          overflowY:
            "auto",
          scrollbarGutter:
            "stable",
        }}
      >
        <Form<WeeklyUpdateFormValues>
          form={form}
          layout="vertical"
          requiredMark="optional"
          onValuesChange={(
            _changedValues,
            allValues,
          ) => {
            saveDraft(
              allValues,
            );
          }}
        >
          <Row gutter={[16, 0]}>
            <Col
              xs={24}
              lg={12}
            >
              <Form.Item
                name="facilityId"
                label="Cơ sở"
                rules={[
                  {
                    required:
                      true,
                    message:
                      "Không xác định được cơ sở.",
                  },
                ]}
              >
                <Select
                  disabled
                  options={facilities.map(
                    (
                      facility,
                    ) => ({
                      value:
                        facility.id,
                      label: `${facility.name} (${facility.code})`,
                    }),
                  )}
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              lg={12}
            >
              <Form.Item
                name="fromDate"
                label="Tuần hiện tại"
              >
                <LockedValueInput
                  value={`${formatDateKey(
                    fromDate,
                  )} - ${formatDateKey(
                    toDate,
                  )}`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.List name="slotGroups">
            {(slotFields) => (
              <div className="flex flex-col gap-4">
                {slotFields.length ===
                0 ? (
                  <Empty
                    image={
                      Empty.PRESENTED_IMAGE_SIMPLE
                    }
                    description="Chưa có khung ca để cập nhật trong cơ sở này."
                  />
                ) : (
                  slotFields.map(
                    (
                      slotField,
                      slotIndex,
                    ) => {
                      const slotGroup =
                        form.getFieldValue([
                          "slotGroups",
                          slotIndex,
                        ]) as
                          | WeeklyUpdateSlotGroup
                          | undefined;

                      return (
                        <div
                          key={
                            slotField.key
                          }
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <Text strong>
                                {slotGroup?.slotName ||
                                  "Khung ca"}
                              </Text>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {slotGroup?.slotCode ? (
                                  <Tag>
                                    {
                                      slotGroup.slotCode
                                    }
                                  </Tag>
                                ) : null}

                                <Tag color="blue">
                                  {slotGroup?.startTime ||
                                    "--:--"}{" "}
                                  -{" "}
                                  {slotGroup?.endTime ||
                                    "--:--"}
                                </Tag>
                              </div>
                            </div>

                            <Text type="secondary">
                              Chỉnh phân công theo ngày trong tuần
                            </Text>
                          </div>

                          <Form.Item
                            name={[
                              slotField.name,
                              "slotId",
                            ]}
                            hidden
                          >
                            <Input />
                          </Form.Item>

                          <Form.Item
                            name={[
                              slotField.name,
                              "slotName",
                            ]}
                            hidden
                          >
                            <Input />
                          </Form.Item>

                          <Form.Item
                            name={[
                              slotField.name,
                              "slotCode",
                            ]}
                            hidden
                          >
                            <Input />
                          </Form.Item>

                          <Form.Item
                            name={[
                              slotField.name,
                              "startTime",
                            ]}
                            hidden
                          >
                            <Input />
                          </Form.Item>

                          <Form.Item
                            name={[
                              slotField.name,
                              "endTime",
                            ]}
                            hidden
                          >
                            <Input />
                          </Form.Item>

                          <div className="p-4">
                            <Form.List
                              name={[
                                slotField.name,
                                "assignments",
                              ]}
                            >
                              {(
                                assignmentFields,
                                {
                                  add,
                                  remove,
                                },
                              ) => (
                                <div className="flex flex-col gap-4">
                                  {assignmentFields.map(
                                    (
                                      assignmentField,
                                      assignmentIndex,
                                    ) => (
                                      <div
                                        key={
                                          assignmentField.key
                                        }
                                        className="rounded-xl border border-slate-200 p-4"
                                      >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2">
                                            <Text strong>
                                              Phân công{" "}
                                              {assignmentIndex +
                                                1}
                                            </Text>

                                            <Form.Item
                                              noStyle
                                              shouldUpdate
                                            >
                                              {() => {
                                                const status =
                                                  form.getFieldValue([
                                                    "slotGroups",
                                                    slotIndex,
                                                    "assignments",
                                                    assignmentIndex,
                                                    "status",
                                                  ]) as
                                                    | DoctorShiftStatus
                                                    | undefined;

                                                return status ? (
                                                  <Tag
                                                    color={getStatusColor(
                                                      status,
                                                    )}
                                                  >
                                                    {getStatusLabel(
                                                      status,
                                                    )}
                                                  </Tag>
                                                ) : null;
                                              }}
                                            </Form.Item>
                                          </div>

                                          <Button
                                            danger
                                            type="text"
                                            icon={
                                              <Trash2 className="h-4 w-4" />
                                            }
                                            onClick={() =>
                                              remove(
                                                assignmentField.name,
                                              )
                                            }
                                          >
                                            Xóa
                                          </Button>
                                        </div>

                                        <Row
                                          gutter={[
                                            16,
                                            0,
                                          ]}
                                        >
                                          <Col
                                            xs={
                                              24
                                            }
                                            lg={
                                              12
                                            }
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "doctorId",
                                              ]}
                                              label="Bác sĩ"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn bác sĩ.",
                                                },
                                              ]}
                                            >
                                              <Select
                                                showSearch
                                                optionFilterProp="label"
                                                placeholder="Chọn bác sĩ"
                                                options={
                                                  doctorOptions
                                                }
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col
                                            xs={
                                              24
                                            }
                                            lg={
                                              12
                                            }
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "roomId",
                                              ]}
                                              label="Phòng"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn phòng.",
                                                },
                                              ]}
                                            >
                                              <Select
                                                showSearch
                                                optionFilterProp="label"
                                                placeholder="Chọn phòng"
                                                options={
                                                  roomOptions
                                                }
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col
                                            xs={
                                              24
                                            }
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "workingDays",
                                              ]}
                                              label="Ngày trực"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn ít nhất một ngày trực.",
                                                },
                                              ]}
                                            >
                                              <Checkbox.Group
                                                options={
                                                  WORKING_DAY_OPTIONS
                                                }
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col
                                            xs={
                                              24
                                            }
                                            md={
                                              12
                                            }
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "maxAppointments",
                                              ]}
                                              label="Số lịch tối đa"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Nhập số lịch tối đa.",
                                                },
                                              ]}
                                            >
                                              <InputNumber
                                                min={
                                                  1
                                                }
                                                max={
                                                  100
                                                }
                                                precision={
                                                  0
                                                }
                                                className="w-full"
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col
                                            xs={
                                              24
                                            }
                                            md={
                                              12
                                            }
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "status",
                                              ]}
                                              label="Trạng thái"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn trạng thái.",
                                                },
                                              ]}
                                            >
                                              <Select
                                                options={
                                                  STATUS_OPTIONS
                                                }
                                              />
                                            </Form.Item>
                                          </Col>
                                        </Row>
                                      </div>
                                    ),
                                  )}

                                  <Button
                                    block
                                    icon={
                                      <Plus className="h-4 w-4" />
                                    }
                                    onClick={() =>
                                      add({
                                        doctorId:
                                          "",
                                        roomId:
                                          "",
                                        workingDays:
                                          [
                                            "MON",
                                            "TUE",
                                            "WED",
                                            "THU",
                                            "FRI",
                                          ],
                                        maxAppointments:
                                          8,
                                        status:
                                          "available",
                                      })
                                    }
                                  >
                                    Thêm bác sĩ vào{" "}
                                    {slotGroup?.slotName ||
                                      "khung ca"}
                                  </Button>
                                </div>
                              )}
                            </Form.List>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            )}
          </Form.List>
        </Form>
      </div>

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
        <Button
          disabled={
            savingDraft
          }
          onClick={
            handleClose
          }
        >
          Đóng
        </Button>

        <Button
          type="primary"
          loading={
            savingDraft
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
      </div>
    </Modal>
  );
}

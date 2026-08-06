"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Award,
  Building2,
  DoorOpen,
  Mail,
  Pencil,
  Phone,
  Save,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { ApiClientError } from "@/lib/axios";
import {
  getRoomTypeLookup,
} from "@/management/features/rooms/rooms.api";
import type {
  RoomType,
} from "@/management/features/rooms/rooms.types";
import {
  createDoctor,
  updateDoctor,
} from "@/management/features/doctors/doctors.api";
import type {
  CreateDoctorInput,
  Doctor,
  DoctorStatus,
  UpdateDoctorInput,
} from "@/management/features/doctors/doctors.types";
import { getStaffsPage } from "@/management/features/staffs/staffs.api";
import type { Staff } from "@/management/features/staffs/staffs.types";

const { Text, Title } = Typography;

export const doctorStatusOptions = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

type DoctorFormValues = {
  name?: string;
  personalEmail?: string;
  phone?: string;
  address?: string;
  facilityIds?: string[];
  staffId?: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  workingRoomTypeId: string;
  bio?: string;
  status?: DoctorStatus;
};

type DoctorFormModalProps = {
  open: boolean;
  editingDoctor: Doctor | null;
  onClose: () => void;
  onSaved?: (
    doctor: Doctor,
    mode: "create" | "update",
  ) => void;
};

const createInitialValues: Partial<DoctorFormValues> = {
  name: "",
  personalEmail: "",
  phone: "",
  address: "",
  facilityIds: [],
  licenseNo: "",
  title: "",
  specialty: "",
  yearsOfExperience: 0,
  workingRoomTypeId: "",
  bio: "",
  status: "active",
};

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields = response?.data?.errors?.fields;

    if (Array.isArray(fields) && fields.length > 0) {
      return fields.join(", ");
    }

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="flex gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="mt-0.5 text-slate-400">{icon}</div>

      <div className="min-w-0">
        <p className="mb-0 text-[11px] font-semibold uppercase text-slate-400">
          {label}
        </p>

        <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </div>
      </div>
    </div>
  );
}

export function DoctorFormModal({
  open,
  editingDoctor,
  onClose,
  onSaved,
}: DoctorFormModalProps) {
  const [form] = Form.useForm<DoctorFormValues>();
  const { message: messageApi } = App.useApp();

  const [submitting, setSubmitting] = useState(false);
  const facilityOptions: Array<{ value: string; label: string }> = [];
  const facilitiesLoading = false;
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [roomTypes, setRoomTypes] =
    useState<RoomType[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] =
    useState(true);

  const roomTypeOptions = useMemo(
    () => {
      const options = roomTypes.map(
        (roomType) => ({
          value: roomType.id,
          label: `${roomType.name}${
            roomType.code
              ? ` (${roomType.code})`
              : ""
          }`,
        }),
      );

      const currentId =
        editingDoctor?.workingRoomTypeId;

      if (
        currentId &&
        !options.some(
          (option) =>
            option.value === currentId,
        )
      ) {
        options.push({
          value: currentId,
          label: `Loại phòng #${currentId}`,
        });
      }

      return options;
    },
    [editingDoctor, roomTypes],
  );

  const name = Form.useWatch("name", form);
  const personalEmail = Form.useWatch(
    "personalEmail",
    form,
  );
  const phone = Form.useWatch("phone", form);
  const address = Form.useWatch("address", form);
  const facilityIds: string[] = [];
  const staffId = Form.useWatch("staffId", form);
  const licenseNo = Form.useWatch("licenseNo", form);
  const title = Form.useWatch("title", form);
  const specialty = Form.useWatch(
    "specialty",
    form,
  );
  const yearsOfExperience = Form.useWatch(
    "yearsOfExperience",
    form,
  );
  const workingRoomTypeId = Form.useWatch(
    "workingRoomTypeId",
    form,
  );
  const status = Form.useWatch("status", form);

  const selectedStaff = useMemo(
    () =>
      staffOptions.find(
        (user) =>
          String(user.staffProfile?.staffId ?? user.id) ===
          String(staffId ?? ""),
      ) ?? null,
    [staffId, staffOptions],
  );

  const staffSelectOptions = useMemo(
    () =>
      staffOptions.map((user) => {
        const profile = user.staffProfile;
        const value = String(profile?.staffId ?? user.id);
        const employeeCode = profile?.employeeCode;
        const personalEmail =
          profile?.personalEmail ?? user.email;

        return {
          value,
          label: `${employeeCode ? `${employeeCode} - ` : ""}${user.name} (${personalEmail})`,
        };
      }),
    [staffOptions],
  );

  useEffect(() => {
    if (!open || editingDoctor) return;

    let cancelled = false;
    setStaffLoading(true);

    void getStaffsPage({
      status: "active",
      limit: 50,
    })
      .then((data) => {
        if (cancelled) return;

        setStaffOptions(
          data.users.filter(
            (user) => !user.staffProfile?.doctor,
          ),
        );
      })
      .catch((staffError) => {
        if (cancelled) return;

        setStaffOptions([]);
        void messageApi.error(
          staffError instanceof Error
            ? staffError.message
            : "Không tải được danh sách tài khoản staff.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setStaffLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editingDoctor, messageApi, open]);

  useEffect(() => {
    let cancelled = false;

    void getRoomTypeLookup({
      status: "active",
      limit: 50,
    })
      .then((data) => {
        if (!cancelled) {
          setRoomTypes(data);
        }
      })
      .catch((roomTypeError) => {
        if (cancelled) return;

        setRoomTypes([]);
        void messageApi.error(
          roomTypeError instanceof Error
            ? roomTypeError.message
            : "Không tải được danh sách loại phòng.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setRoomTypesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [messageApi]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      if (editingDoctor) {
        form.setFieldsValue({
          staffId: editingDoctor.staffId,
          name: editingDoctor.name,
          personalEmail:
            editingDoctor.personalEmail,
          phone: editingDoctor.phone,
          address: editingDoctor.address,
          licenseNo: editingDoctor.licenseNo,
          title: editingDoctor.title,
          specialty: editingDoctor.specialty,
          yearsOfExperience:
            editingDoctor.yearsOfExperience,
          workingRoomTypeId:
            editingDoctor.workingRoomTypeId ?? undefined,
          bio: editingDoctor.bio,
          status: editingDoctor.status,
        });

        return;
      }

      form.resetFields();
      form.setFieldsValue(createInitialValues);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, editingDoctor, form]);

  const isEditing = Boolean(editingDoctor);

  const modalTitle = isEditing
    ? "Cập nhật hồ sơ bác sĩ"
    : "Thêm bác sĩ";

  const modalDescription = isEditing
    ? "Chỉnh sửa thông tin chuyên môn, giấy phép hành nghề và trạng thái bác sĩ."
    : "Tạo tài khoản bác sĩ, phân công cơ sở và hoàn thiện hồ sơ chuyên môn.";

  const previewTitle = useMemo(() => {
    const normalizedTitle = title?.trim();
    const normalizedSpecialty =
      specialty?.trim();

    if (
      normalizedTitle &&
      normalizedSpecialty
    ) {
      return `${normalizedTitle} · ${normalizedSpecialty}`;
    }

    return (
      normalizedTitle ||
      normalizedSpecialty ||
      editingDoctor?.title ||
      "Bác sĩ mới"
    );
  }, [
    title,
    specialty,
    editingDoctor,
  ]);

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    onClose();
  }

  async function handleFinish(
    values: DoctorFormValues,
  ) {
    setSubmitting(true);

    try {
      if (editingDoctor) {
        const payload: UpdateDoctorInput = {
          staffId: values.staffId?.trim(),
          name: values.name?.trim(),
          personalEmail:
            values.personalEmail?.trim(),
          phone: values.phone?.trim(),
          address: values.address?.trim(),
          licenseNo: values.licenseNo.trim(),
          title: values.title.trim(),
          specialty: values.specialty.trim(),
          yearsOfExperience:
            values.yearsOfExperience,
          workingRoomTypeId:
            values.workingRoomTypeId.trim(),
          bio: values.bio?.trim() ?? "",
          status: values.status,
        };

        const response = await updateDoctor(
          editingDoctor.id,
          payload,
        );

        onSaved?.(response.data, "update");

        void messageApi.success(
          response.message ||
            "Cập nhật bác sĩ thành công.",
        );

        form.resetFields();
        onClose();
        return;
      }

      const payload: CreateDoctorInput = {
        staffId: values.staffId?.trim() ?? "",
        licenseNo: values.licenseNo.trim(),
        title: values.title.trim(),
        specialty: values.specialty.trim(),
        yearsOfExperience:
          values.yearsOfExperience,
        workingRoomTypeId:
          values.workingRoomTypeId.trim(),
        bio: values.bio?.trim() || undefined,
        status: "active",
      };

      const response =
        await createDoctor(payload);

      onSaved?.(response.data, "create");

      void messageApi.success(
        response.message ||
          "Tạo bác sĩ thành công.",
      );

      form.resetFields();
      onClose();
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.validationErrors.length > 0
      ) {
        const fieldNames = Object.keys(
          form.getFieldsValue(true),
        ) as Array<keyof DoctorFormValues>;

        const fieldErrors = fieldNames
          .map((fieldName) => ({
            name: fieldName,
            errors:
              error.validationErrors.filter(
                (validationMessage) =>
                  validationMessage.startsWith(
                    `${String(fieldName)} `,
                  ) ||
                  validationMessage.includes(
                    `property ${String(fieldName)} `,
                  ),
              ),
          }))
          .filter(
            (field) =>
              field.errors.length > 0,
          );

        if (fieldErrors.length > 0) {
          form.setFields(fieldErrors);
        }
      }

      void messageApi.error(
        getErrorMessage(error),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      width={1180}
      centered
      title={null}
      footer={null}
      onCancel={handleCancel}
      mask={{ closable: !submitting }}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "84vh",
          overflow: "hidden",
          paddingTop: 16,
          paddingBottom: 12,
        },
      }}
    >
      <div className="shrink-0 border-b border-slate-200 px-1 pb-2">
        <Title
          level={4}
          className="!mb-1 !text-slate-950"
        >
          {modalTitle}
        </Title>

        <Text className="text-sm text-slate-500">
          {modalDescription}
        </Text>
      </div>

      <Form
        key={
          editingDoctor?.id ??
          "create-doctor"
        }
        form={form}
        layout="vertical"
        initialValues={createInitialValues}
        onFinish={handleFinish}
        className="mt-3 flex max-h-[calc(84vh-94px)] flex-col"
        autoComplete="off"
        clearOnDestroy
      >
        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-3">
            {!isEditing ? (
              <Card
                size="small"
                className="border-slate-200"
                styles={{
                  header: {
                    padding: "8px 12px",
                    minHeight: 46,
                  },
                  body: {
                    padding: "10px 12px 0",
                  },
                }}
                title={
                  <Space size={10}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <UserRound className="h-4 w-4" />
                    </span>

                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Tài khoản staff
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Chọn tài khoản nhân viên để gắn hồ sơ bác sĩ.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Form.Item
                  name="staffId"
                  label="Tài khoản staff"
                  rules={[
                    {
                      required: true,
                      message:
                        "Vui lòng chọn tài khoản staff.",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    options={staffSelectOptions}
                    optionFilterProp="label"
                    placeholder="Chọn tài khoản staff"
                    loading={staffLoading}
                    notFoundContent="Chưa có tài khoản staff phù hợp"
                    onChange={(value) => {
                      const user =
                        staffOptions.find(
                          (item) =>
                            String(
                              item.staffProfile?.staffId ??
                                item.id,
                            ) === String(value),
                        ) ?? null;

                      form.setFieldsValue({
                        name: user?.name ?? "",
                        personalEmail:
                          user?.staffProfile?.personalEmail ??
                          user?.email ??
                          "",
                        phone: user?.phone ?? "",
                      });
                    }}
                  />
                </Form.Item>
              </Card>
            ) : null}

            {false ? (
              <Card
                size="small"
                className="border-slate-200"
                styles={{
                  header: {
                    padding: "8px 12px",
                    minHeight: 46,
                  },
                  body: {
                    padding: "10px 12px 0",
                  },
                }}
                title={
                  <Space size={10}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <UserRound className="h-4 w-4" />
                    </span>

                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Thông tin cá nhân
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Nhập họ tên, email và số điện thoại.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="name"
                      label="Họ tên"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng nhập họ tên.",
                        },
                        {
                          whitespace: true,
                          message:
                            "Họ tên không hợp lệ.",
                        },
                      ]}
                    >
                      <Input
                        placeholder="Ví dụ: Nguyễn Lan"
                        autoComplete="off"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="personalEmail"
                      label="Email cá nhân"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng nhập email.",
                        },
                        {
                          type: "email",
                          message:
                            "Email không hợp lệ.",
                        },
                      ]}
                    >
                      <Input
                        placeholder="doctor@example.com"
                        autoComplete="new-email"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="phone"
                      label="Số điện thoại"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng nhập số điện thoại.",
                        },
                        {
                          pattern:
                            /^(?:\+84|0)[35789]\d{8}$/,
                          message:
                            "Số điện thoại Việt Nam không hợp lệ.",
                        },
                      ]}
                    >
                      <Input
                        placeholder="0901234567"
                        inputMode="tel"
                        autoComplete="new-phone"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ) : null}

            {isEditing ? (
              <Card
                size="small"
                className="border-slate-200"
                styles={{
                  header: {
                    padding: "8px 12px",
                    minHeight: 46,
                  },
                  body: {
                    padding: "10px 12px 0",
                  },
                }}
                title={
                  <Space size={10}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <UserRound className="h-4 w-4" />
                    </span>

                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Thông tin cá nhân
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Cập nhật họ tên, email, số điện thoại và địa chỉ.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="name"
                      label="Họ tên"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng nhập họ tên.",
                        },
                        {
                          whitespace: true,
                          message:
                            "Họ tên không hợp lệ.",
                        },
                      ]}
                    >
                      <Input placeholder="Nhập họ tên" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="personalEmail"
                      label="Email cá nhân"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng nhập email.",
                        },
                        {
                          type: "email",
                          message:
                            "Email không hợp lệ.",
                        },
                      ]}
                    >
                      <Input placeholder="doctor@example.com" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="phone"
                      label="Số điện thoại"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng nhập số điện thoại.",
                        },
                        {
                          pattern:
                            /^(?:\+84|0)[35789]\d{8}$/,
                          message:
                            "Số điện thoại Việt Nam không hợp lệ.",
                        },
                      ]}
                    >
                      <Input
                        placeholder="0901234567"
                        inputMode="tel"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      name="address"
                      label="Địa chỉ"
                    >
                      <Input placeholder="Nhập địa chỉ" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ) : null}

            {false ? (
              <Card
                size="small"
                className="border-slate-200"
                styles={{
                  header: {
                    padding: "8px 12px",
                    minHeight: 46,
                  },
                  body: {
                    padding: "10px 12px 0",
                  },
                }}
                title={
                  <Space size={10}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Building2 className="h-4 w-4" />
                    </span>

                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Phân công cơ sở
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Chọn một hoặc nhiều cơ sở làm việc.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Form.Item
                  name="facilityIds"
                  label="Cơ sở làm việc"
                  rules={[
                    {
                      required: true,
                      type: "array",
                      min: 1,
                      message:
                        "Vui lòng chọn ít nhất một cơ sở.",
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    options={facilityOptions}
                    optionFilterProp="label"
                    placeholder="Chọn cơ sở làm việc"
                    maxTagCount="responsive"
                    loading={
                      facilitiesLoading
                    }
                  />
                </Form.Item>
              </Card>
            ) : null}

            <Card
              size="small"
              className="border-slate-200"
              styles={{
                header: {
                  padding: "8px 12px",
                  minHeight: 46,
                },
                body: {
                  padding: "12px 12px 0",
                },
              }}
              title={
                <Space size={10}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Stethoscope className="h-4 w-4" />
                  </span>

                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Hồ sơ chuyên môn
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Quản lý giấy phép, chuyên khoa và kinh nghiệm.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={[12, 0]}>
                {isEditing ? (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="staffId"
                      label="Staff ID"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng nhập Staff ID.",
                        },
                        {
                          whitespace: true,
                          message:
                            "Staff ID không hợp lệ.",
                        },
                      ]}
                    >
                      <Input placeholder="Nhập Staff ID" />
                    </Form.Item>
                  </Col>
                ) : null}

                <Col
                  xs={24}
                  md={isEditing ? 12 : 8}
                >
                  <Form.Item
                    name="licenseNo"
                    label="Số giấy phép hành nghề"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng nhập số giấy phép.",
                      },
                      {
                        whitespace: true,
                        message:
                          "Số giấy phép không hợp lệ.",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập số giấy phép" />
                  </Form.Item>
                </Col>

                <Col
                  xs={24}
                  md={isEditing ? 12 : 8}
                >
                  <Form.Item
                    name="title"
                    label="Học hàm / chức danh"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng nhập chức danh.",
                      },
                    ]}
                  >
                    <Input placeholder="BS. CKI, ThS.BS..." />
                  </Form.Item>
                </Col>

                <Col
                  xs={24}
                  md={isEditing ? 12 : 8}
                >
                  <Form.Item
                    name="specialty"
                    label="Chuyên khoa"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng nhập chuyên khoa.",
                      },
                    ]}
                  >
                    <Input placeholder="Sản phụ khoa" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="yearsOfExperience"
                    label="Số năm kinh nghiệm"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng nhập số năm kinh nghiệm.",
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={80}
                      precision={0}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="workingRoomTypeId"
                    label="Loại phòng làm việc"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng chọn loại phòng làm việc.",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={roomTypeOptions}
                      loading={roomTypesLoading}
                      placeholder="Chọn loại phòng làm việc"
                      notFoundContent="Chưa có loại phòng hoạt động"
                    />
                  </Form.Item>
                </Col>

                {isEditing ? (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="status"
                      label="Trạng thái"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng chọn trạng thái.",
                        },
                      ]}
                    >
                      <Select
                        options={
                          doctorStatusOptions
                        }
                      />
                    </Form.Item>
                  </Col>
                ) : null}

                <Col xs={24}>
                  <Form.Item
                    name="bio"
                    label="Giới thiệu chuyên môn"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Mô tả kinh nghiệm và thế mạnh chuyên môn của bác sĩ"
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-3 xl:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Stethoscope className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="mb-0 truncate text-base font-semibold text-slate-950">
                  {previewTitle}
                </p>

                <p className="mb-0 truncate text-sm text-slate-500">
                  {isEditing
                    ? `Staff ID: ${
                        staffId ||
                        editingDoctor?.staffId ||
                        "Chưa cập nhật"
                      }`
                    : personalEmail ||
                      selectedStaff?.staffProfile?.personalEmail ||
                      selectedStaff?.email ||
                      "Chưa có email"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Tag color="blue">
                Bác sĩ
              </Tag>

              {isEditing ? (
                <Tag
                  color={
                    status === "inactive"
                      ? "default"
                      : "green"
                  }
                >
                  {status === "inactive"
                    ? "Ngừng hoạt động"
                    : "Hoạt động"}
                </Tag>
              ) : (
                <Tag color="green">
                  Tài khoản mới
                </Tag>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {!isEditing ? (
                <>
                  <PreviewLine
                    icon={
                      <UserRound className="h-4 w-4" />
                    }
                    label="Họ tên"
                    value={name}
                  />

                  <PreviewLine
                    icon={
                      <Mail className="h-4 w-4" />
                    }
                    label="Email"
                    value={personalEmail}
                  />

                  <PreviewLine
                    icon={
                      <Phone className="h-4 w-4" />
                    }
                    label="Số điện thoại"
                    value={phone}
                  />

                  <PreviewLine
                    icon={
                      <Building2 className="h-4 w-4" />
                    }
                    label="Cơ sở làm việc"
                    value={
                      facilityIds?.length
                        ? `${facilityIds.length} cơ sở`
                        : undefined
                    }
                  />
                </>
              ) : (
                <>
                  <PreviewLine
                    icon={
                      <UserRound className="h-4 w-4" />
                    }
                    label="Staff ID"
                    value={
                      staffId ||
                      editingDoctor?.staffId
                    }
                  />

                  <PreviewLine
                    icon={
                      <Mail className="h-4 w-4" />
                    }
                    label="Email cá nhân"
                    value={personalEmail}
                  />

                  <PreviewLine
                    icon={
                      <Phone className="h-4 w-4" />
                    }
                    label="Số điện thoại"
                    value={phone}
                  />

                  <PreviewLine
                    icon={
                      <Building2 className="h-4 w-4" />
                    }
                    label="Địa chỉ"
                    value={address}
                  />
                </>
              )}

              <PreviewLine
                icon={
                  <Award className="h-4 w-4" />
                }
                label="Giấy phép"
                value={licenseNo}
              />

              <PreviewLine
                icon={
                  <Stethoscope className="h-4 w-4" />
                }
                label="Chuyên khoa"
                value={specialty}
              />

              <PreviewLine
                icon={
                  <Award className="h-4 w-4" />
                }
                label="Kinh nghiệm"
                value={
                  yearsOfExperience !==
                    undefined
                    ? `${yearsOfExperience} năm`
                    : undefined
                }
              />

              <PreviewLine
                icon={
                  <DoorOpen className="h-4 w-4" />
                }
                label="Loại phòng làm việc"
                value={
                  roomTypeOptions.find(
                    (option) =>
                      option.value ===
                      workingRoomTypeId,
                  )?.label
                }
              />
            </div>
          </aside>
          </div>
        </div>

        <div className="mt-3 flex shrink-0 justify-end gap-2 border-t border-slate-200 pt-3">
          <Button
            onClick={handleCancel}
            disabled={submitting}
          >
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
          >
            {isEditing ? (
              <Pencil className="mr-1 h-4 w-4" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}

            {isEditing
              ? "Cập nhật bác sĩ"
              : "Thêm bác sĩ"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Typography,
  Upload,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  Pencil,
  Save,
  Stethoscope,
  UserRound,
  X,
  Upload as UploadIcon,
} from "lucide-react";
import { ApiClientError } from "@/lib/axios";
import {
  createDoctor,
  updateDoctor,
} from "@/management/features/doctors/doctors.api";
import {
  DOCTOR_EXPERIENCE_OPTIONS,
  DOCTOR_STATUS_OPTIONS,
} from "@/management/features/doctors/doctors.constants";
import type {
  CreateDoctorInput,
  Doctor,
  DoctorExperienceLevel,
  DoctorStatus,
  UpdateDoctorInput,
} from "@/management/features/doctors/doctors.types";
import {
  doctorBelongsToFacility,
  getDoctorErrorMessage,
  readStaffFacilityIds,
} from "@/management/features/doctors/doctors.utils";
import {
  useDoctorFormLookups,
  useDoctorSpecialties,
} from "@/hooks/doctors/useDoctorLookups";
import { DoctorPreview } from "./DoctorPreview";
import { createManagementPresignedUpload } from "@/management/features/uploads/uploads.api";

const { Text, Title } = Typography;

type DoctorFormValues = {
  name?: string;
  personalEmail?: string;
  phone?: string;
  address?: string;
  staffId?: string;
  licenseNo: string; // chứa publicUrl của file giấy phép
  title: string;
  specialty: string;
  yearsOfExperience: DoctorExperienceLevel;
  workingRoomTypeId: string;
  bio?: string;
  status?: DoctorStatus;
};

export type DoctorFormProps = {
  open: boolean;
  editingDoctor: Doctor | null;
  allowedFacilityId: string;
  onClose: () => void;
  onSaved?: (doctor: Doctor, mode: "create" | "update") => void;
};

const CREATE_INITIAL_VALUES: Partial<DoctorFormValues> = {
  name: "",
  personalEmail: "",
  phone: "",
  address: "",
  licenseNo: "",
  title: "",
  specialty: "",
  yearsOfExperience: 1,
  workingRoomTypeId: "",
  bio: "",
  status: "active",
};

export function DoctorForm({
  open,
  editingDoctor,
  allowedFacilityId,
  onClose,
  onSaved,
}: DoctorFormProps) {
  const [form] = Form.useForm<DoctorFormValues>();
  const { message } = App.useApp();

  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const isEditing = Boolean(editingDoctor);

  const handleLookupError = useCallback(
    (errorMessage: string) => {
      void message.error(errorMessage);
    },
    [message],
  );

  const {
    staffOptions,
    staffLoading,
    staffSelectOptions,
    roomTypes,
    roomTypesLoading,
  } = useDoctorFormLookups({
    open,
    isEditing,
    allowedFacilityId,
    onError: handleLookupError,
  });

  const {
    specialtyOptions: lookupSpecialtyOptions,
    specialtiesLoading,
    specialtiesError,
  } = useDoctorSpecialties();

  const specialtyOptions = useMemo(() => {
    const options = [...lookupSpecialtyOptions];

    const currentSpecialty = editingDoctor?.specialty?.trim();

    if (
      currentSpecialty &&
      !options.some((option) => option.value === currentSpecialty)
    ) {
      options.push({
        value: currentSpecialty,
        label: currentSpecialty,
      });
    }

    return options;
  }, [editingDoctor, lookupSpecialtyOptions]);

  const roomTypeOptions = useMemo(() => {
    const options = roomTypes.map((roomType) => ({
      value: roomType.id,
      label: `${roomType.name}${roomType.code ? ` (${roomType.code})` : ""}`,
    }));

    const currentId = editingDoctor?.workingRoomTypeId;

    if (currentId && !options.some((option) => option.value === currentId)) {
      options.push({
        value: currentId,
        label: `Loại phòng #${currentId}`,
      });
    }

    return options;
  }, [editingDoctor, roomTypes]);

  const name = Form.useWatch("name", form);
  const personalEmail = Form.useWatch("personalEmail", form);
  const phone = Form.useWatch("phone", form);
  const address = Form.useWatch("address", form);
  const staffId = Form.useWatch("staffId", form);
  const licenseNo = Form.useWatch("licenseNo", form);
  const title = Form.useWatch("title", form);
  const specialty = Form.useWatch("specialty", form);
  const yearsOfExperience = Form.useWatch("yearsOfExperience", form);
  const workingRoomTypeId = Form.useWatch("workingRoomTypeId", form);
  const status = Form.useWatch("status", form);

  // Load form + file giấy phép
  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      if (editingDoctor) {
        form.setFieldsValue({
          staffId: editingDoctor.staffId,
          name: editingDoctor.name,
          personalEmail: editingDoctor.personalEmail,
          phone: editingDoctor.phone,
          address: editingDoctor.address,
          licenseNo: editingDoctor.licenseNo,
          title: editingDoctor.title,
          specialty: editingDoctor.specialty,
          yearsOfExperience: editingDoctor.yearsOfExperience,
          workingRoomTypeId: editingDoctor.workingRoomTypeId || undefined,
          bio: editingDoctor.bio,
          status: editingDoctor.status,
        });

        // Nếu licenseNo là URL → hiện file đã upload
        if (
          editingDoctor.licenseNo &&
          (editingDoctor.licenseNo.startsWith("http://") ||
            editingDoctor.licenseNo.startsWith("https://"))
        ) {
          setFileList([
            {
              uid: "-1",
              name: "Giấy phép hành nghề",
              status: "done",
              url: editingDoctor.licenseNo,
              response: { publicUrl: editingDoctor.licenseNo },
            },
          ]);
        } else {
          setFileList([]);
        }
        return;
      }

      form.resetFields();
      form.setFieldsValue(CREATE_INITIAL_VALUES);
      setFileList([]);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [editingDoctor, form, open]);

  // ===================== UPLOAD GIẤY PHÉP =====================
  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess: onUploadSuccess, onError } = options;
    const rawFile = file as File;

    setUploading(true);
    try {
      const presign = await createManagementPresignedUpload({
        fileName: rawFile.name,
        mimeType: rawFile.type || "application/octet-stream",
        size: rawFile.size,
        path: `doctors/licenses/${allowedFacilityId || "unknown"}`,
        baseName: "doctor-license",
      });

      const putRes = await fetch(presign.url, {
        method: presign.method || "PUT",
        headers: {
          "Content-Type": rawFile.type || "application/octet-stream",
          ...presign.headers,
        },
        body: rawFile,
      });

      if (!putRes.ok) {
        throw new Error("Upload giấy phép thất bại");
      }

      const uploadedFile: UploadFile = {
        uid: (file as UploadFile).uid,
        name: rawFile.name,
        status: "done",
        url: presign.publicUrl,
        type: rawFile.type,
        response: {
          publicUrl: presign.publicUrl,
          key: presign.key,
        },
      };

      setFileList([uploadedFile]);
      form.setFieldsValue({ licenseNo: presign.publicUrl });

      onUploadSuccess?.(presign);
      message.success(`Đã upload giấy phép: ${rawFile.name}`);
    } catch (err) {
      onError?.(err as Error);
      message.error(
        err instanceof Error ? err.message : "Upload giấy phép thất bại",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFileList([]);
    form.setFieldsValue({ licenseNo: "" });
  };
  // ============================================================

  function handleCancel() {
    if (submitting || uploading) return;
    form.resetFields();
    setFileList([]);
    onClose();
  }

  function validateFacility(values: DoctorFormValues) {
    if (!allowedFacilityId) {
      void message.error("Không xác định được cơ sở quản lý.");
      return false;
    }

    if (
      editingDoctor &&
      !doctorBelongsToFacility(editingDoctor, allowedFacilityId)
    ) {
      void message.error("Bạn không có quyền cập nhật bác sĩ của cơ sở này.");
      return false;
    }

    if (!editingDoctor) {
      const selected = staffOptions.find(
        (user) =>
          String(user.staffProfile?.staffId ?? user.id) ===
          String(values.staffId ?? ""),
      );

      if (
        !selected ||
        !readStaffFacilityIds(selected).includes(allowedFacilityId)
      ) {
        void message.error("Tài khoản staff không thuộc cơ sở của bạn.");
        return false;
      }
    }

    return true;
  }

  function applyValidationErrors(error: ApiClientError) {
    if (error.validationErrors.length === 0) return;

    const fieldNames = Object.keys(form.getFieldsValue(true)) as Array<
      keyof DoctorFormValues
    >;

    const fieldErrors = fieldNames
      .map((fieldName) => ({
        name: fieldName,
        errors: error.validationErrors.filter(
          (validationMessage) =>
            validationMessage.startsWith(`${String(fieldName)} `) ||
            validationMessage.includes(`property ${String(fieldName)} `),
        ),
      }))
      .filter((field) => field.errors.length > 0);

    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors);
    }
  }

  async function handleFinish(values: DoctorFormValues) {
    if (!validateFacility(values)) return;

    const licenseUrl =
      fileList.find((f) => f.status === "done")?.response?.publicUrl ||
      values.licenseNo;

    if (!licenseUrl) {
      void message.error("Vui lòng upload Giấy phép hành nghề.");
      return;
    }

    setSubmitting(true);

    try {
      if (editingDoctor) {
        const payload: UpdateDoctorInput = {
          staffId: values.staffId?.trim(),
          name: values.name?.trim(),
          personalEmail: values.personalEmail?.trim(),
          phone: values.phone?.trim(),
          address: values.address?.trim(),
          licenseNo: licenseUrl,
          title: values.title.trim(),
          specialty: values.specialty.trim(),
          yearsOfExperience: values.yearsOfExperience,
          workingRoomTypeId: values.workingRoomTypeId.trim(),
          bio: values.bio?.trim() ?? "",
          status: values.status,
        };

        const response = await updateDoctor(editingDoctor.id, payload);
        onSaved?.(response.data, "update");
        void message.success(response.message || "Cập nhật bác sĩ thành công.");
      } else {
        const payload: CreateDoctorInput = {
          staffId: values.staffId?.trim() ?? "",
          licenseNo: licenseUrl,
          title: values.title.trim(),
          specialty: values.specialty.trim(),
          yearsOfExperience: values.yearsOfExperience,
          workingRoomTypeId: values.workingRoomTypeId.trim(),
          bio: values.bio?.trim() || undefined,
          status: "active",
        };

        const response = await createDoctor(payload);
        onSaved?.(response.data, "create");
        void message.success(response.message || "Tạo bác sĩ thành công.");
      }

      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyValidationErrors(error);
      }
      void message.error(getDoctorErrorMessage(error));
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
      mask={{ closable: !submitting && !uploading }}
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
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 px-1 pb-2">
        <Title level={4} className="!mb-1 !text-slate-950">
          {isEditing ? "Cập nhật hồ sơ bác sĩ" : "Thêm bác sĩ"}
        </Title>
        <Text className="text-sm text-slate-500">
          {isEditing
            ? "Chỉnh sửa thông tin chuyên môn, giấy phép hành nghề và trạng thái bác sĩ."
            : "Chọn tài khoản staff và hoàn thiện hồ sơ chuyên môn của bác sĩ."}
        </Text>
      </div>

      <Form
        key={editingDoctor?.id ?? "create-doctor"}
        form={form}
        layout="vertical"
        initialValues={CREATE_INITIAL_VALUES}
        onFinish={handleFinish}
        className="mt-3 flex max-h-[calc(84vh-94px)] flex-col"
        autoComplete="off"
        clearOnDestroy
      >
        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-3">
              {/* ========== CARD TÀI KHOẢN STAFF (CREATE) ========== */}
              {!isEditing ? (
                <Card
                  size="small"
                  className="border-slate-200"
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
                          Chọn nhân viên chưa có hồ sơ bác sĩ và thuộc cơ sở
                          hiện tại.
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
                        message: "Vui lòng chọn tài khoản staff.",
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
                        const selected =
                          staffOptions.find(
                            (item) =>
                              String(item.staffProfile?.staffId ?? item.id) ===
                              String(value),
                          ) ?? null;

                        form.setFieldsValue({
                          name: selected?.name ?? "",
                          personalEmail:
                            selected?.staffProfile?.personalEmail ??
                            selected?.email ??
                            "",
                          phone: selected?.phone ?? "",
                        });
                      }}
                    />
                  </Form.Item>
                </Card>
              ) : (
                /* ========== CARD THÔNG TIN CÁ NHÂN (EDIT) ========== */
                <Card
                  size="small"
                  className="border-slate-200"
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
                            message: "Vui lòng nhập họ tên.",
                          },
                          {
                            whitespace: true,
                            message: "Họ tên không hợp lệ.",
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
                            message: "Vui lòng nhập email.",
                          },
                          {
                            type: "email",
                            message: "Email không hợp lệ.",
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
                            message: "Vui lòng nhập số điện thoại.",
                          },
                          {
                            pattern: /^(?:\+84|0)[35789]\d{8}$/,
                            message: "Số điện thoại Việt Nam không hợp lệ.",
                          },
                        ]}
                      >
                        <Input placeholder="0901234567" inputMode="tel" />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item name="address" label="Địa chỉ">
                        <Input placeholder="Nhập địa chỉ" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              )}

              {/* ========== CARD HỒ SƠ CHUYÊN MÔN ========== */}
              <Card
                size="small"
                className="border-slate-200"
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
                  <Col xs={24} md={isEditing ? 12 : 8}>
                    <Form.Item
                      label="Giấy phép hành nghề"
                      required
                      rules={[
                        {
                          validator: async () => {
                            const hasValidFile =
                              fileList.length > 0 &&
                              fileList[0].status === "done" &&
                              (fileList[0].response?.publicUrl ||
                                fileList[0].url);

                            if (!hasValidFile) {
                              return Promise.reject(
                                new Error(
                                  "Vui lòng upload Giấy phép hành nghề.",
                                ),
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Upload
                        maxCount={1}
                        fileList={fileList}
                        customRequest={handleUpload}
                        onRemove={handleRemove}
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={uploading || submitting}
                        listType="text"
                      >
                        <Button
                          icon={<UploadIcon size={16} />}
                          loading={uploading}
                          disabled={uploading || submitting}
                        >
                          {fileList.length > 0
                            ? "Thay file giấy phép"
                            : "Chọn file giấy phép"}
                        </Button>
                      </Upload>
                    </Form.Item>

                    {/* Hidden field thật sự chứa URL */}
                    <Form.Item name="licenseNo" hidden>
                      <Input />
                    </Form.Item>
                  </Col>

                  {/* Title */}
                  <Col xs={24} md={isEditing ? 12 : 8}>
                    <Form.Item
                      name="title"
                      label="Học hàm / chức danh"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập chức danh.",
                        },
                      ]}
                    >
                      <Input placeholder="BS. CKI, ThS.BS..." />
                    </Form.Item>
                  </Col>

                  {/* Specialty */}
                  <Col xs={24} md={isEditing ? 12 : 8}>
                    <Form.Item
                      name="specialty"
                      label="Chuyên khoa"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn chuyên khoa.",
                        },
                      ]}
                    >
                      <Select<string>
                        showSearch
                        optionFilterProp="label"
                        options={specialtyOptions}
                        loading={specialtiesLoading}
                        placeholder="Chọn chuyên khoa"
                        notFoundContent={
                          specialtiesLoading
                            ? "Đang tải chuyên khoa..."
                            : specialtiesError
                              ? "Không tải được chuyên khoa"
                              : "Chưa có chuyên khoa"
                        }
                      />
                    </Form.Item>
                  </Col>

                  {/* Experience */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="yearsOfExperience"
                      label="Mức kinh nghiệm"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn mức kinh nghiệm.",
                        },
                      ]}
                    >
                      <Select
                        options={DOCTOR_EXPERIENCE_OPTIONS}
                        placeholder="Chọn mức kinh nghiệm"
                      />
                    </Form.Item>
                  </Col>

                  {/* Working Room Type */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="workingRoomTypeId"
                      label="Loại phòng làm việc"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn loại phòng làm việc.",
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

                  {/* Status chỉ hiện khi edit */}
                  {isEditing ? (
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn trạng thái.",
                          },
                        ]}
                      >
                        <Select options={DOCTOR_STATUS_OPTIONS} />
                      </Form.Item>
                    </Col>
                  ) : null}

                  {/* Bio */}
                  <Col xs={24}>
                    <Form.Item name="bio" label="Giới thiệu chuyên môn">
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

            {/* Preview */}
            <DoctorPreview
              editingDoctor={editingDoctor}
              name={name}
              personalEmail={personalEmail}
              phone={phone}
              address={address}
              staffId={staffId}
              licenseNo={licenseNo}
              title={title}
              specialty={specialty}
              yearsOfExperience={yearsOfExperience}
              workingRoomTypeId={workingRoomTypeId}
              status={status}
              roomTypeOptions={roomTypeOptions}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3 flex shrink-0 justify-end gap-2 border-t border-slate-200 pt-3">
          <Button onClick={handleCancel} disabled={submitting || uploading}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={uploading}
          >
            {isEditing ? (
              <Pencil className="mr-1 h-4 w-4" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isEditing ? "Cập nhật bác sĩ" : "Thêm bác sĩ"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

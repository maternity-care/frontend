"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
} from "antd";
import { LocationEdit, Mail, Phone, Save, UserRound } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";

import { updateMyProfile } from "@/features/profile/profile.api";
import {
  PregnantProfile,
  ProfileUpdateHandler,
} from "@/features/profile/profile.types";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { useGestationalCalc } from "@/hooks/useGestationalCalc";

type PersonalInfoFormProps = {
  profile: PregnantProfile;
  onCancel: () => void;
  onUpdated: ProfileUpdateHandler;
  onError: (message: string) => void;
  onClearFeedback: () => void;
};

/** Form values dùng Dayjs cho DatePicker */
type FormValues = {
  name: string;
  dateOfBirth?: Dayjs | null;
  province?: string | null;
  ward?: string | null;
  address?: string | null;
  gestationalWeek?: number | null;
  expectedDueDate?: Dayjs | null;
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

export function PersonalInfoForm({
  profile,
  onCancel,
  onUpdated,
  onError,
  onClearFeedback,
}: PersonalInfoFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const { handleGestationalWeekChange, handleDueDateChange } =
    useGestationalCalc({
      form,
    });

  useEffect(() => {
    form.setFieldsValue({
      name: profile.name ?? "",
      dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      province: profile.province ?? "",
      ward: profile.ward ?? "",
      address: profile.address ?? "",
      gestationalWeek:
        profile.gestationalWeek != null
          ? Number(profile.gestationalWeek)
          : undefined,
      expectedDueDate: profile.expectedDueDate
        ? dayjs(profile.expectedDueDate)
        : null,
      emergencyContactName: profile.emergencyContactName ?? "",
      emergencyContactPhone: profile.emergencyContactPhone ?? "",
    });
  }, [form, profile]);

  const handleSubmit = async (values: FormValues) => {
    onClearFeedback();
    setSaving(true);

    try {
      const payload = {
        name: values.name?.trim(),
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format("YYYY-MM-DD")
          : undefined,
        address: values.address?.trim() || undefined,
        gestationalWeek: values.gestationalWeek ?? undefined,
        expectedDueDate: values.expectedDueDate
          ? values.expectedDueDate.format("YYYY-MM-DD")
          : undefined,
        bloodType: values.bloodType || undefined,
        emergencyContactName: values.emergencyContactName?.trim() || undefined,
        emergencyContactPhone:
          values.emergencyContactPhone?.trim() || undefined,
      };

      const response = await updateMyProfile(payload);
      await onUpdated(response.data, response.message);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Không cập nhật được hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={handleSubmit}
      className="space-y-1"
    >
      {/* === Thông tin cá nhân === */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Thông tin cá nhân
        </h3>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label={RESPONSE_MESSAGES.COMMON.NAME}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: RESPONSE_MESSAGES.COMMON_DESCRIPTION.NAME_RULE,
                },
              ]}
            >
              <Input
                size="large"
                placeholder={RESPONSE_MESSAGES.COMMON_DESCRIPTION.ENTER_NAME}
                prefix={<UserRound className="h-4 w-4 text-slate-400" />}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Email">
              <Input
                size="large"
                value={profile.email}
                disabled
                prefix={<Mail className="h-4 w-4 text-slate-400" />}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Số điện thoại">
              <Input
                size="large"
                value={profile.phone || ""}
                disabled
                prefix={<Phone className="h-4 w-4 text-slate-400" />}
                placeholder="Không thể chỉnh sửa"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker
                size="large"
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                disabledDate={(current) =>
                  current.isAfter(dayjs().subtract(15, "year"), "day")
                }
                defaultPickerValue={dayjs().subtract(15, "year")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="ward" label="Phường/Xã">
              <Input
                size="large"
                prefix={<LocationEdit className="h-4 w-4 text-slate-400" />}
                placeholder="Phường/Xã hiện tại"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="province" label="Tỉnh/Thành phố">
              <Input
                size="large"
                prefix={<LocationEdit className="h-4 w-4 text-slate-400" />}
                placeholder="Tỉnh/Thành phố hiện tại"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="address" label="Địa chỉ">
              <Input.TextArea
                rows={2}
                size="large"
                placeholder="Nhập địa chỉ hiện tại"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* === Liên hệ khẩn cấp === */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Liên hệ khẩn cấp
        </h3>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="emergencyContactName" label="Họ tên người liên hệ">
              <Input size="large" placeholder="VD: Nguyễn Văn A" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="emergencyContactPhone"
              label="Số điện thoại liên hệ"
              rules={[
                {
                  pattern: /^[0-9+\-\s]{9}$/,
                  message: "Số điện thoại không hợp lệ",
                },
              ]}
            >
              <Input size="large" placeholder="VD: 0901234567" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button onClick={onCancel} disabled={saving}>
          {RESPONSE_MESSAGES.COMMON.CANCEL}
        </Button>

        <Button
          type="primary"
          htmlType="submit"
          loading={saving}
          icon={<Save className="h-4 w-4" />}
        >
          {RESPONSE_MESSAGES.COMMON.SAVE_CHANGES}
        </Button>
      </div>
    </Form>
  );
}

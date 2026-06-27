"use client";

import { useEffect, useState } from "react";
import { Button, Col, Form, Input, Row } from "antd";
import { Mail, Save, UserRound } from "lucide-react";

import { updateMyProfile } from "@/features/profile/profile.api";
import { PregnantProfile, ProfileFormValues, ProfileUpdateHandler } from "@/features/profile/profile.types";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type PersonalInfoFormProps = {
  profile: PregnantProfile;
  onCancel: () => void;
  onUpdated: ProfileUpdateHandler;
  onError: (message: string) => void;
  onClearFeedback: () => void;
};

export function PersonalInfoForm({
  profile,
  onCancel,
  onUpdated,
  onError,
  onClearFeedback,
}: PersonalInfoFormProps) {
  const [form] = Form.useForm<ProfileFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      name: profile.name ?? "",
    });
  }, [form, profile.name]);

  const handleSubmit = async (values: ProfileFormValues) => {
    onClearFeedback();
    setSaving(true);

    try {
      const response = await updateMyProfile({
        name: values.name.trim(),
      });

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
    >
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
          <Form.Item label={RESPONSE_MESSAGES.COMMON.EMAIL}>
            <Input
              size="large"
              value={profile.email}
              disabled
              prefix={<Mail className="h-4 w-4 text-slate-400" />}
            />
          </Form.Item>
        </Col>
      </Row>

      <div className="flex justify-end gap-3">
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
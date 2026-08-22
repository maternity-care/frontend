"use client";

import { useState } from "react";
import { Alert, Button, Card, Form, Input } from "antd";
import { KeyRound } from "lucide-react";

import { changePassword } from "@/features/auth/auth.api";
import { ApiClientError } from "@/lib/axios";

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ChangePasswordCard() {
  const [form] = Form.useForm<ChangePasswordForm>();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ChangePasswordForm) => {
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      form.resetFields();
      setMessage(response.message ?? "Đổi mật khẩu thành công.");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Không thể đổi mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      className="border-0 shadow-sm"
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-pink-500" />
          <span>Đổi mật khẩu</span>
        </div>
      }
    >
      <div className="mb-5 grid gap-3">
        {message ? <Alert type="success" showIcon title={message} /> : null}
        {error ? <Alert type="error" showIcon title={error} /> : null}
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Mật khẩu hiện tại"
          name="currentPassword"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại." }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới." },
            { min: 8, message: "Mật khẩu mới cần ít nhất 8 ký tự." },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới." },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Mật khẩu xác nhận không khớp."));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <div className="flex justify-end">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Cập nhật mật khẩu
          </Button>
        </div>
      </Form>
    </Card>
  );
}

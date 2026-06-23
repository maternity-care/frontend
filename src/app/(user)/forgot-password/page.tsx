"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { Mail } from "lucide-react";
import { forgotPassword } from "@/features/auth/auth.api";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [form] = Form.useForm<ForgotPasswordFormValues>();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setMessage(null);
    setError(null);
    setResetUrl(null);
    setIsSubmitting(true);

    try {
      const response = await forgotPassword(values);
      setMessage(response.message || "Đã tạo hướng dẫn đặt lại mật khẩu.");
      setResetUrl(response.data.reset_url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo yêu cầu đặt lại mật khẩu",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-sm">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Mail className="h-5 w-5" aria-hidden="true" />
      </div>

      <Typography.Title level={3} className="!mb-2">
        Quên mật khẩu
      </Typography.Title>
      <Typography.Text type="secondary">
        Nhập email tài khoản để tạo link đặt lại mật khẩu.
      </Typography.Text>

      {message ? (
        <Alert
          className="mt-5"
          type="success"
          message={message}
          description={
            resetUrl ? (
              <Link
                href={resetUrl}
                className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
              >
                Mở trang đặt lại mật khẩu
              </Link>
            ) : null
          }
          showIcon
        />
      ) : null}
      {error ? (
        <Alert className="mt-5" type="error" message={error} showIcon />
      ) : null}

      <Form<ForgotPasswordFormValues>
        form={form}
        className="mt-6"
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input autoComplete="email" placeholder="Nhập email" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={isSubmitting} block>
          Tạo link đặt lại mật khẩu
        </Button>
      </Form>

      <p className="mt-5 text-center text-sm text-slate-600">
        <Link
          href="/login"
          className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
        >
          Quay lại đăng nhập
        </Link>
      </p>
    </Card>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { Mail } from "lucide-react";
import { forgotPassword } from "@/features/auth/auth.api";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

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
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-pink-50 text-pink-700">
        <Mail className="h-5 w-5" aria-hidden="true" />
      </div>

      <Typography.Title level={3} className="!mb-2">
        {RESPONSE_MESSAGES.AUTH.FORGOT_PASSWORD}
      </Typography.Title>
      <Typography.Text type="secondary">
        {RESPONSE_MESSAGES.AUTH.FORGOT_PASSWORD_DESCRIPTION}
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
                className="font-medium text-pink-700 hover:text-pink-900 hover:underline"
              >
                {RESPONSE_MESSAGES.AUTH.RESET_PASSWORD_LINK}
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
            { required: true, message: RESPONSE_MESSAGES.AUTH.ENTER_EMAIL },
            { type: "email", message: RESPONSE_MESSAGES.AUTH.EMAIL_INVALID },
          ]}
        >
          <Input autoComplete="email" placeholder={RESPONSE_MESSAGES.AUTH.ENTER_EMAIL} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={isSubmitting} block>
          {RESPONSE_MESSAGES.AUTH.CREATE_RESET_PASSWORD_LINK}
        </Button>
      </Form>

      <p className="mt-5 text-center text-sm text-slate-600">
        <Link
          href="/login"
          className="font-medium text-pink-700 hover:text-pink-900 hover:underline"
        >
          {RESPONSE_MESSAGES.AUTH.LOGIN}
        </Link>
      </p>
    </Card>
  );
}

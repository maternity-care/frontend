"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { KeyRound } from "lucide-react";
import { resetPassword } from "@/features/auth/auth.api";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async (values: ResetPasswordFormValues) => {
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        token,
        password: values.password,
      });
      setMessage(response.message || "Đã đặt lại mật khẩu.");
      setTimeout(() => router.replace("/login"), 900);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể đặt lại mật khẩu",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-sm">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <KeyRound className="h-5 w-5" aria-hidden="true" />
      </div>

      <Typography.Title level={3} className="!mb-2">
        {RESPONSE_MESSAGES.AUTH.RESET_PASSWORD}
      </Typography.Title>
      <Typography.Text type="secondary">
        {RESPONSE_MESSAGES.AUTH.ENTER_NEW_PASSWORD}
      </Typography.Text>

      {!token ? (
        <Alert
          className="mt-5"
          type="error"
          title="Link đặt lại mật khẩu không hợp lệ."
          showIcon
        />
      ) : null}
      {message ? (
        <Alert className="mt-5" type="success" title={message} showIcon />
      ) : null}
      {error ? (
        <Alert className="mt-5" type="error" title={error} showIcon />
      ) : null}

      <Form<ResetPasswordFormValues>
        className="mt-6"
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label={RESPONSE_MESSAGES.AUTH.NEW_PASSWORD}
          name="password"
          rules={[
            { required: true, message: RESPONSE_MESSAGES.AUTH.newPasswordRequired },
            { min: 6, message: RESPONSE_MESSAGES.AUTH.newPasswordMinLength },
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={RESPONSE_MESSAGES.AUTH.ENTER_NEW_PASSWORD}
          />
        </Form.Item>

        <Form.Item
          label={RESPONSE_MESSAGES.AUTH.CONFIRM_PASSWORD}
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: RESPONSE_MESSAGES.AUTH.CONFIRM_PASSWORD_REQUIRED },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(RESPONSE_MESSAGES.AUTH.CONFIRM_PASSWORD_MISMATCH),
                );
              },
            }),
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={RESPONSE_MESSAGES.AUTH.ENTER_NEW_PASSWORD}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          disabled={!token}
          block
        >
          {RESPONSE_MESSAGES.AUTH.RESET_PASSWORD}
        </Button>
      </Form>

      <p className="mt-5 text-center text-sm text-slate-600">
        <Link
          href="/login"
          className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
        >
          {RESPONSE_MESSAGES.AUTH.LOGIN_ACCOUNT}
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { HeartPulse } from "lucide-react";
import {
  register,
  resendRegisterOtp,
  verifyRegisterOtp,
} from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type RegisterFormValues = {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
};

function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [form] = Form.useForm<RegisterFormValues>();

  const [messageApi, contextHolder] = message.useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const handleRequestOtp = async () => {
    setIsRequestingOtp(true);

    try {
      const values = await form.validateFields([
        "name",
        "phone",
        "email",
        "password",
        "confirmPassword",
      ]);

      const response =
        otpSent && pendingEmail === values.email
          ? await resendRegisterOtp(values.email)
          : await register({
              name: values.name,
              phone: values.phone,
              email: values.email,
              password: values.password,
            });

      setPendingEmail(values.email);
      setOtpSent(true);

      messageApi.success({
        content:
          response.message ||
          "OTP đã được gửi. Vui lòng kiểm tra email để kích hoạt đăng ký.",
        duration: 3,
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        return;
      }

      messageApi.error({
        content: error.message || "Không thể gửi OTP",
        duration: 3,
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const onFinish = async (values: RegisterFormValues) => {
    if (!otpSent) {
      messageApi.warning({
        content: "Vui lòng nhận OTP trước khi đăng ký.",
        duration: 3,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await verifyRegisterOtp({
        email: pendingEmail || values.email,
        otp: values.otp,
      });

      setSession(session);

      messageApi.success({
        content: session.message || "Đăng ký tài khoản thành công",
        duration: 2,
      });

      setTimeout(() => {
        router.replace("/schedule");
      }, 700);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Đăng ký thất bại";

      messageApi.error({
        content: errorMessage,
        duration: 3,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Card className="w-full max-w-md shadow-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 font-semibold text-teal-900"
        >
          <HeartPulse className="h-5 w-5" />
          {RESPONSE_MESSAGES.COMMON.DEFAULT_NAME}
        </Link>

        <Typography.Title level={3} className="!mb-2">
          {RESPONSE_MESSAGES.AUTH.REGISTER}
        </Typography.Title>

        <Typography.Text type="secondary">
          {RESPONSE_MESSAGES.AUTH.REGISTER_DESCRIPTION}
        </Typography.Text>

        <Form<RegisterFormValues>
          form={form}
          className="mt-6"
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label={RESPONSE_MESSAGES.COMMON.NAME}
            name="name"
            rules={[
              { required: true, message: RESPONSE_MESSAGES.AUTH.NAME_REQUIRED },
              { min: 2, message: RESPONSE_MESSAGES.AUTH.NAME_MIN_LENGTH },
            ]}
          >
            <Input
              placeholder={RESPONSE_MESSAGES.AUTH.ENTER_NAME}
              autoComplete="name"
              disabled={otpSent}
            />
          </Form.Item>

          <Form.Item
            label={RESPONSE_MESSAGES.COMMON.PHONE}
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              {
                pattern: /^[0-9+\-\s()]{8,20}$/,
                message: "Số điện thoại không hợp lệ",
              },
            ]}
          >
            <Input
              placeholder="Nhập số điện thoại"
              autoComplete="tel"
              disabled={otpSent}
            />
          </Form.Item>

          <Form.Item label={RESPONSE_MESSAGES.COMMON.EMAIL} required>
            <div className="flex gap-2">
              <Form.Item
                name="email"
                className="!mb-0 flex-1"
                rules={[
                  {
                    required: true,
                    message: RESPONSE_MESSAGES.AUTH.emailRequired,
                  },
                  {
                    type: "email",
                    message: RESPONSE_MESSAGES.AUTH.emailInvalid,
                  },
                ]}
              >
                <Input
                  placeholder={RESPONSE_MESSAGES.AUTH.ENTER_EMAIL}
                  autoComplete="email"
                  disabled={otpSent}
                />
              </Form.Item>

              <Button
                type="default"
                loading={isRequestingOtp}
                onClick={handleRequestOtp}
              >
                {otpSent ? "Gửi lại OTP" : "Nhận OTP"}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            label={RESPONSE_MESSAGES.COMMON.PASSWORD}
            name="password"
            rules={[
              {
                required: true,
                message: RESPONSE_MESSAGES.AUTH.passwordRequired,
              },
              { min: 6, message: RESPONSE_MESSAGES.AUTH.passwordMinLength },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder={RESPONSE_MESSAGES.AUTH.ENTER_PASSWORD}
              autoComplete="new-password"
              disabled={otpSent}
            />
          </Form.Item>

          <Form.Item
            label={RESPONSE_MESSAGES.AUTH.CONFIRM_PASSWORD}
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: RESPONSE_MESSAGES.AUTH.CONFIRM_PASSWORD_REQUIRED,
              },
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
              placeholder={RESPONSE_MESSAGES.AUTH.ENTER_PASSWORD}
              autoComplete="new-password"
              disabled={otpSent}
            />
          </Form.Item>

          <Form.Item
            label="OTP"
            name="otp"
            rules={[
              { required: true, message: "Vui lòng nhập OTP" },
              { len: 6, message: "OTP gồm 6 chữ số" },
            ]}
          >
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="Nhập OTP đã gửi đến email"
              autoComplete="one-time-code"
              disabled={!otpSent}
            />
          </Form.Item>

          <Form.Item className="!mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={!otpSent}
              block
            >
              Đăng ký
            </Button>
          </Form.Item>

          <p className="text-center text-sm text-slate-600">
            {RESPONSE_MESSAGES.AUTH.HAVE_ACCOUNT}{" "}
            <Link
              href="/login"
              className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
            >
              {RESPONSE_MESSAGES.AUTH.LOGIN}
            </Link>
          </p>
        </Form>
      </Card>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

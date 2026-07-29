"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Typography,
} from "antd";
import { HeartPulse } from "lucide-react";

import {
  register,
  resendOtp,
  verifyOtp,
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
  const [form] = Form.useForm<RegisterFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const setSession = useAuthStore((state) => state.setSession);

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

      const normalizedEmail = values.email.trim().toLowerCase();

      const response =
        otpSent && pendingEmail === normalizedEmail
          ? await resendOtp({
              email: normalizedEmail,
            })
          : await register({
              name: values.name.trim(),
              phone: values.phone.trim(),
              email: normalizedEmail,
              password: values.password,
            });

      setPendingEmail(normalizedEmail);
      setOtpSent(true);

      messageApi.success({
        content:
          response.message ??
          "Mã OTP đã được gửi. Vui lòng kiểm tra email.",
        duration: 3,
      });
    } catch (error) {
      // Lỗi validate của Ant Design không phải Error thông thường.
      if (
        typeof error === "object" &&
        error !== null &&
        "errorFields" in error
      ) {
        return;
      }

      messageApi.error({
        content:
          error instanceof Error
            ? error.message
            : "Không thể gửi mã OTP.",
        duration: 3,
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const onFinish = async (values: RegisterFormValues) => {
    if (!otpSent || !pendingEmail) {
      messageApi.warning({
        content: "Vui lòng nhận mã OTP trước.",
        duration: 3,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await verifyOtp({
        email: pendingEmail,
        otp: values.otp.trim(),
      });

      setSession(session);

      messageApi.success({
        content:
          session.message ??
          "Xác thực OTP và đăng ký tài khoản thành công.",
        duration: 2,
      });

      router.replace("/schedule");
      router.refresh();
    } catch (error) {
      messageApi.error({
        content:
          error instanceof Error
            ? error.message
            : "Mã OTP không hợp lệ hoặc đã hết hạn.",
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
              {
                required: true,
                message: RESPONSE_MESSAGES.AUTH.NAME_REQUIRED,
              },
              {
                min: 2,
                message: RESPONSE_MESSAGES.AUTH.NAME_MIN_LENGTH,
              },
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
              {
                required: true,
                message: "Vui lòng nhập số điện thoại.",
              },
              {
                pattern: /^[0-9+\-\s()]{8,20}$/,
                message: "Số điện thoại không hợp lệ.",
              },
            ]}
          >
            <Input
              placeholder="Nhập số điện thoại"
              autoComplete="tel"
              disabled={otpSent}
            />
          </Form.Item>

          <Form.Item
            label={RESPONSE_MESSAGES.COMMON.EMAIL}
            required
          >
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
                disabled={isSubmitting}
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
              {
                min: 6,
                message: RESPONSE_MESSAGES.AUTH.passwordMinLength,
              },
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
                message:
                  RESPONSE_MESSAGES.AUTH.CONFIRM_PASSWORD_REQUIRED,
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue("password") === value
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      RESPONSE_MESSAGES.AUTH
                        .CONFIRM_PASSWORD_MISMATCH,
                    ),
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
            label="Mã OTP"
            name="otp"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mã OTP.",
              },
              {
                pattern: /^\d{6}$/,
                message: "Mã OTP phải gồm đúng 6 chữ số.",
              },
            ]}
          >
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="Nhập mã OTP được gửi đến email"
              autoComplete="one-time-code"
              disabled={!otpSent}
            />
          </Form.Item>

          <Form.Item className="!mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={!otpSent || isRequestingOtp}
              block
            >
              Xác nhận đăng ký
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

function RegisterLoading() {
  return (
    <Card
      loading
      className="w-full max-w-md shadow-sm"
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  );
}

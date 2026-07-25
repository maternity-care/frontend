"use client";

import {
  Suspense,
  useState,
} from "react";

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

import { register } from "@/features/auth/auth.api";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import OtpVerification from "@/fe/components/register/OtpVerification";

type RegisterFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

function RegisterForm() {
  const router = useRouter();

  const [form] =
    Form.useForm<RegisterFormValues>();

  const [messageApi, contextHolder] =
    message.useMessage();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    verificationEmail,
    setVerificationEmail,
  ] = useState<string | null>(null);

  const onFinish = async (
    values: RegisterFormValues,
  ) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const normalizedEmail = values.email
      .trim()
      .toLowerCase();

    try {
      const response = await register({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: normalizedEmail,
        password: values.password,
      });

      const email =
        response.data?.email?.trim().toLowerCase() ||
        normalizedEmail;

      messageApi.success({
        content:
          response.message ??
          "Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.",
        duration: 2,
      });

      setVerificationEmail(email);
    } catch (error) {
      messageApi.error({
        content:
          error instanceof Error
            ? error.message
            : "Đăng ký tài khoản thất bại.",
        duration: 3,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToRegister = () => {
    setVerificationEmail(null);
  };

  const handleVerified = () => {
    router.replace("/schedule");
    router.refresh();
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

        {verificationEmail ? (
          <OtpVerification
            email={verificationEmail}
            onBack={handleBackToRegister}
            onVerified={handleVerified}
          />
        ) : (
          <>
            <Typography.Title
              level={3}
              className="!mb-2"
            >
              {RESPONSE_MESSAGES.AUTH.REGISTER}
            </Typography.Title>

            <Typography.Text type="secondary">
              {
                RESPONSE_MESSAGES.AUTH
                  .REGISTER_DESCRIPTION
              }
            </Typography.Text>

            <Form<RegisterFormValues>
              form={form}
              className="mt-6"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              disabled={isSubmitting}
            >
              <Form.Item
                label={
                  RESPONSE_MESSAGES.COMMON.NAME
                }
                name="name"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      RESPONSE_MESSAGES.AUTH
                        .NAME_REQUIRED,
                  },
                  {
                    min: 2,
                    message:
                      RESPONSE_MESSAGES.AUTH
                        .NAME_MIN_LENGTH,
                  },
                ]}
              >
                <Input
                  placeholder={
                    RESPONSE_MESSAGES.AUTH
                      .ENTER_NAME
                  }
                  autoComplete="name"
                  maxLength={100}
                />
              </Form.Item>

              <Form.Item
                label={
                  RESPONSE_MESSAGES.COMMON.EMAIL
                }
                name="email"
                normalize={(value: string) =>
                  value?.trim().toLowerCase()
                }
                rules={[
                  {
                    required: true,
                    message:
                      RESPONSE_MESSAGES.AUTH
                        .emailRequired,
                  },
                  {
                    type: "email",
                    message:
                      RESPONSE_MESSAGES.AUTH
                        .emailInvalid,
                  },
                ]}
              >
                <Input
                  placeholder={
                    RESPONSE_MESSAGES.AUTH
                      .ENTER_EMAIL
                  }
                  autoComplete="email"
                  maxLength={255}
                />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                normalize={(value: string) =>
                  value
                    ?.replace(/\D/g, "")
                    .slice(0, 10)
                }
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng nhập số điện thoại.",
                  },
                  {
                    pattern: /^0\d{9}$/,
                    message:
                      "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                />
              </Form.Item>

              <Form.Item
                label={
                  RESPONSE_MESSAGES.COMMON
                    .PASSWORD
                }
                name="password"
                rules={[
                  {
                    required: true,
                    message:
                      RESPONSE_MESSAGES.AUTH
                        .passwordRequired,
                  },
                  {
                    min: 6,
                    message:
                      RESPONSE_MESSAGES.AUTH
                        .passwordMinLength,
                  },
                ]}
                hasFeedback
              >
                <Input.Password
                  placeholder={
                    RESPONSE_MESSAGES.AUTH
                      .ENTER_PASSWORD
                  }
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                label={
                  RESPONSE_MESSAGES.AUTH
                    .CONFIRM_PASSWORD
                }
                name="confirmPassword"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  {
                    required: true,
                    message:
                      RESPONSE_MESSAGES.AUTH
                        .CONFIRM_PASSWORD_REQUIRED,
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        getFieldValue("password") ===
                          value
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
                  placeholder={
                    RESPONSE_MESSAGES.AUTH
                      .ENTER_PASSWORD
                  }
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item className="!mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  block
                >
                  {
                    RESPONSE_MESSAGES.AUTH
                      .REGISTER
                  }
                </Button>
              </Form.Item>

              <p className="text-center text-sm text-slate-600">
                {
                  RESPONSE_MESSAGES.AUTH
                    .HAVE_ACCOUNT
                }{" "}
                <Link
                  href="/login"
                  className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
                >
                  {
                    RESPONSE_MESSAGES.AUTH
                      .LOGIN
                  }
                </Link>
              </p>
            </Form>
          </>
        )}
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
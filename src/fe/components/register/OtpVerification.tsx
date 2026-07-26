"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Button,
  Form,
  Input,
  message,
  Typography,
} from "antd";

import {
  ArrowLeft,
} from "lucide-react";

import {
  resendOtp,
  verifyOtp,
} from "@/features/auth/auth.api";

import { useAuthStore } from "@/features/auth/auth.store";

type OtpVerificationProps = {
  email: string;
  onBack: () => void;
  onVerified: () => void;
};

type OtpFormValues = {
  otp: string;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpVerification({
  email,
  onBack,
  onVerified,
}: OtpVerificationProps) {
  const [form] = Form.useForm<OtpFormValues>();
  const setSession = useAuthStore(
    (state) => state.setSession,
  );

  const [messageApi, contextHolder] =
    message.useMessage();

  const redirectTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const [isVerifying, setIsVerifying] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const [countdown, setCountdown] =
    useState(RESEND_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setCountdown((current) =>
        Math.max(current - 1, 0),
      );
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [countdown]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleVerifyOtp = async (
    values: OtpFormValues,
  ) => {
    if (isVerifying) {
      return;
    }

    setIsVerifying(true);

    try {
      const session = await verifyOtp({
        email,
        otp: values.otp.trim(),
      });

      setSession(session, true);

      messageApi.success({
        content:
          session.message ??
          "Xác thực tài khoản thành công.",
        duration: 2,
      });

      redirectTimerRef.current = setTimeout(() => {
        onVerified();
      }, 700);
    } catch (error) {
      messageApi.error({
        content:
          error instanceof Error
            ? error.message
            : "Mã OTP không hợp lệ hoặc đã hết hạn.",
        duration: 3,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (
      countdown > 0 ||
      isResending ||
      isVerifying
    ) {
      return;
    }

    setIsResending(true);

    try {
      const response = await resendOtp({
        email,
      });

      form.resetFields(["otp"]);
      setCountdown(RESEND_SECONDS);

      messageApi.success({
        content:
          response.message ??
          "Mã OTP mới đã được gửi đến email.",
        duration: 2,
      });
    } catch (error) {
      messageApi.error({
        content:
          error instanceof Error
            ? error.message
            : "Không thể gửi lại mã OTP.",
        duration: 3,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {contextHolder}

      <div className="text-center">

        <Typography.Title
          level={3}
          className="!mb-2"
        >
          Xác thực tài khoản
        </Typography.Title>

        <Typography.Text type="secondary">
          Mã OTP đã được gửi đến email
        </Typography.Text>

        <Typography.Text className="mt-1 block !font-semibold">
          {email}
        </Typography.Text>
      </div>

      <Form<OtpFormValues>
        form={form}
        className="mt-6"
        layout="vertical"
        onFinish={handleVerifyOtp}
        autoComplete="off"
      >
        <Form.Item
          label="Mã OTP"
          name="otp"
          normalize={(value: string) =>
            value
              ?.replace(/\D/g, "")
              .slice(0, OTP_LENGTH)
          }
          rules={[
            {
              required: true,
              message: "Vui lòng nhập mã OTP.",
            },
            {
              pattern: /^\d{6}$/,
              message:
                "Mã OTP phải gồm đúng 6 chữ số.",
            },
          ]}
        >
          <Input
            size="large"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            placeholder="Mã OTP"
            disabled={isVerifying}
            className="text-center !text-lg !tracking-[0.5em]"
          />
        </Form.Item>

        <Form.Item className="!mb-3">
          <Button
            type="primary"
            htmlType="submit"
            loading={isVerifying}
            disabled={isResending}
            block
          >
            Xác nhận OTP
          </Button>
        </Form.Item>

        <div className="text-center">
          <Typography.Text type="secondary">
            Bạn chưa nhận được mã?
          </Typography.Text>

          <Button
            type="link"
            htmlType="button"
            loading={isResending}
            disabled={
              countdown > 0 || isVerifying
            }
            onClick={handleResendOtp}
          >
            {countdown > 0
              ? `Gửi lại sau ${countdown}s`
              : "Gửi lại mã OTP"}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Button
            type="text"
            htmlType="button"
            icon={
              <ArrowLeft className="h-4 w-4" />
            }
            disabled={
              isVerifying || isResending
            }
            onClick={onBack}
          >
            Quay lại đăng ký
          </Button>
        </div>
      </Form>
    </>
  );
}
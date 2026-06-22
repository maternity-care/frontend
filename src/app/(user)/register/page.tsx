"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { HeartPulse } from "lucide-react";
import { register } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [messageApi, contextHolder] = message.useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async (values: RegisterFormValues) => {
    setIsSubmitting(true);

    try {
      const session = await register({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      setSession(session);

      messageApi.success({
        content: session.message || "Đăng ký tài khoản thành công",
        duration: 2,
      });

      setTimeout(() => {
        router.replace("/profile");
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
          Maternity Care
        </Link>

        <Typography.Title level={3} className="!mb-2">
          Đăng ký tài khoản
        </Typography.Title>

        <Typography.Text type="secondary">
          Tạo tài khoản để sử dụng hệ thống Maternity Care.
        </Typography.Text>

        <Form<RegisterFormValues>
          className="mt-6"
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
              { min: 2, message: "Họ và tên tối thiểu 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập họ và tên" autoComplete="name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" autoComplete="email" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="Nhập mật khẩu"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Nhập lại mật khẩu"
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
              Đăng ký
            </Button>
          </Form.Item>

          <p className="text-center text-sm text-slate-600">
            Bạn đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
            >
              Đăng nhập
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
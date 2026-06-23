"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Typography,
} from "antd";
import { HeartPulse } from "lucide-react";
import { login } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

const REMEMBER_EMAIL_KEY = "remembered_login_email";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const [form] = Form.useForm<LoginFormValues>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY);

    if (rememberedEmail) {
      form.setFieldsValue({
        email: rememberedEmail,
        rememberMe: true,
      });
    }
  }, [form]);

  const onFinish = async (values: LoginFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const session = await login({
        email: values.email,
        password: values.password,
      });

      setSession(session, Boolean(values.rememberMe));

      if (values.rememberMe) {
        window.localStorage.setItem(REMEMBER_EMAIL_KEY, values.email);
      } else {
        window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      messageApi.success({
        content: session.message || "Đăng nhập thành công",
        duration: 2,
      });

      setTimeout(() => {
        router.replace(searchParams.get("next") ?? "/profile");
      }, 700);
    } catch (error) {
      // setFormError(
      //   error instanceof Error ? error.message : "Đăng nhập thất bại"
      // );
      const errorMessage =
        error instanceof Error ? error.message : "Đăng nhập thất bại";
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
          Đăng nhập tài khoản
        </Typography.Title>

        <Typography.Text type="secondary">
          Dùng tài khoản của bạn để truy cập hồ sơ và uploads.
        </Typography.Text>

        {formError ? (
          <Alert className="mt-5" type="error" message={formError} showIcon />
        ) : null}

        <Form<LoginFormValues>
          form={form}
          className="mt-6"
          layout="vertical"
          initialValues={{
            email: "admin@example.com",
            password: "password",
            rememberMe: false,
          }}
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

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Form.Item
            name="rememberMe"
            valuePropName="checked"
            className="!mb-4"
          >
            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>

          <div className="-mt-2 mb-4 text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Form.Item className="!mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              block
            >
              Login
            </Button>
          </Form.Item>

          <p className="text-center text-sm text-slate-600">
            Bạn chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
            >
              Click vào để đăng ký
            </Link>
          </p>
        </Form>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

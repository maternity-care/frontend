"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { managementResetPassword } from "@/features/auth/auth.api";

const { Title, Text } = Typography;

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: { password: string }) {
    setError(null);
    try {
      await managementResetPassword({ token, password: values.password });
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Đặt lại mật khẩu thất bại");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <Title level={3}>Đặt lại mật khẩu nhân viên</Title>
        <Text type="secondary">Mật khẩu mới phải có ít nhất 6 ký tự.</Text>
        {done ? (
          <>
            <Alert className="mt-4" type="success" message="Đặt lại mật khẩu thành công" showIcon />
            <Link className="mt-4 block text-center" href="/management/login">
              Đăng nhập
            </Link>
          </>
        ) : (
          <>
            {error ? <Alert className="mt-4" type="error" message={error} showIcon /> : null}
            <Form layout="vertical" className="mt-5" onFinish={(values) => void submit(values)}>
              <Form.Item
                name="password"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Button type="primary" htmlType="submit" block disabled={!token}>
                Đặt lại mật khẩu
              </Button>
            </Form>
          </>
        )}
      </Card>
    </main>
  );
}

export default function ManagementResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

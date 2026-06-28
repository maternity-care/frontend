"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { managementForgotPassword } from "@/features/auth/auth.api";

const { Title, Text } = Typography;

export default function ManagementForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: { email: string }) {
    setError(null);
    try {
      const response = await managementForgotPassword(values);
      setMessage(
        response.message ||
          "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.",
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gửi yêu cầu thất bại");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <Title level={3}>Quên mật khẩu nhân viên</Title>
        <Text type="secondary">Nhập email công ty để nhận liên kết đặt lại mật khẩu.</Text>
        {message ? <Alert className="mt-4" type="success" message={message} showIcon /> : null}
        {error ? <Alert className="mt-4" type="error" message={error} showIcon /> : null}
        <Form layout="vertical" className="mt-5" onFinish={(values) => void submit(values)}>
          <Form.Item
            name="email"
            label="Email công ty"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Gửi liên kết
          </Button>
        </Form>
        <Link className="mt-4 block text-center" href="/management/login">
          Quay lại đăng nhập
        </Link>
      </Card>
    </main>
  );
}

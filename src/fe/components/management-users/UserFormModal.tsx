"use client";

import { useEffect } from "react";
import { Card, Col, Form, Input, Modal, Row, Select } from "antd";
import {
  CreateUserDto,
  UpdateUserDto,
  User,
  UserStatus,
} from "@/management/features/management-users/management-user.types";

const { TextArea } = Input;

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
  { value: "locked", label: "Đã khóa" },
];

interface Props {
  open: boolean;
  user: User | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (values: CreateUserDto | UpdateUserDto) => void;
}

export function UserFormModal({
  open,
  user,
  loading,
  onClose,
  onSave,
}: Props) {
  const [form] = Form.useForm<CreateUserDto & UpdateUserDto>();

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      if (user) {
        form.setFieldsValue({
          name: user.name,
          dateOfBirth: user.dateOfBirth ?? undefined,
          address: user.address ?? undefined,
          province: user.province ?? undefined,
          ward: user.ward ?? undefined,
          status: user.status,
          emergencyContactName: user.emergencyContactName ?? undefined,
          emergencyContactPhone: user.emergencyContactPhone ?? undefined,
        });
      } else {
        form.resetFields();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [form, open, user]);

  return (
    <Modal
      open={open}
      centered
      width={720}
      forceRender
      destroyOnHidden={false}
      title={user ? "Cập nhật người dùng" : "Thêm người dùng"}
      okText={user ? "Lưu thay đổi" : "Tạo tài khoản"}
      cancelText="Hủy"
      confirmLoading={loading}
      onCancel={onClose}
      onOk={() => form.submit()}
      mask={{ closable: true }}
      styles={{
        body: {
          maxHeight: "72vh",
          overflowY: "auto",
          paddingRight: 8,
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSave}
      >
        <Card
          size="small"
          className="mb-5 border-slate-200"
          title="Thông tin cơ bản"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Vui lòng nhập họ và tên.",
                  },
                ]}
              >
                <Input size="large" placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>

            {!user && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email." },
                      {
                        type: "email",
                        message: "Email không đúng định dạng.",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="name@example.com" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="cccd"
                    label="Căn cước công dân"
                    rules={[
                      { required: true, message: "Vui lòng nhập CCCD." },
                      {
                        pattern: /^\d{12}$/,
                        message: "CCCD phải gồm 12 chữ số.",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      maxLength={12}
                      placeholder="Nhập 12 chữ số"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại.",
                      },
                      {
                        pattern: /^(0|\+84)[0-9]{9,10}$/,
                        message: "Số điện thoại không hợp lệ.",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="0901234567" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu." },
                      { min: 6, message: "Mật khẩu tối thiểu 6 ký tự." },
                    ]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Nhập mật khẩu"
                    />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col xs={24} md={12}>
              <Form.Item name="dateOfBirth" label="Ngày sinh">
                <Input size="large" type="date" />
              </Form.Item>
            </Col>

            {/* Đổi status khi cập nhật */}
            {user && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái tài khoản"
                  rules={[
                    { required: true, message: "Vui lòng chọn trạng thái." },
                  ]}
                >
                  <Select size="large" options={STATUS_OPTIONS} />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>

        <Card size="small" className="mb-5 border-slate-200" title="Địa chỉ">
          <Row gutter={[16, 0]}>
            <Col xs={24}>
              <Form.Item name="address" label="Địa chỉ">
                <TextArea
                  rows={2}
                  maxLength={300}
                  showCount
                  placeholder="Số nhà, đường..."
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="province" label="Tỉnh / Thành phố">
                <Input size="large" placeholder="Ví dụ: Hà Nội" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="ward" label="Phường / Xã">
                <Input size="large" placeholder="Ví dụ: Thanh Xuân" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          size="small"
          className="mb-5 border-slate-200"
          title="Liên hệ khẩn cấp"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="emergencyContactName"
                label="Người liên hệ khẩn cấp"
              >
                <Input size="large" placeholder="Họ và tên" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="emergencyContactPhone"
                label="SĐT liên hệ khẩn cấp"
                rules={[
                  {
                    pattern: /^(0|\+84)[0-9]{9,10}$/,
                    message: "Số điện thoại không hợp lệ.",
                  },
                ]}
              >
                <Input size="large" placeholder="0912345678" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  );
}
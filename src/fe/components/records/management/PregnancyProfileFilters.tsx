"use client";

import { Button, Card, Col, Form, Input, Row, Select, Space } from "antd";

import { RotateCcw, Search } from "lucide-react";

import type { GetManagementPregnancyProfilesParams } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";

interface Props {
  loading?: boolean;
  initialValues?: GetManagementPregnancyProfilesParams;

  onSearch: (values: GetManagementPregnancyProfilesParams) => void;

  onReset: () => void;
}

export function PregnancyProfileFilters({
  loading = false,
  initialValues,
  onSearch,
  onReset,
}: Props) {
  const [form] = Form.useForm<GetManagementPregnancyProfilesParams>();

  const handleSubmit = (values: GetManagementPregnancyProfilesParams) => {
    onSearch({
      ...values,
      name: values.name?.trim() || undefined,
      code: values.code?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        <Row gutter={[16, 4]}>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item label="Tên thai phụ" name="name">
              <Input
                allowClear
                placeholder="Nhập tên thai phụ"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item label="Mã hồ sơ" name="code">
              <Input
                allowClear
                placeholder="Ví dụ: PR-00001"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item label="Số điện thoại" name="phone">
              <Input
                allowClear
                placeholder="Nhập số điện thoại"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item label="Email" name="email">
              <Input
                allowClear
                placeholder="Nhập email"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item label="Mức nguy cơ" name="riskLevel">
              <Select
                allowClear
                placeholder="Tất cả mức nguy cơ"
                options={[
                  {
                    value: "low",
                    label: "Nguy cơ thấp",
                  },
                  {
                    value: "medium",
                    label: "Nguy cơ trung bình",
                  },
                  {
                    value: "high",
                    label: "Nguy cơ cao",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item label="Trạng thái" name="status">
              <Select
                allowClear
                placeholder="Tất cả trạng thái"
                options={[
                  {
                    value: "active",
                    label: "Đang theo dõi",
                  },
                  {
                    value: "completed",
                    label: "Đã hoàn thành",
                  },
                  {
                    value: "terminated",
                    label: "Đã kết thúc",
                  },
                  {
                    value: "deleted",
                    label: "Đã xóa",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            xl={12}
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <Form.Item>
              <Space wrap>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<Search size={16} />}
                >
                  Tìm kiếm
                </Button>

                <Button
                  disabled={loading}
                  icon={<RotateCcw size={16} />}
                  onClick={handleReset}
                >
                  Xóa bộ lọc
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}

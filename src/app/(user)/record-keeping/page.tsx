"use client";

import {
  Card,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  Upload,
  message,
} from "antd";

import {
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function RecordKeepingPage() {
  const columns = [
    {
      title: "Tên hồ sơ",
      dataIndex: "name",
      key: "name",
    },

    {
      title: "Ngày khám",
      dataIndex: "date",
      key: "date",
    },

    {
      title: "Loại file",
      key: "type",
      render: () => <Tag color="red">PDF</Tag>,
    },

    {
      title: "Thao tác",
      key: "action",
      render: () => (
        <Space>
          <Button icon={<EyeOutlined />}>Xem</Button>

          <Button icon={<EditOutlined />}>Cập nhật</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      name: "Hồ sơ khám thai tuần 12",
      date: "12/07/2026",
    },

    {
      key: "2",
      name: "Kết quả siêu âm",
      date: "20/07/2026",
    },
  ];

  return (
    <div
      style={{
        padding: 24,
      }}
    >
      <Title level={3}>Hồ sơ thai phụ</Title>

      {/* Patient Information */}

      <Card
        style={{
          marginBottom: 20,
        }}
      >
        <Space direction="vertical">
          <b>Mã bệnh nhân:</b>
          BN0000123
          <b>Họ tên:</b>
          Nguyễn Thị A<b>Trạng thái bảo mật:</b>
          <Tag color="green">Đã đồng ý</Tag>
        </Space>
      </Card>

      {/* Upload */}

      <Card title="Danh sách hồ sơ PDF">
        <Upload
          accept=".pdf"
          maxCount={1}
          beforeUpload={(file) => {
            if (file.type !== "application/pdf") {
              message.error("Chỉ được upload file PDF");

              return Upload.LIST_IGNORE;
            }

            return false;
          }}
        >
          <Button type="primary" icon={<UploadOutlined />}>
            Upload hồ sơ mới
          </Button>
        </Upload>

        <Table
          style={{
            marginTop: 20,
          }}
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 5,
          }}
        />
      </Card>
    </div>
  );
}

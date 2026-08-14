"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  Pencil,
  Plus,
} from "lucide-react";
import {
  createForumTopic,
  getForumTopics,
  updateForumTopic,
} from "@/management/features/forums/forums.api";
import {
  FORUM_CATEGORY_OPTIONS,
  FORUM_TOPIC_STATUS_OPTIONS,
} from "@/management/features/forums/forums.constants";
import type {
  ForumCategory,
  ForumTopic,
  ForumTopicStatus,
} from "@/management/features/forums/forums.types";
import {
  formatForumDateTime,
  getForumCategoryLabel,
  getForumErrorMessage,
} from "@/management/features/forums/forums.utils";

const {
  Paragraph,
  Text,
} = Typography;
const { TextArea } = Input;

type Props = {
  onTopicsChange: (
    topics: ForumTopic[],
  ) => void;
};

type TopicFormValues = {
  title: string;
  category: ForumCategory;
  description: string;
  status: ForumTopicStatus;
};

function TopicFormModal({
  open,
  topic,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  topic: ForumTopic | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (
    values: TopicFormValues,
  ) => Promise<void>;
}) {
  const [form] =
    Form.useForm<TopicFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          if (topic) {
            form.setFieldsValue({
              title: topic.title,
              category: topic.category,
              description:
                topic.description,
              status: topic.status,
            });
            return;
          }

          form.resetFields();
          form.setFieldsValue({
            title: "",
            category: "pregnancy",
            description: "",
            status: "active",
          });
        },
        0,
      );

    return () =>
      window.clearTimeout(timer);
  }, [form, open, topic]);

  return (
    <Modal
      open={open}
      centered
      width={680}
      title={
        topic
          ? "Cập nhật chủ đề"
          : "Thêm chủ đề"
      }
      okText={
        topic
          ? "Lưu thay đổi"
          : "Tạo chủ đề"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => form.submit()}
      mask={{
        closable: !submitting,
      }}
      forceRender
    >
      <Form<TopicFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) =>
          void onSubmit(values)
        }
      >
        <Form.Item
          name="title"
          label="Tên chủ đề"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                "Vui lòng nhập tên chủ đề.",
            },
          ]}
        >
          <Input
            maxLength={180}
            showCount
            placeholder="Nhập tên chủ đề"
          />
        </Form.Item>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="category"
              label="Danh mục"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn danh mục.",
                },
              ]}
            >
              <Select
                options={
                  FORUM_CATEGORY_OPTIONS
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn trạng thái.",
                },
              ]}
            >
              <Select
                options={
                  FORUM_TOPIC_STATUS_OPTIONS
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                "Vui lòng nhập mô tả.",
            },
          ]}
        >
          <TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder="Nhập mô tả chủ đề"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function ForumTopicsTab({
  onTopicsChange,
}: Props) {
  const { message } =
    App.useApp();

  const [topics, setTopics] =
    useState<ForumTopic[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [editingTopic, setEditingTopic] =
    useState<ForumTopic | null>(null);
  const [modalOpen, setModalOpen] =
    useState(false);

  const loadTopics =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getForumTopics();

        setTopics(data);
        onTopicsChange(data);
      } catch (loadError) {
        setError(
          getForumErrorMessage(
            loadError,
            "Có lỗi xảy ra khi tải chủ đề.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [onTopicsChange]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadTopics();
        },
        0,
      );

    return () =>
      window.clearTimeout(timer);
  }, [loadTopics]);

  async function handleSaveTopic(
    values: TopicFormValues,
  ) {
    setSubmitting(true);

    try {
      if (editingTopic) {
        await updateForumTopic(
          editingTopic.id,
          values,
        );
        message.success(
          "Cập nhật chủ đề thành công.",
        );
      } else {
        await createForumTopic(values);
        message.success(
          "Tạo chủ đề thành công.",
        );
      }

      setModalOpen(false);
      setEditingTopic(null);
      await loadTopics();
    } catch (saveError) {
      message.error(
        getForumErrorMessage(saveError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const columns:
    ColumnsType<ForumTopic> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (
        _value,
        _record,
        index,
      ) => index + 1,
    },
    {
      title: "Chủ đề",
      width: 270,
      render: (
        _value,
        topic,
      ) => (
        <div>
          <Text
            strong
            className="block"
          >
            {topic.title}
          </Text>
          <Text
            type="secondary"
            className="text-xs"
          >
            /{topic.slug}
          </Text>
        </div>
      ),
    },
    {
      title: "Danh mục",
      width: 165,
      render: (
        _value,
        topic,
      ) => (
        <Tag color="blue">
          {getForumCategoryLabel(
            topic.category,
          )}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      render: (
        value: string,
      ) => (
        <Paragraph
          ellipsis={{ rows: 2 }}
          className="!mb-0"
        >
          {value || "Chưa có mô tả"}
        </Paragraph>
      ),
    },
    {
      title: "Trạng thái",
      width: 135,
      align: "center",
      render: (
        _value,
        topic,
      ) => (
        <Tag
          color={
            topic.status === "active"
              ? "green"
              : "default"
          }
        >
          {topic.status === "active"
            ? "Hoạt động"
            : "Ngừng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 160,
      render: (
        value: string,
      ) =>
        formatForumDateTime(value),
    },
    {
      title: "Thao tác",
      width: 88,
      align: "center",
      render: (
        _value,
        topic,
      ) => (
        <Button
          icon={
            <Pencil className="h-4 w-4" />
          }
          onClick={() => {
            setEditingTopic(topic);
            setModalOpen(true);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() =>
              setError(null)
            }
          />
        ) : null}

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title="Danh sách chủ đề"
          extra={
            <Button
              type="primary"
              icon={
                <Plus className="h-4 w-4" />
              }
              onClick={() => {
                setEditingTopic(null);
                setModalOpen(true);
              }}
            >
              Thêm chủ đề
            </Button>
          }
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={topics}
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            className="management-table [&_.ant-table-cell]:px-3"
          />
        </Card>
      </div>

      <TopicFormModal
        open={modalOpen}
        topic={editingTopic}
        submitting={submitting}
        onClose={() => {
          if (submitting) {
            return;
          }

          setModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleSaveTopic}
      />
    </>
  );
}

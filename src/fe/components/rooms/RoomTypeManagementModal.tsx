"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  Eye,
  Pencil,
  Plus,
} from "lucide-react";
import {
  createRoomType,
  getRoomTypeById,
  getRoomTypes,
  updateRoomType,
} from "@/management/features/rooms/rooms.api";
import type {
  CreateRoomTypeInput,
  RoomStatus,
  RoomType,
  UpdateRoomTypeInput,
} from "@/management/features/rooms/rooms.types";
import {
  getRoomErrorMessage,
} from "@/management/features/rooms/rooms.utils";

const { Text } = Typography;
const { TextArea } = Input;

type RoomTypeManagementModalProps = {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

type RoomTypeFormValues = {
  name: string;
  description: string;
  status: RoomStatus;
};

function hasChanges(
  values: RoomTypeFormValues,
  editing: RoomType,
) {
  return (
    values.name.trim() !== editing.name ||
    values.description.trim() !==
      editing.description ||
    values.status !== editing.status
  );
}

export function RoomTypeManagementModal({
  open,
  onClose,
  onChanged,
}: RoomTypeManagementModalProps) {
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();
  const [form] =
    Form.useForm<RoomTypeFormValues>();
  const [items, setItems] = useState<
    RoomType[]
  >([]);
  const [searchInput, setSearchInput] =
    useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [status, setStatus] =
    useState<RoomStatus>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] =
    useState(10);
  const [total, setTotal] =
    useState(0);
  const [loading, setLoading] =
    useState(false);
  const [formOpen, setFormOpen] =
    useState(false);
  const [editing, setEditing] =
    useState<RoomType | null>(null);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);
  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setDebouncedSearch(
        searchInput.trim(),
      );
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, searchInput]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void getRoomTypes({
        search:
          debouncedSearch || undefined,
        status,
        page,
        limit,
      })
        .then((result) => {
          if (cancelled) return;

          setItems(result.items);
          setTotal(result.total);
        })
        .catch((loadError) => {
          if (cancelled) return;

          setError(
            getRoomErrorMessage(loadError),
          );
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    debouncedSearch,
    limit,
    open,
    page,
    reloadKey,
    status,
  ]);

  function refresh() {
    setReloadKey(
      (current) => current + 1,
    );
    onChanged();
  }

  useEffect(() => {
    if (!formOpen) return;

    const timer = window.setTimeout(() => {
      if (editing) {
        form.setFieldsValue({
          name: editing.name,
          description:
            editing.description,
          status: editing.status,
        });
        return;
      }

      form.resetFields();
      form.setFieldsValue({
        name: "",
        description: "",
        status: "active",
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [editing, form, formOpen]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function openEdit(
    roomType: RoomType,
  ) {
    try {
      const detail =
        await getRoomTypeById(
          roomType.id,
        );

      setEditing(detail);
      setFormOpen(true);
    } catch (loadError) {
      messageApi.error(
        getRoomErrorMessage(loadError),
      );
    }
  }

  async function openView(
    roomType: RoomType,
  ) {
    try {
      const detail =
        await getRoomTypeById(
          roomType.id,
        );

      modalApi.info({
        centered: true,
        width: 560,
        title: "Chi tiết loại phòng",
        okText: "Đóng",
        content: (
          <div className="space-y-3">
            <div>
              <Text type="secondary">Mã loại phòng</Text>
              <div className="font-semibold">
                {detail.code || detail.id}
              </div>
            </div>
            <div>
              <Text type="secondary">Tên loại phòng</Text>
              <div className="font-semibold">{detail.name}</div>
            </div>
            <div>
              <Text type="secondary">Mô tả</Text>
              <div>{detail.description || "Chưa cập nhật"}</div>
            </div>
            <div>
              <Text type="secondary">Trạng thái</Text>
              <div>
                {detail.status === "active" ? (
                  <Tag color="green">Hoạt động</Tag>
                ) : (
                  <Tag>Ngừng hoạt động</Tag>
                )}
              </div>
            </div>
          </div>
        ),
      });
    } catch (loadError) {
      messageApi.error(
        getRoomErrorMessage(loadError),
      );
    }
  }

  function closeForm() {
    if (submitting) return;

    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(
    values: RoomTypeFormValues,
  ) {
    if (
      editing &&
      !hasChanges(values, editing)
    ) {
      modalApi.info({
        centered: true,
        title: "Không có gì thay đổi",
        content:
          "Thông tin loại phòng hiện tại giống dữ liệu ban đầu.",
        okText: "Đóng",
      });
      return;
    }

    if (editing) {
      const confirmed =
        await new Promise<boolean>(
          (resolve) => {
            let resolved = false;

            const finish = (
              result: boolean,
            ) => {
              if (resolved) return;
              resolved = true;
              resolve(result);
            };

            modalApi.confirm({
              centered: true,
              title:
                "Xác nhận cập nhật loại phòng",
              content:
                "Bạn có chắc chắn muốn lưu các thay đổi không?",
              okText: "Cập nhật",
              cancelText: "Hủy",
              mask: {
                closable: false,
              },
              onOk: () => finish(true),
              onCancel: () =>
                finish(false),
            });
          },
        );

      if (!confirmed) return;
    }

    setSubmitting(true);

    try {
      if (editing) {
        const input: UpdateRoomTypeInput = {
          name: values.name.trim(),
          description:
            values.description.trim(),
          status: values.status,
        };

        const response =
          await updateRoomType(
            editing.id,
            input,
          );

        messageApi.success(
          response.message ||
            "Cập nhật loại phòng thành công.",
        );
      } else {
        const input: CreateRoomTypeInput = {
          name: values.name.trim(),
          description:
            values.description.trim(),
          status: values.status,
        };

        const response =
          await createRoomType(input);

        messageApi.success(
          response.message ||
            "Tạo loại phòng thành công.",
        );
      }

      setFormOpen(false);
      setEditing(null);
      form.resetFields();
      setPage(1);
      refresh();
    } catch (submitError) {
      messageApi.error(
        getRoomErrorMessage(submitError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnsType<RoomType> = [
    {
      title: "STT",
      width: 65,
      align: "center",
      render: (
        _value,
        _record,
        index,
      ) =>
        (page - 1) * limit +
        index +
        1,
    },
    {
      title: "Loại phòng",
      width: 240,
      render: (_value, roomType) => (
        <div className="min-w-0">
          <Text
            strong
            className="block truncate"
          >
            {roomType.name}
          </Text>

          <Text
            type="secondary"
            className="block truncate text-xs"
          >
            {roomType.code ||
              `ID: ${roomType.id}`}
          </Text>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
      render: (value: string) =>
        value || "Chưa cập nhật",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 145,
      align: "center",
      render: (value: RoomStatus) =>
        value === "active" ? (
          <Tag color="green">
            Hoạt động
          </Tag>
        ) : (
          <Tag>
            Ngừng hoạt động
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      width: 95,
      align: "center",
      render: (_value, roomType) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={
                <Eye className="h-4 w-4" />
              }
              onClick={() =>
                void openView(roomType)
              }
            />
          </Tooltip>

          <Tooltip title="Cập nhật">
            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={() =>
                void openEdit(roomType)
              }
            />
          </Tooltip>

        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        centered
        width={960}
        title="Quản lý loại phòng"
        footer={
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Đóng
            </Button>
          </div>
        }
        onCancel={onClose}
        mask={{
          closable: !loading,
        }}
        className="[&_.ant-modal-content]:max-h-[82vh] [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:p-0"
        styles={{
          header: {
            marginBottom: 0,
            padding: "20px 56px 14px 24px",
            borderBottom: "1px solid #e2e8f0",
          },
          body: {
            maxHeight: "64vh",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "18px 18px 20px 24px",
            scrollbarGutter: "stable",
          },
          footer: {
            marginTop: 0,
            padding: "12px 24px 18px",
            borderTop: "1px solid #e2e8f0",
          },
        }}
      >
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            className="mb-4"
            onClose={() => setError(null)}
          />
        ) : null}

        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Input
              allowClear
              value={searchInput}
              placeholder="Tìm tên hoặc mô tả loại phòng"
              onChange={(event) => {
                setSearchInput(
                  event.target.value,
                );
                setPage(1);
              }}
            />

            <Select
              allowClear
              value={status}
              placeholder="Tất cả trạng thái"
              options={[
                {
                  value: "active",
                  label: "Hoạt động",
                },
                {
                  value: "inactive",
                  label:
                    "Ngừng hoạt động",
                },
              ]}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
          </div>

          <Button
            type="primary"
            icon={
              <Plus className="h-4 w-4" />
            }
            onClick={openCreate}
          >
            Thêm loại phòng
          </Button>
        </div>

        <Table
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{
            x: 800,
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            pageSizeOptions: [
              10,
              20,
              50,
            ],
            onChange: (
              nextPage,
              nextLimit,
            ) => {
              setPage(
                nextLimit !== limit
                  ? 1
                  : nextPage,
              );
              setLimit(nextLimit);
            },
          }}
        />
      </Modal>

      <Modal
        open={formOpen}
        centered
        width={620}
        title={
          editing
            ? "Cập nhật loại phòng"
            : "Thêm loại phòng"
        }
        okText={
          editing ? "Cập nhật" : "Tạo mới"
        }
        cancelText="Hủy"
        confirmLoading={submitting}
        onOk={() => form.submit()}
        onCancel={closeForm}
        mask={{
          closable: !submitting,
        }}
        destroyOnHidden
      >
        {editing ? (
          <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2">
            <Text
              type="secondary"
              className="text-xs"
            >
              Mã loại phòng
            </Text>

            <Text
              strong
              className="ml-2"
            >
              {editing.code ||
                editing.id}
            </Text>
          </div>
        ) : null}

        <Form<RoomTypeFormValues>
          form={form}
          layout="vertical"
          onFinish={(values) =>
            void handleSubmit(values)
          }
        >
          <Form.Item
            name="name"
            label="Tên loại phòng"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Vui lòng nhập tên loại phòng.",
              },
              {
                max: 120,
                message:
                  "Tên loại phòng tối đa 120 ký tự.",
              },
            ]}
          >
            <Input placeholder="Ví dụ: Phòng siêu âm" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[
              {
                max: 500,
                message:
                  "Mô tả tối đa 500 ký tự.",
              },
            ]}
          >
            <TextArea
              rows={4}
              showCount
              maxLength={500}
              placeholder="Mô tả công năng của loại phòng"
            />
          </Form.Item>

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
              options={[
                {
                  value: "active",
                  label: "Hoạt động",
                },
                {
                  value: "inactive",
                  label:
                    "Ngừng hoạt động",
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

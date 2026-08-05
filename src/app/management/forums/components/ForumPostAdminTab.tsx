"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  createForumPost,
  deleteForumPost,
  getForumPosts,
  updateForumPost,
} from "@/management/features/forums/forums.api";
import type {
  CreateForumPostInput,
  ForumCategory,
  ForumPost,
  ForumPostStatus,
  ForumTopic,
  UpdateForumPostInput,
} from "@/management/features/forums/forums.types";

const { Text } = Typography;
const { TextArea } = Input;

type ForumPostAdminTabProps = {
  topics: ForumTopic[];
  canHardDelete: boolean;
};

type PostEditorMode =
  | "create"
  | "edit";

type PostEditorState =
  | {
      open: false;
      mode: PostEditorMode;
      post: null;
    }
  | {
      open: true;
      mode: "create";
      post: null;
    }
  | {
      open: true;
      mode: "edit";
      post: ForumPost;
    };

type PostEditorValues = {
  topicId: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  status: ForumPostStatus;
  commentable: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  moderationReason?: string;
};

const CATEGORY_LABELS: Record<
  ForumCategory,
  string
> = {
  pregnancy: "Thai kỳ",
  nutrition: "Dinh dưỡng",
  postpartum: "Sau sinh",
  ask_doctor: "Hỏi bác sĩ",
  booking_experience:
    "Kinh nghiệm đặt lịch",
};

const STATUS_OPTIONS: Array<{
  value: ForumPostStatus;
  label: string;
}> = [
  {
    value: "pending",
    label: "Chờ duyệt",
  },
  {
    value: "published",
    label: "Đã xuất bản",
  },
  {
    value: "hidden",
    label: "Đã ẩn",
  },
  {
    value: "rejected",
    label: "Đã từ chối",
  },
];

function getErrorMessage(
  error: unknown,
) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
          };
        };
      }
    ).response;

    const message =
      response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Đã có lỗi xảy ra.";
}

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

function getCreatedTime(
  post: ForumPost,
) {
  const value = new Date(
    post.createdAt,
  ).getTime();

  return Number.isNaN(value)
    ? 0
    : value;
}

function renderStatus(
  status: ForumPostStatus,
) {
  const colors: Record<
    ForumPostStatus,
    string
  > = {
    pending: "gold",
    published: "green",
    hidden: "orange",
    rejected: "red",
    deleted: "default",
  };

  return (
    <Tag color={colors[status]}>
      {STATUS_OPTIONS.find(
        (item) =>
          item.value === status,
      )?.label ??
        (status === "deleted"
          ? "Đã xóa"
          : status)}
    </Tag>
  );
}

function PostEditorModal({
  state,
  topics,
  submitting,
  onClose,
  onSubmit,
}: {
  state: PostEditorState;
  topics: ForumTopic[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (
    values: PostEditorValues,
  ) => Promise<void>;
}) {
  const [form] =
    Form.useForm<PostEditorValues>();

  const activeTopics =
    topics.filter(
      (topic) =>
        topic.status === "active",
    );

  const topicOptions =
    topics.map((topic) => ({
      value: topic.id,
      label: `${topic.title} · ${
        CATEGORY_LABELS[
          topic.category
        ]
      }${
        topic.status ===
        "inactive"
          ? " · Ngừng hoạt động"
          : ""
      }`,
      disabled:
        state.mode === "create" &&
        topic.status !== "active",
    }));

  function syncForm(
    nextOpen: boolean,
  ) {
    if (!nextOpen) {
      form.resetFields();
      return;
    }

    if (
      state.open &&
      state.mode === "edit"
    ) {
      form.setFieldsValue({
        topicId:
          state.post.topicId,
        title: state.post.title,
        content:
          state.post.content,
        coverImageUrl:
          state.post
            .coverImageUrl ||
          undefined,
        status:
          state.post.status,
        commentable:
          state.post.commentable,
        isPinned:
          state.post.isPinned,
        isFeatured:
          state.post.isFeatured,
        moderationReason:
          state.post
            .moderationReason ||
          undefined,
      });

      return;
    }

    form.setFieldsValue({
      topicId: undefined,
      title: "",
      content: "",
      coverImageUrl:
        undefined,
      status: "pending",
      commentable: true,
      isPinned: false,
      isFeatured: false,
      moderationReason:
        "Bài viết được tạo từ màn quản trị.",
    });
  }

  const isCreate =
    state.mode === "create";

  return (
    <Modal
      open={state.open}
      centered
      forceRender
      width={760}
      title={
        isCreate
          ? "Tạo bài viết"
          : "Chỉnh sửa bài viết"
      }
      okText={
        isCreate
          ? "Tạo bài viết"
          : "Lưu thay đổi"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{
        disabled:
          isCreate &&
          activeTopics.length === 0,
      }}
      onCancel={onClose}
      onOk={() => form.submit()}
      afterOpenChange={
        syncForm
      }
      mask={{
        closable: !submitting,
      }}
      styles={{
        body: {
          overflow: "hidden",
          paddingTop: 8,
        },
        footer: {
          marginTop: 24,
        },
      }}
    >
      <div className="mt-2 max-h-[calc(80vh-5rem)] overflow-y-auto pr-2">
        {isCreate &&
        activeTopics.length ===
          0 ? (
          <Alert
            type="warning"
            showIcon
            className="!mb-4"
            title="Chưa có chủ đề hoạt động"
            description="Hãy tạo hoặc kích hoạt ít nhất một chủ đề trước khi tạo bài viết."
          />
        ) : null}

        <Form<PostEditorValues>
          form={form}
          layout="vertical"
          onFinish={(values) =>
            void onSubmit(values)
          }
        >
          <Form.Item
            name="topicId"
            label="Chủ đề"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn chủ đề.",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn chủ đề"
              options={topicOptions}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Vui lòng nhập tiêu đề.",
              },
              {
                min: 5,
                message:
                  "Tiêu đề cần ít nhất 5 ký tự.",
              },
              {
                max: 250,
                message:
                  "Tiêu đề không vượt quá 250 ký tự.",
              },
            ]}
          >
            <Input
              showCount
              maxLength={250}
              placeholder="Nhập tiêu đề bài viết"
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Vui lòng nhập nội dung.",
              },
              {
                min: 10,
                message:
                  "Nội dung cần ít nhất 10 ký tự.",
              },
            ]}
          >
            <TextArea
              rows={8}
              placeholder="Nhập nội dung bài viết"
            />
          </Form.Item>

          <Form.Item
            name="coverImageUrl"
            label="Đường dẫn ảnh bìa"
            rules={[
              {
                type: "url",
                message:
                  "Đường dẫn ảnh bìa không hợp lệ.",
              },
            ]}
          >
            <Input placeholder="https://cdn.example.com/forum-cover.jpg" />
          </Form.Item>

          <div className="grid gap-4 sm:grid-cols-2">
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
                  STATUS_OPTIONS
                }
              />
            </Form.Item>

            <Form.Item
              name="commentable"
              label="Cho phép bình luận"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Cho phép"
                unCheckedChildren="Đã khóa"
              />
            </Form.Item>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item
              name="isPinned"
              label="Ghim bài viết"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Có"
                unCheckedChildren="Không"
              />
            </Form.Item>

            <Form.Item
              name="isFeatured"
              label="Đánh dấu nổi bật"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Có"
                unCheckedChildren="Không"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="moderationReason"
            label="Ghi chú quản trị"
          >
            <TextArea
              rows={3}
              showCount
              maxLength={500}
              placeholder="Nhập ghi chú cho lần tạo hoặc cập nhật này"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

export function ForumPostAdminTab({
  topics,
  canHardDelete,
}: ForumPostAdminTabProps) {
  const { message } =
    App.useApp();

  const [posts, setPosts] =
    useState<ForumPost[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const [keyword, setKeyword] =
    useState("");
  const [topicFilter, setTopicFilter] =
    useState<string>();
  const [statusFilter, setStatusFilter] =
    useState<
      ForumPostStatus | undefined
    >();

  const [page, setPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(10);
  const [total, setTotal] =
    useState(0);

  const [
    editorState,
    setEditorState,
  ] = useState<PostEditorState>({
    open: false,
    mode: "create",
    post: null,
  });
  const [
    deletingPost,
    setDeletingPost,
  ] = useState<ForumPost | null>(
    null,
  );
  const [
    deleteReason,
    setDeleteReason,
  ] = useState("");

  const loadPosts =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getForumPosts({
            page,
            limit: pageSize,
            search:
              keyword.trim() ||
              undefined,
            topicId: topicFilter,
            status: statusFilter,
          });

        const newestPosts = [
          ...result.items,
        ].sort(
          (left, right) =>
            getCreatedTime(right) -
            getCreatedTime(left),
        );

        setPosts(newestPosts);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(
          result.limit,
        );
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      keyword,
      page,
      pageSize,
      statusFilter,
      topicFilter,
    ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPosts]);

  const topicOptions =
    useMemo(
      () =>
        topics.map((topic) => ({
          value: topic.id,
          label: topic.title,
        })),
      [topics],
    );

  async function handleSubmit(
    values: PostEditorValues,
  ) {
    setSubmitting(true);

    try {
      if (
        editorState.open &&
        editorState.mode ===
          "edit"
      ) {
        const input:
          UpdateForumPostInput = {
          topicId:
            values.topicId,
          title: values.title,
          content:
            values.content,
          coverImageUrl:
            values.coverImageUrl,
          status:
            values.status,
          commentable:
            values.commentable,
          isPinned:
            values.isPinned,
          isFeatured:
            values.isFeatured,
          moderationReason:
            values.moderationReason,
        };

        await updateForumPost(
          editorState.post.id,
          input,
        );

        message.success(
          "Cập nhật bài viết thành công.",
        );
      } else {
        const input:
          CreateForumPostInput = {
          topicId:
            values.topicId,
          title: values.title,
          content:
            values.content,
          coverImageUrl:
            values.coverImageUrl,
          status:
            values.status,
          commentable:
            values.commentable,
          isPinned:
            values.isPinned,
          isFeatured:
            values.isFeatured,
          moderationReason:
            values.moderationReason,
        };

        await createForumPost(
          input,
        );

        message.success(
          "Tạo bài viết thành công.",
        );
      }

      setEditorState({
        open: false,
        mode: "create",
        post: null,
      });

      if (
        editorState.mode ===
          "create" &&
        page !== 1
      ) {
        setPage(1);
      } else {
        await loadPosts();
      }
    } catch (submitError) {
      message.error(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openDelete(
    post: ForumPost,
  ) {
    setDeleteReason("");
    setDeletingPost(post);
  }

  function closeDelete() {
    if (deleting) {
      return;
    }

    setDeletingPost(null);
    setDeleteReason("");
  }

  async function confirmDelete() {
    if (
      !deletingPost ||
      !canHardDelete
    ) {
      return;
    }

    const reason =
      deleteReason.trim();

    if (!reason) {
      message.warning(
        "Vui lòng nhập lý do xóa cứng.",
      );
      return;
    }

    setDeleting(true);

    try {
      await deleteForumPost(
        deletingPost.id,
        { reason },
      );

      message.success(
        "Xóa cứng bài viết thành công.",
      );
      setDeletingPost(null);
      setDeleteReason("");

      if (
        posts.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1,
        );
      } else {
        await loadPosts();
      }
    } catch (deleteError) {
      message.error(
        getErrorMessage(
          deleteError,
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  const columns:
    ColumnsType<ForumPost> = [
    {
      title: "STT",
      width: "6%",
      align: "center",
      render: (
        _value,
        _post,
        index,
      ) =>
        (page - 1) *
          pageSize +
        index +
        1,
    },
    {
      title: "Bài viết",
      width: "36%",
      render: (
        _value,
        post,
      ) => (
        <div className="min-w-0">
          <Text
            strong
            ellipsis={{
              tooltip:
                post.title,
            }}
            className="block"
          >
            {post.title}
          </Text>

          <Text
            type="secondary"
            className="block text-xs"
          >
            ID: {post.id}
          </Text>
        </div>
      ),
    },
    {
      title: "Chủ đề",
      width: "18%",
      render: (
        _value,
        post,
      ) => (
        <Text
          ellipsis={{
            tooltip:
              post.topicTitle,
          }}
          className="block"
        >
          {post.topicTitle ||
            topics.find(
              (topic) =>
                topic.id ===
                post.topicId,
            )?.title ||
            "Chưa cập nhật"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      width: "13%",
      align: "center",
      render: (
        _value,
        post,
      ) =>
        renderStatus(
          post.status,
        ),
    },
    {
      title: "Cập nhật",
      width: "15%",
      render: (
        _value,
        post,
      ) =>
        formatDateTime(
          post.updatedAt,
        ),
    },
    {
      title: "Thao tác",
      width: "12%",
      align: "center",
      render: (
        _value,
        post,
      ) => (
        <Space size={6}>
          <Tooltip title="Chỉnh sửa bài viết">
            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={() =>
                setEditorState({
                  open: true,
                  mode: "edit",
                  post,
                })
              }
            />
          </Tooltip>

          <Tooltip
            title={
              canHardDelete
                ? "Xóa cứng bài viết"
                : "Chỉ Super Admin được xóa cứng"
            }
          >
            <span>
              <Button
                danger
                disabled={
                  !canHardDelete
                }
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={() =>
                  openDelete(post)
                }
              />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <Alert
          type="error"
          showIcon
          closable
          title={error}
          onClose={() =>
            setError(null)
          }
        />
      ) : null}

      {!canHardDelete ? (
        <Alert
          type="info"
          showIcon
          title="Quyền xóa cứng"
          description="Tài khoản quản trị viên có thể tạo và chỉnh sửa bài viết. Xóa cứng chỉ dành cho Super Admin."
        />
      ) : null}

      <Card className="border-slate-200 bg-white">
        <div className="grid min-w-0 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden">
          <Input
            allowClear
            value={keyword}
            prefix={
              <Search className="h-4 w-4 text-slate-400" />
            }
            placeholder="Tìm theo tiêu đề hoặc nội dung"
            className="min-w-0"
            onChange={(event) => {
              setKeyword(
                event.target.value,
              );
              setPage(1);
            }}
          />

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={topicFilter}
            options={topicOptions}
            placeholder="Chủ đề"
            className="min-w-0 w-full"
            onChange={(value) => {
              setTopicFilter(
                value,
              );
              setPage(1);
            }}
          />

          <Select
            allowClear
            value={statusFilter}
            options={
              STATUS_OPTIONS
            }
            placeholder="Trạng thái"
            className="min-w-0 w-full"
            onChange={(value) => {
              setStatusFilter(
                value,
              );
              setPage(1);
            }}
          />

          <Button
            type="primary"
            icon={
              <Plus className="h-4 w-4" />
            }
            className="shrink-0 whitespace-nowrap"
            onClick={() =>
              setEditorState({
                open: true,
                mode: "create",
                post: null,
              })
            }
          >
            Tạo bài viết
          </Button>
        </div>
      </Card>

      <Card
        className="overflow-hidden border-slate-200 bg-white"
        styles={{
          body: {
            padding: 0,
          },
        }}
        title="Danh sách quản trị bài viết"
      >
        <Table
          rowKey="id"
          tableLayout="fixed"
          loading={loading}
          columns={columns}
          dataSource={posts}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [
              10,
              20,
              50,
            ],
            showTotal: (
              count,
              range,
            ) =>
              `${range[0]}-${range[1]} / ${count} bài viết`,
            onChange: (
              nextPage,
              nextPageSize,
            ) => {
              if (
                nextPageSize !==
                pageSize
              ) {
                setPageSize(
                  nextPageSize,
                );
                setPage(1);
                return;
              }

              setPage(
                nextPage,
              );
            },
          }}
        />
      </Card>

      <PostEditorModal
        state={editorState}
        topics={topics}
        submitting={submitting}
        onClose={() => {
          if (!submitting) {
            setEditorState({
              open: false,
              mode: "create",
              post: null,
            });
          }
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        open={Boolean(
          deletingPost,
        )}
        centered
        width={520}
        title="Xóa cứng bài viết"
        okText="Xóa vĩnh viễn"
        cancelText="Hủy"
        okButtonProps={{
          danger: true,
          disabled:
            !deleteReason.trim() ||
            !canHardDelete,
        }}
        confirmLoading={deleting}
        onCancel={closeDelete}
        onOk={() =>
          void confirmDelete()
        }
        mask={{
          closable: !deleting,
        }}
        styles={{
          footer: {
            marginTop: 28,
          },
        }}
      >
        <Alert
          type="error"
          showIcon
          title="Hành động không thể hoàn tác"
          description="Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống, không phải chuyển sang trạng thái Đã xóa."
        />

        <div className="mt-4">
          <Text
            type="secondary"
            className="block text-xs"
          >
            Bài viết
          </Text>
          <Text
            strong
            className="mt-1 block"
          >
            {deletingPost?.title}
          </Text>
        </div>

        <div className="mt-4 pb-2">
          <label className="mb-2 block text-sm font-semibold">
            Lý do xóa cứng{" "}
            <span className="text-red-500">
              *
            </span>
          </label>

          <TextArea
            rows={4}
            showCount
            maxLength={500}
            value={deleteReason}
            disabled={deleting}
            placeholder="Nhập lý do xóa cứng bài viết"
            onChange={(event) =>
              setDeleteReason(
                event.target.value,
              )
            }
          />
        </div>
      </Modal>
    </div>
  );
}
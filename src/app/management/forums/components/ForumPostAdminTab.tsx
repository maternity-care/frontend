"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Plus,
  Redo2,
  Search,
  Trash2,
  Underline,
  Undo2,
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
  realtimeVersion?: number;
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

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Nhập nội dung bài viết...",
}: RichTextEditorProps) {
  const editorRef =
    useRef<HTMLDivElement | null>(
      null,
    );
  const savedRangeRef =
    useRef<Range | null>(null);

  useEffect(() => {
    const editor =
      editorRef.current;

    if (
      editor &&
      editor.innerHTML !== value
    ) {
      editor.innerHTML = value;
    }
  }, [value]);

  function emitChange() {
    onChange?.(
      editorRef.current
        ?.innerHTML ?? "",
    );
  }

  function saveSelection() {
    const selection =
      window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0 ||
      !editorRef.current
    ) {
      return;
    }

    const range =
      selection.getRangeAt(0);

    if (
      editorRef.current.contains(
        range.commonAncestorContainer,
      )
    ) {
      savedRangeRef.current =
        range.cloneRange();
    }
  }

  function restoreSelection() {
    const range =
      savedRangeRef.current;
    const selection =
      window.getSelection();

    if (!range || !selection) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function focusEditor() {
    editorRef.current?.focus();
    restoreSelection();
  }

  function runCommand(
    command: string,
    commandValue?: string,
  ) {
    focusEditor();

    document.execCommand(
      "styleWithCSS",
      false,
      "true",
    );
    document.execCommand(
      command,
      false,
      commandValue,
    );

    emitChange();
    saveSelection();
  }

  const toolbarButtonClass =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-950";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div
        className="flex w-full flex-nowrap items-center gap-1 overflow-hidden border-b border-slate-200 bg-slate-50 px-2 py-1.5"
        style={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
        }}
        onMouseDown={saveSelection}
      >
        <Tooltip title="Hoàn tác">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("undo")
            }
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Làm lại">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("redo")
            }
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <div
          className="shrink-0"
          style={{
            width: 92,
            minWidth: 92,
            flex: "0 0 92px",
          }}
        >
          <Select
            size="small"
            defaultValue="p"
            popupMatchSelectWidth={
              false
            }
            style={{
              width: "100%",
            }}
            options={[
              {
                value: "p",
                label: "Văn bản",
              },
              {
                value: "h1",
                label: "Tiêu đề 1",
              },
              {
                value: "h2",
                label: "Tiêu đề 2",
              },
              {
                value: "h3",
                label: "Tiêu đề 3",
              },
            ]}
            onOpenChange={(open) => {
              if (open) {
                saveSelection();
              }
            }}
            onChange={(nextValue) =>
              runCommand(
                "formatBlock",
                nextValue,
              )
            }
          />
        </div>

        <div
          className="shrink-0"
          style={{
            width: 72,
            minWidth: 72,
            flex: "0 0 72px",
          }}
        >
          <Select
            size="small"
            defaultValue="3"
            popupMatchSelectWidth={
              false
            }
            style={{
              width: "100%",
            }}
            options={[
              {
                value: "2",
                label: "12 px",
              },
              {
                value: "3",
                label: "16 px",
              },
              {
                value: "4",
                label: "18 px",
              },
              {
                value: "5",
                label: "24 px",
              },
              {
                value: "6",
                label: "32 px",
              },
            ]}
            onOpenChange={(open) => {
              if (open) {
                saveSelection();
              }
            }}
            onChange={(nextValue) =>
              runCommand(
                "fontSize",
                nextValue,
              )
            }
          />
        </div>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="In đậm">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("bold")
            }
          >
            <Bold className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="In nghiêng">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("italic")
            }
          >
            <Italic className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Gạch chân">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "underline",
              )
            }
          >
            <Underline className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="Căn trái">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyLeft",
              )
            }
          >
            <AlignLeft className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn giữa">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyCenter",
              )
            }
          >
            <AlignCenter className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn phải">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyRight",
              )
            }
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn đều">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyFull",
              )
            }
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="Danh sách dấu chấm">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "insertUnorderedList",
              )
            }
          >
            <List className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Danh sách đánh số">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "insertOrderedList",
              )
            }
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </Tooltip>

      </div>

      <div className="relative">
        {!value ? (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">
            {placeholder}
          </span>
        ) : null}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[130px] px-4 py-3 text-sm leading-7 text-slate-800 outline-none [&_a]:text-blue-600 [&_a]:underline [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
          onInput={emitChange}
          onBlur={() => {
            emitChange();
            saveSelection();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
        />
      </div>
    </div>
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
      width={960}
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
          marginTop: 12,
        },
      }}
    >
      <div className="mt-2 max-h-[62vh] overflow-y-auto pr-2">
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
          className="[&_.ant-form-item]:!mb-4"
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
                validator: async (
                  _rule,
                  content?: string,
                ) => {
                  const html =
                    String(
                      content ?? "",
                    );
                  const plainText =
                    html
                      .replace(
                        /<[^>]*>/g,
                        "",
                      )
                      .replace(
                        /&nbsp;/g,
                        " ",
                      )
                      .trim();
                  const hasImage =
                    /<img[\s\S]*?>/i.test(
                      html,
                    );

                  if (
                    !plainText &&
                    !hasImage
                  ) {
                    throw new Error(
                      "Vui lòng nhập nội dung bài viết.",
                    );
                  }

                  if (
                    plainText.length <
                      10 &&
                    !hasImage
                  ) {
                    throw new Error(
                      "Nội dung cần ít nhất 10 ký tự.",
                    );
                  }
                },
              },
            ]}
          >
            <RichTextEditor />
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
              rows={1}
              autoSize={{
                minRows: 1,
                maxRows: 2,
              }}
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
  realtimeVersion = 0,
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
  }, [loadPosts, realtimeVersion]);

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

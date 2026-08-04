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
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Lock,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Pin,
  Plus,
  Search,
  ShieldAlert,
  Star,
  Tags,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  createForumTopic,
  getForumPost,
  getForumPosts,
  getForumReports,
  getForumTopics,
  moderateForumComment,
  moderateForumPost,
  resolveForumReport,
  updateForumTopic,
} from "@/management/features/forums/forums.api";
import type {
  ForumAuthorRole,
  ForumCategory,
  ForumComment,
  ForumCommentModerationAction,
  ForumPost,
  ForumPostModerationAction,
  ForumPostStatus,
  ForumReport,
  ForumReportResolveAction,
  ForumTopic,
  ForumTopicStatus,
} from "@/management/features/forums/forums.types";

const {
  Paragraph,
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type ForumView =
  | "posts"
  | "comments"
  | "reports"
  | "topics";

type TopicFormValues = {
  title: string;
  category: ForumCategory;
  description: string;
  status: ForumTopicStatus;
};

type ModerationRequest =
  | {
      kind: "post";
      target: ForumPost;
      action:
        ForumPostModerationAction;
    }
  | {
      kind: "comment";
      target: ForumComment;
      action:
        ForumCommentModerationAction;
    };

type ReportResolveRequest = {
  report: ForumReport;
};

const CATEGORY_OPTIONS: Array<{
  value: ForumCategory;
  label: string;
}> = [
  {
    value: "pregnancy",
    label: "Thai kỳ",
  },
  {
    value: "nutrition",
    label: "Dinh dưỡng",
  },
  {
    value: "postpartum",
    label: "Sau sinh",
  },
  {
    value: "ask_doctor",
    label: "Hỏi bác sĩ",
  },
  {
    value:
      "booking_experience",
    label: "Kinh nghiệm đặt lịch",
  },
];

const POST_STATUS_OPTIONS: Array<{
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
  {
    value: "deleted",
    label: "Đã xóa",
  },
];

const AUTHOR_ROLE_OPTIONS: Array<{
  value: ForumAuthorRole;
  label: string;
}> = [
  {
    value: "user",
    label: "Người dùng",
  },
  {
    value: "staff",
    label: "Nhân viên",
  },
  {
    value: "doctor",
    label: "Bác sĩ",
  },
  {
    value: "moderator",
    label: "Kiểm duyệt viên",
  },
  {
    value: "admin",
    label: "Quản trị viên",
  },
];

const POST_ACTION_OPTIONS: Array<{
  value: ForumPostModerationAction;
  label: string;
}> = [
  {
    value: "approve",
    label: "Duyệt bài",
  },
  {
    value: "hide",
    label: "Ẩn bài",
  },
  {
    value: "reject",
    label: "Từ chối",
  },
  {
    value: "delete",
    label: "Xóa bài",
  },
  {
    value: "lock",
    label: "Khóa bình luận",
  },
  {
    value: "pin",
    label: "Ghim bài",
  },
  {
    value: "feature",
    label: "Đánh dấu nổi bật",
  },
];

const COMMENT_ACTION_OPTIONS: Array<{
  value: ForumCommentModerationAction;
  label: string;
}> = [
  {
    value: "approve",
    label: "Cho hiển thị",
  },
  {
    value: "hide",
    label: "Ẩn bình luận",
  },
  {
    value: "reject",
    label: "Từ chối bình luận",
  },
  {
    value: "delete",
    label: "Xóa bình luận",
  },
];

const REPORT_ACTION_OPTIONS: Array<{
  value: ForumReportResolveAction;
  label: string;
}> = [
  {
    value: "hide",
    label: "Ẩn nội dung",
  },
  {
    value: "delete",
    label: "Xóa nội dung",
  },
  {
    value: "dismiss",
    label: "Bỏ qua báo cáo",
  },
];

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi xử lý dữ liệu diễn đàn.";
}

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
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

function categoryLabel(
  category: ForumCategory,
) {
  return (
    CATEGORY_OPTIONS.find(
      (item) =>
        item.value === category,
    )?.label ?? category
  );
}

function authorRoleLabel(
  role: ForumAuthorRole,
) {
  return (
    AUTHOR_ROLE_OPTIONS.find(
      (item) => item.value === role,
    )?.label ?? role
  );
}

function postStatusTag(
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
      {POST_STATUS_OPTIONS.find(
        (item) =>
          item.value === status,
      )?.label ?? status}
    </Tag>
  );
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
    if (!open) return;

    const timer =
      window.setTimeout(() => {
        if (topic) {
          form.setFieldsValue({
            title: topic.title,
            category:
              topic.category,
            description:
              topic.description,
            status: topic.status,
          });
        } else {
          form.resetFields();
          form.setFieldsValue({
            title: "",
            category:
              "pregnancy",
            description: "",
            status: "active",
          });
        }
      }, 0);

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
      destroyOnHidden
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
                  CATEGORY_OPTIONS
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
                options={[
                  {
                    value: "active",
                    label:
                      "Hoạt động",
                  },
                  {
                    value:
                      "inactive",
                    label:
                      "Ngừng hoạt động",
                  },
                ]}
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

function ModerationModal({
  request,
  submitting,
  onClose,
  onConfirm,
}: {
  request:
    | ModerationRequest
    | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (
    reason: string,
  ) => Promise<void>;
}) {
  const [reason, setReason] =
    useState("");

  useEffect(() => {
    if (!request) return;

    const timer =
      window.setTimeout(
        () => setReason(""),
        0,
      );

    return () =>
      window.clearTimeout(timer);
  }, [request]);

  if (!request) return null;

  const actionOptions =
    request.kind === "post"
      ? POST_ACTION_OPTIONS
      : COMMENT_ACTION_OPTIONS;
  const actionLabel =
    actionOptions.find(
      (item) =>
        item.value ===
        request.action,
    )?.label ?? request.action;
  const targetTitle =
    request.kind === "post"
      ? request.target.title
      : request.target.content;

  return (
    <Modal
      open
      centered
      width={560}
      title={actionLabel}
      okText={actionLabel}
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{
        danger: [
          "hide",
          "reject",
          "delete",
        ].includes(
          request.action,
        ),
        disabled: !reason.trim(),
      }}
      onCancel={onClose}
      onOk={() =>
        void onConfirm(reason.trim())
      }
      mask={{
        closable: !submitting,
      }}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text
          type="secondary"
          className="block text-xs"
        >
          Nội dung xử lý
        </Text>
        <Text
          strong
          className="mt-1 block line-clamp-3"
        >
          {targetTitle}
        </Text>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          Lý do kiểm duyệt{" "}
          <span className="text-red-500">
            *
          </span>
        </label>

        <TextArea
          rows={4}
          maxLength={500}
          showCount
          value={reason}
          placeholder="Nhập lý do xử lý nội dung"
          onChange={(event) =>
            setReason(
              event.target.value,
            )
          }
        />
      </div>
    </Modal>
  );
}

function ReportResolveModal({
  request,
  submitting,
  onClose,
  onConfirm,
}: {
  request:
    | ReportResolveRequest
    | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (
    action: ForumReportResolveAction,
    note: string,
  ) => Promise<void>;
}) {
  const [action, setAction] =
    useState<ForumReportResolveAction>(
      "hide",
    );
  const [note, setNote] =
    useState("");

  useEffect(() => {
    if (!request) return;

    const timer =
      window.setTimeout(() => {
        setAction("hide");
        setNote("");
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [request]);

  if (!request) return null;

  return (
    <Modal
      open
      centered
      width={580}
      title="Xử lý báo cáo"
      okText="Xác nhận xử lý"
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{
        disabled: !note.trim(),
      }}
      onCancel={onClose}
      onOk={() =>
        void onConfirm(
          action,
          note.trim(),
        )
      }
      mask={{
        closable: !submitting,
      }}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text
          type="secondary"
          className="block text-xs"
        >
          Mã báo cáo
        </Text>
        <Text strong>
          {request.report.id}
        </Text>

        <Paragraph className="!mb-0 !mt-3">
          {request.report.description ||
            request.report.reason ||
            "Không có mô tả."}
        </Paragraph>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold">
          Hành động
        </label>
        <Select
          className="w-full"
          value={action}
          options={
            REPORT_ACTION_OPTIONS
          }
          onChange={setAction}
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold">
          Ghi chú xử lý{" "}
          <span className="text-red-500">
            *
          </span>
        </label>
        <TextArea
          rows={4}
          maxLength={500}
          showCount
          value={note}
          onChange={(event) =>
            setNote(
              event.target.value,
            )
          }
        />
      </div>
    </Modal>
  );
}

function PostDetailModal({
  post,
  loading,
  onClose,
  onModeratePost,
  onModerateComment,
}: {
  post: ForumPost | null;
  loading: boolean;
  onClose: () => void;
  onModeratePost: (
    post: ForumPost,
    action:
      ForumPostModerationAction,
  ) => void;
  onModerateComment: (
    comment: ForumComment,
    action:
      ForumCommentModerationAction,
  ) => void;
}) {
  return (
    <Modal
      open={Boolean(post)}
      centered
      width={1040}
      title={null}
      footer={null}
      loading={loading}
      onCancel={onClose}
      styles={{
        body: {
          maxHeight: "82vh",
          overflowY: "auto",
        },
      }}
    >
      {post ? (
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Title
                  level={3}
                  className="!mb-0"
                >
                  {post.title}
                </Title>
                {postStatusTag(
                  post.status,
                )}
                {post.isPinned ? (
                  <Tag
                    color="blue"
                    icon={
                      <Pin className="h-3.5 w-3.5" />
                    }
                  >
                    Đã ghim
                  </Tag>
                ) : null}
                {post.isFeatured ? (
                  <Tag
                    color="gold"
                    icon={
                      <Star className="h-3.5 w-3.5" />
                    }
                  >
                    Nổi bật
                  </Tag>
                ) : null}
                {post.isLocked ? (
                  <Tag
                    icon={
                      <Lock className="h-3.5 w-3.5" />
                    }
                  >
                    Đã khóa
                  </Tag>
                ) : null}
              </div>

              <Text
                type="secondary"
                className="mt-2 block"
              >
                {post.authorName} ·{" "}
                {authorRoleLabel(
                  post.authorRole,
                )}{" "}
                ·{" "}
                {formatDateTime(
                  post.createdAt,
                )}
              </Text>
            </div>

            <Space wrap>
              {post.status !==
              "published" ? (
                <Button
                  type="primary"
                  icon={
                    <CheckCircle2 className="h-4 w-4" />
                  }
                  onClick={() =>
                    onModeratePost(
                      post,
                      "approve",
                    )
                  }
                >
                  Duyệt bài
                </Button>
              ) : (
                <Button
                  icon={
                    <EyeOff className="h-4 w-4" />
                  }
                  onClick={() =>
                    onModeratePost(
                      post,
                      "hide",
                    )
                  }
                >
                  Ẩn bài
                </Button>
              )}

              <Button
                icon={
                  <Lock className="h-4 w-4" />
                }
                onClick={() =>
                  onModeratePost(
                    post,
                    "lock",
                  )
                }
              >
                Khóa
              </Button>

              <Button
                icon={
                  <Pin className="h-4 w-4" />
                }
                onClick={() =>
                  onModeratePost(
                    post,
                    "pin",
                  )
                }
              >
                Ghim
              </Button>
            </Space>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="rounded-xl border border-slate-200 p-5">
              <Tag color="blue">
                {categoryLabel(
                  post.category,
                )}
              </Tag>

              {post.excerpt ? (
                <Paragraph className="!mt-4 !font-medium">
                  {post.excerpt}
                </Paragraph>
              ) : null}

              <Paragraph className="!mb-0 whitespace-pre-wrap leading-7 text-slate-700">
                {stripHtml(
                  post.content,
                ) ||
                  "Nội dung bài viết chưa được backend trả về."}
              </Paragraph>
            </div>

            <div className="space-y-3">
              <Card size="small">
                <Statistic
                  title="Lượt xem"
                  value={post.viewCount}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="Bình luận"
                  value={
                    post.commentCount
                  }
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="Báo cáo"
                  value={
                    post.reportCount
                  }
                />
              </Card>
            </div>
          </div>

          <div className="mt-5">
            <Title level={5}>
              Bình luận trong bài
            </Title>

            {post.comments.length >
            0 ? (
              <div className="space-y-3">
                {post.comments.map(
                  (comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row">
                        <div>
                          <Text strong>
                            {
                              comment.authorName
                            }
                          </Text>
                          <Text
                            type="secondary"
                            className="ml-2 text-xs"
                          >
                            {formatDateTime(
                              comment.createdAt,
                            )}
                          </Text>
                        </div>

                        <Space>
                          <Button
                            size="small"
                            type="primary"
                            onClick={() =>
                              onModerateComment(
                                comment,
                                "approve",
                              )
                            }
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="small"
                            onClick={() =>
                              onModerateComment(
                                comment,
                                "hide",
                              )
                            }
                          >
                            Ẩn
                          </Button>
                          <Button
                            size="small"
                            danger
                            onClick={() =>
                              onModerateComment(
                                comment,
                                "delete",
                              )
                            }
                          >
                            Xóa
                          </Button>
                        </Space>
                      </div>

                      <Paragraph className="!mb-0 !mt-3">
                        {comment.content}
                      </Paragraph>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <Empty description="API chi tiết bài viết chưa trả về danh sách bình luận." />
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="primary"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default function ForumManagementPage() {
  const { message } = App.useApp();

  const [view, setView] =
    useState<ForumView>("posts");

  const [topics, setTopics] =
    useState<ForumTopic[]>([]);
  const [posts, setPosts] =
    useState<ForumPost[]>([]);
  const [reports, setReports] =
    useState<ForumReport[]>([]);

  const [topicsLoading, setTopicsLoading] =
    useState(true);
  const [postsLoading, setPostsLoading] =
    useState(true);
  const [reportsLoading, setReportsLoading] =
    useState(false);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [keyword, setKeyword] =
    useState("");
  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState<
      ForumCategory | undefined
    >();
  const [
    topicFilter,
    setTopicFilter,
  ] = useState<string>();
  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      ForumPostStatus | undefined
    >();
  const [
    authorRoleFilter,
    setAuthorRoleFilter,
  ] =
    useState<
      ForumAuthorRole | undefined
    >();

  const [postPage, setPostPage] =
    useState(1);
  const [postPageSize, setPostPageSize] =
    useState(10);
  const [postTotal, setPostTotal] =
    useState(0);

  const [reportPage, setReportPage] =
    useState(1);
  const [
    reportPageSize,
    setReportPageSize,
  ] = useState(10);
  const [
    reportTotal,
    setReportTotal,
  ] = useState(0);

  const [
    selectedPost,
    setSelectedPost,
  ] =
    useState<ForumPost | null>(null);
  const [
    editingTopic,
    setEditingTopic,
  ] =
    useState<ForumTopic | null>(null);
  const [
    topicModalOpen,
    setTopicModalOpen,
  ] = useState(false);
  const [
    moderationRequest,
    setModerationRequest,
  ] =
    useState<
      ModerationRequest | null
    >(null);
  const [
    reportResolveRequest,
    setReportResolveRequest,
  ] =
    useState<
      ReportResolveRequest | null
    >(null);

  const topicById = useMemo(
    () =>
      new Map(
        topics.map((topic) => [
          topic.id,
          topic,
        ]),
      ),
    [topics],
  );

  const loadTopics = useCallback(
    async () => {
      setTopicsLoading(true);

      try {
        const data =
          await getForumTopics();
        setTopics(data);
      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
      } finally {
        setTopicsLoading(false);
      }
    },
    [],
  );

  const loadPosts = useCallback(
    async () => {
      setPostsLoading(true);
      setError(null);

      try {
        const result =
          await getForumPosts({
            page: postPage,
            limit: postPageSize,
            category:
              categoryFilter,
            topicId: topicFilter,
            authorRole:
              authorRoleFilter,
            search: keyword,
            status: statusFilter,
          });

        setPosts(result.items);
        setPostTotal(result.total);
        setPostPage(result.page);
        setPostPageSize(
          result.limit,
        );
      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
      } finally {
        setPostsLoading(false);
      }
    },
    [
      authorRoleFilter,
      categoryFilter,
      keyword,
      postPage,
      postPageSize,
      statusFilter,
      topicFilter,
    ],
  );

  const loadReports = useCallback(
    async () => {
      setReportsLoading(true);
      setError(null);

      try {
        const result =
          await getForumReports({
            page: reportPage,
            limit: reportPageSize,
          });

        setReports(result.items);
        setReportTotal(
          result.total,
        );
        setReportPage(result.page);
        setReportPageSize(
          result.limit,
        );
      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
      } finally {
        setReportsLoading(false);
      }
    },
    [
      reportPage,
      reportPageSize,
    ],
  );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadTopics();
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [loadTopics]);

  useEffect(() => {
    if (view !== "posts") {
      return;
    }

    const timer =
      window.setTimeout(() => {
        void loadPosts();
      }, 300);

    return () =>
      window.clearTimeout(timer);
  }, [loadPosts, view]);

  useEffect(() => {
    if (view !== "reports") {
      return;
    }

    const timer =
      window.setTimeout(() => {
        void loadReports();
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [loadReports, view]);

  function resetFilters() {
    setKeyword("");
    setCategoryFilter(undefined);
    setTopicFilter(undefined);
    setStatusFilter(undefined);
    setAuthorRoleFilter(undefined);
    setPostPage(1);
  }

  async function openPostDetail(
    post: ForumPost,
  ) {
    setSelectedPost(post);
    setDetailLoading(true);

    try {
      const detail =
        await getForumPost(post.id);
      setSelectedPost(detail);
    } catch (loadError) {
      message.error(
        getErrorMessage(loadError),
      );
    } finally {
      setDetailLoading(false);
    }
  }

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
        await createForumTopic(
          values,
        );
        message.success(
          "Tạo chủ đề thành công.",
        );
      }

      setTopicModalOpen(false);
      setEditingTopic(null);
      await loadTopics();
    } catch (saveError) {
      message.error(
        getErrorMessage(saveError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleModeration(
    reason: string,
  ) {
    const request =
      moderationRequest;

    if (!request) return;

    setSubmitting(true);

    try {
      if (
        request.kind === "post"
      ) {
        await moderateForumPost(
          request.target.id,
          {
            action:
              request.action,
            reason,
          },
        );

        message.success(
          "Kiểm duyệt bài viết thành công.",
        );
        await loadPosts();

        if (
          selectedPost?.id ===
          request.target.id
        ) {
          const detail =
            await getForumPost(
              request.target.id,
            );
          setSelectedPost(detail);
        }
      } else {
        await moderateForumComment(
          request.target.id,
          {
            action:
              request.action,
            reason,
          },
        );

        message.success(
          "Kiểm duyệt bình luận thành công.",
        );

        if (selectedPost) {
          const detail =
            await getForumPost(
              selectedPost.id,
            );
          setSelectedPost(detail);
        }
      }

      setModerationRequest(null);
    } catch (moderationError) {
      message.error(
        getErrorMessage(
          moderationError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolveReport(
    action: ForumReportResolveAction,
    note: string,
  ) {
    const request =
      reportResolveRequest;

    if (!request) return;

    setSubmitting(true);

    try {
      await resolveForumReport(
        request.report.id,
        {
          action,
          note,
        },
      );

      message.success(
        "Xử lý báo cáo thành công.",
      );
      setReportResolveRequest(null);
      await loadReports();
    } catch (resolveError) {
      message.error(
        getErrorMessage(resolveError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount =
    posts.filter(
      (post) =>
        post.status === "pending",
    ).length;

  const reportNeedActionCount =
    reports.filter(
      (report) =>
        ![
          "resolved",
          "dismissed",
        ].includes(
          report.status.toLowerCase(),
        ),
    ).length;

  const postColumns: ColumnsType<ForumPost> =
    [
      {
        title: "STT",
        width: 64,
        align: "center",
        render: (
          _value,
          _record,
          index,
        ) =>
          (postPage - 1) *
            postPageSize +
          index +
          1,
      },
      {
        title: "Bài viết",
        width: 380,
        render: (_value, post) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {post.isPinned ? (
                <Pin className="h-4 w-4 shrink-0 text-blue-600" />
              ) : null}
              {post.isFeatured ? (
                <Star className="h-4 w-4 shrink-0 text-amber-500" />
              ) : null}
              {post.isLocked ? (
                <Lock className="h-4 w-4 shrink-0 text-slate-500" />
              ) : null}

              <Text
                strong
                className="truncate"
              >
                {post.title}
              </Text>
            </div>

            <Text
              type="secondary"
              className="mt-1 block truncate text-xs"
            >
              {post.excerpt ||
                stripHtml(
                  post.content,
                ) ||
                "Không có mô tả"}
            </Text>
          </div>
        ),
      },
      {
        title: "Chủ đề",
        width: 190,
        render: (_value, post) => (
          <div>
            <Tag color="blue">
              {post.topicTitle ||
                topicById.get(
                  post.topicId,
                )?.title ||
                categoryLabel(
                  post.category,
                )}
            </Tag>
          </div>
        ),
      },
      {
        title: "Tác giả",
        width: 210,
        render: (_value, post) => (
          <div>
            <Text strong>
              {post.authorName}
            </Text>
            <Text
              type="secondary"
              className="block text-xs"
            >
              {authorRoleLabel(
                post.authorRole,
              )}
            </Text>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        width: 140,
        align: "center",
        render: (_value, post) =>
          postStatusTag(
            post.status,
          ),
      },
      {
        title: "Tương tác",
        width: 130,
        render: (_value, post) => (
          <div className="text-xs text-slate-600">
            <div>
              {post.viewCount} lượt xem
            </div>
            <div>
              {post.commentCount} bình luận
            </div>
            <div>
              {post.reportCount} báo cáo
            </div>
          </div>
        ),
      },
      {
        title: "Ngày gửi",
        dataIndex: "createdAt",
        width: 170,
        render: (value: string) =>
          formatDateTime(value),
      },
      {
        title: "Thao tác",
        width: 210,
        fixed: "right",
        align: "center",
        render: (_value, post) => (
          <Space size={6}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={
                  <Eye className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  void openPostDetail(
                    post,
                  );
                }}
              />
            </Tooltip>

            {post.status !==
            "published" ? (
              <Tooltip title="Duyệt bài">
                <Button
                  type="primary"
                  icon={
                    <CheckCircle2 className="h-4 w-4" />
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setModerationRequest({
                      kind: "post",
                      target: post,
                      action:
                        "approve",
                    });
                  }}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Ẩn bài">
                <Button
                  icon={
                    <EyeOff className="h-4 w-4" />
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setModerationRequest({
                      kind: "post",
                      target: post,
                      action: "hide",
                    });
                  }}
                />
              </Tooltip>
            )}

            <Tooltip title="Từ chối">
              <Button
                danger
                icon={
                  <XCircle className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setModerationRequest({
                    kind: "post",
                    target: post,
                    action: "reject",
                  });
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

  const topicColumns: ColumnsType<ForumTopic> =
    [
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
        width: 300,
        render: (_value, topic) => (
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
        width: 180,
        render: (_value, topic) => (
          <Tag color="blue">
            {categoryLabel(
              topic.category,
            )}
          </Tag>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        render: (value: string) => (
          <Paragraph
            ellipsis={{
              rows: 2,
            }}
            className="!mb-0"
          >
            {value ||
              "Chưa có mô tả"}
          </Paragraph>
        ),
      },
      {
        title: "Trạng thái",
        width: 140,
        align: "center",
        render: (_value, topic) => (
          <Tag
            color={
              topic.status ===
              "active"
                ? "green"
                : "default"
            }
          >
            {topic.status ===
            "active"
              ? "Hoạt động"
              : "Ngừng hoạt động"}
          </Tag>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        width: 170,
        render: (value: string) =>
          formatDateTime(value),
      },
      {
        title: "Thao tác",
        width: 100,
        align: "center",
        render: (_value, topic) => (
          <Button
            icon={
              <Pencil className="h-4 w-4" />
            }
            onClick={() => {
              setEditingTopic(topic);
              setTopicModalOpen(true);
            }}
          />
        ),
      },
    ];

  const reportColumns: ColumnsType<ForumReport> =
    [
      {
        title: "Mã báo cáo",
        dataIndex: "id",
        width: 150,
        render: (value: string) => (
          <Text
            strong
            className="font-mono"
          >
            {value}
          </Text>
        ),
      },
      {
        title: "Đối tượng",
        width: 180,
        render: (_value, report) => (
          <div>
            <Tag
              color={
                report.targetType ===
                "post"
                  ? "blue"
                  : report.targetType ===
                      "comment"
                    ? "purple"
                    : "default"
              }
            >
              {report.targetType ===
              "post"
                ? "Bài viết"
                : report.targetType ===
                    "comment"
                  ? "Bình luận"
                  : "Không xác định"}
            </Tag>
            <Text
              type="secondary"
              className="mt-1 block text-xs"
            >
              {report.targetId ||
                "Chưa có mã nội dung"}
            </Text>
          </div>
        ),
      },
      {
        title: "Lý do",
        width: 330,
        render: (_value, report) => (
          <div>
            <Tag color="red">
              {report.reason ||
                "Không rõ lý do"}
            </Tag>
            <Paragraph
              ellipsis={{
                rows: 2,
              }}
              className="!mb-0 !mt-2"
            >
              {report.description ||
                "Không có mô tả."}
            </Paragraph>
          </div>
        ),
      },
      {
        title: "Người báo cáo",
        width: 210,
        render: (_value, report) => (
          <div>
            <Text strong>
              {report.reporterName}
            </Text>
            <Text
              type="secondary"
              className="block text-xs"
            >
              {report.reporterEmail}
            </Text>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 140,
        align: "center",
        render: (value: string) => (
          <Tag
            color={
              [
                "resolved",
                "dismissed",
              ].includes(
                value.toLowerCase(),
              )
                ? "green"
                : "red"
            }
          >
            {value ||
              "Chưa xử lý"}
          </Tag>
        ),
      },
      {
        title: "Ngày gửi",
        dataIndex: "createdAt",
        width: 170,
        render: (value: string) =>
          formatDateTime(value),
      },
      {
        title: "Thao tác",
        width: 120,
        fixed: "right",
        align: "center",
        render: (_value, report) => (
          <Button
            type="primary"
            disabled={[
              "resolved",
              "dismissed",
            ].includes(
              report.status.toLowerCase(),
            )}
            onClick={() =>
              setReportResolveRequest({
                report,
              })
            }
          >
            Xử lý
          </Button>
        ),
      },
    ];

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý diễn đàn"
        description="Quản lý chủ đề, kiểm duyệt bài viết, bình luận và xử lý báo cáo nội dung."
      />

      <div className="mt-6 flex flex-col gap-5">
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

        <Alert
          type="info"
          showIcon
          title="Dữ liệu được tải trực tiếp từ Management - Forums"
          description="Swagger hiện chỉ hỗ trợ tạo và cập nhật chủ đề. Bài viết chỉ có chức năng xem và kiểm duyệt; chưa có API đăng hoặc chỉnh sửa bài viết."
        />

        <Row gutter={[16, 16]}>
          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card>
              <Statistic
                title="Tổng bài viết"
                value={postTotal}
                prefix={
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="border-amber-100 bg-amber-50/60">
              <Statistic
                title="Chờ duyệt trên trang"
                value={pendingCount}
                prefix={
                  <CircleAlert className="mr-2 h-5 w-5 text-amber-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="border-red-100 bg-red-50/60">
              <Statistic
                title="Báo cáo cần xử lý"
                value={
                  reportTotal > 0
                    ? reportTotal
                    : reportNeedActionCount
                }
                prefix={
                  <Flag className="mr-2 h-5 w-5 text-red-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="border-purple-100 bg-purple-50/60">
              <Statistic
                title="Tổng chủ đề"
                value={topics.length}
                prefix={
                  <Tags className="mr-2 h-5 w-5 text-purple-600" />
                }
              />
            </Card>
          </Col>
        </Row>

        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
              <Segmented<ForumView>
                value={view}
                options={[
                  {
                    value: "posts",
                    label: (
                      <span className="flex items-center gap-2">
                        <MessagesSquare className="h-4 w-4" />
                        Bài viết
                      </span>
                    ),
                  },
                  {
                    value: "comments",
                    label: (
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Bình luận
                      </span>
                    ),
                  },
                  {
                    value: "reports",
                    label: (
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Báo cáo
                      </span>
                    ),
                  },
                  {
                    value: "topics",
                    label: (
                      <span className="flex items-center gap-2">
                        <Tags className="h-4 w-4" />
                        Chủ đề
                      </span>
                    ),
                  },
                ]}
                onChange={(nextView) => {
                  setView(nextView);
                  resetFilters();
                }}
              />

              {view === "topics" ? (
                <Button
                  type="primary"
                  icon={
                    <Plus className="h-4 w-4" />
                  }
                  onClick={() => {
                    setEditingTopic(null);
                    setTopicModalOpen(true);
                  }}
                >
                  Thêm chủ đề
                </Button>
              ) : null}
            </div>

            {view === "posts" ? (
              <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_230px_180px_190px_auto]">
                <Input
                  allowClear
                  value={keyword}
                  prefix={
                    <Search className="h-4 w-4 text-slate-400" />
                  }
                  placeholder="Tìm bài viết..."
                  onChange={(event) => {
                    setPostPage(1);
                    setKeyword(
                      event.target.value,
                    );
                  }}
                />

                <Select
                  allowClear
                  value={
                    categoryFilter
                  }
                  placeholder="Danh mục"
                  options={
                    CATEGORY_OPTIONS
                  }
                  onChange={(value) => {
                    setPostPage(1);
                    setCategoryFilter(
                      value,
                    );
                  }}
                />

                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={topicFilter}
                  placeholder="Chủ đề"
                  loading={topicsLoading}
                  options={topics.map(
                    (topic) => ({
                      value: topic.id,
                      label: topic.title,
                    }),
                  )}
                  onChange={(value) => {
                    setPostPage(1);
                    setTopicFilter(
                      value,
                    );
                  }}
                />

                <Select
                  allowClear
                  value={statusFilter}
                  placeholder="Trạng thái"
                  options={
                    POST_STATUS_OPTIONS
                  }
                  onChange={(value) => {
                    setPostPage(1);
                    setStatusFilter(
                      value,
                    );
                  }}
                />

                <Select
                  allowClear
                  value={
                    authorRoleFilter
                  }
                  placeholder="Vai trò tác giả"
                  options={
                    AUTHOR_ROLE_OPTIONS
                  }
                  onChange={(value) => {
                    setPostPage(1);
                    setAuthorRoleFilter(
                      value,
                    );
                  }}
                />

                <Button
                  icon={
                    <X className="h-4 w-4" />
                  }
                  onClick={resetFilters}
                >
                  Xóa lọc
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            view === "posts"
              ? "Danh sách bài viết"
              : view === "comments"
                ? "Danh sách bình luận"
                : view === "reports"
                  ? "Danh sách báo cáo"
                  : "Danh sách chủ đề"
          }
        >
          {view === "posts" ? (
            <Table
              rowKey="id"
              size="middle"
              tableLayout="fixed"
              loading={postsLoading}
              columns={postColumns}
              dataSource={posts}
              scroll={{
                x: 1500,
              }}
              pagination={{
                current: postPage,
                pageSize:
                  postPageSize,
                total: postTotal,
                showSizeChanger: true,
                pageSizeOptions: [
                  10,
                  20,
                  50,
                  100,
                ],
                showTotal: (
                  total,
                  range,
                ) =>
                  `${range[0]}-${range[1]} / ${total} bài viết`,
                onChange: (
                  page,
                  size,
                ) => {
                  if (
                    size !==
                    postPageSize
                  ) {
                    setPostPageSize(
                      size,
                    );
                    setPostPage(1);
                    return;
                  }

                  setPostPage(page);
                },
              }}
              onRow={(post) => ({
                className:
                  "cursor-pointer",
                onClick: (event) => {
                  const target =
                    event.target as HTMLElement;

                  if (
                    target.closest(
                      "button",
                    ) ||
                    target.closest("a")
                  ) {
                    return;
                  }

                  void openPostDetail(
                    post,
                  );
                },
              })}
              className="management-table [&_.ant-table-cell]:px-3"
            />
          ) : null}

          {view === "comments" ? (
            <div className="px-6 py-16">
              <Empty
                image={
                  Empty.PRESENTED_IMAGE_SIMPLE
                }
                description={
                  <div>
                    <Text strong>
                      Swagger chưa có API danh sách bình luận
                    </Text>
                    <Text
                      type="secondary"
                      className="mt-1 block"
                    >
                      Bình luận chỉ được hiển thị khi API chi tiết bài viết trả về trường comments. Endpoint moderation bình luận đã được kết nối.
                    </Text>
                  </div>
                }
              />
            </div>
          ) : null}

          {view === "reports" ? (
            <Table
              rowKey="id"
              size="middle"
              tableLayout="fixed"
              loading={reportsLoading}
              columns={reportColumns}
              dataSource={reports}
              scroll={{
                x: 1300,
              }}
              pagination={{
                current: reportPage,
                pageSize:
                  reportPageSize,
                total: reportTotal,
                showSizeChanger: true,
                pageSizeOptions: [
                  10,
                  20,
                  50,
                  100,
                ],
                showTotal: (
                  total,
                  range,
                ) =>
                  `${range[0]}-${range[1]} / ${total} báo cáo`,
                onChange: (
                  page,
                  size,
                ) => {
                  if (
                    size !==
                    reportPageSize
                  ) {
                    setReportPageSize(
                      size,
                    );
                    setReportPage(1);
                    return;
                  }

                  setReportPage(page);
                },
              }}
              className="management-table [&_.ant-table-cell]:px-3"
            />
          ) : null}

          {view === "topics" ? (
            <Table
              rowKey="id"
              size="middle"
              tableLayout="fixed"
              loading={topicsLoading}
              columns={topicColumns}
              dataSource={topics}
              scroll={{
                x: 1050,
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
              className="management-table [&_.ant-table-cell]:px-3"
            />
          ) : null}
        </Card>
      </div>

      <TopicFormModal
        open={topicModalOpen}
        topic={editingTopic}
        submitting={submitting}
        onClose={() => {
          if (submitting) return;

          setTopicModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleSaveTopic}
      />

      <PostDetailModal
        post={selectedPost}
        loading={detailLoading}
        onClose={() =>
          setSelectedPost(null)
        }
        onModeratePost={(
          post,
          action,
        ) =>
          setModerationRequest({
            kind: "post",
            target: post,
            action,
          })
        }
        onModerateComment={(
          comment,
          action,
        ) =>
          setModerationRequest({
            kind: "comment",
            target: comment,
            action,
          })
        }
      />

      <ModerationModal
        request={
          moderationRequest
        }
        submitting={submitting}
        onClose={() => {
          if (!submitting) {
            setModerationRequest(
              null,
            );
          }
        }}
        onConfirm={
          handleModeration
        }
      />

      <ReportResolveModal
        request={
          reportResolveRequest
        }
        submitting={submitting}
        onClose={() => {
          if (!submitting) {
            setReportResolveRequest(
              null,
            );
          }
        }}
        onConfirm={
          handleResolveReport
        }
      />
    </AdminLayout>
  );
}

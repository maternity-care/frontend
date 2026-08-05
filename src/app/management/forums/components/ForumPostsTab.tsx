"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Pin,
  Search,
  Star,
  X,
  XCircle,
} from "lucide-react";

import {
  getForumPost,
  getForumPosts,
  moderateForumComment,
  moderateForumPost,
} from "@/management/features/forums/forums.api";
import type {
  ForumAuthorRole,
  ForumCategory,
  ForumComment,
  ForumCommentModerationAction,
  ForumPost,
  ForumPostModerationAction,
  ForumPostStatus,
  ForumTopic,
} from "@/management/features/forums/forums.types";

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

type ForumPostsTabProps = {
  topics: ForumTopic[];
  onSummaryChange: (summary: {
    total: number;
    pending: number;
  }) => void;
};

type ModerationRequest =
  | {
      kind: "post";
      target: ForumPost;
      action: ForumPostModerationAction;
    }
  | {
      kind: "comment";
      target: ForumComment;
      action: ForumCommentModerationAction;
    };

const CATEGORY_OPTIONS: Array<{
  value: ForumCategory;
  label: string;
}> = [
  { value: "pregnancy", label: "Thai kỳ" },
  { value: "nutrition", label: "Dinh dưỡng" },
  { value: "postpartum", label: "Sau sinh" },
  { value: "ask_doctor", label: "Hỏi bác sĩ" },
  { value: "booking_experience", label: "Kinh nghiệm đặt lịch" },
];

const POST_STATUS_OPTIONS: Array<{
  value: ForumPostStatus;
  label: string;
}> = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đã xuất bản" },
  { value: "hidden", label: "Đã ẩn" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "deleted", label: "Đã xóa" },
];

const AUTHOR_ROLE_OPTIONS: Array<{
  value: ForumAuthorRole;
  label: string;
}> = [
  { value: "user", label: "Người dùng" },
  { value: "staff", label: "Nhân viên" },
  { value: "doctor", label: "Bác sĩ" },
  { value: "moderator", label: "Kiểm duyệt viên" },
  { value: "admin", label: "Quản trị viên" },
];

const POST_ACTION_LABELS: Record<ForumPostModerationAction, string> = {
  approve: "Duyệt bài",
  hide: "Ẩn bài",
  reject: "Từ chối",
  delete: "Xóa bài",
  lock: "Khóa bình luận",
  pin: "Ghim bài",
  feature: "Đánh dấu nổi bật",
};

const COMMENT_ACTION_LABELS: Record<ForumCommentModerationAction, string> = {
  approve: "Cho hiển thị",
  hide: "Ẩn bình luận",
  reject: "Từ chối bình luận",
  delete: "Xóa bình luận",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi xử lý bài viết.";
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function categoryLabel(category: ForumCategory) {
  return (
    CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category
  );
}

function authorRoleLabel(role: ForumAuthorRole) {
  return (
    AUTHOR_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role
  );
}

function postStatusTag(status: ForumPostStatus) {
  const colors: Record<ForumPostStatus, string> = {
    pending: "gold",
    published: "green",
    hidden: "orange",
    rejected: "red",
    deleted: "default",
  };

  return (
    <Tag color={colors[status]}>
      {POST_STATUS_OPTIONS.find((item) => item.value === status)?.label ??
        status}
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

function ModerationModal({
  request,
  submitting,
  onClose,
  onConfirm,
}: {
  request: ModerationRequest | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!request) return;
    const timer = window.setTimeout(() => setReason(""), 0);
    return () => window.clearTimeout(timer);
  }, [request]);

  if (!request) return null;

  const actionLabel =
    request.kind === "post"
      ? POST_ACTION_LABELS[request.action]
      : COMMENT_ACTION_LABELS[request.action];
  const targetTitle =
    request.kind === "post" ? request.target.title : request.target.content;

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
        danger: ["hide", "reject", "delete"].includes(request.action),
        disabled: !reason.trim(),
      }}
      onCancel={onClose}
      onOk={() => void onConfirm(reason.trim())}
      mask={{ closable: !submitting }}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text type="secondary" className="block text-xs">
          Nội dung xử lý
        </Text>
        <Text strong className="mt-1 block line-clamp-3">
          {targetTitle}
        </Text>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          Lý do kiểm duyệt <span className="text-red-500">*</span>
        </label>
        <TextArea
          rows={4}
          maxLength={500}
          showCount
          value={reason}
          placeholder="Nhập lý do xử lý nội dung"
          onChange={(event) => setReason(event.target.value)}
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
    action: ForumPostModerationAction,
  ) => void;
  onModerateComment: (
    comment: ForumComment,
    action: ForumCommentModerationAction,
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
      styles={{ body: { maxHeight: "82vh", overflowY: "auto" } }}
    >
      {post ? (
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Title level={3} className="!mb-0">
                  {post.title}
                </Title>
                {postStatusTag(post.status)}
                {post.isPinned ? (
                  <Tag color="blue" icon={<Pin className="h-3.5 w-3.5" />}>
                    Đã ghim
                  </Tag>
                ) : null}
                {post.isFeatured ? (
                  <Tag color="gold" icon={<Star className="h-3.5 w-3.5" />}>
                    Nổi bật
                  </Tag>
                ) : null}
                {post.isLocked ? (
                  <Tag icon={<Lock className="h-3.5 w-3.5" />}>Đã khóa</Tag>
                ) : null}
              </div>

              <Text type="secondary" className="mt-2 block">
                {post.authorName} · {authorRoleLabel(post.authorRole)} ·{" "}
                {formatDateTime(post.createdAt)}
              </Text>
            </div>

            <Space wrap>
              {post.status !== "published" ? (
                <Button
                  type="primary"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => onModeratePost(post, "approve")}
                >
                  Duyệt bài
                </Button>
              ) : (
                <Button
                  icon={<EyeOff className="h-4 w-4" />}
                  onClick={() => onModeratePost(post, "hide")}
                >
                  Ẩn bài
                </Button>
              )}

              <Button
                icon={<Lock className="h-4 w-4" />}
                onClick={() => onModeratePost(post, "lock")}
              >
                Khóa
              </Button>

              <Button
                icon={<Pin className="h-4 w-4" />}
                onClick={() => onModeratePost(post, "pin")}
              >
                Ghim
              </Button>
            </Space>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="rounded-xl border border-slate-200 p-5">
              <Tag color="blue">{categoryLabel(post.category)}</Tag>

              {post.excerpt ? (
                <Paragraph className="!mt-4 !font-medium">
                  {post.excerpt}
                </Paragraph>
              ) : null}

              <Paragraph className="!mb-0 whitespace-pre-wrap leading-7 text-slate-700">
                {stripHtml(post.content) ||
                  "Nội dung bài viết chưa được backend trả về."}
              </Paragraph>
            </div>

            <div className="space-y-3">
              {[
                ["Lượt xem", post.viewCount],
                ["Bình luận", post.commentCount],
                ["Báo cáo", post.reportCount],
              ].map(([label, value]) => (
                <Card size="small" key={String(label)}>
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="mt-1 text-2xl font-bold">{value}</div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <Title level={5}>Bình luận trong bài</Title>

            {post.comments.length > 0 ? (
              <div className="space-y-3">
                {post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <Text strong>{comment.authorName}</Text>
                        <Text type="secondary" className="ml-2 text-xs">
                          {formatDateTime(comment.createdAt)}
                        </Text>
                      </div>

                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => onModerateComment(comment, "approve")}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="small"
                          onClick={() => onModerateComment(comment, "hide")}
                        >
                          Ẩn
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() => onModerateComment(comment, "delete")}
                        >
                          Xóa
                        </Button>
                      </Space>
                    </div>

                    <Paragraph className="!mb-0 !mt-3">
                      {comment.content}
                    </Paragraph>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="API chi tiết bài viết chưa trả về danh sách bình luận." />
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="primary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export function ForumPostsTab({
  topics,
  onSummaryChange,
}: ForumPostsTabProps) {
  const { message } = App.useApp();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<ForumCategory | undefined>();
  const [topicFilter, setTopicFilter] = useState<string>();
  const [statusFilter, setStatusFilter] =
    useState<ForumPostStatus | undefined>();
  const [authorRoleFilter, setAuthorRoleFilter] =
    useState<ForumAuthorRole | undefined>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [moderationRequest, setModerationRequest] =
    useState<ModerationRequest | null>(null);

  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getForumPosts({
        page,
        limit: pageSize,
        category: categoryFilter,
        topicId: topicFilter,
        authorRole: authorRoleFilter,
        search: keyword,
        status: statusFilter,
      });

      setPosts(result.items);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
      onSummaryChange({
        total: result.total,
        pending: result.items.filter((post) => post.status === "pending").length,
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [
    authorRoleFilter,
    categoryFilter,
    keyword,
    onSummaryChange,
    page,
    pageSize,
    statusFilter,
    topicFilter,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPosts(), 300);
    return () => window.clearTimeout(timer);
  }, [loadPosts]);

  function resetFilters() {
    setKeyword("");
    setCategoryFilter(undefined);
    setTopicFilter(undefined);
    setStatusFilter(undefined);
    setAuthorRoleFilter(undefined);
    setPage(1);
  }

  async function openPostDetail(post: ForumPost) {
    setSelectedPost(post);
    setDetailLoading(true);

    try {
      const detail = await getForumPost(post.id);
      setSelectedPost(detail);
    } catch (loadError) {
      message.error(getErrorMessage(loadError));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleModeration(reason: string) {
    const request = moderationRequest;
    if (!request) return;

    setSubmitting(true);

    try {
      if (request.kind === "post") {
        await moderateForumPost(request.target.id, {
          action: request.action,
          reason,
        });
        message.success("Kiểm duyệt bài viết thành công.");
        await loadPosts();

        if (selectedPost?.id === request.target.id) {
          setSelectedPost(await getForumPost(request.target.id));
        }
      } else {
        await moderateForumComment(request.target.id, {
          action: request.action,
          reason,
        });
        message.success("Kiểm duyệt bình luận thành công.");

        if (selectedPost) {
          setSelectedPost(await getForumPost(selectedPost.id));
        }
      }

      setModerationRequest(null);
    } catch (moderationError) {
      message.error(getErrorMessage(moderationError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnsType<ForumPost> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      render: (_value, _record, index) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: "Bài viết",
      width: "38%",
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
            <Text strong className="truncate">
              {post.title}
            </Text>
          </div>
          <Text type="secondary" className="mt-1 block truncate text-xs">
            {post.excerpt || stripHtml(post.content) || "Không có mô tả"}
          </Text>
        </div>
      ),
    },
    {
      title: "Chủ đề",
      width: "20%",
      render: (_value, post) => (
        <Tag color="blue">
          {post.topicTitle ||
            topicById.get(post.topicId)?.title ||
            categoryLabel(post.category)}
        </Tag>
      ),
    },
    {
      title: "Tác giả",
      width: "20%",
      render: (_value, post) => (
        <div>
          <Text strong>{post.authorName}</Text>
          <Text type="secondary" className="block text-xs">
            {authorRoleLabel(post.authorRole)}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      width: 125,
      align: "center",
      render: (_value, post) => postStatusTag(post.status),
    },
    {
      title: "Thao tác",
      width: 170,
      align: "center",
      render: (_value, post) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<Eye className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                void openPostDetail(post);
              }}
            />
          </Tooltip>

          {post.status !== "published" ? (
            <Tooltip title="Duyệt bài">
              <Button
                type="primary"
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setModerationRequest({
                    kind: "post",
                    target: post,
                    action: "approve",
                  });
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Ẩn bài">
              <Button
                icon={<EyeOff className="h-4 w-4" />}
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
              icon={<XCircle className="h-4 w-4" />}
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

  return (
    <>
      <div className="flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : null}

        <Card className="border-slate-200 bg-white">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_230px_180px_190px_auto]">
            <Input
              allowClear
              value={keyword}
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm bài viết..."
              onChange={(event) => {
                setPage(1);
                setKeyword(event.target.value);
              }}
            />

            <Select
              allowClear
              value={categoryFilter}
              placeholder="Danh mục"
              options={CATEGORY_OPTIONS}
              onChange={(value) => {
                setPage(1);
                setCategoryFilter(value);
              }}
            />

            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={topicFilter}
              placeholder="Chủ đề"
              options={topics.map((topic) => ({
                value: topic.id,
                label: topic.title,
              }))}
              onChange={(value) => {
                setPage(1);
                setTopicFilter(value);
              }}
            />

            <Select
              allowClear
              value={statusFilter}
              placeholder="Trạng thái"
              options={POST_STATUS_OPTIONS}
              onChange={(value) => {
                setPage(1);
                setStatusFilter(value);
              }}
            />

            <Select
              allowClear
              value={authorRoleFilter}
              placeholder="Vai trò tác giả"
              options={AUTHOR_ROLE_OPTIONS}
              onChange={(value) => {
                setPage(1);
                setAuthorRoleFilter(value);
              }}
            />

            <Button icon={<X className="h-4 w-4" />} onClick={resetFilters}>
              Xóa lọc
            </Button>
          </div>
        </Card>

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{ body: { padding: 0 } }}
          title="Danh sách bài viết"
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={posts}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (nextTotal, range) =>
                `${range[0]}-${range[1]} / ${nextTotal} bài viết`,
              onChange: (nextPage, nextSize) => {
                if (nextSize !== pageSize) {
                  setPageSize(nextSize);
                  setPage(1);
                  return;
                }

                setPage(nextPage);
              },
            }}
            onRow={(post) => ({
              className: "cursor-pointer",
              onClick: (event) => {
                const target = event.target as HTMLElement;
                if (target.closest("button") || target.closest("a")) return;
                void openPostDetail(post);
              },
            })}
            className="management-table [&_.ant-table-cell]:px-3"
          />
        </Card>
      </div>

      <PostDetailModal
        post={selectedPost}
        loading={detailLoading}
        onClose={() => setSelectedPost(null)}
        onModeratePost={(post, action) =>
          setModerationRequest({ kind: "post", target: post, action })
        }
        onModerateComment={(comment, action) =>
          setModerationRequest({ kind: "comment", target: comment, action })
        }
      />

      <ModerationModal
        request={moderationRequest}
        submitting={submitting}
        onClose={() => {
          if (!submitting) setModerationRequest(null);
        }}
        onConfirm={handleModeration}
      />
    </>
  );
}
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  navigation: ReactNode;
  focusPostId?: string;
  realtimeVersion?: number;
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

function getPostCreatedTime(post: ForumPost) {
  const createdTime = new Date(
    post.createdAt,
  ).getTime();

  return Number.isNaN(createdTime)
    ? 0
    : createdTime;
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

function moderationTargetLabel(
  targetType: string,
) {
  const normalized =
    targetType.trim().toLowerCase();

  const labels: Record<string, string> = {
    post: "Bài viết",
    comment: "Bình luận",
  };

  return (
    labels[normalized] ||
    targetType ||
    "Nội dung"
  );
}

function moderationActionLabel(
  action: string,
) {
  const normalized =
    action.trim().toLowerCase();

  const labels: Record<string, string> = {
    submit: "Gửi bài",
    approve: "Duyệt bài",
    hide: "Ẩn",
    reject: "Từ chối",
    delete: "Xóa",
    lock: "Khóa bình luận",
    unlock: "Mở khóa bình luận",
    pin: "Ghim bài",
    unpin: "Bỏ ghim",
    feature: "Đánh dấu nổi bật",
    unfeature: "Bỏ đánh dấu nổi bật",
    update: "Cập nhật",
    edit: "Chỉnh sửa",
    create: "Tạo mới",
    restore: "Khôi phục",
  };

  return (
    labels[normalized] ||
    action ||
    "Cập nhật"
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
      styles={{
        footer: {
          marginTop: 32,
        },
      }}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text type="secondary" className="block text-xs">
          Nội dung xử lý
        </Text>
        <Text strong className="mt-1 block line-clamp-3">
          {targetTitle}
        </Text>
      </div>

      <div className="mt-4 pb-2">
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

function commentStatusTag(
  status: ForumPostStatus,
) {
  return postStatusTag(status);
}

function CommentItem({
  comment,
  nested = false,
  onModerateComment,
}: {
  comment: ForumComment;
  nested?: boolean;
  onModerateComment: (
    comment: ForumComment,
    action: ForumCommentModerationAction,
  ) => void;
}) {
  const [
    showModerationReason,
    setShowModerationReason,
  ] = useState(false);
  const canModerate =
    comment.status !== "deleted";

  return (
    <div
      className={[
        "rounded-xl border p-4",
        nested
          ? "ml-6 border-blue-100 bg-blue-50/30"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Text strong>
              {comment.authorName}
            </Text>

            {commentStatusTag(
              comment.status,
            )}

            {comment.isDoctorAnswer ? (
              <Tag color="blue">
                Trả lời bác sĩ
              </Tag>
            ) : null}

            {comment.parentId ? (
              <Tag>Phản hồi</Tag>
            ) : null}
          </div>

          <Text
            type="secondary"
            className="mt-1 block text-xs"
          >
            {authorRoleLabel(
              comment.authorRole,
            )} ·{" "}
            {formatDateTime(
              comment.createdAt,
            )}
            {comment.reportCount > 0
              ? ` · ${comment.reportCount} báo cáo`
              : ""}
          </Text>
        </div>

        {canModerate ? (
          <Space wrap>
            {comment.status !==
            "published" ? (
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
            ) : (
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
            )}

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
        ) : null}
      </div>

      <Paragraph className="!mb-0 !mt-3 !whitespace-pre-wrap">
        {comment.content ||
          "Bình luận không có nội dung."}
      </Paragraph>

      {comment.moderationReason ? (
        <div className="mt-3">
          <Button
            type="text"
            size="small"
            className="!h-auto !px-0 !text-amber-700"
            icon={
              showModerationReason ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
            onClick={() =>
              setShowModerationReason(
                (current) => !current,
              )
            }
          >
            {showModerationReason
              ? "Ẩn lý do kiểm duyệt"
              : "Xem lý do kiểm duyệt"}
          </Button>

          {showModerationReason ? (
            <Alert
              type="warning"
              showIcon
              className="mt-2 !rounded-xl !border-amber-200 !bg-amber-50"
              title="Lý do kiểm duyệt"
              description={
                comment.moderationReason
              }
            />
          ) : null}
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <div className="mt-3 space-y-3">
          {comment.replies.map(
            (reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                nested
                onModerateComment={
                  onModerateComment
                }
              />
            ),
          )}
        </div>
      ) : null}
    </div>
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
  const [
    expandedModerationPostId,
    setExpandedModerationPostId,
  ] = useState<string | null>(null);
  const [
    expandedCommentsPostId,
    setExpandedCommentsPostId,
  ] = useState<string | null>(null);

  const showAllModerationLogs =
    Boolean(
      post &&
        expandedModerationPostId ===
          post.id,
    );
  const showAllComments =
    Boolean(
      post &&
        expandedCommentsPostId ===
          post.id,
    );

  const moderationLogs = post
    ? [...post.moderationLogs].sort(
        (left, right) =>
          new Date(
            right.createdAt,
          ).getTime() -
          new Date(
            left.createdAt,
          ).getTime(),
      )
    : [];

  const visibleModerationLogs =
    showAllModerationLogs
      ? moderationLogs
      : moderationLogs.slice(0, 5);
  const visibleComments = post
    ? (
        showAllComments
          ? post.comments
          : post.comments.slice(0, 5)
      )
    : [];

  return (
    <Modal
      open={Boolean(post)}
      centered
      width={1080}
      title={null}
      footer={null}
      loading={loading}
      onCancel={onClose}
      styles={{
        body: {
          overflow: "hidden",
          paddingTop: 8,
        },
      }}
    >
      {post ? (
        <div className="mt-6 max-h-[calc(82vh-3rem)] overflow-y-auto pr-2">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row">
            <div className="min-w-0">
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

                <Tag
                  color={
                    post.commentable
                      ? "green"
                      : "default"
                  }
                >
                  {post.commentable
                    ? "Cho phép bình luận"
                    : "Đã khóa bình luận"}
                </Tag>
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

              <Text
                type="secondary"
                className="mt-1 block text-xs"
              >
                Chủ đề:{" "}
                {post.topicTitle ||
                  post.topicId ||
                  "Chưa cập nhật"}
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

          {post.medicalDisclaimer ||
          post.moderationReason ? (
            <div className="mt-5 flex flex-col gap-4">
              {post.medicalDisclaimer ? (
                <Alert
                  type="warning"
                  showIcon
                  className="!m-0 !rounded-xl !border-amber-200 !bg-amber-50"
                  title="Lưu ý về nội dung y tế"
                  description={
                    post.medicalDisclaimer
                  }
                />
              ) : null}

              {post.moderationReason ? (
                <Alert
                  type="info"
                  showIcon
                  className="!m-0 !rounded-xl !border-cyan-200 !bg-cyan-50"
                  title="Thông tin kiểm duyệt"
                  description={
                    <div className="space-y-1">
                      <Text className="block !text-slate-700">
                        Lý do xử lý gần nhất:
                      </Text>
                      <Text strong>
                        {post.moderationReason}
                      </Text>
                    </div>
                  }
                />
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Tag color="blue">
                  {categoryLabel(
                    post.category,
                  )}
                </Tag>

                {post.topicTitle ? (
                  <Tag>
                    {post.topicTitle}
                  </Tag>
                ) : null}
              </div>

              {post.coverImageUrl ? (
                <div
                  className="mt-4 h-64 rounded-xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${post.coverImageUrl}")`,
                  }}
                />
              ) : null}

              {post.excerpt ? (
                <Paragraph className="!mt-4 !font-medium">
                  {post.excerpt}
                </Paragraph>
              ) : null}

              <Paragraph className="!mb-0 !mt-4 !whitespace-pre-wrap !leading-7 !text-slate-700">
                {stripHtml(
                  post.content,
                ) ||
                  "Nội dung bài viết chưa được cập nhật."}
              </Paragraph>
            </div>

            <div className="space-y-3">
              <Card
                size="small"
                className="h-fit"
              >
                <div className="text-sm text-slate-500">
                  Bình luận
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {post.commentCount}
                </div>
              </Card>

              <Card
                size="small"
                className="h-fit"
              >
                <div className="text-sm text-slate-500">
                  Báo cáo
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {post.reportCount}
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Title
                  level={5}
                  className="!mb-0"
                >
                  Bình luận trong bài
                </Title>

                {!showAllComments &&
                post.comments.length > 5 ? (
                  <Text
                    type="secondary"
                    className="mt-1 block text-xs"
                  >
                    Đang hiển thị 5 bình luận gần nhất.
                  </Text>
                ) : null}
              </div>

              <Space wrap>
                <Text type="secondary">
                  {post.commentCount} bình luận
                </Text>

                {post.comments.length > 5 ? (
                  <Button
                    type="link"
                    className="!h-auto !p-0"
                    onClick={() =>
                      setExpandedCommentsPostId(
                        (current) =>
                          current === post.id
                            ? null
                            : post.id,
                      )
                    }
                  >
                    {showAllComments
                      ? "Thu gọn"
                      : `Xem toàn bộ bình luận (${post.comments.length})`}
                  </Button>
                ) : null}
              </Space>
            </div>

            {post.comments.length > 0 ? (
              <div className="space-y-3">
                {visibleComments.map(
                  (comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onModerateComment={
                        onModerateComment
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <Empty description="Bài viết chưa có bình luận." />
            )}
          </div>

          {moderationLogs.length > 0 ? (
            <div className="mt-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <Title
                  level={5}
                  className="!mb-0"
                >
                  Lịch sử kiểm duyệt
                </Title>

                {moderationLogs.length > 5 ? (
                  <Button
                    type="link"
                    className="!h-auto !p-0"
                    onClick={() =>
                      setExpandedModerationPostId(
                        (current) =>
                          current === post.id
                            ? null
                            : post.id,
                      )
                    }
                  >
                    {showAllModerationLogs
                      ? "Thu gọn"
                      : `Xem toàn bộ lịch sử (${moderationLogs.length})`}
                  </Button>
                ) : null}
              </div>

              <div className="space-y-2">
                {visibleModerationLogs.map(
                  (log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Space wrap>
                          <Tag color="blue">
                            {moderationTargetLabel(
                              log.targetType,
                            )}
                          </Tag>
                          <Text strong>
                            {moderationActionLabel(
                              log.action,
                            )}
                          </Text>
                          <Text type="secondary">
                            bởi{" "}
                            {authorRoleLabel(
                              log.actorRole,
                            )}{" "}
                            #{log.actorId}
                          </Text>
                        </Space>

                        <Text
                          type="secondary"
                          className="text-xs"
                        >
                          {formatDateTime(
                            log.createdAt,
                          )}
                        </Text>
                      </div>

                      {log.reason ? (
                        <Paragraph className="!mb-0 !mt-2 !text-sm">
                          {log.reason}
                        </Paragraph>
                      ) : null}
                    </div>
                  ),
                )}
              </div>

              {!showAllModerationLogs &&
              moderationLogs.length > 5 ? (
                <Text
                  type="secondary"
                  className="mt-2 block text-xs"
                >
                  Đang hiển thị 5 hoạt động kiểm duyệt gần nhất.
                </Text>
              ) : null}
            </div>
          ) : null}

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

export function ForumPostsTab({
  topics,
  navigation,
  focusPostId,
  realtimeVersion = 0,
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

      const newestPosts = [
        ...result.items,
      ].sort(
        (left, right) =>
          getPostCreatedTime(right) -
          getPostCreatedTime(left),
      );

      setPosts(newestPosts);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [
    authorRoleFilter,
    categoryFilter,
    keyword,
    page,
    pageSize,
    statusFilter,
    topicFilter,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPosts(), 300);
    return () => window.clearTimeout(timer);
  }, [loadPosts, realtimeVersion]);

  useEffect(() => {
    if (!focusPostId) return;

    let active = true;
    const timer = window.setTimeout(() => {
      setDetailLoading(true);
      void getForumPost(focusPostId)
        .then((detail) => {
          if (active) setSelectedPost(detail);
        })
        .catch((loadError) => {
          if (active) message.error(getErrorMessage(loadError));
        })
        .finally(() => {
          if (active) setDetailLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [focusPostId, message]);

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

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 20,
            },
          }}
        >
          <div className="min-w-0 overflow-hidden">
            <div className="max-w-full">
              {navigation}
            </div>

            <div className="my-4 h-px bg-slate-100" />

            <div className="grid min-w-0 grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden">
              <div className="min-w-0">
                <Input
                  allowClear
                  className="w-full"
                  value={keyword}
                  prefix={<Search className="h-4 w-4 text-slate-400" />}
                  placeholder="Tìm bài viết..."
                  onChange={(event) => {
                    setPage(1);
                    setKeyword(event.target.value);
                  }}
                />
              </div>

              <div className="min-w-0">
                <Select
                  allowClear
                  className="w-full"
                  value={categoryFilter}
                  placeholder="Danh mục"
                  options={CATEGORY_OPTIONS}
                  onChange={(value) => {
                    setPage(1);
                    setCategoryFilter(value);
                  }}
                />
              </div>

              <div className="min-w-0">
                <Select
                  allowClear
                  showSearch
                  className="w-full"
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
              </div>

              <div className="min-w-0">
                <Select
                  allowClear
                  className="w-full"
                  value={statusFilter}
                  placeholder="Trạng thái"
                  options={POST_STATUS_OPTIONS}
                  onChange={(value) => {
                    setPage(1);
                    setStatusFilter(value);
                  }}
                />
              </div>

              <div className="min-w-0">
                <Select
                  allowClear
                  className="w-full"
                  value={authorRoleFilter}
                  placeholder="Vai trò tác giả"
                  options={AUTHOR_ROLE_OPTIONS}
                  onChange={(value) => {
                    setPage(1);
                    setAuthorRoleFilter(value);
                  }}
                />
              </div>

              <Button
                className="shrink-0 whitespace-nowrap"
                icon={<X className="h-4 w-4" />}
                onClick={resetFilters}
              >
                Xóa lọc
              </Button>
            </div>
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

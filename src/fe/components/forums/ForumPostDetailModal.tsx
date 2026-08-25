"use client";

import {
  useState,
} from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  Lock,
  Pin,
  Reply,
  Star,
} from "lucide-react";
import type {
  ForumComment,
  ForumCommentModerationAction,
  ForumPost,
  ForumPostModerationAction,
} from "@/management/features/forums/forums.types";
import {
  formatForumDateTime,
  getForumAuthorRoleLabel,
  getForumCategoryLabel,
  getForumPostStatusColor,
  getForumPostStatusLabel,
  getModerationActionLabel,
  getModerationTargetLabel,
  stripForumHtml,
} from "@/management/features/forums/forums.utils";

const {
  Paragraph,
  Text,
  Title,
} = Typography;

const { TextArea } = Input;

function ForumCommentItem({
  comment,
  nested = false,
  readOnly = false,
  canModerateContent = false,
  onModerateComment,
  onReplyComment,
  onReportComment,
}: {
  comment: ForumComment;
  nested?: boolean;
  readOnly?: boolean;
  canModerateContent?: boolean;
  onModerateComment?: (
    comment: ForumComment,
    action: ForumCommentModerationAction,
  ) => void;
  onReplyComment?: (
    comment: ForumComment,
    content: string,
  ) => Promise<boolean>;
  onReportComment?: (
    comment: ForumComment,
  ) => void;
}) {
  const [
    showModerationReason,
    setShowModerationReason,
  ] = useState(false);

  const [
    replyOpen,
    setReplyOpen,
  ] = useState(false);

  const [
    replyContent,
    setReplyContent,
  ] = useState("");

  const [
    replySubmitting,
    setReplySubmitting,
  ] = useState(false);

  const canModerate =
    !readOnly &&
    canModerateContent &&
    Boolean(onModerateComment) &&
    comment.status !== "deleted";

  async function submitReply() {
    const content =
      replyContent.trim();

    if (
      !content ||
      !onReplyComment ||
      readOnly
    ) {
      return;
    }

    setReplySubmitting(true);

    try {
      const success =
        await onReplyComment(
          comment,
          content,
        );

      if (success) {
        setReplyContent("");
        setReplyOpen(false);
      }
    } finally {
      setReplySubmitting(false);
    }
  }

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

            <Tag
              color={getForumPostStatusColor(
                comment.status,
              )}
            >
              {getForumPostStatusLabel(
                comment.status,
              )}
            </Tag>

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
            {getForumAuthorRoleLabel(
              comment.authorRole,
            )}{" "}
            ·{" "}
            {formatForumDateTime(
              comment.createdAt,
            )}
            {comment.reportCount > 0
              ? ` · ${comment.reportCount} báo cáo`
              : ""}
          </Text>
        </div>

        {comment.status !==
          "deleted" &&
        !readOnly ? (
          <Space wrap>
            {onReplyComment ? (
              <Button
                type="primary"
                size="small"
                icon={
                  <Reply className="h-4 w-4" />
                }
                onClick={() => {
                  setReplyOpen(
                    (current) =>
                      !current,
                  );
                  setReplyContent("");
                }}
              >
                Trả lời
              </Button>
            ) : null}

            {onReportComment ? (
              <Button
                size="small"
                icon={
                  <Flag className="h-4 w-4" />
                }
                onClick={() =>
                  onReportComment(
                    comment,
                  )
                }
              >
                Báo cáo
              </Button>
            ) : null}

            {canModerate &&
            comment.status !==
            "published" ? (
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  onModerateComment?.(
                    comment,
                    "approve",
                  )
                }
              >
                Duyệt
              </Button>
            ) : canModerate ? (
              <Button
                size="small"
                onClick={() =>
                  onModerateComment?.(
                    comment,
                    "hide",
                  )
                }
              >
                Ẩn
              </Button>
            ) : null}

            {canModerate ? (
              <Button
                size="small"
                danger
                onClick={() =>
                  onModerateComment?.(
                    comment,
                    "delete",
                  )
                }
              >
                Xóa
              </Button>
            ) : null}
          </Space>
        ) : null}
      </div>

      <Paragraph className="!mb-0 !mt-3 !whitespace-pre-wrap">
        {comment.content ||
          "Bình luận không có nội dung."}
      </Paragraph>

      {replyOpen &&
      !readOnly ? (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
          <Text
            type="secondary"
            className="mb-2 block text-xs"
          >
            Đang trả lời{" "}
            <Text strong>
              {comment.authorName}
            </Text>
          </Text>

          <TextArea
            value={replyContent}
            rows={3}
            maxLength={1000}
            showCount
            disabled={
              replySubmitting
            }
            placeholder={`Nhập câu trả lời cho ${comment.authorName}...`}
            onChange={(event) =>
              setReplyContent(
                event.target.value,
              )
            }
          />

          <div className="mt-3 flex justify-end gap-2">
            <Button
              size="small"
              disabled={
                replySubmitting
              }
              onClick={() => {
                setReplyOpen(false);
                setReplyContent("");
              }}
            >
              Hủy
            </Button>

            <Button
              type="primary"
              size="small"
              loading={
                replySubmitting
              }
              disabled={
                !replyContent.trim()
              }
              onClick={() =>
                void submitReply()
              }
            >
              Gửi trả lời
            </Button>
          </div>
        </div>
      ) : null}

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
                (current) =>
                  !current,
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
              <ForumCommentItem
                key={reply.id}
                comment={reply}
                nested
                readOnly={
                  readOnly
                }
                canModerateContent={
                  canModerateContent
                }
                onModerateComment={
                  onModerateComment
                }
                onReplyComment={
                  onReplyComment
                }
                onReportComment={
                  onReportComment
                }
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ForumPostDetailModal({
  post,
  loading,
  readOnly = false,
  canModerateContent = false,
  onClose,
  onModeratePost,
  onModerateComment,
  onReplyComment,
  onReportPost,
  onReportComment,
}: {
  post: ForumPost | null;
  loading: boolean;
  readOnly?: boolean;
  canModerateContent?: boolean;
  onClose: () => void;
  onModeratePost?: (
    post: ForumPost,
    action: ForumPostModerationAction,
  ) => void;
  onModerateComment?: (
    comment: ForumComment,
    action: ForumCommentModerationAction,
  ) => void;
  onReplyComment?: (
    comment: ForumComment,
    content: string,
  ) => Promise<boolean>;
  onReportPost?: (
    post: ForumPost,
  ) => void;
  onReportComment?: (
    comment: ForumComment,
  ) => void;
}) {
  const [
    expandedModerationPostId,
    setExpandedModerationPostId,
  ] = useState<string | null>(
    null,
  );

  const [
    expandedCommentsPostId,
    setExpandedCommentsPostId,
  ] = useState<string | null>(
    null,
  );

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
    ? showAllComments
      ? post.comments
      : post.comments.slice(0, 5)
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

                <Tag
                  color={getForumPostStatusColor(
                    post.status,
                  )}
                >
                  {getForumPostStatusLabel(
                    post.status,
                  )}
                </Tag>

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
                {getForumAuthorRoleLabel(
                  post.authorRole,
                )}{" "}
                ·{" "}
                {formatForumDateTime(
                  post.createdAt,
                )}
              </Text>
            </div>

            {!readOnly &&
            (onReportPost ||
              (canModerateContent &&
                onModeratePost)) ? (
              <Space wrap>
                {onReportPost ? (
                  <Button
                    icon={
                      <Flag className="h-4 w-4" />
                    }
                    onClick={() =>
                      onReportPost(post)
                    }
                  >
                    Báo cáo
                  </Button>
                ) : null}

              {canModerateContent &&
              onModeratePost ? (
                <>
                  {post.status !==
                  "published" ? (
                    <Button
                      type="primary"
                      icon={
                        <CheckCircle2 className="h-4 w-4" />
                      }
                      onClick={() =>
                        onModeratePost?.(
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
                        onModeratePost?.(
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
                      onModeratePost?.(
                        post,
                        post.commentable
                          ? "lock_comments"
                          : "unlock_comments",
                      )
                    }
                  >
                    {post.commentable
                      ? "Khóa bình luận"
                      : "Mở bình luận"}
                  </Button>

                </>
              ) : null}
              </Space>
            ) : null}
          </div>

          {post.medicalDisclaimer ||
          post.moderationReason ? (
            <div className="mt-5 flex flex-col gap-4">
              {post.medicalDisclaimer ? (
                <Alert
                  type="warning"
                  showIcon
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
                  title="Thông tin kiểm duyệt"
                  description={
                    post.moderationReason
                  }
                />
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Tag color="blue">
                  {getForumCategoryLabel(
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
                {stripForumHtml(
                  post.content,
                ) ||
                  "Nội dung bài viết chưa được cập nhật."}
              </Paragraph>
            </div>

            <div className="space-y-3">
              <Card size="small">
                <div className="text-sm text-slate-500">
                  Bình luận
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {post.commentCount}
                </div>
              </Card>

              <Card size="small">
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
              <Title
                level={5}
                className="!mb-0"
              >
                Bình luận trong bài
              </Title>

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
                      : `Xem toàn bộ (${post.comments.length})`}
                  </Button>
                ) : null}
              </Space>
            </div>

            {post.comments.length > 0 ? (
              <div className="space-y-3">
                {visibleComments.map(
                  (comment) => (
                    <ForumCommentItem
                      key={comment.id}
                      comment={comment}
                      readOnly={
                        readOnly
                      }
                      canModerateContent={
                        canModerateContent
                      }
                      onModerateComment={
                        onModerateComment
                      }
                      onReplyComment={
                        onReplyComment
                      }
                      onReportComment={
                        onReportComment
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
                      : `Xem toàn bộ (${moderationLogs.length})`}
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
                            {getModerationTargetLabel(
                              log.targetType,
                            )}
                          </Tag>

                          <Text strong>
                            {getModerationActionLabel(
                              log.action,
                            )}
                          </Text>

                          <Text type="secondary">
                            bởi{" "}
                            {getForumAuthorRoleLabel(
                              log.actorRole,
                            )}{" "}
                            #{log.actorId}
                          </Text>
                        </Space>

                        <Text
                          type="secondary"
                          className="text-xs"
                        >
                          {formatForumDateTime(
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

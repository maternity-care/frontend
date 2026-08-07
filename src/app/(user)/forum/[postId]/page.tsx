"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Eye,
  Flag,
  Lock,
  MessageCircle,
  Reply,
  Send,
  Share2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import {
  useAuthStore,
} from "@/features/auth/auth.store";
import {
  ForumRichContent,
} from "@/app/(user)/forum/ForumRichContent";
import {
  SiteFooter,
} from "@/fe/components/layout/SiteFooter";
import {
  createForumComment,
  createForumReport,
  getForumDisclaimer,
  getForumPost,
  getForumPosts,
} from "@/features/forum/forum.api";
import type {
  ForumAuthor,
  ForumComment,
  ForumPost,
  ForumReportTargetType,
} from "@/features/forum/forum.types";

const {
  Paragraph,
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type ReportTarget = {
  type: ForumReportTargetType;
  id: string;
  label: string;
} | null;

type ReportFormValues = {
  reasonPreset: string;
  detail?: string;
};

const REPORT_REASON_OPTIONS = [
  {
    value: "Spam",
    label: "Spam",
  },
  {
    value: "Sai chủ đề",
    label: "Sai chủ đề",
  },
  {
    value:
      "Thông tin y tế sai lệch",
    label:
      "Thông tin y tế sai lệch",
  },
  {
    value:
      "Quảng cáo thuốc hoặc dịch vụ",
    label:
      "Quảng cáo thuốc/dịch vụ",
  },
  {
    value:
      "Nội dung gây hại hoặc kích động",
    label:
      "Nội dung gây hại/kích động",
  },
  {
    value: "Khác",
    label: "Lý do khác",
  },
];

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Không thể xử lý dữ liệu diễn đàn.";
}

function formatDateTime(
  value: string,
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getInitials(
  name: string,
) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "TV"
  );
}

function AuthorPanel({
  author,
  compact = false,
}: {
  author: ForumAuthor;
  compact?: boolean;
}) {
  const isDoctor =
    author.role === "doctor";

  return (
    <div className="text-center">
      <Avatar
        size={compact ? 44 : 58}
        src={
          author.avatarUrl ||
          undefined
        }
        className={
          isDoctor
            ? "!bg-blue-600"
            : "!bg-pink-500"
        }
      >
        {isDoctor ? (
          <Stethoscope className="h-5 w-5" />
        ) : (
          getInitials(author.name)
        )}
      </Avatar>

      <Text
        strong
        className="mt-2 block text-sm"
      >
        {author.name}
      </Text>

      <Text
        type="secondary"
        className="mt-0.5 block text-xs"
      >
        {author.roleLabel}
      </Text>

      {author.verified ? (
        <Tag
          color="blue"
          className="!mt-2 !mr-0"
        >
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
          Xác thực
        </Tag>
      ) : null}
    </div>
  );
}

export default function ForumPostDetailPage() {
  const params = useParams<{
    postId: string;
  }>();
  const router = useRouter();
  const {
    message: messageApi,
  } = App.useApp();
  const currentUser =
    useAuthStore(
      (state) => state.user,
    );
  const isLoggedIn =
    Boolean(currentUser);
  const [reportForm] =
    Form.useForm<ReportFormValues>();

  const [post, setPost] =
    useState<ForumPost | null>(
      null,
    );
  const [
    relatedPosts,
    setRelatedPosts,
  ] = useState<ForumPost[]>([]);
  const [disclaimer, setDisclaimer] =
    useState(
      "Thông tin tham khảo, không thay thế tư vấn bác sĩ.",
    );
  const [loading, setLoading] =
    useState(true);
  const [
    commentSubmitting,
    setCommentSubmitting,
  ] = useState(false);
  const [
    reportSubmitting,
    setReportSubmitting,
  ] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const [
    commentContent,
    setCommentContent,
  ] = useState("");
  const [
    replyingTo,
    setReplyingTo,
  ] = useState<string | null>(
    null,
  );
  const [
    replyContent,
    setReplyContent,
  ] = useState("");
  const [
    reportTarget,
    setReportTarget,
  ] = useState<ReportTarget>(
    null,
  );

  const loadPost = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          detail,
          disclaimerResult,
        ] = await Promise.all([
          getForumPost(
            params.postId,
          ),
          getForumDisclaimer(),
        ]);

        setPost(detail);
        setDisclaimer(
          disclaimerResult.message,
        );

        const related =
          await getForumPosts({
            page: 1,
            limit: 5,
            category:
              detail.category,
            status: "published",
          });

        setRelatedPosts(
          related.items
            .filter(
              (item) =>
                item.id !==
                detail.id,
            )
            .slice(0, 4),
        );
      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
        setPost(null);
      } finally {
        setLoading(false);
      }
    },
    [params.postId],
  );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadPost();
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [loadPost]);

  const visibleComments =
    useMemo(
      () =>
        post?.comments.filter(
          (comment) =>
            comment.status ===
              "published" ||
            comment.status ===
              "pending",
        ) ?? [],
      [post],
    );

  async function submitComment(
    parentId?: string,
  ) {
    if (!post) return;

    if (!isLoggedIn) {
      messageApi.warning(
        "Vui lòng đăng nhập để bình luận.",
      );
      return;
    }

    if (post.isLocked) {
      messageApi.warning(
        "Bài viết đang khóa bình luận.",
      );
      return;
    }

    const content = (
      parentId
        ? replyContent
        : commentContent
    ).trim();

    if (!content) {
      messageApi.warning(
        "Vui lòng nhập nội dung bình luận.",
      );
      return;
    }

    setCommentSubmitting(true);

    try {
      const response =
        await createForumComment(
          post.id,
          {
            content,
            parentId,
            messageType: "text",
          },
        );

      messageApi.success(
        response.message ||
          "Đã gửi bình luận.",
      );
      setCommentContent("");
      setReplyContent("");
      setReplyingTo(null);
      await loadPost();
    } catch (submitError) {
      messageApi.error(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  function openReport(
    target: Exclude<
      ReportTarget,
      null
    >,
  ) {
    if (!isLoggedIn) {
      messageApi.warning(
        "Vui lòng đăng nhập để báo cáo nội dung.",
      );
      return;
    }

    reportForm.resetFields();
    setReportTarget(target);
  }

  async function submitReport(
    values: ReportFormValues,
  ) {
    if (!reportTarget) return;

    if (!isLoggedIn) {
      messageApi.warning(
        "Vui lòng đăng nhập để báo cáo nội dung.",
      );
      return;
    }

    setReportSubmitting(true);

    try {
      const reason = [
        values.reasonPreset,
        values.detail?.trim(),
      ]
        .filter(Boolean)
        .join(": ");

      const response =
        await createForumReport({
          targetType:
            reportTarget.type,
          targetId:
            reportTarget.id,
          reason,
        });

      messageApi.success(
        response.message ||
          "Đã gửi báo cáo.",
      );
      setReportTarget(null);
      reportForm.resetFields();
    } catch (submitError) {
      messageApi.error(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setReportSubmitting(false);
    }
  }

  async function handleSharePost() {
    if (!post) return;

    const shareData = {
      title: post.title,
      text:
        post.excerpt ||
        post.content,
      url: window.location.href,
    };

    try {
      if (
        typeof navigator.share ===
        "function"
      ) {
        await navigator.share(
          shareData,
        );
        return;
      }

      await navigator.clipboard.writeText(
        window.location.href,
      );

      messageApi.success(
        "Đã sao chép liên kết bài viết.",
      );
    } catch (shareError) {
      if (
        shareError instanceof
          DOMException &&
        shareError.name ===
          "AbortError"
      ) {
        return;
      }

      messageApi.error(
        "Không thể chia sẻ bài viết.",
      );
    }
  }

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center">
            <Text type="secondary">
              Đang tải bài viết...
            </Text>
          </div>
        </div>
        <SiteFooter />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center">
            <Empty
              description={
                error ||
                "Không tìm thấy bài viết."
              }
            >
              <Button
                type="primary"
                className="!bg-pink-500"
                onClick={() =>
                  router.push("/forum")
                }
              >
                Quay lại Forum
              </Button>
            </Empty>
          </div>
        </div>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-[1380px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="text"
              icon={
                <ArrowLeft className="h-4 w-4" />
              }
              onClick={() =>
                router.back()
              }
              className="!px-0 !font-semibold !text-slate-600"
            >
              Quay lại danh sách bài viết
            </Button>

            <Space wrap>
              <Button
                title={
                  isLoggedIn
                    ? "Báo cáo bài viết"
                    : "Đăng nhập để báo cáo"
                }
                icon={
                  <Flag className="h-4 w-4" />
                }
                onClick={() =>
                  openReport({
                    type: "post",
                    id: post.id,
                    label: "bài viết",
                  })
                }
              >
                Báo cáo
              </Button>

              <Button
                icon={
                  <Share2 className="h-4 w-4" />
                }
                onClick={() =>
                  void handleSharePost()
                }
              >
                Chia sẻ
              </Button>
            </Space>
          </div>

          <Alert
            type="warning"
            showIcon
            className="mb-4 !rounded-xl !border-amber-200"
            title={disclaimer}
            description="Không tự ý sử dụng thuốc hoặc thay đổi phác đồ điều trị dựa trên nội dung trong Forum."
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
            <section className="min-w-0 space-y-4">
              <Card
                className="!rounded-2xl !border-slate-200"
                styles={{
                  body: {
                    padding: 0,
                  },
                }}
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <Tag color="pink">
                    {post.categoryName ||
                      post.category}
                  </Tag>

                  {post.isPinned ? (
                    <Tag color="gold">
                      Ghim
                    </Tag>
                  ) : null}

                  {post.isFeatured ? (
                    <Tag color="blue">
                      Nổi bật
                    </Tag>
                  ) : null}

                  {post.isLocked ? (
                    <Tag>
                      <Lock className="mr-1 inline h-3.5 w-3.5" />
                      Khóa bình luận
                    </Tag>
                  ) : null}

                  <Text
                    type="secondary"
                    className="ml-auto text-xs"
                  >
                    Chủ đề:{" "}
                    {post.topicTitle ||
                      post.topicId}
                  </Text>
                </div>

                <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
                  <aside className="border-b border-slate-200 bg-slate-50/70 p-5 md:border-b-0 md:border-r">
                    <AuthorPanel
                      author={
                        post.author
                      }
                    />
                  </aside>

                  <article className="min-w-0 p-5 md:p-7">
                    <div className="mb-5 border-b border-slate-100 pb-4">
                      <Title
                        level={2}
                        className="!mb-2 !text-slate-950"
                      >
                        {post.title}
                      </Title>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDateTime(
                            post.publishedAt ||
                              post.createdAt,
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {post.views} lượt xem
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {
                            visibleComments.length
                          }{" "}
                          phản hồi
                        </span>
                      </div>
                    </div>

                    {post.coverImageUrl ? (
                      <div
                        className="mb-6 h-72 rounded-2xl bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${post.coverImageUrl}")`,
                        }}
                        role="img"
                        aria-label={
                          post.title
                        }
                      />
                    ) : null}

                    {post.excerpt ? (
                      <Paragraph className="!font-medium !leading-7">
                        {post.excerpt}
                      </Paragraph>
                    ) : null}

                    {post.content ? (
                      <ForumRichContent
                        html={
                          post.content
                        }
                      />
                    ) : (
                      <Paragraph className="!mb-0 !text-[15px] !leading-7 !text-slate-700">
                        Nội dung chưa được cập nhật.
                      </Paragraph>
                    )}
                  </article>
                </div>
              </Card>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <Text strong>
                    Phản hồi trong bài viết
                  </Text>
                  <Text
                    type="secondary"
                    className="ml-2 text-xs"
                  >
                    {
                      visibleComments.length
                    }{" "}
                    bình luận
                  </Text>
                </div>

                <Button
                  icon={
                    <Reply className="h-4 w-4" />
                  }
                  disabled={
                    post.isLocked
                  }
                  onClick={() => {
                    document
                      .getElementById(
                        "reply-composer",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      });
                  }}
                >
                  Trả lời
                </Button>
              </div>

              {visibleComments.length ===
              0 ? (
                <Card className="!rounded-2xl !border-slate-200">
                  <Empty description="Chưa có bình luận." />
                </Card>
              ) : (
                visibleComments.map(
                  (comment, index) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      index={index}
                      replyingTo={
                        replyingTo
                      }
                      replyContent={
                        replyContent
                      }
                      submitting={
                        commentSubmitting
                      }
                      onReply={() => {
                        setReplyingTo(
                          comment.id,
                        );
                        setReplyContent(
                          "",
                        );
                      }}
                      onCancelReply={() => {
                        setReplyingTo(
                          null,
                        );
                        setReplyContent(
                          "",
                        );
                      }}
                      onReplyContentChange={
                        setReplyContent
                      }
                      onSubmitReply={() =>
                        void submitComment(
                          comment.id,
                        )
                      }
                      onReport={() =>
                        openReport({
                          type:
                            "comment",
                          id: comment.id,
                          label:
                            "bình luận",
                        })
                      }
                    />
                  ),
                )
              )}

              <Card
                id="reply-composer"
                className="!rounded-2xl !border-slate-200"
                title="Trả lời bài viết"
              >
                {!isLoggedIn ? (
                  <Alert
                    type="info"
                    showIcon
                    className="mb-3"
                    title="Bạn vẫn có thể xem Forum khi chưa đăng nhập."
                    description="Đăng nhập để bình luận, trả lời hoặc báo cáo nội dung."
                  />
                ) : null}

                {post.isLocked ? (
                  <Alert
                    type="warning"
                    showIcon
                    title="Bài viết đang khóa bình luận."
                  />
                ) : (
                  <div>
                    <TextArea
                      value={
                        commentContent
                      }
                      disabled={
                        !isLoggedIn
                      }
                      rows={6}
                      maxLength={1000}
                      showCount
                      placeholder="Nhập nội dung phản hồi..."
                      onChange={(event) =>
                        setCommentContent(
                          event.target.value,
                        )
                      }
                    />

                    <div className="mt-3 flex justify-end">
                      <Button
                        type="primary"
                        icon={
                          <Send className="h-4 w-4" />
                        }
                        className="!bg-pink-500"
                        loading={
                          commentSubmitting
                        }
                        disabled={
                          !isLoggedIn
                        }
                        onClick={() =>
                          void submitComment()
                        }
                      >
                        Gửi phản hồi
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
              <Card
                size="small"
                className="!rounded-2xl !border-slate-200"
                title="Thông tin bài viết"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <Eye className="mx-auto h-4 w-4 text-slate-400" />
                    <p className="mb-0 mt-1 font-semibold text-slate-900">
                      {post.views}
                    </p>
                    <p className="mb-0 text-xs text-slate-500">
                      Lượt xem
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <MessageCircle className="mx-auto h-4 w-4 text-slate-400" />
                    <p className="mb-0 mt-1 font-semibold text-slate-900">
                      {
                        visibleComments.length
                      }
                    </p>
                    <p className="mb-0 text-xs text-slate-500">
                      Phản hồi
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                size="small"
                className="!rounded-2xl !border-slate-200"
                title="Bài viết liên quan"
              >
                <div className="divide-y divide-slate-100">
                  {relatedPosts.length >
                  0 ? (
                    relatedPosts.map(
                      (item) => (
                        <Link
                          key={item.id}
                          href={`/forum/${item.id}`}
                          className="block py-3 first:pt-0 last:pb-0"
                        >
                          <Tag
                            color="pink"
                            className="!mb-2"
                          >
                            {item.categoryName ||
                              item.category}
                          </Tag>
                          <p className="mb-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-800 hover:text-pink-600">
                            {item.title}
                          </p>
                          <p className="mb-0 text-xs text-slate-400">
                            {
                              item.commentCount
                            }{" "}
                            phản hồi
                          </p>
                        </Link>
                      ),
                    )
                  ) : (
                    <Empty
                      image={
                        Empty.PRESENTED_IMAGE_SIMPLE
                      }
                      description="Chưa có bài liên quan"
                    />
                  )}
                </div>
              </Card>
            </aside>
          </div>
        </main>
      </div>

      <Modal
        open={Boolean(reportTarget)}
        centered
        width={520}
        title={
          reportTarget
            ? `Báo cáo ${reportTarget.label}`
            : "Báo cáo nội dung"
        }
        okText="Gửi báo cáo"
        cancelText="Hủy"
        confirmLoading={
          reportSubmitting
        }
        onCancel={() => {
          if (
            reportSubmitting
          ) {
            return;
          }

          setReportTarget(null);
          reportForm.resetFields();
        }}
        onOk={() =>
          reportForm.submit()
        }
        mask={{
          closable:
            !reportSubmitting,
        }}
        forceRender
      >
        <Form<ReportFormValues>
          form={reportForm}
          layout="vertical"
          onFinish={(values) =>
            void submitReport(values)
          }
        >
          <Form.Item
            name="reasonPreset"
            label="Lý do báo cáo"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn lý do.",
              },
            ]}
          >
            <Select
              options={
                REPORT_REASON_OPTIONS
              }
              placeholder="Chọn lý do"
            />
          </Form.Item>

          <Form.Item
            name="detail"
            label="Mô tả thêm"
          >
            <TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder="Mô tả nội dung cần kiểm duyệt..."
            />
          </Form.Item>
        </Form>
      </Modal>

      <SiteFooter />
    </>
  );
}

function CommentCard({
  comment,
  index,
  replyingTo,
  replyContent,
  submitting,
  onReply,
  onCancelReply,
  onReplyContentChange,
  onSubmitReply,
  onReport,
}: {
  comment: ForumComment;
  index: number;
  replyingTo: string | null;
  replyContent: string;
  submitting: boolean;
  onReply: () => void;
  onCancelReply: () => void;
  onReplyContentChange: (
    value: string,
  ) => void;
  onSubmitReply: () => void;
  onReport: () => void;
}) {
  return (
    <div className="space-y-3">
      <Card
        className="!rounded-2xl !border-slate-200"
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 p-4 md:border-b-0 md:border-r">
            <AuthorPanel
              author={comment.author}
              compact
            />
          </aside>

          <div className="min-w-0 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <Space>
                <Text
                  type="secondary"
                  className="text-xs"
                >
                  #{index + 1}
                </Text>

                {comment.status ===
                "pending" ? (
                  <Tag color="gold">
                    Chờ duyệt
                  </Tag>
                ) : null}
              </Space>

              <Text
                type="secondary"
                className="text-xs"
              >
                {formatDateTime(
                  comment.createdAt,
                )}
              </Text>
            </div>

            <Paragraph className="!mb-4 !whitespace-pre-wrap !leading-7 !text-slate-700">
              {comment.content}
            </Paragraph>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="text"
                size="small"
                icon={
                  <Flag className="h-3.5 w-3.5" />
                }
                onClick={onReport}
              >
                Báo cáo
              </Button>

              <Button
                type="text"
                size="small"
                icon={
                  <Reply className="h-3.5 w-3.5" />
                }
                onClick={onReply}
              >
                Trả lời
              </Button>
            </div>

            {replyingTo ===
            comment.id ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <TextArea
                  value={
                    replyContent
                  }
                  rows={3}
                  maxLength={500}
                  placeholder={`Trả lời ${comment.author.name}...`}
                  onChange={(event) =>
                    onReplyContentChange(
                      event.target.value,
                    )
                  }
                />

                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    size="small"
                    disabled={submitting}
                    onClick={
                      onCancelReply
                    }
                  >
                    Hủy
                  </Button>

                  <Button
                    type="primary"
                    size="small"
                    className="!bg-pink-500"
                    loading={submitting}
                    onClick={
                      onSubmitReply
                    }
                  >
                    Gửi trả lời
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {comment.replies.map(
        (reply) => (
          <Card
            key={reply.id}
            className="!ml-6 !rounded-2xl !border-slate-200"
            styles={{
              body: {
                padding: 0,
              },
            }}
          >
            <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
              <aside className="border-b border-slate-200 bg-slate-50/70 p-4 md:border-b-0 md:border-r">
                <AuthorPanel
                  author={
                    reply.author
                  }
                  compact
                />
              </aside>

              <div className="min-w-0 p-5">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                  <Space>
                    <Text
                      type="secondary"
                      className="text-xs"
                    >
                      Trả lời
                    </Text>

                    {reply.author
                      .verified ? (
                      <Tag color="blue">
                        <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                        Phản hồi xác thực
                      </Tag>
                    ) : null}
                  </Space>

                  <Text
                    type="secondary"
                    className="text-xs"
                  >
                    {formatDateTime(
                      reply.createdAt,
                    )}
                  </Text>
                </div>

                <Paragraph className="!mb-0 !whitespace-pre-wrap !leading-7 !text-slate-700">
                  {reply.content}
                </Paragraph>
              </div>
            </div>
          </Card>
        ),
      )}
    </div>
  );
}

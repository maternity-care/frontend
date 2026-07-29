"use client";

import Link from "next/link";
import {
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
  Timeline,
  Typography,
} from "antd";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CircleHelp,
  Clock3,
  Eye,
  Flag,
  Lock,
  MessageCircle,
  Reply,
  Send,
  Share2,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  SiteFooter,
} from "@/fe/components/layout/SiteFooter";
import {
  CURRENT_FORUM_USER,
  forumPosts,
  getForumCommentsByPostId,
  getForumPostById,
  inspectCommentContent,
  type ForumAuthor,
  type ForumComment,
  type ForumCommentReply,
  type ForumPostStatus,
  type ForumReportReason,
} from "@/features/forum/forum.mock";

const {
  Paragraph,
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type ReportTarget = {
  type: "post" | "comment";
  id: string;
  label: string;
} | null;

type ReportFormValues = {
  reason: ForumReportReason;
  detail?: string;
};

const REPORT_REASON_OPTIONS: Array<{
  value: ForumReportReason;
  label: string;
}> = [
  {
    value: "spam",
    label: "Spam",
  },
  {
    value: "wrong_topic",
    label: "Sai chủ đề",
  },
  {
    value:
      "medical_misinformation",
    label:
      "Thông tin y tế sai lệch",
  },
  {
    value: "drug_advertising",
    label:
      "Quảng cáo thuốc/dịch vụ",
  },
  {
    value: "hate_or_harmful",
    label:
      "Nội dung gây hại/kích động",
  },
  {
    value: "other",
    label: "Lý do khác",
  },
];

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

function getStatusTag(
  status: ForumPostStatus,
) {
  if (status === "published") {
    return (
      <Tag color="green">
        Đã xuất bản
      </Tag>
    );
  }

  if (status === "pending") {
    return (
      <Tag color="gold">
        Chờ duyệt
      </Tag>
    );
  }

  if (status === "hidden") {
    return (
      <Tag color="orange">
        Đã ẩn
      </Tag>
    );
  }

  if (status === "rejected") {
    return (
      <Tag color="red">
        Bị từ chối
      </Tag>
    );
  }

  return <Tag>Đã xóa</Tag>;
}

function AuthorPanel({
  author,
  compact = false,
}: {
  author: ForumAuthor;
  compact?: boolean;
}) {
  const isDoctor =
    author.type === "doctor";

  return (
    <div className="text-center">
      <Avatar
        size={compact ? 44 : 58}
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

  const [reportForm] =
    Form.useForm<ReportFormValues>();

  const post = getForumPostById(
    params.postId,
  );

  const [comments, setComments] =
    useState<ForumComment[]>(() =>
      getForumCommentsByPostId(
        params.postId,
      ),
    );

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
  ] = useState<ReportTarget>(null);

  const visibleComments = useMemo(
    () =>
      comments
        .filter(
          (comment) =>
            comment.status ===
              "published" ||
            (comment.status ===
              "pending" &&
              comment.author.id ===
                CURRENT_FORUM_USER.id),
        )
        .slice(),
    [comments],
  );

  if (!post) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center">
            <Empty description="Không tìm thấy chủ đề." />
          </div>
        </div>

        <SiteFooter />
      </>
    );
  }

  const currentPost = post;

  const isOwner =
    currentPost.author.id ===
    CURRENT_FORUM_USER.id;

  const canView =
    currentPost.status === "published" ||
    isOwner;

  if (!canView) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center">
            <Empty description="Chủ đề hiện không được hiển thị công khai.">
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

  function submitComment() {
    if (currentPost.commentsLocked) {
      messageApi.warning(
        "Chủ đề đang khóa bình luận.",
      );
      return;
    }

    const content =
      commentContent.trim();

    if (!content) {
      messageApi.warning(
        "Vui lòng nhập nội dung bình luận.",
      );
      return;
    }

    const moderation =
      inspectCommentContent(content);

    const nextComment: ForumComment = {
      id: `comment-${Date.now()}`,
      postId: currentPost.id,
      author: CURRENT_FORUM_USER,
      content,
      createdAt: "Vừa xong",
      status: moderation.status,
      moderationReason:
        moderation.reason,
      reportCount: 0,
      replies: [],
    };

    setComments((current) => [
      ...current,
      nextComment,
    ]);

    setCommentContent("");

    messageApi.success(
      moderation.status ===
        "published"
        ? "Đã đăng bình luận."
        : "Bình luận đang chờ kiểm duyệt.",
    );
  }

  function submitReply(
    commentId: string,
  ) {
    const content =
      replyContent.trim();

    if (!content) {
      messageApi.warning(
        "Vui lòng nhập nội dung trả lời.",
      );
      return;
    }

    const moderation =
      inspectCommentContent(content);

    const nextReply: ForumCommentReply = {
      id: `reply-${Date.now()}`,
      postId: currentPost.id,
      parentCommentId:
        commentId,
      author: CURRENT_FORUM_USER,
      content,
      createdAt: "Vừa xong",
      status: moderation.status,
      moderationReason:
        moderation.reason,
      reportCount: 0,
    };

    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [
                ...comment.replies,
                nextReply,
              ],
            }
          : comment,
      ),
    );

    setReplyContent("");
    setReplyingTo(null);

    messageApi.success(
      moderation.status ===
        "published"
        ? "Đã gửi trả lời."
        : "Trả lời đang chờ kiểm duyệt.",
    );
  }

  function openReport(
    target: Exclude<
      ReportTarget,
      null
    >,
  ) {
    reportForm.resetFields();
    setReportTarget(target);
  }

  function submitReport(
    values: ReportFormValues,
  ) {
    if (!reportTarget) return;

    setReportTarget(null);
    reportForm.resetFields();

    messageApi.success(
      `Đã gửi báo cáo ${reportTarget.label}. Moderator sẽ kiểm tra nội dung.`,
    );

    void values;
  }

  async function handleSharePost() {
    const shareData = {
      title: currentPost.title,
      text: currentPost.excerpt,
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
        "Đã sao chép liên kết chủ đề.",
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      messageApi.error(
        "Không thể chia sẻ chủ đề.",
      );
    }
  }

  const relatedPosts =
    forumPosts
      .filter(
        (item) =>
          item.id !== currentPost.id &&
          item.status ===
            "published",
      )
      .slice(0, 4);

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
              Quay lại danh sách chủ đề
            </Button>

            <Space wrap>
              <Button
                icon={
                  <Flag className="h-4 w-4" />
                }
                onClick={() =>
                  openReport({
                    type: "post",
                    id: currentPost.id,
                    label: "chủ đề",
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

          {currentPost.status !==
          "published" ? (
            <Alert
              type={
                currentPost.status ===
                "rejected"
                  ? "error"
                  : "warning"
              }
              showIcon
              className="mb-4 !rounded-xl"
              title={
                <Space wrap>
                  <span>
                    Trạng thái chủ đề:
                  </span>
                  {getStatusTag(
                    currentPost.status,
                  )}
                </Space>
              }
              description={
                currentPost.moderationReason ??
                "Chủ đề chỉ đang hiển thị cho bạn."
              }
            />
          ) : null}

          <Alert
            type="warning"
            showIcon
            className="mb-4 !rounded-xl !border-amber-200"
            title="Thông tin tham khảo, không thay thế tư vấn bác sĩ."
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
                    {currentPost.categoryLabel}
                  </Tag>

                  {currentPost.postType ===
                  "question" ? (
                    <Tag color="blue">
                      <CircleHelp className="mr-1 inline h-3.5 w-3.5" />
                      Câu hỏi
                    </Tag>
                  ) : null}

                  {currentPost.pinned ? (
                    <Tag color="gold">
                      Ghim
                    </Tag>
                  ) : null}

                  {currentPost.commentsLocked ? (
                    <Tag>
                      <Lock className="mr-1 inline h-3.5 w-3.5" />
                      Khóa bình luận
                    </Tag>
                  ) : null}

                  <Text
                    type="secondary"
                    className="ml-auto text-xs"
                  >
                    Chủ đề: {currentPost.topic}
                  </Text>
                </div>

                <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
                  <aside className="border-b border-slate-200 bg-slate-50/70 p-5 md:border-b-0 md:border-r">
                    <AuthorPanel
                      author={currentPost.author}
                    />

                    <div className="mt-4 space-y-2 text-center text-xs text-slate-500">
                      <p className="mb-0">
                        Thành viên Forum
                      </p>

                      <p className="mb-0">
                        Tham gia 2026
                      </p>
                    </div>
                  </aside>

                  <article className="min-w-0 p-5 md:p-7">
                    <div className="mb-5 border-b border-slate-100 pb-4">
                      <Title
                        level={2}
                        className="!mb-2 !text-slate-950"
                      >
                        {currentPost.title}
                      </Title>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {currentPost.publishedAt ??
                            "Chưa xuất bản"}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {currentPost.views} lượt xem
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

                    <div className="text-[15px] leading-7 text-slate-700">
                      {currentPost.content.map(
                        (block, index) => {
                          if (
                            block.type ===
                            "heading"
                          ) {
                            return (
                              <Title
                                key={`${block.type}-${index}`}
                                level={3}
                                className="!mb-3 !mt-7 !text-slate-950"
                              >
                                {block.text}
                              </Title>
                            );
                          }

                          if (
                            block.type ===
                            "quote"
                          ) {
                            return (
                              <blockquote
                                key={`${block.type}-${index}`}
                                className="my-5 border-l-4 border-pink-400 bg-pink-50 px-4 py-3 font-medium text-slate-700"
                              >
                                {block.text}
                              </blockquote>
                            );
                          }

                          if (
                            block.type ===
                            "list"
                          ) {
                            return (
                              <ul
                                key={`${block.type}-${index}`}
                                className="my-4 list-disc space-y-2 pl-6 marker:text-pink-500"
                              >
                                {block.items.map(
                                  (item) => (
                                    <li
                                      key={item}
                                    >
                                      {item}
                                    </li>
                                  ),
                                )}
                              </ul>
                            );
                          }

                          return (
                            <p
                              key={`${block.type}-${index}`}
                              className="mb-4"
                            >
                              {block.text}
                            </p>
                          );
                        },
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <Space wrap>
                        {currentPost.tags.map(
                          (tag) => (
                            <Tag key={tag}>
                              #{tag}
                            </Tag>
                          ),
                        )}
                      </Space>

                      <Text
                        type="secondary"
                        className="text-xs"
                      >
                        Bài đăng gốc
                      </Text>
                    </div>
                  </article>
                </div>
              </Card>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <Text strong>
                    Phản hồi trong chủ đề
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
                    currentPost.commentsLocked
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
                  Trả lời chủ đề
                </Button>
              </div>

              {visibleComments.map(
                (comment, index) => (
                  <div
                    key={comment.id}
                    className="space-y-3"
                  >
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
                            author={
                              comment.author
                            }
                            compact
                          />
                        </aside>

                        <div className="min-w-0 p-5">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
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
                            </div>

                            <Text
                              type="secondary"
                              className="text-xs"
                            >
                              {
                                comment.createdAt
                              }
                            </Text>
                          </div>

                          <Paragraph className="!mb-4 !whitespace-pre-wrap !leading-7 !text-slate-700">
                            {
                              comment.content
                            }
                          </Paragraph>

                          {comment.status ===
                            "pending" &&
                          comment
                            .moderationReason ? (
                            <Alert
                              type="warning"
                              showIcon
                              className="mb-4 !rounded-xl"
                              title="Bình luận đang chờ kiểm duyệt"
                              description={
                                comment.moderationReason
                              }
                            />
                          ) : null}

                          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <Flag className="h-3.5 w-3.5" />
                              }
                              onClick={() =>
                                openReport({
                                  type:
                                    "comment",
                                  id: comment.id,
                                  label:
                                    "bình luận",
                                })
                              }
                            >
                              Báo cáo
                            </Button>

                            <Button
                              type="text"
                              size="small"
                              icon={
                                <Reply className="h-3.5 w-3.5" />
                              }
                              onClick={() => {
                                setReplyingTo(
                                  comment.id,
                                );
                                setReplyContent(
                                  "",
                                );
                              }}
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
                                onChange={(
                                  event,
                                ) =>
                                  setReplyContent(
                                    event.target
                                      .value,
                                  )
                                }
                              />

                              <div className="mt-2 flex justify-end gap-2">
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setReplyingTo(
                                      null,
                                    );
                                    setReplyContent(
                                      "",
                                    );
                                  }}
                                >
                                  Hủy
                                </Button>

                                <Button
                                  type="primary"
                                  size="small"
                                  className="!bg-pink-500"
                                  onClick={() =>
                                    submitReply(
                                      comment.id,
                                    )
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
                      (reply) => {
                        const isDoctorReply =
                          reply.author
                            .type ===
                          "doctor";

                        return (
                          <Card
                            key={reply.id}
                            className={[
                              "!ml-6 !rounded-2xl",
                              isDoctorReply
                                ? "!border-blue-200 !bg-blue-50/30"
                                : "!border-slate-200",
                            ].join(" ")}
                            styles={{
                              body: {
                                padding: 0,
                              },
                            }}
                          >
                            <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
                              <aside
                                className={[
                                  "border-b p-4 md:border-b-0 md:border-r",
                                  isDoctorReply
                                    ? "border-blue-200 bg-blue-50"
                                    : "border-slate-200 bg-slate-50/70",
                                ].join(" ")}
                              >
                                <AuthorPanel
                                  author={
                                    reply.author
                                  }
                                  compact
                                />
                              </aside>

                              <div className="min-w-0 p-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                  <Space wrap>
                                    <Text
                                      type="secondary"
                                      className="text-xs"
                                    >
                                      Trả lời
                                    </Text>

                                    {reply.officialDoctorAnswer ? (
                                      <Tag color="blue">
                                        <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                                        Phản hồi bác sĩ
                                      </Tag>
                                    ) : null}
                                  </Space>

                                  <Text
                                    type="secondary"
                                    className="text-xs"
                                  >
                                    {
                                      reply.createdAt
                                    }
                                  </Text>
                                </div>

                                <Paragraph className="!mb-0 !whitespace-pre-wrap !leading-7 !text-slate-700">
                                  {
                                    reply.content
                                  }
                                </Paragraph>
                              </div>
                            </div>
                          </Card>
                        );
                      },
                    )}
                  </div>
                ),
              )}

              <Card
                id="reply-composer"
                className="!rounded-2xl !border-slate-200"
                title={
                  <span className="font-semibold text-slate-900">
                    Trả lời chủ đề
                  </span>
                }
              >
                {currentPost.commentsLocked ? (
                  <Alert
                    type="warning"
                    showIcon
                    title="Chủ đề đang khóa bình luận."
                    description="Bạn vẫn có thể đọc các phản hồi đã được đăng trước đó."
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
                    <AuthorPanel
                      author={
                        CURRENT_FORUM_USER
                      }
                      compact
                    />

                    <div>
                      <TextArea
                        value={
                          commentContent
                        }
                        rows={6}
                        maxLength={1000}
                        placeholder="Nhập nội dung phản hồi hoặc câu hỏi của bạn..."
                        onChange={(
                          event,
                        ) =>
                          setCommentContent(
                            event.target
                              .value,
                          )
                        }
                      />

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <Text
                          type="secondary"
                          className="text-xs"
                        >
                          Bình luận có thể được tự động đăng hoặc chuyển chờ duyệt khi phát hiện spam/từ khóa nhạy cảm.
                        </Text>

                        <Button
                          type="primary"
                          icon={
                            <Send className="h-4 w-4" />
                          }
                          className="!bg-pink-500"
                          onClick={
                            submitComment
                          }
                        >
                          Gửi phản hồi
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
              <Card
                size="small"
                className="!rounded-2xl !border-slate-200"
                title="Thông tin chủ đề"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <Eye className="mx-auto h-4 w-4 text-slate-400" />

                    <p className="mb-0 mt-1 font-semibold text-slate-900">
                      {currentPost.views}
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

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p className="mb-0 flex items-center justify-between gap-3">
                    <span>Trạng thái</span>
                    {getStatusTag(
                      currentPost.status,
                    )}
                  </p>

                  <p className="mb-0 flex items-center justify-between gap-3">
                    <span>Bình luận</span>
                    <span>
                      {currentPost.commentsLocked
                        ? "Đã khóa"
                        : "Đang mở"}
                    </span>
                  </p>
                </div>
              </Card>

              <Card
                size="small"
                className="!rounded-2xl !border-slate-200"
                title="Chủ đề liên quan"
              >
                <div className="divide-y divide-slate-100">
                  {relatedPosts.map(
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
                          {
                            item.categoryLabel
                          }
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
                  )}
                </div>
              </Card>

              {isOwner ? (
                <Card
                  size="small"
                  className="!rounded-2xl !border-slate-200"
                  title="Lịch sử kiểm duyệt"
                >
                  <Timeline
                    items={currentPost.moderationLogs.map(
                      (log) => ({
                        children: (
                          <div>
                            <Text
                              strong
                              className="block text-sm"
                            >
                              {
                                log.actorName
                              }
                            </Text>

                            <Text
                              type="secondary"
                              className="block text-xs"
                            >
                              {log.actorRole} ·{" "}
                              {
                                log.createdAt
                              }
                            </Text>

                            {log.reason ? (
                              <Paragraph className="!mb-0 !mt-1 !text-xs !leading-5 !text-slate-600">
                                {log.reason}
                              </Paragraph>
                            ) : null}
                          </div>
                        ),
                      }),
                    )}
                  />
                </Card>
              ) : null}
            </aside>
          </div>
        </main>
      </div>

      <Modal
        open={Boolean(reportTarget)}
        centered
        width={520}
        forceRender
        destroyOnHidden={false}
        title={
          reportTarget
            ? `Báo cáo ${reportTarget.label}`
            : "Báo cáo nội dung"
        }
        okText="Gửi báo cáo"
        cancelText="Hủy"
        onCancel={() => {
          setReportTarget(null);
          reportForm.resetFields();
        }}
        onOk={() =>
          reportForm.submit()
        }
        mask={{
          closable: true,
        }}
      >
        <Form<ReportFormValues>
          form={reportForm}
          layout="vertical"
          onFinish={submitReport}
        >
          <Form.Item
            name="reason"
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
              placeholder="Mô tả nội dung cần moderator kiểm tra..."
            />
          </Form.Item>
        </Form>
      </Modal>

      <SiteFooter />
    </>
  );
}
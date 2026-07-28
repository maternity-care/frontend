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
  App,
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeft,
  CalendarDays,
  CornerDownRight,
  Eye,
  MessageCircle,
  Reply,
  Send,
  Share2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { SiteFooter } from "@/fe/components/layout/SiteFooter";
import {
  forumPosts,
  getForumPostById,
} from "@/features/forum/forum.mock";

const {
  Paragraph,
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type CommentReply = {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
};

type ForumComment = {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  replies: CommentReply[];
};

const initialComments: ForumComment[] = [
  {
    id: "comment-1",
    author: "Minh Thư",
    role: "Mẹ bầu 12 tuần",
    content:
      "Cảm ơn bác sĩ. Em từng bị đau bụng nhẹ nhưng không ra máu. Trường hợp này có cần đi khám ngay không ạ?",
    createdAt: "28/07/2026 · 14:20",
    replies: [
      {
        id: "reply-1",
        author: "BS. Nguyễn Minh Anh",
        role: "Bác sĩ Sản phụ khoa",
        content:
          "Nếu cơn đau nhẹ, không tăng dần và không kèm ra máu, em có thể nghỉ ngơi và theo dõi. Khi đau kéo dài hoặc xuất hiện thêm triệu chứng bất thường, em nên liên hệ bác sĩ đang theo dõi thai kỳ.",
        createdAt: "28/07/2026 · 15:02",
      },
    ],
  },
  {
    id: "comment-2",
    author: "Hải Yến",
    role: "Thành viên cộng đồng",
    content:
      "Bài viết rất rõ ràng. Mong diễn đàn có thêm bài về những xét nghiệm quan trọng trong ba tháng đầu.",
    createdAt: "28/07/2026 · 16:10",
    replies: [],
  },
];

export default function ForumPostDetailPage() {
  const params = useParams<{
    postId: string;
  }>();
  const router = useRouter();
  const { message } = App.useApp();

  const post = getForumPostById(
    params.postId,
  );

  const [comments, setComments] =
    useState(initialComments);
  const [commentContent, setCommentContent] =
    useState("");
  const [replyingTo, setReplyingTo] =
    useState<string | null>(null);
  const [replyContent, setReplyContent] =
    useState("");

  const visibleComments = useMemo(
    () => [...comments].reverse(),
    [comments],
  );

  if (!post) {
    return (
      <>
        <div className="min-h-screen bg-[#fff8fb] px-4 py-10">
          <div className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center">
            <Empty description="Không tìm thấy bài viết." />
          </div>
        </div>

        <SiteFooter />
      </>
    );
  }

  function submitComment() {
    const content =
      commentContent.trim();

    if (!content) {
      message.warning(
        "Vui lòng nhập nội dung bình luận.",
      );
      return;
    }

    setComments((current) => [
      ...current,
      {
        id: `comment-${Date.now()}`,
        author: "Người dùng hiện tại",
        role: "Thành viên cộng đồng",
        content,
        createdAt: "Vừa xong",
        replies: [],
      },
    ]);

    setCommentContent("");
    message.success(
      "Đã thêm bình luận.",
    );
  }

  function submitReply(
    commentId: string,
  ) {
    const content =
      replyContent.trim();

    if (!content) {
      message.warning(
        "Vui lòng nhập nội dung trả lời.",
      );
      return;
    }

    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [
                ...comment.replies,
                {
                  id: `reply-${Date.now()}`,
                  author:
                    "Người dùng hiện tại",
                  role:
                    "Thành viên cộng đồng",
                  content,
                  createdAt: "Vừa xong",
                },
              ],
            }
          : comment,
      ),
    );

    setReplyContent("");
    setReplyingTo(null);
    message.success(
      "Đã trả lời bình luận.",
    );
  }

  async function handleSharePost(
    title: string,
    excerpt: string,
  ) {
    const shareData = {
      title,
      text: excerpt,
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

      message.success(
        "Đã sao chép liên kết bài viết.",
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      message.error(
        "Không thể chia sẻ bài viết.",
      );
    }
  }

  const relatedPosts =
    forumPosts
      .filter(
        (item) =>
          item.id !== post.id,
      )
      .slice(0, 3);

  return (
    <>
      <div className="min-h-screen bg-[#fff8fb]">
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <Button
            type="text"
            icon={
              <ArrowLeft className="h-4 w-4" />
            }
            onClick={() => router.back()}
            className="!mb-4 !px-0 !font-semibold !text-slate-600"
          >
            Quay lại Forum
          </Button>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div
              className="min-w-0 flex flex-col"
              style={{
                gap: 40,
              }}
            >
              <Card
                className="overflow-hidden !rounded-[30px] !border-pink-100 !shadow-[0_22px_70px_rgba(15,23,42,0.06)]"
                styles={{
                  body: {
                    padding: 0,
                  },
                }}
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-400 to-orange-300 px-6 py-10 text-white md:px-10 md:py-12">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                  <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

                  <div className="relative">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <Tag className="!border-white/30 !bg-white/20 !text-white">
                        {post.categoryLabel}
                      </Tag>

                      {post.verified ? (
                        <Tag className="!border-white/30 !bg-white/20 !text-white">
                          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                          Nội dung xác thực
                        </Tag>
                      ) : null}
                    </div>

                    <Title
                      level={1}
                      className="!mb-4 !max-w-4xl !text-4xl !font-bold !leading-tight !text-white"
                    >
                      {post.title}
                    </Title>

                    <Paragraph className="!mb-0 !max-w-3xl !text-base !leading-7 !text-pink-50">
                      {post.excerpt}
                    </Paragraph>
                  </div>
                </div>

                <div className="p-6 md:p-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        size={46}
                        icon={<UserRound />}
                        className="!bg-pink-100 !text-pink-600"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <Text strong>
                            {post.author}
                          </Text>

                          {post.verified ? (
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                          ) : null}
                        </div>

                        <Text
                          type="secondary"
                          className="text-xs"
                        >
                          {post.authorRole}
                        </Text>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {post.publishedAt}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.views}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {comments.length}
                      </span>
                    </div>
                  </div>

                  <article className="mx-auto mt-8 max-w-3xl text-[16px] leading-8 text-slate-700">
                    {post.content.map(
                      (block, index) => {
                        if (
                          block.type ===
                          "heading"
                        ) {
                          return (
                            <Title
                              key={index}
                              level={2}
                              className="!mb-3 !mt-9 !text-slate-950"
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
                              key={index}
                              className="my-7 rounded-r-2xl border-l-4 border-pink-400 bg-pink-50 px-5 py-4 font-medium text-slate-700"
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
                              key={index}
                              className="my-5 list-disc space-y-2 pl-6 marker:text-pink-500"
                            >
                              {block.items.map(
                                (item) => (
                                  <li key={item}>
                                    {item}
                                  </li>
                                ),
                              )}
                            </ul>
                          );
                        }

                        return (
                          <p
                            key={index}
                            className="mb-5"
                          >
                            {block.text}
                          </p>
                        );
                      },
                    )}
                  </article>

                  <Divider />

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <Space wrap>
                      {post.tags.map(
                        (tag) => (
                          <Tag
                            key={tag}
                            className="!rounded-full !px-3 !py-1"
                          >
                            #{tag}
                          </Tag>
                        ),
                      )}
                    </Space>

                    <Button
                      icon={
                        <Share2 className="h-4 w-4" />
                      }
                      className="!h-10 !rounded-xl !border-pink-200 !px-4 !font-medium !text-pink-600 hover:!border-pink-400 hover:!text-pink-700"
                      onClick={() =>
                        void handleSharePost(
                          post.title,
                          post.excerpt,
                        )
                      }
                    >
                      Chia sẻ bài viết
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="!rounded-[28px] !border-slate-200">
                <div className="mb-5">
                  <Title
                    level={2}
                    className="!mb-1 !text-slate-950"
                  >
                    Bình luận
                  </Title>

                  <Text type="secondary">
                    {comments.length} bình luận
                  </Text>
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
                  <div className="flex gap-3">
                    <Avatar
                      icon={<UserRound />}
                      className="!bg-pink-100 !text-pink-600"
                    />

                    <div className="min-w-0 flex-1">
                      <TextArea
                        value={commentContent}
                        rows={4}
                        maxLength={1000}
                        showCount={false}
                        placeholder="Chia sẻ suy nghĩ hoặc đặt câu hỏi..."
                        onChange={(event) =>
                          setCommentContent(
                            event.target.value,
                          )
                        }
                      />

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Text
                          type="secondary"
                          className="text-xs"
                        >
                          {commentContent.length}/1000
                        </Text>

                        <Button
                          type="primary"
                          icon={
                            <Send className="h-4 w-4" />
                          }
                          className="!h-10 !rounded-xl !bg-pink-500 !px-5 !font-medium"
                          onClick={
                            submitComment
                          }
                        >
                          Gửi bình luận
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 divide-y divide-slate-200">
                  {visibleComments.map(
                    (comment) => (
                      <div
                        key={comment.id}
                        className="py-6 first:pt-0"
                      >
                        <div className="flex gap-3">
                          <Avatar
                            icon={
                              <UserRound />
                            }
                            className="!bg-slate-100 !text-slate-500"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Text strong>
                                {
                                  comment.author
                                }
                              </Text>

                              <Text
                                type="secondary"
                                className="text-xs"
                              >
                                {comment.role}
                              </Text>

                              <Text
                                type="secondary"
                                className="text-xs"
                              >
                                ·{" "}
                                {
                                  comment.createdAt
                                }
                              </Text>
                            </div>

                            <Paragraph className="!mb-2 !mt-2 !leading-6 !text-slate-700">
                              {
                                comment.content
                              }
                            </Paragraph>

                            <Button
                              type="text"
                              size="small"
                              icon={
                                <Reply className="h-3.5 w-3.5" />
                              }
                              className="!px-0 !text-pink-600"
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

                            {comment.replies
                              .length > 0 ? (
                              <div className="mt-4 space-y-4 border-l-2 border-pink-100 pl-4">
                                {comment.replies.map(
                                  (reply) => (
                                    <div
                                      key={
                                        reply.id
                                      }
                                      className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                                    >
                                      <CornerDownRight className="mt-2 h-4 w-4 shrink-0 text-pink-400" />

                                      <Avatar
                                        size={32}
                                        icon={
                                          <UserRound />
                                        }
                                        className="!bg-blue-50 !text-blue-500"
                                      />

                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Text strong>
                                            {
                                              reply.author
                                            }
                                          </Text>

                                          <Text
                                            type="secondary"
                                            className="text-xs"
                                          >
                                            {
                                              reply.role
                                            }
                                          </Text>

                                          <Text
                                            type="secondary"
                                            className="text-xs"
                                          >
                                            ·{" "}
                                            {
                                              reply.createdAt
                                            }
                                          </Text>
                                        </div>

                                        <Paragraph className="!mb-0 !mt-2 !leading-6 !text-slate-700">
                                          {
                                            reply.content
                                          }
                                        </Paragraph>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : null}

                            {replyingTo ===
                            comment.id ? (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                                <TextArea
                                  value={
                                    replyContent
                                  }
                                  rows={2}
                                  maxLength={500}
                                  placeholder={`Trả lời ${comment.author}...`}
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
                      </div>
                    ),
                  )}
                </div>
              </Card>
            </div>

            <aside
              className="flex flex-col xl:sticky xl:top-6 xl:self-start"
              style={{
                gap: 28,
              }}
            >
              <Card className="!rounded-[24px] !border-slate-200">
                <Title
                  level={4}
                  className="!mb-4 !text-slate-950"
                >
                  Bài viết liên quan
                </Title>

                <div className="space-y-3">
                  {relatedPosts.map(
                    (item) => (
                      <Link
                        key={item.id}
                        href={`/forum/${item.id}`}
                        className="group block rounded-2xl border border-slate-100 p-4 transition hover:border-pink-200 hover:bg-pink-50"
                      >
                        <Tag
                          color="pink"
                          className="!mb-2"
                        >
                          {
                            item.categoryLabel
                          }
                        </Tag>

                        <p className="mb-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-800 transition group-hover:text-pink-600">
                          {item.title}
                        </p>

                        <p className="mb-0 flex items-center gap-1 text-xs text-slate-400">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {
                            item.comments
                          }{" "}
                          bình luận
                        </p>
                      </Link>
                    ),
                  )}
                </div>
              </Card>

              <Card className="!rounded-[24px] !border-pink-100 !bg-gradient-to-br !from-pink-50 !to-white">
                <Title
                  level={5}
                  className="!mb-2 !text-slate-950"
                >
                  Lưu ý sức khỏe
                </Title>

                <Paragraph className="!mb-0 !text-sm !leading-6 !text-slate-600">
                  Nội dung trong Forum chỉ mang tính tham khảo và không thay thế chẩn đoán hoặc tư vấn trực tiếp từ bác sĩ.
                </Paragraph>
              </Card>
            </aside>
          </div>
        </main>
      </div>

      <SiteFooter />
    </>
  );
}
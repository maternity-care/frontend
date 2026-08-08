"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";
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
  Pagination,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Baby,
  CircleHelp,
  Clock3,
  HeartPulse,
  Lock,
  MessageSquarePlus,
  MessageSquareText,
  Pin,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import {
  useAuthStore,
} from "@/features/auth/auth.store";
import {
  RichTextEditor,
} from "@/app/(user)/forum/RichTextEditor";
import {
  SiteFooter,
} from "@/fe/components/layout/SiteFooter";
import {
  createForumPost,
  getForumCategories,
  getForumPosts,
  getForumTopics,
} from "@/features/forum/forum.api";
import type {
  ForumCategory,
  ForumCategoryCode,
  ForumPost,
  ForumTopic,
} from "@/features/forum/forum.types";

const {
  Text,
  Title,
} = Typography;

type CategoryFilter =
  | "all"
  | ForumCategoryCode;

type FeedMode =
  | "latest"
  | "questions"
  | "unanswered";

type CreatePostValues = {
  topicId: string;
  title: string;
  content: string;
  coverImageUrl?: string;
};

const PAGE_SIZE = 10;

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Không thể tải dữ liệu diễn đàn.";
}

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "vi-VN",
  ).format(value);
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

function getCategoryIcon(
  category: CategoryFilter,
) {
  switch (category) {
    case "pregnancy":
      return Baby;
    case "nutrition":
      return HeartPulse;
    case "postpartum":
      return UsersRound;
    case "ask_doctor":
      return Stethoscope;
    case "booking_experience":
      return Sparkles;
    default:
      return MessageSquareText;
  }
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card
      size="small"
      className="!rounded-2xl !border-slate-200"
      title={
        <span className="text-sm font-semibold text-slate-900">
          {title}
        </span>
      }
    >
      {children}
    </Card>
  );
}

export default function ForumPage() {
  const {
    message: messageApi,
  } = App.useApp();
  const currentUser =
    useAuthStore(
      (state) => state.user,
    );
  const isLoggedIn =
    Boolean(currentUser);
  const [form] =
    Form.useForm<CreatePostValues>();

  const [categories, setCategories] =
    useState<ForumCategory[]>([]);
  const [topics, setTopics] =
    useState<ForumTopic[]>([]);
  const [posts, setPosts] =
    useState<ForumPost[]>([]);
  const [search, setSearch] =
    useState("");
  const [category, setCategory] =
    useState<CategoryFilter>(
      "all",
    );
  const [topicId, setTopicId] =
    useState<string>();
  const [feedMode, setFeedMode] =
    useState<FeedMode>("latest");
  const [page, setPage] =
    useState(1);
  const [total, setTotal] =
    useState(0);
  const [
    categoryCounts,
    setCategoryCounts,
  ] = useState<
    Map<CategoryFilter, number>
  >(
    () =>
      new Map<
        CategoryFilter,
        number
      >(),
  );

  const [loading, setLoading] =
    useState(true);
  const [
    referenceLoading,
    setReferenceLoading,
  ] = useState(true);
  const [
    submitting,
    setSubmitting,
  ] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  const categoryByCode =
    useMemo(
      () =>
        new Map(
          categories.map(
            (item) => [
              item.code,
              item,
            ],
          ),
        ),
      [categories],
    );

  const loadReferences =
    useCallback(async () => {
      setReferenceLoading(true);

      try {
        const [
          nextCategories,
          nextTopics,
        ] = await Promise.all([
          getForumCategories(),
          getForumTopics(),
        ]);

        const activeCategories =
          nextCategories.filter(
            (item) =>
              item.status ===
              "active",
          );
        const activeTopics =
          nextTopics.filter(
            (item) =>
              item.status ===
              "active",
          );

        setCategories(
          activeCategories,
        );
        setTopics(
          activeTopics,
        );

        const countResults =
          await Promise.all([
            getForumPosts({
              page: 1,
              limit: 1,
              status:
                "published",
            }),
            ...activeCategories.map(
              (item) =>
                getForumPosts({
                  page: 1,
                  limit: 1,
                  category:
                    item.code,
                  status:
                    "published",
                }),
            ),
          ]);

        const nextCounts =
          new Map<
            CategoryFilter,
            number
          >();

        nextCounts.set(
          "all",
          countResults[0]
            ?.total ?? 0,
        );

        activeCategories.forEach(
          (item, index) => {
            nextCounts.set(
              item.code,
              countResults[
                index + 1
              ]?.total ?? 0,
            );
          },
        );

        setCategoryCounts(
          nextCounts,
        );
      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
      } finally {
        setReferenceLoading(false);
      }
    }, []);

  const loadPosts =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getForumPosts({
            page,
            limit: PAGE_SIZE,
            category:
              feedMode ===
              "questions"
                ? "ask_doctor"
                : category ===
                    "all"
                  ? undefined
                  : category,
            topicId,
            search,
            status:
              "published",
          });

        const items =
          feedMode ===
          "unanswered"
            ? result.items.filter(
                (post) =>
                  post.commentCount ===
                  0,
              )
            : result.items;

        setPosts(items);
        setTotal(
          feedMode ===
          "unanswered"
            ? items.length
            : result.total,
        );

      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
      } finally {
        setLoading(false);
      }
    }, [
      category,
      feedMode,
      page,
      search,
      topicId,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadReferences();
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [loadReferences]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadPosts();
      }, 300);

    return () =>
      window.clearTimeout(timer);
  }, [loadPosts]);

  const popularTopics =
    useMemo(
      () =>
        topics.slice(0, 8),
      [topics],
    );

  function openCreatePost() {
    if (!isLoggedIn) {
      messageApi.warning(
        "Vui lòng đăng nhập để đăng bài viết.",
      );
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      topicId:
        topicId ??
        topics[0]?.id,
      title: "",
      content: "",
      coverImageUrl: "",
    });
    setCreateModalOpen(true);
  }

  async function submitPost(
    values: CreatePostValues,
  ) {
    if (!isLoggedIn) {
      messageApi.warning(
        "Vui lòng đăng nhập để đăng bài viết.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const response =
        await createForumPost(
          values,
        );

      messageApi.success(
        response.message ||
          "Bài viết đã được gửi và đang chờ kiểm duyệt.",
      );

      setCreateModalOpen(false);
      form.resetFields();
      setPage(1);
      await loadPosts();
    } catch (submitError) {
      messageApi.error(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-500 text-white">
                  <MessageSquareText className="h-6 w-6" />
                </span>

                <div>
                  <Title
                    level={2}
                    className="!mb-1 !text-slate-950"
                  >
                    Forum Maternity Care
                  </Title>

                  <Text type="secondary">
                    Nơi thai phụ trao đổi kinh nghiệm, đặt câu hỏi và nhận phản hồi từ cộng đồng.
                  </Text>
                </div>
              </div>

              <Button
                type="primary"
                title={
                  isLoggedIn
                    ? "Đăng bài viết"
                    : "Đăng nhập để đăng bài viết"
                }
                icon={
                  <MessageSquarePlus className="h-4 w-4" />
                }
                className="!bg-pink-500"
                disabled={
                  topics.length === 0
                }
                onClick={
                  openCreatePost
                }
              >
                Đăng bài viết
              </Button>
            </div>
          </section>

          {error ? (
            <Alert
              type="error"
              showIcon
              closable
              className="mt-4 !rounded-2xl"
              title={error}
              onClose={() =>
                setError(null)
              }
            />
          ) : null}

          <div className="mt-5 grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
            <aside className="flex flex-col gap-5 xl:sticky xl:top-5 xl:self-start">
              <SidebarSection title="Chuyên mục">
                <div className="space-y-1">
                  {[
                    {
                      code:
                        "all" as const,
                      name:
                        "Tất cả chủ đề",
                    },
                    ...categories,
                  ].map((item) => {
                    const value =
                      "code" in item
                        ? item.code
                        : "all";
                    const Icon =
                      getCategoryIcon(
                        value,
                      );
                    const active =
                      category === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setCategory(
                            value,
                          );
                          setFeedMode(
                            "latest",
                          );
                          setPage(1);
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                          active
                            ? "bg-pink-50 font-semibold text-pink-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                        ].join(" ")}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {item.name}
                          </span>
                        </span>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {categoryCounts.get(
                            value,
                          ) ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SidebarSection>

              <SidebarSection title="Chủ đề">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={topicId}
                  loading={
                    referenceLoading
                  }
                  className="w-full"
                  placeholder="Tất cả chủ đề"
                  options={topics.map(
                    (topic) => ({
                      value: topic.id,
                      label: topic.title,
                    }),
                  )}
                  onChange={(value) => {
                    setTopicId(value);
                    setPage(1);
                  }}
                />
              </SidebarSection>
            </aside>

            <section className="min-w-0">
              <Card
                className="!rounded-2xl !border-slate-200"
                styles={{
                  body: {
                    padding: 0,
                  },
                }}
              >
                <div className="border-b border-slate-200 p-4">
                  <div className="flex flex-col gap-3">
                    <Segmented<FeedMode>
                      block
                      value={feedMode}
                      options={[
                        {
                          value: "latest",
                          label:
                            "Mới cập nhật",
                        },
                        {
                          value:
                            "questions",
                          label:
                            "Hỏi bác sĩ",
                        },
                        {
                          value:
                            "unanswered",
                          label:
                            "Chưa có trả lời",
                        },
                      ]}
                      onChange={(value) => {
                        setFeedMode(value);
                        setPage(1);
                      }}
                    />

                    <Input
                      allowClear
                      value={search}
                      prefix={
                        <Search className="h-4 w-4 text-slate-400" />
                      }
                      placeholder="Tìm tiêu đề hoặc nội dung bài viết..."
                      onChange={(event) => {
                        setSearch(
                          event.target.value,
                        );
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_88px_88px_170px] border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Bài viết</span>
                  <span className="text-center">
                    Trả lời
                  </span>
                  <span className="text-center">
                    Lượt xem
                  </span>
                  <span>
                    Cập nhật
                  </span>
                </div>

                {loading ? (
                  <div className="flex min-h-[420px] items-center justify-center">
                    <Text type="secondary">
                      Đang tải bài viết...
                    </Text>
                  </div>
                ) : posts.length ===
                  0 ? (
                  <div className="flex min-h-[420px] items-center justify-center p-6">
                    <Empty description="Không có bài viết phù hợp.">
                      <Button
                        type="primary"
                        className="!bg-pink-500"
                        disabled={
                          topics.length ===
                          0
                        }
                        onClick={
                          openCreatePost
                        }
                      >
                        Đăng bài viết mới
                      </Button>
                    </Empty>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {posts.map(
                      (post) => (
                        <article
                          key={post.id}
                          className={[
                            "grid grid-cols-[minmax(0,1fr)_88px_88px_170px] items-center px-4 py-4 transition hover:bg-slate-50",
                            post.isPinned
                              ? "bg-amber-50/40"
                              : "bg-white",
                          ].join(" ")}
                        >
                          <div className="flex min-w-0 items-start gap-3 pr-4">
                            <Avatar
                              size={42}
                              className={
                                post.author
                                  .role ===
                                "doctor"
                                  ? "!bg-blue-600"
                                  : "!bg-pink-500"
                              }
                            >
                              {post.author
                                .role ===
                              "doctor" ? (
                                <Stethoscope className="h-4 w-4" />
                              ) : (
                                getInitials(
                                  post.author
                                    .name,
                                )
                              )}
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                {post.isPinned ? (
                                  <Pin className="h-3.5 w-3.5 text-amber-600" />
                                ) : null}

                                {post.category ===
                                "ask_doctor" ? (
                                  <CircleHelp className="h-3.5 w-3.5 text-blue-500" />
                                ) : null}

                                {post.isLocked ? (
                                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                                ) : null}
                              </div>

                              <Link
                                href={`/forum/${post.id}`}
                                className="block"
                              >
                                <h3 className="mb-1 line-clamp-2 text-[15px] font-semibold leading-6 text-slate-900 transition hover:text-pink-600">
                                  {post.title}
                                </h3>
                              </Link>

                              <p className="mb-2 line-clamp-1 text-sm text-slate-500">
                                {post.excerpt ||
                                  post.content}
                              </p>

                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                                <Tag
                                  color="pink"
                                  className="!m-0"
                                >
                                  {post.categoryName ||
                                    categoryByCode.get(
                                      post.category,
                                    )?.name ||
                                    post.category}
                                </Tag>

                                <span>
                                  bởi{" "}
                                  <strong className="font-medium text-slate-600">
                                    {
                                      post.author
                                        .name
                                    }
                                  </strong>
                                </span>

                                {post.author
                                  .verified ? (
                                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="mb-0 text-sm font-semibold text-slate-900">
                              {
                                post.commentCount
                              }
                            </p>
                            <p className="mb-0 text-[11px] text-slate-400">
                              phản hồi
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="mb-0 text-sm font-semibold text-slate-900">
                              {formatNumber(
                                post.views,
                              )}
                            </p>
                            <p className="mb-0 text-[11px] text-slate-400">
                              lượt xem
                            </p>
                          </div>

                          <div className="min-w-0 pl-3 text-xs">
                            <p className="mb-1 truncate font-medium text-slate-700">
                              {
                                post.author.name
                              }
                            </p>
                            <p className="mb-0 flex items-center gap-1 text-slate-400">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDateTime(
                                post.publishedAt ||
                                  post.createdAt,
                              )}
                            </p>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}

                {total > PAGE_SIZE ? (
                  <div className="flex justify-center border-t border-slate-200 p-4">
                    <Pagination
                      current={page}
                      pageSize={
                        PAGE_SIZE
                      }
                      total={total}
                      showSizeChanger={
                        false
                      }
                      onChange={setPage}
                    />
                  </div>
                ) : null}
              </Card>
            </section>

            <aside className="flex flex-col gap-5 xl:sticky xl:top-5 xl:self-start">
              <SidebarSection title="Quy tắc cộng đồng">
                <div className="space-y-3 text-sm leading-6 text-slate-600">
                  <p className="mb-0">
                    1. Chia sẻ đúng chủ đề và tôn trọng thành viên khác.
                  </p>
                  <p className="mb-0">
                    2. Không quảng cáo thuốc, dịch vụ hoặc đăng nội dung spam.
                  </p>
                  <p className="mb-0">
                    3. Không công khai hồ sơ, số điện thoại hoặc thông tin nhạy cảm.
                  </p>
                </div>
              </SidebarSection>

              <SidebarSection title="Chủ đề nổi bật">
                <div className="space-y-2">
                  {popularTopics.map(
                    (topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          setTopicId(
                            topic.id,
                          );
                          setPage(1);
                        }}
                        className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-pink-300 hover:text-pink-600"
                      >
                        <span className="line-clamp-2 font-medium">
                          {topic.title}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </SidebarSection>

              <SidebarSection title="Hỏi bác sĩ">
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Stethoscope className="h-5 w-5" />
                    <Text
                      strong
                      className="!text-blue-800"
                    >
                      Phản hồi xác thực
                    </Text>
                  </div>

                  <p className="mb-3 mt-2 text-sm leading-6 text-blue-700">
                    Câu trả lời của bác sĩ được đánh dấu riêng bằng huy hiệu xác thực.
                  </p>

                  <Button
                    block
                    onClick={() => {
                      setCategory(
                        "ask_doctor",
                      );
                      setFeedMode(
                        "questions",
                      );
                      setPage(1);
                    }}
                  >
                    Xem câu hỏi
                  </Button>
                </div>
              </SidebarSection>
            </aside>
          </div>
        </main>
      </div>

      <Modal
        open={createModalOpen}
        centered
        width={820}
        title="Đăng bài viết mới"
        okText="Gửi để duyệt"
        cancelText="Hủy"
        confirmLoading={submitting}
        onCancel={() => {
          if (submitting) return;

          setCreateModalOpen(
            false,
          );
          form.resetFields();
        }}
        onOk={() =>
          form.submit()
        }
        mask={{
          closable:
            !submitting,
        }}
        forceRender
      >
        <Form<CreatePostValues>
          form={form}
          layout="vertical"
          onFinish={(values) =>
            void submitPost(values)
          }
        >
          <Alert
            type="info"
            showIcon
            className="mb-4 !rounded-xl"
            title="Bài viết mới sẽ được gửi kiểm duyệt."
            
          />

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
              loading={
                referenceLoading
              }
              placeholder="Chọn chủ đề"
              options={topics.map(
                (topic) => ({
                  value: topic.id,
                  label: topic.title,
                }),
              )}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề bài viết"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Vui lòng nhập tiêu đề.",
              },
              {
                max: 180,
                message:
                  "Tiêu đề tối đa 180 ký tự.",
              },
            ]}
          >
            <Input
              showCount
              maxLength={180}
              placeholder="Mô tả ngắn gọn vấn đề muốn trao đổi"
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
                      "Vui lòng nhập nội dung.",
                    );
                  }

                  if (
                    plainText.length <
                      20 &&
                    !hasImage
                  ) {
                    throw new Error(
                      "Nội dung cần ít nhất 20 ký tự.",
                    );
                  }

                  if (
                    html.length >
                    50000
                  ) {
                    throw new Error(
                      "Nội dung bài viết quá dài.",
                    );
                  }
                },
              },
            ]}
          >
            <RichTextEditor
              placeholder="Nhập nội dung bài viết..."
            />
          </Form.Item>

          <Form.Item
            name="coverImageUrl"
            label="Ảnh bìa"
            rules={[
              {
                type: "url",
                message:
                  "URL ảnh bìa không hợp lệ.",
              },
            ]}
          >
            <Input placeholder="https://cdn.example.com/forum-cover.jpg" />
          </Form.Item>
        </Form>
      </Modal>

      <SiteFooter />
    </>
  );
}

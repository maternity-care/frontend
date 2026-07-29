"use client";

import Link from "next/link";
import {
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
  BookOpenText,
  CircleHelp,
  Clock3,
  Eye,
  HeartPulse,
  Lock,
  MessageCircle,
  MessageSquarePlus,
  MessageSquareText,
  Pin,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  SiteFooter,
} from "@/fe/components/layout/SiteFooter";
import {
  CURRENT_FORUM_USER,
  forumCategories,
  forumPosts,
  type ForumCategory,
  type ForumPost,
  type ForumPostStatus,
  type ForumPostType,
} from "@/features/forum/forum.mock";

const {
  Paragraph,
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type CategoryFilter =
  | "all"
  | ForumCategory;

type FeedMode =
  | "latest"
  | "questions"
  | "unanswered"
  | "mine";

type SortMode =
  | "latest"
  | "popular"
  | "commented";

type CreatePostValues = {
  title: string;
  topic: string;
  category: ForumCategory;
  postType: ForumPostType;
  excerpt: string;
  content: string;
  tags?: string[];
  sensitiveMedicalContent: boolean;
};

const PAGE_SIZE = 8;

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "vi-VN",
  ).format(value);
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

function getCategoryLabel(
  category: ForumCategory,
) {
  return (
    forumCategories.find(
      (item) =>
        item.value === category,
    )?.label ?? category
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

function createPostFromValues(
  values: CreatePostValues,
): ForumPost {
  const now = new Date();
  const id =
    `user-post-${now.getTime()}`;

  return {
    id,
    title: values.title.trim(),
    topic: values.topic.trim(),
    excerpt: values.excerpt.trim(),
    category: values.category,
    categoryLabel:
      getCategoryLabel(
        values.category,
      ),
    postType: values.postType,
    author: CURRENT_FORUM_USER,
    createdAt: now.toISOString(),
    readTime: `${Math.max(
      1,
      Math.ceil(
        values.content
          .trim()
          .split(/\s+/)
          .filter(Boolean).length /
          180,
      ),
    )} phút đọc`,
    views: 0,
    commentCount: 0,
    status: "pending",
    featured: false,
    pinned: false,
    commentsLocked: false,
    sensitiveMedicalContent:
      values.sensitiveMedicalContent,
    tags: values.tags ?? [],
    content: [
      {
        type: "paragraph",
        text: values.content.trim(),
      },
    ],
    moderationLogs: [
      {
        id: `log-${id}`,
        action: "submit",
        actorId:
          CURRENT_FORUM_USER.id,
        actorName:
          CURRENT_FORUM_USER.name,
        actorRole:
          CURRENT_FORUM_USER.roleLabel,
        createdAt: "Vừa xong",
      },
    ],
    reportCount: 0,
  };
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

  const [form] =
    Form.useForm<CreatePostValues>();

  const [posts, setPosts] =
    useState<ForumPost[]>(
      forumPosts,
    );

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState<CategoryFilter>(
      "all",
    );

  const [feedMode, setFeedMode] =
    useState<FeedMode>("latest");

  const [sort, setSort] =
    useState<SortMode>("latest");

  const [page, setPage] =
    useState(1);

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  const categoryCounts = useMemo(() => {
    const published = posts.filter(
      (post) =>
        post.status === "published",
    );

    return new Map<
      CategoryFilter,
      number
    >([
      [
        "all",
        published.length,
      ],
      ...forumCategories
        .filter(
          (item) =>
            item.value !== "all",
        )
        .map((item) => [
          item.value,
          published.filter(
            (post) =>
              post.category ===
              item.value,
          ).length,
        ] as const),
    ]);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    const source =
      feedMode === "mine"
        ? posts.filter(
            (post) =>
              post.author.id ===
              CURRENT_FORUM_USER.id,
          )
        : posts.filter(
            (post) =>
              post.status ===
              "published",
          );

    const filtered = source.filter(
      (post) => {
        const matchesCategory =
          category === "all" ||
          post.category === category;

        const matchesMode =
          feedMode === "questions"
            ? post.postType ===
              "question"
            : feedMode ===
                "unanswered"
              ? post.commentCount ===
                  0
              : true;

        const matchesSearch =
          !keyword ||
          [
            post.title,
            post.topic,
            post.excerpt,
            post.author.name,
            post.categoryLabel,
            ...post.tags,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(keyword),
          );

        return (
          matchesCategory &&
          matchesMode &&
          matchesSearch
        );
      },
    );

    return filtered.sort(
      (left, right) => {
        if (sort === "popular") {
          return (
            right.views -
            left.views
          );
        }

        if (sort === "commented") {
          return (
            right.commentCount -
            left.commentCount
          );
        }

        if (
          Boolean(left.pinned) !==
          Boolean(right.pinned)
        ) {
          return left.pinned
            ? -1
            : 1;
        }

        return (
          new Date(
            right.createdAt,
          ).getTime() -
          new Date(
            left.createdAt,
          ).getTime()
        );
      },
    );
  }, [
    category,
    feedMode,
    posts,
    search,
    sort,
  ]);

  const visiblePosts = useMemo(() => {
    const start =
      (page - 1) * PAGE_SIZE;

    return filteredPosts.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [
    filteredPosts,
    page,
  ]);

  const popularTags = useMemo(() => {
    const counts = new Map<
      string,
      number
    >();

    posts
      .filter(
        (post) =>
          post.status ===
          "published",
      )
      .forEach((post) => {
        post.tags.forEach((tag) => {
          counts.set(
            tag,
            (counts.get(tag) ?? 0) +
              1,
          );
        });
      });

    return [...counts.entries()]
      .sort(
        (left, right) =>
          right[1] - left[1],
      )
      .slice(0, 8);
  }, [posts]);

  function openCreatePost() {
    form.resetFields();
    form.setFieldsValue({
      postType: "discussion",
      category: "pregnancy",
      sensitiveMedicalContent:
        true,
      tags: [],
    });
    setCreateModalOpen(true);
  }

  function submitPost(
    values: CreatePostValues,
  ) {
    const nextPost =
      createPostFromValues(
        values,
      );

    setPosts((current) => [
      nextPost,
      ...current,
    ]);

    setCreateModalOpen(false);
    form.resetFields();
    setFeedMode("mine");
    setPage(1);

    messageApi.success(
      "Chủ đề đã được gửi và đang chờ moderator duyệt.",
    );
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

              <Space wrap>
                <Button
                  icon={
                    <UserRound className="h-4 w-4" />
                  }
                  onClick={() => {
                    setFeedMode("mine");
                    setPage(1);
                  }}
                >
                  Bài của tôi
                </Button>

                <Button
                  type="primary"
                  icon={
                    <MessageSquarePlus className="h-4 w-4" />
                  }
                  className="!bg-pink-500"
                  onClick={
                    openCreatePost
                  }
                >
                  Đăng chủ đề
                </Button>
              </Space>
            </div>
          </section>

          <Alert
            type="warning"
            showIcon
            className="mt-4 !rounded-2xl !border-amber-200"
            title="Thông tin tham khảo, không thay thế tư vấn bác sĩ."
            description="Không tự ý dùng thuốc hoặc trì hoãn khám bệnh dựa trên nội dung trong Forum."
          />

          <div className="mt-5 grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
            <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
              <SidebarSection title="Chuyên mục">
                <div className="space-y-1">
                  {forumCategories.map(
                    (item) => {
                      const Icon =
                        getCategoryIcon(
                          item.value,
                        );

                      const active =
                        category ===
                        item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setCategory(
                              item.value,
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
                              {item.label}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            {categoryCounts.get(
                              item.value,
                            ) ?? 0}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </SidebarSection>

              <SidebarSection title="Tài khoản của bạn">
                <div className="flex items-center gap-3">
                  <Avatar className="!bg-pink-500 !font-semibold">
                    {getInitials(
                      CURRENT_FORUM_USER.name,
                    )}
                  </Avatar>

                  <div className="min-w-0">
                    <Text
                      strong
                      className="block truncate"
                    >
                      {
                        CURRENT_FORUM_USER.name
                      }
                    </Text>

                    <Text
                      type="secondary"
                      className="block truncate text-xs"
                    >
                      {
                        CURRENT_FORUM_USER.roleLabel
                      }
                    </Text>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="mb-0 text-lg font-bold text-slate-900">
                      {
                        posts.filter(
                          (post) =>
                            post.author.id ===
                            CURRENT_FORUM_USER.id,
                        ).length
                      }
                    </p>

                    <p className="mb-0 text-xs text-slate-500">
                      Chủ đề
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="mb-0 text-lg font-bold text-slate-900">
                      {
                        posts.filter(
                          (post) =>
                            post.author.id ===
                              CURRENT_FORUM_USER.id &&
                            post.status ===
                              "pending",
                        ).length
                      }
                    </p>

                    <p className="mb-0 text-xs text-slate-500">
                      Chờ duyệt
                    </p>
                  </div>
                </div>
              </SidebarSection>
            </aside>

            <section
              id="forum-posts"
              className="min-w-0"
            >
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
                          label: "Mới cập nhật",
                        },
                        {
                          value: "questions",
                          label: "Hỏi bác sĩ",
                        },
                        {
                          value: "unanswered",
                          label: "Chưa có trả lời",
                        },
                        {
                          value: "mine",
                          label: "Bài của tôi",
                        },
                      ]}
                      onChange={(value) => {
                        setFeedMode(value);
                        setPage(1);
                      }}
                    />

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
                      <Input
                        allowClear
                        value={search}
                        prefix={
                          <Search className="h-4 w-4 text-slate-400" />
                        }
                        placeholder="Tìm chủ đề, nội dung hoặc thành viên..."
                        onChange={(
                          event,
                        ) => {
                          setSearch(
                            event.target
                              .value,
                          );
                          setPage(1);
                        }}
                      />

                      <Select
                        value={sort}
                        options={[
                          {
                            value: "latest",
                            label: "Mới nhất",
                          },
                          {
                            value: "popular",
                            label:
                              "Nhiều lượt xem",
                          },
                          {
                            value:
                              "commented",
                            label:
                              "Nhiều trả lời",
                          },
                        ]}
                        onChange={(value) => {
                          setSort(value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_88px_88px_170px] border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Chủ đề</span>
                  <span className="text-center">
                    Trả lời
                  </span>
                  <span className="text-center">
                    Lượt xem
                  </span>
                  <span>
                    Hoạt động gần nhất
                  </span>
                </div>

                {visiblePosts.length ===
                0 ? (
                  <div className="flex min-h-[360px] items-center justify-center p-6">
                    <Empty description="Không có chủ đề phù hợp.">
                      <Button
                        type="primary"
                        className="!bg-pink-500"
                        onClick={
                          openCreatePost
                        }
                      >
                        Đăng chủ đề mới
                      </Button>
                    </Empty>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {visiblePosts.map(
                      (post) => (
                        <article
                          key={post.id}
                          className={[
                            "grid grid-cols-[minmax(0,1fr)_88px_88px_170px] items-center gap-0 px-4 py-4 transition hover:bg-slate-50",
                            post.pinned
                              ? "bg-amber-50/40"
                              : "bg-white",
                          ].join(" ")}
                        >
                          <div className="flex min-w-0 items-start gap-3 pr-4">
                            <Avatar
                              size={42}
                              className={
                                post.author
                                  .type ===
                                "doctor"
                                  ? "!bg-blue-600"
                                  : "!bg-pink-500"
                              }
                            >
                              {post.author
                                .type ===
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
                                {post.pinned ? (
                                  <Pin className="h-3.5 w-3.5 text-amber-600" />
                                ) : null}

                                {post.postType ===
                                "question" ? (
                                  <CircleHelp className="h-3.5 w-3.5 text-blue-500" />
                                ) : null}

                                {post.commentsLocked ? (
                                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                                ) : null}

                                {feedMode ===
                                "mine" ? (
                                  getStatusTag(
                                    post.status,
                                  )
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
                                {post.excerpt}
                              </p>

                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                                <Tag
                                  color="pink"
                                  className="!m-0"
                                >
                                  {
                                    post.categoryLabel
                                  }
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

                                <span>
                                  ·{" "}
                                  {post.publishedAt ??
                                    "Chưa xuất bản"}
                                </span>
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
                              {post.publishedAt ??
                                "Chờ duyệt"}
                            </p>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}

                {filteredPosts.length >
                PAGE_SIZE ? (
                  <div className="flex justify-center border-t border-slate-200 p-4">
                    <Pagination
                      current={page}
                      pageSize={
                        PAGE_SIZE
                      }
                      total={
                        filteredPosts.length
                      }
                      showSizeChanger={
                        false
                      }
                      onChange={setPage}
                    />
                  </div>
                ) : null}
              </Card>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
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

              <SidebarSection title="Thẻ được quan tâm">
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(
                    ([tag, count]) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearch(tag);
                          setPage(1);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-pink-300 hover:text-pink-600"
                      >
                        #{tag} · {count}
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

                  <Paragraph className="!mb-3 !mt-2 !text-sm !leading-6 !text-blue-700">
                    Câu trả lời của bác sĩ được đánh dấu riêng bằng huy hiệu xác thực.
                  </Paragraph>

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
        forceRender
        destroyOnHidden={false}
        title="Đăng chủ đề mới"
        okText="Gửi để duyệt"
        cancelText="Hủy"
        onCancel={() => {
          setCreateModalOpen(
            false,
          );
          form.resetFields();
        }}
        onOk={() =>
          form.submit()
        }
        mask={{
          closable: true,
        }}
        styles={{
          body: {
            maxHeight: "72vh",
            overflowY: "auto",
            paddingRight: 8,
          },
        }}
      >
        <Form<CreatePostValues>
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={submitPost}
        >
          <Alert
            type="info"
            showIcon
            className="mb-4 !rounded-xl"
            title="Chủ đề mới sẽ ở trạng thái chờ duyệt."
            description="Moderator sẽ kiểm tra đúng chủ đề, spam, quảng cáo và nội dung y tế trước khi cho hiển thị."
          />

          <Form.Item
            name="title"
            label="Tiêu đề chủ đề"
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
              placeholder="Mô tả ngắn gọn vấn đề hoặc nội dung muốn trao đổi"
            />
          </Form.Item>

          <Form.Item
            name="topic"
            label="Chủ đề cụ thể"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Vui lòng nhập chủ đề.",
              },
            ]}
          >
            <Input placeholder="Ví dụ: Đau lưng ở tuần 20" />
          </Form.Item>

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="category"
              label="Chuyên mục"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn chuyên mục.",
                },
              ]}
            >
              <Select
                options={forumCategories
                  .filter(
                    (item) =>
                      item.value !==
                      "all",
                  )
                  .map((item) => ({
                    value:
                      item.value,
                    label:
                      item.label,
                  }))}
              />
            </Form.Item>

            <Form.Item
              name="postType"
              label="Loại chủ đề"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn loại chủ đề.",
                },
              ]}
            >
              <Select
                options={[
                  {
                    value:
                      "discussion",
                    label: "Thảo luận",
                  },
                  {
                    value:
                      "question",
                    label: "Câu hỏi",
                  },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="excerpt"
            label="Tóm tắt"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Vui lòng nhập tóm tắt.",
              },
              {
                max: 300,
                message:
                  "Tóm tắt tối đa 300 ký tự.",
              },
            ]}
          >
            <TextArea
              rows={3}
              showCount
              maxLength={300}
              placeholder="Tóm tắt nội dung để thành viên dễ hiểu trước khi mở chủ đề"
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
                min: 20,
                message:
                  "Nội dung cần ít nhất 20 ký tự.",
              },
            ]}
          >
            <TextArea
              rows={8}
              showCount
              maxLength={5000}
              placeholder="Trình bày chi tiết vấn đề, câu hỏi hoặc kinh nghiệm của bạn..."
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Thẻ nội dung"
          >
            <Select
              mode="tags"
              tokenSeparators={[","]}
              placeholder="Nhập thẻ và nhấn Enter"
            />
          </Form.Item>

          <Form.Item
            name="sensitiveMedicalContent"
            label="Nội dung y tế"
          >
            <Segmented
              block
              options={[
                {
                  value: true,
                  label:
                    "Có nội dung y tế",
                },
                {
                  value: false,
                  label:
                    "Không có nội dung y tế",
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <SiteFooter />
    </>
  );
}
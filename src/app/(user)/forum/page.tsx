"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  Pagination,
  Select,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRight,
  Baby,
  CalendarDays,
  Eye,
  HeartPulse,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { SiteFooter } from "@/fe/components/layout/SiteFooter";
import {
  forumCategories,
  forumPosts,
} from "@/features/forum/forum.mock";

const {
  Paragraph,
  Text,
  Title,
} = Typography;

type CategoryFilter =
  | "all"
  | "pregnancy"
  | "nutrition"
  | "experience"
  | "newborn"
  | "doctor";

type SortMode =
  | "latest"
  | "popular"
  | "commented";

const PAGE_SIZE = 6;

function getCategoryIcon(
  category: CategoryFilter,
) {
  switch (category) {
    case "pregnancy":
      return Baby;
    case "nutrition":
      return HeartPulse;
    case "doctor":
      return Stethoscope;
    case "experience":
      return Sparkles;
    default:
      return UsersRound;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    "vi-VN",
  ).format(value);
}

export default function ForumPage() {
  const [search, setSearch] =
    useState("");
  const [category, setCategory] =
    useState<CategoryFilter>("all");
  const [sort, setSort] =
    useState<SortMode>("latest");
  const [page, setPage] =
    useState(1);

  const featuredPost =
    forumPosts.find(
      (post) => post.featured,
    ) ?? forumPosts[0];

  const filteredPosts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    const next = forumPosts.filter(
      (post) => {
        const matchesCategory =
          category === "all" ||
          post.category === category;

        const matchesSearch =
          !keyword ||
          [
            post.title,
            post.excerpt,
            post.author,
            post.categoryLabel,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(keyword),
          );

        return (
          matchesCategory &&
          matchesSearch
        );
      },
    );

    return [...next].sort(
      (left, right) => {
        if (sort === "popular") {
          return (
            right.views - left.views
          );
        }

        if (sort === "commented") {
          return (
            right.comments -
            left.comments
          );
        }

        return right.id.localeCompare(
          left.id,
        );
      },
    );
  }, [category, search, sort]);

  const visiblePosts = useMemo(() => {
    const start =
      (page - 1) * PAGE_SIZE;

    return filteredPosts.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [filteredPosts, page]);

  function handleCategoryChange(
    value: CategoryFilter,
  ) {
    setCategory(value);
    setPage(1);
  }

  return (
    <>
      <div className="min-h-screen bg-[#fff8fb]">
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[32px] border border-pink-100 bg-[radial-gradient(circle_at_top_left,_#fff_0%,_#fff1f6_45%,_#ffe7f0_100%)] px-6 py-10 shadow-[0_20px_70px_rgba(236,72,153,0.09)] md:px-10 lg:px-12 lg:py-14">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-pink-300/25 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-4 py-2 text-sm font-semibold text-pink-700 shadow-sm backdrop-blur">
                  <UsersRound className="h-4 w-4" />
                  Cộng đồng Maternity Care
                </div>

                <Title
                  level={1}
                  className="!mb-4 !max-w-4xl !text-4xl !font-bold !leading-[1.15] !text-slate-950 md:!text-5xl"
                >
                  Kiến thức đúng, chia sẻ thật, đồng hành an tâm
                </Title>

                <Paragraph className="!mb-0 !max-w-3xl !text-base !leading-7 !text-slate-600 md:!text-lg">
                  Khám phá nội dung hữu ích về thai kỳ, dinh dưỡng, chăm sóc sau sinh và các tư vấn chuyên môn được chọn lọc cho mẹ và bé.
                </Paragraph>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a href="#forum-posts">
                    <Button
                      type="primary"
                      size="large"
                      className="!h-12 !rounded-full !bg-pink-500 !px-7 !font-semibold !shadow-lg !shadow-pink-200"
                    >
                      Khám phá bài viết
                      <ArrowRight className="ml-2 inline h-4 w-4" />
                    </Button>
                  </a>

                  <Tag
                    icon={
                      <ShieldCheck className="h-4 w-4" />
                    }
                    className="!m-0 !inline-flex !h-12 !items-center !rounded-full !border-pink-200 !bg-white !px-5 !text-sm !font-medium !text-slate-600"
                  >
                    Nội dung được kiểm duyệt
                  </Tag>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Bài viết",
                    value: "860+",
                  },
                  {
                    label: "Thành viên",
                    value: "2.4K",
                  },
                  {
                    label: "Chủ đề",
                    value: "12",
                  },
                  {
                    label: "Bình luận",
                    value: "5.1K",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur"
                  >
                    <p className="mb-1 text-2xl font-bold text-pink-600">
                      {item.value}
                    </p>
                    <p className="mb-0 text-sm text-slate-500">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {forumCategories.map(
                (item) => {
                  const Icon =
                    getCategoryIcon(
                      item.value,
                    );
                  const active =
                    category === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        handleCategoryChange(
                          item.value,
                        )
                      }
                      className={[
                        "group flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition",
                        active
                          ? "border-pink-400 bg-pink-500 text-white shadow-lg shadow-pink-200"
                          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          active
                            ? "bg-white/20"
                            : "bg-pink-50 text-pink-600",
                        ].join(" ")}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 text-sm font-semibold">
                        {item.label}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </section>

          {featuredPost ? (
            <section className="mt-8">
              <Card
                className="overflow-hidden !rounded-[30px] !border-pink-100 !shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
                styles={{
                  body: {
                    padding: 0,
                  },
                }}
              >
                <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="relative flex min-h-[310px] items-end overflow-hidden bg-gradient-to-br from-pink-500 via-rose-400 to-orange-300 p-8 text-white">
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
                    <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

                    <div className="relative">
                      <Tag className="!mb-4 !border-white/30 !bg-white/20 !text-white">
                        Bài viết nổi bật
                      </Tag>

                      <Title
                        level={2}
                        className="!mb-3 !text-white"
                      >
                        {featuredPost.title}
                      </Title>

                      <Paragraph className="!mb-0 !text-base !leading-7 !text-pink-50">
                        {featuredPost.excerpt}
                      </Paragraph>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-7 md:p-9">
                    <div>
                      <div className="mb-5 flex flex-wrap items-center gap-2">
                        <Tag color="magenta">
                          {
                            featuredPost.categoryLabel
                          }
                        </Tag>

                        {featuredPost.verified ? (
                          <Tag
                            color="blue"
                            icon={
                              <ShieldCheck className="h-3.5 w-3.5" />
                            }
                          >
                            Xác thực
                          </Tag>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <Text
                          strong
                          className="block text-base"
                        >
                          {
                            featuredPost.author
                          }
                        </Text>

                        <Text
                          type="secondary"
                          className="text-sm"
                        >
                          {
                            featuredPost.authorRole
                          }
                        </Text>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-pink-50 p-4 text-center">
                          <Eye className="mx-auto h-4 w-4 text-pink-500" />
                          <Text
                            strong
                            className="mt-1 block"
                          >
                            {formatNumber(
                              featuredPost.views,
                            )}
                          </Text>
                        </div>

                        <div className="rounded-2xl bg-pink-50 p-4 text-center">
                          <MessageCircle className="mx-auto h-4 w-4 text-pink-500" />
                          <Text
                            strong
                            className="mt-1 block"
                          >
                            {
                              featuredPost.comments
                            }
                          </Text>
                        </div>

                        <div className="rounded-2xl bg-pink-50 p-4 text-center">
                          <CalendarDays className="mx-auto h-4 w-4 text-pink-500" />
                          <Text
                            strong
                            className="mt-1 block text-xs"
                          >
                            {
                              featuredPost.publishedAt
                            }
                          </Text>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/forum/${featuredPost.id}`}
                      className="mt-7"
                    >
                      <Button
                        type="primary"
                        size="large"
                        block
                        className="!h-12 !rounded-xl !bg-pink-500 !font-semibold"
                      >
                        Đọc bài viết
                        <ArrowRight className="ml-2 inline h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </section>
          ) : null}

          <section
            id="forum-posts"
            className="mt-8"
          >
            <Card className="!rounded-[28px] !border-slate-200">
              <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                  <Title
                    level={2}
                    className="!mb-1 !text-slate-950"
                  >
                    Bài viết mới nhất
                  </Title>

                  <Text type="secondary">
                    Nội dung được cập nhật thường xuyên từ cộng đồng và đội ngũ chuyên môn.
                  </Text>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(260px,1fr)_190px]">
                  <Input
                    allowClear
                    size="large"
                    value={search}
                    prefix={
                      <Search className="h-4 w-4 text-slate-400" />
                    }
                    placeholder="Tìm bài viết hoặc tác giả"
                    onChange={(event) => {
                      setSearch(
                        event.target.value,
                      );
                      setPage(1);
                    }}
                  />

                  <Select
                    size="large"
                    value={sort}
                    options={[
                      {
                        value: "latest",
                        label: "Mới nhất",
                      },
                      {
                        value: "popular",
                        label: "Xem nhiều nhất",
                      },
                      {
                        value: "commented",
                        label:
                          "Nhiều bình luận",
                      },
                    ]}
                    onChange={(value) => {
                      setSort(value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              {visiblePosts.length === 0 ? (
                <div className="flex min-h-[360px] items-center justify-center">
                  <Empty
                    image={
                      Empty.PRESENTED_IMAGE_SIMPLE
                    }
                    description="Không có bài viết phù hợp."
                  />
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {visiblePosts.map(
                    (post) => (
                      <article
                        key={post.id}
                        className="group flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100/60"
                      >
                        <div className="mb-5 flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 via-rose-50 to-white text-pink-500">
                          {post.category ===
                          "doctor" ? (
                            <Stethoscope className="h-14 w-14" />
                          ) : post.category ===
                            "nutrition" ? (
                            <HeartPulse className="h-14 w-14" />
                          ) : (
                            <Baby className="h-14 w-14" />
                          )}
                        </div>

                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Tag color="pink">
                            {
                              post.categoryLabel
                            }
                          </Tag>

                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {post.publishedAt}
                          </span>
                        </div>

                        <Link
                          href={`/forum/${post.id}`}
                        >
                          <Title
                            level={3}
                            className="!mb-2 !line-clamp-2 !text-slate-950 transition group-hover:!text-pink-600"
                          >
                            {post.title}
                          </Title>
                        </Link>

                        <Paragraph className="!mb-5 !line-clamp-3 !text-sm !leading-6 !text-slate-600">
                          {post.excerpt}
                        </Paragraph>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                          <div className="min-w-0">
                            <Text
                              strong
                              className="block truncate text-sm"
                            >
                              {post.author}
                            </Text>

                            <Text
                              type="secondary"
                              className="block truncate text-xs"
                            >
                              {post.authorRole}
                            </Text>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {formatNumber(
                                post.views,
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.comments}
                            </span>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}

              {filteredPosts.length >
              PAGE_SIZE ? (
                <div className="mt-7 flex justify-center border-t border-slate-100 pt-6">
                  <Pagination
                    current={page}
                    pageSize={PAGE_SIZE}
                    total={
                      filteredPosts.length
                    }
                    showSizeChanger={false}
                    onChange={setPage}
                  />
                </div>
              ) : null}
            </Card>
          </section>
        </main>
      </div>

      <SiteFooter />
    </>
  );
}
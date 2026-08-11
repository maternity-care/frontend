import {
  apiClient,
  unwrapApiData,
  unwrapApiResponse,
} from "@/lib/axios";
import type {
  BackendForumCategory,
  BackendForumComment,
  BackendForumPost,
  BackendForumTopic,
  CreateForumCommentInput,
  CreateForumPostInput,
  CreateForumReportInput,
  ForumAuthor,
  ForumAuthorRole,
  ForumCategory,
  ForumCategoryCode,
  ForumComment,
  ForumCommentStatus,
  ForumDisclaimer,
  ForumPost,
  ForumPostListResult,
  ForumPostStatus,
  ForumTopic,
  GetForumPostsParams,
} from "./forum.types";

const ENDPOINT = "/forums";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function readText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readNumber(
  value: unknown,
  fallback = 0,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return [
    "1",
    "true",
    "yes",
    "on",
  ].includes(
    readText(value).toLowerCase(),
  );
}

function compactObject(
  value: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) =>
        item !== undefined &&
        item !== null &&
        item !== "",
    ),
  );
}

function normalizePage(page?: number) {
  const value = Math.trunc(
    page ?? DEFAULT_PAGE,
  );

  return value > 0
    ? value
    : DEFAULT_PAGE;
}

function normalizeLimit(limit?: number) {
  const value = Math.trunc(
    limit ?? DEFAULT_LIMIT,
  );

  if (value < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    value,
    MAX_LIMIT,
  );
}

function normalizeCategoryCode(
  value: unknown,
): ForumCategoryCode {
  const code =
    readText(value).toLowerCase();

  if (
    code === "nutrition" ||
    code === "postpartum" ||
    code === "ask_doctor" ||
    code ===
      "booking_experience"
  ) {
    return code;
  }

  return "pregnancy";
}

function normalizePostStatus(
  value: unknown,
): ForumPostStatus {
  const status =
    readText(value).toLowerCase();

  if (
    status === "pending" ||
    status === "hidden" ||
    status === "rejected" ||
    status === "deleted"
  ) {
    return status;
  }

  return "published";
}

function normalizeCommentStatus(
  value: unknown,
): ForumCommentStatus {
  const status =
    readText(value).toLowerCase();

  if (
    status === "pending" ||
    status === "hidden" ||
    status === "rejected" ||
    status === "deleted"
  ) {
    return status;
  }

  return "published";
}

function normalizeAuthorRole(
  value: unknown,
): ForumAuthorRole {
  const role =
    readText(value).toLowerCase();

  if (
    role === "staff" ||
    role === "doctor" ||
    role === "moderator" ||
    role === "admin"
  ) {
    return role;
  }

  return "user";
}

function normalizeAuthor(
  raw: unknown,
  fallback: Record<string, unknown>,
): ForumAuthor {
  const author = isRecord(raw)
    ? raw
    : {};
  const role =
    normalizeAuthorRole(
      author.role ??
        author.authorRole ??
        fallback.authorRole ??
        fallback.role,
    );

  const id =
    readText(author.id) ||
    readText(fallback.authorId);

  return {
    id,
    name:
      readText(author.name) ||
      readText(
        fallback.authorName,
      ) ||
      (id
        ? `Thành viên #${id}`
        : "Thành viên diễn đàn"),
    email:
      readText(author.email) ||
      readText(
        fallback.authorEmail,
      ),
    role,
    roleLabel:
      readText(
        author.roleLabel,
      ) ||
      (
        role === "doctor"
          ? "Bác sĩ"
          : role === "staff"
            ? "Nhân viên y tế"
            : role === "moderator"
              ? "Kiểm duyệt viên"
              : role === "admin"
                ? "Quản trị viên"
                : "Thành viên"
      ),
    verified:
      readBoolean(
        author.verified ??
          author.isVerified,
      ) ||
      role === "doctor",
    avatarUrl:
      readText(
        author.avatarUrl,
      ) ||
      readText(author.avatar),
  };
}

function normalizeCategory(
  item: BackendForumCategory,
): ForumCategory {
  return {
    id: readText(item.id),
    code: normalizeCategoryCode(
      item.code,
    ),
    name:
      readText(item.name) ||
      "Chuyên mục",
    description: readText(
      item.description,
    ),
    sortOrder: readNumber(
      item.sortOrder,
    ),
    status:
      readText(item.status) ||
      "active",
    createdAt: readText(
      item.createdAt,
    ),
    updatedAt: readText(
      item.updatedAt,
    ),
  };
}

function normalizeTopic(
  item: BackendForumTopic,
): ForumTopic {
  return {
    id: readText(item.id),
    authorId: readText(
      item.authorId,
    ),
    title:
      readText(item.title) ||
      "Chủ đề diễn đàn",
    slug: readText(item.slug),
    category:
      normalizeCategoryCode(
        item.category,
      ),
    description: readText(
      item.description,
    ),
    status:
      readText(item.status) ||
      "active",
    createdAt: readText(
      item.createdAt,
    ),
    updatedAt: readText(
      item.updatedAt,
    ),
  };
}

function normalizeComment(
  item: BackendForumComment,
  fallbackPostId = "",
  fallbackParentId = "",
): ForumComment {
  const record = item as Record<
    string,
    unknown
  >;

  return {
    id: readText(item.id),
    postId:
      readText(item.postId) ||
      fallbackPostId,
    parentId:
      readText(item.parentId) ||
      fallbackParentId,
    content: readText(
      item.content,
    ),
    messageType:
      readText(item.messageType) ||
      "text",
    status:
      normalizeCommentStatus(
        item.status,
      ),
    author: normalizeAuthor(
      item.author,
      record,
    ),
    createdAt: readText(
      item.createdAt,
    ),
    updatedAt: readText(
      item.updatedAt,
    ),
    reportCount: Math.max(
      0,
      readNumber(
        item.reportCount,
      ),
    ),
    replies: [],
  };
}

function readCommentTree(
  value: unknown,
  fallbackPostId = "",
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const comments: ForumComment[] = [];
  const seenIds = new Set<string>();

  function collectComment(
    raw: Record<string, unknown>,
    fallbackParentId = "",
  ) {
    const comment =
      normalizeComment(
        raw,
        fallbackPostId,
        fallbackParentId,
      );

    if (
      comment.id &&
      !seenIds.has(comment.id)
    ) {
      seenIds.add(comment.id);
      comments.push(comment);
    }

    const nestedReplies =
      raw.replies ??
      raw.children;

    if (
      Array.isArray(nestedReplies)
    ) {
      nestedReplies
        .filter(isRecord)
        .forEach((reply) => {
          collectComment(
            reply,
            comment.id,
          );
        });
    }
  }

  value
    .filter(isRecord)
    .forEach((item) => {
      collectComment(item);
    });

  const commentById =
    new Map(
      comments.map((comment) => [
        comment.id,
        comment,
      ]),
    );

  const rootComments:
    ForumComment[] = [];

  comments.forEach((comment) => {
    if (
      comment.parentId &&
      commentById.has(
        comment.parentId,
      )
    ) {
      commentById
        .get(comment.parentId)!
        .replies.push(comment);

      return;
    }

    rootComments.push(comment);
  });

  return rootComments;
}

function countCommentTree(
  comments: ForumComment[],
): number {
  return comments.reduce(
    (total, comment) =>
      total +
      1 +
      countCommentTree(
        comment.replies,
      ),
    0,
  );
}

function normalizePost(
  item: BackendForumPost,
): ForumPost {
  const record = item as Record<
    string,
    unknown
  >;
  const topic = isRecord(
    item.topic,
  )
    ? item.topic
    : {};
  const id = readText(item.id);
  const category =
    normalizeCategoryCode(
      item.category ??
        topic.category,
    );
  const comments =
    readCommentTree(
      item.comments,
      id,
    );

  return {
    id,
    topicId:
      readText(item.topicId) ||
      readText(topic.id),
    topicTitle:
      readText(item.topicTitle) ||
      readText(topic.title),
    category,
    categoryName: readText(
      item.categoryName,
    ),
    title:
      readText(item.title) ||
      `Bài viết #${id}`,
    excerpt:
      readText(item.excerpt) ||
      readText(
        item.description,
      ),
    content: readText(
      item.content,
    ),
    coverImageUrl: readText(
      item.coverImageUrl,
    ),
    status:
      normalizePostStatus(
        item.status,
      ),
    author: normalizeAuthor(
      item.author,
      record,
    ),
    createdAt: readText(
      item.createdAt,
    ),
    updatedAt: readText(
      item.updatedAt,
    ),
    publishedAt: readText(
      item.publishedAt,
    ),
    views: Math.max(
      0,
      readNumber(
        item.views ??
          item.viewCount,
      ),
    ),
    commentCount: Math.max(
      countCommentTree(
        comments,
      ),
      readNumber(
        item.commentCount ??
          item.commentsCount,
      ),
    ),
    reportCount: Math.max(
      0,
      readNumber(
        item.reportCount ??
          item.reportsCount,
      ),
    ),
    isPinned: readBoolean(
      item.isPinned ??
        item.pinned,
    ),
    isFeatured: readBoolean(
      item.isFeatured ??
        item.featured,
    ),
    isLocked: readBoolean(
      item.isLocked ??
        item.locked,
    ),
    comments,
  };
}

function extractArray(
  value: unknown,
) {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of [
    "data",
    "items",
    "rows",
    "results",
  ]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }

  return [];
}

function extractPostList(
  value: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): ForumPostListResult {
  if (Array.isArray(value)) {
    const items = value
      .filter(isRecord)
      .map(normalizePost);

    return {
      items,
      medicalDisclaimer: "",
      total: items.length,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages:
        items.length === 0
          ? 0
          : Math.ceil(
              items.length /
                fallbackLimit,
            ),
    };
  }

  if (!isRecord(value)) {
    return {
      items: [],
      medicalDisclaimer: "",
      total: 0,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages: 0,
    };
  }

  const list = extractArray(
    value.data ??
      value.items ??
      value.rows ??
      value.results,
  );
  const items =
    list.map(normalizePost);
  const total = Math.max(
    items.length,
    readNumber(
      value.total,
      items.length,
    ),
  );
  const page = Math.max(
    1,
    readNumber(
      value.page,
      fallbackPage,
    ),
  );
  const limit = Math.max(
    1,
    readNumber(
      value.limit,
      fallbackLimit,
    ),
  );

  return {
    items,
    medicalDisclaimer:
      readText(
        value.medicalDisclaimer,
      ),
    total,
    page,
    limit,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(total / limit),
  };
}

export async function getForumDisclaimer() {
  const data =
    await unwrapApiData<
      ForumDisclaimer
    >(
      apiClient.get(
        `${ENDPOINT}/disclaimer`,
      ),
    );

  return {
    message:
      readText(data.message) ||
      "Thông tin tham khảo, không thay thế tư vấn bác sĩ.",
  };
}

export async function getForumCategories() {
  const data =
    await unwrapApiData<unknown>(
      apiClient.get(
        `${ENDPOINT}/categories`,
      ),
    );

  return extractArray(data)
    .map(normalizeCategory)
    .sort(
      (left, right) =>
        left.sortOrder -
        right.sortOrder,
    );
}

export async function getForumTopics() {
  const data =
    await unwrapApiData<unknown>(
      apiClient.get(
        `${ENDPOINT}/topics`,
      ),
    );

  return extractArray(data).map(
    normalizeTopic,
  );
}

export async function getForumPosts(
  params?: GetForumPostsParams,
): Promise<ForumPostListResult> {
  const page = normalizePage(
    params?.page,
  );
  const limit = normalizeLimit(
    params?.limit,
  );

  const data =
    await unwrapApiData<unknown>(
      apiClient.get(
        `${ENDPOINT}/posts`,
        {
          params: compactObject({
            page,
            limit,
            category:
              params?.category,
            topicId:
              params?.topicId?.trim(),
            authorId:
              params?.authorId?.trim(),
            authorRole:
              params?.authorRole,
            search:
              params?.search?.trim(),
            status: params?.status,
          }),
        },
      ),
    );

  return extractPostList(
    data,
    page,
    limit,
  );
}

export async function createForumPost(
  input: CreateForumPostInput,
) {
  return unwrapApiResponse<unknown>(
    apiClient.post(
      `${ENDPOINT}/posts`,
      {
        topicId: input.topicId,
        title: input.title.trim(),
        content:
          input.content.trim(),
        coverImageUrl:
          input.coverImageUrl?.trim() ||
          undefined,
      },
    ),
  );
}

export async function getForumPost(
  id: string,
) {
  const data =
    await unwrapApiData<unknown>(
      apiClient.get(
        `${ENDPOINT}/posts/${id}`,
      ),
    );

  if (!isRecord(data)) {
    throw new Error(
      "Dữ liệu bài viết không hợp lệ.",
    );
  }

  const source = isRecord(
    data.post,
  )
    ? {
        ...data.post,
        comments:
          data.comments ??
          data.post.comments,
      }
    : data;

  return normalizePost(source);
}

export async function createForumComment(
  postId: string,
  input: CreateForumCommentInput,
) {
  return unwrapApiResponse<unknown>(
    apiClient.post(
      `${ENDPOINT}/posts/${postId}/comments`,
      compactObject({
        content:
          input.content.trim(),
        parentId:
          input.parentId?.trim(),
        messageType:
          input.messageType,
      }),
    ),
  );
}

export async function createForumReport(
  input: CreateForumReportInput,
) {
  return unwrapApiResponse<unknown>(
    apiClient.post(
      `${ENDPOINT}/reports`,
      {
        targetType:
          input.targetType,
        targetId: input.targetId,
        reason: input.reason.trim(),
      },
    ),
  );
}

export const forumApi = {
  getDisclaimer:
    getForumDisclaimer,
  getCategories:
    getForumCategories,
  getTopics: getForumTopics,
  getPosts: getForumPosts,
  createPost: createForumPost,
  getPost: getForumPost,
  createComment:
    createForumComment,
  createReport:
    createForumReport,
};
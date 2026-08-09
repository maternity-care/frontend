import {
  apiClient,
  unwrapApiData,
  unwrapApiResponse,
} from "@/lib/axios";
import type {
  BackendForumComment,
  BackendForumPost,
  BackendForumPostDetailData,
  BackendForumModerationLog,
  BackendForumReport,
  BackendForumTopic,
  CreateForumPostInput,
  CreateForumTopicInput,
  DeleteForumCommentInput,
  DeleteForumPostInput,
  ForumAuthorRole,
  ForumCategory,
  ForumComment,
  ForumModerationLog,
  ForumPost,
  ForumPostListResult,
  ForumPostStatus,
  ForumReport,
  ForumReportListResult,
  ForumReportTargetType,
  ForumTopic,
  ForumTopicStatus,
  GetForumPostsParams,
  GetForumReportsParams,
  ModerateForumCommentInput,
  ModerateForumPostInput,
  ResolveForumReportInput,
  UpdateForumCommentInput,
  UpdateForumPostInput,
  UpdateForumTopicInput,
} from "./forums.types";

const ENDPOINT = "/management/forums";
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

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalized = normalizeText(
    value,
  ).toLowerCase();

  return [
    "1",
    "true",
    "yes",
    "on",
  ].includes(normalized);
}

function normalizePage(page?: number) {
  const value = Math.trunc(
    page ?? DEFAULT_PAGE,
  );

  return Number.isFinite(value) &&
    value > 0
    ? value
    : DEFAULT_PAGE;
}

function normalizeLimit(limit?: number) {
  const value = Math.trunc(
    limit ?? DEFAULT_LIMIT,
  );

  if (
    !Number.isFinite(value) ||
    value < 1
  ) {
    return DEFAULT_LIMIT;
  }

  return Math.min(value, MAX_LIMIT);
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

function normalizeCategory(
  value: unknown,
): ForumCategory {
  const category =
    normalizeText(value);

  if (
    category === "nutrition" ||
    category === "postpartum" ||
    category === "ask_doctor" ||
    category ===
      "booking_experience"
  ) {
    return category;
  }

  return "pregnancy";
}

function normalizeTopicStatus(
  value: unknown,
): ForumTopicStatus {
  return normalizeText(value)
    .toLowerCase() === "inactive"
    ? "inactive"
    : "active";
}

function normalizePostStatus(
  value: unknown,
): ForumPostStatus {
  const status = normalizeText(
    value,
  ).toLowerCase();

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
  const role = normalizeText(
    value,
  ).toLowerCase();

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

function normalizeTopic(
  item: BackendForumTopic,
): ForumTopic {
  return {
    id: normalizeText(item.id),
    authorId: normalizeText(
      item.authorId,
    ),
    title: normalizeText(item.title),
    slug: normalizeText(item.slug),
    category: normalizeCategory(
      item.category,
    ),
    description: normalizeText(
      item.description,
    ),
    status: normalizeTopicStatus(
      item.status,
    ),
    createdAt: normalizeText(
      item.createdAt,
    ),
    updatedAt: normalizeText(
      item.updatedAt,
    ),
  };
}

function normalizeComment(
  item: BackendForumComment,
  fallbackPostId = "",
): ForumComment {
  return {
    id: normalizeText(item.id),
    postId:
      normalizeText(item.postId) ||
      fallbackPostId,
    authorId: normalizeText(
      item.authorId,
    ),
    authorName:
      normalizeText(item.authorName) ||
      normalizeText(item.author) ||
      "Không rõ tác giả",
    authorEmail: normalizeText(
      item.authorEmail,
    ),
    authorRole: normalizeAuthorRole(
      item.authorRole ?? item.role,
    ),
    parentId: normalizeText(
      item.parentId,
    ),
    messageType:
      normalizeText(item.messageType) ||
      "text",
    content: normalizeText(
      item.content,
    ),
    isDoctorAnswer: normalizeBoolean(
      item.isDoctorAnswer,
    ),
    status: normalizePostStatus(
      item.status,
    ),
    moderatedBy: normalizeText(
      item.moderatedBy,
    ),
    moderatedAt: normalizeText(
      item.moderatedAt,
    ),
    moderationReason: normalizeText(
      item.moderationReason,
    ),
    deletedAt: normalizeText(
      item.deletedAt,
    ),
    reportCount: Math.max(
      0,
      normalizeNumber(
        item.reportCount,
      ),
    ),
    createdAt: normalizeText(
      item.createdAt,
    ),
    updatedAt: normalizeText(
      item.updatedAt,
    ),
    replies: [],
  };
}

function readCommentArray(
  value: unknown,
  postId: string,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const comments = value
    .filter(isRecord)
    .map((item) =>
      normalizeComment(
        item,
        postId,
      ),
    );

  const commentById = new Map(
    comments.map((comment) => [
      comment.id,
      comment,
    ]),
  );
  const rootComments: ForumComment[] = [];

  comments.forEach((comment) => {
    const parent = comment.parentId
      ? commentById.get(
          comment.parentId,
        )
      : undefined;

    if (parent) {
      parent.replies.push(comment);
      return;
    }

    rootComments.push(comment);
  });

  return rootComments;
}

function normalizeModerationLog(
  item: BackendForumModerationLog,
): ForumModerationLog {
  return {
    id: normalizeText(item.id),
    targetType: normalizeText(
      item.targetType,
    ),
    targetId: normalizeText(
      item.targetId,
    ),
    action: normalizeText(
      item.action,
    ),
    actorId: normalizeText(
      item.actorId,
    ),
    actorRole: normalizeAuthorRole(
      item.actorRole,
    ),
    reason: normalizeText(
      item.reason,
    ),
    metadata: isRecord(item.metadata)
      ? item.metadata
      : null,
    createdAt: normalizeText(
      item.createdAt,
    ),
  };
}

function readModerationLogs(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map(normalizeModerationLog);
}

function normalizePost(
  item: BackendForumPost,
  detail?: {
    comments?: unknown;
    logs?: unknown;
    medicalDisclaimer?: unknown;
  },
): ForumPost {
  const id = normalizeText(item.id);
  const forumTopic = isRecord(
    item.forumTopic,
  )
    ? item.forumTopic
    : {};
  const rawLocked =
    item.isLocked ?? item.locked;
  const commentable =
    item.commentable !== undefined
      ? normalizeBoolean(
          item.commentable,
        )
      : rawLocked !== undefined
        ? !normalizeBoolean(rawLocked)
        : true;

  return {
    id,
    topicId:
      normalizeText(item.topicId) ||
      normalizeText(
        item.forumTopicId,
      ) ||
      normalizeText(forumTopic.id),
    topicTitle:
      normalizeText(item.topicTitle) ||
      normalizeText(
        forumTopic.title,
      ),
    title:
      normalizeText(item.title) ||
      `Bài viết #${id}`,
    excerpt:
      normalizeText(item.excerpt) ||
      normalizeText(
        item.description,
      ),
    content: normalizeText(
      item.content,
    ),
    coverImageUrl: normalizeText(
      item.coverImageUrl,
    ),
    category: normalizeCategory(
      item.category ??
        forumTopic.category,
    ),
    authorId: normalizeText(
      item.authorId,
    ),
    authorName:
      normalizeText(item.authorName) ||
      normalizeText(item.author) ||
      "Không rõ tác giả",
    authorEmail: normalizeText(
      item.authorEmail,
    ),
    authorRole: normalizeAuthorRole(
      item.authorRole ?? item.role,
    ),
    status: normalizePostStatus(
      item.status,
    ),
    isPinned: normalizeBoolean(
      item.isPinned ?? item.pinned,
    ),
    isFeatured: normalizeBoolean(
      item.isFeatured ??
        item.featured,
    ),
    isLocked: !commentable,
    commentable,
    viewCount: Math.max(
      0,
      normalizeNumber(
        item.viewCount ?? item.views,
      ),
    ),
    commentCount: Math.max(
      readCommentArray(
        detail?.comments ??
          item.comments,
        id,
      ).length,
      normalizeNumber(
        item.commentCount ??
          item.commentsCount,
      ),
    ),
    reportCount: Math.max(
      0,
      normalizeNumber(
        item.reportCount ??
          item.reportsCount,
      ),
    ),
    interactionCount: Math.max(
      0,
      normalizeNumber(
        item.interactionCount,
        normalizeNumber(
          item.commentCount ??
            item.commentsCount,
        ) +
          normalizeNumber(
            item.reportCount ??
              item.reportsCount,
          ),
      ),
    ),
    comments: readCommentArray(
      detail?.comments ??
        item.comments,
      id,
    ),
    medicalDisclaimer: normalizeText(
      detail?.medicalDisclaimer,
    ),
    moderationLogs: readModerationLogs(
      detail?.logs,
    ),
    approvedBy: normalizeText(
      item.approvedBy,
    ),
    approvedAt: normalizeText(
      item.approvedAt,
    ),
    moderatedBy: normalizeText(
      item.moderatedBy,
    ),
    moderatedAt: normalizeText(
      item.moderatedAt,
    ),
    moderationReason: normalizeText(
      item.moderationReason,
    ),
    deletedAt: normalizeText(
      item.deletedAt,
    ),
    createdAt: normalizeText(
      item.createdAt,
    ),
    updatedAt: normalizeText(
      item.updatedAt,
    ),
    publishedAt: normalizeText(
      item.publishedAt,
    ),
  };
}

function readPostMutationData(
  value: unknown,
): BackendForumPost {
  if (!isRecord(value)) {
    throw new Error(
      "Dữ liệu bài viết trả về không hợp lệ.",
    );
  }

  if (isRecord(value.post)) {
    return value.post;
  }

  return value;
}

function readCommentMutationData(
  value: unknown,
): BackendForumComment {
  if (!isRecord(value)) {
    throw new Error(
      "Dữ liệu bình luận trả về không hợp lệ.",
    );
  }

  if (isRecord(value.comment)) {
    return value.comment;
  }

  return value;
}

function normalizeReportTargetType(
  value: unknown,
): ForumReportTargetType {
  const targetType = normalizeText(
    value,
  ).toLowerCase();

  if (
    targetType === "post" ||
    targetType === "comment"
  ) {
    return targetType;
  }

  return "unknown";
}

function normalizeReportTargetContent(
  value: unknown,
) {
  if (!isRecord(value)) {
    return null;
  }

  return {
    type: normalizeReportTargetType(
      value.type,
    ),
    id: normalizeText(value.id),
    title: normalizeText(
      value.title,
    ),
    postId: normalizeText(
      value.postId,
    ),
    postTitle: normalizeText(
      value.postTitle,
    ),
    parentId: normalizeText(
      value.parentId,
    ),
    content: normalizeText(
      value.content,
    ),
    authorName: normalizeText(
      value.author,
    ),
    authorId: normalizeText(
      value.authorId,
    ),
    authorRole: normalizeAuthorRole(
      value.authorRole,
    ),
    status: normalizePostStatus(
      value.status,
    ),
    createdAt: normalizeText(
      value.createdAt,
    ),
    updatedAt: normalizeText(
      value.updatedAt,
    ),
  };
}

function normalizeReport(
  item: BackendForumReport,
): ForumReport {
  const targetType =
    normalizeReportTargetType(
      item.targetType ??
        item.contentType,
    );

  const targetId =
    normalizeText(item.targetId) ||
    normalizeText(item.contentId) ||
    (
      targetType === "post"
        ? normalizeText(item.postId)
        : normalizeText(
            item.commentId,
          )
    );

  return {
    id: normalizeText(item.id),
    targetType,
    targetId,
    targetContent:
      normalizeReportTargetContent(
        item.targetContent,
      ),
    reporterId: normalizeText(
      item.reporterId,
    ),
    reporterName:
      normalizeText(
        item.reporterName,
      ) || "Không rõ người báo cáo",
    reporterEmail: normalizeText(
      item.reporterEmail,
    ),
    reason: normalizeText(
      item.reason,
    ),
    description:
      normalizeText(
        item.description,
      ) || normalizeText(item.note),
    status:
      normalizeText(item.status) ||
      "open",
    createdAt: normalizeText(
      item.createdAt,
    ),
    updatedAt: normalizeText(
      item.updatedAt,
    ),
    handledAt: normalizeText(
      item.handledAt,
    ),
    handledBy: normalizeText(
      item.handledBy,
    ),
    resolution: normalizeText(
      item.resolution,
    ),
  };
}

type PageExtractionResult = {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function extractPage(
  value: unknown,
  fallbackPage: number,
  fallbackLimit: number,
  depth = 0,
): PageExtractionResult {
  if (Array.isArray(value)) {
    const items =
      value.filter(isRecord);

    return {
      items,
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

  if (
    !isRecord(value) ||
    depth > 5
  ) {
    return {
      items: [],
      total: 0,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages: 0,
    };
  }

  const arrayKeys = [
    "items",
    "data",
    "rows",
    "results",
    "posts",
    "reports",
  ];

  for (const key of arrayKeys) {
    const candidate = value[key];

    if (!Array.isArray(candidate)) {
      continue;
    }

    const items =
      candidate.filter(isRecord);
    const total = Math.max(
      0,
      normalizeNumber(
        value.total ??
          value.count,
        items.length,
      ),
    );
    const page = Math.max(
      1,
      normalizeNumber(
        value.page,
        fallbackPage,
      ),
    );
    const limit = Math.max(
      1,
      normalizeNumber(
        value.limit,
        fallbackLimit,
      ),
    );
    const totalPages = Math.max(
      0,
      normalizeNumber(
        value.totalPages,
        total === 0
          ? 0
          : Math.ceil(total / limit),
      ),
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  const containerKeys = [
    "data",
    "result",
    "payload",
  ];

  for (const key of containerKeys) {
    const candidate = value[key];

    if (
      candidate !== undefined
    ) {
      const extracted =
        extractPage(
          candidate,
          fallbackPage,
          fallbackLimit,
          depth + 1,
        );

      if (
        extracted.items.length > 0 ||
        extracted.total > 0 ||
        isRecord(candidate)
      ) {
        return extracted;
      }
    }
  }

  return {
    items: [],
    total: 0,
    page: fallbackPage,
    limit: fallbackLimit,
    totalPages: 0,
  };
}

export async function getForumTopics() {
  const data =
    await unwrapApiData<
      BackendForumTopic[]
    >(
      apiClient.get(
        `${ENDPOINT}/topics`,
      ),
    );

  return Array.isArray(data)
    ? data.map(normalizeTopic)
    : [];
}

export async function createForumTopic(
  input: CreateForumTopicInput,
) {
  const response =
    await unwrapApiResponse<
      BackendForumTopic
    >(
      apiClient.post(
        `${ENDPOINT}/topics`,
        {
          title: input.title.trim(),
          category: input.category,
          description:
            input.description.trim(),
          status: input.status,
        },
      ),
    );

  return {
    ...response,
    data: normalizeTopic(
      response.data,
    ),
  };
}

export async function updateForumTopic(
  id: string,
  input: UpdateForumTopicInput,
) {
  const response =
    await unwrapApiResponse<
      BackendForumTopic
    >(
      apiClient.patch(
        `${ENDPOINT}/topics/${id}`,
        {
          title: input.title.trim(),
          category: input.category,
          description:
            input.description.trim(),
          status: input.status,
        },
      ),
    );

  return {
    ...response,
    data: normalizeTopic(
      response.data,
    ),
  };
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

  const extracted = extractPage(
    data,
    page,
    limit,
  );

  return {
    items: extracted.items.map(
      (item) =>
        normalizePost(item),
    ),
    total: extracted.total,
    page: extracted.page,
    limit: extracted.limit,
    totalPages:
      extracted.totalPages,
  };
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
      "Dữ liệu chi tiết bài viết không hợp lệ.",
    );
  }

  const detail =
    data as BackendForumPostDetailData;
  const postSource = isRecord(
    detail.post,
  )
    ? detail.post
    : data;

  return normalizePost(
    postSource,
    {
      comments:
        detail.comments ??
        postSource.comments,
      logs: detail.logs,
      medicalDisclaimer:
        detail.medicalDisclaimer,
    },
  );
}

export async function createForumPost(
  input: CreateForumPostInput,
) {
  const response =
    await unwrapApiResponse<unknown>(
      apiClient.post(
        `${ENDPOINT}/posts`,
        compactObject({
          topicId: input.topicId.trim(),
          title: input.title.trim(),
          content: input.content.trim(),
          coverImageUrl:
            input.coverImageUrl?.trim(),
          status: input.status,
          commentable: input.commentable,
          isPinned: input.isPinned,
          isFeatured: input.isFeatured,
          moderationReason:
            input.moderationReason?.trim(),
        }),
      ),
    );

  return {
    ...response,
    data: normalizePost(
      readPostMutationData(
        response.data,
      ),
    ),
  };
}

export async function updateForumPost(
  id: string,
  input: UpdateForumPostInput,
) {
  const response =
    await unwrapApiResponse<unknown>(
      apiClient.patch(
        `${ENDPOINT}/posts/${id}`,
        compactObject({
          topicId:
            input.topicId?.trim(),
          title: input.title?.trim(),
          content: input.content?.trim(),
          coverImageUrl:
            input.coverImageUrl?.trim(),
          status: input.status,
          commentable:
            input.commentable,
          isPinned: input.isPinned,
          isFeatured: input.isFeatured,
          moderationReason:
            input.moderationReason?.trim(),
        }),
      ),
    );

  return {
    ...response,
    data: normalizePost(
      readPostMutationData(
        response.data,
      ),
    ),
  };
}

export async function deleteForumPost(
  id: string,
  input: DeleteForumPostInput,
) {
  return unwrapApiResponse<unknown>(
    apiClient.delete(
      `${ENDPOINT}/posts/${id}`,
      {
        params: {
          reason: input.reason.trim(),
        },
      },
    ),
  );
}

export async function moderateForumPost(
  id: string,
  input: ModerateForumPostInput,
) {
  const response =
    await unwrapApiResponse<
      BackendForumPost
    >(
      apiClient.patch(
        `${ENDPOINT}/posts/${id}/moderation`,
        {
          action: input.action,
          reason: input.reason.trim(),
        },
      ),
    );

  return {
    ...response,
    data: normalizePost(
      response.data,
    ),
  };
}

export async function moderateForumComment(
  id: string,
  input: ModerateForumCommentInput,
) {
  const response =
    await unwrapApiResponse<
      BackendForumComment
    >(
      apiClient.patch(
        `${ENDPOINT}/comments/${id}/moderation`,
        {
          action: input.action,
          reason: input.reason.trim(),
        },
      ),
    );

  return {
    ...response,
    data: normalizeComment(
      response.data,
    ),
  };
}

export async function updateForumComment(
  id: string,
  input: UpdateForumCommentInput,
) {
  const response =
    await unwrapApiResponse<unknown>(
      apiClient.patch(
        `${ENDPOINT}/comments/${id}`,
        compactObject({
          content:
            input.content?.trim(),
          parentId:
            input.parentId?.trim(),
          messageType:
            input.messageType?.trim(),
        }),
      ),
    );

  return {
    ...response,
    data: normalizeComment(
      readCommentMutationData(
        response.data,
      ),
    ),
  };
}

export async function deleteForumComment(
  id: string,
  input: DeleteForumCommentInput,
) {
  return unwrapApiResponse<unknown>(
    apiClient.delete(
      `${ENDPOINT}/comments/${id}`,
      {
        params: {
          reason: input.reason.trim(),
        },
      },
    ),
  );
}

export async function getForumReports(
  params?: GetForumReportsParams,
): Promise<ForumReportListResult> {
  const page = normalizePage(
    params?.page,
  );
  const limit = normalizeLimit(
    params?.limit,
  );

  const data =
    await unwrapApiData<unknown>(
      apiClient.get(
        `${ENDPOINT}/reports`,
        {
          params: {
            page,
            limit,
          },
        },
      ),
    );

  const extracted = extractPage(
    data,
    page,
    limit,
  );

  return {
    items: extracted.items.map(
      (item) =>
        normalizeReport(item),
    ),
    total: extracted.total,
    page: extracted.page,
    limit: extracted.limit,
    totalPages:
      extracted.totalPages,
  };
}

export async function resolveForumReport(
  id: string,
  input: ResolveForumReportInput,
) {
  const response =
    await unwrapApiResponse<
      BackendForumReport
    >(
      apiClient.patch(
        `${ENDPOINT}/reports/${id}/resolve`,
        {
          action: input.action,
          note: input.note.trim(),
        },
      ),
    );

  return {
    ...response,
    data: normalizeReport(
      response.data,
    ),
  };
}

export const forumApi = {
  getTopics: getForumTopics,
  createTopic: createForumTopic,
  updateTopic: updateForumTopic,
  getPosts: getForumPosts,
  getPost: getForumPost,
  createPost: createForumPost,
  updatePost: updateForumPost,
  deletePost: deleteForumPost,
  moderatePost: moderateForumPost,
  updateComment:
    updateForumComment,
  deleteComment:
    deleteForumComment,
  moderateComment:
    moderateForumComment,
  getReports: getForumReports,
  resolveReport: resolveForumReport,
};

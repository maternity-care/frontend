export type ForumCategory =
  | "pregnancy"
  | "nutrition"
  | "postpartum"
  | "ask_doctor"
  | "booking_experience";

export type ForumTopicStatus =
  | "active"
  | "inactive";

export type ForumPostStatus =
  | "pending"
  | "published"
  | "hidden"
  | "rejected"
  | "deleted";

export type ForumAuthorRole =
  | "user"
  | "staff"
  | "doctor"
  | "moderator"
  | "admin";

export type ForumPostModerationAction =
  | "approve"
  | "hide"
  | "reject"
  | "delete"
  | "lock"
  | "pin"
  | "feature";

export type ForumCommentModerationAction =
  | "approve"
  | "hide"
  | "reject"
  | "delete";

export type ForumReportResolveAction =
  | "hide"
  | "delete"
  | "dismiss";

export interface BackendForumTopic {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  category: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumTopic {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  category: ForumCategory;
  description: string;
  status: ForumTopicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateForumTopicInput {
  title: string;
  category: ForumCategory;
  description: string;
  status: ForumTopicStatus;
}

export interface UpdateForumTopicInput {
  title: string;
  category: ForumCategory;
  description: string;
  status: ForumTopicStatus;
}

export interface BackendForumComment {
  id?: unknown;
  postId?: unknown;
  author?: unknown;
  authorId?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  authorRole?: unknown;
  role?: unknown;
  parentId?: unknown;
  messageType?: unknown;
  content?: unknown;
  isDoctorAnswer?: unknown;
  status?: unknown;
  moderatedBy?: unknown;
  moderatedAt?: unknown;
  moderationReason?: unknown;
  deletedAt?: unknown;
  reportCount?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: ForumAuthorRole;
  parentId: string;
  messageType: string;
  content: string;
  isDoctorAnswer: boolean;
  status: ForumPostStatus;
  moderatedBy: string;
  moderatedAt: string;
  moderationReason: string;
  deletedAt: string;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  replies: ForumComment[];
}

export interface BackendForumModerationLog {
  id?: unknown;
  targetType?: unknown;
  targetId?: unknown;
  action?: unknown;
  actorId?: unknown;
  actorRole?: unknown;
  reason?: unknown;
  metadata?: unknown;
  createdAt?: unknown;
}

export interface ForumModerationLog {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  actorId: string;
  actorRole: ForumAuthorRole;
  reason: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface BackendForumPostTopic {
  id?: unknown;
  authorId?: unknown;
  title?: unknown;
  slug?: unknown;
  category?: unknown;
  description?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BackendForumPost {
  id?: unknown;
  topicId?: unknown;
  forumTopicId?: unknown;
  topicTitle?: unknown;
  forumTopic?: BackendForumPostTopic | null;
  title?: unknown;
  excerpt?: unknown;
  description?: unknown;
  content?: unknown;
  coverImageUrl?: unknown;
  category?: unknown;
  author?: unknown;
  authorId?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  authorRole?: unknown;
  role?: unknown;
  status?: unknown;
  isPinned?: unknown;
  pinned?: unknown;
  isFeatured?: unknown;
  featured?: unknown;
  isLocked?: unknown;
  locked?: unknown;
  commentable?: unknown;
  viewCount?: unknown;
  views?: unknown;
  commentCount?: unknown;
  commentsCount?: unknown;
  reportCount?: unknown;
  reportsCount?: unknown;
  interactionCount?: unknown;
  comments?: unknown;
  approvedBy?: unknown;
  approvedAt?: unknown;
  moderatedBy?: unknown;
  moderatedAt?: unknown;
  moderationReason?: unknown;
  deletedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  publishedAt?: unknown;
}

export interface ForumPost {
  id: string;
  topicId: string;
  topicTitle: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: ForumCategory;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: ForumAuthorRole;
  status: ForumPostStatus;
  isPinned: boolean;
  isFeatured: boolean;
  isLocked: boolean;
  commentable: boolean;
  viewCount: number;
  commentCount: number;
  reportCount: number;
  interactionCount: number;
  comments: ForumComment[];
  medicalDisclaimer: string;
  moderationLogs: ForumModerationLog[];
  approvedBy: string;
  approvedAt: string;
  moderatedBy: string;
  moderatedAt: string;
  moderationReason: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface BackendForumPostDetailData {
  medicalDisclaimer?: unknown;
  post?: BackendForumPost | null;
  comments?: unknown;
  logs?: unknown;
}

export interface GetForumPostsParams {
  page?: number;
  limit?: number;
  category?: ForumCategory;
  topicId?: string;
  authorId?: string;
  authorRole?: ForumAuthorRole;
  search?: string;
  status?: ForumPostStatus;
}

export interface ForumPostListResult {
  items: ForumPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateForumPostInput {
  topicId: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  status: ForumPostStatus;
  commentable: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  moderationReason?: string;
}

export interface UpdateForumPostInput {
  topicId?: string;
  title?: string;
  content?: string;
  coverImageUrl?: string;
  status?: ForumPostStatus;
  commentable?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  moderationReason?: string;
}

export interface DeleteForumPostInput {
  reason: string;
}

export interface ModerateForumPostInput {
  action: ForumPostModerationAction;
  reason: string;
}

export interface ModerateForumCommentInput {
  action: ForumCommentModerationAction;
  reason: string;
}

export interface UpdateForumCommentInput {
  content?: string;
  parentId?: string;
  messageType?: string;
}

export interface DeleteForumCommentInput {
  reason: string;
}

export type ForumReportTargetType =
  | "post"
  | "comment"
  | "unknown";

export interface BackendForumReportTargetContent {
  type?: unknown;
  id?: unknown;
  postId?: unknown;
  postTitle?: unknown;
  parentId?: unknown;
  title?: unknown;
  content?: unknown;
  author?: unknown;
  authorId?: unknown;
  authorRole?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ForumReportTargetContent {
  type: ForumReportTargetType;
  id: string;
  postId: string;
  postTitle: string;
  parentId: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  authorRole: ForumAuthorRole;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendForumReport {
  id?: unknown;
  handlerId?: unknown;
  reporterId?: unknown;
  reporterRole?: unknown;
  targetType?: unknown;
  contentType?: unknown;
  targetId?: unknown;
  contentId?: unknown;
  postId?: unknown;
  commentId?: unknown;
  reporterName?: unknown;
  reporterEmail?: unknown;
  reason?: unknown;
  description?: unknown;
  note?: unknown;
  resolutionNote?: unknown;
  resolutionAction?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  handledAt?: unknown;
  handledBy?: unknown;
  resolvedBy?: unknown;
  resolvedAt?: unknown;
  resolution?: unknown;
  targetContent?: BackendForumReportTargetContent | null;
}

export interface ForumReport {
  id: string;
  handlerId: string;
  reporterId: string;
  reporterRole: ForumAuthorRole;
  targetType: ForumReportTargetType;
  targetId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  description: string;
  resolutionNote: string;
  resolutionAction: ForumReportResolveAction | "";
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedBy: string;
  resolvedAt: string;
  targetContent: ForumReportTargetContent | null;
  handledAt: string;
  handledBy: string;
  resolution: string;
}

export interface GetForumReportsParams {
  page?: number;
  limit?: number;
}

export interface ForumReportListResult {
  items: ForumReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResolveForumReportInput {
  action: ForumReportResolveAction;
  note: string;
}

export interface ForumApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
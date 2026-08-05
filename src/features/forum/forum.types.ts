export type ForumCategoryCode =
  | "pregnancy"
  | "nutrition"
  | "postpartum"
  | "ask_doctor"
  | "booking_experience";

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

export type ForumCommentStatus =
  | "pending"
  | "published"
  | "hidden"
  | "rejected"
  | "deleted";

export type ForumReportTargetType =
  | "post"
  | "comment";

export interface ForumDisclaimer {
  message: string;
}

export interface BackendForumCategory {
  id?: unknown;
  code?: unknown;
  name?: unknown;
  description?: unknown;
  sortOrder?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ForumCategory {
  id: string;
  code: ForumCategoryCode;
  name: string;
  description: string;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendForumTopic {
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

export interface ForumTopic {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  category: ForumCategoryCode;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumAuthor {
  id: string;
  name: string;
  email: string;
  role: ForumAuthorRole;
  roleLabel: string;
  verified: boolean;
  avatarUrl: string;
}

export interface BackendForumComment {
  id?: unknown;
  postId?: unknown;
  parentId?: unknown;
  content?: unknown;
  messageType?: unknown;
  status?: unknown;
  author?: unknown;
  authorId?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  authorRole?: unknown;
  role?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  reportCount?: unknown;
  replies?: unknown;
  children?: unknown;
}

export interface ForumComment {
  id: string;
  postId: string;
  parentId: string;
  content: string;
  messageType: string;
  status: ForumCommentStatus;
  author: ForumAuthor;
  createdAt: string;
  updatedAt: string;
  reportCount: number;
  replies: ForumComment[];
}

export interface BackendForumPost {
  id?: unknown;
  topicId?: unknown;
  topic?: unknown;
  topicTitle?: unknown;
  category?: unknown;
  categoryName?: unknown;
  title?: unknown;
  excerpt?: unknown;
  description?: unknown;
  content?: unknown;
  coverImageUrl?: unknown;
  status?: unknown;
  author?: unknown;
  authorId?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  authorRole?: unknown;
  role?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  publishedAt?: unknown;
  views?: unknown;
  viewCount?: unknown;
  comments?: unknown;
  commentCount?: unknown;
  commentsCount?: unknown;
  reportCount?: unknown;
  reportsCount?: unknown;
  isPinned?: unknown;
  pinned?: unknown;
  isFeatured?: unknown;
  featured?: unknown;
  isLocked?: unknown;
  locked?: unknown;
}

export interface ForumPost {
  id: string;
  topicId: string;
  topicTitle: string;
  category: ForumCategoryCode;
  categoryName: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: ForumPostStatus;
  author: ForumAuthor;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  views: number;
  commentCount: number;
  reportCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  isLocked: boolean;
  comments: ForumComment[];
}

export interface GetForumPostsParams {
  page?: number;
  limit?: number;
  category?: ForumCategoryCode;
  topicId?: string;
  authorId?: string;
  authorRole?: ForumAuthorRole;
  search?: string;
  status?: ForumPostStatus;
}

export interface ForumPostListResult {
  items: ForumPost[];
  medicalDisclaimer: string;
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
}

export interface CreateForumCommentInput {
  content: string;
  parentId?: string;
  messageType: "text";
}

export interface CreateForumReportInput {
  targetType: ForumReportTargetType;
  targetId: string;
  reason: string;
}

export interface ForumApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
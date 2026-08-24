import type {
  ForumAuthorRole,
  ForumCategory,
  ForumPost,
  ForumPostStatus,
  ForumReport,
  ForumReportGroup,
  ForumReportTargetContent,
} from "./forums.types";
import {
  FORUM_AUTHOR_ROLE_OPTIONS,
  FORUM_CATEGORY_OPTIONS,
  FORUM_POST_STATUS_OPTIONS,
} from "./forums.constants";

export function getForumErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra.",
) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  return error instanceof Error
    ? error.message
    : fallback;
}

export function formatForumDateTime(
  value?: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function stripForumHtml(
  value: string,
) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function getForumCategoryLabel(
  category: ForumCategory,
) {
  return (
    FORUM_CATEGORY_OPTIONS.find(
      (item) => item.value === category,
    )?.label ?? category
  );
}

export function getForumAuthorRoleLabel(
  role: ForumAuthorRole,
) {
  return (
    FORUM_AUTHOR_ROLE_OPTIONS.find(
      (item) => item.value === role,
    )?.label ?? role
  );
}

export function getForumPostStatusLabel(
  status: ForumPostStatus,
) {
  return (
    FORUM_POST_STATUS_OPTIONS.find(
      (item) => item.value === status,
    )?.label ?? status
  );
}

export function getForumPostStatusColor(
  status: ForumPostStatus,
) {
  const colors: Record<
    ForumPostStatus,
    string
  > = {
    pending: "gold",
    published: "green",
    hidden: "orange",
    rejected: "red",
    deleted: "default",
  };

  return colors[status];
}

export function getForumPostCreatedTime(
  post: ForumPost,
) {
  const value = new Date(
    post.createdAt,
  ).getTime();

  return Number.isNaN(value) ? 0 : value;
}

export function getModerationTargetLabel(
  targetType: string,
) {
  const normalized =
    targetType.trim().toLowerCase();

  const labels: Record<string, string> = {
    post: "Bài viết",
    comment: "Bình luận",
  };

  return labels[normalized] || targetType || "Nội dung";
}

export function getModerationActionLabel(
  action: string,
) {
  const normalized =
    action.trim().toLowerCase();

  const labels: Record<string, string> = {
    submit: "Gửi bài",
    approve: "Duyệt bài",
    hide: "Ẩn",
    reject: "Từ chối",
    delete: "Xóa",
    lock: "Khóa bài viết",
    unlock: "Mở khóa bài viết",
    pin: "Ghim bài",
    unpin: "Bỏ ghim",
    feature: "Đánh dấu nổi bật",
    unfeature: "Bỏ đánh dấu nổi bật",
    update: "Cập nhật",
    edit: "Chỉnh sửa",
    create: "Tạo mới",
    restore: "Khôi phục",
  };

  return labels[normalized] || action || "Cập nhật";
}

export function isForumReportResolvedStatus(
  status: string,
) {
  return [
    "resolved",
    "rejected",
    "dismissed",
    "closed",
  ].includes(status.toLowerCase());
}

export function getForumReportStatusLabel(
  status: string,
) {
  const normalized =
    status.trim().toLowerCase();

  const labels: Record<string, string> = {
    pending: "Chờ xử lý",
    resolved: "Đã xử lý",
    rejected: "Đã bỏ qua",
    dismissed: "Đã bỏ qua",
  };

  return labels[normalized] || status || "Chờ xử lý";
}

export function getForumContentStatusLabel(
  status: string,
) {
  const normalized =
    status.trim().toLowerCase();

  const labels: Record<string, string> = {
    pending: "Chờ duyệt",
    published: "Đã xuất bản",
    hidden: "Đã ẩn",
    rejected: "Đã từ chối",
    deleted: "Đã xóa",
  };

  return labels[normalized] || status || "Chưa cập nhật";
}

export function getForumReportTargetLabel(
  targetType: ForumReportGroup["targetType"],
) {
  if (targetType === "post") {
    return "Bài viết";
  }

  if (targetType === "comment") {
    return "Bình luận";
  }

  return "Không xác định";
}

export function getForumReportTargetColor(
  targetType: ForumReportGroup["targetType"],
) {
  if (targetType === "post") {
    return "blue";
  }

  if (targetType === "comment") {
    return "purple";
  }

  return "default";
}

export function summarizeForumReportTarget(
  target: ForumReportTargetContent | null,
  group: ForumReportGroup,
) {
  if (!target) {
    return {
      title: `${getForumReportTargetLabel(
        group.targetType,
      )} không còn tồn tại`,
      content: "",
    };
  }

  return {
    title:
      target.title ||
      target.postTitle ||
      getForumReportTargetLabel(
        group.targetType,
      ),
    content: stripForumHtml(target.content),
  };
}

export function getForumReportDisplayContent(
  report: ForumReport,
) {
  const reason = report.reason.trim();
  const description =
    report.description.trim();

  if (
    description ||
    !reason.includes(":")
  ) {
    return {
      reason: reason || "Không rõ lý do",
      description:
        description || "Không có mô tả.",
    };
  }

  const separatorIndex =
    reason.indexOf(":");

  const reasonTitle = reason
    .slice(0, separatorIndex)
    .trim();

  const reasonDescription = reason
    .slice(separatorIndex + 1)
    .trim();

  return {
    reason: reasonTitle || "Không rõ lý do",
    description:
      reasonDescription || "Không có mô tả.",
  };
}

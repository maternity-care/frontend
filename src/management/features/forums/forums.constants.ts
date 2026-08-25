import type {
  ForumAuthorRole,
  ForumCategory,
  ForumCommentModerationAction,
  ForumPostModerationAction,
  ForumPostStatus,
  ForumReportResolveAction,
  ForumTopicStatus,
} from "./forums.types";

export const FORUM_CATEGORY_OPTIONS: Array<{
  value: ForumCategory;
  label: string;
}> = [
  { value: "pregnancy", label: "Thai kỳ" },
  { value: "nutrition", label: "Dinh dưỡng" },
  { value: "postpartum", label: "Sau sinh" },
  { value: "ask_doctor", label: "Hỏi bác sĩ" },
  {
    value: "booking_experience",
    label: "Kinh nghiệm đặt lịch",
  },
];

export const FORUM_TOPIC_STATUS_OPTIONS: Array<{
  value: ForumTopicStatus;
  label: string;
}> = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

export const FORUM_POST_STATUS_OPTIONS: Array<{
  value: ForumPostStatus;
  label: string;
}> = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đã xuất bản" },
  { value: "hidden", label: "Đã ẩn" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "deleted", label: "Đã xóa" },
];

export const FORUM_POST_EDITOR_STATUS_OPTIONS =
  FORUM_POST_STATUS_OPTIONS.filter(
    (option) => option.value !== "deleted",
  );

export const FORUM_AUTHOR_ROLE_OPTIONS: Array<{
  value: ForumAuthorRole;
  label: string;
}> = [
  { value: "user", label: "Người dùng" },
  { value: "staff", label: "Nhân viên" },
  { value: "doctor", label: "Bác sĩ" },
  { value: "moderator", label: "Kiểm duyệt viên" },
  { value: "admin", label: "Quản trị viên" },
];

export const FORUM_REPORT_REASON_OPTIONS = [
  { value: "Spam", label: "Spam" },
  { value: "Sai chủ đề", label: "Sai chủ đề" },
  {
    value: "Thông tin y tế sai lệch",
    label: "Thông tin y tế sai lệch",
  },
  {
    value: "Quảng cáo thuốc hoặc dịch vụ",
    label: "Quảng cáo thuốc/dịch vụ",
  },
  {
    value: "Nội dung gây hại hoặc kích động",
    label: "Nội dung gây hại/kích động",
  },
  { value: "Khác", label: "Lý do khác" },
];

export const FORUM_REPORT_ACTION_OPTIONS: Array<{
  value: ForumReportResolveAction;
  label: string;
}> = [
  { value: "hide", label: "Ẩn nội dung" },
  { value: "delete", label: "Xóa nội dung" },
  { value: "dismiss", label: "Bỏ qua báo cáo" },
];

export const FORUM_POST_ACTION_LABELS: Record<
  ForumPostModerationAction,
  string
> = {
  approve: "Duyệt bài",
  hide: "Ẩn bài",
  reject: "Từ chối",
  delete: "Xóa bài",
  lock_comments: "Khóa bình luận",
  unlock_comments: "Mở bình luận",
  pin: "Ghim bài",
  feature: "Đánh dấu nổi bật",
};

export const FORUM_COMMENT_ACTION_LABELS: Record<
  ForumCommentModerationAction,
  string
> = {
  approve: "Cho hiển thị",
  hide: "Ẩn bình luận",
  reject: "Từ chối bình luận",
  delete: "Xóa bình luận",
};

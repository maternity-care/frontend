"use client";

export type ForumCategory =
  | "pregnancy"
  | "nutrition"
  | "postpartum"
  | "ask_doctor"
  | "booking_experience";

export type ForumPostType =
  | "discussion"
  | "question";

export type ForumPostStatus =
  | "pending"
  | "published"
  | "hidden"
  | "rejected"
  | "deleted";

export type ForumCommentStatus =
  | "pending"
  | "published"
  | "hidden"
  | "deleted";

export type ForumAuthorType =
  | "user"
  | "doctor"
  | "editor"
  | "moderator";

export type ForumModerationAction =
  | "submit"
  | "approve"
  | "hide"
  | "reject"
  | "delete"
  | "lock_comments"
  | "unlock_comments"
  | "pin"
  | "unpin"
  | "feature"
  | "unfeature"
  | "warn_user"
  | "ban_user";

export type ForumReportReason =
  | "spam"
  | "wrong_topic"
  | "medical_misinformation"
  | "drug_advertising"
  | "hate_or_harmful"
  | "other";

export type ForumReportStatus =
  | "open"
  | "reviewing"
  | "resolved"
  | "dismissed";

export type ForumContentBlock =
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "quote";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    };

export type ForumAuthor = {
  id: string;
  name: string;
  roleLabel: string;
  type: ForumAuthorType;
  verified?: boolean;
  warnedCount?: number;
  bannedUntil?: string;
};

export type ForumModerationLog = {
  id: string;
  action: ForumModerationAction;
  actorId: string;
  actorName: string;
  actorRole: string;
  reason?: string;
  createdAt: string;
};

export type ForumPost = {
  id: string;
  title: string;
  topic: string;
  excerpt: string;
  category: ForumCategory;
  categoryLabel: string;
  postType: ForumPostType;
  author: ForumAuthor;
  createdAt: string;
  publishedAt?: string;
  readTime: string;
  views: number;
  commentCount: number;
  status: ForumPostStatus;
  featured?: boolean;
  pinned?: boolean;
  commentsLocked?: boolean;
  sensitiveMedicalContent?: boolean;
  tags: string[];
  content: ForumContentBlock[];
  moderationReason?: string;
  moderationLogs: ForumModerationLog[];
  reportCount: number;
};

export type ForumCommentReply = {
  id: string;
  postId: string;
  parentCommentId: string;
  author: ForumAuthor;
  content: string;
  createdAt: string;
  status: ForumCommentStatus;
  highlighted?: boolean;
  officialDoctorAnswer?: boolean;
  moderationReason?: string;
  reportCount: number;
};

export type ForumComment = {
  id: string;
  postId: string;
  author: ForumAuthor;
  content: string;
  createdAt: string;
  status: ForumCommentStatus;
  highlighted?: boolean;
  moderationReason?: string;
  reportCount: number;
  replies: ForumCommentReply[];
};

export type ContentReport = {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reporterId: string;
  reason: ForumReportReason;
  detail?: string;
  status: ForumReportStatus;
  createdAt: string;
  resolvedBy?: string;
  resolutionAction?: ForumModerationAction;
  resolutionReason?: string;
};

export const CURRENT_FORUM_USER: ForumAuthor = {
  id: "user-current",
  name: "Nguyễn Thị Mai",
  roleLabel: "Thai phụ · 20 tuần",
  type: "user",
  verified: false,
};

export const forumCategories = [
  {
    value: "all",
    label: "Tất cả chủ đề",
  },
  {
    value: "pregnancy",
    label: "Thai kỳ",
  },
  {
    value: "nutrition",
    label: "Dinh dưỡng",
  },
  {
    value: "postpartum",
    label: "Sau sinh",
  },
  {
    value: "ask_doctor",
    label: "Hỏi bác sĩ",
  },
  {
    value: "booking_experience",
    label: "Kinh nghiệm đặt lịch",
  },
] as const;

export const forumPosts: ForumPost[] = [
  {
    id: "dau-hieu-can-kham-ba-thang-dau",
    title:
      "Những dấu hiệu cần đi khám ngay trong ba tháng đầu thai kỳ",
    topic: "Dấu hiệu cảnh báo trong thai kỳ",
    excerpt:
      "Các dấu hiệu cảnh báo mẹ bầu không nên chủ quan và thời điểm cần đến cơ sở y tế.",
    category: "ask_doctor",
    categoryLabel: "Hỏi bác sĩ",
    postType: "question",
    author: {
      id: "doctor-001",
      name: "BS. Nguyễn Minh Anh",
      roleLabel: "Bác sĩ Sản phụ khoa",
      type: "doctor",
      verified: true,
    },
    createdAt: "2026-07-28T07:30:00.000Z",
    publishedAt: "28/07/2026",
    readTime: "7 phút đọc",
    views: 1280,
    commentCount: 2,
    status: "published",
    featured: true,
    pinned: true,
    commentsLocked: false,
    sensitiveMedicalContent: true,
    tags: [
      "Ba tháng đầu",
      "Dấu hiệu cảnh báo",
      "Khám thai",
    ],
    content: [
      {
        type: "paragraph",
        text:
          "Ba tháng đầu là giai đoạn thai nhi hình thành các cơ quan quan trọng. Phần lớn mẹ bầu chỉ gặp những thay đổi sinh lý thông thường, nhưng một số biểu hiện có thể là dấu hiệu cần được kiểm tra sớm.",
      },
      {
        type: "heading",
        text: "1. Ra máu âm đạo bất thường",
      },
      {
        type: "paragraph",
        text:
          "Một ít dịch màu hồng có thể xuất hiện ở thời điểm phôi làm tổ. Tuy nhiên, khi máu đỏ tươi, lượng tăng dần, có cục máu hoặc đi kèm đau bụng, mẹ bầu nên đến cơ sở y tế để được đánh giá.",
      },
      {
        type: "heading",
        text: "2. Đau bụng dưới kéo dài hoặc đau tăng dần",
      },
      {
        type: "paragraph",
        text:
          "Đau lâm râm nhẹ đôi khi xuất hiện do tử cung thay đổi. Cơn đau dữ dội, đau lệch một bên, đau vai hoặc kèm chóng mặt cần được kiểm tra ngay.",
      },
      {
        type: "quote",
        text:
          "Không tự ý dùng thuốc giảm đau khi chưa được bác sĩ hướng dẫn, đặc biệt trong những tuần đầu thai kỳ.",
      },
      {
        type: "list",
        items: [
          "Ghi lại thời điểm bắt đầu triệu chứng và mức độ thay đổi.",
          "Mang theo hồ sơ khám thai và kết quả xét nghiệm gần nhất.",
          "Không tự lái xe khi đang chóng mặt, đau nhiều hoặc ra máu.",
        ],
      },
    ],
    moderationLogs: [
      {
        id: "log-post-001-submit",
        action: "submit",
        actorId: "doctor-001",
        actorName: "BS. Nguyễn Minh Anh",
        actorRole: "Bác sĩ",
        createdAt: "28/07/2026 · 14:30",
      },
      {
        id: "log-post-001-approve",
        action: "approve",
        actorId: "moderator-001",
        actorName: "Trần Thu Hà",
        actorRole: "Content Moderator",
        reason: "Nội dung phù hợp và nguồn chuyên môn đã được xác thực.",
        createdAt: "28/07/2026 · 14:42",
      },
      {
        id: "log-post-001-pin",
        action: "pin",
        actorId: "moderator-001",
        actorName: "Trần Thu Hà",
        actorRole: "Content Moderator",
        reason: "Chủ đề quan trọng cho thai phụ trong ba tháng đầu.",
        createdAt: "28/07/2026 · 14:45",
      },
    ],
    reportCount: 0,
  },
  {
    id: "thuc-don-tam-ca-nguyet-hai",
    title:
      "Thực đơn một ngày cho mẹ bầu ở tam cá nguyệt thứ hai",
    topic: "Chia sẻ thực đơn hằng ngày",
    excerpt:
      "Gợi ý các nhóm thực phẩm và cách sắp xếp bữa ăn để đảm bảo năng lượng.",
    category: "nutrition",
    categoryLabel: "Dinh dưỡng",
    postType: "discussion",
    author: {
      id: "user-002",
      name: "Ngọc Mai",
      roleLabel: "Thai phụ · 24 tuần",
      type: "user",
    },
    createdAt: "2026-07-27T03:20:00.000Z",
    publishedAt: "27/07/2026",
    readTime: "5 phút đọc",
    views: 824,
    commentCount: 1,
    status: "published",
    featured: false,
    pinned: false,
    commentsLocked: false,
    sensitiveMedicalContent: true,
    tags: [
      "Dinh dưỡng",
      "Tam cá nguyệt hai",
    ],
    content: [
      {
        type: "paragraph",
        text:
          "Tam cá nguyệt thứ hai thường là giai đoạn mẹ bầu ăn uống dễ chịu hơn. Một thực đơn cân bằng nên có tinh bột, đạm, rau xanh, trái cây và chất béo tốt.",
      },
      {
        type: "heading",
        text: "Gợi ý thực đơn",
      },
      {
        type: "list",
        items: [
          "Bữa sáng: bánh mì nguyên cám, trứng chín kỹ và sữa.",
          "Bữa phụ: trái cây ít ngọt hoặc sữa chua.",
          "Bữa trưa: cơm, cá, rau luộc và canh.",
          "Bữa tối: thịt nạc, rau xanh và một phần tinh bột vừa đủ.",
        ],
      },
    ],
    moderationLogs: [
      {
        id: "log-post-002-submit",
        action: "submit",
        actorId: "user-002",
        actorName: "Ngọc Mai",
        actorRole: "Thành viên",
        createdAt: "27/07/2026 · 10:20",
      },
      {
        id: "log-post-002-approve",
        action: "approve",
        actorId: "moderator-002",
        actorName: "Lê Quốc Bảo",
        actorRole: "Content Moderator",
        reason: "Bài đúng chủ đề, không chứa quảng cáo hoặc khuyến nghị dùng thuốc.",
        createdAt: "27/07/2026 · 10:52",
      },
    ],
    reportCount: 1,
  },
  {
    id: "kinh-nghiem-dat-lich-kham-sang",
    title:
      "Kinh nghiệm đặt lịch khám buổi sáng để giảm thời gian chờ",
    topic: "Đặt lịch khám tại cơ sở",
    excerpt:
      "Một số kinh nghiệm chọn khung giờ, chuẩn bị giấy tờ và theo dõi xác nhận lịch.",
    category: "booking_experience",
    categoryLabel: "Kinh nghiệm đặt lịch",
    postType: "discussion",
    author: CURRENT_FORUM_USER,
    createdAt: "2026-07-26T02:10:00.000Z",
    publishedAt: "26/07/2026",
    readTime: "4 phút đọc",
    views: 612,
    commentCount: 1,
    status: "published",
    featured: false,
    pinned: false,
    commentsLocked: false,
    sensitiveMedicalContent: false,
    tags: [
      "Đặt lịch",
      "Khung giờ khám",
    ],
    content: [
      {
        type: "paragraph",
        text:
          "Mình thường đặt lịch trước ít nhất hai ngày và chọn khung giờ đầu buổi sáng. Trước khi đi, nên kiểm tra lại trạng thái xác nhận lịch và chuẩn bị giấy tờ cần thiết.",
      },
    ],
    moderationLogs: [
      {
        id: "log-post-003-submit",
        action: "submit",
        actorId: CURRENT_FORUM_USER.id,
        actorName: CURRENT_FORUM_USER.name,
        actorRole: "Thành viên",
        createdAt: "26/07/2026 · 09:10",
      },
      {
        id: "log-post-003-approve",
        action: "approve",
        actorId: "moderator-001",
        actorName: "Trần Thu Hà",
        actorRole: "Content Moderator",
        reason: "Kinh nghiệm phù hợp, không tiết lộ dữ liệu cá nhân nhạy cảm.",
        createdAt: "26/07/2026 · 09:35",
      },
    ],
    reportCount: 0,
  },
  {
    id: "hoi-ve-dau-lung-tuan-20",
    title:
      "Đau lưng ở tuần 20 có phải dấu hiệu bất thường không?",
    topic: "Hỏi bác sĩ về triệu chứng thai kỳ",
    excerpt:
      "Mình bị đau lưng nhẹ vào cuối ngày và muốn hỏi khi nào cần đi khám.",
    category: "ask_doctor",
    categoryLabel: "Hỏi bác sĩ",
    postType: "question",
    author: CURRENT_FORUM_USER,
    createdAt: "2026-07-29T12:15:00.000Z",
    readTime: "2 phút đọc",
    views: 0,
    commentCount: 0,
    status: "pending",
    featured: false,
    pinned: false,
    commentsLocked: false,
    sensitiveMedicalContent: true,
    tags: [
      "Đau lưng",
      "Tuần 20",
    ],
    content: [
      {
        type: "paragraph",
        text:
          "Mình đang mang thai tuần 20, gần đây thường đau lưng nhẹ vào cuối ngày. Mình không bị ra máu hoặc đau bụng. Nhờ bác sĩ hướng dẫn dấu hiệu nào cần đi khám sớm.",
      },
    ],
    moderationLogs: [
      {
        id: "log-post-004-submit",
        action: "submit",
        actorId: CURRENT_FORUM_USER.id,
        actorName: CURRENT_FORUM_USER.name,
        actorRole: "Thành viên",
        createdAt: "29/07/2026 · 19:15",
      },
    ],
    reportCount: 0,
  },
  {
    id: "cham-soc-me-sau-sinh",
    title:
      "Những việc nên chuẩn bị trong tuần đầu sau sinh",
    topic: "Chăm sóc mẹ sau sinh",
    excerpt:
      "Danh sách ngắn giúp gia đình chuẩn bị nghỉ ngơi, dinh dưỡng và lịch tái khám.",
    category: "postpartum",
    categoryLabel: "Sau sinh",
    postType: "discussion",
    author: {
      id: "editor-001",
      name: "Ban biên tập MCS",
      roleLabel: "Nội dung chuyên môn",
      type: "editor",
      verified: true,
    },
    createdAt: "2026-07-25T05:00:00.000Z",
    publishedAt: "25/07/2026",
    readTime: "6 phút đọc",
    views: 930,
    commentCount: 0,
    status: "published",
    featured: false,
    pinned: false,
    commentsLocked: true,
    sensitiveMedicalContent: true,
    tags: [
      "Sau sinh",
      "Chăm sóc mẹ",
    ],
    content: [
      {
        type: "paragraph",
        text:
          "Tuần đầu sau sinh cần ưu tiên nghỉ ngơi, theo dõi dấu hiệu bất thường và tuân thủ lịch tái khám do cơ sở y tế hướng dẫn.",
      },
    ],
    moderationLogs: [
      {
        id: "log-post-005-approve",
        action: "approve",
        actorId: "admin-001",
        actorName: "Quản trị viên MCS",
        actorRole: "Admin",
        reason: "Nội dung chuyên môn được duyệt để xuất bản.",
        createdAt: "25/07/2026 · 12:10",
      },
      {
        id: "log-post-005-lock",
        action: "lock_comments",
        actorId: "moderator-002",
        actorName: "Lê Quốc Bảo",
        actorRole: "Content Moderator",
        reason: "Tạm khóa để ngăn bình luận quảng cáo dịch vụ sau sinh.",
        createdAt: "26/07/2026 · 08:30",
      },
    ],
    reportCount: 2,
  },
];

export const forumComments: ForumComment[] = [
  {
    id: "comment-001",
    postId: "dau-hieu-can-kham-ba-thang-dau",
    author: {
      id: "user-011",
      name: "Minh Thư",
      roleLabel: "Thai phụ · 12 tuần",
      type: "user",
    },
    content:
      "Em từng bị đau bụng nhẹ nhưng không ra máu. Trường hợp này có cần đi khám ngay không ạ?",
    createdAt: "28/07/2026 · 14:20",
    status: "published",
    reportCount: 0,
    replies: [
      {
        id: "reply-001",
        postId: "dau-hieu-can-kham-ba-thang-dau",
        parentCommentId: "comment-001",
        author: {
          id: "doctor-001",
          name: "BS. Nguyễn Minh Anh",
          roleLabel: "Bác sĩ Sản phụ khoa",
          type: "doctor",
          verified: true,
        },
        content:
          "Nếu cơn đau nhẹ, không tăng dần và không kèm ra máu, em có thể nghỉ ngơi và theo dõi. Khi đau kéo dài hoặc xuất hiện thêm triệu chứng bất thường, em nên liên hệ bác sĩ đang theo dõi thai kỳ.",
        createdAt: "28/07/2026 · 15:02",
        status: "published",
        highlighted: true,
        officialDoctorAnswer: true,
        reportCount: 0,
      },
    ],
  },
  {
    id: "comment-002",
    postId: "dau-hieu-can-kham-ba-thang-dau",
    author: {
      id: "user-012",
      name: "Hải Yến",
      roleLabel: "Thành viên cộng đồng",
      type: "user",
    },
    content:
      "Bài viết rất rõ ràng. Mong diễn đàn có thêm bài về các xét nghiệm quan trọng trong ba tháng đầu.",
    createdAt: "28/07/2026 · 16:10",
    status: "published",
    reportCount: 0,
    replies: [],
  },
  {
    id: "comment-003",
    postId: "thuc-don-tam-ca-nguyet-hai",
    author: CURRENT_FORUM_USER,
    content:
      "Mình sẽ thử thực đơn này nhưng vẫn muốn hỏi bác sĩ về khẩu phần phù hợp với cân nặng hiện tại.",
    createdAt: "27/07/2026 · 18:05",
    status: "published",
    reportCount: 0,
    replies: [],
  },
  {
    id: "comment-004",
    postId: "kinh-nghiem-dat-lich-kham-sang",
    author: {
      id: "user-015",
      name: "Thanh Huyền",
      roleLabel: "Thai phụ · 36 tuần",
      type: "user",
    },
    content:
      "Mình cũng thấy khung giờ đầu buổi sáng thường ít chờ hơn.",
    createdAt: "26/07/2026 · 17:40",
    status: "published",
    reportCount: 0,
    replies: [],
  },
];

export const contentReports: ContentReport[] = [
  {
    id: "report-001",
    targetType: "post",
    targetId: "thuc-don-tam-ca-nguyet-hai",
    reporterId: "user-020",
    reason: "medical_misinformation",
    detail:
      "Đề nghị kiểm tra lại khẩu phần vì có thể không phù hợp với mọi thai phụ.",
    status: "reviewing",
    createdAt: "28/07/2026 · 09:20",
  },
  {
    id: "report-002",
    targetType: "post",
    targetId: "cham-soc-me-sau-sinh",
    reporterId: "system",
    reason: "drug_advertising",
    detail:
      "Hệ thống phát hiện nhiều bình luận có từ khóa quảng cáo thuốc.",
    status: "resolved",
    createdAt: "26/07/2026 · 08:10",
    resolvedBy: "moderator-002",
    resolutionAction: "lock_comments",
    resolutionReason:
      "Khóa bình luận trong lúc xử lý các nội dung quảng cáo.",
  },
];

const COMMENT_REVIEW_KEYWORDS = [
  "mua thuốc",
  "bán thuốc",
  "thuốc gia truyền",
  "cam kết khỏi",
  "telegram",
  "đánh bạc",
  "link kiếm tiền",
  "phản động",
];

export function inspectCommentContent(
  content: string,
): {
  status: ForumCommentStatus;
  reason?: string;
} {
  const normalized = content
    .trim()
    .toLowerCase();

  const matchedKeyword =
    COMMENT_REVIEW_KEYWORDS.find(
      (keyword) =>
        normalized.includes(keyword),
    );

  if (matchedKeyword) {
    return {
      status: "pending",
      reason:
        `Bình luận chứa từ khóa cần kiểm duyệt: “${matchedKeyword}”.`,
    };
  }

  const repeatedCharacters =
    /(.)\1{8,}/.test(normalized);

  const manyLinks =
    (normalized.match(
      /https?:\/\/|www\./g,
    )?.length ?? 0) >= 2;

  if (
    repeatedCharacters ||
    manyLinks
  ) {
    return {
      status: "pending",
      reason:
        "Bình luận có dấu hiệu spam và cần moderator kiểm tra.",
    };
  }

  return {
    status: "published",
  };
}

export function getForumPostById(
  postId: string,
) {
  return forumPosts.find(
    (post) => post.id === postId,
  );
}

export function getForumCommentsByPostId(
  postId: string,
) {
  return forumComments.filter(
    (comment) =>
      comment.postId === postId,
  );
}
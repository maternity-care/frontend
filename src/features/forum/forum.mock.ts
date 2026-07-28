export type ForumCategory =
  | "pregnancy"
  | "nutrition"
  | "experience"
  | "newborn"
  | "doctor";

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

export type ForumPost = {
  id: string;
  title: string;
  excerpt: string;
  category: ForumCategory;
  categoryLabel: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  views: number;
  comments: number;
  likes: number;
  verified?: boolean;
  featured?: boolean;
  tags: string[];
  content: ForumContentBlock[];
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
    value: "experience",
    label: "Kinh nghiệm",
  },
  {
    value: "newborn",
    label: "Sau sinh",
  },
  {
    value: "doctor",
    label: "Bác sĩ tư vấn",
  },
] as const;

export const forumPosts: ForumPost[] = [
  {
    id: "dau-hieu-can-kham-ba-thang-dau",
    title:
      "Những dấu hiệu cần đi khám ngay trong ba tháng đầu thai kỳ",
    excerpt:
      "Các dấu hiệu cảnh báo mẹ bầu không nên chủ quan và thời điểm cần đến cơ sở y tế.",
    category: "doctor",
    categoryLabel: "Bác sĩ tư vấn",
    author: "BS. Nguyễn Minh Anh",
    authorRole: "Bác sĩ Sản phụ khoa",
    publishedAt: "28/07/2026",
    readTime: "7 phút đọc",
    views: 1280,
    comments: 42,
    likes: 186,
    verified: true,
    featured: true,
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
        type: "heading",
        text: "3. Nôn quá nhiều và không thể ăn uống",
      },
      {
        type: "paragraph",
        text:
          "Buồn nôn thường gặp trong thai kỳ. Tuy nhiên, nếu nôn liên tục, không giữ được thức ăn hoặc nước, tiểu ít, mệt lả hay sụt cân, mẹ bầu có nguy cơ mất nước và cần được hỗ trợ.",
      },
      {
        type: "heading",
        text: "4. Sốt cao, khó thở hoặc đau đầu dữ dội",
      },
      {
        type: "list",
        items: [
          "Sốt từ 38°C trở lên và kéo dài.",
          "Khó thở, đau ngực hoặc tim đập nhanh bất thường.",
          "Đau đầu dữ dội, nhìn mờ hoặc choáng váng.",
          "Dịch âm đạo có mùi bất thường hoặc gây ngứa rát.",
        ],
      },
      {
        type: "heading",
        text: "Mẹ bầu nên chuẩn bị gì khi đi khám?",
      },
      {
        type: "list",
        items: [
          "Ghi lại thời điểm bắt đầu triệu chứng và mức độ thay đổi.",
          "Mang theo hồ sơ khám thai, đơn thuốc và kết quả xét nghiệm gần nhất.",
          "Không tự lái xe khi đang chóng mặt, đau nhiều hoặc ra máu.",
          "Liên hệ cơ sở y tế gần nhất khi triệu chứng tiến triển nhanh.",
        ],
      },
      {
        type: "paragraph",
        text:
          "Nội dung bài viết mang tính tham khảo và không thay thế chẩn đoán trực tiếp. Mỗi thai kỳ có đặc điểm riêng, vì vậy mẹ bầu nên trao đổi với bác sĩ đang theo dõi thai kỳ khi có bất kỳ dấu hiệu bất thường nào.",
      },
    ],
  },
  {
    id: "thuc-don-tam-ca-nguyet-hai",
    title:
      "Thực đơn một ngày cho mẹ bầu ở tam cá nguyệt thứ hai",
    excerpt:
      "Gợi ý các nhóm thực phẩm và cách sắp xếp bữa ăn để đảm bảo năng lượng.",
    category: "nutrition",
    categoryLabel: "Dinh dưỡng",
    author: "Ngọc Mai",
    authorRole: "Thành viên cộng đồng",
    publishedAt: "27/07/2026",
    readTime: "5 phút đọc",
    views: 824,
    comments: 31,
    likes: 97,
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
  },
  {
    id: "chuan-bi-do-di-sinh",
    title:
      "Kinh nghiệm chuẩn bị đồ đi sinh gọn nhẹ nhưng đầy đủ",
    excerpt:
      "Danh sách đồ dùng cần thiết cho mẹ và bé được sắp xếp theo từng túi.",
    category: "experience",
    categoryLabel: "Kinh nghiệm",
    author: "Thanh Huyền",
    authorRole: "Mẹ bầu 36 tuần",
    publishedAt: "26/07/2026",
    readTime: "6 phút đọc",
    views: 1012,
    comments: 56,
    likes: 142,
    tags: [
      "Đi sinh",
      "Chuẩn bị sinh",
    ],
    content: [
      {
        type: "paragraph",
        text:
          "Chuẩn bị đồ đi sinh theo từng nhóm giúp gia đình dễ lấy khi cần và tránh mang quá nhiều vật dụng không cần thiết.",
      },
      {
        type: "list",
        items: [
          "Một túi hồ sơ và giấy tờ.",
          "Một túi đồ dùng cho mẹ.",
          "Một túi quần áo và khăn cho bé.",
          "Một túi nhỏ dùng trong phòng sinh.",
        ],
      },
    ],
  },
  {
    id: "lich-kham-thai-dinh-ky",
    title:
      "Lịch khám thai định kỳ theo từng giai đoạn",
    excerpt:
      "Các mốc khám quan trọng và những câu hỏi nên chuẩn bị trước khi gặp bác sĩ.",
    category: "pregnancy",
    categoryLabel: "Thai kỳ",
    author: "Ban biên tập MCS",
    authorRole: "Nội dung chuyên môn",
    publishedAt: "25/07/2026",
    readTime: "8 phút đọc",
    views: 1685,
    comments: 38,
    likes: 210,
    verified: true,
    tags: [
      "Lịch khám",
      "Thai kỳ",
    ],
    content: [
      {
        type: "paragraph",
        text:
          "Lịch khám cụ thể phụ thuộc vào tình trạng sức khỏe của mẹ và thai nhi. Bác sĩ có thể điều chỉnh số lần khám dựa trên kết quả theo dõi.",
      },
    ],
  },
];

export function getForumPostById(
  postId: string,
) {
  return forumPosts.find(
    (post) => post.id === postId,
  );
}
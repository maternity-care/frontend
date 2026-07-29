"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  Alert, App, Button, Card, Col, Divider, Dropdown, Empty, Form, Input,
  Modal, Row, Segmented, Select, Space, Statistic, Switch, Table, Tag,
  Tooltip, Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, BadgeCheck, Ban,
  Bold, CheckCircle2, CircleAlert, Eye, EyeOff, FileText, Flag, Heading1,
  Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Lock,
  MessageCircle, MessagesSquare, MoreHorizontal, Pencil, Pin, Plus,
  Redo2, RotateCcw, Search, ShieldAlert, ShieldCheck, Star, Tags,
  Trash2, Underline, Undo2, UserRound, UserX, X, XCircle,
} from "lucide-react";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

type ForumView = "posts" | "comments" | "reports" | "categories";
type PostStatus = "pending" | "published" | "hidden" | "rejected" | "deleted";
type CommentStatus = "pending" | "published" | "hidden" | "deleted";
type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
type CategoryStatus = "active" | "inactive";
type AuthorType = "user" | "doctor" | "admin" | "moderator";
type MemberStatus = "active" | "warned" | "suspended";
type PostAction = "approve" | "hide" | "reject" | "delete" | "restore" | "lock" | "unlock" | "pin" | "unpin" | "feature" | "unfeature";
type CommentAction = "approve" | "hide" | "delete";
type ReportAction = "resolve" | "dismiss";
type UserAction = "warn" | "ban";
type Action = PostAction | CommentAction | ReportAction | UserAction;

type LogItem = { id: string; action: Action; actor: string; role: string; reason: string; createdAt: string };
type ForumCategory = { id: string; name: string; slug: string; description: string; status: CategoryStatus };
type ForumPost = {
  id: string; title: string; excerpt: string; content: string; categoryId: string;
  authorId: string; authorName: string; authorEmail: string; authorType: AuthorType;
  tags: string[]; status: PostStatus; isPinned: boolean; isFeatured: boolean;
  isLocked: boolean; isMedicalSensitive: boolean; views: number; comments: number;
  reportCount: number; createdAt: string; updatedAt: string; publishedAt?: string;
  logs: LogItem[];
};
type ForumComment = {
  id: string; postId: string; authorId: string; authorName: string;
  authorEmail: string; authorType: AuthorType; content: string;
  status: CommentStatus; flags: string[]; reportCount: number;
  createdAt: string; updatedAt: string;
};
type ReportReason = "spam" | "advertising" | "medical" | "wrong_topic" | "abusive" | "political" | "other";
type ForumReport = {
  id: string; targetType: "post" | "comment"; targetId: string;
  reporterName: string; reporterEmail: string; reason: ReportReason;
  description: string; status: ReportStatus; createdAt: string;
  handledAt?: string; handledBy?: string; resolution?: string;
};
type PostFormValues = {
  title: string; excerpt: string; content: string; categoryId: string;
  tags: string[]; status: PostStatus; isPinned: boolean; isFeatured: boolean;
  isLocked: boolean; isMedicalSensitive: boolean;
};
type CategoryFormValues = { name: string; slug: string; description: string; status: CategoryStatus };
type ActionRequest =
  | { kind: "post"; action: PostAction; post: ForumPost; reportId?: string }
  | { kind: "comment"; action: CommentAction; comment: ForumComment; reportId?: string }
  | { kind: "report"; action: ReportAction; report: ForumReport }
  | { kind: "user"; action: UserAction; userId: string; userName: string; reportId?: string };

const MODERATOR = { name: "Nguyễn Lan", role: "Moderator nội dung" };
const CATEGORY_OPTIONS: ForumCategory[] = [
  { id: "CAT-01", name: "Thai kỳ", slug: "thai-ky", description: "Trao đổi về quá trình mang thai và theo dõi sức khỏe.", status: "active" },
  { id: "CAT-02", name: "Dinh dưỡng", slug: "dinh-duong", description: "Thực đơn và dinh dưỡng cho mẹ và bé.", status: "active" },
  { id: "CAT-03", name: "Sau sinh", slug: "sau-sinh", description: "Chăm sóc mẹ và trẻ sơ sinh sau sinh.", status: "active" },
  { id: "CAT-04", name: "Hỏi bác sĩ", slug: "hoi-bac-si", description: "Hỏi đáp cùng bác sĩ xác thực.", status: "active" },
  { id: "CAT-05", name: "Kinh nghiệm đặt lịch", slug: "kinh-nghiem-dat-lich", description: "Kinh nghiệm đặt lịch và chuẩn bị khi đến khám.", status: "active" },
];
const POSTS: ForumPost[] = [
  {
    id: "POST-001", title: "Đau bụng nhẹ ở tuần thứ 10 có cần đi khám ngay không?",
    excerpt: "Thai phụ hỏi về tình trạng đau bụng nhẹ không kèm ra máu.",
    content: "<p>Em mang thai tuần thứ 10, thỉnh thoảng đau lâm râm bụng dưới nhưng không ra máu. Em có cần đi khám ngay không ạ?</p>",
    categoryId: "CAT-04", authorId: "USER-01", authorName: "Minh Thư",
    authorEmail: "minhthu@gmail.com", authorType: "user", tags: ["tuần 10", "đau bụng"],
    status: "pending", isPinned: false, isFeatured: false, isLocked: false,
    isMedicalSensitive: true, views: 0, comments: 0, reportCount: 0,
    createdAt: "2026-07-29T08:30:00.000Z", updatedAt: "2026-07-29T08:30:00.000Z",
    logs: [{ id: "LOG-001", action: "approve", actor: "Hệ thống", role: "Tự động", reason: "Bài mới được đưa vào hàng chờ kiểm duyệt.", createdAt: "2026-07-29T08:30:00.000Z" }],
  },
  {
    id: "POST-002", title: "Những dấu hiệu cần đi khám ngay trong ba tháng đầu thai kỳ",
    excerpt: "Các dấu hiệu cảnh báo thai phụ không nên chủ quan.",
    content: "<p>Ba tháng đầu là giai đoạn quan trọng.</p><h2>Khi nào cần đi khám?</h2><ul><li>Ra máu đỏ tươi.</li><li>Đau bụng dữ dội.</li><li>Sốt cao hoặc khó thở.</li></ul><p>Thông tin tham khảo, không thay thế tư vấn bác sĩ.</p>",
    categoryId: "CAT-01", authorId: "DOC-01", authorName: "BS. Nguyễn Minh Anh",
    authorEmail: "minhanh.doctor@mcscare.vn", authorType: "doctor",
    tags: ["ba tháng đầu", "dấu hiệu cảnh báo"], status: "published",
    isPinned: true, isFeatured: true, isLocked: false, isMedicalSensitive: true,
    views: 1280, comments: 42, reportCount: 1,
    createdAt: "2026-07-28T03:15:00.000Z", updatedAt: "2026-07-28T04:05:00.000Z",
    publishedAt: "2026-07-28T04:00:00.000Z",
    logs: [
      { id: "LOG-002", action: "approve", actor: "Trần Hà", role: "Moderator", reason: "Nội dung phù hợp, tác giả là bác sĩ xác thực.", createdAt: "2026-07-28T04:00:00.000Z" },
      { id: "LOG-003", action: "pin", actor: "Trần Hà", role: "Moderator", reason: "Ghim cảnh báo sức khỏe quan trọng.", createdAt: "2026-07-28T04:05:00.000Z" },
    ],
  },
  {
    id: "POST-003", title: "Thuốc gia truyền cam kết hết nghén sau ba ngày",
    excerpt: "Bài quảng cáo sản phẩm không rõ nguồn gốc.",
    content: "<p>Ai cần thuốc hết nghén thì nhắn tin riêng để mua.</p>",
    categoryId: "CAT-02", authorId: "USER-02", authorName: "Tài khoản quảng cáo",
    authorEmail: "quangcao@gmail.com", authorType: "user", tags: ["thuốc", "quảng cáo"],
    status: "hidden", isPinned: false, isFeatured: false, isLocked: true,
    isMedicalSensitive: true, views: 68, comments: 3, reportCount: 6,
    createdAt: "2026-07-28T08:20:00.000Z", updatedAt: "2026-07-28T09:01:00.000Z",
    logs: [{ id: "LOG-004", action: "hide", actor: "Nguyễn Lan", role: "Moderator", reason: "Quảng cáo thuốc không rõ nguồn gốc.", createdAt: "2026-07-28T09:00:00.000Z" }],
  },
  {
    id: "POST-004", title: "Kinh nghiệm đặt lịch khám vào cuối tuần",
    excerpt: "Chia sẻ thời điểm đặt lịch và giấy tờ nên chuẩn bị.",
    content: "<p>Mình thường đặt lịch trước từ ba đến năm ngày và mang theo kết quả xét nghiệm gần nhất.</p>",
    categoryId: "CAT-05", authorId: "USER-03", authorName: "Thanh Huyền",
    authorEmail: "thanhhuyen@gmail.com", authorType: "user", tags: ["đặt lịch", "cuối tuần"],
    status: "published", isPinned: false, isFeatured: false, isLocked: false,
    isMedicalSensitive: false, views: 214, comments: 12, reportCount: 0,
    createdAt: "2026-07-27T06:20:00.000Z", updatedAt: "2026-07-27T07:10:00.000Z",
    publishedAt: "2026-07-27T07:10:00.000Z",
    logs: [{ id: "LOG-005", action: "approve", actor: "Lê Minh", role: "Staff kiểm duyệt", reason: "Đúng chủ đề và không chứa nội dung xấu.", createdAt: "2026-07-27T07:10:00.000Z" }],
  },
];
const COMMENTS: ForumComment[] = [
  { id: "COM-01", postId: "POST-002", authorId: "USER-04", authorName: "Hải Yến", authorEmail: "haiyen@gmail.com", authorType: "user", content: "Bài viết rất hữu ích, cảm ơn bác sĩ.", status: "published", flags: [], reportCount: 0, createdAt: "2026-07-28T06:10:00.000Z", updatedAt: "2026-07-28T06:10:00.000Z" },
  { id: "COM-02", postId: "POST-002", authorId: "DOC-01", authorName: "BS. Nguyễn Minh Anh", authorEmail: "minhanh.doctor@mcscare.vn", authorType: "doctor", content: "Khi đau tăng dần hoặc ra máu, thai phụ nên đến cơ sở y tế để được đánh giá trực tiếp.", status: "published", flags: [], reportCount: 0, createdAt: "2026-07-28T07:00:00.000Z", updatedAt: "2026-07-28T07:00:00.000Z" },
  { id: "COM-03", postId: "POST-003", authorId: "USER-02", authorName: "Tài khoản quảng cáo", authorEmail: "quangcao@gmail.com", authorType: "user", content: "Ai cần mua thuốc thì nhắn Telegram, cam kết khỏi hoàn toàn.", status: "pending", flags: ["Quảng cáo thuốc", "Liên hệ ngoài hệ thống", "Tuyên bố điều trị tuyệt đối"], reportCount: 3, createdAt: "2026-07-28T08:30:00.000Z", updatedAt: "2026-07-28T08:30:00.000Z" },
];
const REPORTS: ForumReport[] = [
  { id: "REP-001", targetType: "post", targetId: "POST-003", reporterName: "Nguyễn Mai", reporterEmail: "nguyenmai@gmail.com", reason: "advertising", description: "Bài quảng cáo thuốc không rõ nguồn gốc.", status: "open", createdAt: "2026-07-28T08:35:00.000Z" },
  { id: "REP-002", targetType: "comment", targetId: "COM-03", reporterName: "Lê Hương", reporterEmail: "lehuong@gmail.com", reason: "medical", description: "Bình luận cam kết chữa khỏi và bán thuốc qua Telegram.", status: "reviewing", createdAt: "2026-07-28T08:40:00.000Z", handledBy: "Nguyễn Lan" },
];
const MEMBER_STATUS: Record<string, MemberStatus> = { "USER-01": "active", "USER-02": "warned", "USER-03": "active", "USER-04": "active", "DOC-01": "active" };

const POST_STATUS = [
  { value: "pending", label: "Chờ duyệt" }, { value: "published", label: "Đã xuất bản" },
  { value: "hidden", label: "Đã ẩn" }, { value: "rejected", label: "Đã từ chối" },
  { value: "deleted", label: "Đã xóa mềm" },
] satisfies Array<{ value: PostStatus; label: string }>;
const COMMENT_STATUS = [
  { value: "pending", label: "Chờ duyệt" }, { value: "published", label: "Đã hiển thị" },
  { value: "hidden", label: "Đã ẩn" }, { value: "deleted", label: "Đã xóa mềm" },
] satisfies Array<{ value: CommentStatus; label: string }>;
const REPORT_STATUS = [
  { value: "open", label: "Chưa xử lý" }, { value: "reviewing", label: "Đang xử lý" },
  { value: "resolved", label: "Đã xử lý" }, { value: "dismissed", label: "Đã bỏ qua" },
] satisfies Array<{ value: ReportStatus; label: string }>;

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function postStatusTag(status: PostStatus) {
  const colors: Record<PostStatus, string> = { pending: "gold", published: "green", hidden: "orange", rejected: "red", deleted: "default" };
  return <Tag color={colors[status]}>{POST_STATUS.find((item) => item.value === status)?.label}</Tag>;
}
function commentStatusTag(status: CommentStatus) {
  const colors: Record<CommentStatus, string> = { pending: "gold", published: "green", hidden: "orange", deleted: "default" };
  return <Tag color={colors[status]}>{COMMENT_STATUS.find((item) => item.value === status)?.label}</Tag>;
}
function reportStatusTag(status: ReportStatus) {
  const colors: Record<ReportStatus, string> = { open: "red", reviewing: "gold", resolved: "green", dismissed: "default" };
  return <Tag color={colors[status]}>{REPORT_STATUS.find((item) => item.value === status)?.label}</Tag>;
}
function authorTag(type: AuthorType) {
  if (type === "doctor") return <Tag color="blue" icon={<BadgeCheck className="h-3.5 w-3.5" />}>Bác sĩ xác thực</Tag>;
  if (type === "admin" || type === "moderator") return <Tag color="purple">Nhân sự hệ thống</Tag>;
  return <Tag>Thành viên</Tag>;
}
function memberTag(status: MemberStatus) {
  if (status === "suspended") return <Tag color="red">Đang tạm khóa</Tag>;
  if (status === "warned") return <Tag color="gold">Đã cảnh báo</Tag>;
  return <Tag color="green">Bình thường</Tag>;
}
function reasonLabel(reason: ReportReason) {
  return ({ spam: "Spam", advertising: "Quảng cáo", medical: "Thông tin y tế sai lệch", wrong_topic: "Sai chủ đề", abusive: "Ngôn từ không phù hợp", political: "Nội dung chính trị/phản động", other: "Lý do khác" })[reason];
}
function actionLabel(action: Action) {
  return ({ approve: "Duyệt và xuất bản", hide: "Ẩn nội dung", reject: "Từ chối bài", delete: "Xóa mềm", restore: "Khôi phục", lock: "Khóa bình luận", unlock: "Mở bình luận", pin: "Ghim bài", unpin: "Bỏ ghim", feature: "Đánh dấu nổi bật", unfeature: "Bỏ nổi bật", resolve: "Đánh dấu đã xử lý", dismiss: "Bỏ qua báo cáo", warn: "Cảnh báo người dùng", ban: "Tạm khóa người dùng" })[action];
}
function actionIcon(action: Action) {
  if (action === "approve") return <CheckCircle2 className="h-4 w-4" />;
  if (action === "hide") return <EyeOff className="h-4 w-4" />;
  if (action === "reject") return <XCircle className="h-4 w-4" />;
  if (action === "delete") return <Trash2 className="h-4 w-4" />;
  if (action === "restore") return <RotateCcw className="h-4 w-4" />;
  if (action === "lock" || action === "unlock") return <Lock className="h-4 w-4" />;
  if (action === "pin" || action === "unpin") return <Pin className="h-4 w-4" />;
  if (action === "feature" || action === "unfeature") return <Star className="h-4 w-4" />;
  if (action === "warn") return <ShieldAlert className="h-4 w-4" />;
  if (action === "ban") return <UserX className="h-4 w-4" />;
  if (action === "resolve") return <ShieldCheck className="h-4 w-4" />;
  return <X className="h-4 w-4" />;
}

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Nhập nội dung bài viết...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef =
    useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (
      editor &&
      editor.innerHTML !== value
    ) {
      editor.innerHTML = value;
    }
  }, [value]);

  function emitChange() {
    onChange?.(
      editorRef.current?.innerHTML ?? "",
    );
  }

  function saveSelection() {
    const selection = window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0 ||
      !editorRef.current
    ) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (
      editorRef.current.contains(
        range.commonAncestorContainer,
      )
    ) {
      savedRangeRef.current =
        range.cloneRange();
    }
  }

  function restoreSelection() {
    const range = savedRangeRef.current;
    const selection = window.getSelection();

    if (!range || !selection) return;

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function focusEditor() {
    editorRef.current?.focus();
    restoreSelection();
  }

  function runCommand(
    command: string,
    commandValue?: string,
  ) {
    focusEditor();
    document.execCommand(
      "styleWithCSS",
      false,
      "true",
    );
    document.execCommand(
      command,
      false,
      commandValue,
    );
    emitChange();
    saveSelection();
  }

  function insertLink() {
    saveSelection();

    const href = window.prompt(
      "Nhập đường dẫn liên kết:",
      "https://",
    );

    if (!href) return;

    runCommand("createLink", href);
  }

  function openImagePicker() {
    saveSelection();
    imageInputRef.current?.click();
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      focusEditor();

      document.execCommand(
        "insertHTML",
        false,
        `<p><img src="${reader.result}" alt="Ảnh bài viết" style="display:block;max-width:100%;height:auto;margin:12px auto;border-radius:10px;" /></p><p><br></p>`,
      );

      emitChange();
      saveSelection();
    };

    reader.readAsDataURL(file);
  }

  const toolbarButtonClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-950";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div
        className="flex w-full flex-nowrap items-center gap-0.5 overflow-hidden whitespace-nowrap border-b border-slate-200 bg-slate-50 px-2 py-2"
        onMouseDown={saveSelection}
      >
        <Tooltip title="Hoàn tác">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("undo")
            }
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Làm lại">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("redo")
            }
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-1 h-5 w-px shrink-0 bg-slate-300" />

        <Select
          size="small"
          defaultValue="p"
          popupMatchSelectWidth={false}
          style={{
            width: 84,
            minWidth: 84,
            maxWidth: 84,
            flex: "0 0 84px",
          }}
          options={[
            {
              value: "p",
              label: "Văn bản",
            },
            {
              value: "h1",
              label: "Tiêu đề 1",
            },
            {
              value: "h2",
              label: "Tiêu đề 2",
            },
            {
              value: "h3",
              label: "Tiêu đề 3",
            },
          ]}
          onOpenChange={(open) => {
            if (open) saveSelection();
          }}
          onChange={(nextValue) =>
            runCommand(
              "formatBlock",
              nextValue,
            )
          }
        />

        <Select
          size="small"
          defaultValue="3"
          popupMatchSelectWidth={false}
          style={{
            width: 68,
            minWidth: 68,
            maxWidth: 68,
            flex: "0 0 68px",
          }}
          options={[
            {
              value: "2",
              label: "12 px",
            },
            {
              value: "3",
              label: "16 px",
            },
            {
              value: "4",
              label: "18 px",
            },
            {
              value: "5",
              label: "24 px",
            },
            {
              value: "6",
              label: "32 px",
            },
          ]}
          onOpenChange={(open) => {
            if (open) saveSelection();
          }}
          onChange={(nextValue) =>
            runCommand(
              "fontSize",
              nextValue,
            )
          }
        />

        <span className="mx-1 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="In đậm">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("bold")
            }
          >
            <Bold className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="In nghiêng">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("italic")
            }
          >
            <Italic className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Gạch chân">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("underline")
            }
          >
            <Underline className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Tiêu đề lớn">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "formatBlock",
                "h1",
              )
            }
          >
            <Heading1 className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Tiêu đề phụ">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "formatBlock",
                "h2",
              )
            }
          >
            <Heading2 className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-1 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="Căn trái">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("justifyLeft")
            }
          >
            <AlignLeft className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn giữa">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("justifyCenter")
            }
          >
            <AlignCenter className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn phải">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("justifyRight")
            }
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn đều">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand("justifyFull")
            }
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-1 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="Danh sách dấu chấm">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "insertUnorderedList",
              )
            }
          >
            <List className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Danh sách đánh số">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "insertOrderedList",
              )
            }
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Chèn liên kết">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={insertLink}
          >
            <Link2 className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Chọn ảnh từ máy">
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={openImagePicker}
          >
            <ImagePlus className="h-4 w-4 shrink-0" />
            <span>Chọn tệp</span>
          </button>
        </Tooltip>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{
            display: "none",
          }}
          onChange={handleImageChange}
        />
      </div>

      <div className="relative">
        {!value ? (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">
            {placeholder}
          </span>
        ) : null}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[300px] px-4 py-3 text-sm leading-7 text-slate-800 outline-none [&_a]:text-blue-600 [&_a]:underline [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
          onInput={emitChange}
          onBlur={() => {
            emitChange();
            saveSelection();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
        />
      </div>
    </div>
  );
}


type PostFormModalProps = { open: boolean; post: ForumPost | null; categories: ForumCategory[]; onClose: () => void; onSave: (values: PostFormValues) => void };
function PostFormModal({ open, post, categories, onClose, onSave }: PostFormModalProps) {
  const [form] = Form.useForm<PostFormValues>();
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (post) form.setFieldsValue({ title: post.title, excerpt: post.excerpt, content: post.content, categoryId: post.categoryId, tags: post.tags, status: post.status, isPinned: post.isPinned, isFeatured: post.isFeatured, isLocked: post.isLocked, isMedicalSensitive: post.isMedicalSensitive });
      else { form.resetFields(); form.setFieldsValue({ title: "", excerpt: "", content: "", categoryId: undefined, tags: [], status: "published", isPinned: false, isFeatured: false, isLocked: false, isMedicalSensitive: true }); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [form, open, post]);
  return (
    <Modal open={open} centered width={940} forceRender destroyOnHidden={false} title={post ? "Cập nhật bài viết" : "Đăng bài viết từ hệ thống"} okText={post ? "Lưu thay đổi" : "Đăng bài viết"} cancelText="Hủy" onCancel={onClose} onOk={() => form.submit()} mask={{ closable: true }} styles={{ body: { maxHeight: "74vh", overflowY: "auto", paddingRight: 8 } }}>
      <Form<PostFormValues> form={form} layout="vertical" requiredMark="optional" onFinish={onSave}>
        {!post ? <Alert className="mb-4" type="info" showIcon title="Bài do Admin, Staff hoặc Moderator đăng có thể xuất bản ngay." description="Bài do người dùng gửi vẫn phải qua trạng thái Chờ duyệt." /> : null}
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tiêu đề." }, { max: 180, message: "Tiêu đề tối đa 180 ký tự." }]}><Input showCount maxLength={180} placeholder="Nhập tiêu đề bài viết" /></Form.Item>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}><Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: "Vui lòng chọn danh mục." }]}><Select showSearch optionFilterProp="label" placeholder="Chọn danh mục" options={categories.filter((item) => item.status === "active").map((item) => ({ value: item.id, label: item.name }))} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}><Select options={POST_STATUS} /></Form.Item></Col>
        </Row>
        <Form.Item name="excerpt" label="Mô tả ngắn" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mô tả." }, { max: 300, message: "Mô tả tối đa 300 ký tự." }]}><TextArea rows={3} showCount maxLength={300} placeholder="Mô tả ngắn nội dung bài viết" /></Form.Item>
        <Form.Item name="content" label="Nội dung bài viết" rules={[{ validator: async (_, content?: string) => { const text = String(content ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim(); const hasImage = /<img[\s\S]*?>/i.test(String(content ?? "")); if (!text && !hasImage) throw new Error("Vui lòng nhập nội dung bài viết."); } }]}><RichTextEditor /></Form.Item>
        <Form.Item name="tags" label="Thẻ nội dung"><Select mode="tags" tokenSeparators={[","]} placeholder="Nhập thẻ và nhấn Enter" /></Form.Item>
        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchField name="isPinned" title="Ghim bài viết" description="Đưa chủ đề lên vị trí ưu tiên." />
          <SwitchField name="isFeatured" title="Đánh dấu nổi bật" description="Hiển thị nhãn nội dung nổi bật." />
          <SwitchField name="isLocked" title="Khóa bình luận" description="Không cho gửi bình luận mới." />
          <SwitchField name="isMedicalSensitive" title="Nội dung y tế nhạy cảm" description="Hiện cảnh báo thông tin tham khảo." />
        </div>
      </Form>
    </Modal>
  );
}
function SwitchField({ name, title, description }: { name: keyof Pick<PostFormValues, "isPinned" | "isFeatured" | "isLocked" | "isMedicalSensitive">; title: string; description: string }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"><div className="pr-4"><Text strong className="block">{title}</Text><Text type="secondary" className="text-xs">{description}</Text></div><Form.Item name={name} valuePropName="checked" noStyle><Switch /></Form.Item></div>;
}
function CategoryFormModal({ open, category, onClose, onSave }: { open: boolean; category: ForumCategory | null; onClose: () => void; onSave: (values: CategoryFormValues) => void }) {
  const [form] = Form.useForm<CategoryFormValues>();
  useEffect(() => { if (!open) return; const timer = window.setTimeout(() => { if (category) form.setFieldsValue(category); else { form.resetFields(); form.setFieldsValue({ name: "", slug: "", description: "", status: "active" }); } }, 0); return () => window.clearTimeout(timer); }, [category, form, open]);
  return <Modal open={open} centered width={620} forceRender destroyOnHidden={false} title={category ? "Cập nhật danh mục" : "Thêm danh mục"} okText={category ? "Lưu thay đổi" : "Tạo danh mục"} cancelText="Hủy" onCancel={onClose} onOk={() => form.submit()} mask={{ closable: true }}><Form<CategoryFormValues> form={form} layout="vertical" onFinish={onSave}><Row gutter={[16, 0]}><Col xs={24} md={12}><Form.Item name="name" label="Tên danh mục" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên danh mục." }]}><Input /></Form.Item></Col><Col xs={24} md={12}><Form.Item name="slug" label="Slug" rules={[{ required: true, message: "Vui lòng nhập slug." }, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "Slug không hợp lệ." }]}><Input /></Form.Item></Col></Row><Form.Item name="description" label="Mô tả" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mô tả." }]}><TextArea rows={4} /></Form.Item><Form.Item name="status" label="Trạng thái"><Select options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]} /></Form.Item></Form></Modal>;
}
function ReasonModal({ request, onClose, onConfirm }: { request: ActionRequest | null; onClose: () => void; onConfirm: (request: ActionRequest, reason: string) => void }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (!request) return; const timer = window.setTimeout(() => setReason(""), 0); return () => window.clearTimeout(timer); }, [request]);
  if (!request) return null;
  const target = request.kind === "post" ? request.post.title : request.kind === "comment" ? request.comment.content : request.kind === "report" ? request.report.id : request.userName;
  const danger = ["hide", "reject", "delete", "ban"].includes(request.action);
  return <Modal open centered width={520} title={actionLabel(request.action)} okText={actionLabel(request.action)} cancelText="Hủy" okButtonProps={{ danger }} onCancel={onClose} onOk={() => { if (!reason.trim()) return; onConfirm(request, reason.trim()); }} mask={{ closable: true }}><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><Text type="secondary" className="block text-xs">Đối tượng xử lý</Text><Text strong className="mt-1 block line-clamp-2">{target}</Text></div><div className="mt-4"><label className="mb-2 block text-sm font-semibold">Lý do kiểm duyệt <span className="text-red-500">*</span></label><TextArea rows={4} maxLength={500} showCount value={reason} placeholder="Lý do sẽ được lưu vào lịch sử kiểm duyệt" onChange={(event) => setReason(event.target.value)} /></div></Modal>;
}

export default function ForumManagementPage() {
  const { message } = App.useApp();
  const [modal, modalHolder] = Modal.useModal();
  const [view, setView] = useState<ForumView>("posts");
  const [posts, setPosts] = useState(POSTS);
  const [comments, setComments] = useState(COMMENTS);
  const [reports, setReports] = useState(REPORTS);
  const [categories, setCategories] = useState(CATEGORY_OPTIONS);
  const [members, setMembers] = useState(MEMBER_STATUS);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>();
  const [postFilter, setPostFilter] = useState<PostStatus>();
  const [commentFilter, setCommentFilter] = useState<CommentStatus>();
  const [reportFilter, setReportFilter] = useState<ReportStatus>();
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [selectedComment, setSelectedComment] = useState<ForumComment | null>(null);
  const [selectedReport, setSelectedReport] = useState<ForumReport | null>(null);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [request, setRequest] = useState<ActionRequest | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const findPost = (postId: string) => posts.find((item) => item.id === postId);
  const findComment = (commentId: string) => comments.find((item) => item.id === commentId);
  const search = keyword.trim().toLowerCase();
  const filteredPosts = useMemo(() => posts.filter((item) => (!search || [item.id, item.title, item.excerpt, item.authorName, item.authorEmail, ...item.tags].some((value) => value.toLowerCase().includes(search))) && (!categoryFilter || item.categoryId === categoryFilter) && (!postFilter || item.status === postFilter)), [categoryFilter, postFilter, posts, search]);
  const filteredComments = useMemo(() => comments.filter((item) => (!search || [item.content, item.authorName, item.authorEmail, findPost(item.postId)?.title ?? "", ...item.flags].some((value) => value.toLowerCase().includes(search))) && (!commentFilter || item.status === commentFilter)), [commentFilter, comments, posts, search]);
  const filteredReports = useMemo(() => reports.filter((item) => { const target = item.targetType === "post" ? findPost(item.targetId)?.title : findComment(item.targetId)?.content; return (!search || [item.id, item.reporterName, item.reporterEmail, item.description, target ?? ""].some((value) => value.toLowerCase().includes(search))) && (!reportFilter || item.status === reportFilter); }), [comments, posts, reportFilter, reports, search]);
  const filteredCategories = useMemo(() => categories.filter((item) => !search || [item.id, item.name, item.slug, item.description].some((value) => value.toLowerCase().includes(search))), [categories, search]);
  const pendingCount = posts.filter((item) => item.status === "pending").length;
  const reportCount = reports.filter((item) => item.status === "open" || item.status === "reviewing").length;
  const flaggedCount = comments.filter((item) => item.status === "pending" || item.flags.length > 0).length;

  function resetFilters() { setKeyword(""); setCategoryFilter(undefined); setPostFilter(undefined); setCommentFilter(undefined); setReportFilter(undefined); }
  function savePost(values: PostFormValues) {
    const now = new Date().toISOString();
    if (editingPost) {
      const next = { ...editingPost, ...values, updatedAt: now, publishedAt: values.status === "published" ? editingPost.publishedAt ?? now : editingPost.publishedAt };
      setPosts((current) => current.map((item) => item.id === editingPost.id ? next : item));
      setSelectedPost((current) => current?.id === next.id ? next : current);
      message.success("Cập nhật bài viết thành công.");
    } else {
      setPosts((current) => [{ id: id("POST"), ...values, authorId: "MOD-01", authorName: MODERATOR.name, authorEmail: "moderator@mcscare.vn", authorType: "moderator", views: 0, comments: 0, reportCount: 0, createdAt: now, updatedAt: now, publishedAt: values.status === "published" ? now : undefined, logs: [{ id: id("LOG"), action: values.status === "published" ? "approve" : "hide", actor: MODERATOR.name, role: MODERATOR.role, reason: "Bài được tạo từ màn quản lý.", createdAt: now }] }, ...current]);
      message.success("Đăng bài viết thành công.");
    }
    setEditingPost(null); setPostFormOpen(false);
  }
  function resolveReport(reportId: string, reason: string, now: string) {
    setReports((current) => current.map((item) => item.id === reportId ? { ...item, status: "resolved", handledAt: now, handledBy: MODERATOR.name, resolution: reason } : item));
    setSelectedReport((current) => current?.id === reportId ? { ...current, status: "resolved", handledAt: now, handledBy: MODERATOR.name, resolution: reason } : current);
  }
  function applyAction(currentRequest: ActionRequest, reason: string) {
    const now = new Date().toISOString();
    if (currentRequest.kind === "post") {
      const { post, action } = currentRequest;
      const update = (item: ForumPost) => {
        const next = { ...item, updatedAt: now, logs: [...item.logs, { id: id("LOG"), action, actor: MODERATOR.name, role: MODERATOR.role, reason, createdAt: now }] };
        if (action === "approve") { next.status = "published"; next.publishedAt = item.publishedAt ?? now; }
        if (action === "hide") next.status = "hidden";
        if (action === "reject") next.status = "rejected";
        if (action === "delete") next.status = "deleted";
        if (action === "restore") next.status = "hidden";
        if (action === "lock") next.isLocked = true;
        if (action === "unlock") next.isLocked = false;
        if (action === "pin") next.isPinned = true;
        if (action === "unpin") next.isPinned = false;
        if (action === "feature") next.isFeatured = true;
        if (action === "unfeature") next.isFeatured = false;
        return next;
      };
      setPosts((current) => current.map((item) => item.id === post.id ? update(item) : item));
      setSelectedPost((current) => current?.id === post.id ? update(current) : current);
      if (currentRequest.reportId) resolveReport(currentRequest.reportId, reason, now);
    }
    if (currentRequest.kind === "comment") {
      const status: CommentStatus = currentRequest.action === "approve" ? "published" : currentRequest.action === "hide" ? "hidden" : "deleted";
      setComments((current) => current.map((item) => item.id === currentRequest.comment.id ? { ...item, status, updatedAt: now } : item));
      setSelectedComment((current) => current?.id === currentRequest.comment.id ? { ...current, status, updatedAt: now } : current);
      if (currentRequest.reportId) resolveReport(currentRequest.reportId, reason, now);
    }
    if (currentRequest.kind === "report") {
      const status: ReportStatus = currentRequest.action === "resolve" ? "resolved" : "dismissed";
      setReports((current) => current.map((item) => item.id === currentRequest.report.id ? { ...item, status, handledAt: now, handledBy: MODERATOR.name, resolution: reason } : item));
      setSelectedReport((current) => current?.id === currentRequest.report.id ? { ...current, status, handledAt: now, handledBy: MODERATOR.name, resolution: reason } : current);
    }
    if (currentRequest.kind === "user") {
      setMembers((current) => ({ ...current, [currentRequest.userId]: currentRequest.action === "warn" ? "warned" : "suspended" }));
      if (currentRequest.reportId) resolveReport(currentRequest.reportId, reason, now);
    }
    message.success(`${actionLabel(currentRequest.action)} thành công.`); setRequest(null);
  }
  function saveCategory(values: CategoryFormValues) {
    if (editingCategory) setCategories((current) => current.map((item) => item.id === editingCategory.id ? { ...item, ...values } : item));
    else setCategories((current) => [{ id: id("CAT"), ...values }, ...current]);
    message.success(editingCategory ? "Cập nhật danh mục thành công." : "Tạo danh mục thành công."); setEditingCategory(null); setCategoryFormOpen(false);
  }
  function deleteCategory(category: ForumCategory) {
    if (posts.some((item) => item.categoryId === category.id && item.status !== "deleted")) { modal.warning({ centered: true, title: "Không thể xóa danh mục", content: "Danh mục đang có bài viết chưa bị xóa.", okText: "Đóng" }); return; }
    modal.confirm({ centered: true, title: "Xóa danh mục?", content: category.name, okText: "Xóa", cancelText: "Hủy", okButtonProps: { danger: true }, onOk: () => setCategories((current) => current.filter((item) => item.id !== category.id)) });
  }
  function postMenu(post: ForumPost): MenuProps["items"] {
    const items: MenuProps["items"] = [];
    if (post.status !== "published" && post.status !== "deleted") items.push({ key: "approve", icon: actionIcon("approve"), label: actionLabel("approve"), onClick: () => setRequest({ kind: "post", action: "approve", post }) });
    if (post.status === "published") items.push({ key: "hide", icon: actionIcon("hide"), label: actionLabel("hide"), onClick: () => setRequest({ kind: "post", action: "hide", post }) });
    if (post.status === "pending") items.push({ key: "reject", icon: actionIcon("reject"), label: actionLabel("reject"), danger: true, onClick: () => setRequest({ kind: "post", action: "reject", post }) });
    items.push({ type: "divider" });
    items.push({ key: post.isLocked ? "unlock" : "lock", icon: actionIcon(post.isLocked ? "unlock" : "lock"), label: actionLabel(post.isLocked ? "unlock" : "lock"), onClick: () => setRequest({ kind: "post", action: post.isLocked ? "unlock" : "lock", post }) });
    items.push({ key: post.isPinned ? "unpin" : "pin", icon: actionIcon(post.isPinned ? "unpin" : "pin"), label: actionLabel(post.isPinned ? "unpin" : "pin"), onClick: () => setRequest({ kind: "post", action: post.isPinned ? "unpin" : "pin", post }) });
    items.push({ key: post.isFeatured ? "unfeature" : "feature", icon: actionIcon(post.isFeatured ? "unfeature" : "feature"), label: actionLabel(post.isFeatured ? "unfeature" : "feature"), onClick: () => setRequest({ kind: "post", action: post.isFeatured ? "unfeature" : "feature", post }) });
    items.push({ key: post.status === "deleted" ? "restore" : "delete", icon: actionIcon(post.status === "deleted" ? "restore" : "delete"), label: actionLabel(post.status === "deleted" ? "restore" : "delete"), danger: post.status !== "deleted", onClick: () => setRequest({ kind: "post", action: post.status === "deleted" ? "restore" : "delete", post }) });
    return items;
  }

  const postColumns: ColumnsType<ForumPost> = [
    { title: "STT", width: 64, align: "center", fixed: "left", render: (_, __, index) => index + 1 },
    { title: "Chủ đề", width: 380, render: (_, item) => <div className="min-w-0"><div className="flex items-center gap-2">{item.isPinned ? <Pin className="h-4 w-4 text-blue-600" /> : null}{item.isFeatured ? <Star className="h-4 w-4 text-amber-500" /> : null}{item.isLocked ? <Lock className="h-4 w-4 text-slate-500" /> : null}<Text strong className="truncate">{item.title}</Text></div><Text type="secondary" className="mt-1 block truncate text-xs">{item.excerpt}</Text><div className="mt-2 flex flex-wrap gap-1">{item.tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}</div></div> },
    { title: "Danh mục", width: 170, render: (_, item) => <Tag color="blue">{categoryMap.get(item.categoryId)?.name ?? "Chưa phân loại"}</Tag> },
    { title: "Người đăng", width: 220, render: (_, item) => <div><Text strong className="block">{item.authorName}</Text><div className="mt-1">{authorTag(item.authorType)}</div></div> },
    { title: "Kiểm duyệt", width: 150, align: "center", render: (_, item) => <div className="space-y-1">{postStatusTag(item.status)}{item.reportCount ? <Tag color="red">{item.reportCount} báo cáo</Tag> : null}</div> },
    { title: "Tương tác", width: 130, render: (_, item) => <div className="text-xs text-slate-600"><div>{item.views.toLocaleString("vi-VN")} lượt xem</div><div>{item.comments} bình luận</div></div> },
    { title: "Ngày gửi", dataIndex: "createdAt", width: 165, render: (value: string) => formatDateTime(value) },
    { title: "Thao tác", width: 190, fixed: "right", align: "center", render: (_, item) => <Space size={6}><Tooltip title="Xem chi tiết"><Button icon={<Eye className="h-4 w-4" />} onClick={(event) => { event.stopPropagation(); setSelectedPost(item); }} /></Tooltip><Tooltip title="Cập nhật"><Button icon={<Pencil className="h-4 w-4" />} onClick={(event) => { event.stopPropagation(); setEditingPost(item); setPostFormOpen(true); }} /></Tooltip>{item.status === "pending" ? <Tooltip title="Duyệt bài"><Button type="primary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={(event) => { event.stopPropagation(); setRequest({ kind: "post", action: "approve", post: item }); }} /></Tooltip> : null}<Dropdown trigger={["click"]} menu={{ items: postMenu(item) }}><Button icon={<MoreHorizontal className="h-4 w-4" />} onClick={(event) => event.stopPropagation()} /></Dropdown></Space> },
  ];
  const commentColumns: ColumnsType<ForumComment> = [
    { title: "STT", width: 64, align: "center", render: (_, __, index) => index + 1 },
    { title: "Bình luận", width: 440, render: (_, item) => <div><div className="flex items-center gap-2"><Text strong>{item.authorName}</Text>{authorTag(item.authorType)}</div><Paragraph ellipsis={{ rows: 2 }} className="!mb-1 !mt-2">{item.content}</Paragraph><Text type="secondary" className="text-xs">Chủ đề: {findPost(item.postId)?.title ?? "Không tìm thấy"}</Text></div> },
    { title: "Bộ lọc tự động", width: 250, render: (_, item) => item.flags.length ? <div className="space-y-1">{item.flags.map((flag) => <Tag key={flag} color="gold">{flag}</Tag>)}</div> : <Tag color="green">Không phát hiện</Tag> },
    { title: "Trạng thái", width: 140, align: "center", render: (_, item) => commentStatusTag(item.status) },
    { title: "Báo cáo", dataIndex: "reportCount", width: 100, align: "center", render: (value: number) => value ? <Tag color="red">{value}</Tag> : "0" },
    { title: "Ngày gửi", dataIndex: "createdAt", width: 165, render: (value: string) => formatDateTime(value) },
    { title: "Thao tác", width: 170, align: "center", render: (_, item) => <Space><Button icon={<Eye className="h-4 w-4" />} onClick={() => setSelectedComment(item)} />{item.status === "published" ? <Button icon={<EyeOff className="h-4 w-4" />} onClick={() => setRequest({ kind: "comment", action: "hide", comment: item })} /> : <Button type="primary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setRequest({ kind: "comment", action: "approve", comment: item })} />}<Button danger icon={<Trash2 className="h-4 w-4" />} onClick={() => setRequest({ kind: "comment", action: "delete", comment: item })} /></Space> },
  ];
  const reportColumns: ColumnsType<ForumReport> = [
    { title: "Mã báo cáo", dataIndex: "id", width: 130, render: (value: string) => <Text strong className="font-mono">{value}</Text> },
    { title: "Đối tượng", width: 350, render: (_, item) => <div><Tag color={item.targetType === "post" ? "blue" : "purple"}>{item.targetType === "post" ? "Bài viết" : "Bình luận"}</Tag><Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !mt-2">{item.targetType === "post" ? findPost(item.targetId)?.title : findComment(item.targetId)?.content}</Paragraph></div> },
    { title: "Lý do", width: 190, render: (_, item) => <div><Tag color="red">{reasonLabel(item.reason)}</Tag><Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !mt-2 !text-xs">{item.description}</Paragraph></div> },
    { title: "Người báo cáo", width: 190, render: (_, item) => <div><Text strong>{item.reporterName}</Text><Text type="secondary" className="block text-xs">{item.reporterEmail}</Text></div> },
    { title: "Trạng thái", width: 140, align: "center", render: (_, item) => reportStatusTag(item.status) },
    { title: "Ngày gửi", dataIndex: "createdAt", width: 165, render: (value: string) => formatDateTime(value) },
    { title: "Thao tác", width: 120, align: "center", render: (_, item) => <Button type={item.status === "open" ? "primary" : "default"} onClick={() => setSelectedReport(item)}>Xử lý</Button> },
  ];
  const categoryColumns: ColumnsType<ForumCategory> = [
    { title: "STT", width: 64, align: "center", render: (_, __, index) => index + 1 },
    { title: "Danh mục", width: 260, render: (_, item) => <div><Text strong className="block">{item.name}</Text><Text type="secondary" className="text-xs">/{item.slug}</Text></div> },
    { title: "Mô tả", dataIndex: "description", render: (value: string) => <Text type="secondary">{value}</Text> },
    { title: "Số bài", width: 120, align: "center", render: (_, item) => posts.filter((post) => post.categoryId === item.id && post.status !== "deleted").length },
    { title: "Trạng thái", width: 140, align: "center", render: (_, item) => <Tag color={item.status === "active" ? "green" : undefined}>{item.status === "active" ? "Hoạt động" : "Ngừng hoạt động"}</Tag> },
    { title: "Thao tác", width: 130, align: "center", render: (_, item) => <Space><Button icon={<Pencil className="h-4 w-4" />} onClick={() => { setEditingCategory(item); setCategoryFormOpen(true); }} /><Button danger icon={<Trash2 className="h-4 w-4" />} onClick={() => deleteCategory(item)} /></Space> },
  ];

  return (
    <AdminLayout>
      {modalHolder}
      <PageHeader title="Quản lý diễn đàn" description="Admin quản lý toàn bộ; Moderator hoặc Staff có quyền kiểm duyệt xử lý bài viết, bình luận và báo cáo hằng ngày." />
      <div className="mt-6 flex flex-col gap-5">
        <Alert type="info" showIcon title="Luồng kiểm duyệt nội dung" description="Bài người dùng gửi: Chờ duyệt → Đã xuất bản. Bình luận được lọc từ khóa và spam trước khi tự hiển thị." />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}><Card><Statistic title="Tổng bài viết" value={posts.length} prefix={<FileText className="mr-2 h-5 w-5 text-blue-600" />} /></Card></Col>
          <Col xs={24} sm={12} xl={6}><Card className="border-amber-100 bg-amber-50/60"><Statistic title="Bài chờ duyệt" value={pendingCount} prefix={<CircleAlert className="mr-2 h-5 w-5 text-amber-600" />} /></Card></Col>
          <Col xs={24} sm={12} xl={6}><Card className="border-red-100 bg-red-50/60"><Statistic title="Báo cáo cần xử lý" value={reportCount} prefix={<Flag className="mr-2 h-5 w-5 text-red-600" />} /></Card></Col>
          <Col xs={24} sm={12} xl={6}><Card className="border-purple-100 bg-purple-50/60"><Statistic title="Bình luận bị đánh dấu" value={flaggedCount} prefix={<ShieldAlert className="mr-2 h-5 w-5 text-purple-600" />} /></Card></Col>
        </Row>
        <Card className="border-slate-200 bg-white"><div className="flex flex-col gap-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><Segmented<ForumView> value={view} options={[{ value: "posts", label: <span className="flex items-center gap-2"><MessagesSquare className="h-4 w-4" />Bài viết</span> }, { value: "comments", label: <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />Bình luận</span> }, { value: "reports", label: <span className="flex items-center gap-2"><Flag className="h-4 w-4" />Báo cáo</span> }, { value: "categories", label: <span className="flex items-center gap-2"><Tags className="h-4 w-4" />Danh mục</span> }]} onChange={(next) => { setView(next); resetFilters(); }} /><div>{view === "posts" ? <Button type="primary" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditingPost(null); setPostFormOpen(true); }}>Đăng bài viết</Button> : null}{view === "categories" ? <Button type="primary" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditingCategory(null); setCategoryFormOpen(true); }}>Thêm danh mục</Button> : null}</div></div><div className="flex flex-col gap-3 lg:flex-row"><Input allowClear value={keyword} prefix={<Search className="h-4 w-4 text-slate-400" />} placeholder="Tìm nội dung, tác giả hoặc mã báo cáo..." onChange={(event) => setKeyword(event.target.value)} />{view === "posts" ? <><Select allowClear value={categoryFilter} className="w-full lg:w-[220px]" placeholder="Tất cả danh mục" options={categories.map((item) => ({ value: item.id, label: item.name }))} onChange={setCategoryFilter} /><Select allowClear value={postFilter} className="w-full lg:w-[190px]" placeholder="Tất cả trạng thái" options={POST_STATUS} onChange={setPostFilter} /></> : null}{view === "comments" ? <Select allowClear value={commentFilter} className="w-full lg:w-[190px]" placeholder="Trạng thái bình luận" options={COMMENT_STATUS} onChange={setCommentFilter} /> : null}{view === "reports" ? <Select allowClear value={reportFilter} className="w-full lg:w-[190px]" placeholder="Trạng thái báo cáo" options={REPORT_STATUS} onChange={setReportFilter} /> : null}<Button icon={<X className="h-4 w-4" />} onClick={resetFilters}>Xóa bộ lọc</Button></div></div></Card>
        <Card className="overflow-hidden border-slate-200 bg-white" styles={{ body: { padding: 0 } }} title={view === "posts" ? "Danh sách bài viết" : view === "comments" ? "Danh sách bình luận" : view === "reports" ? "Danh sách báo cáo" : "Danh sách danh mục"}>
          {view === "posts" ? <Table rowKey="id" size="middle" tableLayout="fixed" columns={postColumns} dataSource={filteredPosts} scroll={{ x: 1480 }} pagination={{ pageSize: 10, showSizeChanger: true }} onRow={(item) => ({ className: "cursor-pointer", onClick: (event) => { const target = event.target as HTMLElement; if (!target.closest("button") && !target.closest("a")) setSelectedPost(item); } })} className="management-table [&_.ant-table-cell]:px-3" /> : null}
          {view === "comments" ? <Table rowKey="id" size="middle" tableLayout="fixed" columns={commentColumns} dataSource={filteredComments} scroll={{ x: 1330 }} pagination={{ pageSize: 10 }} className="management-table [&_.ant-table-cell]:px-3" /> : null}
          {view === "reports" ? <Table rowKey="id" size="middle" tableLayout="fixed" columns={reportColumns} dataSource={filteredReports} scroll={{ x: 1300 }} pagination={{ pageSize: 10 }} className="management-table [&_.ant-table-cell]:px-3" /> : null}
          {view === "categories" ? <Table rowKey="id" size="middle" tableLayout="fixed" columns={categoryColumns} dataSource={filteredCategories} scroll={{ x: 960 }} pagination={{ pageSize: 10 }} className="management-table [&_.ant-table-cell]:px-3" /> : null}
        </Card>
      </div>
      <PostFormModal open={postFormOpen} post={editingPost} categories={categories} onClose={() => { setPostFormOpen(false); setEditingPost(null); }} onSave={savePost} />
      <CategoryFormModal open={categoryFormOpen} category={editingCategory} onClose={() => { setCategoryFormOpen(false); setEditingCategory(null); }} onSave={saveCategory} />
      <PostDetail post={selectedPost} categoryName={selectedPost ? categoryMap.get(selectedPost.categoryId)?.name : undefined} memberStatus={selectedPost ? members[selectedPost.authorId] ?? "active" : "active"} onClose={() => setSelectedPost(null)} onEdit={(item) => { setSelectedPost(null); setEditingPost(item); setPostFormOpen(true); }} onAction={(action, item) => setRequest({ kind: "post", action, post: item })} />
      <CommentDetail comment={selectedComment} postTitle={selectedComment ? findPost(selectedComment.postId)?.title : undefined} memberStatus={selectedComment ? members[selectedComment.authorId] ?? "active" : "active"} onClose={() => setSelectedComment(null)} onAction={(action, item) => setRequest({ kind: "comment", action, comment: item })} />
      <ReportDetail report={selectedReport} post={selectedReport?.targetType === "post" ? findPost(selectedReport.targetId) : undefined} comment={selectedReport?.targetType === "comment" ? findComment(selectedReport.targetId) : undefined} memberStatus={selectedReport ? members[(selectedReport.targetType === "post" ? findPost(selectedReport.targetId)?.authorId : findComment(selectedReport.targetId)?.authorId) ?? ""] ?? "active" : "active"} onClose={() => setSelectedReport(null)} onRequest={setRequest} />
      <ReasonModal request={request} onClose={() => setRequest(null)} onConfirm={applyAction} />
    </AdminLayout>
  );
}

function PostDetail({ post, categoryName, memberStatus, onClose, onEdit, onAction }: { post: ForumPost | null; categoryName?: string; memberStatus: MemberStatus; onClose: () => void; onEdit: (post: ForumPost) => void; onAction: (action: PostAction, post: ForumPost) => void }) {
  return <Modal open={Boolean(post)} centered width={1040} title={null} footer={null} onCancel={onClose} mask={{ closable: true }} styles={{ body: { maxHeight: "80vh", overflowY: "auto" } }}>{post ? <div><div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row"><div><div className="flex flex-wrap items-center gap-2"><Title level={3} className="!mb-0">{post.title}</Title>{postStatusTag(post.status)}</div><div className="mt-2 flex flex-wrap gap-2"><Text type="secondary">{post.authorName} · {formatDateTime(post.createdAt)}</Text>{authorTag(post.authorType)}{memberTag(memberStatus)}</div></div><Space><Button icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(post)}>Cập nhật</Button>{post.status === "pending" ? <Button type="primary" onClick={() => onAction("approve", post)}>Duyệt bài</Button> : null}</Space></div>{post.isMedicalSensitive ? <Alert className="mt-5" type="warning" showIcon title="Thông tin tham khảo, không thay thế tư vấn bác sĩ." /> : null}<div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]"><div className="rounded-xl border border-slate-200 p-5"><Text strong className="mb-3 block">{categoryName ?? "Chưa phân loại"}</Text><div className="forum-rich-content text-slate-700 [&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: post.content }} /><div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div></div><div className="space-y-3"><ActionButton action={post.status === "published" ? "hide" : "approve"} onClick={() => onAction(post.status === "published" ? "hide" : "approve", post)} /><ActionButton action={post.isLocked ? "unlock" : "lock"} onClick={() => onAction(post.isLocked ? "unlock" : "lock", post)} /><ActionButton action={post.isPinned ? "unpin" : "pin"} onClick={() => onAction(post.isPinned ? "unpin" : "pin", post)} /><ActionButton action={post.isFeatured ? "unfeature" : "feature"} onClick={() => onAction(post.isFeatured ? "unfeature" : "feature", post)} /><ActionButton action="delete" danger onClick={() => onAction("delete", post)} /></div></div><Divider /><Title level={5}>Lịch sử kiểm duyệt</Title><div className="space-y-3">{[...post.logs].reverse().map((log) => <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex justify-between gap-3"><Text strong>{actionLabel(log.action)}</Text><Text type="secondary" className="text-xs">{formatDateTime(log.createdAt)}</Text></div><Text className="mt-2 block">{log.reason}</Text><Text type="secondary" className="text-xs">{log.actor} · {log.role}</Text></div>)}</div><div className="mt-6 flex justify-end"><Button type="primary" onClick={onClose}>Đóng</Button></div></div> : null}</Modal>;
}
function ActionButton({ action, onClick, danger = false }: { action: Action; onClick: () => void; danger?: boolean }) { return <Button block danger={danger} icon={actionIcon(action)} onClick={onClick}>{actionLabel(action)}</Button>; }
function CommentDetail({ comment, postTitle, memberStatus, onClose, onAction }: { comment: ForumComment | null; postTitle?: string; memberStatus: MemberStatus; onClose: () => void; onAction: (action: CommentAction, comment: ForumComment) => void }) {
  return <Modal open={Boolean(comment)} centered width={720} title="Chi tiết bình luận" footer={null} onCancel={onClose}>{comment ? <div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap gap-2"><Text strong>{comment.authorName}</Text>{authorTag(comment.authorType)}{memberTag(memberStatus)}</div><Text type="secondary" className="text-xs">{comment.authorEmail}</Text></div><div className="mt-4 rounded-xl border border-slate-200 p-4"><Text type="secondary">Chủ đề: {postTitle}</Text><Paragraph className="!mb-0 !mt-3">{comment.content}</Paragraph></div>{comment.flags.length ? <Alert className="mt-4" type="warning" showIcon title="Bình luận bị bộ lọc đánh dấu" description={<div className="mt-2">{comment.flags.map((flag) => <Tag key={flag} color="gold">{flag}</Tag>)}</div>} /> : null}<div className="mt-5 flex justify-end gap-2">{comment.status === "published" ? <Button onClick={() => onAction("hide", comment)}>Ẩn bình luận</Button> : <Button type="primary" onClick={() => onAction("approve", comment)}>Cho hiển thị</Button>}<Button danger onClick={() => onAction("delete", comment)}>Xóa mềm</Button><Button onClick={onClose}>Đóng</Button></div></div> : null}</Modal>;
}
function ReportDetail({ report, post, comment, memberStatus, onClose, onRequest }: { report: ForumReport | null; post?: ForumPost; comment?: ForumComment; memberStatus: MemberStatus; onClose: () => void; onRequest: (request: ActionRequest) => void }) {
  if (!report) return null;
  const userId = post?.authorId ?? comment?.authorId;
  const userName = post?.authorName ?? comment?.authorName ?? "Không xác định";
  return <Modal open centered width={860} title="Xử lý báo cáo nội dung" footer={null} onCancel={onClose} styles={{ body: { maxHeight: "76vh", overflowY: "auto" } }}><div className="grid gap-4 sm:grid-cols-2"><Box label="Mã báo cáo" value={report.id} /><Box label="Trạng thái" value={reportStatusTag(report.status)} /><Box label="Lý do" value={reasonLabel(report.reason)} danger /><Box label="Ngày gửi" value={formatDateTime(report.createdAt)} /></div><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><Text strong>{report.reporterName}</Text><Text type="secondary" className="block text-xs">{report.reporterEmail}</Text><Paragraph className="!mb-0 !mt-3">{report.description}</Paragraph></div><div className="mt-4 rounded-xl border border-slate-200 p-4"><Text strong>Nội dung bị báo cáo</Text>{post ? <div className="mt-3"><Title level={5}>{post.title}</Title><Paragraph>{post.excerpt}</Paragraph>{postStatusTag(post.status)} {authorTag(post.authorType)} {memberTag(memberStatus)}</div> : null}{comment ? <div className="mt-3"><Paragraph>{comment.content}</Paragraph>{commentStatusTag(comment.status)} {authorTag(comment.authorType)} {memberTag(memberStatus)}</div> : null}</div>{report.resolution ? <Alert className="mt-4" type="success" showIcon title="Kết quả xử lý" description={report.resolution} /> : null}<Divider /><div className="grid gap-2 sm:grid-cols-2">{post ? <><ActionButton action={post.status === "published" ? "hide" : "approve"} onClick={() => onRequest({ kind: "post", action: post.status === "published" ? "hide" : "approve", post, reportId: report.id })} />{post.status === "pending" ? <ActionButton action="reject" danger onClick={() => onRequest({ kind: "post", action: "reject", post, reportId: report.id })} /> : null}<ActionButton action="delete" danger onClick={() => onRequest({ kind: "post", action: "delete", post, reportId: report.id })} /></> : null}{comment ? <><ActionButton action={comment.status === "published" ? "hide" : "approve"} onClick={() => onRequest({ kind: "comment", action: comment.status === "published" ? "hide" : "approve", comment, reportId: report.id })} /><ActionButton action="delete" danger onClick={() => onRequest({ kind: "comment", action: "delete", comment, reportId: report.id })} /></> : null}{userId ? <><ActionButton action="warn" onClick={() => onRequest({ kind: "user", action: "warn", userId, userName, reportId: report.id })} /><ActionButton action="ban" danger onClick={() => onRequest({ kind: "user", action: "ban", userId, userName, reportId: report.id })} /></> : null}<ActionButton action="resolve" onClick={() => onRequest({ kind: "report", action: "resolve", report })} /><ActionButton action="dismiss" onClick={() => onRequest({ kind: "report", action: "dismiss", report })} /></div><div className="mt-5 flex justify-end"><Button type="primary" onClick={onClose}>Đóng</Button></div></Modal>;
}
function Box({ label, value, danger = false }: { label: string; value: ReactNode; danger?: boolean }) { return <div className={`rounded-xl border p-4 ${danger ? "border-red-100 bg-red-50" : "border-slate-200 bg-slate-50"}`}><p className={`mb-1 text-xs font-semibold uppercase ${danger ? "text-red-500" : "text-slate-500"}`}>{label}</p><div className="font-semibold text-slate-950">{value}</div></div>; }

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
} from "react";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bold,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Lock,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Pin,
  Plus,
  Redo2,
  Search,
  Tags,
  Trash2,
  Underline,
  Undo2,
  UserRound,
  X,
} from "lucide-react";

import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import {
  PageHeader,
} from "@/management/components/ui/PageHeader";

const {
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type ForumView =
  | "posts"
  | "categories";

type ForumPostStatus =
  | "published"
  | "hidden";

type ForumCategoryStatus =
  | "active"
  | "inactive";

type ForumCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ForumCategoryStatus;
  postCount: number;
};

type ForumPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorEmail: string;
  categoryId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: ForumPostStatus;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  comments: number;
};

type ForumPostFormValues = {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  status: ForumPostStatus;
  isPinned: boolean;
  isLocked: boolean;
};

type ForumCategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  status: ForumCategoryStatus;
};

const INITIAL_CATEGORIES: ForumCategory[] = [
  {
    id: "CAT-001",
    name: "Thai kỳ",
    slug: "thai-ky",
    description:
      "Kiến thức theo dõi và chăm sóc sức khỏe trong thai kỳ.",
    status: "active",
    postCount: 18,
  },
  {
    id: "CAT-002",
    name: "Dinh dưỡng",
    slug: "dinh-duong",
    description:
      "Thực đơn, vi chất và chế độ dinh dưỡng phù hợp cho mẹ và bé.",
    status: "active",
    postCount: 12,
  },
  {
    id: "CAT-003",
    name: "Bác sĩ tư vấn",
    slug: "bac-si-tu-van",
    description:
      "Nội dung chuyên môn do quản trị viên đăng tải từ nguồn y tế.",
    status: "active",
    postCount: 25,
  },
  {
    id: "CAT-004",
    name: "Kinh nghiệm",
    slug: "kinh-nghiem",
    description:
      "Nội dung tổng hợp kinh nghiệm chăm sóc mẹ và trẻ sơ sinh.",
    status: "active",
    postCount: 7,
  },
];

const INITIAL_POSTS: ForumPost[] = [
  {
    id: "POST-001",
    title:
      "Những dấu hiệu cần lưu ý trong ba tháng đầu thai kỳ",
    excerpt:
      "Tổng hợp các dấu hiệu phổ biến và những trường hợp cần liên hệ cơ sở y tế.",
    content:
      "<p>Ba tháng đầu là giai đoạn quan trọng của thai kỳ. Thai phụ nên theo dõi sức khỏe, lịch khám và các dấu hiệu bất thường.</p><h2>Khi nào cần đi khám?</h2><p>Khi có đau bụng dữ dội, ra máu hoặc mệt bất thường, cần liên hệ bác sĩ để được hướng dẫn.</p>",
    authorName:
      "Quản trị viên MCS",
    authorEmail:
      "admin@mcscare.vn",
    categoryId: "CAT-001",
    tags: [
      "thai kỳ",
      "ba tháng đầu",
      "sức khỏe",
    ],
    createdAt:
      "2026-07-25T08:30:00.000Z",
    updatedAt:
      "2026-07-25T08:30:00.000Z",
    status: "published",
    isPinned: true,
    isLocked: false,
    views: 1284,
    comments: 32,
  },
  {
    id: "POST-002",
    title:
      "Thực đơn đủ chất cho mẹ bầu trong tuần thứ 20",
    excerpt:
      "Gợi ý nhóm thực phẩm và cách phân bổ bữa ăn trong ngày.",
    content:
      "<p>Thực đơn nên đảm bảo đủ đạm, chất xơ, vitamin và khoáng chất.</p><p>Thai phụ cần tham khảo bác sĩ khi có bệnh nền hoặc yêu cầu dinh dưỡng đặc biệt.</p>",
    authorName:
      "Quản trị viên MCS",
    authorEmail:
      "admin@mcscare.vn",
    categoryId: "CAT-002",
    tags: [
      "dinh dưỡng",
      "tuần 20",
      "thực đơn",
    ],
    createdAt:
      "2026-07-26T02:15:00.000Z",
    updatedAt:
      "2026-07-26T05:10:00.000Z",
    status: "published",
    isPinned: false,
    isLocked: false,
    views: 145,
    comments: 4,
  },
  {
    id: "POST-003",
    title:
      "Có nên vận động nhẹ khi mang thai tháng thứ sáu?",
    excerpt:
      "Thông tin về tần suất và cường độ vận động phù hợp.",
    content:
      "<p>Vận động nhẹ có thể mang lại nhiều lợi ích nhưng cần phù hợp với thể trạng.</p><p>Thai phụ nên được bác sĩ đánh giá trước khi bắt đầu hoặc thay đổi chế độ luyện tập.</p>",
    authorName:
      "Quản trị viên MCS",
    authorEmail:
      "admin@mcscare.vn",
    categoryId: "CAT-003",
    tags: [
      "vận động",
      "tháng thứ sáu",
    ],
    createdAt:
      "2026-07-26T09:45:00.000Z",
    updatedAt:
      "2026-07-26T09:45:00.000Z",
    status: "published",
    isPinned: false,
    isLocked: false,
    views: 396,
    comments: 18,
  },
  {
    id: "POST-004",
    title:
      "Hướng dẫn chuẩn bị đồ đi sinh gọn nhẹ",
    excerpt:
      "Danh sách vật dụng cần thiết dành cho mẹ và bé trước ngày sinh.",
    content:
      "<p>Bài viết đang được tạm ẩn để quản trị viên cập nhật lại nội dung.</p>",
    authorName:
      "Quản trị viên MCS",
    authorEmail:
      "admin@mcscare.vn",
    categoryId: "CAT-004",
    tags: [
      "đi sinh",
      "chuẩn bị sinh",
    ],
    createdAt:
      "2026-07-24T14:20:00.000Z",
    updatedAt:
      "2026-07-25T01:10:00.000Z",
    status: "hidden",
    isPinned: false,
    isLocked: true,
    views: 82,
    comments: 6,
  },
];

const POST_STATUS_OPTIONS: Array<{
  value: ForumPostStatus;
  label: string;
}> = [
  {
    value: "published",
    label: "Đang hiển thị",
  },
  {
    value: "hidden",
    label: "Đã ẩn",
  },
];

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function renderPostStatus(
  status: ForumPostStatus,
) {
  return status === "published" ? (
    <Tag color="green">
      Đang hiển thị
    </Tag>
  ) : (
    <Tag color="red">
      Đã ẩn
    </Tag>
  );
}

function createId(
  prefix: string,
) {
  return `${prefix}-${Date.now()}`;
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


type ForumPostFormModalProps = {
  open: boolean;
  post: ForumPost | null;
  categories: ForumCategory[];
  onClose: () => void;
  onSave: (
    values: ForumPostFormValues,
  ) => void;
};

function ForumPostFormModal({
  open,
  post,
  categories,
  onClose,
  onSave,
}: ForumPostFormModalProps) {
  const [form] =
    Form.useForm<ForumPostFormValues>();

  useEffect(() => {
    if (!open) return;

    const timer =
      window.setTimeout(() => {
        if (post) {
          form.setFieldsValue({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            categoryId:
              post.categoryId,
            tags: post.tags,
            status: post.status,
            isPinned:
              post.isPinned,
            isLocked:
              post.isLocked,
          });
          return;
        }

        form.resetFields();
        form.setFieldsValue({
          title: "",
          excerpt: "",
          content: "",
          categoryId: undefined,
          tags: [],
          status: "published",
          isPinned: false,
          isLocked: false,
        });
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [
    form,
    open,
    post,
  ]);

  return (
    <Modal
      open={open}
      centered
      width={900}
      forceRender
      destroyOnHidden={false}
      title={
        post
          ? "Cập nhật bài viết"
          : "Tạo bài viết mới"
      }
      okText={
        post
          ? "Lưu thay đổi"
          : "Đăng bài viết"
      }
      cancelText="Hủy"
      onCancel={onClose}
      onOk={() => form.submit()}
      mask={{
        closable: true,
      }}
      styles={{
        body: {
          maxHeight: "72vh",
          overflowY: "auto",
          paddingRight: 8,
        },
      }}
    >
      <Form<ForumPostFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSave}
      >
        {!post ? (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Bài viết do Admin tạo sẽ được hiển thị ngay, không qua bước chờ duyệt.
          </div>
        ) : null}

        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                "Vui lòng nhập tiêu đề bài viết.",
            },
            {
              max: 180,
              message:
                "Tiêu đề tối đa 180 ký tự.",
            },
          ]}
        >
          <Input
            showCount
            maxLength={180}
            placeholder="Nhập tiêu đề bài viết"
          />
        </Form.Item>

        <Row gutter={[16, 0]}>
          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              name="categoryId"
              label="Danh mục"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn danh mục.",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn danh mục"
                options={categories
                  .filter(
                    (category) =>
                      category.status ===
                      "active",
                  )
                  .map(
                    (category) => ({
                      value:
                        category.id,
                      label:
                        category.name,
                    }),
                  )}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              name="status"
              label="Trạng thái hiển thị"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn trạng thái.",
                },
              ]}
            >
              <Select
                options={
                  POST_STATUS_OPTIONS
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="excerpt"
          label="Mô tả ngắn"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                "Vui lòng nhập mô tả ngắn.",
            },
            {
              max: 300,
              message:
                "Mô tả tối đa 300 ký tự.",
            },
          ]}
        >
          <TextArea
            rows={3}
            showCount
            maxLength={300}
            placeholder="Mô tả ngắn nội dung bài viết"
          />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[
            {
              validator: async (
                _,
                content?: string,
              ) => {
                const plainText =
                  String(
                    content ?? "",
                  )
                    .replace(
                      /<[^>]*>/g,
                      "",
                    )
                    .replace(
                      /&nbsp;/g,
                      " ",
                    )
                    .trim();

                const hasImage =
                  /<img[\s\S]*?>/i.test(
                    String(
                      content ?? "",
                    ),
                  );

                if (
                  !plainText &&
                  !hasImage
                ) {
                  throw new Error(
                    "Vui lòng nhập nội dung bài viết.",
                  );
                }
              },
            },
          ]}
        >
          <RichTextEditor />
        </Form.Item>

        <Form.Item
          name="tags"
          label="Thẻ nội dung"
        >
          <Select
            mode="tags"
            tokenSeparators={[","]}
            placeholder="Nhập thẻ và nhấn Enter"
          />
        </Form.Item>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <Text
                strong
                className="block"
              >
                Ghim bài viết
              </Text>

              <Text
                type="secondary"
                className="text-xs"
              >
                Hiển thị bài viết ở vị trí ưu tiên.
              </Text>
            </div>

            <Form.Item
              name="isPinned"
              valuePropName="checked"
              noStyle
            >
              <Switch />
            </Form.Item>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <Text
                strong
                className="block"
              >
                Khóa bình luận
              </Text>

              <Text
                type="secondary"
                className="text-xs"
              >
                Không cho phép thêm bình luận mới.
              </Text>
            </div>

            <Form.Item
              name="isLocked"
              valuePropName="checked"
              noStyle
            >
              <Switch />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
}

type ForumCategoryFormModalProps = {
  open: boolean;
  category:
    | ForumCategory
    | null;
  onClose: () => void;
  onSave: (
    values: ForumCategoryFormValues,
  ) => void;
};

function ForumCategoryFormModal({
  open,
  category,
  onClose,
  onSave,
}: ForumCategoryFormModalProps) {
  const [form] =
    Form.useForm<ForumCategoryFormValues>();

  useEffect(() => {
    if (!open) return;

    const timer =
      window.setTimeout(() => {
        if (category) {
          form.setFieldsValue({
            name: category.name,
            slug: category.slug,
            description:
              category.description,
            status:
              category.status,
          });
          return;
        }

        form.resetFields();
        form.setFieldsValue({
          name: "",
          slug: "",
          description: "",
          status: "active",
        });
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [
    category,
    form,
    open,
  ]);

  return (
    <Modal
      open={open}
      centered
      width={620}
      forceRender
      destroyOnHidden={false}
      title={
        category
          ? "Cập nhật danh mục"
          : "Thêm danh mục"
      }
      okText={
        category
          ? "Lưu thay đổi"
          : "Tạo danh mục"
      }
      cancelText="Hủy"
      onCancel={onClose}
      onOk={() => form.submit()}
      mask={{
        closable: true,
      }}
    >
      <Form<ForumCategoryFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSave}
      >
        <Row gutter={[16, 0]}>
          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              name="name"
              label="Tên danh mục"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message:
                    "Vui lòng nhập tên danh mục.",
                },
              ]}
            >
              <Input placeholder="Ví dụ: Thai kỳ" />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              name="slug"
              label="Slug"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng nhập slug.",
                },
                {
                  pattern:
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message:
                    "Slug chỉ gồm chữ thường, số và dấu gạch ngang.",
                },
              ]}
            >
              <Input placeholder="thai-ky" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                "Vui lòng nhập mô tả danh mục.",
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Mô tả phạm vi nội dung của danh mục"
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[
            {
              required: true,
              message:
                "Vui lòng chọn trạng thái.",
            },
          ]}
        >
          <Select
            options={[
              {
                value: "active",
                label: "Hoạt động",
              },
              {
                value: "inactive",
                label:
                  "Ngừng hoạt động",
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function ForumManagementPage() {
  const {
    message: messageApi,
  } = App.useApp();

  const [
    modal,
    modalContextHolder,
  ] = Modal.useModal();

  const [view, setView] =
    useState<ForumView>("posts");

  const [posts, setPosts] =
    useState<ForumPost[]>(
      INITIAL_POSTS,
    );

  const [
    categories,
    setCategories,
  ] = useState<ForumCategory[]>(
    INITIAL_CATEGORIES,
  );

  const [keyword, setKeyword] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<string>();

  const [
    postStatusFilter,
    setPostStatusFilter,
  ] =
    useState<ForumPostStatus>();

  const [
    selectedPost,
    setSelectedPost,
  ] =
    useState<ForumPost | null>(
      null,
    );

  const [
    editingPost,
    setEditingPost,
  ] =
    useState<ForumPost | null>(
      null,
    );

  const [
    postFormOpen,
    setPostFormOpen,
  ] = useState(false);

  const [
    editingCategory,
    setEditingCategory,
  ] =
    useState<ForumCategory | null>(
      null,
    );

  const [
    categoryFormOpen,
    setCategoryFormOpen,
  ] = useState(false);

  const categoryById = useMemo(
    () =>
      new Map(
        categories.map(
          (category) => [
            category.id,
            category,
          ],
        ),
      ),
    [categories],
  );

  const filteredPosts = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          post.id,
          post.title,
          post.excerpt,
          post.authorName,
          post.authorEmail,
          ...post.tags,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(
              normalizedKeyword,
            ),
        );

      return (
        matchesKeyword &&
        (!categoryFilter ||
          post.categoryId ===
            categoryFilter) &&
        (!postStatusFilter ||
          post.status ===
            postStatusFilter)
      );
    });
  }, [
    categoryFilter,
    keyword,
    postStatusFilter,
    posts,
  ]);

  const filteredCategories =
    useMemo(() => {
      const normalizedKeyword =
        keyword.trim().toLowerCase();

      return categories.filter(
        (category) =>
          !normalizedKeyword
            ? true
            : [
                category.id,
                category.name,
                category.slug,
                category.description,
              ].some((value) =>
                value
                  .toLowerCase()
                  .includes(
                    normalizedKeyword,
                  ),
              ),
      );
    }, [
      categories,
      keyword,
    ]);

  const publishedCount =
    posts.filter(
      (post) =>
        post.status === "published",
    ).length;

  const hiddenCount =
    posts.filter(
      (post) =>
        post.status === "hidden",
    ).length;

  const totalComments =
    posts.reduce(
      (sum, post) =>
        sum + post.comments,
      0,
    );

  function resetFilters() {
    setKeyword("");
    setCategoryFilter(undefined);
    setPostStatusFilter(undefined);
  }

  function openCreatePost() {
    setEditingPost(null);
    setPostFormOpen(true);
  }

  function openEditPost(
    post: ForumPost,
  ) {
    setEditingPost(post);
    setPostFormOpen(true);
  }

  function savePost(
    values: ForumPostFormValues,
  ) {
    const now =
      new Date().toISOString();

    if (editingPost) {
      setPosts((current) =>
        current.map((post) =>
          post.id === editingPost.id
            ? {
                ...post,
                ...values,
                updatedAt: now,
              }
            : post,
        ),
      );

      setSelectedPost(
        (current) =>
          current?.id ===
          editingPost.id
            ? {
                ...current,
                ...values,
                updatedAt: now,
              }
            : current,
      );

      messageApi.success(
        "Cập nhật bài viết thành công.",
      );
    } else {
      setPosts((current) => [
        {
          id: createId("POST"),
          ...values,
          authorName:
            "Quản trị viên MCS",
          authorEmail:
            "admin@mcscare.vn",
          createdAt: now,
          updatedAt: now,
          views: 0,
          comments: 0,
        },
        ...current,
      ]);

      messageApi.success(
        values.status ===
          "published"
          ? "Đăng bài viết thành công."
          : "Đã tạo bài viết ở trạng thái ẩn.",
      );
    }

    setPostFormOpen(false);
    setEditingPost(null);
  }

  function changePostStatus(
    post: ForumPost,
    status: ForumPostStatus,
  ) {
    const updatedAt =
      new Date().toISOString();

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              status,
              updatedAt,
            }
          : item,
      ),
    );

    setSelectedPost(
      (current) =>
        current?.id === post.id
          ? {
              ...current,
              status,
              updatedAt,
            }
          : current,
    );

    messageApi.success(
      status === "published"
        ? "Bài viết đang được hiển thị."
        : "Đã ẩn bài viết.",
    );
  }

  function deletePost(
    post: ForumPost,
  ) {
    modal.confirm({
      centered: true,
      title: "Xóa bài viết?",
      content: `Bài viết “${post.title}” sẽ bị xóa khỏi Forum.`,
      okText: "Xóa bài viết",
      cancelText: "Hủy",
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        setPosts((current) =>
          current.filter(
            (item) =>
              item.id !== post.id,
          ),
        );

        setSelectedPost(null);

        messageApi.success(
          "Đã xóa bài viết.",
        );
      },
    });
  }

  function saveCategory(
    values: ForumCategoryFormValues,
  ) {
    if (editingCategory) {
      setCategories((current) =>
        current.map((category) =>
          category.id ===
          editingCategory.id
            ? {
                ...category,
                ...values,
              }
            : category,
        ),
      );

      messageApi.success(
        "Cập nhật danh mục thành công.",
      );
    } else {
      setCategories((current) => [
        {
          id: createId("CAT"),
          ...values,
          postCount: 0,
        },
        ...current,
      ]);

      messageApi.success(
        "Tạo danh mục thành công.",
      );
    }

    setCategoryFormOpen(false);
    setEditingCategory(null);
  }

  function deleteCategory(
    category: ForumCategory,
  ) {
    const hasPosts = posts.some(
      (post) =>
        post.categoryId ===
        category.id,
    );

    if (hasPosts) {
      modal.warning({
        centered: true,
        title:
          "Không thể xóa danh mục",
        content:
          "Danh mục đang có bài viết. Hãy chuyển bài viết sang danh mục khác trước khi xóa.",
        okText: "Đóng",
      });
      return;
    }

    modal.confirm({
      centered: true,
      title: "Xóa danh mục?",
      content: `Danh mục “${category.name}” sẽ bị xóa.`,
      okText: "Xóa danh mục",
      cancelText: "Hủy",
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        setCategories(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                category.id,
            ),
        );

        messageApi.success(
          "Đã xóa danh mục.",
        );
      },
    });
  }

  const postColumns: ColumnsType<ForumPost> =
    [
      {
        title: "STT",
        width: 64,
        align: "center",
        fixed: "left",
        render: (
          _value,
          _record,
          index,
        ) => index + 1,
      },
      {
        title: "Bài viết",
        width: 370,
        render: (
          _value,
          post,
        ) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {post.isPinned ? (
                <Pin className="h-4 w-4 shrink-0 text-blue-600" />
              ) : null}

              {post.isLocked ? (
                <Lock className="h-4 w-4 shrink-0 text-slate-500" />
              ) : null}

              <Text
                strong
                className="block truncate"
              >
                {post.title}
              </Text>
            </div>

            <Text
              type="secondary"
              className="mt-1 block truncate text-xs"
            >
              {post.excerpt}
            </Text>

            <div className="mt-2 flex flex-wrap gap-1">
              {post.tags
                .slice(0, 3)
                .map((tag) => (
                  <Tag key={tag}>
                    {tag}
                  </Tag>
                ))}
            </div>
          </div>
        ),
      },
      {
        title: "Danh mục",
        width: 180,
        render: (
          _value,
          post,
        ) => (
          <Tag color="blue">
            {categoryById.get(
              post.categoryId,
            )?.name ??
              "Chưa phân loại"}
          </Tag>
        ),
      },
      {
        title: "Người đăng",
        width: 210,
        render: (
          _value,
          post,
        ) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <UserRound className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <Text
                strong
                className="block truncate"
              >
                {post.authorName}
              </Text>

              <Text
                type="secondary"
                className="block truncate text-xs"
              >
                {post.authorEmail}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: "Tương tác",
        width: 150,
        render: (
          _value,
          post,
        ) => (
          <div className="flex flex-col gap-1 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {post.views.toLocaleString(
                "vi-VN",
              )}{" "}
              lượt xem
            </span>

            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.comments} bình luận
            </span>
          </div>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        width: 165,
        render: (
          value: string,
        ) => (
          <Text type="secondary">
            {formatDateTime(value)}
          </Text>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 135,
        align: "center",
        render: (
          status: ForumPostStatus,
        ) =>
          renderPostStatus(status),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 150,
        align: "center",
        fixed: "right",
        render: (
          _value,
          post,
        ) => (
          <Space size={6}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={
                  <Eye className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedPost(post);
                }}
              />
            </Tooltip>

            <Tooltip title="Cập nhật">
              <Button
                icon={
                  <Pencil className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  openEditPost(post);
                }}
              />
            </Tooltip>

            <Tooltip title="Xóa bài viết">
              <Button
                danger
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  deletePost(post);
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

  const categoryColumns: ColumnsType<ForumCategory> =
    [
      {
        title: "STT",
        width: 64,
        align: "center",
        render: (
          _value,
          _record,
          index,
        ) => index + 1,
      },
      {
        title: "Danh mục",
        width: 260,
        render: (
          _value,
          category,
        ) => (
          <div>
            <Text
              strong
              className="block"
            >
              {category.name}
            </Text>

            <Text
              type="secondary"
              className="text-xs"
            >
              /{category.slug}
            </Text>
          </div>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        render: (
          value: string,
        ) => (
          <Text type="secondary">
            {value}
          </Text>
        ),
      },
      {
        title: "Số bài viết",
        dataIndex: "postCount",
        width: 130,
        align: "center",
        render: (
          value: number,
          category,
        ) =>
          posts.filter(
            (post) =>
              post.categoryId ===
              category.id,
          ).length || value,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 150,
        align: "center",
        render: (
          status: ForumCategoryStatus,
        ) =>
          status === "active" ? (
            <Tag color="green">
              Hoạt động
            </Tag>
          ) : (
            <Tag>
              Ngừng hoạt động
            </Tag>
          ),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 125,
        align: "center",
        render: (
          _value,
          category,
        ) => (
          <Space size={6}>
            <Tooltip title="Cập nhật">
              <Button
                icon={
                  <Pencil className="h-4 w-4" />
                }
                onClick={() => {
                  setEditingCategory(
                    category,
                  );
                  setCategoryFormOpen(
                    true,
                  );
                }}
              />
            </Tooltip>

            <Tooltip title="Xóa danh mục">
              <Button
                danger
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={() =>
                  deleteCategory(
                    category,
                  )
                }
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

  return (
    <AdminLayout>
      {modalContextHolder}

      <PageHeader
        title="Quản lý Forum"
        description="Chỉ Admin được phép tạo, cập nhật và xuất bản bài viết. Bài viết không cần qua bước chờ duyệt."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Row gutter={[16, 16]}>
          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-slate-200">
              <Statistic
                title="Tổng bài viết"
                value={posts.length}
                prefix={
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-slate-200">
              <Statistic
                title="Đang hiển thị"
                value={publishedCount}
                prefix={
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-slate-200">
              <Statistic
                title="Đã ẩn"
                value={hiddenCount}
                prefix={
                  <EyeOff className="mr-2 h-5 w-5 text-amber-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-slate-200">
              <Statistic
                title="Tổng bình luận"
                value={totalComments}
                prefix={
                  <MessageCircle className="mr-2 h-5 w-5 text-pink-600" />
                }
              />
            </Card>
          </Col>
        </Row>

        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <Segmented<ForumView>
                value={view}
                options={[
                  {
                    value: "posts",
                    label: (
                      <span className="flex items-center gap-2">
                        <MessagesSquare className="h-4 w-4" />
                        Bài viết
                      </span>
                    ),
                  },
                  {
                    value:
                      "categories",
                    label: (
                      <span className="flex items-center gap-2">
                        <Tags className="h-4 w-4" />
                        Danh mục
                      </span>
                    ),
                  },
                ]}
                onChange={(
                  nextView,
                ) => {
                  setView(nextView);
                  resetFilters();
                }}
              />

              <div className="flex flex-wrap gap-2">
                {view === "posts" ? (
                  <Button
                    type="primary"
                    icon={
                      <Plus className="h-4 w-4" />
                    }
                    onClick={
                      openCreatePost
                    }
                  >
                    Thêm bài viết
                  </Button>
                ) : null}

                {view ===
                "categories" ? (
                  <Button
                    type="primary"
                    icon={
                      <Plus className="h-4 w-4" />
                    }
                    onClick={() => {
                      setEditingCategory(
                        null,
                      );
                      setCategoryFormOpen(
                        true,
                      );
                    }}
                  >
                    Thêm danh mục
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                allowClear
                value={keyword}
                className="min-w-0 lg:flex-1"
                prefix={
                  <Search className="h-4 w-4 text-slate-400" />
                }
                placeholder={
                  view === "posts"
                    ? "Tìm tiêu đề, mô tả, người đăng hoặc thẻ..."
                    : "Tìm tên hoặc slug danh mục..."
                }
                onChange={(event) =>
                  setKeyword(
                    event.target.value,
                  )
                }
              />

              {view === "posts" ? (
                <>
                  <Select
                    allowClear
                    value={
                      categoryFilter
                    }
                    className="w-full lg:w-[220px] lg:shrink-0"
                    placeholder="Tất cả danh mục"
                    options={categories.map(
                      (category) => ({
                        value:
                          category.id,
                        label:
                          category.name,
                      }),
                    )}
                    onChange={
                      setCategoryFilter
                    }
                  />

                  <Select
                    allowClear
                    value={
                      postStatusFilter
                    }
                    className="w-full lg:w-[180px] lg:shrink-0"
                    placeholder="Tất cả trạng thái"
                    options={
                      POST_STATUS_OPTIONS
                    }
                    onChange={
                      setPostStatusFilter
                    }
                  />
                </>
              ) : null}

              <Tooltip title="Xóa bộ lọc">
                <Button
                  icon={
                    <X className="h-4 w-4" />
                  }
                  className="w-full lg:w-auto lg:min-w-[150px] lg:shrink-0"
                  onClick={resetFilters}
                >
                  Xóa bộ lọc
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                {view === "posts"
                  ? "Danh sách bài viết"
                  : "Danh sách danh mục"}
              </p>

              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                {view === "posts"
                  ? "Bấm vào một dòng để xem chi tiết hoặc chỉnh sửa bài viết."
                  : "Quản lý nhóm nội dung hiển thị trên Forum."}
              </p>
            </div>
          }
          extra={
            <Text type="secondary">
              {view === "posts"
                ? `${filteredPosts.length} bài viết`
                : `${filteredCategories.length} danh mục`}
            </Text>
          }
        >
          {view === "posts" ? (
            <Table
              rowKey="id"
              size="middle"
              tableLayout="fixed"
              columns={postColumns}
              dataSource={
                filteredPosts
              }
              scroll={{
                x: 1424,
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: [
                  10,
                  20,
                  50,
                ],
                showTotal: (
                  total,
                ) =>
                  `Tổng ${total} bài viết`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={
                      Empty.PRESENTED_IMAGE_SIMPLE
                    }
                    description="Không có bài viết phù hợp."
                  >
                    <Button
                      type="primary"
                      onClick={
                        openCreatePost
                      }
                    >
                      Thêm bài viết
                    </Button>
                  </Empty>
                ),
              }}
              onRow={(post) => ({
                className:
                  "cursor-pointer",
                onClick: (event) => {
                  const target =
                    event.target as HTMLElement;

                  if (
                    target.closest(
                      "button",
                    ) ||
                    target.closest("a")
                  ) {
                    return;
                  }

                  setSelectedPost(post);
                },
              })}
              className="management-table [&_.ant-table-cell]:px-3"
            />
          ) : null}

          {view ===
          "categories" ? (
            <Table
              rowKey="id"
              size="middle"
              tableLayout="fixed"
              columns={
                categoryColumns
              }
              dataSource={
                filteredCategories
              }
              scroll={{
                x: 964,
              }}
              pagination={{
                pageSize: 10,
                showTotal: (
                  total,
                ) =>
                  `Tổng ${total} danh mục`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={
                      Empty.PRESENTED_IMAGE_SIMPLE
                    }
                    description="Không có danh mục phù hợp."
                  />
                ),
              }}
              className="management-table [&_.ant-table-cell]:px-3"
            />
          ) : null}
        </Card>
      </div>

      <ForumPostFormModal
        open={postFormOpen}
        post={editingPost}
        categories={categories}
        onClose={() => {
          setPostFormOpen(false);
          setEditingPost(null);
        }}
        onSave={savePost}
      />

      <ForumCategoryFormModal
        open={categoryFormOpen}
        category={editingCategory}
        onClose={() => {
          setCategoryFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={saveCategory}
      />

      <Modal
        open={Boolean(selectedPost)}
        centered
        width={960}
        title={null}
        footer={null}
        onCancel={() =>
          setSelectedPost(null)
        }
        mask={{
          closable: true,
        }}
        styles={{
          body: {
            maxHeight: "78vh",
            overflowY: "auto",
            paddingRight: 8,
          },
        }}
      >
        {selectedPost ? (
          <div>
            <div className="relative flex flex-col gap-4 border-b border-slate-200 pb-4 pr-10 lg:min-h-[92px] lg:pr-[170px]">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <MessagesSquare className="h-6 w-6" />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Title
                      level={3}
                      className="!mb-0 !text-slate-950"
                    >
                      {selectedPost.title}
                    </Title>

                    {renderPostStatus(
                      selectedPost.status,
                    )}
                  </div>

                  <Text
                    type="secondary"
                    className="mt-1 block"
                  >
                    Đăng bởi{" "}
                    {
                      selectedPost.authorName
                    }{" "}
                    ·{" "}
                    {formatDateTime(
                      selectedPost.createdAt,
                    )}
                  </Text>
                </div>
              </div>

              <div className="flex w-[120px] shrink-0 flex-col gap-2 self-end lg:absolute lg:right-8 lg:top-0">
                <Button
                  block
                  icon={
                    <Pencil className="h-4 w-4" />
                  }
                  onClick={() => {
                    const post =
                      selectedPost;

                    setSelectedPost(
                      null,
                    );
                    openEditPost(post);
                  }}
                >
                  Cập nhật
                </Button>

                <Button
                  danger
                  block
                  icon={
                    <Trash2 className="h-4 w-4" />
                  }
                  onClick={() =>
                    deletePost(
                      selectedPost,
                    )
                  }
                >
                  Xóa
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Danh mục
                </p>

                <p className="mb-0 font-semibold text-slate-950">
                  {categoryById.get(
                    selectedPost.categoryId,
                  )?.name ??
                    "Chưa phân loại"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Lượt xem
                </p>

                <p className="mb-0 font-semibold text-slate-950">
                  {selectedPost.views.toLocaleString(
                    "vi-VN",
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Bình luận
                </p>

                <p className="mb-0 font-semibold text-slate-950">
                  {
                    selectedPost.comments
                  }
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Trạng thái
                </p>

                <div className="mt-1">
                  {renderPostStatus(
                    selectedPost.status,
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_290px]">
              <div className="rounded-xl border border-slate-200 p-5">
                <Text
                  strong
                  className="mb-3 block text-base"
                >
                  Nội dung bài viết
                </Text>

                <div
                  className="forum-rich-content text-slate-700 [&_a]:text-blue-600 [&_a]:underline [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedPost.content,
                  }}
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPost.tags.map(
                    (tag) => (
                      <Tag key={tag}>
                        {tag}
                      </Tag>
                    ),
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 font-semibold text-slate-950">
                    Trạng thái hiển thị
                  </p>

                  <Select
                    className="w-full"
                    value={
                      selectedPost.status
                    }
                    options={
                      POST_STATUS_OPTIONS
                    }
                    onChange={(status) =>
                      changePostStatus(
                        selectedPost,
                        status,
                      )
                    }
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 font-semibold text-slate-950">
                    Thuộc tính
                  </p>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Pin className="h-4 w-4" />
                        Ghim bài viết
                      </span>

                      <Tag
                        color={
                          selectedPost.isPinned
                            ? "blue"
                            : undefined
                        }
                      >
                        {selectedPost.isPinned
                          ? "Đang ghim"
                          : "Không"}
                      </Tag>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Lock className="h-4 w-4" />
                        Bình luận
                      </span>

                      <Tag
                        color={
                          selectedPost.isLocked
                            ? "red"
                            : "green"
                        }
                      >
                        {selectedPost.isLocked
                          ? "Đã khóa"
                          : "Đang mở"}
                      </Tag>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 font-semibold text-slate-950">
                    Thống kê nhanh
                  </p>

                  <div className="flex items-center gap-3 text-slate-600">
                    <BarChart3 className="h-5 w-5 text-blue-600" />

                    <span>
                      Cập nhật lần cuối{" "}
                      {formatDateTime(
                        selectedPost.updatedAt,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="primary"
                icon={
                  <X className="h-4 w-4" />
                }
                onClick={() =>
                  setSelectedPost(
                    null,
                  )
                }
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}

"use client";

import {
  useEffect,
  useRef,
} from "react";
import {
  Alert,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Tooltip,
} from "antd";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import {
  FORUM_POST_EDITOR_STATUS_OPTIONS,
} from "@/management/features/forums/forums.constants";
import type {
  ForumPost,
  ForumTopic,
} from "@/management/features/forums/forums.types";
import {
  getForumCategoryLabel,
} from "@/management/features/forums/forums.utils";

const { TextArea } = Input;

export type ForumPostEditorMode =
  | "create"
  | "edit";

export type ForumPostEditorState =
  | {
      open: false;
      mode: ForumPostEditorMode;
      post: null;
    }
  | {
      open: true;
      mode: "create";
      post: null;
    }
  | {
      open: true;
      mode: "edit";
      post: ForumPost;
    };

export type ForumPostEditorValues = {
  topicId: string;
  title: string;
  content: string;
  status: ForumPost["status"];
  commentable: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  moderationReason?: string;
};

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
  const editorRef =
    useRef<HTMLDivElement | null>(
      null,
    );
  const savedRangeRef =
    useRef<Range | null>(null);

  useEffect(() => {
    const editor =
      editorRef.current;

    if (
      editor &&
      editor.innerHTML !== value
    ) {
      editor.innerHTML = value;
    }
  }, [value]);

  function emitChange() {
    onChange?.(
      editorRef.current
        ?.innerHTML ?? "",
    );
  }

  function saveSelection() {
    const selection =
      window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0 ||
      !editorRef.current
    ) {
      return;
    }

    const range =
      selection.getRangeAt(0);

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
    const range =
      savedRangeRef.current;
    const selection =
      window.getSelection();

    if (!range || !selection) {
      return;
    }

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

  const toolbarButtonClass =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-950";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div
        className="flex w-full flex-nowrap items-center gap-1 overflow-hidden border-b border-slate-200 bg-slate-50 px-2 py-1.5"
        style={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
        }}
        onMouseDown={saveSelection}
      >
        <Tooltip title="Hoàn tác">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
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
            className={
              toolbarButtonClass
            }
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

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <div
          className="shrink-0"
          style={{
            width: 92,
            minWidth: 92,
            flex: "0 0 92px",
          }}
        >
          <Select
            size="small"
            defaultValue="p"
            popupMatchSelectWidth={
              false
            }
            style={{
              width: "100%",
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
              if (open) {
                saveSelection();
              }
            }}
            onChange={(nextValue) =>
              runCommand(
                "formatBlock",
                nextValue,
              )
            }
          />
        </div>

        <div
          className="shrink-0"
          style={{
            width: 72,
            minWidth: 72,
            flex: "0 0 72px",
          }}
        >
          <Select
            size="small"
            defaultValue="3"
            popupMatchSelectWidth={
              false
            }
            style={{
              width: "100%",
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
              if (open) {
                saveSelection();
              }
            }}
            onChange={(nextValue) =>
              runCommand(
                "fontSize",
                nextValue,
              )
            }
          />
        </div>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="In đậm">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
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
            className={
              toolbarButtonClass
            }
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
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "underline",
              )
            }
          >
            <Underline className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="Căn trái">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyLeft",
              )
            }
          >
            <AlignLeft className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn giữa">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyCenter",
              )
            }
          >
            <AlignCenter className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn phải">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyRight",
              )
            }
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip title="Căn đều">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              runCommand(
                "justifyFull",
              )
            }
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </Tooltip>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Tooltip title="Danh sách dấu chấm">
          <button
            type="button"
            className={
              toolbarButtonClass
            }
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
            className={
              toolbarButtonClass
            }
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
          className="min-h-[130px] px-4 py-3 text-sm leading-7 text-slate-800 outline-none [&_a]:text-blue-600 [&_a]:underline [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
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

export function ForumPostEditorModal({
  state,
  topics,
  submitting,
  onClose,
  onSubmit,
}: {
  state: ForumPostEditorState;
  topics: ForumTopic[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (
    values: ForumPostEditorValues,
  ) => Promise<void>;
}) {
  const [form] =
    Form.useForm<ForumPostEditorValues>();

  const activeTopics =
    topics.filter(
      (topic) =>
        topic.status === "active",
    );

  const topicOptions =
    topics.map((topic) => ({
      value: topic.id,
      label: `${topic.title} · ${
        getForumCategoryLabel(
          topic.category,
        )
      }${
        topic.status ===
        "inactive"
          ? " · Ngừng hoạt động"
          : ""
      }`,
      disabled:
        state.mode === "create" &&
        topic.status !== "active",
    }));

  function syncForm(
    nextOpen: boolean,
  ) {
    if (!nextOpen) {
      form.resetFields();
      return;
    }

    if (
      state.open &&
      state.mode === "edit"
    ) {
      form.setFieldsValue({
        topicId:
          state.post.topicId,
        title: state.post.title,
        content:
          state.post.content,
        status:
          state.post.status,
        commentable:
          state.post.commentable,
        isPinned:
          state.post.isPinned,
        isFeatured:
          state.post.isFeatured,
        moderationReason:
          state.post
            .moderationReason ||
          undefined,
      });

      return;
    }

    form.setFieldsValue({
      topicId: undefined,
      title: "",
      content: "",
      status: "pending",
      commentable: true,
      isPinned: false,
      isFeatured: false,
      moderationReason:
        "Bài viết được tạo từ màn quản trị.",
    });
  }

  const isCreate =
    state.mode === "create";

  return (
    <Modal
      open={state.open}
      centered
      forceRender
      width={960}
      title={
        isCreate
          ? "Tạo bài viết"
          : "Chỉnh sửa bài viết"
      }
      okText={
        isCreate
          ? "Tạo bài viết"
          : "Lưu thay đổi"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{
        disabled:
          isCreate &&
          activeTopics.length === 0,
      }}
      onCancel={onClose}
      onOk={() => form.submit()}
      afterOpenChange={
        syncForm
      }
      mask={{
        closable: !submitting,
      }}
      styles={{
        body: {
          overflow: "hidden",
          paddingTop: 8,
        },
        footer: {
          marginTop: 12,
        },
      }}
    >
      <div className="mt-2 max-h-[62vh] overflow-y-auto pr-2">
        {isCreate &&
        activeTopics.length ===
          0 ? (
          <Alert
            type="warning"
            showIcon
            className="!mb-4"
            title="Chưa có chủ đề hoạt động"
            description="Hãy tạo hoặc kích hoạt ít nhất một chủ đề trước khi tạo bài viết."
          />
        ) : null}

        <Form<ForumPostEditorValues>
          form={form}
          layout="vertical"
          className="[&_.ant-form-item]:!mb-4"
          onFinish={(values) =>
            void onSubmit(values)
          }
        >
          <Form.Item
            name="topicId"
            label="Chủ đề"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn chủ đề.",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn chủ đề"
              options={topicOptions}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "Vui lòng nhập tiêu đề.",
              },
              {
                min: 5,
                message:
                  "Tiêu đề cần ít nhất 5 ký tự.",
              },
              {
                max: 250,
                message:
                  "Tiêu đề không vượt quá 250 ký tự.",
              },
            ]}
          >
            <Input
              showCount
              maxLength={250}
              placeholder="Nhập tiêu đề bài viết"
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[
              {
                validator: async (
                  _rule,
                  content?: string,
                ) => {
                  const html =
                    String(
                      content ?? "",
                    );
                  const plainText =
                    html
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
                      html,
                    );

                  if (
                    !plainText &&
                    !hasImage
                  ) {
                    throw new Error(
                      "Vui lòng nhập nội dung bài viết.",
                    );
                  }

                  if (
                    plainText.length <
                      10 &&
                    !hasImage
                  ) {
                    throw new Error(
                      "Nội dung cần ít nhất 10 ký tự.",
                    );
                  }
                },
              },
            ]}
          >
            <RichTextEditor />
          </Form.Item>

          <div className="grid gap-4 sm:grid-cols-2">
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
                options={
                  FORUM_POST_EDITOR_STATUS_OPTIONS
                }
              />
            </Form.Item>

            <Form.Item
              name="commentable"
              label="Cho phép bình luận"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Cho phép"
                unCheckedChildren="Đã khóa"
              />
            </Form.Item>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item
              name="isPinned"
              label="Ghim bài viết"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Có"
                unCheckedChildren="Không"
              />
            </Form.Item>

            <Form.Item
              name="isFeatured"
              label="Đánh dấu nổi bật"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Có"
                unCheckedChildren="Không"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="moderationReason"
            label="Ghi chú quản trị"
          >
            <TextArea
              rows={1}
              autoSize={{
                minRows: 1,
                maxRows: 2,
              }}
              showCount
              maxLength={500}
              placeholder="Nhập ghi chú cho lần tạo hoặc cập nhật này"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}


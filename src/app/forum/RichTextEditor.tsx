"use client";

import {
  useEffect,
  useRef,
} from "react";
import {
  Select,
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

type RichTextEditorProps = {
  value?: string;
  onChange?: (
    value: string,
  ) => void;
  placeholder?: string;
};

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Nhập nội dung bài viết...",
}: RichTextEditorProps) {
  const editorRef =
    useRef<HTMLDivElement | null>(
      null,
    );
  const savedRangeRef =
    useRef<Range | null>(
      null,
    );

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

    if (
      !range ||
      !selection
    ) {
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
        className="flex w-full flex-nowrap items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 py-1.5"
        onMouseDown={
          saveSelection
        }
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

        <Select
          size="small"
          defaultValue="p"
          popupMatchSelectWidth={
            false
          }
          className="shrink-0"
          style={{
            width: 85,
            minWidth: 85,
            maxWidth: 85,
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

        <Select
          size="small"
          defaultValue="3"
          popupMatchSelectWidth={
            false
          }
          className="shrink-0"
          style={{
            width: 70,
            minWidth: 70,
            maxWidth: 70,
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
          className="min-h-[210px] px-4 py-3 text-sm leading-7 text-slate-800 outline-none [&_a]:text-blue-600 [&_a]:underline [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
          onInput={emitChange}
          onBlur={() => {
            emitChange();
            saveSelection();
          }}
          onKeyUp={
            saveSelection
          }
          onMouseUp={
            saveSelection
          }
        />
      </div>
    </div>
  );
}
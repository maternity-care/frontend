"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Input,
  Modal,
  Select,
  Typography,
} from "antd";
import {
  FORUM_COMMENT_ACTION_LABELS,
  FORUM_POST_ACTION_LABELS,
  FORUM_REPORT_REASON_OPTIONS,
} from "@/management/features/forums/forums.constants";
import type {
  ForumComment,
  ForumCommentModerationAction,
  ForumPost,
  ForumPostModerationAction,
} from "@/management/features/forums/forums.types";

const {
  Text,
} = Typography;
const { TextArea } = Input;

export type ForumModerationRequest =
  | {
      kind: "post";
      target: ForumPost;
      action: ForumPostModerationAction;
    }
  | {
      kind: "comment";
      target: ForumComment;
      action: ForumCommentModerationAction;
    };

export type ForumReportTarget =
  | {
      type: "post";
      id: string;
      label: string;
    }
  | {
      type: "comment";
      id: string;
      label: string;
    };

export function ForumModerationModal({
  request,
  submitting,
  onClose,
  onConfirm,
}: {
  request: ForumModerationRequest | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (
    reason: string,
  ) => Promise<void>;
}) {
  const [reason, setReason] =
    useState("");

  useEffect(() => {
    if (!request) {
      return;
    }

    const timer =
      window.setTimeout(
        () => setReason(""),
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [request]);

  if (!request) {
    return null;
  }

  const actionLabel =
    request.kind === "post"
      ? FORUM_POST_ACTION_LABELS[
          request.action
        ]
      : FORUM_COMMENT_ACTION_LABELS[
          request.action
        ];

  const targetTitle =
    request.kind === "post"
      ? request.target.title
      : request.target.content;

  return (
    <Modal
      open
      centered
      width={560}
      title={actionLabel}
      okText={actionLabel}
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{
        danger: [
          "hide",
          "reject",
          "delete",
        ].includes(request.action),
        disabled: !reason.trim(),
      }}
      onCancel={onClose}
      onOk={() =>
        void onConfirm(reason.trim())
      }
      mask={{
        closable: !submitting,
      }}
      styles={{
        footer: {
          marginTop: 32,
        },
      }}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text
          type="secondary"
          className="block text-xs"
        >
          Nội dung xử lý
        </Text>

        <Text
          strong
          className="mt-1 block line-clamp-3"
        >
          {targetTitle}
        </Text>
      </div>

      <div className="mt-4 pb-2">
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          Lý do kiểm duyệt{" "}
          <span className="text-red-500">*</span>
        </label>

        <TextArea
          rows={4}
          maxLength={500}
          showCount
          value={reason}
          placeholder="Nhập lý do xử lý nội dung"
          onChange={(event) =>
            setReason(event.target.value)
          }
        />
      </div>
    </Modal>
  );
}

export function ForumReportContentModal({
  target,
  submitting,
  reasonPreset,
  detail,
  onReasonChange,
  onDetailChange,
  onClose,
  onSubmit,
}: {
  target: ForumReportTarget | null;
  submitting: boolean;
  reasonPreset: string;
  detail: string;
  onReasonChange: (
    value: string,
  ) => void;
  onDetailChange: (
    value: string,
  ) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <Modal
      open={Boolean(target)}
      centered
      width={520}
      title={
        target
          ? `Báo cáo ${target.label}`
          : "Báo cáo nội dung"
      }
      okText="Gửi báo cáo"
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{
        disabled:
          !reasonPreset.trim(),
      }}
      onCancel={onClose}
      onOk={() =>
        void onSubmit()
      }
      mask={{
        closable:
          !submitting,
      }}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Lý do báo cáo{" "}
            <span className="text-red-500">*</span>
          </label>

          <Select
            value={
              reasonPreset ||
              undefined
            }
            className="w-full"
            placeholder="Chọn lý do"
            options={
              FORUM_REPORT_REASON_OPTIONS
            }
            onChange={
              onReasonChange
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Mô tả thêm
          </label>

          <TextArea
            rows={4}
            maxLength={500}
            showCount
            value={detail}
            placeholder="Mô tả nội dung cần kiểm duyệt..."
            onChange={(event) =>
              onDetailChange(
                event.target.value,
              )
            }
          />
        </div>
      </div>
    </Modal>
  );
}

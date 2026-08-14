"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  Input,
  Modal,
  Typography,
} from "antd";
import type {
  ForumPost,
} from "@/management/features/forums/forums.types";

const { Text } = Typography;
const { TextArea } = Input;

export function ForumHardDeleteModal({
  post,
  deleting,
  onClose,
  onConfirm,
}: {
  post: ForumPost | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: (
    reason: string,
  ) => Promise<void>;
}) {
  const [reason, setReason] =
    useState("");

  useEffect(() => {
    if (!post) {
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
  }, [post]);

  return (
    <Modal
      open={Boolean(post)}
      centered
      width={520}
      title="Xóa cứng bài viết"
      okText="Xóa vĩnh viễn"
      cancelText="Hủy"
      okButtonProps={{
        danger: true,
        disabled:
          !reason.trim(),
      }}
      confirmLoading={deleting}
      onCancel={onClose}
      onOk={() =>
        void onConfirm(
          reason.trim(),
        )
      }
      mask={{
        closable: !deleting,
      }}
      styles={{
        footer: {
          marginTop: 28,
        },
      }}
    >
      <Alert
        type="error"
        showIcon
        title="Hành động không thể hoàn tác"
        description="Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống, không phải chuyển sang trạng thái Đã xóa."
      />

      <div className="mt-4">
        <Text
          type="secondary"
          className="block text-xs"
        >
          Bài viết
        </Text>

        <Text
          strong
          className="mt-1 block"
        >
          {post?.title}
        </Text>
      </div>

      <div className="mt-4 pb-2">
        <label className="mb-2 block text-sm font-semibold">
          Lý do xóa cứng{" "}
          <span className="text-red-500">*</span>
        </label>

        <TextArea
          rows={4}
          showCount
          maxLength={500}
          value={reason}
          disabled={deleting}
          placeholder="Nhập lý do xóa cứng bài viết"
          onChange={(event) =>
            setReason(event.target.value)
          }
        />
      </div>
    </Modal>
  );
}

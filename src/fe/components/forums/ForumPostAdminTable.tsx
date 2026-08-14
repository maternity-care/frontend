"use client";

import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  ForumPost,
  ForumTopic,
} from "@/management/features/forums/forums.types";
import {
  formatForumDateTime,
  getForumPostStatusColor,
  getForumPostStatusLabel,
} from "@/management/features/forums/forums.utils";
const { Text } = Typography;

type Props = {
  posts: ForumPost[];
  topics: ForumTopic[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  canHardDelete: boolean;
  onEdit: (
    post: ForumPost,
  ) => void;
  onDelete: (
    post: ForumPost,
  ) => void;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
};

export function ForumPostAdminTable({
  posts,
  topics,
  loading,
  page,
  pageSize,
  total,
  canHardDelete,
  onEdit,
  onDelete,
  onPageChange,
}: Props) {
  const topicById =
    new Map(
      topics.map(
        (topic) => [
          topic.id,
          topic.title,
        ],
      ),
    );

  const columns:
    ColumnsType<ForumPost> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (
        _value,
        _post,
        index,
      ) =>
        (page - 1) *
          pageSize +
        index +
        1,
    },
    {
      title: "Bài viết",
      width: 350,
      render: (
        _value,
        post,
      ) => (
        <div className="min-w-0">
          <Text
            strong
            ellipsis={{
              tooltip:
                post.title,
            }}
            className="block"
          >
            {post.title}
          </Text>

          <Text
            type="secondary"
            className="block text-xs"
          >
            ID: {post.id}
          </Text>
        </div>
      ),
    },
    {
      title: "Chủ đề",
      width: 190,
      render: (
        _value,
        post,
      ) => (
        <Text
          ellipsis={{
            tooltip:
              post.topicTitle,
          }}
          className="block"
        >
          {post.topicTitle ||
            topicById.get(
              post.topicId,
            ) ||
            "Chưa cập nhật"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      width: 135,
      align: "center",
      render: (
        _value,
        post,
      ) => (
        <Tag
          color={getForumPostStatusColor(
            post.status,
          )}
        >
          {getForumPostStatusLabel(
            post.status,
          )}
        </Tag>
      ),
    },
    {
      title: "Cập nhật",
      width: 165,
      render: (
        _value,
        post,
      ) =>
        formatForumDateTime(
          post.updatedAt,
        ),
    },
    {
      title: "Thao tác",
      width: 120,
      align: "center",
      render: (
        _value,
        post,
      ) => (
        <Space size={6}>
          <Tooltip title="Chỉnh sửa bài viết">
            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={() =>
                onEdit(post)
              }
            />
          </Tooltip>

          <Tooltip
            title={
              canHardDelete
                ? "Xóa cứng bài viết"
                : "Không có quyền xóa cứng"
            }
          >
            <span>
              <Button
                danger
                disabled={
                  !canHardDelete
                }
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={() =>
                  onDelete(post)
                }
              />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="overflow-hidden border-slate-200 bg-white"
      styles={{
        body: {
          padding: 0,
        },
      }}
      title="Danh sách quản trị bài viết"
    >
      <Table
        rowKey="id"
        tableLayout="fixed"
        loading={loading}
        columns={columns}
        dataSource={posts}
        scroll={{
          x: 1024,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [
            10,
            20,
            50,
          ],
          showTotal: (
            count,
            range,
          ) =>
            `${range[0]}-${range[1]} / ${count} bài viết`,
          onChange:
            onPageChange,
        }}
        className="management-table [&_.ant-table-cell]:px-3"
      />
    </Card>
  );
}
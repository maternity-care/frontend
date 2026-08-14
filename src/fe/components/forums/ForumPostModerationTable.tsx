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
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Pin,
  Star,
  XCircle,
} from "lucide-react";
import type {
  ForumPost,
  ForumPostModerationAction,
  ForumTopic,
} from "@/management/features/forums/forums.types";
import {
  getForumAuthorRoleLabel,
  getForumCategoryLabel,
  getForumPostStatusColor,
  getForumPostStatusLabel,
  stripForumHtml,
} from "@/management/features/forums/forums.utils";

const { Text } = Typography;

type Props = {
  posts: ForumPost[];
  topics: ForumTopic[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  canModerateContent: boolean;
  onView: (
    post: ForumPost,
  ) => void;
  onModerate: (
    post: ForumPost,
    action: ForumPostModerationAction,
  ) => void;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
};

export function ForumPostModerationTable({
  posts,
  topics,
  loading,
  page,
  pageSize,
  total,
  canModerateContent,
  onView,
  onModerate,
  onPageChange,
}: Props) {
  const topicById =
    new Map(
      topics.map(
        (topic) => [
          topic.id,
          topic,
        ],
      ),
    );

  const columns:
    ColumnsType<ForumPost> = [
    {
      title: "STT",
      width: 58,
      align: "center",
      render: (
        _value,
        _record,
        index,
      ) =>
        (page - 1) *
          pageSize +
        index +
        1,
    },
    {
      title: "Bài viết",
      width: 340,
      render: (
        _value,
        post,
      ) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {post.isPinned ? (
              <Pin className="h-4 w-4 shrink-0 text-blue-600" />
            ) : null}

            {post.isFeatured ? (
              <Star className="h-4 w-4 shrink-0 text-amber-500" />
            ) : null}

            {post.isLocked ? (
              <Lock className="h-4 w-4 shrink-0 text-slate-500" />
            ) : null}

            <Text
              strong
              className="truncate"
            >
              {post.title}
            </Text>
          </div>

          <Text
            type="secondary"
            className="mt-1 block truncate text-xs"
          >
            {post.excerpt ||
              stripForumHtml(
                post.content,
              ) ||
              "Không có mô tả"}
          </Text>
        </div>
      ),
    },
    {
      title: "Chủ đề",
      width: 165,
      render: (
        _value,
        post,
      ) => (
        <Tag color="blue">
          {post.topicTitle ||
            topicById.get(
              post.topicId,
            )?.title ||
            getForumCategoryLabel(
              post.category,
            )}
        </Tag>
      ),
    },
    {
      title: "Tác giả",
      width: 165,
      render: (
        _value,
        post,
      ) => (
        <div>
          <Text strong>
            {post.authorName}
          </Text>

          <Text
            type="secondary"
            className="block text-xs"
          >
            {getForumAuthorRoleLabel(
              post.authorRole,
            )}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      width: 125,
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
      title: "Thao tác",
      width:
        canModerateContent
          ? 175
          : 75,
      align: "center",
      render: (
        _value,
        post,
      ) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={
                <Eye className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                onView(post);
              }}
            />
          </Tooltip>

          {canModerateContent ? (
            post.status !==
            "published" ? (
              <Tooltip title="Duyệt bài">
                <Button
                  size="small"
                  type="primary"
                  icon={
                    <CheckCircle2 className="h-4 w-4" />
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onModerate(
                      post,
                      "approve",
                    );
                  }}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Ẩn bài">
                <Button
                  size="small"
                  icon={
                    <EyeOff className="h-4 w-4" />
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onModerate(
                      post,
                      "hide",
                    );
                  }}
                />
              </Tooltip>
            )
          ) : null}

          {canModerateContent ? (
            <Tooltip title="Từ chối">
              <Button
                size="small"
                danger
                icon={
                  <XCircle className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onModerate(
                    post,
                    "reject",
                  );
                }}
              />
            </Tooltip>
          ) : null}
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
      title="Danh sách bài viết"
    >
      <Table
        rowKey="id"
        size="middle"
        tableLayout="fixed"
        loading={loading}
        columns={columns}
        dataSource={posts}
        scroll={{
          x: 1028,
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
            100,
          ],
          showTotal: (
            nextTotal,
            range,
          ) =>
            `${range[0]}-${range[1]} / ${nextTotal} bài viết`,
          onChange:
            onPageChange,
        }}
        onRow={(post) => ({
          className:
            "cursor-pointer",
          onClick: (
            event,
          ) => {
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

            onView(post);
          },
        })}
        className="management-table [&_.ant-table-cell]:px-3"
      />
    </Card>
  );
}

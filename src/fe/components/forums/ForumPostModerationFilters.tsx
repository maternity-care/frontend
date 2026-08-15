"use client";

import type {
  ReactNode,
} from "react";
import {
  Button,
  Card,
  Input,
  Select,
} from "antd";
import {
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  FORUM_AUTHOR_ROLE_OPTIONS,
  FORUM_CATEGORY_OPTIONS,
  FORUM_POST_STATUS_OPTIONS,
} from "@/management/features/forums/forums.constants";
import type {
  ForumAuthorRole,
  ForumCategory,
  ForumPostStatus,
  ForumTopic,
} from "@/management/features/forums/forums.types";

type Props = {
  navigation: ReactNode;
  topics: ForumTopic[];
  keyword: string;
  categoryFilter?: ForumCategory;
  topicFilter?: string;
  statusFilter?: ForumPostStatus;
  authorRoleFilter?: ForumAuthorRole;
  onKeywordChange: (
    value: string,
  ) => void;
  onCategoryChange: (
    value?: ForumCategory,
  ) => void;
  onTopicChange: (
    value?: string,
  ) => void;
  onStatusChange: (
    value?: ForumPostStatus,
  ) => void;
  onAuthorRoleChange: (
    value?: ForumAuthorRole,
  ) => void;
  canCreatePost?: boolean;
  onCreate?: () => void;
  onReset: () => void;
};

export function ForumPostModerationFilters({
  navigation,
  topics,
  keyword,
  categoryFilter,
  topicFilter,
  statusFilter,
  authorRoleFilter,
  onKeywordChange,
  onCategoryChange,
  onTopicChange,
  onStatusChange,
  onAuthorRoleChange,
  canCreatePost = false,
  onCreate,
  onReset,
}: Props) {
  return (
    <Card
      className="border-slate-200 bg-white"
      styles={{
        body: {
          padding: 20,
        },
      }}
    >
      <div className="max-w-full overflow-x-auto">
        {navigation}
      </div>

      <div className="my-4 h-px bg-slate-100" />

      <div className="grid min-w-0 grid-cols-1 items-center gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(130px,0.9fr)_minmax(150px,1fr)_minmax(130px,0.9fr)_minmax(145px,1fr)_auto_auto]">
        <Input
          allowClear
          value={keyword}
          prefix={
            <Search className="h-4 w-4 text-slate-400" />
          }
          placeholder="Tìm bài viết..."
          onChange={(event) =>
            onKeywordChange(
              event.target.value,
            )
          }
        />

        <Select
          allowClear
          value={categoryFilter}
          placeholder="Danh mục"
          options={
            FORUM_CATEGORY_OPTIONS
          }
          onChange={
            onCategoryChange
          }
        />

        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          value={topicFilter}
          placeholder="Chủ đề"
          options={topics.map(
            (topic) => ({
              value: topic.id,
              label: topic.title,
            }),
          )}
          onChange={
            onTopicChange
          }
        />

        <Select
          allowClear
          value={statusFilter}
          placeholder="Trạng thái"
          options={
            FORUM_POST_STATUS_OPTIONS
          }
          onChange={
            onStatusChange
          }
        />

        <Select
          allowClear
          value={authorRoleFilter}
          placeholder="Vai trò tác giả"
          options={
            FORUM_AUTHOR_ROLE_OPTIONS
          }
          onChange={
            onAuthorRoleChange
          }
        />

        <Button
          icon={
            <X className="h-4 w-4" />
          }
          onClick={onReset}
        >
          Xóa lọc
        </Button>

        {canCreatePost &&
        onCreate ? (
          <Button
            type="primary"
            icon={
              <Plus className="h-4 w-4" />
            }
            className="whitespace-nowrap"
            onClick={onCreate}
          >
            Tạo bài viết
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
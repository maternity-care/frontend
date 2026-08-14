"use client";

import {
  Button,
  Card,
  Input,
  Select,
} from "antd";
import {
  Plus,
  Search,
} from "lucide-react";
import {
  FORUM_POST_EDITOR_STATUS_OPTIONS,
} from "@/management/features/forums/forums.constants";
import type {
  ForumPostStatus,
  ForumTopic,
} from "@/management/features/forums/forums.types";

type Props = {
  topics: ForumTopic[];
  keyword: string;
  topicFilter?: string;
  statusFilter?: ForumPostStatus;
  onKeywordChange: (
    value: string,
  ) => void;
  onTopicChange: (
    value?: string,
  ) => void;
  onStatusChange: (
    value?: ForumPostStatus,
  ) => void;
  onCreate: () => void;
};

export function ForumPostAdminFilters({
  topics,
  keyword,
  topicFilter,
  statusFilter,
  onKeywordChange,
  onTopicChange,
  onStatusChange,
  onCreate,
}: Props) {
  return (
    <Card className="border-slate-200 bg-white">
      <div className="grid min-w-0 grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input
          allowClear
          value={keyword}
          prefix={
            <Search className="h-4 w-4 text-slate-400" />
          }
          placeholder="Tìm theo tiêu đề hoặc nội dung"
          onChange={(event) =>
            onKeywordChange(
              event.target.value,
            )
          }
        />

        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          value={topicFilter}
          options={topics.map(
            (topic) => ({
              value: topic.id,
              label: topic.title,
            }),
          )}
          placeholder="Chủ đề"
          className="w-full"
          onChange={
            onTopicChange
          }
        />

        <Select
          allowClear
          value={statusFilter}
          options={
            FORUM_POST_EDITOR_STATUS_OPTIONS
          }
          placeholder="Trạng thái"
          className="w-full"
          onChange={
            onStatusChange
          }
        />

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
      </div>
    </Card>
  );
}

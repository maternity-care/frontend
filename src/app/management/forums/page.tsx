"use client";

import { useCallback, useState } from "react";
import { Alert, Card, Col, Row, Segmented, Statistic } from "antd";
import {
  CircleAlert,
  FileText,
  Flag,
  MessagesSquare,
  Tags,
} from "lucide-react";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import type { ForumTopic } from "@/management/features/forums/forums.types";
import { ForumPostsTab } from "./components/ForumPostsTab";
import { ForumReportsTab } from "./components/ForumReportsTab";
import { ForumTopicsTab } from "./components/ForumTopicsTab";

type ForumView = "posts" | "reports" | "topics";

type PostSummary = {
  total: number;
  pending: number;
};

type ReportSummary = {
  total: number;
  needAction: number;
};

export default function ForumManagementPage() {
  const [view, setView] = useState<ForumView>("posts");
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [postSummary, setPostSummary] = useState<PostSummary>({
    total: 0,
    pending: 0,
  });
  const [reportSummary, setReportSummary] = useState<ReportSummary>({
    total: 0,
    needAction: 0,
  });

  const handleTopicsChange = useCallback((nextTopics: ForumTopic[]) => {
    setTopics(nextTopics);
  }, []);

  const handlePostSummaryChange = useCallback((summary: PostSummary) => {
    setPostSummary(summary);
  }, []);

  const handleReportSummaryChange = useCallback((summary: ReportSummary) => {
    setReportSummary(summary);
  }, []);

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý diễn đàn"
        description="Quản lý chủ đề, kiểm duyệt bài viết, bình luận trong bài và xử lý báo cáo nội dung."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Alert
          type="info"
          showIcon
          title="Dữ liệu được tải trực tiếp từ Management - Forums"
          description="Bình luận được kiểm duyệt trong chi tiết bài viết. Swagger hiện không có API danh sách bình luận riêng nên tab Bình luận đã được loại bỏ."
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Tổng bài viết"
                value={postSummary.total}
                prefix={<FileText className="mr-2 h-5 w-5 text-blue-600" />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="border-amber-100 bg-amber-50/60">
              <Statistic
                title="Chờ duyệt trên trang"
                value={postSummary.pending}
                prefix={<CircleAlert className="mr-2 h-5 w-5 text-amber-600" />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="border-red-100 bg-red-50/60">
              <Statistic
                title="Báo cáo cần xử lý"
                value={reportSummary.needAction}
                prefix={<Flag className="mr-2 h-5 w-5 text-red-600" />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="border-purple-100 bg-purple-50/60">
              <Statistic
                title="Tổng chủ đề"
                value={topics.length}
                prefix={<Tags className="mr-2 h-5 w-5 text-purple-600" />}
              />
            </Card>
          </Col>
        </Row>

        {view !== "posts" ? (
          <Card className="border-slate-200 bg-white">
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
                  value: "reports",
                  label: (
                    <span className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Báo cáo
                    </span>
                  ),
                },
                {
                  value: "topics",
                  label: (
                    <span className="flex items-center gap-2">
                      <Tags className="h-4 w-4" />
                      Chủ đề
                    </span>
                  ),
                },
              ]}
              onChange={setView}
            />
          </Card>
        ) : null}

        <div className={view === "posts" ? "block" : "hidden"}>
          <ForumPostsTab
            topics={topics}
            navigation={
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
                    value: "reports",
                    label: (
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Báo cáo
                      </span>
                    ),
                  },
                  {
                    value: "topics",
                    label: (
                      <span className="flex items-center gap-2">
                        <Tags className="h-4 w-4" />
                        Chủ đề
                      </span>
                    ),
                  },
                ]}
                onChange={setView}
              />
            }
            onSummaryChange={handlePostSummaryChange}
          />
        </div>

        <div className={view === "reports" ? "block" : "hidden"}>
          <ForumReportsTab onSummaryChange={handleReportSummaryChange} />
        </div>

        <div className={view === "topics" ? "block" : "hidden"}>
          <ForumTopicsTab onTopicsChange={handleTopicsChange} />
        </div>
      </div>
    </AdminLayout>
  );
}
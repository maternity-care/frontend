"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  Card,
  Col,
  Row,
  Segmented,
  Statistic,
} from "antd";
import {
  CircleAlert,
  FilePenLine,
  FileText,
  Flag,
  MessagesSquare,
  Tags,
} from "lucide-react";

import { useAuthStore } from "@/features/auth/auth.store";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import type { ForumTopic } from "@/management/features/forums/forums.types";
import { useForumRealtime } from "@/features/forum/useForumRealtime";
import { ForumPostAdminTab } from "./components/ForumPostAdminTab";
import { ForumPostsTab } from "./components/ForumPostsTab";
import { ForumReportsTab } from "./components/ForumReportsTab";
import { ForumTopicsTab } from "./components/ForumTopicsTab";

type ForumView =
  | "posts"
  | "post-admin"
  | "reports"
  | "topics";

type ForumNavigationOption = {
  value: ForumView;
  label: ReactNode;
};

type PostSummary = {
  total: number;
  pending: number;
};

type ReportSummary = {
  total: number;
  needAction: number;
};

export default function ForumManagementPage() {
  const searchParams = useSearchParams();
  const roles = useAuthStore(
    (state) => state.roles,
  );
  const isForumAdmin =
    roles.includes("admin") ||
    roles.includes("super_admin");
  const isSuperAdmin =
    roles.includes("super_admin");

  const [view, setView] =
    useState<ForumView>("posts");
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  const [topics, setTopics] = useState<
    ForumTopic[]
  >([]);
  const [postSummary, setPostSummary] =
    useState<PostSummary>({
      total: 0,
      pending: 0,
    });
  const [
    reportSummary,
    setReportSummary,
  ] = useState<ReportSummary>({
    total: 0,
    needAction: 0,
  });

  const activeView =
    !isForumAdmin &&
    view === "post-admin"
      ? "posts"
      : view;

  useEffect(() => {
    const requestedView = searchParams.get("view");
    if (
      requestedView === "posts" ||
      requestedView === "post-admin" ||
      requestedView === "reports" ||
      requestedView === "topics"
    ) {
      const timer = window.setTimeout(() => setView(requestedView), 0);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams]);

  useForumRealtime({
    management: true,
    onEvent: () => setRealtimeVersion((current) => current + 1),
  });

  const navigationOptions =
    useMemo<ForumNavigationOption[]>(
      () => [
        {
          value: "posts",
          label: (
            <span className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" />
              Bài viết
            </span>
          ),
        },
        ...(isForumAdmin
          ? [
              {
                value:
                  "post-admin" as const,
                label: (
                  <span className="flex items-center gap-2">
                    <FilePenLine className="h-4 w-4" />
                    Quản trị bài viết
                  </span>
                ),
              },
            ]
          : []),
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
      ],
      [isForumAdmin],
    );

  const handleTopicsChange =
    useCallback(
      (nextTopics: ForumTopic[]) => {
        setTopics(nextTopics);
      },
      [],
    );

  const handlePostSummaryChange =
    useCallback(
      (summary: PostSummary) => {
        setPostSummary(summary);
      },
      [],
    );

  const handleReportSummaryChange =
    useCallback(
      (summary: ReportSummary) => {
        setReportSummary(summary);
      },
      [],
    );

  const navigation = (
    <Segmented<ForumView>
      value={activeView}
      options={navigationOptions}
      onChange={setView}
    />
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý diễn đàn"
        description="Kiểm duyệt bài viết, quản trị nội dung, quản lý chủ đề và xử lý báo cáo."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Tổng bài viết"
                value={postSummary.total}
                prefix={
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="border-amber-100 bg-amber-50/60">
              <Statistic
                title="Chờ duyệt trên trang"
                value={postSummary.pending}
                prefix={
                  <CircleAlert className="mr-2 h-5 w-5 text-amber-600" />
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="border-red-100 bg-red-50/60">
              <Statistic
                title="Báo cáo cần xử lý"
                value={
                  reportSummary.needAction
                }
                prefix={
                  <Flag className="mr-2 h-5 w-5 text-red-600" />
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="border-purple-100 bg-purple-50/60">
              <Statistic
                title="Tổng chủ đề"
                value={topics.length}
                prefix={
                  <Tags className="mr-2 h-5 w-5 text-purple-600" />
                }
              />
            </Card>
          </Col>
        </Row>

        {activeView !== "posts" ? (
          <Card className="border-slate-200 bg-white">
            {navigation}
          </Card>
        ) : null}

        <div
          className={
            activeView === "posts"
              ? "block"
              : "hidden"
          }
        >
          <ForumPostsTab
            topics={topics}
            navigation={navigation}
            focusPostId={searchParams.get("postId") ?? undefined}
            realtimeVersion={realtimeVersion}
            onSummaryChange={
              handlePostSummaryChange
            }
          />
        </div>

        {isForumAdmin ? (
          <div
            className={
              activeView ===
              "post-admin"
                ? "block"
                : "hidden"
            }
          >
            <ForumPostAdminTab
              topics={topics}
              realtimeVersion={realtimeVersion}
              canHardDelete={
                isSuperAdmin
              }
            />
          </div>
        ) : null}

        <div
          className={
            activeView === "reports"
              ? "block"
              : "hidden"
          }
        >
          <ForumReportsTab
            realtimeVersion={realtimeVersion}
            onSummaryChange={
              handleReportSummaryChange
            }
          />
        </div>

        <div
          className={
            activeView === "topics"
              ? "block"
              : "hidden"
          }
        >
          <ForumTopicsTab
            onTopicsChange={
              handleTopicsChange
            }
          />
        </div>
      </div>
    </AdminLayout>
  );
}

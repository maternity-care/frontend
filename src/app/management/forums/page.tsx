"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "next/navigation";
import type {
  ReactNode,
} from "react";
import {
  Card,
  Segmented,
} from "antd";
import {
  FilePenLine,
  Flag,
  MessagesSquare,
  Tags,
} from "lucide-react";

import {
  useAuthStore,
} from "@/features/auth/auth.store";
import {
  useForumRealtime,
} from "@/features/forum/useForumRealtime";
import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import {
  PageHeader,
} from "@/management/components/ui/PageHeader";
import type {
  ForumTopic,
} from "@/management/features/forums/forums.types";
import {
  ForumPostAdminTab,
} from "./components/ForumPostAdminTab";
import {
  ForumPostsTab,
} from "./components/ForumPostsTab";
import {
  ForumReportsTab,
} from "./components/ForumReportsTab";
import {
  ForumTopicsTab,
} from "./components/ForumTopicsTab";

type ForumView =
  | "posts"
  | "post-admin"
  | "reports"
  | "topics";

type ForumNavigationOption = {
  value: ForumView;
  label: ReactNode;
};

export default function ForumManagementPage() {
  const searchParams =
    useSearchParams();
  const roles = useAuthStore(
    (state) => state.roles,
  );

  const isForumAdmin =
    roles.includes("admin") ||
    roles.includes(
      "super_admin",
    );

  const isSuperAdmin =
    roles.includes(
      "super_admin",
    );

  const [
    view,
    setView,
  ] = useState<ForumView>(
    "posts",
  );
  const [
    realtimeVersion,
    setRealtimeVersion,
  ] = useState(0);
  const [
    topics,
    setTopics,
  ] = useState<ForumTopic[]>(
    [],
  );

  const activeView =
    !isForumAdmin &&
    view === "post-admin"
      ? "posts"
      : view;

  useEffect(() => {
    const requestedView =
      searchParams.get("view");

    if (
      requestedView === "posts" ||
      requestedView ===
        "post-admin" ||
      requestedView === "reports" ||
      requestedView === "topics"
    ) {
      const timer =
        window.setTimeout(
          () =>
            setView(
              requestedView,
            ),
          0,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    }
  }, [searchParams]);

  useForumRealtime({
    management: true,
    onEvent: () =>
      setRealtimeVersion(
        (current) =>
          current + 1,
      ),
  });

  const navigationOptions =
    useMemo<
      ForumNavigationOption[]
    >(
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
      (
        nextTopics:
          ForumTopic[],
      ) => {
        setTopics(
          nextTopics,
        );
      },
      [],
    );

  const navigation = (
    <Segmented<ForumView>
      value={activeView}
      options={
        navigationOptions
      }
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
        {activeView !==
        "posts" ? (
          <Card className="border-slate-200 bg-white">
            {navigation}
          </Card>
        ) : null}

        <div
          className={
            activeView ===
            "posts"
              ? "block"
              : "hidden"
          }
        >
          <ForumPostsTab
            topics={topics}
            navigation={
              navigation
            }
            focusPostId={
              searchParams.get(
                "postId",
              ) ??
              undefined
            }
            realtimeVersion={
              realtimeVersion
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
              realtimeVersion={
                realtimeVersion
              }
              canHardDelete={
                isSuperAdmin
              }
            />
          </div>
        ) : null}

        <div
          className={
            activeView ===
            "reports"
              ? "block"
              : "hidden"
          }
        >
          <ForumReportsTab
            realtimeVersion={
              realtimeVersion
            }
          />
        </div>

        <div
          className={
            activeView ===
            "topics"
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
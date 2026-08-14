"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";
import {
  Card,
  Result,
  Segmented,
} from "antd";
import {
  FilePenLine,
  Flag,
  MessagesSquare,
  Tags,
} from "lucide-react";
import {
  useSearchParams,
} from "next/navigation";
import {
  useForumRealtime,
} from "@/features/forum/useForumRealtime";
import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import type {
  ForumTopic,
} from "@/management/features/forums/forums.types";
import {
  useForumAccess,
} from "@/hooks/forums/useForumAccess";
import {
  ForumPostAdminTab,
} from "@/fe/components/forums/ForumPostAdminTab";
import {
  ForumPostsTab,
} from "@/fe/components/forums/ForumPostsTab";
import {
  ForumReportsTab,
} from "@/fe/components/forums/ForumReportsTab";
import {
  ForumTopicsTab,
} from "@/fe/components/forums/ForumTopicsTab";

type ForumView =
  | "posts"
  | "post-admin"
  | "reports"
  | "topics";

type NavigationOption = {
  value: ForumView;
  label: ReactNode;
};

function ForumManagementContent() {
  const searchParams =
    useSearchParams();

  const access =
    useForumAccess();

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
  ] = useState<
    ForumTopic[]
  >([]);

  const activeView =
    access.canFullManageForum
      ? view
      : "posts";

  useEffect(() => {
    const requestedView =
      searchParams.get(
        "view",
      );

    if (
      requestedView !==
        "posts" &&
      requestedView !==
        "post-admin" &&
      requestedView !==
        "reports" &&
      requestedView !==
        "topics"
    ) {
      return;
    }

    const nextView =
      access.canFullManageForum ||
      requestedView ===
        "posts"
        ? requestedView
        : "posts";

    const timer =
      window.setTimeout(
        () =>
          setView(
            nextView,
          ),
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    access.canFullManageForum,
    searchParams,
  ]);

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
      NavigationOption[]
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
        ...(access.canFullManageForum
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
              {
                value:
                  "reports" as const,
                label: (
                  <span className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Báo cáo
                  </span>
                ),
              },
              {
                value:
                  "topics" as const,
                label: (
                  <span className="flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Chủ đề
                  </span>
                ),
              },
            ]
          : []),
      ],
      [
        access.canFullManageForum,
      ],
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
      onChange={(
        nextView,
      ) => {
        if (
          !access.canFullManageForum &&
          nextView !==
            "posts"
        ) {
          setView(
            "posts",
          );
          return;
        }

        setView(
          nextView,
        );
      }}
    />
  );

  if (
    !access.canAccessForum
  ) {
    return (
      <AdminLayout>
        <Result
          status="403"
          title="Không có quyền truy cập"
          subTitle="Tài khoản hiện tại không có quyền sử dụng Quản lý diễn đàn."
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý diễn đàn
        </h1>

        <p className="mb-0 text-sm text-slate-500">
          Kiểm duyệt bài viết, quản trị nội dung, quản lý chủ đề và xử lý báo cáo.
        </p>
      </div>

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
            canModerateContent={
              access.canModerateContent
            }
          />
        </div>

        {access.canFullManageForum ? (
          <>
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
                  access.canHardDelete
                }
              />
            </div>

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
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

export default function ForumManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Đang tải quản lý diễn đàn...
        </div>
      }
    >
      <ForumManagementContent />
    </Suspense>
  );
}

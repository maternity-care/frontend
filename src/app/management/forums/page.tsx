"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
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

import { useAuthStore } from "@/features/auth/auth.store";
import { useForumRealtime } from "@/features/forum/useForumRealtime";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import type { ForumTopic } from "@/management/features/forums/forums.types";
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

function ForumManagementContent() {
  const searchParams =
    useSearchParams();

  const roles =
    useAuthStore(
      (state) => state.roles,
    );
  const user =
    useAuthStore(
      (state) => state.user,
    );
  const activeFacilityId =
    useAuthStore(
      (state) =>
        state.activeFacilityId,
    );

  const effectiveRoles =
    useMemo(() => {
      const activeFacility =
        user?.facilities?.find(
          (facility) =>
            String(
              facility.id,
            ) ===
            String(
              activeFacilityId ??
                "",
            ),
        ) ??
        user?.facilities?.find(
          (facility) =>
            facility.status ===
            "active",
        );

      const facilityRoles =
        activeFacility?.roles
          ?.length
          ? activeFacility.roles
          : activeFacility?.role
            ? [
                activeFacility.role,
              ]
            : [];

      const roleName = (
        role:
          | string
          | {
              name?: string;
            }
          | null
          | undefined,
      ) =>
        typeof role === "string"
          ? role
          : role?.name;

      return new Set(
        [
          ...roles,
          ...(user?.roles?.map(
            roleName,
          ) ?? []),
          ...facilityRoles.map(
            roleName,
          ),
        ]
          .filter(
            (
              role,
            ): role is string =>
              Boolean(role),
          )
          .map((role) =>
            role.toLowerCase(),
          ),
      );
    }, [
      activeFacilityId,
      roles,
      user,
    ]);

  const canFullManageForum =
    effectiveRoles.has("staff") ||
    effectiveRoles.has("admin") ||
    effectiveRoles.has(
      "super_admin",
    );

  const isDoctor =
    effectiveRoles.has("doctor");

  const canAccessForum =
    canFullManageForum ||
    isDoctor;

  const [view, setView] =
    useState<ForumView>(
      "posts",
    );
  const [
    realtimeVersion,
    setRealtimeVersion,
  ] = useState(0);
  const [topics, setTopics] =
    useState<ForumTopic[]>([]);

  const activeView =
    canFullManageForum
      ? view
      : "posts";

  useEffect(() => {
    const requestedView =
      searchParams.get("view");

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
      canFullManageForum ||
      requestedView ===
        "posts"
        ? requestedView
        : "posts";

    const timer =
      window.setTimeout(
        () =>
          setView(nextView),
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    canFullManageForum,
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
        ...(canFullManageForum
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
        canFullManageForum,
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
      onChange={(nextView) => {
        if (
          !canFullManageForum &&
          nextView !== "posts"
        ) {
          setView("posts");
          return;
        }

        setView(nextView);
      }}
    />
  );

  if (!canAccessForum) {
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
          Kiểm duyệt bài viết, quản trị nội dung, quản lý chủ đề và xử lý báo
          cáo.
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
              canFullManageForum
            }
          />
        </div>

        {canFullManageForum ? (
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
                canHardDelete
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

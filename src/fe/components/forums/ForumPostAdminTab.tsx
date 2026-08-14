"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  App,
} from "antd";
import {
  createForumPost,
  deleteForumPost,
  getForumPosts,
  updateForumPost,
} from "@/management/features/forums/forums.api";
import type {
  CreateForumPostInput,
  ForumPost,
  ForumPostStatus,
  ForumTopic,
  UpdateForumPostInput,
} from "@/management/features/forums/forums.types";
import {
  getForumErrorMessage,
  getForumPostCreatedTime,
} from "@/management/features/forums/forums.utils";
import {
  ForumHardDeleteModal,
} from "./ForumHardDeleteModal";
import {
  ForumPostAdminFilters,
} from "./ForumPostAdminFilters";
import {
  ForumPostAdminTable,
} from "./ForumPostAdminTable";
import {
  ForumPostEditorModal,
} from "./ForumPostEditorModal";
import type {
  ForumPostEditorState,
  ForumPostEditorValues,
} from "./ForumPostEditorModal";

type Props = {
  topics: ForumTopic[];
  canHardDelete: boolean;
  realtimeVersion?: number;
};

export function ForumPostAdminTab({
  topics,
  canHardDelete,
  realtimeVersion = 0,
}: Props) {
  const {
    message,
  } = App.useApp();

  const [
    posts,
    setPosts,
  ] = useState<
    ForumPost[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    keyword,
    setKeyword,
  ] = useState("");

  const [
    topicFilter,
    setTopicFilter,
  ] = useState<
    string | undefined
  >();

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    ForumPostStatus | undefined
  >();

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    editorState,
    setEditorState,
  ] = useState<ForumPostEditorState>({
    open: false,
    mode: "create",
    post: null,
  });

  const [
    deletingPost,
    setDeletingPost,
  ] = useState<
    ForumPost | null
  >(null);

  const loadPosts =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getForumPosts({
            page,
            limit: pageSize,
            search:
              keyword.trim() ||
              undefined,
            topicId:
              topicFilter,
            status:
              statusFilter,
          });

        setPosts(
          [...result.items].sort(
            (
              left,
              right,
            ) =>
              getForumPostCreatedTime(
                right,
              ) -
              getForumPostCreatedTime(
                left,
              ),
          ),
        );

        setTotal(
          result.total,
        );

        setPage(
          result.page,
        );

        setPageSize(
          result.limit,
        );
      } catch (
        loadError
      ) {
        setError(
          getForumErrorMessage(
            loadError,
          ),
        );
      } finally {
        setLoading(
          false,
        );
      }
    }, [
      keyword,
      page,
      pageSize,
      statusFilter,
      topicFilter,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadPosts();
        },
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    loadPosts,
    realtimeVersion,
  ]);

  async function handleSubmit(
    values: ForumPostEditorValues,
  ) {
    setSubmitting(true);

    try {
      if (
        editorState.open &&
        editorState.mode ===
          "edit"
      ) {
        const input:
          UpdateForumPostInput = {
          topicId:
            values.topicId,
          title:
            values.title,
          content:
            values.content,
          status:
            values.status,
          commentable:
            values.commentable,
          isPinned:
            values.isPinned,
          isFeatured:
            values.isFeatured,
          moderationReason:
            values.moderationReason,
        };

        await updateForumPost(
          editorState.post.id,
          input,
        );

        message.success(
          "Cập nhật bài viết thành công.",
        );
      } else {
        const input:
          CreateForumPostInput = {
          topicId:
            values.topicId,
          title:
            values.title,
          content:
            values.content,
          status:
            values.status,
          commentable:
            values.commentable,
          isPinned:
            values.isPinned,
          isFeatured:
            values.isFeatured,
          moderationReason:
            values.moderationReason,
        };

        await createForumPost(
          input,
        );

        message.success(
          "Tạo bài viết thành công.",
        );
      }

      const wasCreate =
        editorState.mode ===
        "create";

      setEditorState({
        open: false,
        mode: "create",
        post: null,
      });

      if (
        wasCreate &&
        page !== 1
      ) {
        setPage(1);
      } else {
        await loadPosts();
      }
    } catch (
      submitError
    ) {
      message.error(
        getForumErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  async function handleHardDelete(
    reason: string,
  ) {
    if (
      !deletingPost ||
      !canHardDelete
    ) {
      return;
    }

    setDeleting(true);

    try {
      await deleteForumPost(
        deletingPost.id,
        {
          reason,
        },
      );

      message.success(
        "Xóa cứng bài viết thành công.",
      );

      setDeletingPost(
        null,
      );

      if (
        posts.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            Math.max(
              1,
              current - 1,
            ),
        );
      } else {
        await loadPosts();
      }
    } catch (
      deleteError
    ) {
      message.error(
        getForumErrorMessage(
          deleteError,
        ),
      );
    } finally {
      setDeleting(
        false,
      );
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            showIcon
            closable
            title={error}
            onClose={() =>
              setError(null)
            }
          />
        ) : null}

        <ForumPostAdminFilters
          topics={topics}
          keyword={keyword}
          topicFilter={
            topicFilter
          }
          statusFilter={
            statusFilter
          }
          onKeywordChange={(value) => {
            setKeyword(value);
            setPage(1);
          }}
          onTopicChange={(value) => {
            setTopicFilter(value);
            setPage(1);
          }}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onCreate={() =>
            setEditorState({
              open: true,
              mode: "create",
              post: null,
            })
          }
        />

        <ForumPostAdminTable
          posts={posts}
          topics={topics}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          canHardDelete={
            canHardDelete
          }
          onEdit={(post) =>
            setEditorState({
              open: true,
              mode: "edit",
              post,
            })
          }
          onDelete={
            setDeletingPost
          }
          onPageChange={(
            nextPage,
            nextPageSize,
          ) => {
            if (
              nextPageSize !==
              pageSize
            ) {
              setPageSize(
                nextPageSize,
              );
              setPage(1);
              return;
            }

            setPage(
              nextPage,
            );
          }}
        />
      </div>

      <ForumPostEditorModal
        state={
          editorState
        }
        topics={topics}
        submitting={
          submitting
        }
        onClose={() => {
          if (!submitting) {
            setEditorState({
              open: false,
              mode: "create",
              post: null,
            });
          }
        }}
        onSubmit={
          handleSubmit
        }
      />

      <ForumHardDeleteModal
        post={
          deletingPost
        }
        deleting={
          deleting
        }
        onClose={() => {
          if (!deleting) {
            setDeletingPost(
              null,
            );
          }
        }}
        onConfirm={
          handleHardDelete
        }
      />
    </>
  );
}

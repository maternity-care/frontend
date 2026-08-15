"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";
import {
  Alert,
  App,
} from "antd";
import {
  createForumPost,
  deleteForumPost,
  getForumPost,
  getForumPosts,
  moderateForumComment,
  moderateForumPost,
  updateForumPost,
} from "@/management/features/forums/forums.api";
import {
  createForumComment,
  createForumReport,
} from "@/features/forum/forum.api";
import type {
  CreateForumPostInput,
  ForumAuthorRole,
  ForumCategory,
  ForumComment,
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
  ForumModerationModal,
  ForumReportContentModal,
} from "./ForumPostActionModals";
import type {
  ForumModerationRequest,
  ForumReportTarget,
} from "./ForumPostActionModals";
import {
  ForumPostDetailModal,
} from "./ForumPostDetailModal";
import {
  ForumPostEditorModal,
} from "./ForumPostEditorModal";
import type {
  ForumPostEditorState,
  ForumPostEditorValues,
} from "./ForumPostEditorModal";
import {
  ForumPostModerationFilters,
} from "./ForumPostModerationFilters";
import {
  ForumPostModerationTable,
} from "./ForumPostModerationTable";

type Props = {
  topics: ForumTopic[];
  navigation: ReactNode;
  focusPostId?: string;
  realtimeVersion?: number;
  canModerateContent: boolean;
  canManagePosts: boolean;
  canHardDelete: boolean;
};

export function ForumPostsTab({
  topics,
  navigation,
  focusPostId,
  realtimeVersion = 0,
  canModerateContent,
  canManagePosts,
  canHardDelete,
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
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    postSubmitting,
    setPostSubmitting,
  ] = useState(false);

  const [
    hardDeleting,
    setHardDeleting,
  ] = useState(false);

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
    categoryFilter,
    setCategoryFilter,
  ] = useState<
    ForumCategory | undefined
  >();

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
    authorRoleFilter,
    setAuthorRoleFilter,
  ] = useState<
    ForumAuthorRole | undefined
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
    selectedPost,
    setSelectedPost,
  ] = useState<
    ForumPost | null
  >(null);

  const [
    moderationRequest,
    setModerationRequest,
  ] = useState<
    ForumModerationRequest | null
  >(null);

  const [
    reportTarget,
    setReportTarget,
  ] = useState<
    ForumReportTarget | null
  >(null);

  const [
    reportReasonPreset,
    setReportReasonPreset,
  ] = useState("");

  const [
    reportDetail,
    setReportDetail,
  ] = useState("");

  const [
    reportSubmitting,
    setReportSubmitting,
  ] = useState(false);

  const loadPosts =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getForumPosts({
            page,
            limit: pageSize,
            category:
              categoryFilter,
            topicId:
              topicFilter,
            authorRole:
              authorRoleFilter,
            search:
              keyword.trim() ||
              undefined,
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
            "Không tải được danh sách bài viết.",
          ),
        );
      } finally {
        setLoading(
          false,
        );
      }
    }, [
      authorRoleFilter,
      categoryFilter,
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
        300,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    loadPosts,
    realtimeVersion,
  ]);

  useEffect(() => {
    if (!focusPostId) {
      return;
    }

    let active = true;

    const timer =
      window.setTimeout(
        () => {
          setDetailLoading(
            true,
          );

          void getForumPost(
            focusPostId,
          )
            .then(
              (detail) => {
                if (active) {
                  setSelectedPost(
                    detail,
                  );
                }
              },
            )
            .catch(
              (
                loadError,
              ) => {
                if (active) {
                  message.error(
                    getForumErrorMessage(
                      loadError,
                    ),
                  );
                }
              },
            )
            .finally(() => {
              if (active) {
                setDetailLoading(
                  false,
                );
              }
            });
        },
        0,
      );

    return () => {
      active = false;
      window.clearTimeout(
        timer,
      );
    };
  }, [
    focusPostId,
    message,
  ]);

  function resetFilters() {
    setKeyword("");
    setCategoryFilter(
      undefined,
    );
    setTopicFilter(
      undefined,
    );
    setStatusFilter(
      undefined,
    );
    setAuthorRoleFilter(
      undefined,
    );
    setPage(1);
  }

  function updateFilter<T>(
    setter: (
      value: T,
    ) => void,
    value: T,
  ) {
    setter(value);
    setPage(1);
  }

  async function openPostDetail(
    post: ForumPost,
  ) {
    setSelectedPost(
      post,
    );

    setDetailLoading(
      true,
    );

    try {
      setSelectedPost(
        await getForumPost(
          post.id,
        ),
      );
    } catch (
      loadError
    ) {
      message.error(
        getForumErrorMessage(
          loadError,
        ),
      );
    } finally {
      setDetailLoading(
        false,
      );
    }
  }

  function isManagementPost(
    post: ForumPost,
  ) {
    return [
      "staff",
      "moderator",
      "admin",
    ].includes(
      post.authorRole,
    );
  }

  function openCreatePost() {
    if (!canManagePosts) {
      return;
    }

    setEditorState({
      open: true,
      mode: "create",
      post: null,
    });
  }

  function openEditPost(
    post: ForumPost,
  ) {
    if (
      !canManagePosts ||
      !isManagementPost(post)
    ) {
      return;
    }

    setEditorState({
      open: true,
      mode: "edit",
      post,
    });
  }

  async function handlePostSubmit(
    values: ForumPostEditorValues,
  ) {
    if (!canManagePosts) {
      return;
    }

    setPostSubmitting(true);

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

      setEditorState({
        open: false,
        mode: "create",
        post: null,
      });

      if (page !== 1) {
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
      setPostSubmitting(false);
    }
  }

  async function handleHardDelete(
    reason: string,
  ) {
    if (
      !deletingPost ||
      !canManagePosts ||
      !canHardDelete ||
      !isManagementPost(
        deletingPost,
      )
    ) {
      return;
    }

    const postId =
      deletingPost.id;

    setHardDeleting(true);

    try {
      await deleteForumPost(
        postId,
        {
          reason,
        },
      );

      message.success(
        "Xóa cứng bài viết thành công.",
      );

      if (
        selectedPost?.id ===
        postId
      ) {
        setSelectedPost(null);
      }

      setDeletingPost(null);

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
      setHardDeleting(false);
    }
  }

  async function handleModeration(
    reason: string,
  ) {
    if (
      !canModerateContent ||
      !moderationRequest
    ) {
      return;
    }

    setSubmitting(true);

    try {
      if (
        moderationRequest.kind ===
        "post"
      ) {
        await moderateForumPost(
          moderationRequest
            .target.id,
          {
            action:
              moderationRequest.action,
            reason,
          },
        );

        message.success(
          "Kiểm duyệt bài viết thành công.",
        );

        await loadPosts();

        if (
          selectedPost?.id ===
          moderationRequest
            .target.id
        ) {
          setSelectedPost(
            await getForumPost(
              moderationRequest
                .target.id,
            ),
          );
        }
      } else {
        await moderateForumComment(
          moderationRequest
            .target.id,
          {
            action:
              moderationRequest.action,
            reason,
          },
        );

        message.success(
          "Kiểm duyệt bình luận thành công.",
        );

        if (selectedPost) {
          setSelectedPost(
            await getForumPost(
              selectedPost.id,
            ),
          );
        }
      }

      setModerationRequest(
        null,
      );
    } catch (
      moderationError
    ) {
      message.error(
        getForumErrorMessage(
          moderationError,
        ),
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  function openReport(
    target: ForumReportTarget,
  ) {
    setReportTarget(
      target,
    );
    setReportReasonPreset(
      "",
    );
    setReportDetail(
      "",
    );
  }

  function closeReport() {
    if (
      reportSubmitting
    ) {
      return;
    }

    setReportTarget(
      null,
    );
    setReportReasonPreset(
      "",
    );
    setReportDetail(
      "",
    );
  }

  async function handleSubmitReport() {
    if (
      !reportTarget ||
      !reportReasonPreset.trim()
    ) {
      return;
    }

    setReportSubmitting(
      true,
    );

    try {
      const reason = [
        reportReasonPreset.trim(),
        reportDetail.trim(),
      ]
        .filter(Boolean)
        .join(": ");

      await createForumReport({
        targetType:
          reportTarget.type,
        targetId:
          reportTarget.id,
        reason,
      });

      message.success(
        "Đã gửi báo cáo.",
      );

      closeReport();

      if (selectedPost) {
        setSelectedPost(
          await getForumPost(
            selectedPost.id,
          ),
        );
      }

      await loadPosts();
    } catch (
      reportError
    ) {
      message.error(
        getForumErrorMessage(
          reportError,
        ),
      );
    } finally {
      setReportSubmitting(
        false,
      );
    }
  }

  async function handleReplyComment(
    comment: ForumComment,
    content: string,
  ) {
    const postId =
      selectedPost?.id ||
      comment.postId;

    if (!postId) {
      message.error(
        "Không xác định được bài viết cần trả lời.",
      );

      return false;
    }

    try {
      await createForumComment(
        postId,
        {
          content,
          parentId:
            comment.id,
          messageType:
            "text",
        },
      );

      message.success(
        "Đã gửi câu trả lời.",
      );

      if (
        selectedPost?.id ===
        postId
      ) {
        setSelectedPost(
          await getForumPost(
            postId,
          ),
        );
      }

      await loadPosts();

      return true;
    } catch (
      replyError
    ) {
      message.error(
        getForumErrorMessage(
          replyError,
        ),
      );

      return false;
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() =>
              setError(null)
            }
          />
        ) : null}

        <ForumPostModerationFilters
          navigation={
            navigation
          }
          topics={topics}
          keyword={keyword}
          categoryFilter={
            categoryFilter
          }
          topicFilter={
            topicFilter
          }
          statusFilter={
            statusFilter
          }
          authorRoleFilter={
            authorRoleFilter
          }
          onKeywordChange={(value) =>
            updateFilter(
              setKeyword,
              value,
            )
          }
          onCategoryChange={(value) =>
            updateFilter(
              setCategoryFilter,
              value,
            )
          }
          onTopicChange={(value) =>
            updateFilter(
              setTopicFilter,
              value,
            )
          }
          onStatusChange={(value) =>
            updateFilter(
              setStatusFilter,
              value,
            )
          }
          onAuthorRoleChange={(value) =>
            updateFilter(
              setAuthorRoleFilter,
              value,
            )
          }
          canCreatePost={
            canManagePosts
          }
          onCreate={
            openCreatePost
          }
          onReset={
            resetFilters
          }
        />

        <ForumPostModerationTable
          posts={posts}
          topics={topics}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          canModerateContent={
            canModerateContent
          }
          canManagePosts={
            canManagePosts
          }
          canHardDelete={
            canHardDelete
          }
          onView={(post) => {
            void openPostDetail(
              post,
            );
          }}
          onModerate={(
            post,
            action,
          ) =>
            setModerationRequest({
              kind: "post",
              target: post,
              action,
            })
          }
          onEdit={
            openEditPost
          }
          onHardDelete={
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

      <ForumPostDetailModal
        post={
          selectedPost
        }
        loading={
          detailLoading
        }
        canModerateContent={
          canModerateContent
        }
        onClose={() =>
          setSelectedPost(
            null,
          )
        }
        onModeratePost={(
          post,
          action,
        ) =>
          setModerationRequest({
            kind: "post",
            target: post,
            action,
          })
        }
        onModerateComment={(
          comment,
          action,
        ) =>
          setModerationRequest({
            kind: "comment",
            target: comment,
            action,
          })
        }
        onReplyComment={
          handleReplyComment
        }
        onReportPost={(post) =>
          openReport({
            type: "post",
            id: post.id,
            label: "bài viết",
          })
        }
        onReportComment={(
          comment,
        ) =>
          openReport({
            type: "comment",
            id: comment.id,
            label: "bình luận",
          })
        }
      />

      <ForumPostEditorModal
        state={
          editorState
        }
        topics={topics}
        submitting={
          postSubmitting
        }
        onClose={() => {
          if (!postSubmitting) {
            setEditorState({
              open: false,
              mode: "create",
              post: null,
            });
          }
        }}
        onSubmit={
          handlePostSubmit
        }
      />

      <ForumHardDeleteModal
        post={
          deletingPost
        }
        deleting={
          hardDeleting
        }
        onClose={() => {
          if (!hardDeleting) {
            setDeletingPost(
              null,
            );
          }
        }}
        onConfirm={
          handleHardDelete
        }
      />

      <ForumReportContentModal
        target={
          reportTarget
        }
        submitting={
          reportSubmitting
        }
        reasonPreset={
          reportReasonPreset
        }
        detail={
          reportDetail
        }
        onReasonChange={
          setReportReasonPreset
        }
        onDetailChange={
          setReportDetail
        }
        onClose={
          closeReport
        }
        onSubmit={
          handleSubmitReport
        }
      />

      <ForumModerationModal
        request={
          moderationRequest
        }
        submitting={
          submitting
        }
        onClose={() => {
          if (!submitting) {
            setModerationRequest(
              null,
            );
          }
        }}
        onConfirm={
          handleModeration
        }
      />
    </>
  );
}
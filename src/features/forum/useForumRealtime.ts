"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  ACCESS_TOKEN_KEY,
  API_BASE_URL,
  MANAGEMENT_ACCESS_TOKEN_KEY,
} from "@/lib/constants";

const FORUM_EVENTS = [
  "forum:post.created",
  "forum:post.updated",
  "forum:post.moderated",
  "forum:comment.created",
  "forum:comment.moderated",
  "forum:report.created",
  "forum:report.resolved",
] as const;

export type ForumRealtimeEvent = (typeof FORUM_EVENTS)[number];

type ForumRealtimeOptions = {
  management?: boolean;
  postId?: string;
  onEvent: (event: ForumRealtimeEvent) => void;
};

function getSocketUrl() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}

function getAccessToken(management: boolean) {
  if (typeof window === "undefined") return null;
  const key = management ? MANAGEMENT_ACCESS_TOKEN_KEY : ACCESS_TOKEN_KEY;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export function useForumRealtime({
  management = false,
  postId,
  onEvent,
}: ForumRealtimeOptions) {
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const socket = io(`${getSocketUrl()}/realtime`, {
      transports: ["websocket", "polling"],
      auth: { token: getAccessToken(management) },
      reconnectionAttempts: 5,
    });
    let refreshTimer: number | null = null;

    const scheduleRefresh = (event: ForumRealtimeEvent) => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => callbackRef.current(event), 150);
    };

    const joinPostRoom = () => {
      if (postId) socket.emit("forum:join", { postId });
    };

    socket.on("connect", joinPostRoom);
    FORUM_EVENTS.forEach((event) => {
      socket.on(event, () => scheduleRefresh(event));
    });

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      if (postId) socket.emit("forum:leave", { postId });
      FORUM_EVENTS.forEach((event) => socket.off(event));
      socket.off("connect", joinPostRoom);
      socket.disconnect();
    };
  }, [management, postId]);
}

"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  ACCESS_TOKEN_KEY,
  API_BASE_URL,
  MANAGEMENT_ACCESS_TOKEN_KEY,
} from "@/lib/constants";
import type { AppNotification } from "./notifications.api";

type NotificationRealtimeOptions = {
  management: boolean;
  onNotification: (notification: AppNotification) => void;
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

export function useNotificationRealtime({
  management,
  onNotification,
}: NotificationRealtimeOptions) {
  const callbackRef = useRef(onNotification);

  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    const socket = io(`${getSocketUrl()}/realtime`, {
      transports: ["websocket", "polling"],
      auth: { token: getAccessToken(management) },
      reconnectionAttempts: 5,
    });

    const handleNotification = (notification: AppNotification) => {
      callbackRef.current(notification);
    };
    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.disconnect();
    };
  }, [management]);
}

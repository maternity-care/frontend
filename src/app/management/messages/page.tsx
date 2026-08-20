"use client";

import Link from "next/link";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { AlertCircle, CalendarClock, Clock3, Eye, ImageIcon, LinkIcon, LogOut, MessageCircle, MoreVertical, Paperclip, Phone, RefreshCw, Save, Search, Send, Settings2, StickyNote, Tags, Trash2, Undo2, UserPlus, UserRound, X } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { StateBlock } from "@/management/components/ui/StateBlock";
import {
  assignMessagingConversation,
  closeMessagingConversation,
  createZaloPhoneConversation,
  createMessagingTag,
  deleteMessagingConversation,
  getMessagingAccounts,
  getMessagingAppointments,
  getMessagingConversations,
  getMessagingCustomer,
  getMessagingMessages,
  getMessagingTags,
  mapMessagingUser,
  quickCreateMessagingUser,
  retryMessagingMessage,
  sendMessagingMessage,
  setMessagingConversationTags,
  undoMessagingMessage,
  updateMessagingCustomer,
} from "@/management/features/messages/messages.api";
import type {
  MessagingAccount,
  MessagingAppointment,
  MessagingConversation,
  MessagingCustomerIdentity,
  MessagingMessage,
  MessagingTag,
} from "@/management/features/messages/messages.types";
import { getUsers } from "@/management/features/management-users/management-user.api";
import type { User } from "@/management/features/management-users/management-user.types";
import { getStaffs } from "@/management/features/staffs/staffs.api";
import type { Staff } from "@/management/features/staffs/staffs.types";
import { createManagementPresignedUpload } from "@/management/features/uploads/uploads.api";
import { API_BASE_URL, MANAGEMENT_ACCESS_TOKEN_KEY } from "@/lib/constants";
import { cn, getErrorMessage } from "@/lib/utils";

function getSocketUrl() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(MANAGEMENT_ACCESS_TOKEN_KEY) ??
    window.sessionStorage.getItem(MANAGEMENT_ACCESS_TOKEN_KEY);
}

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatDateOnly(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatHourOnly(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function channelLabel(channel?: string) {
  if (channel === "zalo_personal") return "Zalo cá nhân";
  if (channel === "zalo_oa") return "Zalo OA";
  if (channel === "facebook_page") return "Facebook";
  if (channel === "web_chat") return "Web chat";
  return "Nguồn khác";
}

function channelTone(channel?: string) {
  if (channel === "facebook_page") return "bg-blue-100 text-blue-800 ring-blue-300";
  if (channel === "web_chat") return "bg-emerald-100 text-emerald-800 ring-emerald-300";
  if (channel === "zalo_oa") return "bg-sky-100 text-sky-800 ring-sky-300";
  return "bg-teal-100 text-teal-800 ring-teal-300";
}

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function deliveryStatus(message: MessagingMessage) {
  const status = metadataString(message.metadata, "deliveryStatus");
  return status === "pending" || status === "sent" || status === "failed" || status === "recalled" ? status : null;
}

function messageRecalled(message: MessagingMessage) {
  return deliveryStatus(message) === "recalled" || Boolean(metadataString(message.metadata, "recalledAt"));
}

function messageCanUndo(message: MessagingMessage) {
  return message.direction === "outbound" &&
    deliveryStatus(message) === "sent" &&
    !messageRecalled(message) &&
    Boolean(metadataString(message.metadata, "zaloMsgId")) &&
    Boolean(metadataString(message.metadata, "zaloCliMsgId"));
}

function metadataStringList(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function conversationTagItems(conversation?: MessagingConversation | null): MessagingTag[] {
  const value = conversation?.metadata?.tagItems;
  return Array.isArray(value)
    ? value.filter((item): item is MessagingTag => Boolean(item && typeof item === "object" && "id" in item && "name" in item && "color" in item))
    : [];
}

function tagTextColor(color: string) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#0f172a" : "#ffffff";
}

function conversationAvatar(conversation?: MessagingConversation | null) {
  return metadataString(conversation?.metadata, "customerAvatarUrl");
}

function messageAvatar(message: MessagingMessage, conversation?: MessagingConversation | null) {
  return metadataString(message.metadata, "customerAvatarUrl") || conversationAvatar(conversation);
}

function messageImageUrl(message: MessagingMessage) {
  return metadataString(message.metadata, "imageUrl") || metadataString(message.metadata, "thumbnailUrl");
}

function messageAttachmentUrl(message: MessagingMessage) {
  return metadataString(message.metadata, "attachmentUrl");
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending_payment: "Chờ thanh toán",
    booked: "Đã đặt",
    confirmed: "Đã xác nhận",
    checked_in: "Đã check-in",
    in_progress: "Đang khám",
    completed: "Hoàn tất",
    rescheduled: "Đã dời",
    cancelled: "Đã hủy",
    no_show: "Không đến",
  };
  return labels[status ?? ""] ?? status ?? "Không rõ";
}

function initials(name?: string | null) {
  const text = name?.trim() || "?";
  return text.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
}

function Avatar({ src, name, size = "md" }: { src?: string | null; name?: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return src ? (
    <img src={src} alt={name || "Avatar"} className={cn(cls, "shrink-0 rounded-full object-cover ring-1 ring-slate-200")} />
  ) : (
    <span className={cn(cls, "inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500 ring-1 ring-slate-200")}>
      {initials(name)}
    </span>
  );
}

type Viewer = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

type SeenBy = Viewer & {
  seenAt?: string;
};

type HistoryEntry = {
  type?: string;
  description?: string;
  tag?: string;
  at?: string;
  actor?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  } | null;
};

type ChatItem =
  | { kind: "message"; at: string; message: MessagingMessage }
  | { kind: "system"; at: string; entry: HistoryEntry };

type ConversationMenuState = {
  x: number;
  y: number;
  conversation: MessagingConversation;
};

function sortConversations(items: MessagingConversation[]) {
  return items.slice().sort((left, right) =>
    new Date(right.lastMessageAt ?? right.updatedAt ?? 0).getTime() -
    new Date(left.lastMessageAt ?? left.updatedAt ?? 0).getTime(),
  );
}

function conversationMatchesTagFilter(conversation: MessagingConversation, tagIds: string[]) {
  if (tagIds.length === 0) return true;
  const conversationTagIds = metadataStringList(conversation.metadata, "tagIds");
  return tagIds.every((tagId) => conversationTagIds.includes(tagId));
}

export default function ManagementMessagesPage() {
  const [conversations, setConversations] = useState<MessagingConversation[]>([]);
  const [accounts, setAccounts] = useState<MessagingAccount[]>([]);
  const [messages, setMessages] = useState<MessagingMessage[]>([]);
  const [tags, setTags] = useState<MessagingTag[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [viewersByConversation, setViewersByConversation] = useState<Record<string, Viewer[]>>({});
  const [typingStaffs, setTypingStaffs] = useState<Viewer[]>([]);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#0f766e");
  const [tagCreateOpen, setTagCreateOpen] = useState(false);
  const [tagSelectOpen, setTagSelectOpen] = useState(false);
  const [filterTagOpen, setFilterTagOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const [customerTab, setCustomerTab] = useState<"profile" | "appointments">("profile");
  const [customer, setCustomer] = useState<MessagingCustomerIdentity | null>(null);
  const [appointments, setAppointments] = useState<MessagingAppointment[]>([]);
  const [customerForm, setCustomerForm] = useState({ displayName: "", phone: "", email: "", address: "" });
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [startConversationOpen, setStartConversationOpen] = useState(false);
  const [startConversationAccountId, setStartConversationAccountId] = useState("");
  const [startConversationPhone, setStartConversationPhone] = useState("");
  const [startConversationLoading, setStartConversationLoading] = useState(false);
  const [conversationMenu, setConversationMenu] = useState<ConversationMenuState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const filterTagIdsRef = useRef<string[]>([]);
  const assignPopoverRef = useRef<HTMLDivElement | null>(null);
  const tagSelectRef = useRef<HTMLDivElement | null>(null);
  const filterTagRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );
  const connectedZaloAccounts = useMemo(
    () => accounts.filter((account) => account.channel === "zalo_personal" && account.status === "connected"),
    [accounts],
  );
  const selectedTags = useMemo(
    () => metadataStringList(selectedConversation?.metadata, "tagIds"),
    [selectedConversation?.metadata],
  );
  const seenBy = useMemo(() => {
    const value = selectedConversation?.metadata?.seenBy;
    return Array.isArray(value) ? value.filter((item): item is SeenBy => Boolean(item && typeof item === "object" && "id" in item)) : [];
  }, [selectedConversation?.metadata]);
  const history = useMemo(() => {
    const value = selectedConversation?.metadata?.history;
    return Array.isArray(value) ? value.filter((item): item is HistoryEntry => Boolean(item && typeof item === "object")).slice().reverse() : [];
  }, [selectedConversation?.metadata]);
  const chatItems = useMemo<ChatItem[]>(() => {
    const assignmentItems: ChatItem[] = history
      .filter((entry) => entry.type === "assignment" && entry.at)
      .map((entry) => ({ kind: "system", at: entry.at as string, entry }));
    const messageItems: ChatItem[] = messages.map((message) => ({
      kind: "message",
      at: message.sentAt || message.createdAt,
      message,
    }));
    return [...messageItems, ...assignmentItems].sort((left, right) =>
      new Date(left.at).getTime() - new Date(right.at).getTime(),
    );
  }, [history, messages]);

  const loadConversations = async (tagIds = filterTagIds) => {
    setError(null);
    const data = await getMessagingConversations({ tagIds });
    setConversations(data);
    setSelectedId((current) => current && data.some((conversation) => conversation.id === current) ? current : null);
  };

  const scheduleRealtimeRefresh = () => {
    if (realtimeRefreshTimerRef.current) clearTimeout(realtimeRefreshTimerRef.current);
    realtimeRefreshTimerRef.current = setTimeout(() => {
      loadConversations(filterTagIdsRef.current).catch((err) => setError(getErrorMessage(err)));
    }, 350);
  };

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    filterTagIdsRef.current = filterTagIds;
  }, [filterTagIds]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!conversationMenu) return;
    const close = () => setConversationMenu(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [conversationMenu]);

  const scrollMessagesToBottom = (behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end", behavior });
    });
  };

  useEffect(() => {
    loadConversations()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
    getMessagingTags()
      .then(setTags)
      .catch((err) => setError(getErrorMessage(err)));
    getMessagingAccounts()
      .then((items) => {
        setAccounts(items);
        const connected = items.find((account) => account.channel === "zalo_personal" && account.status === "connected");
        if (connected) setStartConversationAccountId((current) => current || connected.id);
      })
      .catch(() => undefined);
    getStaffs({ status: "active", limit: 100 })
      .then(setStaffs)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!startConversationOpen) return;
    if (startConversationAccountId) return;
    const connected = connectedZaloAccounts[0];
    if (connected) setStartConversationAccountId(connected.id);
  }, [connectedZaloAccounts, startConversationAccountId, startConversationOpen]);

  useEffect(() => {
    if (loading) return;
    loadConversations(filterTagIds).catch((err) => setError(getErrorMessage(err)));
  }, [filterTagIds]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setViewers([]);
      setTypingStaffs([]);
      setCustomer(null);
      setAppointments([]);
      setCustomerForm({ displayName: "", phone: "", email: "", address: "" });
      setHistoryOpen(false);
      return;
    }

    getMessagingMessages(selectedId)
      .then((items) => {
        setMessages(items);
        scrollMessagesToBottom();
      })
      .catch((err) => setError(getErrorMessage(err)));
    getMessagingCustomer(selectedId)
      .then((item) => {
        setCustomer(item);
        setCustomerForm({
          displayName: item.displayName || selectedConversation?.customerName || "",
          phone: item.phone || item.user?.phone || "",
          email: item.email || item.user?.email || "",
          address: item.address || item.user?.address || "",
        });
      })
      .catch((err) => setError(getErrorMessage(err)));
    getMessagingAppointments(selectedId)
      .then(setAppointments)
      .catch(() => setAppointments([]));

    setAssignOpen(false);
    setTypingStaffs([]);
    setHistoryOpen(false);
    socketRef.current?.emit("messages:conversation.join", { conversationId: selectedId });
    return () => {
      socketRef.current?.emit("messages:conversation.typing", { conversationId: selectedId, typing: false });
      socketRef.current?.emit("messages:conversation.leave", { conversationId: selectedId });
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setViewers(viewersByConversation[selectedId] ?? []);
  }, [selectedId, viewersByConversation]);

  useEffect(() => {
    if (!selectedId || chatItems.length === 0) return;
    scrollMessagesToBottom();
  }, [selectedId, chatItems.length]);

  useEffect(() => {
    const socket = io(`${getSocketUrl()}/messages`, {
      transports: ["websocket", "polling"],
      auth: { token: getToken() },
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", scheduleRealtimeRefresh);
    socket.io.on("reconnect", scheduleRealtimeRefresh);

    socket.on("messages:conversation.updated", (conversation: MessagingConversation) => {
      setConversations((items) => {
        if (!conversationMatchesTagFilter(conversation, filterTagIdsRef.current)) {
          return items.filter((item) => item.id !== conversation.id);
        }
        const next = items.filter((item) => item.id !== conversation.id);
        return sortConversations([conversation, ...next]);
      });
      scheduleRealtimeRefresh();
    });
    socket.on("messages:conversation.deleted", (payload: { id?: string }) => {
      if (!payload?.id) return;
      setConversations((items) => items.filter((item) => item.id !== payload.id));
      if (selectedIdRef.current === payload.id) {
        setSelectedId(null);
        setMessages([]);
      }
    });
    socket.on("messages:message.new", (payload: MessagingMessage | { message?: MessagingMessage; conversation?: MessagingConversation }) => {
      const message: MessagingMessage | undefined =
        "message" in payload ? payload.message : payload as MessagingMessage;
      const conversation = "conversation" in payload ? payload.conversation : undefined;
      if (conversation) {
        setConversations((items) => {
          if (!conversationMatchesTagFilter(conversation, filterTagIdsRef.current)) {
            return items.filter((item) => item.id !== conversation.id);
          }
          const next = items.filter((item) => item.id !== conversation.id);
          return sortConversations([conversation, ...next]);
        });
        scheduleRealtimeRefresh();
      }
      if (!message || message.conversationId !== selectedIdRef.current) return;
      setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message]);
    });
    socket.on("messages:message.updated", (message: MessagingMessage) => {
      if (!message || message.conversationId !== selectedIdRef.current) return;
      setMessages((items) => items.map((item) => item.id === message.id ? message : item));
    });
    socket.on("messages:tags.updated", (items: MessagingTag[]) => {
      if (Array.isArray(items)) setTags(items);
    });
    socket.on("messages:conversation.viewers", (payload: { conversationId?: string; viewers?: Viewer[] }) => {
      if (!payload.conversationId) return;
      const nextViewers = Array.isArray(payload.viewers) ? payload.viewers : [];
      setViewersByConversation((items) => ({ ...items, [payload.conversationId as string]: nextViewers }));
      if (payload.conversationId === selectedIdRef.current) setViewers(nextViewers);
    });
    socket.on("messages:conversation.typing", (payload: { conversationId?: string; typing?: boolean; staff?: Viewer }) => {
      if (payload.conversationId !== selectedIdRef.current || !payload.staff?.id) return;
      setTypingStaffs((items) => {
        const next = items.filter((item) => item.id !== payload.staff?.id);
        return payload.typing ? [...next, payload.staff as Viewer] : next;
      });
    });

    return () => {
      if (realtimeRefreshTimerRef.current) clearTimeout(realtimeRefreshTimerRef.current);
      socket.io.off("reconnect", scheduleRealtimeRefresh);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!assignOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (assignPopoverRef.current?.contains(target)) return;
      setAssignOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAssignOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignOpen]);

  useEffect(() => {
    if (!tagSelectOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (tagSelectRef.current?.contains(target)) return;
      setTagSelectOpen(false);
      setTagCreateOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTagSelectOpen(false);
      setTagCreateOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tagSelectOpen]);

  useEffect(() => {
    if (!filterTagOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (filterTagRef.current?.contains(target)) return;
      setFilterTagOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterTagOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterTagOpen]);

  useEffect(() => {
    const keyword = userSearch.trim();
    if (keyword.length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(() => {
      getUsers({ search: keyword, limit: 8 })
        .then((data) => setUserResults(data.users ?? []))
        .catch(() => setUserResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleSend = async () => {
    if (!selectedId || !draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    try {
      const message = await sendMessagingMessage(selectedId, content);
      socketRef.current?.emit("messages:conversation.typing", { conversationId: selectedId, typing: false });
      setMessages((items) => {
        const next = items.filter((item) => item.id !== message.id);
        return [...next, message];
      });
      await loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
      setDraft(content);
    }
  };

  const handleRetry = async (message: MessagingMessage) => {
    if (!selectedId) return;
    try {
      const next = await retryMessagingMessage(selectedId, message.id);
      setMessages((items) => items.map((item) => item.id === next.id ? next : item));
      await loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUndoMessage = async (message: MessagingMessage) => {
    if (!selectedId) return;
    try {
      const next = await undoMessagingMessage(selectedId, message.id);
      setMessages((items) => items.map((item) => item.id === next.id ? next : item));
      await loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteConversation = async (conversation: MessagingConversation) => {
    const label = conversation.customerName || conversation.externalThreadId;
    if (!window.confirm(`Xoá hội thoại "${label}"?`)) return;
    try {
      await deleteMessagingConversation(conversation.id);
      setConversations((items) => items.filter((item) => item.id !== conversation.id));
      if (selectedId === conversation.id) {
        setSelectedId(null);
        setMessages([]);
      }
      setConversationMenu(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!selectedId) return;
    socketRef.current?.emit("messages:conversation.typing", { conversationId: selectedId, typing: Boolean(value.trim()) });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("messages:conversation.typing", { conversationId: selectedId, typing: false });
    }, 1800);
  };

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void handleSend();
  };

  const replaceConversation = (conversation: MessagingConversation) => {
    setConversations((items) => items.map((item) => item.id === conversation.id ? conversation : item));
  };

  const handleCloseConversation = async (conversation?: MessagingConversation | null) => {
    if (!conversation) return;
    const label = conversation.customerName || conversation.externalThreadId;
    if (!window.confirm(`Kết thúc hội thoại "${label}"?`)) return;
    setError(null);
    try {
      const next = await closeMessagingConversation(conversation.id);
      replaceConversation(next);
      setConversationMenu(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAssign = async (staffId?: string | null) => {
    if (!selectedId) return;
    setError(null);
    try {
      const conversation = await assignMessagingConversation(selectedId, staffId);
      replaceConversation(conversation);
      setAssignOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleTag = async (tagId: string) => {
    if (!selectedId) return;
    const nextTags = selectedTags.includes(tagId)
      ? selectedTags.filter((item) => item !== tagId)
      : [...selectedTags, tagId];
    setError(null);
    try {
      const conversation = await setMessagingConversationTags(selectedId, nextTags);
      replaceConversation(conversation);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setError(null);
    try {
      const tag = await createMessagingTag({
        name: newTagName.trim(),
        color: newTagColor,
        sortOrder: tags.length * 10 + 10,
      });
      setTags((items) => [...items, tag]);
      if (selectedId && selectedConversation) {
        const conversation = await setMessagingConversationTags(selectedId, [...selectedTags, tag.id]);
        replaceConversation(conversation);
      }
      setNewTagName("");
      setTagCreateOpen(false);
      setTagSelectOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSaveCustomer = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      const item = await updateMessagingCustomer(selectedId, customerForm);
      setCustomer(item);
      setCustomerForm({
        displayName: item.displayName || "",
        phone: item.phone || item.user?.phone || "",
        email: item.email || item.user?.email || "",
        address: item.address || item.user?.address || "",
      });
      await loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleQuickCreateUser = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await updateMessagingCustomer(selectedId, customerForm);
      const item = await quickCreateMessagingUser(selectedId);
      setCustomer(item);
      setCustomerForm({
        displayName: item.displayName || item.user?.name || "",
        phone: item.phone || item.user?.phone || "",
        email: item.email || item.user?.email || "",
        address: item.address || item.user?.address || "",
      });
      setAppointments(await getMessagingAppointments(selectedId));
      await loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMapUser = async (userId: string | null) => {
    if (!selectedId) return;
    setError(null);
    try {
      const item = await mapMessagingUser(selectedId, userId);
      setCustomer(item);
      setCustomerForm({
        displayName: item.displayName || item.user?.name || "",
        phone: item.phone || item.user?.phone || "",
        email: item.email || item.user?.email || "",
        address: item.address || item.user?.address || "",
      });
      setUserSearch("");
      setUserResults([]);
      setAppointments(await getMessagingAppointments(selectedId));
      await loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleOpenZaloPhoneConversation = async () => {
    if (!startConversationPhone.trim() || !startConversationAccountId) return;
    setStartConversationLoading(true);
    setError(null);
    try {
      const conversation = await createZaloPhoneConversation({
        accountId: startConversationAccountId,
        phone: startConversationPhone,
      });
      setConversations((items) => {
        const next = items.filter((item) => item.id !== conversation.id);
        return [conversation, ...next].sort((left, right) =>
          new Date(right.lastMessageAt ?? right.updatedAt ?? 0).getTime() -
          new Date(left.lastMessageAt ?? left.updatedAt ?? 0).getTime(),
        );
      });
      setSelectedId(conversation.id);
      setStartConversationOpen(false);
      setStartConversationPhone("");
      scrollMessagesToBottom();
      await loadConversations();
      setSelectedId(conversation.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStartConversationLoading(false);
    }
  };

  const uploadMessagingAttachment = async (file: File) => {
    const presign = await createManagementPresignedUpload({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      path: "messaging/attachments",
      baseName: file.name.replace(/\.[^.]+$/, ""),
    });
    const putRes = await fetch(presign.url, {
      method: presign.method || "PUT",
      headers: presign.headers,
      body: file,
    });
    if (!putRes.ok) throw new Error("Upload file không thành công.");
    return {
      url: presign.publicUrl,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    };
  };

  const handleAttachmentSelected = async (file?: File | null) => {
    if (!selectedId || !file) return;
    setUploadingAttachment(true);
    setError(null);
    const content = draft.trim();
    setDraft("");
    try {
      const attachment = await uploadMessagingAttachment(file);
      const message = await sendMessagingMessage(selectedId, content, attachment);
      setMessages((items) => {
        const next = items.filter((item) => item.id !== message.id);
        return [...next, message];
      });
      await loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
      setDraft(content);
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout roles={["super_admin", "admin", "staff"]} permissions={["messaging.view"]}>
      <div className="flex min-h-0 flex-col pt-0">
        {error ? (
          <div className="fixed right-5 top-20 z-[70] w-[min(420px,calc(100vw-40px))]">
            <div className="rounded-lg border border-red-200 bg-white shadow-2xl shadow-slate-900/15">
              <div className="flex items-start gap-3 p-4">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-950">Có lỗi messaging</p>
                  <p className="mt-1 break-words text-sm leading-relaxed text-slate-600">{error}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  onClick={() => setError(null)}
                  aria-label="Đóng thông báo lỗi"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-1 overflow-hidden rounded-b-lg bg-red-50">
                <div className="h-full w-full bg-red-500" />
              </div>
            </div>
          </div>
        ) : null}
        {loading ? <StateBlock type="loading" title="Đang tải inbox" /> : null}
        {conversationMenu ? (
          <div
            className="fixed z-[80] w-56 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/20"
            style={{
              left: Math.min(conversationMenu.x, typeof window === "undefined" ? conversationMenu.x : window.innerWidth - 240),
              top: Math.min(conversationMenu.y, typeof window === "undefined" ? conversationMenu.y : window.innerHeight - 96),
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => void handleCloseConversation(conversationMenu.conversation)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Kết thúc hội thoại
            </button>
            <button
              type="button"
              onClick={() => handleDeleteConversation(conversationMenu.conversation)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Xoá hội thoại
            </button>
          </div>
        ) : null}

        {!loading ? (
          <section
            className={cn(
              "grid h-[calc(100vh-112px)] min-h-[620px] overflow-hidden border border-slate-200 bg-white",
              helperOpen ? "grid-cols-[300px_minmax(0,1fr)_380px]" : "grid-cols-[300px_minmax(0,1fr)]",
            )}
          >
            <aside className="min-h-0 border-r border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Hộp thư hỗ trợ</p>
                    <p className="text-xs text-slate-500">{conversations.length} nguồn đang gom</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setStartConversationOpen(true)}
                      className="rounded-md p-2 text-teal-700 hover:bg-teal-50"
                      title="Tạo hội thoại từ SĐT Zalo"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <Link
                      href="/management/message-accounts"
                      className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                      title="Quản lý account"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Link>
                    <button type="button" onClick={() => void loadConversations()} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <label className="mt-3 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Tìm hội thoại" />
                </label>
                <div ref={filterTagRef} className="relative mt-3">
                  <button
                    type="button"
                    onClick={() => setFilterTagOpen((open) => !open)}
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm font-semibold transition",
                      filterTagIds.length > 0 ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Tags className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {filterTagIds.length > 0 ? `Đang lọc ${filterTagIds.length} tag` : "Lọc theo tag"}
                      </span>
                    </span>
                    {filterTagIds.length > 0 ? (
                      <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] text-white">{filterTagIds.length}</span>
                    ) : null}
                  </button>
                  {filterTagOpen ? (
                    <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="max-h-64 overflow-y-auto p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterTagIds([]);
                            setFilterTagOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold",
                            filterTagIds.length === 0 ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          Tất cả hội thoại
                          {filterTagIds.length === 0 ? <span>✓</span> : null}
                        </button>
                        {tags.map((tag) => {
                          const active = filterTagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => setFilterTagIds((items) => active ? items.filter((id) => id !== tag.id) : [...items, tag.id])}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold",
                                active ? "bg-slate-50 text-slate-950" : "text-slate-600 hover:bg-slate-50",
                              )}
                            >
                              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                              <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                              {active ? <span className="text-teal-600">✓</span> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="h-[calc(100%-150px)] overflow-y-auto divide-y divide-slate-100">
                {conversations.map((conversation) => {
                  const active = selectedId === conversation.id;
                  const activeViewers = viewersByConversation[conversation.id] ?? [];
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setConversationMenu({ x: event.clientX, y: event.clientY, conversation });
                      }}
                      className={cn(
                        "grid w-full grid-cols-[48px_minmax(0,1fr)_auto] gap-3 border-l-4 border-transparent px-4 py-3 text-left transition hover:bg-slate-50",
                        active && "border-teal-500 bg-sky-50",
                      )}
                    >
                      <div className="relative">
                        <Avatar src={conversationAvatar(conversation)} name={conversation.customerName || conversation.externalThreadId} size="lg" />
                        {conversation.unreadCount > 0 ? (
                          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center">
                          <p
                            className="min-w-0 truncate text-sm font-semibold text-slate-950"
                            title={conversation.customerName || conversation.externalThreadId}
                          >
                            {conversation.customerName || conversation.externalThreadId}
                          </p>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-700">{conversation.lastMessagePreview || "Chưa có tin nhắn"}</p>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5">
                          <span className="min-w-0 truncate text-[11px] font-medium text-slate-400">
                            {conversation.account?.displayName || conversation.externalThreadType}
                          </span>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1 shadow-sm", channelTone(conversation.channel))}>
                            {channelLabel(conversation.channel)}
                          </span>
                        </div>
                        {conversationTagItems(conversation).length > 0 ? (
                          <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                            {conversationTagItems(conversation).slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {activeViewers.length > 0 ? (
                          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-sky-700">
                            <div className="flex shrink-0 -space-x-1">
                              {activeViewers.slice(0, 3).map((viewer) => (
                                <span key={viewer.id} title={`${viewer.name} đang ở đây`}>
                                  <Avatar src={viewer.avatar} name={viewer.name} size="sm" />
                                </span>
                              ))}
                            </div>
                            <span className="min-w-0 truncate">
                              {activeViewers.map((viewer) => viewer.name).join(", ")} đang ở đây
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <span className="pt-0.5 text-[11px] text-slate-400">{formatTime(conversation.lastMessageAt)}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="grid min-w-0 min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[linear-gradient(180deg,#f4eee8_0%,#eee7df_100%)]">
              <div className="border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={conversationAvatar(selectedConversation)} name={selectedConversation?.customerName || selectedConversation?.externalThreadId} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-950">
                        {selectedConversation?.customerName || selectedConversation?.externalThreadId || "Chọn hội thoại"}
                      </p>
                      <div className="mt-1 flex min-w-0 items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold ring-1", channelTone(selectedConversation?.channel))}>
                          {channelLabel(selectedConversation?.channel)}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                          {selectedConversation?.account?.displayName || "Inbox"}
                        </span>
                      </div>
                      {seenBy.length > 0 ? (
                        <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[11px] text-slate-500">
                          <Eye className="h-3 w-3 shrink-0" />
                          {seenBy.slice(-3).map((item) => item.name).join(", ")} đã xem
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="flex -space-x-2">
                      {viewers.slice(0, 4).map((viewer) => (
                        <span key={viewer.id} title={`Đang xem: ${viewer.name}`}>
                          <Avatar src={viewer.avatar} name={viewer.name} size="sm" />
                        </span>
                      ))}
                    </div>
                    {viewers.length > 0 ? (
                      <span className="hidden text-xs text-slate-500 sm:inline">
                        {viewers.map((viewer) => viewer.name).join(", ")} đang ở đây
                      </span>
                    ) : null}
                    <button
                      className="rounded-md p-2 hover:bg-slate-100 disabled:opacity-40"
                      type="button"
                      title="Xem lịch sử"
                      disabled={!selectedConversation}
                      onClick={() => setHistoryOpen(true)}
                    >
                      <Clock3 className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-md p-2 hover:bg-slate-100 disabled:opacity-40"
                      type="button"
                      title="Kết thúc hội thoại"
                      disabled={!selectedConversation}
                      onClick={() => void handleCloseConversation(selectedConversation)}
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                    <div className="relative" ref={assignPopoverRef}>
                      <button
                        className={cn(
                          "rounded-md p-2 hover:bg-slate-100",
                          selectedConversation?.assignedStaffId && "bg-sky-50 text-sky-700",
                        )}
                        type="button"
                        title="Phân công nhân viên"
                        onClick={(event) => {
                          event.stopPropagation();
                          setAssignOpen((open) => !open);
                        }}
                      >
                        <UserRound className="h-4 w-4" />
                      </button>
                      {assignOpen ? (
                        <div className="absolute right-0 top-11 z-20 w-72 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
                          <label className="flex h-10 items-center gap-2 rounded-md bg-slate-100 px-3 text-sm text-slate-500">
                            <Search className="h-4 w-4" />
                            <span>Phân công nhân viên</span>
                          </label>
                          <div className="mt-2 max-h-72 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => void handleAssign(null)}
                              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50"
                            >
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">--</span>
                              Bỏ phân công
                            </button>
                            {staffs.map((staff) => (
                              <button
                                key={staff.id}
                                type="button"
                                onClick={() => void handleAssign(staff.id)}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50",
                                  selectedConversation?.assignedStaffId === staff.id && "bg-sky-50 text-sky-700",
                                )}
                              >
                                <Avatar src={staff.avatar} name={staff.name} size="sm" />
                                <span className="min-w-0 flex-1 truncate font-semibold">{staff.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <button className="rounded-md p-2 hover:bg-slate-100" type="button"><StickyNote className="h-4 w-4" /></button>
                    <button
                      className={cn("rounded-md p-2 hover:bg-slate-100", helperOpen && "bg-slate-100 text-slate-900")}
                      type="button"
                      title="Mở helper"
                      onClick={() => setHelperOpen((open) => !open)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-5">
                {chatItems.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Chưa có tin nhắn trong hội thoại này
                  </div>
                ) : null}
                {chatItems.map((item) => {
                  if (item.kind === "system") {
                    const actorName = item.entry.actor?.name || item.entry.actor?.email || "Hệ thống";
                    return (
                      <div key={`system-${item.at}-${item.entry.description}`} className="flex justify-center">
                        <div className="inline-flex max-w-[80%] items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                          <UserRound className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">
                            <span className="font-semibold text-slate-800">{actorName}</span> {item.entry.description || "đã cập nhật phân công"}
                          </span>
                          <span className="shrink-0 text-slate-400">{formatTime(item.at)}</span>
                        </div>
                      </div>
                    );
                  }
                  const message = item.message;
                  const outbound = message.direction === "outbound";
                  const status = deliveryStatus(message);
                  const deliveryError = metadataString(message.metadata, "deliveryError");
                  const recalled = messageRecalled(message);
                  const imageUrl = messageImageUrl(message);
                  const attachmentUrl = messageAttachmentUrl(message);
                  const attachmentName = metadataString(message.metadata, "attachmentName") || "Tệp đính kèm";
                  return (
                    <div key={message.id} className={cn("flex items-end gap-2", outbound ? "justify-end" : "justify-start")}>
                      {!outbound ? <Avatar src={messageAvatar(message, selectedConversation)} name={message.senderName || selectedConversation?.customerName} size="sm" /> : null}
                      <div className={cn("flex max-w-[72%] flex-col", outbound ? "items-end" : "items-start")}>
                        {outbound ? (
                          <p className="mb-1 max-w-full truncate px-1 text-[11px] font-semibold text-slate-500">
                            {message.senderName || "Tư vấn viên"}
                          </p>
                        ) : null}
                        <div className={cn(
                          "rounded-2xl px-4 py-2 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.12)]",
                          outbound ? "rounded-br-sm bg-teal-700 text-white" : "rounded-bl-sm bg-white text-slate-900 ring-1 ring-slate-200/80",
                        )}>
                          {recalled ? (
                            <p className="whitespace-pre-wrap break-words italic leading-relaxed opacity-80">
                              Tin nhắn đã thu hồi
                            </p>
                          ) : null}
                          {!recalled && imageUrl ? (
                            <a href={imageUrl} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl bg-slate-100">
                              <img
                                src={imageUrl}
                                alt={message.content || "Hình ảnh"}
                                className="max-h-72 w-full max-w-xs object-contain"
                              />
                            </a>
                          ) : null}
                          {!recalled && !imageUrl && attachmentUrl ? (
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "mb-2 flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1",
                                outbound
                                  ? "bg-white text-slate-800 ring-teal-100 shadow-sm"
                                  : "bg-slate-50 text-slate-700 ring-slate-200",
                              )}
                              title={attachmentName}
                            >
                              <Paperclip className={cn("h-4 w-4 shrink-0", outbound ? "text-teal-700" : "text-slate-500")} />
                              <span className="min-w-0 truncate">{attachmentName}</span>
                            </a>
                          ) : null}
                          {!recalled && message.content ? (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                          ) : null}
                          {!recalled && !message.content && !imageUrl && !attachmentUrl ? (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">[Nội dung chưa hỗ trợ]</p>
                          ) : null}
                          <div className={cn("mt-1 flex flex-wrap items-center gap-2 text-[11px]", outbound ? "justify-end text-teal-50" : "text-slate-400")}>
                            <span>{formatTime(message.sentAt || message.createdAt)}</span>
                            {outbound && status === "pending" ? <span>Đang gửi</span> : null}
                            {outbound && status === "failed" ? <span className="font-semibold text-red-100">Gửi lỗi</span> : null}
                            {outbound && recalled ? <span>Đã thu hồi</span> : null}
                          </div>
                        </div>
                        {messageCanUndo(message) ? (
                          <button
                            type="button"
                            onClick={() => handleUndoMessage(message)}
                            className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Undo2 className="h-3 w-3" />
                            Thu hồi
                          </button>
                        ) : null}
                        {outbound && status === "failed" ? (
                          <div className="mt-1 flex max-w-full items-center gap-2 px-1 text-[11px] text-red-600">
                            <span className="truncate">{deliveryError || "Không gửi được tin nhắn."}</span>
                            <button
                              type="button"
                              onClick={() => handleRetry(message)}
                              className="shrink-0 rounded-full border border-red-200 bg-white px-2 py-0.5 font-semibold text-red-600 hover:bg-red-50"
                            >
                              Thử lại
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
                {typingStaffs.length > 0 ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="flex gap-1 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                    </span>
                    {typingStaffs.map((staff) => staff.name).join(", ")} đang nhập
                  </div>
                ) : null}
              </div>

              <div className="border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div ref={tagSelectRef} className="relative shrink-0 self-end">
                      <button
                        type="button"
                        disabled={!selectedId}
                        onClick={() => setTagSelectOpen((open) => !open)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Gắn tag"
                      >
                        <Tags className="h-4 w-4 text-teal-700" />
                        {selectedTags.length > 0 ? (
                          <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] text-white">{selectedTags.length}</span>
                        ) : null}
                      </button>
                      {tagSelectOpen ? (
                        <div className="absolute bottom-12 left-0 z-30 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                          <div className="border-b border-slate-100 px-3 py-2">
                            <p className="text-xs font-bold text-slate-900">Gắn tag hội thoại</p>
                            <p className="text-[11px] text-slate-500">Chọn một hoặc nhiều tag.</p>
                          </div>
                          <div className="max-h-56 overflow-y-auto p-2">
                            {tags.length > 0 ? tags.map((tag) => {
                              const active = selectedTags.includes(tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => void handleToggleTag(tag.id)}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition",
                                    active ? "bg-slate-50 text-slate-950" : "text-slate-600 hover:bg-slate-50",
                                  )}
                                >
                                  <span
                                    className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white"
                                    style={{ backgroundColor: tag.color, boxShadow: `0 0 0 1px ${tag.color}55` }}
                                  />
                                  <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                                  <span
                                    className={cn(
                                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                                      active ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 text-transparent",
                                    )}
                                  >
                                    ✓
                                  </span>
                                </button>
                              );
                            }) : (
                              <p className="px-2.5 py-4 text-sm text-slate-500">Chưa có tag nào.</p>
                            )}
                          </div>
                          <div className="border-t border-slate-100 p-2">
                            {tagCreateOpen ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={newTagColor}
                                  onChange={(event) => setNewTagColor(event.target.value)}
                                  className="h-9 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
                                  title="Chọn màu thẻ"
                                />
                                <input
                                  value={newTagName}
                                  onChange={(event) => setNewTagName(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      void handleCreateTag();
                                    }
                                  }}
                                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-teal-300"
                                  placeholder="Tên tag mới"
                                />
                                <button
                                  type="button"
                                  disabled={!newTagName.trim()}
                                  onClick={() => void handleCreateTag()}
                                  className="h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-40"
                                >
                                  Thêm
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setTagCreateOpen(true)}
                                className="flex h-9 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                              >
                                + Tạo tag mới
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <textarea
                      value={draft}
                      onChange={(event) => handleDraftChange(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      rows={2}
                      disabled={!selectedId}
                      className="min-h-12 min-w-0 flex-1 resize-none bg-transparent text-sm outline-none"
                      placeholder={selectedConversation ? `Trả lời ${selectedConversation.customerName || selectedConversation.externalThreadId}` : "Chọn hội thoại để trả lời"}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(event) => void handleAttachmentSelected(event.target.files?.[0])}
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleAttachmentSelected(event.target.files?.[0])}
                    />
                    <button
                      className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                      type="button"
                      title="Đính kèm"
                      disabled={!selectedId || uploadingAttachment}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                      type="button"
                      title="Hình ảnh"
                      disabled={!selectedId || uploadingAttachment}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      disabled={!selectedId || !draft.trim() || uploadingAttachment}
                      onClick={handleSend}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                    >
                      {uploadingAttachment ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {helperOpen ? (
            <aside className="min-h-0 min-w-0 overflow-y-auto border-l border-slate-200 bg-white shadow-[-12px_0_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950">
                      {customerForm.displayName || selectedConversation?.customerName || "Thông tin người dùng"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {customer?.userId ? `Đã map user #${customer.userId}` : selectedConversation?.customerExternalId || "Chưa map user"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    title="Đóng thông tin"
                    onClick={() => setHelperOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCustomerTab("profile")}
                    className={cn("rounded-md px-2 py-2", customerTab === "profile" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500")}
                  >
                    Thông tin
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerTab("appointments")}
                    className={cn("rounded-md px-2 py-2", customerTab === "appointments" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500")}
                  >
                    Lịch sử đặt lịch
                  </button>
                </div>
              </div>
              <div className="p-4">
                {customerTab === "profile" ? (
                  <div className="grid gap-3">
                    <label className="grid gap-1 text-xs font-semibold text-slate-600">
                      Tên khách
                      <input
                        value={customerForm.displayName}
                        onChange={(event) => setCustomerForm((form) => ({ ...form, displayName: event.target.value }))}
                        className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-300"
                        placeholder="Tên khách"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-slate-600">
                      Số điện thoại
                      <input
                        value={customerForm.phone}
                        onChange={(event) => setCustomerForm((form) => ({ ...form, phone: event.target.value }))}
                        className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-300"
                        placeholder="090..."
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-slate-600">
                      Email
                      <input
                        value={customerForm.email}
                        onChange={(event) => setCustomerForm((form) => ({ ...form, email: event.target.value }))}
                        className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-300"
                        placeholder="email@example.com"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-slate-600">
                      Địa chỉ
                      <textarea
                        value={customerForm.address}
                        onChange={(event) => setCustomerForm((form) => ({ ...form, address: event.target.value }))}
                        className="min-h-20 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-300"
                        placeholder="Địa chỉ khách"
                      />
                    </label>
                    <div className={cn("grid gap-2", customer?.userId ? "grid-cols-1" : "grid-cols-2")}>
                      <button
                        type="button"
                        disabled={!selectedConversation}
                        onClick={() => void handleSaveCustomer()}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        Lưu
                      </button>
                      {!customer?.userId ? (
                        <button
                          type="button"
                          disabled={!selectedConversation || !customerForm.phone || !customerForm.email}
                          onClick={() => void handleQuickCreateUser()}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4" />
                          Tạo user
                        </button>
                      ) : null}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase text-slate-500">Map user có sẵn</p>
                        {customer?.userId ? (
                          <button
                            type="button"
                            onClick={() => void handleMapUser(null)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Gỡ map
                          </button>
                        ) : null}
                      </div>
                      <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-500">
                        <Search className="h-4 w-4" />
                        <input
                          value={userSearch}
                          onChange={(event) => setUserSearch(event.target.value)}
                          className="min-w-0 flex-1 bg-transparent outline-none"
                          placeholder="Tìm tên, SĐT, email"
                        />
                      </label>
                      {userResults.length > 0 ? (
                        <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-slate-200 bg-white">
                          {userResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => void handleMapUser(user.id)}
                              className={cn(
                                "grid w-full gap-0.5 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-teal-50",
                                customer?.userId === user.id && "bg-teal-50 text-teal-700",
                              )}
                            >
                              <span className="font-semibold">{user.name}</span>
                              <span className="text-xs text-slate-500">{user.phone || "--"} · {user.email || "--"}</span>
                            </button>
                          ))}
                        </div>
                      ) : userSearch.trim().length >= 2 ? (
                        <p className="mt-2 text-xs text-slate-500">Không thấy user phù hợp.</p>
                      ) : null}
                    </div>
                    {customer?.userId ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        <div className="flex items-center gap-2 font-semibold">
                          <LinkIcon className="h-4 w-4" />
                          Đã map với user #{customer.userId}
                        </div>
                        <p className="mt-1 text-xs text-emerald-700">Một user có thể map nhiều identity từ Zalo, OA, Facebook sau này.</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {appointments.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                        Chưa có lịch sử đặt lịch
                      </div>
                    ) : null}
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">#{appointment.id} · {appointment.service?.name || "Dịch vụ"}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {appointment.doctor?.name || "Chưa rõ bác sĩ"} · {appointment.facility?.name || "Cơ sở"}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {appointment.room?.name || "Phòng chưa rõ"}
                              {appointment.pregnancyProfileId ? ` · HS thai #${appointment.pregnancyProfileId}` : ""}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{statusLabel(appointment.status)}</span>
                        </div>
                        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <CalendarClock className="h-4 w-4" />
                          {formatDateOnly(appointment.scheduledStart)} · {formatHourOnly(appointment.scheduledStart)} - {formatHourOnly(appointment.scheduledEnd)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
            ) : null}
          </section>
        ) : null}
      </div>
      {startConversationOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          onPointerDown={() => {
            if (!startConversationLoading) setStartConversationOpen(false);
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">Tạo hội thoại Zalo</p>
                <p className="mt-1 text-sm text-slate-500">Tìm SĐT Zalo rồi mở màn nhắn tin.</p>
              </div>
              <button
                type="button"
                disabled={startConversationLoading}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                onClick={() => setStartConversationOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 p-5">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Account gửi
                <select
                  value={startConversationAccountId}
                  onChange={(event) => setStartConversationAccountId(event.target.value)}
                  className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-300"
                  disabled={startConversationLoading || connectedZaloAccounts.length === 0}
                >
                  {connectedZaloAccounts.length === 0 ? (
                    <option value="">Chưa có Zalo cá nhân đang chạy</option>
                  ) : null}
                  {connectedZaloAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Số điện thoại Zalo
                <span className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 focus-within:border-teal-300">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={startConversationPhone}
                    onChange={(event) => setStartConversationPhone(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleOpenZaloPhoneConversation();
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="090..."
                    disabled={startConversationLoading}
                    autoFocus
                  />
                </span>
              </label>
              {connectedZaloAccounts.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Cần start một account Zalo cá nhân trước khi tìm SĐT.
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={startConversationLoading}
                  onClick={() => setStartConversationOpen(false)}
                  className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  disabled={startConversationLoading || !startConversationPhone.trim() || !startConversationAccountId}
                  onClick={() => void handleOpenZaloPhoneConversation()}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {startConversationLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Nhắn tin
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {historyOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          onPointerDown={() => setHistoryOpen(false)}
        >
          <div
            className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">Lịch sử hội thoại</p>
                <p className="text-sm text-slate-500">
                  {selectedConversation?.customerName || selectedConversation?.externalThreadId || "Chưa chọn hội thoại"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setHistoryOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[64vh] overflow-y-auto p-5">
              <section>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Clock3 className="h-4 w-4 text-teal-700" />
                  Cập nhật gần đây
                </div>
                <div className="rounded-lg border border-slate-200">
                  {history.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">Chưa có cập nhật nào</p>
                  ) : null}
                  {history.map((entry, index) => (
                    <div key={`${entry.at ?? "history-modal"}-${index}`} className="border-b border-slate-100 p-4 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {entry.actor?.name || entry.actor?.email || "Hệ thống"}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                            {entry.type?.startsWith("tag") ? <Tags className="h-4 w-4 text-teal-700" /> : <UserRound className="h-4 w-4 text-teal-700" />}
                            {entry.description || "Đã cập nhật hội thoại"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{formatTime(entry.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="mt-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Eye className="h-4 w-4 text-teal-700" />
                  Ai đã xem
                </div>
                <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {seenBy.length === 0 ? <p className="text-sm text-slate-500">Chưa có nhân viên nào xem</p> : null}
                  {seenBy.slice().reverse().map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Avatar src={item.avatar} name={item.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{item.name}</span>
                      <span className="text-xs text-slate-400">{formatTime(item.seenAt)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

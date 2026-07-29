"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Descriptions, Empty, Input, Modal, Tag, Tooltip, message as antdMessage } from "antd";
import {
  Bot,
  Headphones,
  ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/features/auth/auth.store";
import { apiClient } from "@/lib/axios";
import {
  ACCESS_TOKEN_KEY,
  API_BASE_URL,
  MANAGEMENT_ACCESS_TOKEN_KEY,
} from "@/lib/constants";

type ChatbotSender = "user" | "bot" | "staff" | "system";
type ChatbotStatus = "bot" | "waiting_for_staff" | "staff_joined" | "closed";

interface ChatbotMessage {
  id: string;
  conversationId: string;
  sender: ChatbotSender;
  senderName?: string;
  messageType: "text" | "image" | "file";
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt: string;
}

interface ChatbotConversation {
  conversationId: string;
  status: ChatbotStatus;
  requester?: ChatbotRequester;
  assignedStaffId?: string;
  assignedStaffName?: string;
  claimExpiresAt?: string;
  messages: ChatbotMessage[];
  hasMoreMessages?: boolean;
}

interface ChatbotHistoryResponse {
  conversationId: string;
  messages: ChatbotMessage[];
  hasMore: boolean;
}

interface PresignResponse {
  key: string;
  url: string;
  downloadUrl: string;
  publicUrl: string;
  method: "PUT";
  headers: Record<string, string>;
}

interface ChatbotRequester {
  id?: string;
  guestKey?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  activeFacilityId?: string | null;
  facilities?: Array<{
    id: string;
    name: string;
    code?: string;
    status?: string;
    address?: string;
  }>;
}

const CHATBOT_CONVERSATION_KEY = "mcs_chatbot_conversation_id";
const CHATBOT_GUEST_KEY = "mcs_chatbot_guest_key";

function getSocketUrl() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}

function getStoredToken(isStaffMode: boolean) {
  if (typeof window === "undefined") return null;

  const key = isStaffMode ? MANAGEMENT_ACCESS_TOKEN_KEY : ACCESS_TOKEN_KEY;
  const token = window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);

  return token && token !== "undefined" && token !== "null" ? token : null;
}

function getOrCreateGuestKey() {
  if (typeof window === "undefined") return undefined;

  const existing = window.localStorage.getItem(CHATBOT_GUEST_KEY);
  if (existing) return existing;

  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `guest:${crypto.randomUUID()}`
      : `guest:${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(CHATBOT_GUEST_KEY, key);
  return key;
}

function getLastMessage(conversation: ChatbotConversation) {
  return conversation.messages.at(-1);
}

function createOptimisticMessage(
  conversationId: string | null,
  sender: ChatbotSender,
  content: string,
  senderName?: string,
  file?: Pick<ChatbotMessage, "messageType" | "fileUrl" | "fileName" | "mimeType" | "fileSize">,
): ChatbotMessage {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversationId: conversationId ?? "pending",
    sender,
    senderName,
    messageType: file?.messageType ?? "text",
    content,
    fileUrl: file?.fileUrl,
    fileName: file?.fileName,
    mimeType: file?.mimeType,
    fileSize: file?.fileSize,
    createdAt: new Date().toISOString(),
  };
}

function buildRequesterPayload(
  user: ReturnType<typeof useAuthStore.getState>["user"],
): ChatbotRequester | undefined {
  if (!user) return undefined;

  const userWithOptionalAddress = user as typeof user & { address?: string | null };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: userWithOptionalAddress.address,
    facilities: user.facilities?.map((facility) => ({
      id: facility.id,
      name: facility.name,
      code: facility.code,
      status: facility.status,
      address: facility.address,
    })),
  };
}

function getUserSystemLabel(message: ChatbotMessage) {
  if (message.content.includes("đang nhận tư vấn")) {
    return "Tư vấn viên đã tham gia";
  }

  if (
    message.content.includes("đã chuyển cuộc trò chuyện") ||
    message.content.includes("được mở lại")
  ) {
    return "Đang chờ tư vấn viên";
  }

  return message.content;
}

function playAttentionSound() {
  if (typeof window === "undefined") return;

  try {
    const audioWindow = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(780, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(980, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.24);
  } catch {
    // Browser may block audio before the first user gesture; ignore quietly.
  }
}

function renderMessageContent(content: string, isOwnMessage: boolean) {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    parts.push(
      <a
        key={`${match[2]}-${match.index}`}
        href={match[2]}
        className={`font-semibold underline underline-offset-2 ${
          isOwnMessage ? "text-white" : "text-pink-600 hover:text-pink-700"
        }`}
      >
        {match[1]}
      </a>,
    );
    lastIndex = linkPattern.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length ? parts : content;
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function FloatingChatbot() {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.user);
  const isStaffMode = Boolean(pathname?.startsWith("/management"));
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [staffQueue, setStaffQueue] = useState<ChatbotConversation[]>([]);
  const [draft, setDraft] = useState("");
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [profileModalConversation, setProfileModalConversation] =
    useState<ChatbotConversation | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const waitingCountRef = useRef(0);

  const socketUrl = useMemo(getSocketUrl, []);
  const activeConversation = staffQueue.find(
    (conversation) => conversation.conversationId === conversationId,
  );
  const waitingCount = staffQueue.filter(
    (conversation) =>
      conversation.status === "waiting_for_staff" && !conversation.assignedStaffId,
  ).length;
  const currentStaffId = currentUser?.id ? String(currentUser.id) : "current-staff";
  const currentStaffName = currentUser?.name || "Tư vấn viên";
  const requesterPayload = useMemo(
    () => buildRequesterPayload(currentUser),
    [currentUser],
  );
  const effectiveRequesterPayload = useMemo(
    () => requesterPayload ?? { guestKey: getOrCreateGuestKey() },
    [requesterPayload],
  );
  const activeAssignedToOther = Boolean(
    isStaffMode &&
      activeConversation?.assignedStaffId &&
      activeConversation.assignedStaffId !== currentStaffId,
  );
  const hasRequestedAdvisor =
    !isStaffMode &&
    messages.some(
      (message) =>
        message.sender === "system" &&
        (message.content.includes("đã chuyển cuộc trò chuyện") ||
          message.content.includes("đang nhận tư vấn")),
    );
  const lastVisibleMessage = messages.at(-1);
  const typingLabel =
    lastVisibleMessage?.sender === "user" && lastVisibleMessage.messageType === "image"
      ? "Bot đang xem ảnh..."
      : "Bot đang trả lời...";

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const scrollMessagesToBottom = () => {
    requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;

      requestAnimationFrame(() => {
        const nextContainer = messagesContainerRef.current;
        if (!nextContainer || !shouldStickToBottomRef.current) return;
        nextContainer.scrollTop = nextContainer.scrollHeight;
      });
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedConversationId = isStaffMode
      ? null
      : window.localStorage.getItem(CHATBOT_CONVERSATION_KEY);
    const socket = io(`${socketUrl}/chatbot`, {
      transports: ["websocket", "polling"],
      auth: {
        mode: isStaffMode ? "staff" : "user",
        token: getStoredToken(isStaffMode),
        conversationId: storedConversationId,
        requester: effectiveRequesterPayload,
      },
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", () => setIsConnected(false));
    socket.on("chatbot:typing", (typing: boolean) => setIsTyping(Boolean(typing)));
    socket.on("chatbot:staff-queue", (queue: ChatbotConversation[]) => {
      setStaffQueue(queue);
      const nextWaitingCount = queue.filter(
        (conversation) =>
          conversation.status === "waiting_for_staff" && !conversation.assignedStaffId,
      ).length;
      if (isStaffMode && nextWaitingCount > waitingCountRef.current) {
        playAttentionSound();
      }
      waitingCountRef.current = nextWaitingCount;

    });
    socket.on("chatbot:handoff", () => {
      if (isStaffMode) {
        playAttentionSound();
        setIsOpen(true);
      }
    });
    socket.on("chatbot:conversation", (conversation: ChatbotConversation) => {
      const lastMessage = conversation.messages.at(-1);
      const lastMessageId = lastMessage?.id ?? null;
      const shouldPlayMessageSound =
        lastMessageId &&
        lastMessageIdRef.current &&
        lastMessageId !== lastMessageIdRef.current &&
        ((isStaffMode && lastMessage?.sender === "user") ||
          (!isStaffMode && lastMessage?.sender === "staff"));

      shouldStickToBottomRef.current = true;
      setConversationId(conversation.conversationId);
      setMessages(conversation.messages);
      setHasMoreMessages(Boolean(conversation.hasMoreMessages));
      setIsTyping(false);
      lastMessageIdRef.current = lastMessageId;

      if (shouldPlayMessageSound) {
        playAttentionSound();
      }

      if (!isStaffMode) {
        window.localStorage.setItem(CHATBOT_CONVERSATION_KEY, conversation.conversationId);
      }
    });
    socket.on("chatbot:history", (history: ChatbotHistoryResponse) => {
      if (history.conversationId !== conversationIdRef.current) return;

      const container = messagesContainerRef.current;
      const previousScrollHeight = container?.scrollHeight ?? 0;

      shouldStickToBottomRef.current = false;
      setMessages((currentMessages) => {
        const existingIds = new Set(currentMessages.map((message) => message.id));
        const newMessages = history.messages.filter((message) => !existingIds.has(message.id));
        return [...newMessages, ...currentMessages];
      });
      setHasMoreMessages(history.hasMore);
      setLoadingHistory(false);

      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop = container.scrollHeight - previousScrollHeight;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [effectiveRequesterPayload, isStaffMode, socketUrl]);

  useEffect(() => {
    if (!isStaffMode) return;

    const interval = window.setInterval(() => {
      socketRef.current?.emit("chatbot:staff-queue:refresh");
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [isStaffMode]);

  useEffect(() => {
    if (!isOpen) return;
    shouldStickToBottomRef.current = true;
    scrollMessagesToBottom();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shouldStickToBottomRef.current) return;
    scrollMessagesToBottom();
  }, [isOpen, isTyping, messages]);

  const selectConversation = (conversation: ChatbotConversation) => {
    shouldStickToBottomRef.current = true;
    setConversationId(conversation.conversationId);
    setMessages(conversation.messages);
    setHasMoreMessages(Boolean(conversation.hasMoreMessages));
    socketRef.current?.emit("chatbot:staff-join", {
      conversationId: conversation.conversationId,
      staffId: currentStaffId,
      staffName: currentStaffName,
    });
  };

  const loadOlderMessages = () => {
    if (!socketRef.current || !conversationId || !hasMoreMessages || loadingHistory) return;
    const firstPersistedMessage = messages.find((message) => !message.id.startsWith("local-"));
    if (!firstPersistedMessage) return;

    setLoadingHistory(true);
    socketRef.current.emit("chatbot:history", {
      conversationId,
      beforeMessageId: firstPersistedMessage.id,
      limit: 20,
    });
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (shouldStickToBottomRef.current) {
      if (distanceFromBottom > 64 && container.scrollTop > 32) {
        shouldStickToBottomRef.current = false;
      }
      return;
    }

    if (distanceFromBottom <= 64) {
      shouldStickToBottomRef.current = true;
      return;
    }

    if (container.scrollTop > 32) return;
    loadOlderMessages();
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = draft.trim();
    if (!content || !socketRef.current) return;

    setDraft("");

    if (isStaffMode) {
      shouldStickToBottomRef.current = true;
      setMessages((currentMessages) => [
        ...currentMessages,
        createOptimisticMessage(conversationId, "staff", content, currentStaffName),
      ]);
      socketRef.current.emit("chatbot:staff-message", {
        conversationId,
        content,
        staffId: currentStaffId,
        staffName: currentStaffName,
      });
      return;
    }

    shouldStickToBottomRef.current = true;
    setMessages((currentMessages) => [
      ...currentMessages,
      createOptimisticMessage(conversationId, "user", content),
    ]);
    setIsTyping(true);
    socketRef.current.emit("chatbot:message", {
      conversationId,
      content,
      requester: effectiveRequesterPayload,
    });
  };

  const uploadFile = async (file: File) => {
    if (!socketRef.current) return;
    if (!isStaffMode && !currentUser) {
      antdMessage.warning("Bạn cần đăng nhập để upload ảnh/file.");
      return;
    }

    setUploadingFile(true);
    try {
      const isImage = file.type.startsWith("image/");
      const endpoint = isStaffMode ? "/management/uploads/presign" : "/uploads/presign";
      const body = isStaffMode
        ? {
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            path: "chat",
            baseName: file.name,
          }
        : {
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
          };
      const presign = await apiClient
        .post<{ data: PresignResponse }>(endpoint, body)
        .then((response) => response.data.data);

      await fetch(presign.url, {
        method: presign.method,
        headers: presign.headers,
        body: file,
      });

      const filePayload = {
        messageType: isImage ? ("image" as const) : ("file" as const),
        fileUrl: presign.publicUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      };
      const content = isImage ? "" : `Đã gửi file: ${file.name}`;

      shouldStickToBottomRef.current = true;
      setMessages((currentMessages) => [
        ...currentMessages,
        createOptimisticMessage(
          conversationId,
          isStaffMode ? "staff" : "user",
          content,
          isStaffMode ? currentStaffName : undefined,
          filePayload,
        ),
      ]);
      if (!isStaffMode) {
        setIsTyping(true);
      }

      socketRef.current.emit(isStaffMode ? "chatbot:staff-message" : "chatbot:message", {
        conversationId,
        content,
        staffId: isStaffMode ? currentStaffId : undefined,
        staffName: isStaffMode ? currentStaffName : undefined,
        requester: isStaffMode ? undefined : effectiveRequesterPayload,
        fileKey: presign.key,
        aiFileUrl: presign.publicUrl,
        ...filePayload,
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const requestAdvisor = () => {
    if (!socketRef.current || hasRequestedAdvisor) return;

    shouldStickToBottomRef.current = true;
    setMessages((currentMessages) => [
      ...currentMessages,
      createOptimisticMessage(
        conversationId,
        "system",
        "Mình đã chuyển cuộc trò chuyện này đến tư vấn viên/bác sĩ. Bạn chờ một chút nhé.",
      ),
    ]);
    setIsTyping(true);
    socketRef.current.emit("chatbot:message", {
      conversationId,
      requestStaff: true,
      requester: effectiveRequesterPayload,
    });
  };

  const title = isStaffMode ? "Hỗ trợ tư vấn" : "Maternity Care Bot";
  const buttonTitle = isOpen
    ? "Đóng chat"
    : isStaffMode
      ? "Mở hỗ trợ tư vấn"
      : "Mở chatbot";

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {isOpen ? (
        <section
          className={`flex h-[min(640px,calc(100vh-7rem))] ${
            isStaffMode
              ? "w-[min(calc(100vw-2rem),720px)]"
              : "w-[min(calc(100vw-2rem),390px)]"
          } flex-col overflow-hidden rounded-[1.75rem] border bg-white shadow-2xl backdrop-blur ${
            isStaffMode
              ? "border-teal-100 shadow-teal-200/40"
              : "border-pink-100 shadow-pink-200/40"
          }`}
        >
          <header
            className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3.5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm ${
                  isStaffMode
                    ? "bg-gradient-to-br from-teal-500 to-cyan-500"
                    : "bg-gradient-to-br from-pink-500 to-rose-500"
                }`}
              >
                {isStaffMode ? <Headphones className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="m-0 text-sm font-semibold text-slate-900">{title}</h2>
                <div
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isConnected
                      ? isStaffMode
                        ? "bg-teal-50 text-teal-700"
                        : "bg-pink-50 text-pink-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      Đang online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      Mất kết nối
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="text"
              aria-label="Đóng chat"
              className="!flex !h-9 !w-9 !items-center !justify-center !rounded-full !text-slate-500 hover:!bg-slate-100 hover:!text-slate-800"
              icon={<X className="h-5 w-5" />}
              onClick={() => setIsOpen(false)}
            />
          </header>

          {isStaffMode ? (
            <div className="border-b border-slate-100 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Cuộc chat cần hỗ trợ</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-slate-700 shadow-sm ring-1 ring-slate-200">
                  {staffQueue.length}
                </span>
              </div>
              <div className="flex max-h-28 gap-2 overflow-x-auto pb-1">
                {staffQueue.length ? (
                  staffQueue.map((conversation) => {
                    const lastMessage = getLastMessage(conversation);
                    const selected = conversation.conversationId === conversationId;

                    return (
                      <div
                        key={conversation.conversationId}
                        role="button"
                        tabIndex={0}
                        className={`min-w-60 rounded-2xl border px-3 py-2.5 text-left text-xs transition ${
                          selected
                            ? "border-teal-400 bg-white shadow-md shadow-teal-100"
                            : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm"
                        }`}
                        onClick={() => selectConversation(conversation)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectConversation(conversation);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">
                            #{conversation.conversationId.slice(0, 8)}
                          </span>
                          <Badge
                            color={
                              conversation.assignedStaffName
                                ? "green"
                                : conversation.status === "waiting_for_staff"
                                  ? "orange"
                                  : "blue"
                            }
                            text={
                              conversation.assignedStaffName
                                ? `Đang rep: ${conversation.assignedStaffName}`
                                : conversation.status === "waiting_for_staff"
                                  ? "Chờ bác sĩ"
                                  : "Đang chat"
                            }
                          />
                        </div>
                        <p className="mt-1.5 line-clamp-1 text-slate-500">
                          {lastMessage?.messageType === "image"
                            ? "User đã gửi ảnh"
                            : lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] text-slate-500">
                            {conversation.requester?.name
                              ? `User: ${conversation.requester.name}`
                              : "User chưa đăng nhập/ẩn danh"}
                          </span>
                          <Button
                            size="small"
                            type="link"
                            className="!h-auto !p-0 !text-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              setProfileModalConversation(conversation);
                            }}
                          >
                            Xem TT user
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full rounded-2xl border border-dashed border-teal-200 bg-white/70 py-3">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có yêu cầu" />
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4"
          >
            {loadingHistory ? (
              <div className="text-center text-xs text-slate-500">Đang tải tin nhắn cũ...</div>
            ) : hasMoreMessages && (!isStaffMode || activeConversation) ? (
              <button
                type="button"
                className="mx-auto block rounded-full bg-white px-3 py-1 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200"
                onClick={loadOlderMessages}
              >
                Tải tin nhắn cũ hơn
              </button>
            ) : null}

            {isStaffMode && !activeConversation ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Headphones className="mx-auto h-10 w-10 text-teal-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Chọn một cuộc chat để tư vấn
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Khi user yêu cầu gặp bác sĩ/tư vấn viên, cuộc chat sẽ xuất hiện ở đây.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.sender === "user";
                const isStaff = message.sender === "staff";
                const isSystem = message.sender === "system";
                const alignRight = isStaffMode ? isStaff : isUser;
                const isImageMessage = message.messageType === "image" && Boolean(message.fileUrl);
                const displayContent = isImageMessage ? "" : message.content?.trim();
                const hasTextContent = Boolean(displayContent);
                const messageTime = formatMessageTime(message.createdAt);

                if (!isStaffMode && isSystem) {
                  return (
                    <div key={message.id} className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-pink-200" />
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-pink-600 shadow-sm ring-1 ring-pink-100">
                        {getUserSystemLabel(message)}
                      </span>
                      <div className="h-px flex-1 bg-pink-200" />
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${alignRight ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex max-w-[78%] flex-col ${alignRight ? "items-end" : "items-start"}`}>
                      <div
                        className={`text-sm leading-relaxed ${
                          isImageMessage
                            ? "max-w-full"
                            : `rounded-2xl px-3.5 py-2.5 shadow-sm ${
                                alignRight
                                  ? isStaffMode
                                    ? "rounded-br-md bg-teal-600 text-white"
                                    : "rounded-br-md bg-pink-500 text-white"
                                  : isSystem
                                    ? "rounded-bl-md border border-amber-100 bg-amber-50 text-amber-800"
                                    : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                              }`
                        }`}
                      >
                        {isStaff ? (
                          <div
                            className={`${
                              isImageMessage
                                ? "mb-1 ml-1 text-slate-500"
                                : "mb-1 opacity-80"
                            } flex items-center gap-1 text-[11px]`}
                          >
                            <UserRound className="h-3 w-3" />
                            {isStaffMode ? message.senderName ?? "Tư vấn viên" : "Tư vấn viên"}
                          </div>
                        ) : null}
                        {hasTextContent ? (
                          <div className="whitespace-pre-wrap">
                            {renderMessageContent(displayContent, alignRight)}
                          </div>
                        ) : null}
                        {message.fileUrl ? (
                          message.messageType === "image" ? (
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                              title={message.fileName ?? "Xem ảnh"}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={message.fileUrl}
                                alt={message.fileName ?? "Ảnh chat"}
                                className="max-h-52 max-w-full rounded-2xl border border-white bg-white object-cover shadow-lg shadow-slate-200/80 ring-1 ring-slate-200"
                                onLoad={() => {
                                  if (shouldStickToBottomRef.current) {
                                    bottomRef.current?.scrollIntoView({ behavior: "auto" });
                                  }
                                }}
                              />
                            </a>
                          ) : (
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`${hasTextContent ? "mt-2" : ""} flex items-center gap-2 rounded-xl ${
                                alignRight ? "bg-white/20" : "bg-slate-100"
                              } px-3 py-2 underline`}
                            >
                              <Paperclip className="h-4 w-4" />
                              {message.fileName ?? "Tải file"}
                            </a>
                          )
                        ) : null}
                      </div>
                      {messageTime ? (
                        <span className="mt-1 px-1 text-[10px] leading-none text-slate-400">
                          {messageTime}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-pink-100 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                  {typingLabel}
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-100 bg-white p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.04)]"
          >
            {activeAssignedToOther ? (
              <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {activeConversation?.assignedStaffName} đang reply cuộc chat này. Bạn có thể xem
                nội dung nhưng không gửi phản hồi để tránh trùng tư vấn.
              </p>
            ) : null}
            {!isStaffMode ? (
              <Button
                block
                type={hasRequestedAdvisor ? "default" : "primary"}
                className={`!mb-2 !h-10 !rounded-2xl !border-0 !font-semibold ${
                  hasRequestedAdvisor
                    ? ""
                    : "!bg-gradient-to-r !from-pink-500 !to-rose-500 hover:!opacity-95"
                }`}
                disabled={!isConnected || hasRequestedAdvisor}
                icon={<Headphones className="h-4 w-4" />}
                onClick={requestAdvisor}
              >
                {hasRequestedAdvisor ? "Đã yêu cầu tư vấn viên" : "Gặp tư vấn viên/bác sĩ"}
              </Button>
            ) : null}
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
              <Button
                type="default"
                disabled={
                  uploadingFile ||
                  !isConnected ||
                  (!isStaffMode && !currentUser) ||
                  (isStaffMode && !activeConversation) ||
                  activeAssignedToOther
                }
                className="!flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border-0 !bg-white !text-slate-500 hover:!text-slate-800"
                icon={uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
              />
              <Input.TextArea
                value={draft}
                autoSize={{ minRows: 1, maxRows: 3 }}
                placeholder={
                  isStaffMode
                    ? "Nhập phản hồi cho user..."
                    : "Nhập câu hỏi cho bot..."
                }
                className="!rounded-xl !border-0 !bg-transparent !px-2 !py-2 !shadow-none focus:!shadow-none"
                disabled={(isStaffMode && !activeConversation) || activeAssignedToOther}
                onChange={(event) => setDraft(event.target.value)}
                onPressEnter={(event) => {
                  if (!event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <Button
                htmlType="submit"
                type="primary"
                disabled={
                  !draft.trim() ||
                  !isConnected ||
                  uploadingFile ||
                  (isStaffMode && !activeConversation) ||
                  activeAssignedToOther
                }
                className={`!flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border-0 ${
                  isStaffMode
                    ? "!bg-teal-600 hover:!bg-teal-700"
                    : "!bg-pink-500 hover:!bg-pink-600"
                }`}
                icon={<Send className="h-4 w-4" />}
              />
            </div>
          </form>
        </section>
      ) : null}

      <Tooltip title={buttonTitle}>
        <Badge count={isStaffMode ? waitingCount : 0} offset={[-4, 4]}>
          <Button
            type="primary"
            size="large"
            aria-label={buttonTitle}
            className={`!flex !h-14 !w-14 !items-center !justify-center !rounded-2xl !border-0 !shadow-xl ${
              isStaffMode
                ? "!bg-gradient-to-br !from-teal-500 !to-cyan-500 !shadow-teal-300/50"
                : "!bg-gradient-to-br !from-pink-500 !to-rose-500 !shadow-pink-300/50"
            }`}
            icon={isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            onClick={() => setIsOpen((value) => !value)}
          />
        </Badge>
      </Tooltip>

      <Modal
        open={Boolean(profileModalConversation)}
        title="Thông tin user"
        footer={null}
        onCancel={() => setProfileModalConversation(null)}
      >
        {profileModalConversation?.requester ? (
          <div className="space-y-4">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Tên">
                {profileModalConversation.requester.name ?? "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {profileModalConversation.requester.email ?? "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {profileModalConversation.requester.phone ?? "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {profileModalConversation.requester.address ?? "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label="User ID">
                {profileModalConversation.requester.id ?? "Chưa có"}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Cơ sở liên quan
              </p>
              <div className="flex flex-wrap gap-2">
                {profileModalConversation.requester.facilities?.length ? (
                  profileModalConversation.requester.facilities.map((facility) => (
                    <Tag key={facility.id} color="teal">
                      {facility.name}
                      {facility.code ? ` (${facility.code})` : ""}
                    </Tag>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Chưa có cơ sở</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="User chưa đăng nhập hoặc chưa có thông tin"
          />
        )}
      </Modal>
    </div>
  );
}

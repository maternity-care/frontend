"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { AlertCircle, ArrowLeft, CheckCircle2, FileUp, Pencil, Play, QrCode, RefreshCw, Square, Trash2, Upload, Webhook, X } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import {
  connectFacebookOAuthPage,
  createFacebookPageAccount,
  createFacebookOAuthUrl,
  exchangeFacebookOAuth,
  getMessagingAccounts,
  deleteMessagingAccount,
  importZaloAccount,
  startMessagingAccount,
  startZaloQrLogin,
  startZaloQrLoginForAccount,
  stopMessagingAccount,
  updateMessagingAccount,
} from "@/management/features/messages/messages.api";
import type { MessagingAccount } from "@/management/features/messages/messages.types";
import { API_BASE_URL, MANAGEMENT_ACCESS_TOKEN_KEY } from "@/lib/constants";
import { cn, getErrorMessage } from "@/lib/utils";

type QrEvent = {
  accountId?: string;
  status?: string;
  qrImage?: string;
  message?: string;
  error?: string;
  profile?: { display_name?: string };
};

type FacebookOAuthPage = {
  id: string;
  name: string;
  tasks?: string[];
};

function normalizeQrImage(value?: string) {
  if (!value) return null;
  return value.startsWith("data:image/") ? value : `data:image/png;base64,${value}`;
}

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

function channelLabel(channel: string) {
  if (channel === "zalo_personal") return "Zalo cá nhân";
  if (channel === "zalo_oa") return "Zalo OA";
  if (channel === "facebook_page") return "Facebook";
  return channel;
}

function qrStatusLabel(status?: string) {
  if (status === "waiting") return "Đang tạo QR";
  if (status === "qr_generated") return "Chờ quét QR";
  if (status === "qr_scanned") return "Đã quét QR";
  if (status === "qr_confirmed") return "Đã xác nhận";
  if (status === "qr_authenticated") return "Đăng nhập thành công";
  if (status === "qr_expired") return "QR hết hạn";
  if (status === "qr_declined") return "Từ chối đăng nhập";
  if (status === "qr_error") return "QR lỗi";
  return status || "QR";
}

function qrStatusMessage(event: QrEvent) {
  if (event.message) return event.message;
  if (event.status === "qr_generated") return "Quét QR bằng Zalo mobile để lưu session vào account.";
  if (event.status === "qr_scanned") {
    return `Đã quét${event.profile?.display_name ? ` bởi ${event.profile.display_name}` : ""}, xác nhận trên điện thoại.`;
  }
  if (event.status === "qr_authenticated") return "Đăng nhập Zalo thành công, account đã sẵn sàng.";
  if (event.status === "qr_expired") return "QR đã hết hạn, bấm Xem QR để tạo lại.";
  if (event.status === "qr_declined") return "Thiết bị đã từ chối đăng nhập.";
  if (event.status === "qr_error") return event.error || "QR login lỗi, bấm Xem QR để thử lại.";
  return "Đang chờ QR từ Zalo...";
}

export default function MessageAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<MessagingAccount[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fbPageId, setFbPageId] = useState("");
  const [fbPageName, setFbPageName] = useState("");
  const [fbPageAccessToken, setFbPageAccessToken] = useState("");
  const [fbVerifyToken, setFbVerifyToken] = useState("");
  const [fbAutoStart, setFbAutoStart] = useState(true);
  const [fbOAuthSessionId, setFbOAuthSessionId] = useState<string | null>(null);
  const [fbOAuthPages, setFbOAuthPages] = useState<FacebookOAuthPage[]>([]);
  const [qrEvent, setQrEvent] = useState<QrEvent | null>(null);
  const [editingAccount, setEditingAccount] = useState<MessagingAccount | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editProxyUrl, setEditProxyUrl] = useState("");
  const [editAutoStart, setEditAutoStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const loadAccounts = async () => {
    setError(null);
    setAccounts(await getMessagingAccounts());
  };

  useEffect(() => {
    loadAccounts()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) return;

    const expectedState = window.sessionStorage.getItem("messaging_fb_oauth_state");
    if (expectedState && expectedState !== state) {
      setError("Facebook OAuth state không khớp, vui lòng connect lại.");
      router.replace("/management/message-accounts");
      return;
    }

    const redirectUri = `${window.location.origin}/management/message-accounts`;
    setBusy(true);
    setError(null);
    exchangeFacebookOAuth({ code, state, redirectUri })
      .then((result) => {
        setFbOAuthSessionId(result.sessionId);
        setFbOAuthPages(result.pages);
        window.sessionStorage.removeItem("messaging_fb_oauth_state");
        router.replace("/management/message-accounts");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setBusy(false));
  }, [router]);

  useEffect(() => {
    const socket = io(`${getSocketUrl()}/messages`, {
      transports: ["websocket", "polling"],
      auth: { token: getToken() },
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("messages:account.updated", (account: MessagingAccount) => {
      setAccounts((items) => [account, ...items.filter((item) => item.id !== account.id)]);
      setQrEvent((current) => {
        if (!current || current.accountId !== account.id) return current;
        if (account.status === "connected") {
          return {
            ...current,
            status: "qr_authenticated",
            message: "Đăng nhập Zalo thành công, account đã sẵn sàng nhận/gửi tin.",
          };
        }
        if (account.status === "error") {
          return {
            ...current,
            status: "qr_error",
            error: account.lastError || undefined,
            message: account.lastError || "QR login lỗi, bấm Xem QR để thử lại.",
          };
        }
        return current;
      });
    });
    socket.on("messages:account.deleted", (payload: { id?: string }) => {
      if (!payload.id) return;
      setAccounts((items) => items.filter((item) => item.id !== payload.id));
    });
    socket.on("messages:zalo.qr", (payload: QrEvent) => {
      setQrEvent({
        ...payload,
        qrImage: normalizeQrImage(payload.qrImage) ?? undefined,
      });
      void loadAccounts();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const account = await importZaloAccount({
        file,
        displayName: displayName.trim() || undefined,
        proxyUrl: proxyUrl.trim() || undefined,
      });
      setAccounts((items) => [account, ...items.filter((item) => item.id !== account.id)]);
      setFile(null);
      setDisplayName("");
      setProxyUrl("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleQrLogin = async () => {
    setBusy(true);
    setError(null);
    setQrEvent(null);
    try {
      const result = await startZaloQrLogin({
        displayName: displayName.trim() || undefined,
        proxyUrl: proxyUrl.trim() || undefined,
      });
      setQrEvent({ accountId: result.accountId, status: "waiting" });
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAccountQrLogin = async (account: MessagingAccount) => {
    setBusy(true);
    setError(null);
    setQrEvent({ accountId: account.id, status: "waiting" });
    try {
      await startZaloQrLoginForAccount(account.id);
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateFacebookPage = async () => {
    setBusy(true);
    setError(null);
    try {
      const account = await createFacebookPageAccount({
        pageId: fbPageId.trim(),
        pageName: fbPageName.trim(),
        pageAccessToken: fbPageAccessToken.trim(),
        verifyToken: fbVerifyToken.trim() || undefined,
        autoStart: fbAutoStart,
      });
      setAccounts((items) => [account, ...items.filter((item) => item.id !== account.id)]);
      setFbPageId("");
      setFbPageName("");
      setFbPageAccessToken("");
      setFbVerifyToken("");
      setFbAutoStart(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleStartFacebookOAuth = async () => {
    setBusy(true);
    setError(null);
    try {
      const redirectUri = `${window.location.origin}/management/message-accounts`;
      const result = await createFacebookOAuthUrl({ redirectUri });
      window.sessionStorage.setItem("messaging_fb_oauth_state", result.state);
      window.location.href = result.url;
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  const handleConnectFacebookOAuthPage = async (page: FacebookOAuthPage) => {
    if (!fbOAuthSessionId) return;
    setBusy(true);
    setError(null);
    try {
      const account = await connectFacebookOAuthPage({
        sessionId: fbOAuthSessionId,
        pageId: page.id,
        verifyToken: fbVerifyToken.trim() || undefined,
        autoStart: fbAutoStart,
      });
      setAccounts((items) => [account, ...items.filter((item) => item.id !== account.id)]);
      setFbOAuthSessionId(null);
      setFbOAuthPages([]);
      setFbVerifyToken("");
      setFbAutoStart(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (account: MessagingAccount) => {
    if (account.status === "connected" || account.status === "connecting") {
      setError("Vui lòng stop account trước khi xoá.");
      return;
    }

    if (!window.confirm(`Xoá account "${account.displayName}"?`)) return;

    setBusy(true);
    setError(null);
    try {
      await deleteMessagingAccount(account.id);
      setAccounts((items) => items.filter((item) => item.id !== account.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async (account: MessagingAccount) => {
    setBusy(true);
    setError(null);
    try {
      await startMessagingAccount(account.id);
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err));
      await loadAccounts().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async (account: MessagingAccount) => {
    setBusy(true);
    setError(null);
    try {
      await stopMessagingAccount(account.id);
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err));
      await loadAccounts().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const openEditModal = (account: MessagingAccount) => {
    setEditingAccount(account);
    setEditDisplayName(account.displayName);
    setEditProxyUrl("");
    setEditAutoStart(Boolean(account.autoStart));
  };

  const handleSaveAccount = async () => {
    if (!editingAccount) return;
    setBusy(true);
    setError(null);
    try {
      const payload: { displayName?: string; proxyUrl?: string | null; autoStart?: boolean } = {
        displayName: editDisplayName.trim(),
        autoStart: editAutoStart,
      };
      if (editProxyUrl.trim()) payload.proxyUrl = editProxyUrl.trim();
      const account = await updateMessagingAccount(editingAccount.id, payload);
      setAccounts((items) => [account, ...items.filter((item) => item.id !== account.id)]);
      setEditingAccount(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const qrImage = normalizeQrImage(qrEvent?.qrImage);
  const qrIsError = qrEvent?.status === "qr_error" || qrEvent?.status === "qr_expired" || qrEvent?.status === "qr_declined";
  const qrIsSuccess = qrEvent?.status === "qr_authenticated";

  return (
    <AdminLayout roles={["super_admin", "admin", "staff"]} permissions={["messaging.account_manage"]}>
      <div className="pt-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader title="Message Accounts" description="Quản lý account Zalo cá nhân trước. Sau này có thể thêm Zalo OA và Facebook Page ở cùng màn này." />
          <Link
            href="/management/messages"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Về inbox
          </Link>
        </div>

        {error ? <StateBlock type="error" title="Có lỗi account" description={error} /> : null}
        {loading ? <StateBlock type="loading" title="Đang tải account" /> : null}

        {!loading ? (
          <div className="grid gap-4">
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
              <div className="grid gap-3 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(0,1fr)]">
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Zalo session ZIP
                  <span className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                    <FileUp className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="min-w-0 flex-1 truncate">{file?.name || "Chọn file zip/json"}</span>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">Browse</span>
                  </span>
                  <input
                    type="file"
                    accept=".zip,.json,application/zip,application/json"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Tên account
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="h-10 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                    placeholder="Zalo CSKH 01"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Proxy
                  <input
                    value={proxyUrl}
                    onChange={(event) => setProxyUrl(event.target.value)}
                    className="h-10 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                    placeholder="http://user:pass@host:port"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!file || busy}
                  onClick={handleImport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleQrLogin}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-teal-700 px-3 text-sm font-semibold text-teal-800 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tạo QR
                </button>
              </div>
            </section>

            <section className="grid gap-3 rounded-lg border border-blue-100 bg-white p-4">
              <div className="grid gap-3">
                <div className="flex flex-col gap-2 rounded-md bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-950">Facebook Page</p>
                    <p className="text-xs text-blue-700">Connect bằng Facebook App hoặc nhập Page token thủ công.</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleStartFacebookOAuth()}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Webhook className="h-4 w-4" />
                    Connect Facebook
                  </button>
                </div>

                {fbOAuthPages.length > 0 ? (
                  <div className="grid gap-2 rounded-md border border-blue-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">Chọn page từ Facebook</p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                        onClick={() => {
                          setFbOAuthPages([]);
                          setFbOAuthSessionId(null);
                        }}
                      >
                        Huỷ OAuth
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {fbOAuthPages.map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          disabled={busy || !fbOAuthSessionId}
                          onClick={() => void handleConnectFacebookOAuthPage(page)}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{page.name}</span>
                            <span className="block truncate text-xs text-slate-500">{page.id}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">Chọn</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_180px] xl:items-end">
                <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(140px,180px)_minmax(160px,220px)_minmax(0,1fr)_minmax(140px,200px)]">
                  <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-600">
                    Facebook Page ID
                    <input
                      value={fbPageId}
                      onChange={(event) => setFbPageId(event.target.value)}
                      className="h-10 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                      placeholder="1234567890"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-600">
                    Tên page
                    <input
                      value={fbPageName}
                      onChange={(event) => setFbPageName(event.target.value)}
                      className="h-10 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                      placeholder="Maternity Care"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-600">
                    Page access token
                    <input
                      value={fbPageAccessToken}
                      onChange={(event) => setFbPageAccessToken(event.target.value)}
                      className="h-10 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                      placeholder="EAAB..."
                      type="password"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-600">
                    Verify token
                    <input
                      value={fbVerifyToken}
                      onChange={(event) => setFbVerifyToken(event.target.value)}
                      className="h-10 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                      placeholder="Webhook verify token"
                    />
                  </label>
                </div>
                <div className="grid gap-2">
                  <label className="flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600">
                    Auto start
                    <input
                      type="checkbox"
                      checked={fbAutoStart}
                      onChange={(event) => setFbAutoStart(event.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !fbPageId.trim() || !fbPageName.trim() || !fbPageAccessToken.trim()}
                    onClick={() => void handleCreateFacebookPage()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-blue-200 px-3 text-sm font-semibold text-blue-700 disabled:opacity-50"
                  >
                    <Webhook className="h-4 w-4" />
                    Thêm thủ công
                  </button>
                </div>
              </div>
            </section>

            {qrEvent ? (
              <section className={cn(
                "grid gap-3 rounded-lg border p-4 md:grid-cols-[120px_minmax(0,1fr)] md:items-center",
                qrIsError ? "border-red-200 bg-red-50" : qrIsSuccess ? "border-emerald-200 bg-emerald-50" : "border-teal-200 bg-teal-50",
              )}>
                <div className={cn(
                  "flex h-28 w-28 items-center justify-center rounded-md bg-white ring-1",
                  qrIsError ? "ring-red-200" : qrIsSuccess ? "ring-emerald-200" : "ring-teal-200",
                )}>
                  {qrImage ? (
                    <img src={qrImage} alt="Zalo login QR" className="h-24 w-24 object-contain" />
                  ) : qrIsSuccess ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  ) : qrIsError ? (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  ) : (
                    <RefreshCw className="h-7 w-7 animate-spin text-teal-700" />
                  )}
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", qrIsError ? "text-red-950" : qrIsSuccess ? "text-emerald-950" : "text-teal-950")}>
                    Zalo QR login: {qrStatusLabel(qrEvent.status)}
                  </p>
                  <p className={cn("mt-1 text-sm", qrIsError ? "text-red-700" : qrIsSuccess ? "text-emerald-700" : "text-teal-800")}>
                    {qrStatusMessage(qrEvent)}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Accounts</p>
                  <p className="text-xs text-slate-500">{accounts.length} account đang cấu hình</p>
                </div>
                <button type="button" onClick={() => void loadAccounts()} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {accounts.map((account) => {
                  const mustStopBeforeDelete = account.status === "connected" || account.status === "connecting";
                  const isLoggedIn = Boolean(account.externalAccountId);
                  const isRunning = account.status === "connected" || account.status === "connecting";
                  return (
                  <div key={account.id} className="grid gap-3 px-4 py-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          account.status === "connected" ? "bg-emerald-500" : account.status === "error" ? "bg-red-500" : "bg-slate-300",
                        )} />
                        <p className="truncate text-sm font-semibold text-slate-950">{account.displayName}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {channelLabel(account.channel)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {account.externalAccountId || "Chưa có external id"} · {account.status}
                        {account.proxyUrl ? ` · ${account.proxyUrl}` : ""}
                      </p>
                      {account.lastError ? <p className="mt-2 line-clamp-2 text-xs text-red-600">{account.lastError}</p> : null}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {isLoggedIn ? (
                        isRunning ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStop(account)}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-slate-200 text-xs font-semibold disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            <Square className="h-3.5 w-3.5" /> Stop
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStart(account)}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-slate-200 text-xs font-semibold disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            <Play className="h-3.5 w-3.5" /> Start
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled={busy || isRunning}
                          title="Xem/tạo lại QR"
                          onClick={() => void handleAccountQrLogin(account)}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-teal-200 text-xs font-semibold text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          <QrCode className="h-3.5 w-3.5" /> Xem QR
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        title="Sửa tên/proxy"
                        onClick={() => openEditModal(account)}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Sửa
                      </button>
                      <button
                        type="button"
                        disabled={busy || mustStopBeforeDelete}
                        title={mustStopBeforeDelete ? "Stop account trước khi xoá" : "Xoá account"}
                        onClick={() => void handleDelete(account)}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-red-200 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xoá
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>
            </section>
          </div>
        ) : null}

        {editingAccount ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Sửa account</p>
                  <p className="text-xs text-slate-500">{channelLabel(editingAccount.channel)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  onClick={() => setEditingAccount(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 p-4">
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Tên account
                  <input
                    value={editDisplayName}
                    onChange={(event) => setEditDisplayName(event.target.value)}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-300"
                    placeholder="Zalo CSKH 01"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Proxy mới
                  <input
                    value={editProxyUrl}
                    onChange={(event) => setEditProxyUrl(event.target.value)}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-300"
                    placeholder={editingAccount.proxyUrl ? `Đang dùng ${editingAccount.proxyUrl}` : "http://user:pass@host:port"}
                  />
                  <span className="text-[11px] font-normal text-slate-400">Bỏ trống nếu không đổi proxy.</span>
                </label>
                <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <span>
                    <span className="block font-semibold text-slate-800">Tự chạy khi backend restart</span>
                    <span className="text-xs text-slate-500">Bật nếu muốn account tự listening lại sau khi server lên.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={editAutoStart}
                    onChange={(event) => setEditAutoStart(event.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button
                  type="button"
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setEditingAccount(null)}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  disabled={busy || !editDisplayName.trim()}
                  className="h-9 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={() => void handleSaveAccount()}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

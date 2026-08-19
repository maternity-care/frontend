import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  MessagingAccount,
  MessagingAppointment,
  MessagingConversation,
  MessagingCustomerIdentity,
  MessagingMessage,
  MessagingTag,
} from "./messages.types";

export function getMessagingAccounts() {
  return unwrapApiData<MessagingAccount[]>(
    apiClient.get("/management/messages/accounts"),
  );
}

export function updateMessagingAccount(
  id: string,
  input: { displayName?: string; proxyUrl?: string | null; autoStart?: boolean },
) {
  return unwrapApiData<MessagingAccount>(
    apiClient.patch(`/management/messages/accounts/${id}`, input),
  );
}

export function importZaloAccount(input: {
  file: File;
  displayName?: string;
  proxyUrl?: string;
  autoStart?: boolean;
}) {
  const form = new FormData();
  form.append("file", input.file);
  if (input.displayName) form.append("displayName", input.displayName);
  if (input.proxyUrl) form.append("proxyUrl", input.proxyUrl);
  if (input.autoStart !== undefined) form.append("autoStart", String(input.autoStart));

  return unwrapApiData<MessagingAccount>(
    apiClient.post("/management/messages/accounts/import/zalo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
}

export function startZaloQrLogin(input: {
  displayName?: string;
  proxyUrl?: string;
  autoStart?: boolean;
}) {
  return unwrapApiData<{ accountId: string }>(
    apiClient.post("/management/messages/accounts/qr/zalo", input),
  );
}

export function startZaloQrLoginForAccount(id: string) {
  return unwrapApiData<{ accountId: string }>(
    apiClient.post(`/management/messages/accounts/${id}/qr`),
  );
}

export function createFacebookPageAccount(input: {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  verifyToken?: string;
  autoStart?: boolean;
}) {
  return unwrapApiData<MessagingAccount>(
    apiClient.post("/management/messages/accounts/facebook-page", input),
  );
}

export function createFacebookOAuthUrl(input: { redirectUri: string }) {
  return unwrapApiData<{ url: string; state: string }>(
    apiClient.post("/management/messages/accounts/facebook/oauth-url", input),
  );
}

export function exchangeFacebookOAuth(input: {
  code: string;
  redirectUri: string;
  state: string;
}) {
  return unwrapApiData<{
    sessionId: string;
    pages: Array<{ id: string; name: string; tasks?: string[] }>;
  }>(
    apiClient.post("/management/messages/accounts/facebook/oauth-exchange", input),
  );
}

export function connectFacebookOAuthPage(input: {
  sessionId: string;
  pageId: string;
  verifyToken?: string;
  autoStart?: boolean;
}) {
  return unwrapApiData<MessagingAccount>(
    apiClient.post("/management/messages/accounts/facebook/oauth-connect", input),
  );
}

export function startMessagingAccount(id: string) {
  return unwrapApiData<{ started: boolean }>(
    apiClient.post(`/management/messages/accounts/${id}/start`),
  );
}

export function stopMessagingAccount(id: string) {
  return unwrapApiData<{ stopped: boolean }>(
    apiClient.post(`/management/messages/accounts/${id}/stop`),
  );
}

export function deleteMessagingAccount(id: string) {
  return unwrapApiData<{ deleted: boolean }>(
    apiClient.delete(`/management/messages/accounts/${id}`),
  );
}

export function getMessagingConversations(filters?: { tagIds?: string[] }) {
  const params = new URLSearchParams();
  filters?.tagIds?.forEach((tagId) => params.append("tagId", tagId));
  const query = params.toString();
  return unwrapApiData<MessagingConversation[]>(
    apiClient.get(`/management/messages/conversations${query ? `?${query}` : ""}`),
  );
}

export function createZaloPhoneConversation(input: { accountId: string; phone: string }) {
  return unwrapApiData<MessagingConversation>(
    apiClient.post("/management/messages/conversations/zalo-phone", input),
  );
}

export function deleteMessagingConversation(id: string) {
  return unwrapApiData<{ deleted: boolean }>(
    apiClient.delete(`/management/messages/conversations/${id}`),
  );
}

export function closeMessagingConversation(id: string) {
  return unwrapApiData<MessagingConversation>(
    apiClient.patch(`/management/messages/conversations/${id}/close`),
  );
}

export function getMessagingTags() {
  return unwrapApiData<MessagingTag[]>(
    apiClient.get("/management/messages/tags"),
  );
}

export function createMessagingTag(input: { name: string; color: string; sortOrder?: number }) {
  return unwrapApiData<MessagingTag>(
    apiClient.post("/management/messages/tags", input),
  );
}

export function getMessagingMessages(conversationId: string) {
  return unwrapApiData<MessagingMessage[]>(
    apiClient.get(`/management/messages/conversations/${conversationId}/messages`),
  );
}

export function getMessagingCustomer(conversationId: string) {
  return unwrapApiData<MessagingCustomerIdentity>(
    apiClient.get(`/management/messages/conversations/${conversationId}/customer`),
  );
}

export function updateMessagingCustomer(
  conversationId: string,
  input: { displayName?: string; phone?: string; email?: string; address?: string; userId?: string | null },
) {
  return unwrapApiData<MessagingCustomerIdentity>(
    apiClient.patch(`/management/messages/conversations/${conversationId}/customer`, input),
  );
}

export function quickCreateMessagingUser(conversationId: string) {
  return unwrapApiData<MessagingCustomerIdentity>(
    apiClient.post(`/management/messages/conversations/${conversationId}/customer/quick-user`),
  );
}

export function mapMessagingUser(conversationId: string, userId: string | null) {
  return unwrapApiData<MessagingCustomerIdentity>(
    apiClient.patch(`/management/messages/conversations/${conversationId}/customer/user`, { userId }),
  );
}

export function getMessagingAppointments(conversationId: string) {
  return unwrapApiData<MessagingAppointment[]>(
    apiClient.get(`/management/messages/conversations/${conversationId}/appointments`),
  );
}

export function assignMessagingConversation(conversationId: string, staffId?: string | null) {
  return unwrapApiData<MessagingConversation>(
    apiClient.patch(`/management/messages/conversations/${conversationId}/assignee`, { staffId }),
  );
}

export function setMessagingConversationTags(conversationId: string, tagIds: string[]) {
  return unwrapApiData<MessagingConversation>(
    apiClient.patch(`/management/messages/conversations/${conversationId}/tags`, { tagIds }),
  );
}

export function sendMessagingMessage(
  conversationId: string,
  content: string,
  attachment?: { url: string; name?: string; mimeType?: string; size?: number } | null,
) {
  return unwrapApiData<MessagingMessage>(
    apiClient.post(`/management/messages/conversations/${conversationId}/messages`, {
      content,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentMimeType: attachment?.mimeType,
      attachmentSize: attachment?.size,
    }),
  );
}

export function retryMessagingMessage(conversationId: string, messageId: string) {
  return unwrapApiData<MessagingMessage>(
    apiClient.post(`/management/messages/conversations/${conversationId}/messages/${messageId}/retry`),
  );
}

export function undoMessagingMessage(conversationId: string, messageId: string) {
  return unwrapApiData<MessagingMessage>(
    apiClient.post(`/management/messages/conversations/${conversationId}/messages/${messageId}/undo`),
  );
}

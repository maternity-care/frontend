export type MessagingAccountStatus =
  | "disabled"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type MessagingAccount = {
  id: string;
  channel: "zalo_personal" | "zalo_oa" | "facebook_page" | "web_chat";
  displayName: string;
  externalAccountId: string | null;
  status: MessagingAccountStatus;
  autoStart: boolean;
  proxyUrl: string | null;
  lastError: string | null;
  lastConnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessagingConversation = {
  id: string;
  accountId: string;
  channel: string;
  externalThreadId: string;
  externalThreadType: string;
  customerName: string | null;
  customerExternalId: string | null;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  status: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  account?: MessagingAccount;
};

export type MessagingTag = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MessagingCustomerIdentity = {
  id: string;
  userId: string | null;
  channel: string;
  accountId: string | null;
  externalUserId: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address?: string | null;
  } | null;
};

export type MessagingAppointment = {
  id: string;
  patientId: string;
  patient?: { id: string; name?: string; phone?: string; email?: string } | null;
  pregnancyProfileId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  service?: { id: string; name: string } | null;
  doctor?: { id: string; name: string } | null;
  facility?: { id: string; name: string } | null;
  room?: { id: string; name: string } | null;
};

export type MessagingMessage = {
  id: string;
  conversationId: string;
  accountId: string;
  direction: "inbound" | "outbound";
  senderType: "customer" | "staff" | "system";
  senderId: string | null;
  senderName: string | null;
  messageType: string;
  content: string | null;
  metadata?: Record<string, unknown> | null;
  sentAt: string | null;
  createdAt: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "partially_paid"
  | "cancelled"
  | "failed"
  | "refunded"
  | string;

export type OrderType = "normal_service" | "maternity_package" | "mixed";

export type OrderItemType =
  | "service"
  | "maternity_package"
  | "package"
  | "product"
  | string;

export type PaymentMethod =
  | "sepay"
  | "cash"
  | "bank_transfer"
  | "momo"
  | "vnpay"
  | "zalopay"
  | string;

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "refunded"
  | string;

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "cancelled"
  | "void"
  | string;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

// ============================================
// Create Order (khớp CreateOrderDto BE)
// ============================================

export interface CreateOrderItemPayload {
  itemId: string;
  itemType: OrderItemType;
  // name: string;
  quantity: number;
  // unitPrice: number;
  // metadata?: Record<string, unknown>;
}

export interface CreateOrderPayload {
  facilityId: string;
  orderType: OrderType;
  orderItems: CreateOrderItemPayload[];
  // subtotalAmount: number;
  // discountAmount: number;
  // totalAmount: number;
}

// ============================================
// Order / Invoice / Payment (response)
// ============================================

export interface OrderItem {
  id?: string;
  itemId?: string;
  itemType?: OrderItemType;
  name?: string;
  serviceId?: string;
  serviceName?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  discountAmount?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Invoice {
  id: string;
  code?: string;
  orderId?: string;
  facilityId?: string;
  customerId?: string;
  totalAmount?: number;
  paidAmount?: number;
  status?: InvoiceStatus;
  issuedAt?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PaymentTransaction {
  id: string;
  orderId?: string;
  invoiceId?: string;
  facilityId?: string;
  customerId?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  transactionCode?: string;
  sepayTransactionId?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PaymentOrder {
  id: string;
  code?: string;
  facilityId?: string;
  facilityName?: string;
  customerId?: string;
  customerName?: string;
  pregnancyProfileId?: string;
  orderType?: OrderType;
  orderItems?: OrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  invoice?: Invoice;
  payments?: PaymentTransaction[];
  qrUrl?: string;
  paymentQrUrl?: string;
  qrCodeUrl?: string;
  sepayQrUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  [key: string]: unknown;
}

// ============================================
// SEPay
// ============================================

export interface SePayCallbackPayload {
  id?: string | number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  accumulated?: number;
  subAccount?: string | null;
  referenceCode?: string;
  description?: string;
  [key: string]: unknown;
}

export interface SePayCallbackResponse {
  success: boolean;
  message?: string;
}

// ============================================
// Query Params
// ============================================

export interface ManagementOrdersQuery extends PaginationParams {
  facilityId?: string;
  code?: string;
  pregnancyProfileId?: string;
  fromDate?: string;
  toDate?: string;
  status?: OrderStatus | string;
  sortTotalAmount?: "asc" | "desc" | string;
  sortFacility?: "asc" | "desc" | string;
  customerId?: string;
  orderType?: OrderType | string;
  paymentMethod?: PaymentMethod | string;
  sortCustomer?: "asc" | "desc" | string;
}

export interface ManagementInvoicesQuery extends PaginationParams {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ManagementPaymentsQuery extends PaginationParams {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface MyOrdersQuery extends PaginationParams {
  facilityId?: string;
  code?: string;
  pregnancyProfileId?: string;
  fromDate?: string;
  toDate?: string;
  status?: OrderStatus | string;
  sortTotalAmount?: "asc" | "desc" | string;
  sortFacility?: "asc" | "desc" | string;
}
import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  ManagementOrdersQuery,
  ManagementInvoicesQuery,
  ManagementPaymentsQuery,
  PaymentOrder,
  Invoice,
  PaymentTransaction,
  PaginatedData,
} from "./payment.types";

// ============================================
// Management - Payments APIs
// ============================================

/**
 * GET /management/payments/orders
 * Lấy danh sách đơn hàng thanh toán
 */
export const getManagementOrders = (params?: ManagementOrdersQuery) =>
  unwrapApiData<PaginatedData<PaymentOrder> | PaymentOrder[]>(
    apiClient.get("/management/payments/orders", { params }),
  );

/**
 * GET /management/payments/orders/{id}
 * Lấy chi tiết đơn hàng thanh toán
 */
export const getManagementOrderById = (id: string) =>
  unwrapApiData<PaymentOrder>(
    apiClient.get(`/management/payments/orders/${id}`),
  );

/**
 * GET /management/payments/invoices
 * Lấy danh sách hóa đơn
 */
export const getManagementInvoices = (params?: ManagementInvoicesQuery) =>
  unwrapApiData<PaginatedData<Invoice> | Invoice[]>(
    apiClient.get("/management/payments/invoices", { params }),
  );

/**
 * GET /management/payments/payments
 * Lấy danh sách giao dịch thanh toán cho đơn hàng
 */
export const getManagementPayments = (params?: ManagementPaymentsQuery) =>
  unwrapApiData<PaginatedData<PaymentTransaction> | PaymentTransaction[]>(
    apiClient.get("/management/payments/payments", { params }),
  );
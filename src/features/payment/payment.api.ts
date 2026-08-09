import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  CreateOrderPayload,
  MyOrdersQuery,
  PaymentOrder,
  Invoice,
  PaymentTransaction,
  PaginatedData,
} from "./payment.types";

// ============================================
// Payments (User) APIs
// ============================================

/**
 * POST /payments/orders
 * Tạo đơn hàng
 */
export const createOrder = (payload: CreateOrderPayload) =>
  unwrapApiData<PaymentOrder>(apiClient.post("/payments/orders", payload));

/**
 * GET /payments/orders
 * Lấy đơn hàng của tôi và filter theo điều kiện
 */
export const getMyOrders = (params?: MyOrdersQuery) =>
  unwrapApiData<PaginatedData<PaymentOrder> | PaymentOrder[]>(
    apiClient.get("/payments/orders", { params }),
  );

/**
 * PATCH /payments/orders/cancel/{id}
 * Hủy đơn hàng
 */
export const cancelOrder = (id: string) =>
  unwrapApiData<PaymentOrder>(
    apiClient.patch(`/payments/orders/cancel/${id}`),
  );

/**
 * GET /payments/orders/{id}
 * Lấy chi tiết đơn hàng của tôi (kèm invoice và payment)
 */
export const getMyOrderById = (id: string) =>
  unwrapApiData<PaymentOrder>(apiClient.get(`/payments/orders/${id}`));

/**
 * GET /payments/invoices
 * Lấy toàn bộ hóa đơn của tôi
 */
export const getMyInvoices = () =>
  unwrapApiData<PaginatedData<Invoice> | Invoice[]>(
    apiClient.get("/payments/invoices"),
  );

/**
 * GET /payments/invoices/{id}
 * Lấy chi tiết hóa đơn của tôi
 */
export const getMyInvoiceById = (id: string) =>
  unwrapApiData<Invoice>(apiClient.get(`/payments/invoices/${id}`));

/**
 * GET /payments/payments
 * Lấy giao dịch thanh toán của tôi
 */
export const getMyPayments = () =>
  unwrapApiData<PaginatedData<PaymentTransaction> | PaymentTransaction[]>(
    apiClient.get("/payments/payments"),
  );

/**
 * GET /payments/payments/{id}
 * Lấy chi tiết giao dịch thanh toán
 */
export const getMyPaymentById = (id: string) =>
  unwrapApiData<PaymentTransaction>(
    apiClient.get(`/payments/payments/${id}`),
  );
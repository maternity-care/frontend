"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Spin, Tag } from "antd";
import { CreditCard, PackageCheck, RefreshCw } from "lucide-react";

import { getMyOrders } from "@/features/payment/payment.api";
import type { OrderItem, PaymentOrder } from "@/features/payment/payment.types";

function normalizeOrders(
  payload: PaymentOrder[] | { items?: PaymentOrder[] } | null,
) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number") return "-";
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function getStatusMeta(status?: string) {
  switch (status) {
    case "paid":
      return { color: "success", text: "Đã thanh toán" };
    case "partially_paid":
      return { color: "processing", text: "Thanh toán một phần" };
    case "pending":
      return { color: "warning", text: "Chờ thanh toán" };
    case "cancelled":
      return { color: "default", text: "Đã hủy" };
    case "failed":
      return { color: "error", text: "Thanh toán lỗi" };
    default:
      return { color: "default", text: status || "Không rõ" };
  }
}

function getItemName(item: OrderItem) {
  const metadata = item.metadata as Record<string, unknown> | undefined;
  return (
    item.serviceName ||
    item.name ||
    (typeof metadata?.packageName === "string" ? metadata.packageName : null) ||
    (typeof metadata?.serviceName === "string" ? metadata.serviceName : null) ||
    `Dịch vụ #${item.itemId ?? item.serviceId ?? "-"}`
  );
}

export function BookedServicesCard() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getMyOrders({ limit: 20 });
      setOrders(normalizeOrders(payload));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không tải được danh sách dịch vụ đã đặt.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <Card
      className="border-0 shadow-sm"
      title={
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-pink-500" />
          <span>Dịch vụ/gói đã đặt</span>
        </div>
      }
      extra={
        <Button size="small" icon={<RefreshCw className="h-4 w-4" />} onClick={loadOrders}>
          Tải lại
        </Button>
      }
    >
      {error ? <Alert className="mb-4" type="error" showIcon title={error} /> : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : orders.length === 0 ? (
        <Empty description="Chưa có dịch vụ hoặc gói đã đặt" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusMeta = getStatusMeta(order.status);

            return (
              <div
                key={order.id}
                className="rounded-xl border border-slate-100 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {order.code ? `Đơn ${order.code}` : `Đơn #${order.id}`}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.facilityName || "Chưa rõ cơ sở"} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
                    <span className="font-semibold text-slate-950">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {(order.orderItems ?? []).map((item, index) => (
                    <div
                      key={`${order.id}-${item.id ?? item.itemId ?? index}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 font-medium text-slate-800">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        {getItemName(item)}
                        {item.quantity ? (
                          <span className="text-slate-500">x{item.quantity}</span>
                        ) : null}
                      </span>
                      <span className="text-slate-600">
                        {formatCurrency(item.amount ?? item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

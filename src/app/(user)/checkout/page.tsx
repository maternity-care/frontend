"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Result,
  Spin,
  Typography,
  message,
} from "antd";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  QrCode,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useAuthStore } from "@/features/auth/auth.store";
import { useCartStore } from "@/features/cart/cart.store";
import { usePayment } from "@/features/payment/usePayment";
import type { CreateOrderPayload } from "@/features/payment/payment.types";

const { Title, Text, Paragraph } = Typography;

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export enum OrderItemType {
  NORMAL_SERVICE = 'normalService', // nếu mua lẻ các dịch vụ, không mua gói (thường chỉ đến khám, có thể có siêu âm, dạng dùng 1 lần)
  PACKAGE = 'package', // mua theo package
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, refreshToken } = useAuthStore();
  const isLoggedIn = Boolean(user || refreshToken);

  const { items, totalAmount, clear } = useCartStore();
  const [messageApi, contextHolder] = message.useMessage();
  const hasStartedRef = useRef(false);

  const {
    order,
    qrUrl,
    loading,
    isPaid,
    error,
    isConnected,
    startPayment,
    reset,
  } = usePayment({
    onResult: (result) => {
      if (result.status === "paid") {
        messageApi.success("Thanh toán thành công!");
        clear();
      } else {
        messageApi.error(result.message ?? "Thanh toán thất bại");
      }
    },
    onError: (err) => {
      messageApi.error(err.message);
    },
  });

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login?redirect=/checkout");
    }
  }, [isLoggedIn, router]);

  const payload = useMemo<CreateOrderPayload | null>(() => {
    if (items.length === 0) return null;

    const facilityId = items[0].facilityId;
    const sameFacility = items.every((i) => i.facilityId === facilityId);
    if (!sameFacility) return null;

    const orderItems = items.map((i) => ({
      itemId: String(i.packageId),
      itemType: "package" as const,
      // name: i.packageName,
      quantity: i.quantity,
      // unitPrice: i.price,
      // metadata: {
      //   facilityName: i.facilityName,
      //   packageCode: i.packageCode,
      //   durationDays: i.durationDays,
      // },
    }));

    const subtotalAmount = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    const discountAmount = 0;
    const total = subtotalAmount - discountAmount;

    return {
      facilityId,
      orderType: "maternity_package",
      orderItems,
      // subtotalAmount,
      // discountAmount,
      // totalAmount: total,
    };
  }, [items]);

  const handleStartPayment = useCallback(async () => {
    if (!payload) {
      messageApi.warning("Giỏ hàng trống.");
      return;
    }
    hasStartedRef.current = true;
    await startPayment(payload);
  }, [payload, startPayment, messageApi]);

  // Tự tạo đơn 1 lần khi vào trang (dùng ref, tránh setState sync trong effect)
  useEffect(() => {
    if (!isLoggedIn || !payload || isPaid || hasStartedRef.current) return;

    const timer = window.setTimeout(() => {
      void handleStartPayment();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isLoggedIn, payload, isPaid, handleStartPayment]);

  const content = (() => {
    if (!isLoggedIn) {
      return (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      );
    }

    if (items.length === 0 && !order && !isPaid) {
      return (
        <Card className="mx-auto max-w-lg !rounded-3xl !border-pink-100">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Giỏ hàng trống"
          >
            <Button
              type="primary"
              className="!bg-pink-500"
              onClick={() => router.push("/#dich-vu")}
            >
              Chọn gói thai sản
            </Button>
          </Empty>
        </Card>
      );
    }

    if (isPaid) {
      return (
        <Card className="mx-auto max-w-lg !rounded-3xl !border-pink-100 !shadow-sm">
          <Result
            status="success"
            title="Thanh toán thành công!"
            subTitle={
              order?.code
                ? `Mã đơn: ${order.code}`
                : "Cảm ơn bạn đã đăng ký gói thai sản."
            }
            extra={[
              <Button
                key="schedule"
                type="primary"
                className="!bg-pink-500"
                onClick={() => router.push("/schedule")}
              >
                Về lịch khám
              </Button>,
              <Button key="home" onClick={() => router.push("/")}>
                Về trang chủ
              </Button>,
            ]}
          />
        </Card>
      );
    }

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => {
              reset();
              hasStartedRef.current = false;
              router.push("/#dich-vu");
            }}
          >
            Quay lại
          </Button>
          <Title level={3} className="!mb-0 !text-slate-900">
            Thanh toán
          </Title>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span>Đã kết nối realtime</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-500" />
              <span>Đang kết nối...</span>
            </>
          )}
        </div>

        {error ? (
          <Alert
            type="error"
            showIcon
            title={error}
            action={
              <Button
                size="small"
                onClick={() => {
                  hasStartedRef.current = false;
                  void handleStartPayment();
                }}
              >
                Thử lại
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="!rounded-3xl !border-pink-100" title="Đơn hàng">
            {items.map((item) => (
              <div
                key={`${item.packageId}-${item.facilityId}`}
                className="mb-3 flex justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-800">
                    {item.packageName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.facilityName}
                    {item.quantity > 1 ? ` · x${item.quantity}` : ""}
                  </div>
                </div>
                <div className="shrink-0 font-semibold text-pink-600">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}

            <Divider className="!my-3" />

            <div className="flex items-center justify-between">
              <Text className="!text-slate-600">Tổng thanh toán</Text>
              <Title level={4} className="!mb-0 !text-pink-600">
                {formatPrice(totalAmount())}
              </Title>
            </div>

            {order?.code ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Mã đơn: <strong>{order.code}</strong>
              </div>
            ) : null}
          </Card>

          <Card
            className="!rounded-3xl !border-pink-100"
            title={
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-pink-500" />
                Quét mã để thanh toán
              </span>
            }
          >
            <div className="flex flex-col items-center justify-center py-4">
              {loading && !qrUrl ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Spin size="large" />
                  <Text type="secondary">Đang tạo đơn hàng...</Text>
                </div>
              ) : qrUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR thanh toán"
                    width={260}
                    height={260}
                    className="rounded-2xl border border-pink-100 bg-white p-2 shadow-sm"
                  />
                  <Paragraph className="mt-4 !mb-0 max-w-xs text-center !text-sm !text-slate-600">
                    Mở app ngân hàng / ví điện tử, quét mã QR để hoàn tất thanh
                    toán. Hệ thống sẽ tự cập nhật khi nhận được tiền.
                  </Paragraph>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang chờ thanh toán...
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Text type="secondary">Chưa có mã QR</Text>
                  <Button
                    type="primary"
                    className="!bg-pink-500"
                    onClick={() => {
                      hasStartedRef.current = false;
                      void handleStartPayment();
                    }}
                  >
                    Tạo lại đơn
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Thanh toán an toàn qua SEPay
        </div>
      </div>
    );
  })();

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-pink-50 px-4 pb-10 pt-20">{content}</div>
    </>
  );
}
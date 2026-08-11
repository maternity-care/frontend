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
  NORMAL_SERVICE = "normalService",
  PACKAGE = "package",
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
      quantity: i.quantity,
    }));

    return {
      facilityId,
      orderType: "maternity_package",
      orderItems,
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
        <div className="flex justify-center py-24">
          <Spin size="large" />
        </div>
      );
    }

    if (items.length === 0 && !order && !isPaid) {
      return (
        <Card className="mx-auto max-w-md !rounded-3xl !border-pink-100 !shadow-sm">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-slate-400">Giỏ hàng trống</span>
            }
          >
            <Button
              type="primary"
              size="large"
              className="!mt-2 !h-11 !rounded-2xl !bg-pink-500 !font-semibold"
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
                size="large"
                className="!h-11 !rounded-2xl !bg-pink-500 !font-semibold"
                onClick={() => router.push("/schedule")}
              >
                Về lịch khám
              </Button>,
              <Button
                key="home"
                size="large"
                className="!h-11 !rounded-2xl"
                onClick={() => router.push("/")}
              >
                Về trang chủ
              </Button>,
            ]}
          />
        </Card>
      );
    }

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeft className="h-4 w-4" />}
            className="!h-9 !rounded-full !bg-white !px-4 !text-slate-600 !shadow-sm !ring-1 !ring-pink-100 hover:!bg-pink-50 hover:!text-pink-600"
            onClick={() => {
              reset();
              hasStartedRef.current = false;
              router.push("/#dich-vu");
            }}
          >
            Quay lại
          </Button>
          <Title level={3} className="!mb-0 !text-[22px] !font-semibold !text-slate-900">
            Thanh toán
          </Title>
        </div>
{/* 
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600">Đã kết nối realtime</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600">Đang kết nối...</span>
            </>
          )}
        </div> */}

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            className="!rounded-2xl"
            action={
              <Button
                size="small"
                className="!rounded-lg"
                onClick={() => {
                  hasStartedRef.current = false;
                  void handleStartPayment();
                }}
              >
                Thử lại
              </Button>
            }
          />
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <Card
            className="!rounded-3xl !border-pink-100 !shadow-sm"
            styles={{ body: { padding: "20px 22px" } }}
            title={
              <span className="text-[15px] font-semibold text-slate-800">
                Đơn hàng
              </span>
            }
          >
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.packageId}-${item.facilityId}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium leading-snug text-slate-800">
                      {item.packageName}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {item.facilityName}
                      {item.quantity > 1 ? ` · x${item.quantity}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-[14px] font-semibold text-pink-600">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              <Divider className="!my-1 !border-pink-50" />

              <div className="flex items-center justify-between">
                <Text className="text-[14px] text-slate-500">Tổng thanh toán</Text>
                <Title level={4} className="!mb-0 !text-[20px] !font-bold !text-pink-600">
                  {formatPrice(totalAmount())}
                </Title>
              </div>

              {order?.code && (
                <div className="rounded-2xl bg-pink-50/80 px-4 py-2.5 text-sm text-slate-600">
                  Mã đơn:{" "}
                  <span className="font-semibold tracking-wide text-slate-800">
                    {order.code}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* QR card */}
          <Card
            className="!rounded-3xl !border-pink-100 !shadow-sm"
            styles={{ body: { padding: "20px 22px" } }}
            title={
              <span className="flex items-center gap-2 text-[15px] font-semibold text-slate-800">
                <QrCode className="h-4 w-4 text-pink-500" />
                Quét mã để thanh toán
              </span>
            }
          >
            <div className="flex flex-col items-center">
              {loading && !qrUrl ? (
                <div className="flex flex-col items-center gap-3 py-14">
                  <Spin size="large" />
                  <Text className="text-sm text-slate-400">
                    Đang tạo đơn hàng...
                  </Text>
                </div>
              ) : qrUrl ? (
                <>
                  <img
                    src={qrUrl}
                    alt="QR thanh toán"
                    width={240}
                    height={240}
                    className="rounded-2xl border border-pink-100 bg-white p-3 shadow-sm"
                  />

                  <Paragraph className="mt-5 mb-0 max-w-[280px] text-center text-[13px] leading-relaxed text-slate-500">
                    Mở app ngân hàng / ví điện tử, quét mã QR để hoàn tất thanh
                    toán. Hệ thống sẽ tự cập nhật khi nhận được tiền.
                  </Paragraph>

                  <div className="mt-4 flex items-center gap-2 rounded-full bg-pink-50 px-3.5 py-1.5 text-xs font-medium text-pink-600">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang chờ thanh toán...
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-14">
                  <Text className="text-sm text-slate-400">Chưa có mã QR</Text>
                  <Button
                    type="primary"
                    className="!h-10 !rounded-xl !bg-pink-500"
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

        <div className="flex items-center justify-center gap-2 pt-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Thanh toán an toàn qua SEPay</span>
        </div>
      </div>
    );
  })();

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-[#fff7fb] px-4 pb-12 pt-20">
        {content}
      </div>
    </>
  );
}
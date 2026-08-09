"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  ACCESS_TOKEN_KEY,
  API_BASE_URL,
  MANAGEMENT_ACCESS_TOKEN_KEY,
} from "@/lib/constants";
import { createOrder } from "./payment.api";
import { CreateOrderPayload, PaymentOrder } from "./payment.types";

export type OrderResultEvent = {
  orderId: string;
  code?: string;
  status: "paid" | "failed" | "cancelled" | string;
  message?: string;
  paidAt?: string;
  [key: string]: unknown;
};

type UsePaymentOptions = {
  management?: boolean;
  onResult?: (result: OrderResultEvent) => void;
  onConnected?: () => void;
  onError?: (error: Error) => void;
};

type UsePaymentReturn = {
  order: PaymentOrder | null;
  qrUrl: string | null;
  loading: boolean;
  isPaid: boolean;
  error: string | null;
  isConnected: boolean;
  startPayment: (payload: CreateOrderPayload) => Promise<PaymentOrder | null>;
  joinOrder: (orderId: string) => void;
  reset: () => void;
};

function getSocketUrl() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}

function getAccessToken(management: boolean) {
  if (typeof window === "undefined") return null;
  const key = management ? MANAGEMENT_ACCESS_TOKEN_KEY : ACCESS_TOKEN_KEY;
  return (
    window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
  );
}

function extractQrUrl(order: PaymentOrder): string | null {
  const o = order as Record<string, unknown>;
  const candidates = [
    o.qrUrl,
    o.paymentQrUrl,
    o.qrCodeUrl,
    o.sepayQrUrl,
    o.qr_code_url,
    (o.payment as Record<string, unknown> | undefined)?.qrUrl,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

export const PAYMENT_ORDER_KEY = "payment:current-order";

export function usePayment({
  management = false,
  onResult,
  onConnected,
  onError,
}: UsePaymentOptions = {}): UsePaymentReturn {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const onResultRef = useRef(onResult);
  const onConnectedRef = useRef(onConnected);
  const onErrorRef = useRef(onError);
  const currentOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const getSocket = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;

    if (socketRef.current) {
      socketRef.current.auth = { token: getAccessToken(management) };
      socketRef.current.connect();
      return socketRef.current;
    }

    const socket = io(`${getSocketUrl()}/realtime`, {
      transports: ["websocket", "polling"],
      auth: { token: getAccessToken(management) },
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      onConnectedRef.current?.();
      if (currentOrderIdRef.current) {
        socket.emit("order:join", { code: currentOrderIdRef.current });
      }
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("connect_error", (err) => {
      setIsConnected(false);
      onErrorRef.current?.(err);
    });

    socket.on("order:result", (payload: OrderResultEvent) => {
      if (
        currentOrderIdRef.current &&
        payload.code !== currentOrderIdRef.current
      ) {
        return;
      }

      if (payload.status === "paid") {
        setIsPaid(true);
        setLoading(false);
        setError(null);
        sessionStorage.removeItem(PAYMENT_ORDER_KEY);
      } else if (
        payload.status === "failed" ||
        payload.status === "cancelled"
      ) {
        setIsPaid(false);
        setLoading(false);
        setError(payload.message ?? "Thanh toán thất bại");
      }

      onResultRef.current?.(payload);
    });

    socketRef.current = socket;
    return socket;
  }, [management]);

  const joinOrder = useCallback(
    (code: string) => {
      currentOrderIdRef.current = code;
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("order:join", { code: code });
      }
    },
    [getSocket],
  );

  const startPayment = useCallback(
    async (payload: CreateOrderPayload) => {
      setLoading(true);
      setIsPaid(false);
      setError(null);
      setOrder(null);
      setQrUrl(null);

      try {
        const oldOrder = sessionStorage.getItem(PAYMENT_ORDER_KEY);
        if (oldOrder) {
          const parsedOrder = JSON.parse(oldOrder) as PaymentOrder;
          setOrder(parsedOrder);
          const url = extractQrUrl(parsedOrder);
          setQrUrl(url);
          if (parsedOrder.code) {
            joinOrder(parsedOrder.code);
          }
          return parsedOrder;
        }
        const newOrder = await createOrder(payload);
        sessionStorage.setItem(PAYMENT_ORDER_KEY, JSON.stringify(newOrder));
        setOrder(newOrder);

        const url = extractQrUrl(newOrder);
        setQrUrl(url);

        if (newOrder.code) {
          joinOrder(newOrder.code);
        }

        // Vẫn loading = true cho đến khi order:result (paid)
        // Nếu muốn tắt spinner sau khi có QR:
        // setLoading(false);

        return newOrder;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể tạo đơn hàng";
        setError(message);
        setLoading(false);
        onErrorRef.current?.(err instanceof Error ? err : new Error(message));
        return null;
      }
    },
    [joinOrder],
  );

  const reset = useCallback(() => {
    const socket = socketRef.current;
    if (socket && currentOrderIdRef.current) {
      socket.emit("order:leave", { orderId: currentOrderIdRef.current });
    }
    currentOrderIdRef.current = null;
    setOrder(null);
    setQrUrl(null);
    setLoading(false);
    setIsPaid(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (socket) {
        if (currentOrderIdRef.current) {
          socket.emit("order:leave", { orderId: currentOrderIdRef.current });
        }
        socket.off("order:result");
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    order,
    qrUrl,
    loading,
    isPaid,
    error,
    isConnected,
    startPayment,
    joinOrder,
    reset,
  };
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Drawer, Empty, List, Typography } from "antd";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/features/cart/cart.store";
import { useAuthStore } from "@/features/auth/auth.store";

const { Text, Title } = Typography;

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export function CartButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { items, removeItem, clear, totalAmount, totalItems } = useCartStore();
  const { user, refreshToken } = useAuthStore();
  const isLoggedIn = Boolean(user || refreshToken);
  const count = totalItems();

  const handleCheckout = () => {
    setOpen(false);
    if (!isLoggedIn) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <>
      <Badge count={count} size="small" overflowCount={99}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Giỏ hàng"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-500 transition"
        >
          <ShoppingCart className="h-[18px] w-[18px]" />
        </button>
      </Badge>

      <Drawer
        title="Giỏ hàng"
        placement="right"
        size={360}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          items.length > 0 ? (
            <Button type="link" danger size="small" onClick={clear}>
              Xóa tất cả
            </Button>
          ) : null
        }
      >
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có gói nào trong giỏ"
          />
        ) : (
          <div className="flex h-full flex-col">
            <List
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      danger
                      size="small"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() =>
                        removeItem(item.packageId, item.facilityId)
                      }
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text strong className="!text-sm">
                        {item.packageName}
                      </Text>
                    }
                    description={
                      <div className="space-y-0.5 text-xs text-slate-500">
                        {item.facilityName ? (
                          <div>{item.facilityName}</div>
                        ) : null}
                        <div>
                          {formatPrice(item.price)} × {item.quantity}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <div className="mt-auto border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <Text className="!text-slate-600">Tổng cộng</Text>
                <Title level={4} className="!mb-0 !text-pink-600">
                  {formatPrice(totalAmount())}
                </Title>
              </div>
              <Button
                type="primary"
                block
                size="large"
                className="!h-11 !rounded-xl !bg-pink-500 !font-semibold"
                onClick={handleCheckout}
              >
                {isLoggedIn ? "Thanh toán" : "Đăng nhập để thanh toán"}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

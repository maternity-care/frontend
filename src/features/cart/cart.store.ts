"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartPackageItem = {
  packageId: string;
  packageName: string;
  packageCode?: string;
  facilityId: string;
  facilityName?: string;
  price: number;
  durationDays?: number;
  quantity: number;
};

type CartState = {
  items: CartPackageItem[];
  addItem: (item: Omit<CartPackageItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (packageId: string, facilityId: string) => void;
  clear: () => void;
  totalAmount: () => number;
  totalItems: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        set((state) => {
          const exists = state.items.find(
            (i) =>
              i.packageId === item.packageId &&
              i.facilityId === item.facilityId,
          );

          if (exists) {
            return {
              items: state.items.map((i) =>
                i.packageId === item.packageId &&
                i.facilityId === item.facilityId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }

          return {
            items: [...state.items, { ...item, quantity }],
          };
        });
      },

      removeItem: (packageId, facilityId) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.packageId === packageId && i.facilityId === facilityId),
          ),
        }));
      },

      clear: () => set({ items: [] }),

      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "maternity-cart",
    },
  ),
);
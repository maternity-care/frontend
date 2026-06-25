import type { ReactNode } from "react";

type InfoIconBoxProps = {
  children: ReactNode;
  tone?: "pink" | "teal" | "rose" | "blue";
};

export function InfoIconBox({ children, tone = "pink" }: InfoIconBoxProps) {
  const toneClass = {
    pink: "bg-pink-50 text-pink-600",
    teal: "bg-teal-50 text-teal-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
  }[tone];

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
      {children}
    </div>
  );
}
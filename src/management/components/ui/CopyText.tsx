"use client";

import { App, Button, Tooltip } from "antd";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { MouseEvent } from "react";

interface CopyTextProps {
  value?: string | null;
  emptyText?: string;
  copiedMessage?: string;
  className?: string;
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function CopyText({
  value,
  emptyText = "-",
  copiedMessage = "Đã sao chép",
  className,
}: CopyTextProps) {
  const [copied, setCopied] = useState(false);
  const { message } = App.useApp();

  if (!value) {
    return <span className="text-slate-400">{emptyText}</span>;
  }

  async function handleCopy(event: MouseEvent) {
    event.stopPropagation();

    try {
      await copyToClipboard(value!);
      setCopied(true);
      message.success(copiedMessage);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      message.error("Không thể sao chép nội dung");
    }
  }

  return (
    <span className={`inline-flex min-w-0 items-center gap-1 ${className ?? ""}`}>
      <button
        type="button"
        className="min-w-0 truncate text-left text-slate-600 transition hover:text-cyan-700"
        title={value}
        onClick={handleCopy}
      >
        {value}
      </button>
      <Tooltip title={copied ? "Đã sao chép" : "Sao chép"}>
        <Button
          type="text"
          size="small"
          aria-label={`Sao chép ${value}`}
          icon={
            copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )
          }
          onClick={handleCopy}
        />
      </Tooltip>
    </span>
  );
}

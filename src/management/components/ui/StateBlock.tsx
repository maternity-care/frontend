import { AlertCircle, Inbox, Loader2 } from "lucide-react";

interface StateBlockProps {
  type: "loading" | "error" | "empty";
  title: string;
  description?: string;
}

export function StateBlock({ type, title, description }: StateBlockProps) {
  const Icon = type === "loading" ? Loader2 : type === "error" ? AlertCircle : Inbox;

  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white p-8 text-center">
      <Icon className={`h-8 w-8 text-slate-400 ${type === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

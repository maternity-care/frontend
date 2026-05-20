import { AlertCircle, Loader2 } from "lucide-react";

interface StateProps {
  type: "loading" | "error";
  title: string;
  description?: string;
}

export function State({ type, title, description }: StateProps) {
  const Icon = type === "loading" ? Loader2 : AlertCircle;

  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-teal-100">
      <Icon className={`mx-auto h-8 w-8 text-teal-600 ${type === "loading" ? "animate-spin" : ""}`} />
      <p className="mt-3 font-semibold text-slate-950">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

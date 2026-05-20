"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as LinkIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppShell } from "@/fe/components/layout/AppShell";
import { AuthGuard } from "@/fe/components/layout/AuthGuard";
import { Button } from "@/fe/components/ui/Button";
import { Input } from "@/fe/components/ui/Input";
import { Panel } from "@/fe/components/ui/Panel";
import { createUserPresignedUpload } from "@/fe/features/uploads/uploads.api";
import type { PresignedUploadResponse } from "@/fe/features/uploads/uploads.types";

const schema = z.object({
  fileName: z.string().min(1, "File name là bắt buộc"),
  mimeType: z.string().min(1, "Mime type là bắt buộc"),
  size: z.string().regex(/^[1-9]\d*$/, "Size phải là số nguyên dương"),
});

type UploadFormValues = z.infer<typeof schema>;

function UploadsContent() {
  const [result, setResult] = useState<PresignedUploadResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fileName: "pregnancy-report.pdf",
      mimeType: "application/pdf",
      size: "102400",
    },
  });

  const onSubmit = async (values: UploadFormValues) => {
    setFormError(null);
    setResult(null);
    try {
      const data = await createUserPresignedUpload({
        fileName: values.fileName,
        mimeType: values.mimeType,
        size: Number(values.size),
      });
      setResult(data);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không tạo được upload URL");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <Panel>
        <h1 className="text-2xl font-semibold text-slate-950">Tài liệu của tôi</h1>
        <p className="mt-2 text-sm text-slate-600">Tạo presigned URL bằng endpoint POST /uploads/presign.</p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="File name" error={errors.fileName?.message} {...register("fileName")} />
          <Input label="Mime type" error={errors.mimeType?.message} {...register("mimeType")} />
          <Input label="Size bytes" error={errors.size?.message} {...register("size")} />
          <div className="md:col-span-2">
            {formError ? <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
            <Button type="submit" disabled={isSubmitting}>
              <Upload className="h-4 w-4" />
              {isSubmitting ? "Đang tạo..." : "Create upload URL"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-950">Kết quả</h2>
        {result ? (
          <div className="mt-4 space-y-3 text-sm">
            <a className="inline-flex max-w-full items-center gap-2 break-all text-teal-800" href={result.publicUrl} target="_blank">
              <LinkIcon className="h-4 w-4 shrink-0" />
              {result.publicUrl}
            </a>
            <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Presigned URL sẽ hiển thị sau khi tạo thành công.</p>
        )}
      </Panel>
    </div>
  );
}

export default function UploadsPage() {
  return (
    <AppShell>
      <AuthGuard>
        <UploadsContent />
      </AuthGuard>
    </AppShell>
  );
}

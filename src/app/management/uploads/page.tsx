"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as LinkIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Button } from "@/management/components/ui/Button";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { Input } from "@/management/components/ui/Input";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { createManagementPresignedUpload } from "@/management/features/uploads/uploads.api";
import type { PresignedUploadResponse } from "@/management/features/uploads/uploads.types";

const uploadSchema = z.object({
  fileName: z.string().min(1, "File name là bắt buộc"),
  mimeType: z.string().min(1, "Mime type là bắt buộc"),
  size: z.string().regex(/^[1-9]\d*$/, "Size phải là số nguyên dương"),
  path: z.string().min(1, "Path là bắt buộc"),
  baseName: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

export default function UploadsPage() {
  const [result, setResult] = useState<PresignedUploadResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      fileName: "pregnancy-report.pdf",
      mimeType: "application/pdf",
      size: "102400",
      path: "reports",
      baseName: "report",
    },
  });

  const onSubmit = async (values: UploadForm) => {
    setFormError(null);
    setResult(null);
    try {
      const data = await createManagementPresignedUpload({
        ...values,
        size: Number(values.size),
      });
      setResult(data);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không tạo được presigned URL");
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Uploads" description="Tạo management presigned upload qua POST /management/uploads/presign." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardTitle>Create Presigned Upload</CardTitle>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Input label="File name" error={errors.fileName?.message} {...register("fileName")} />
            <Input label="Mime type" error={errors.mimeType?.message} {...register("mimeType")} />
            <Input label="Size bytes" type="number" error={errors.size?.message} {...register("size")} />
            <Input label="Path" error={errors.path?.message} {...register("path")} />
            <Input label="Base name" error={errors.baseName?.message} {...register("baseName")} />
            <div className="md:col-span-2">
              {formError ? <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div> : null}
              <Button type="submit" disabled={isSubmitting}>
                <Upload className="h-4 w-4" />
                {isSubmitting ? "Đang tạo..." : "Create URL"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>Presigned Result</CardTitle>
          {result ? (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Public URL</p>
                <a className="inline-flex max-w-full items-center gap-2 break-all text-blue-700" href={result.publicUrl} target="_blank">
                  <LinkIcon className="h-4 w-4 shrink-0" />
                  {result.publicUrl}
                </a>
              </div>
              <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Kết quả presigned URL sẽ hiển thị tại đây.</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

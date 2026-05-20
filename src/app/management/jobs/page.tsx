"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Button } from "@/management/components/ui/Button";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { Input } from "@/management/components/ui/Input";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { Textarea } from "@/management/components/ui/Textarea";
import { createTestJob } from "@/management/features/jobs/jobs.api";
import type { TestJobResponse } from "@/management/features/jobs/jobs.types";

const jobSchema = z.object({
  message: z.string().min(1, "Message là bắt buộc"),
  payload: z
    .string()
    .optional()
    .refine((value) => {
      if (!value?.trim()) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, "Payload phải là JSON hợp lệ"),
});

type JobForm = z.infer<typeof jobSchema>;

export default function JobsPage() {
  const [result, setResult] = useState<TestJobResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      message: "hello",
      payload: "{}",
    },
  });

  const onSubmit = async (values: JobForm) => {
    setFormError(null);
    setResult(null);
    try {
      const data = await createTestJob({
        message: values.message,
        payload: values.payload?.trim() ? (JSON.parse(values.payload) as Record<string, unknown>) : undefined,
      });
      setResult(data);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không tạo được job");
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Jobs" description="Tạo test queue job qua POST /management/jobs/test." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardTitle>Create Test Job</CardTitle>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input label="Message" error={errors.message?.message} {...register("message")} />
            <Textarea label="Payload JSON" error={errors.payload?.message} {...register("payload")} />
            {formError ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div> : null}
            <Button type="submit" disabled={isSubmitting}>
              <Send className="h-4 w-4" />
              {isSubmitting ? "Đang tạo..." : "Create job"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Job Result</CardTitle>
          {result ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-slate-500">Job ID</p>
                <p className="break-all font-mono text-sm font-medium text-slate-950">{result.jobId ?? result.id ?? "-"}</p>
              </div>
              <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Kết quả job sẽ hiển thị sau khi tạo thành công.</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

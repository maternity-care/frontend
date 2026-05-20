import Link from "next/link";
import { ArrowLeft, HeartPulse } from "lucide-react";
import { Button } from "@/fe/components/ui/Button";
import { Panel } from "@/fe/components/ui/Panel";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-teal-50 px-4">
      <Panel className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-800">
          <HeartPulse className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase text-teal-700">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Không tìm thấy trang</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Button>
          </Link>
        </div>
      </Panel>
    </main>
  );
}

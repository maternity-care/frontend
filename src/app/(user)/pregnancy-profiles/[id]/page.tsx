"use client";

import PregnancyProfileDetail from "@/fe/components/record-keeping/PregnancyProfileDetail";
import { useParams } from "next/navigation";
export default function PregnancyProfileDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="p-4 md:p-6">
      <PregnancyProfileDetail id={id} />
    </div>
  );
}
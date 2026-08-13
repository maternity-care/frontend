"use client";

import { Button, Typography } from "antd";
import { ExternalLink, MapPin } from "lucide-react";
import type { FacilityMapLocation } from "./facility-form.shared";

const { Text } = Typography;

type Props = {
  name: string;
  address: string;
  location: FacilityMapLocation | null;
  height?: number;
};

export function FacilityMapPreview({
  name,
  address,
  location,
  height = 300,
}: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Text strong>Vị trí trên Google Maps</Text>
        {location ? (
          <Button
            type="link"
            size="small"
            href={location.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLink className="h-4 w-4" />}
          >
            Mở Google Maps
          </Button>
        ) : null}
      </div>

      {location ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <iframe
            title={`Vị trí ${name}`}
            src={location.embedUrl}
            style={{ height }}
            className="w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={location.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-4 border-t border-slate-200 px-4 py-3 transition hover:bg-blue-50"
          >
            <div className="min-w-0">
              <p className="mb-1 truncate text-sm font-semibold text-slate-950">
                {name}
              </p>
              <p className="mb-0 break-words text-sm text-slate-600">
                {address || "Chưa cập nhật địa chỉ"}
              </p>
            </div>
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ExternalLink className="h-4 w-4" />
            </span>
          </a>
        </div>
      ) : (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <MapPin className="h-8 w-8 text-slate-300" />
          <Text strong className="mt-3 block text-slate-700">
            Chưa có vị trí trên bản đồ
          </Text>
          <Text type="secondary" className="mt-1 block">
            Bấm “Lấy vị trí hiện tại” để tự động cập nhật tọa độ.
          </Text>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, Col, Row, Select, Spin, Typography, Empty, Tag } from "antd";
import { Facility } from "@/management/features/facilities/facilities.types";
import { Doctor } from "@/management/features/doctors/public/doctor.types";
import { getPublicFacilities } from "@/management/features/facilities/facilities.api";
import {
  getCurrentDoctorLandingPage,
  getDoctorsByFacility,
} from "@/management/features/doctors/public/doctor.api";

const { Title, Paragraph} = Typography;

const FALLBACK_AVATAR =
  "https://hthaostudio.com/wp-content/uploads/2022/03/Anh-bac-si-nam-7-min.jpg.webp";

function normalizeDoctorList(payload: unknown): Doctor[] {
  if (Array.isArray(payload)) return payload as Doctor[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.data)) return obj.data as Doctor[];

    if (Array.isArray(obj.items)) return obj.items as Doctor[];

    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as Doctor[];
      if (Array.isArray(inner.items)) return inner.items as Doctor[];
    }
  }

  return [];
}

export function DoctorsTab() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null,
  );
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);


  useEffect(() => {
    let cancelled = false;

    async function loadFacilities() {
      try {
        setLoadingFacilities(true);
        const res = await getPublicFacilities({ limit: 100 });
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { items?: Facility[] })?.items)
            ? (res as { items: Facility[] }).items
            : [];

        if (!cancelled) setFacilities(items);
      } catch (error) {
        console.error("Failed to load facilities:", error);
        if (!cancelled) setFacilities([]);
      } finally {
        if (!cancelled) setLoadingFacilities(false);
      }
    }

    loadFacilities();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load doctors
  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        setLoadingDoctors(true);

        const res = selectedFacilityId
          ? await getDoctorsByFacility(selectedFacilityId)
          : await getCurrentDoctorLandingPage();

        const list = normalizeDoctorList(res);

        if (!cancelled) setDoctors(list);
      } catch (error) {
        console.error("Failed to load doctors:", error);
        if (!cancelled) setDoctors([]);
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    }

    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, [selectedFacilityId]);

  const selectedFacilityName =
    facilities.find((f) => f.id === selectedFacilityId)?.name ?? null;

  const getDoctorFacilityName = (facilityId?: string | null) => {
    if (!facilityId) return null;
    return facilities.find((f) => f.id === facilityId)?.name ?? null;
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <Title level={2} className="!mb-3 !text-slate-950">
          Đội ngũ bác sĩ
        </Title>
        <Paragraph className="mx-auto max-w-2xl !text-base !leading-7 !text-slate-600">
          Các bác sĩ giàu kinh nghiệm đồng hành cùng mẹ bầu trong suốt hành
          trình thai kỳ.
        </Paragraph>
      </div>

      <div className="flex justify-center">
        <Select
          allowClear
          showSearch
          placeholder="Chọn cơ sở để xem bác sĩ"
          className="w-full max-w-md"
          loading={loadingFacilities}
          value={selectedFacilityId}
          onChange={(value) => setSelectedFacilityId(value ?? null)}
          optionFilterProp="label"
          options={facilities.map((f) => ({
            value: f.id,
            label: f.name,
          }))}
        />
      </div>

      {loadingDoctors ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : doctors.length === 0 ? (
        <Empty description="Không tìm thấy bác sĩ nào" className="py-16" />
      ) : (
        <Row gutter={[20, 20]}>
          {doctors.map((doctor) => {
            const avatarSrc = doctor.staff?.avatar || FALLBACK_AVATAR;
            const doctorName =
              doctor.staff?.name || doctor.title || "Bác sĩ";
            const facilityName =
              selectedFacilityName ??
              getDoctorFacilityName(doctor.staff?.facilityId) ??
              "Tất cả cơ sở";

            return (
              <Col xs={24} md={12} lg={8} key={doctor.id}>
                <Card
                  className="h-full overflow-hidden !rounded-3xl !border-pink-100 transition-shadow hover:!shadow-md hover:!shadow-pink-100"
                  styles={{ body: { padding: 20 } }}
                >
                  <div className="flex gap-4">
                    {/* Avatar cố định, không vỡ */}
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-pink-50 ring-1 ring-pink-100">
                      <Image
                        src={avatarSrc}
                        alt={doctorName}
                        fill
                        sizes="112px"
                        className="object-cover object-top"
                        unoptimized={avatarSrc.startsWith("http")}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Title
                        level={4}
                        className="!mb-1 !line-clamp-2 !text-base !text-slate-950 sm:!text-lg"
                      >
                        {doctorName}
                      </Title>

                      {doctor.specialty ? (
                        <Tag color="magenta" className="!m-0 !mb-1">
                          {doctor.specialty}
                        </Tag>
                      ) : null}

                      {doctor.title ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {doctor.title}
                        </p>
                      ) : null}

                      <p className="mt-2 text-sm text-slate-500">
                        {facilityName}
                      </p>

                      {doctor.yearsOfExperience > 0 ? (
                        <p className="mt-1 text-xs font-medium text-pink-600">
                          {doctor.yearsOfExperience} năm kinh nghiệm
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {doctor.bio ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                      {doctor.bio}
                    </p>
                  ) : null}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
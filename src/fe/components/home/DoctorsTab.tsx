"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { Card, Col, Row, Select, Spin, Typography, Empty } from "antd";
import { Facility } from "@/management/features/facilities/facilities.types";
import { Doctor } from "@/management/features/doctors/public/doctor.types";
import { getPublicFacilities } from "@/management/features/facilities/facilities.api";
import {
  getCurrentDoctorLandingPage,
  getDoctorsByFacility,
} from "@/management/features/doctors/public/doctor.api";

const { Title, Paragraph, Text } = Typography;

export function DoctorsTab() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Load facilities
  useEffect(() => {
    let cancelled = false;

    async function loadFacilities() {
      try {
        setLoadingFacilities(true);
        const items = await getPublicFacilities({ limit: 100 });
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

        let list: Doctor[] = [];

        if (selectedFacilityId) {
          list = await getDoctorsByFacility(selectedFacilityId);
        } else {
          // Mặc định → GET /doctors/landing-page (cũng là list)
          list = await getCurrentDoctorLandingPage();
        }

        if (!cancelled) {
          setDoctors(Array.isArray(list) ? list : []);
        }
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
      ) : !Array.isArray(doctors) || doctors.length === 0 ? (
        <Empty description="Không tìm thấy bác sĩ nào" className="py-16" />
      ) : (
        <Row gutter={[20, 20]}>
          {doctors.map((doctor) => (
            <Col xs={24} md={8} key={doctor.id}>
              <Card className="h-full !rounded-3xl !border-pink-100 hover:!shadow-md hover:!shadow-pink-100 transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                    <UserRound className="h-7 w-7" />
                  </div>
                  <div>
                    <Title level={4} className="!mb-1 !text-slate-950">
                      {doctor.staff?.name || doctor.title}
                    </Title>
                    <Text className="!font-medium !text-pink-600">
                      {doctor.specialty}
                    </Text>
                    {doctor.title && (
                      <p className="mt-1 text-sm text-slate-500">
                        {doctor.title}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedFacilityName ?? "Tất cả cơ sở"}
                    </p>
                    {doctor.yearsOfExperience > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {doctor.yearsOfExperience} năm kinh nghiệm
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
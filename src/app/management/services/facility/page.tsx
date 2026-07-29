"use client";

import { Tabs } from "antd";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { ServicesCatalogReadonlyTab } from "@/fe/components/services/staffs_a_facility/ServicesCatalogReadonlyTab";
import { QuantityPackagesTab } from "@/fe/components/services/staffs_a_facility/QuantityPackagesTab";
import { SchedulePackagesTab } from "@/fe/components/services/staffs_a_facility/SchedulePackagesTab";


export default function FacilityPackagesPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Dịch vụ & gói của cơ sở"
        description="Xem danh mục dịch vụ hệ thống và quản lý gói thai sản theo cơ sở."
      />

      <div className="mt-6">
        <Tabs
          defaultActiveKey="services"
          destroyOnHidden
          items={[
            {
              key: "services",
              label: "Danh mục dịch vụ",
              children: <ServicesCatalogReadonlyTab />,
            },
            {
              key: "quantity",
              label: "Gói theo số lượng",
              children: <QuantityPackagesTab />,
            },
            {
              key: "schedule",
              label: "Gói theo lịch trình",
              children: <SchedulePackagesTab />,
            },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
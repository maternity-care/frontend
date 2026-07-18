"use client";

import {
  Tabs,
} from "antd";

import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";

import {
  PageHeader,
} from "@/management/components/ui/PageHeader";

import {
  ServiceCatalogTab,
} from "@/fe/components/services/ServiceCatalogTab";

import {
  FacilityServicesTab,
} from "@/fe/components/services/FacilityServicesTab";

import {
  MaternityPackagesTab,
} from "@/fe/components/services/MaternityPackagesTab";

export default function ServicesManagementPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý dịch vụ"
        description="Quản lý danh mục dịch vụ, dịch vụ tại từng cơ sở và các gói thai sản."
      />

      <div className="mt-6">
        <Tabs
          defaultActiveKey="services"
          items={[
            {
              key: "services",
              label:
                "Danh mục dịch vụ",
              children: (
                <ServiceCatalogTab />
              ),
            },
            {
              key:
                "facility-services",
              label:
                "Dịch vụ theo cơ sở",
              children: (
                <FacilityServicesTab />
              ),
            },
            {
              key:
                "maternity-packages",
              label:
                "Gói dịch vụ",
              children: (
                <MaternityPackagesTab />
              ),
            },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
"use client";

import { Tabs } from "antd";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { ServiceCatalogTab } from "@/fe/components/services/types_catalogs/ServiceCatalogTab";
import { ServiceTypesTab } from "@/fe/components/services/types_catalogs/ServiceTypesTab";
import { MaternityPackagesReadonlyTab } from "@/fe/components/services/staffs_a_facility/MaternityPackagesReadonlyTab";

export default function ServicesManagementPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý dịch vụ"
        description="Quản lý các dịch vụ lẻ và loại dịch vụ trong hệ thống."
      />

      <div className="mt-6">
        <Tabs
          defaultActiveKey="services"
          destroyOnHidden
          items={[
            {
              key: "services",
              label: "Danh mục dịch vụ",
              children: <ServiceCatalogTab />,
            },
            {
              key: "service-types",
              label: "Loại dịch vụ",
              children: <ServiceTypesTab />,
            },
            {
              key: "packages",
              label: "Gói dịch vụ",
              children: <MaternityPackagesReadonlyTab />,
            },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
"use client";

import { Tabs } from "antd";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { ServiceCatalogTab } from "@/fe/components/services/types_catalogs/ServiceCatalogTab";
import { ServiceTypesTab } from "@/fe/components/services/types_catalogs/ServiceTypesTab";

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
          ]}
        />
      </div>
    </AdminLayout>
  );
}
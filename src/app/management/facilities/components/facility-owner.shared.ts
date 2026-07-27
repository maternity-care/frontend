import {
  FACILITY_PAGE_LIMIT,
  getFacilityAdminOptions,
} from "@/management/features/facilities/facilities.api";
import type {
  FacilityAdminOption,
  FacilityAdminOptionStatus,
} from "@/management/features/facilities/facilities.types";

const MAX_OWNER_PAGES = 1000;

export type FacilityOwnerOption = {
  value: string;
  label: string;
  name: string;
  email: string;
  personalEmail?: string;
  phone: string;
  employeeCode?: string;
  homeFacilityName?: string;
  homeFacilityCode?: string;
  ownedFacilityCount?: number;
  status: FacilityAdminOptionStatus;
  disabled: boolean;
};

function toOwnerOption(
  admin: FacilityAdminOption,
): FacilityOwnerOption {
  const name =
    admin.name ||
    `Chủ cơ sở #${admin.id}`;

  const secondaryText = [
    admin.employeeCode,
    admin.email,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    value: admin.id,
    label: secondaryText
      ? `${name} (${secondaryText})`
      : name,
    name,
    email: admin.email,
    personalEmail: admin.personalEmail,
    phone: admin.phone,
    employeeCode: admin.employeeCode,
    homeFacilityName:
      admin.homeFacilityName,
    homeFacilityCode:
      admin.homeFacilityCode,
    ownedFacilityCount:
      admin.ownedFacilityCount,
    status: admin.status,
    disabled: admin.status !== "active",
  };
}

/**
 * Tải toàn bộ admin đang hoạt động từ endpoint chuyên dụng
 * của module cơ sở. availableOnly=false để modal thêm/sửa
 * có thể hiển thị đầy đủ danh sách admin.
 */
export async function getFacilityOwnerOptions(): Promise<
  FacilityOwnerOption[]
> {
  const owners: FacilityOwnerOption[] = [];
  const loadedOwnerIds = new Set<string>();

  const firstPage =
    await getFacilityAdminOptions({
      status: "active",
      availableOnly: false,
      page: 1,
      limit: FACILITY_PAGE_LIMIT,
    });

  const appendItems = (
    items: FacilityAdminOption[],
  ) => {
    for (const admin of items) {
      if (loadedOwnerIds.has(admin.id)) {
        continue;
      }

      loadedOwnerIds.add(admin.id);
      owners.push(
        toOwnerOption(admin),
      );
    }
  };

  appendItems(firstPage.items);

  if (
    firstPage.totalPages >
    MAX_OWNER_PAGES
  ) {
    throw new Error(
      "Danh sách chủ cơ sở vượt quá giới hạn tải an toàn.",
    );
  }

  for (
    let page = 2;
    page <= firstPage.totalPages;
    page += 1
  ) {
    const pageResult =
      await getFacilityAdminOptions({
        status: "active",
        availableOnly: false,
        page,
        limit: FACILITY_PAGE_LIMIT,
      });

    appendItems(pageResult.items);
  }

  return owners.sort((left, right) =>
    left.name.localeCompare(
      right.name,
      "vi",
    ),
  );
}
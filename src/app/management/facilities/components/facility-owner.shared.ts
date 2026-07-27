import { getUsersPage } from "@/management/features/users/users.api";
import type {
  AccountStatus,
  User,
} from "@/management/features/users/users.types";

const OWNER_ROLE_ID = "7";
const OWNER_PAGE_SIZE = 100;
const MAX_OWNER_PAGES = 100;

export type FacilityOwnerOption = {
  value: string;
  label: string;
  name: string;
  email: string;
  phone: string;
  status: AccountStatus;
  disabled: boolean;
};

function isOwnerAccount(user: User) {
  const roleNames = (user.roles ?? []).map((role) =>
    String(role.name ?? "")
      .trim()
      .toLowerCase(),
  );

  if (roleNames.length === 0) {
    return true;
  }

  return roleNames.some(
    (roleName) =>
      roleName === "owner" ||
      roleName === "partner",
  );
}

function toOwnerOption(
  user: User,
): FacilityOwnerOption {
  const name =
    String(user.name ?? "").trim() ||
    `Chủ cơ sở #${user.id}`;
  const email = String(user.email ?? "").trim();
  const phone = String(user.phone ?? "").trim();

  return {
    value: String(user.id),
    label: email
      ? `${name} (${email})`
      : name,
    name,
    email,
    phone,
    status: user.status,
    disabled: user.status !== "active",
  };
}

export async function getFacilityOwnerOptions(): Promise<
  FacilityOwnerOption[]
> {
  const owners: User[] = [];
  const loadedOwnerIds = new Set<string>();

  let page = 1;
  let total = 0;

  while (page <= MAX_OWNER_PAGES) {
    const result = await getUsersPage({
      roleId: OWNER_ROLE_ID,
      page,
      limit: OWNER_PAGE_SIZE,
      sort: "name:asc",
    });

    total = result.total;

    const pageOwners = result.users.filter(
      isOwnerAccount,
    );

    for (const owner of pageOwners) {
      if (loadedOwnerIds.has(owner.id)) {
        continue;
      }

      loadedOwnerIds.add(owner.id);
      owners.push(owner);
    }

    if (
      result.users.length === 0 ||
      page * OWNER_PAGE_SIZE >= total
    ) {
      break;
    }

    page += 1;
  }

  if (page > MAX_OWNER_PAGES) {
    throw new Error(
      "Danh sách chủ cơ sở vượt quá giới hạn tải an toàn.",
    );
  }

  return owners
    .map(toOwnerOption)
    .sort((left, right) => {
      if (left.disabled !== right.disabled) {
        return left.disabled ? 1 : -1;
      }

      return left.name.localeCompare(
        right.name,
        "vi",
      );
    });
}
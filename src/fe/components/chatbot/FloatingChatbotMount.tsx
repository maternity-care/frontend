"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { FloatingChatbot } from "./FloatingChatbot";

function roleName(role: string | { name?: string } | null | undefined) {
  return typeof role === "string" ? role : role?.name;
}

export function FloatingChatbotMount() {
  const pathname = usePathname();
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const isManagement = pathname?.startsWith("/management") ?? false;

  if (!isManagement) {
    return <FloatingChatbot />;
  }

  const activeFacility = user?.facilities?.find(
    (facility) => String(facility.id) === String(activeFacilityId),
  );
  const facilityRoles = activeFacility?.roles?.length
    ? activeFacility.roles
    : activeFacility?.role
      ? [activeFacility.role]
      : [];
  const effectiveRoles = new Set(
    [...roles, ...facilityRoles.map(roleName)]
      .filter((role): role is string => Boolean(role))
      .map((role) => role.toLowerCase()),
  );

  return effectiveRoles.has("doctor") ? <FloatingChatbot /> : null;
}

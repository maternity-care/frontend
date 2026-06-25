export const EMPTY_TEXT = "Chưa cập nhật";

export function displayValue(value?: string | number | null) {
  if (value === 0) return "0";
  return value ? String(value) : EMPTY_TEXT;
}

export function getInitials(name?: string | null) {
  if (!name) return "M";

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function getRoleText(
  roles?: Array<{
    name?: string | null;
  }>
) {
  return roles?.map((role) => role.name).filter(Boolean).join(", ") || "Pregnant Woman";
}
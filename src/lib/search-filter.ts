export type SearchFilterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number | boolean)[];

export type SearchFilters = Record<string, SearchFilterValue>;

export interface BuildSearchOptions {
  /**
   * Fields in this list use LIKE %value%. Other scalar fields use equality.
   */
  contains?: readonly string[];
}

export interface ParsedSearchFilter {
  field: string;
  values: string[];
  contains: boolean;
}

function encodePart(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Builds the shared search syntax understood by the backend.
 *
 * @example
 * buildSearch({
 *   name: "Nguyen",
 *   status: ["active", "pending"],
 *   "profile->city": "Ha Noi",
 *   "facility,name": "Central",
 * }, { contains: ["name", "facility,name"] })
 *
 * // name=*Nguyen|status=^active,pending|profile-%3Ecity=Ha%20Noi|facility%2Cname=*Central
 */
export function buildSearch(
  filters: SearchFilters,
  options: BuildSearchOptions = {},
): string | undefined {
  const contains = new Set(options.contains ?? []);
  const pairs: string[] = [];

  for (const [field, rawValue] of Object.entries(filters)) {
    if (!field.trim() || rawValue === null || rawValue === undefined) {
      continue;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    const normalized = values
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (normalized.length === 0) {
      continue;
    }

    const value =
      normalized.length > 1
        ? `^${normalized.map(encodePart).join(",")}`
        : `${contains.has(field) ? "*" : ""}${encodePart(normalized[0])}`;

    pairs.push(`${encodePart(field.trim())}=${value}`);
  }

  return pairs.length > 0 ? pairs.join("|") : undefined;
}

export function parseSearch(search?: string): ParsedSearchFilter[] {
  if (!search?.trim()) return [];

  return search
    .split("|")
    .map((pair): ParsedSearchFilter | null => {
      const separator = pair.indexOf("=");
      if (separator < 1) return null;

      const field = decodeURIComponent(pair.slice(0, separator)).trim();
      let rawValue = pair.slice(separator + 1);
      const isMulti = rawValue.startsWith("^");
      const contains = !isMulti && rawValue.startsWith("*");

      if (isMulti || contains) rawValue = rawValue.slice(1);

      const values = (isMulti ? rawValue.split(",") : [rawValue])
        .map((value) => decodeURIComponent(value).trim())
        .filter(Boolean);

      return field && values.length ? { field, values, contains } : null;
    })
    .filter((filter): filter is ParsedSearchFilter => filter !== null);
}

export function parseSearchValues(search?: string): SearchFilters {
  return Object.fromEntries(
    parseSearch(search).map(({ field, values }) => [
      field,
      values.length === 1 ? values[0] : values,
    ]),
  );
}

/**
 * Removes empty params and adds the serialized shared search filter.
 */
export function withSearchParams<T extends Record<string, unknown>>(
  params: T,
  filters: SearchFilters,
  options?: BuildSearchOptions,
): T & { search?: string } {
  return {
    ...Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    ),
    search: buildSearch(filters, options),
  } as T & { search?: string };
}

import { useListSections } from "@workspace/api-client-react";
import { normalizeList } from "@/lib/normalize-list";

function safeParseJson<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function useSectionJson<T>(key: string, fallback: T): T {
  const { data: sections } = useListSections();
  const sectionList = normalizeList<{ key: string; value: string }>(sections);
  const item = sectionList.find((section) => section.key === key);
  const parsed = safeParseJson<T>(item?.value);
  return parsed ?? fallback;
}


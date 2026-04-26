import { useListSections } from "@workspace/api-client-react";
import { normalizeList } from "@/lib/normalize-list";

export function useSection(key: string, fallback: string) {
  const { data: sections } = useListSections();
  const section = normalizeList<{ key: string; value: string }>(sections).find(
    (s) => s.key === key,
  );
  return section?.value || fallback;
}

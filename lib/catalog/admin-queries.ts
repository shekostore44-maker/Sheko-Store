import "server-only"

import { createClient } from "@/lib/supabase/server"

export type CategoryOption = { id: string; label: string; parentId: string | null }

/** Categories for pickers, as "Parent › Child", parents first then their children. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .order("sort_order")
    .order("created_at")
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { id: string; name: string; parent_id: string | null }[]
  return rows
    .filter((c) => !c.parent_id)
    .flatMap((parent) => [
      { id: parent.id, label: parent.name, parentId: null },
      ...rows
        .filter((c) => c.parent_id === parent.id)
        .map((child) => ({
          id: child.id,
          label: `${parent.name} › ${child.name}`,
          parentId: parent.id,
        })),
    ])
}

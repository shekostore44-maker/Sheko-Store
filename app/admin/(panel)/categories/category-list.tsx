"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CornerDownLeft, GripVertical, ImageOff, Pencil } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createContext, useContext, useState } from "react"
import { toast } from "sonner"

import { ConfirmDelete } from "@/components/admin/confirm-delete"
import { Switch } from "@/components/ui/switch"
import type { CategoryWithCount } from "@/lib/catalog/types"

import { deleteCategory, reorderCategories, setCategoryActive } from "./actions"

export function CategoryList({
  categories,
  editingId,
}: {
  categories: CategoryWithCount[]
  editingId?: string
}) {
  const [items, setItems] = useState(categories)
  const parents = items.filter((c) => !c.parent_id)
  const childrenOf = (id: string) => items.filter((c) => c.parent_id === id)

  if (items.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-2xl border border-dashed bg-white p-10 text-center">
        لسه مفيش أقسام. ابدأ بإضافة أول قسم من النموذج.
      </div>
    )
  }

  /** Reorders one sibling group locally, then saves; rolls back on failure. */
  async function reorder(group: CategoryWithCount[], event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = group.findIndex((c) => c.id === active.id)
    const to = group.findIndex((c) => c.id === over.id)
    const moved = arrayMove(group, from, to)

    const previous = items
    const order = new Map(moved.map((c, i) => [c.id, i]))
    setItems((all) =>
      all
        .map((c) => (order.has(c.id) ? { ...c, sort_order: order.get(c.id)! } : c))
        .sort((a, b) => a.sort_order - b.sort_order),
    )

    const result = await reorderCategories(moved.map((c) => c.id))
    if (!result.ok) {
      setItems(previous)
      toast.error(result.error)
    } else {
      toast.success("اتحفظ الترتيب")
    }
  }

  return (
    <div className="border-border overflow-hidden rounded-2xl border bg-white">
      <div className="bg-muted text-muted-foreground hidden grid-cols-[1fr_6rem_6rem_9rem] gap-2 px-4 py-3 text-sm font-semibold sm:grid">
        <span>القسم</span>
        <span className="text-center">المنتجات</span>
        <span className="text-center">ظاهر</span>
        <span className="text-center">إجراءات</span>
      </div>
      <SortableGroup items={parents} onReorder={reorder}>
        {(parent) => (
          <>
            <CategoryRow category={parent} editing={parent.id === editingId} />
            {childrenOf(parent.id).length > 0 && (
              <SortableGroup items={childrenOf(parent.id)} onReorder={reorder}>
                {(child) => (
                  <CategoryRow
                    category={child}
                    editing={child.id === editingId}
                    isChild
                  />
                )}
              </SortableGroup>
            )}
          </>
        )}
      </SortableGroup>
    </div>
  )
}

function SortableGroup({
  items,
  onReorder,
  children,
}: {
  items: CategoryWithCount[]
  onReorder: (group: CategoryWithCount[], event: DragEndEvent) => void
  children: (item: CategoryWithCount) => React.ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => onReorder(items, event)}
    >
      <SortableContext
        items={items.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {children(item)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } =
    useSortable({
      id,
    })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80 shadow-lg" : undefined}
    >
      <DragHandleContext value={{ attributes, listeners }}>{children}</DragHandleContext>
    </div>
  )
}

// Lets the row place the drag handle without prop-drilling dnd-kit internals.
type HandleProps = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">
const DragHandleContext = createContext<HandleProps | null>(null)

function DragHandle({ label }: { label: string }) {
  const handle = useContext(DragHandleContext)
  return (
    <button
      type="button"
      aria-label={`اسحب لترتيب ${label}`}
      className="text-muted-foreground hover:bg-accent cursor-grab touch-none rounded-md p-1 active:cursor-grabbing"
      {...handle?.attributes}
      {...handle?.listeners}
    >
      <GripVertical className="size-4" />
    </button>
  )
}

function CategoryRow({
  category,
  editing,
  isChild = false,
}: {
  category: CategoryWithCount
  editing: boolean
  isChild?: boolean
}) {
  const [active, setActive] = useState(category.is_active)

  async function toggle(next: boolean) {
    setActive(next)
    const result = await setCategoryActive(category.id, next)
    if (!result.ok) {
      setActive(!next)
      toast.error(result.error)
    } else {
      toast.success(
        next ? `«${category.name}» ظاهر في المتجر` : `«${category.name}» مخفي`,
      )
    }
  }

  return (
    <div
      className={`border-border grid grid-cols-[1fr_auto] items-center gap-2 border-t px-4 py-3 sm:grid-cols-[1fr_6rem_6rem_9rem] ${
        editing ? "bg-brand-tint/60" : isChild ? "bg-muted/40" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <DragHandle label={category.name} />
        {isChild && (
          <CornerDownLeft className="text-muted-foreground size-4 shrink-0" aria-hidden />
        )}
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#eef2f9]">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt=""
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          ) : (
            <ImageOff className="text-muted-foreground absolute inset-0 m-auto size-5" />
          )}
        </div>
        <div className="min-w-0">
          <p className={`text-brand-navy truncate ${isChild ? "" : "font-bold"}`}>
            {category.name}
            {!active && (
              <span className="bg-muted text-muted-foreground ms-2 rounded-full px-2 py-0.5 text-xs font-normal">
                مخفي
              </span>
            )}
          </p>
          <p dir="ltr" className="text-muted-foreground truncate text-end text-xs">
            /c/{decodeURIComponent(category.slug)}
          </p>
        </div>
      </div>

      <p className="text-brand-navy hidden text-center sm:block">
        {category.product_count}
      </p>

      <div className="hidden justify-center sm:flex">
        <Switch
          checked={active}
          onCheckedChange={toggle}
          aria-label={`إظهار ${category.name}`}
        />
      </div>

      <div className="flex items-center justify-end gap-1 sm:justify-center">
        <Link
          href={`/admin/categories?edit=${category.id}`}
          scroll={false}
          className="text-brand-blue hover:bg-brand-tint inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium"
        >
          <Pencil className="size-4" aria-hidden />
          <span className="hidden sm:inline">تعديل</span>
        </Link>
        <ConfirmDelete
          title={`حذف «${category.name}»؟`}
          description="الحذف نهائي. القسم لازم يكون فاضي من المنتجات والأقسام الفرعية."
          onConfirm={async () => {
            const result = await deleteCategory(category.id)
            if (!result.ok) toast.error(result.error)
            else toast.success("اتحذف القسم")
            return result.ok
          }}
        />
      </div>
    </div>
  )
}

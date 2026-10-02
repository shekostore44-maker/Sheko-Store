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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { imageFileError, uploadImage } from "@/lib/storage/upload"

export type ManagedImage = {
  key: string
  url: string
  alt: string
  /** Local preview while the file uploads. */
  preview?: string
  uploading?: boolean
}

const MAX_IMAGES = 12

/** Multi-image uploader with drag-to-reorder. The first image is the main one. */
export function ImageManager({
  images,
  onChange,
  defaultAlt,
}: {
  images: ManagedImage[]
  onChange: (update: (images: ManagedImage[]) => ManagedImage[]) => void
  defaultAlt: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    const room = MAX_IMAGES - images.length
    if (files.length > room) toast.error(`الحد الأقصى ${MAX_IMAGES} صورة للمنتج`)

    for (const file of files.slice(0, Math.max(0, room))) {
      const problem = imageFileError(file)
      if (problem) {
        toast.error(problem)
        continue
      }
      const key = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      onChange((list) => [...list, { key, url: "", alt: "", preview, uploading: true }])

      uploadImage(file, "products")
        .then((url) =>
          onChange((list) =>
            list.map((img) =>
              img.key === key ? { ...img, url, uploading: false } : img,
            ),
          ),
        )
        .catch((error: Error) => {
          toast.error(error.message)
          onChange((list) => list.filter((img) => img.key !== key))
        })
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    onChange((list) => {
      const from = list.findIndex((i) => i.key === active.id)
      const to = list.findIndex((i) => i.key === over.id)
      return arrayMove(list, from, to)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={images.map((i) => i.key)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image, index) => (
              <SortableImage
                key={image.key}
                image={image}
                isMain={index === 0}
                defaultAlt={defaultAlt}
                onAltChange={(alt) =>
                  onChange((list) =>
                    list.map((i) => (i.key === image.key ? { ...i, alt } : i)),
                  )
                }
                onRemove={() =>
                  onChange((list) => list.filter((i) => i.key !== image.key))
                }
              />
            ))}
            {images.length < MAX_IMAGES && (
              <li>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    addFiles(e.dataTransfer.files)
                  }}
                  className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center text-sm transition ${
                    dragOver
                      ? "border-brand-blue bg-brand-tint"
                      : "border-brand-blue/40 bg-brand-tint/40 hover:bg-brand-tint"
                  }`}
                >
                  <ImagePlus className="text-brand-blue size-7" aria-hidden />
                  <span className="text-brand-navy-soft px-2">
                    اسحب الصور هنا أو اضغط
                  </span>
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="text-muted-foreground text-xs">
        حتى {MAX_IMAGES} صورة، JPG أو PNG أو WebP، حتى 5 ميجا للصورة. اسحب الصور لترتيبها،
        والأولى هي الصورة الرئيسية.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

function SortableImage({
  image,
  isMain,
  defaultAlt,
  onAltChange,
  onRemove,
}: {
  image: ManagedImage
  isMain: boolean
  defaultAlt: string
  onAltChange: (alt: string) => void
  onRemove: () => void
}) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } =
    useSortable({
      id: image.key,
    })
  const src = image.url || image.preview

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-1.5 ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-xl bg-[#eef2f9] ${isMain ? "ring-brand-blue ring-2" : "border-border border"}`}
      >
        {src && (
          <Image
            src={src}
            alt=""
            fill
            sizes="200px"
            unoptimized={!image.url}
            className="object-contain p-2"
          />
        )}
        {image.uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2
              className="text-brand-blue size-7 animate-spin"
              aria-label="جاري الرفع"
            />
          </div>
        )}
        {isMain && (
          <span className="bg-brand-navy absolute right-0 bottom-0 left-0 py-0.5 text-center text-xs text-white">
            الرئيسية
          </span>
        )}
        <button
          type="button"
          aria-label="اسحب لترتيب الصورة"
          className="absolute top-1.5 right-1.5 cursor-grab touch-none rounded-md bg-white/90 p-1 shadow active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="text-brand-navy size-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="حذف الصورة"
          className="bg-brand-navy/80 hover:bg-brand-navy absolute top-1.5 left-1.5 rounded-full p-1 text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <input
        value={image.alt}
        onChange={(e) => onAltChange(e.target.value)}
        placeholder={defaultAlt || "وصف الصورة"}
        aria-label="وصف الصورة لجوجل (alt)"
        maxLength={150}
        className="border-input focus-visible:border-ring h-8 rounded-md border px-2 text-xs outline-none"
      />
    </li>
  )
}

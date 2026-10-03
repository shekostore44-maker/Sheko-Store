"use client"

import { ImageOff } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string }[]
  name: string
}) {
  const [index, setIndex] = useState(0)
  const current = images[index]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#e3eaf7_72%)]">
        {current ? (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-in fade-in object-contain p-6 duration-300"
          />
        ) : (
          <ImageOff
            className="text-muted-foreground absolute inset-0 m-auto size-10"
            aria-hidden
          />
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="صور المنتج">
          {images.map((image, i) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`عرض الصورة ${i + 1}`}
                aria-current={i === index}
                className={`relative block aspect-square w-full overflow-hidden rounded-xl bg-[#eef2f9] transition ${
                  i === index ? "ring-brand-navy ring-2" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

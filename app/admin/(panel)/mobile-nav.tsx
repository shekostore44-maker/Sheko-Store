"use client"

import { Menu } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { AdminNav } from "./admin-nav"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="القائمة"
        className="text-brand-navy hover:bg-accent rounded-lg p-2 lg:hidden"
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-sidebar text-sidebar-foreground w-72 border-0 p-4"
      >
        <div className="mb-6 flex items-center gap-3 px-2">
          <Image src="/brand/sheko-icon-512.png" alt="" width={40} height={40} />
          <SheetTitle className="font-heading text-brand-ice text-xl font-bold">
            Sheko
          </SheetTitle>
        </div>
        <AdminNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

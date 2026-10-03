import { AnnouncementBar } from "@/components/store/announcement-bar"
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader } from "@/components/store/site-header"
import { Toaster } from "@/components/ui/sonner"
import { getNavCategories } from "@/lib/catalog/store-queries"

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const categories = await getNavCategories()

  return (
    <>
      <AnnouncementBar />
      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={categories} />
      <MobileBottomNav />
      <Toaster position="top-center" richColors dir="rtl" />
    </>
  )
}

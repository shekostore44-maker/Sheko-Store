import { AnnouncementBar } from "@/components/store/announcement-bar"
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader } from "@/components/store/site-header"

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <MobileBottomNav />
    </>
  )
}

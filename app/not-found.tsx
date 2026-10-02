import Image from "next/image"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_30%,#1b3a7a_0%,#0e1a36_70%)] px-6 py-24 text-center">
      <Image src="/brand/sheko-icon-512.png" alt="" width={140} height={140} />
      <p className="font-heading text-brand-cyan text-8xl font-extrabold">404</p>
      <h1 className="text-brand-ice text-2xl font-bold">هذه الصفحة غير موجودة</h1>
      <p className="text-[#b9c6e4]">ربما تم نقلها أو حذفها</p>
      <Link
        href="/"
        className="bg-brand-ice text-brand-navy mt-2 rounded-xl px-8 py-3 font-bold transition hover:bg-white"
      >
        العودة للرئيسية
      </Link>
    </main>
  )
}

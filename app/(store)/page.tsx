import { CategoryGrid } from "@/components/store/home/category-grid"
import { Hero } from "@/components/store/home/hero"
import { TrustBar } from "@/components/store/home/trust-bar"

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <CategoryGrid />
    </>
  )
}

import { ClosingCta } from '../../components/landing/closing_cta'
import { Hero } from '../../components/landing/hero'
import { Highlights } from '../../components/landing/highlights'
import { ProductPreview } from '../../components/landing/product_preview'
import { LandingFooter } from '../../components/footer/landing_footer'
import { LandingNavbar } from '../../components/navbar/landing_navbar'
import { PageFade } from '../../components/motion/page_fade'

export function Landing() {
  return (
    <div className="flex min-h-svh flex-col bg-[#09090B] text-[#F4F4F5]">
      <LandingNavbar />
      <PageFade className="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col">
          <Hero />
          <ProductPreview />
          <Highlights />
          <ClosingCta />
        </main>
      </PageFade>
      <LandingFooter />
    </div>
  )
}

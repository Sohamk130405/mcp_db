import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import {
  Features,
  HowItWorks,
  DatabaseLogos,
  Pricing,
  Testimonials,
  FAQ,
  CTA,
  Footer,
} from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <DatabaseLogos />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

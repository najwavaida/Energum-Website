import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { HeroSection } from "@/components/sections/HeroSection";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { ProductPreviewSection } from "@/components/sections/ProductPreviewSection";
import { CTASection } from "@/components/sections/CTASection";

const Index = () => {
  return (
    <Layout>
      <PageTransition>
        <HeroSection />
        <BenefitsSection />
        <ProductPreviewSection />
        <CTASection />
      </PageTransition>
    </Layout>
  );
};

export default Index;

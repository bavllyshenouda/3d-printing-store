import React from "react";
import {
  HeroSection,
  FeaturedProducts,
  CategoryGrid,
  CustomPrintFeature,
  HowItWorks,
  WhyChooseUs,
  FinalCta,
} from "@/components/home";
import { getFeaturedProducts, getCategories } from "@/lib/data/homepage";

export const revalidate = 60; // Incremental Static Regeneration every 60 seconds

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Featured Products */}
      <FeaturedProducts products={featuredProducts} />

      {/* 3. Shop by Category */}
      <CategoryGrid categories={categories} />

      {/* 4. Custom 3D Printing Feature */}
      <CustomPrintFeature />

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Why Choose Us */}
      <WhyChooseUs />

      {/* 7. Final Call to Action */}
      <FinalCta />
    </div>
  );
}

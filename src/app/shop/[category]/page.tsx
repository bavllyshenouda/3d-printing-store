import { Metadata } from "next";
import { getCatalogCategories } from "@/lib/data/catalog";
import ShopPage from "../page";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    min_price?: string;
    max_price?: string;
    material?: string;
    search?: string;
    sort?: string;
    in_stock?: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await getCatalogCategories();
  const matched = categories.find((c) => c.slug === category);

  const title = matched
    ? `${matched.name} | PrintStudio Catalog`
    : "3D Printed Models Catalog | PrintStudio";

  return {
    title,
    description: matched?.description || "Browse precision 3D-printed parts and models.",
  };
}

export default async function CategoryShopPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;

  // Forward category param into the shop page
  const mergedSearchParams = Promise.resolve({
    ...resolvedSearchParams,
    category,
  });

  return <ShopPage searchParams={mergedSearchParams} />;
}


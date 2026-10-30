import { Metadata } from "next";
import { getCatalogData, getCatalogCategories, STANDARD_MATERIALS } from "@/lib/data/catalog";
import { CatalogContainer } from "@/components/catalog/catalog-container";
import { SortOption } from "@/components/catalog/catalog-sort";

export const metadata: Metadata = {
  title: "Shop 3D Models & Engineered Parts | PrintStudio",
  description:
    "Explore our verified catalog of precision-calibrated 3D-printed mechanical components, electronics enclosures, studio desk gear, and drone accessories.",
};

interface ShopPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    material?: string;
    search?: string;
    sort?: string;
    in_stock?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;

  const page = resolvedParams.page ? Math.max(1, parseInt(resolvedParams.page, 10)) : 1;
  const limit = resolvedParams.limit ? Math.max(1, parseInt(resolvedParams.limit, 10)) : 12;
  const category = resolvedParams.category || undefined;
  const minPrice = resolvedParams.min_price ? parseFloat(resolvedParams.min_price) : undefined;
  const maxPrice = resolvedParams.max_price ? parseFloat(resolvedParams.max_price) : undefined;
  const material = resolvedParams.material || undefined;
  const search = resolvedParams.search || "";
  const sort = (resolvedParams.sort as SortOption) || "newest";
  const inStockOnly = resolvedParams.in_stock === "true";

  // Pre-fetch SSR catalog data
  const catalogResult = await getCatalogData({
    page,
    limit,
    category,
    min_price: minPrice,
    max_price: maxPrice,
    material,
    search,
    sort,
    in_stock_only: inStockOnly,
  });

  return (
    <CatalogContainer
      initialProducts={catalogResult.products}
      categories={catalogResult.categories}
      materials={catalogResult.availableMaterials || STANDARD_MATERIALS}
      initialPagination={catalogResult.pagination}
      initialFilters={{
        category,
        min_price: minPrice,
        max_price: maxPrice,
        material,
        in_stock_only: inStockOnly || undefined,
      }}
      initialSearch={search}
      initialSort={sort}
    />
  );
}


import { Metadata } from "next";
import { RequestDetailsView } from "@/components/custom-prints/request-details-view";

export const metadata: Metadata = {
  title: "Custom Print Request & Quotes | PrintStudio",
  description:
    "Review engineering quotes, inspect attached 3D models, and accept production orders.",
};

interface RequestDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomPrintRequestPage({
  params,
}: RequestDetailsPageProps) {
  const { id } = await params;
  return <RequestDetailsView requestId={id} />;
}


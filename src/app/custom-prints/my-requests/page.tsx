import { Metadata } from "next";
import { RequestsDashboard } from "@/components/custom-prints/requests-dashboard";

export const metadata: Metadata = {
  title: "My Custom Print Requests | PrintStudio",
  description:
    "Track your custom 3D printing projects, review engineering quotes, and accept production orders.",
};

export default function MyRequestsPage() {
  return <RequestsDashboard />;
}


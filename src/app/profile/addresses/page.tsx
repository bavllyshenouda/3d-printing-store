import { Metadata } from "next";
import { AddressesView } from "@/components/addresses/addresses-view";

export const metadata: Metadata = {
  title: "Saved Delivery Addresses | PrintStudio",
  description: "Manage your saved shipping addresses for fast and reliable 3D printing deliveries.",
};

export default function AddressesPage() {
  return <AddressesView />;
}


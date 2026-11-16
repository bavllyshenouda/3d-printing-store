import { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "My Profile | Trio",
  description:
    "View and update your Trio customer profile, phone number, and contact details.",
};

export default function ProfilePage() {
  return <ProfileView />;
}


import { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Studio Account | PrintStudio 3D",
  description:
    "Join Egypt's precision additive manufacturing platform for on-demand 3D printing, custom slicing, and rapid delivery.",
};

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      titleKey="auth.registerTitle"
      subtitleKey="auth.registerSubtitle"
    >
      <RegisterForm />
    </AuthSplitLayout>
  );
}


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
      title="Create Account"
      subtitle="Join Egypt's precision 3D printing studio. Access instant slicing quotes, multi-material FDM, and fast delivery."
    >
      <RegisterForm />
    </AuthSplitLayout>
  );
}


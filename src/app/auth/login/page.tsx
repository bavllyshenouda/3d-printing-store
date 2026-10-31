import { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In | PrintStudio 3D",
  description:
    "Sign in to your PrintStudio account to manage your 3D prints, custom CAD quotes, and orders.",
};

export default function LoginPage() {
  return (
    <AuthSplitLayout
      titleKey="auth.loginTitle"
      subtitleKey="auth.loginSubtitle"
    >
      <LoginForm />
    </AuthSplitLayout>
  );
}


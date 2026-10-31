import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { RequestForm } from "@/components/custom-prints/request-form";

export const metadata: Metadata = {
  title: "New Custom 3D Print Request | PrintStudio",
  description:
    "Upload your STL/3MF files and specify materials, infill, and mechanical requirements.",
};

export default function NewCustomPrintPage() {
  return (
    <div className="py-8 sm:py-12 bg-background min-h-[85vh]">
      <Container size="default">
        <div className="mb-8 text-start">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Custom 3D Print Request
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your STL or 3MF design files along with mechanical requirements for an instant engineering review.
          </p>
        </div>

        <RequestForm />
      </Container>
    </div>
  );
}

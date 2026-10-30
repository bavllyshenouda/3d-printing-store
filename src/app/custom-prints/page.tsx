import { Metadata } from "next";
import { LandingView } from "@/components/custom-prints/landing-view";

export const metadata: Metadata = {
  title: "Custom 3D Printing & Slicing Service | PrintStudio",
  description:
    "Upload your STL, 3MF, or CAD designs. Fast engineering review, automated slicing, industrial filaments, and delivery across Egypt.",
};

export default function CustomPrintLandingPage() {
  return <LandingView />;
}


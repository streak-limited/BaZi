"use client";

import IntroStep from "@/app/bazi/intro/IntroStep";
import { useRouter } from "next/navigation";

export default function BaziIntroPage() {
  const router = useRouter();
  return <IntroStep onContinue={() => router.push("/bazi/input")} />;
}
